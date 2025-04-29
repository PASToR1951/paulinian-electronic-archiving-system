import { client } from "../db/denopost_conn.ts";

/**
 * Role model representing the role data from the database
 */
export interface Role {
  id: number;
  role_name: string;
}

export class RoleModel {
  /**
   * Get all roles from the database
   * @returns Array of roles
   */
  static async getAll(): Promise<Role[]> {
    try {
      const result = await client.queryObject<Role>("SELECT * FROM roles ORDER BY id");
      return result.rows;
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
  }

  /**
   * Get a role by its ID
   * @param id Role ID
   * @returns Role object or null if not found
   */
  static async getById(id: number): Promise<Role | null> {
    try {
      const result = await client.queryObject<Role>(
        "SELECT * FROM roles WHERE id = $1",
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching role:", error);
      return null;
    }
  }

  /**
   * Get a role by its name
   * @param name Role name
   * @returns Role object or null if not found
   */
  static async getByName(name: string): Promise<Role | null> {
    try {
      const result = await client.queryObject<Role>(
        "SELECT * FROM roles WHERE LOWER(role_name) = LOWER($1)",
        [name]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching role by name:", error);
      return null;
    }
  }

  /**
   * Create a new role
   * @param roleName Role name
   * @returns Created role or null if creation failed
   */
  static async create(roleName: string): Promise<Role | null> {
    try {
      const result = await client.queryObject<Role>(
        "INSERT INTO roles (role_name) VALUES ($1) RETURNING *",
        [roleName]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error creating role:", error);
      return null;
    }
  }

  /**
   * Update a role
   * @param id Role ID
   * @param roleName New role name
   * @returns Updated role or null if update failed
   */
  static async update(id: number, roleName: string): Promise<Role | null> {
    try {
      const result = await client.queryObject<Role>(
        "UPDATE roles SET role_name = $1 WHERE id = $2 RETURNING *",
        [roleName, id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating role:", error);
      return null;
    }
  }

  /**
   * Delete a role
   * @param id Role ID
   * @returns True if successful, false otherwise
   */
  static async delete(id: number): Promise<boolean> {
    try {
      const result = await client.queryArray(
        "DELETE FROM roles WHERE id = $1",
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting role:", error);
      return false;
    }
  }

  /**
   * Get users with a specific role
   * @param roleId Role ID
   * @returns Array of user IDs with the specified role
   */
  static async getUsersWithRole(roleId: number): Promise<string[]> {
    try {
      const result = await client.queryArray<[string]>(
        "SELECT id FROM users WHERE role_id = $1",
        [roleId]
      );
      
      return result.rows.map(row => row[0]);
    } catch (error) {
      console.error("Error fetching users with role:", error);
      return [];
    }
  }
}
