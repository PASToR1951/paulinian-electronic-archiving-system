/**
 * Session Service
 * Handles token generation and validation for user authentication.
 */

import { client } from "../db/denopost_conn.ts";

/**
 * Creates a session token for the user
 * @param userID - The user's ID
 * @param userRole - The user's role (admin, staff, student, etc.)
 * @returns A unique session token
 */
export async function createSessionToken(userID: string, userRole: string): Promise<string> {
  console.log(`Creating token for user ${userID} with role ${userRole}`);
  
  try {
    // Generate a UUID for the token
    const token = crypto.randomUUID();
    
    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save the token to the database
    try {
      await client.queryObject(
        `INSERT INTO sessions (user_id, token, expires_at) 
         VALUES ($1, $2, $3)`,
        [userID, token, expiresAt]
    );
      console.log(`Token saved to database: ${token.substring(0, 8)}...`);
    } catch (dbError) {
      console.error("Database error when saving token:", dbError);
      console.log("Continuing without saving token to database");
    }
    
    return token;
  } catch (error) {
    console.error("Error creating session token:", error);
    throw error;
  }
}

/**
 * Validates a session token
 * @param token - The token to validate
 * @returns The user ID if valid, null otherwise
 */
export async function validateSessionToken(token: string | null): Promise<string | null> {
  if (!token) return null;
  
  try {
    const result = await client.queryObject(
      `SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].user_id;
  } catch (error) {
    console.error("Database error when validating token:", error);
    return null;
  }
}

/**
 * Deletes a session token
 * @param token - The token to delete
 * @returns True if successful, false otherwise
 */
export async function deleteSessionToken(token: string | null): Promise<boolean> {
  if (!token) {
    console.log("No token provided for deletion");
    return false;
  }
  
  try {
    const result = await client.queryObject(
      `DELETE FROM sessions WHERE token = $1 RETURNING *`,
      [token]
    );
    
    if (!result.rows || result.rows.length === 0) {
      console.log(`No token found in database: ${token.substring(0, 8)}...`);
      return false;
    }
    
    console.log(`Token deleted from database: ${token.substring(0, 8)}...`);
    return true;
  } catch (error) {
    console.error("Database error when deleting token:", error);
    return false;
  }
}
