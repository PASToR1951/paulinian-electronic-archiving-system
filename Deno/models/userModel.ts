import { client } from "../db/denopost_conn.ts";

/**
 * User model representing user data from the database
 */
export interface User {
  id: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  department_id?: number;
  role_id?: number;
  created_at?: Date;
  last_login?: Date;
}

/**
 * Credential interface for user authentication
 */
export interface Credential {
  id: number;
  user_id: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  /**
   * Get a user by their ID
   * @param id User ID
   * @returns User object or null if not found
   */
  static async getById(id: string): Promise<User | null> {
    try {
      const result = await client.queryObject<User>(
        "SELECT * FROM users WHERE id = $1",
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }

  /**
   * Get a user with their role information
   * @param id User ID
   * @returns User object with role information or null if not found
   */
  static async getWithRole(id: string): Promise<any | null> {
    try {
      const result = await client.queryObject(
        `SELECT u.*, r.role_name 
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`,
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching user with role:", error);
      return null;
    }
  }

  /**
   * Create a new user
   * @param user User data
   * @returns Created user or null if creation failed
   */
  static async create(user: User): Promise<User | null> {
    try {
      const result = await client.queryObject<User>(
        `INSERT INTO users (id, first_name, middle_name, last_name, email, department_id, role_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          user.id,
          user.first_name || null,
          user.middle_name || null,
          user.last_name || null,
          user.email || null,
          user.department_id || null,
          user.role_id || null
        ]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error creating user:", error);
      return null;
    }
  }

  /**
   * Update a user
   * @param id User ID
   * @param updates Fields to update
   * @returns Updated user or null if update failed
   */
  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      // Build SET clause and values dynamically based on provided updates
      const setValues: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined) { // Skip id and undefined values
          setValues.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });
      
      if (setValues.length === 0) {
        return await this.getById(id); // Nothing to update
      }
      
      values.push(id); // Add id as the last parameter
      
      const result = await client.queryObject<User>(
        `UPDATE users
         SET ${setValues.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating user:", error);
      return null;
    }
  }

  /**
   * Update a user's last login timestamp
   * @param id User ID
   * @returns Success status
   */
  static async updateLastLogin(id: string): Promise<boolean> {
    try {
      await client.queryArray(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
      );
      return true;
    } catch (error) {
      console.error("Error updating last login:", error);
      return false;
    }
  }
  
  /**
   * Get a user's credential for authentication
   * @param userId User ID
   * @returns Credential object or null if not found
   */
  static async getCredential(userId: string): Promise<Credential | null> {
    try {
      const result = await client.queryObject<Credential>(
        "SELECT * FROM credentials WHERE user_id = $1",
        [userId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching credential:", error);
      return null;
    }
  }
}
