import { client } from "../data/denopost_conn.ts";

/**
 * Ensure that the database client is connected.
 */
async function ensureConnected() {
    if (!client.connected) {
        console.log("Connecting to PostgreSQL...");
        await client.connect();
        console.log("Database connected.");
    }
}

/**
 * Fetch user details from the database by ID and password.
 * @param ID - User's school ID
 * @param Password - User's password
 * @returns User object (school_id & role) or null if not found
 */
export async function findUser(ID: string, Password: string) {
    try {
        await ensureConnected();

        console.log(`Checking user in database: ID=${ID}`);
        const result = await client.queryObject<{
            school_id: string;
            role: string;
        }>(
            `SELECT c.school_id, r.role_name AS role
             FROM credentials c 
             JOIN roles r ON c.role = r.id  
             WHERE c.school_id = $1 AND c.password = $2`,  
            [ID, Password]
        );

        if (result.rows.length === 0) {
            console.warn("No user found for ID:", ID);
            return null;
        }

        const user = result.rows[0];
        console.log(`User found: ${user.school_id}, Role: ${user.role}`);

        return {
            school_id: user.school_id,
            role: user.role,
        };
    } catch (error) {
        console.error("Database error in findUser:", error);
        throw error;
    }
}
