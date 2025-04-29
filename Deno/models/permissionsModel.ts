import { client } from "../db/denopost_conn.ts";

/**
 * Permission interface representing document permissions data from the database
 */
export interface DocumentPermission {
  id: number;
  document_id: number;
  user_id?: string;
  role_id?: number;
  can_view: boolean;
  can_download: boolean;
  can_manage: boolean;
  granted_at?: Date;
  granted_by?: string;
}

export class PermissionsModel {
  /**
   * Get all permissions for a document
   * @param documentId Document ID
   * @returns Array of permissions
   */
  static async getByDocument(documentId: number): Promise<DocumentPermission[]> {
    try {
      const result = await client.queryObject<DocumentPermission>(
        "SELECT * FROM document_permissions WHERE document_id = $1",
        [documentId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching document permissions:", error);
      return [];
    }
  }

  /**
   * Get permissions for a specific user on a document
   * @param documentId Document ID
   * @param userId User ID
   * @returns Permission object or null if not found
   */
  static async getUserPermission(documentId: number, userId: string): Promise<DocumentPermission | null> {
    try {
      const result = await client.queryObject<DocumentPermission>(
        "SELECT * FROM document_permissions WHERE document_id = $1 AND user_id = $2",
        [documentId, userId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching user permission:", error);
      return null;
    }
  }

  /**
   * Get permissions for a specific role on a document
   * @param documentId Document ID
   * @param roleId Role ID
   * @returns Permission object or null if not found
   */
  static async getRolePermission(documentId: number, roleId: number): Promise<DocumentPermission | null> {
    try {
      const result = await client.queryObject<DocumentPermission>(
        "SELECT * FROM document_permissions WHERE document_id = $1 AND role_id = $2",
        [documentId, roleId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching role permission:", error);
      return null;
    }
  }

  /**
   * Check if a user has specific permissions on a document
   * @param documentId Document ID
   * @param userId User ID
   * @param roleId User's role ID
   * @param permissionType The type of permission to check (view, download, manage)
   * @returns True if the user has the specified permission, false otherwise
   */
  static async checkPermission(
    documentId: number, 
    userId: string, 
    roleId: number | null,
    permissionType: 'can_view' | 'can_download' | 'can_manage'
  ): Promise<boolean> {
    try {
      // First check if the document is public
      if (permissionType === 'can_view') {
        const documentResult = await client.queryObject(
          "SELECT is_public FROM documents WHERE id = $1 AND deleted_at IS NULL",
          [documentId]
        );
        
        if (documentResult.rows.length > 0 && documentResult.rows[0].is_public) {
          return true; // Public documents can be viewed by anyone
        }
      }
      
      // Check user-specific permissions
      const userPermission = await this.getUserPermission(documentId, userId);
      if (userPermission && userPermission[permissionType]) {
        return true;
      }
      
      // Check role-based permissions if a role is provided
      if (roleId !== null) {
        const rolePermission = await this.getRolePermission(documentId, roleId);
        if (rolePermission && rolePermission[permissionType]) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  /**
   * Grant permissions to a user for a document
   * @param permission Permission data
   * @returns Created permission or null if creation failed
   */
  static async grantUserPermission(
    documentId: number,
    userId: string,
    grantedBy: string,
    canView = false,
    canDownload = false,
    canManage = false
  ): Promise<DocumentPermission | null> {
    try {
      // Check if permission already exists
      const existingPermission = await this.getUserPermission(documentId, userId);
      
      if (existingPermission) {
        // Update existing permission
        return await this.updatePermission(
          existingPermission.id, 
          { can_view: canView, can_download: canDownload, can_manage: canManage }
        );
      }
      
      // Create new permission
      const result = await client.queryObject<DocumentPermission>(
        `INSERT INTO document_permissions (
          document_id, user_id, can_view, can_download, can_manage, granted_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [documentId, userId, canView, canDownload, canManage, grantedBy]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error granting user permission:", error);
      return null;
    }
  }

  /**
   * Grant permissions to a role for a document
   * @param permission Permission data
   * @returns Created permission or null if creation failed
   */
  static async grantRolePermission(
    documentId: number,
    roleId: number,
    grantedBy: string,
    canView = false,
    canDownload = false,
    canManage = false
  ): Promise<DocumentPermission | null> {
    try {
      // Check if permission already exists
      const existingPermission = await this.getRolePermission(documentId, roleId);
      
      if (existingPermission) {
        // Update existing permission
        return await this.updatePermission(
          existingPermission.id, 
          { can_view: canView, can_download: canDownload, can_manage: canManage }
        );
      }
      
      // Create new permission
      const result = await client.queryObject<DocumentPermission>(
        `INSERT INTO document_permissions (
          document_id, role_id, can_view, can_download, can_manage, granted_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [documentId, roleId, canView, canDownload, canManage, grantedBy]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error granting role permission:", error);
      return null;
    }
  }

  /**
   * Update an existing permission
   * @param id Permission ID
   * @param updates Fields to update
   * @returns Updated permission or null if update failed
   */
  static async updatePermission(id: number, updates: Partial<DocumentPermission>): Promise<DocumentPermission | null> {
    try {
      // Build SET clause and values dynamically based on provided updates
      const setValues: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'document_id' && key !== 'user_id' && key !== 'role_id' && key !== 'granted_at' && key !== 'granted_by' && value !== undefined) {
          setValues.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });
      
      if (setValues.length === 0) {
        return null; // Nothing to update
      }
      
      values.push(id); // Add id as the last parameter
      
      const result = await client.queryObject<DocumentPermission>(
        `UPDATE document_permissions
         SET ${setValues.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating permission:", error);
      return null;
    }
  }

  /**
   * Revoke a permission
   * @param id Permission ID
   * @returns True if successful, false otherwise
   */
  static async revokePermission(id: number): Promise<boolean> {
    try {
      const result = await client.queryArray(
        "DELETE FROM document_permissions WHERE id = $1",
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error revoking permission:", error);
      return false;
    }
  }

  /**
   * Get all documents a user has access to
   * @param userId User ID
   * @param roleId User's role ID
   * @param permissionType The type of permission to check
   * @returns Array of document IDs
   */
  static async getAccessibleDocuments(
    userId: string,
    roleId: number | null,
    permissionType: 'can_view' | 'can_download' | 'can_manage' = 'can_view'
  ): Promise<number[]> {
    try {
      const documentIds: number[] = [];
      
      // Get public documents (if looking for view permission)
      if (permissionType === 'can_view') {
        const publicDocsResult = await client.queryArray<[number]>(
          "SELECT id FROM documents WHERE is_public = true AND deleted_at IS NULL"
        );
        documentIds.push(...publicDocsResult.rows.map(row => row[0]));
      }
      
      // Get documents with user-specific permissions
      const userPermissionsResult = await client.queryArray<[number]>(
        `SELECT document_id FROM document_permissions 
         WHERE user_id = $1 AND ${permissionType} = true`,
        [userId]
      );
      documentIds.push(...userPermissionsResult.rows.map(row => row[0]));
      
      // Get documents with role-based permissions
      if (roleId !== null) {
        const rolePermissionsResult = await client.queryArray<[number]>(
          `SELECT document_id FROM document_permissions 
           WHERE role_id = $1 AND ${permissionType} = true`,
          [roleId]
        );
        documentIds.push(...rolePermissionsResult.rows.map(row => row[0]));
      }
      
      // Remove duplicates and return
      return [...new Set(documentIds)];
    } catch (error) {
      console.error("Error fetching accessible documents:", error);
      return [];
    }
  }
}
