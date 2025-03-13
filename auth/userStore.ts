import { client } from "../data/denopost_conn.ts";

export async function findUser(ID: string, Password: string) {
    try {
        if (!client.connected) {  // connection is open
            await client.connect();
        }

        console.log(`🔍 Checking user in database: ID=${ID}`);
        const result = await client.queryObject<{
            id: string;
            password: string;
            role: string;
        }>(
           `SELECT c.school_id, c.password, c.role 
            FROM credentials c 
            JOIN roles r ON c.role = r.id  
            WHERE c.school_id = $1 AND c.password = $2`,  
            [ID, Password]
        );

        console.log(" Database Query Result:", result.rows);

        if (result.rows.length > 0) {
            return result.rows[0]; // Return user data
        }

        console.error(" No user found for ID:", ID);
        return null;
    } catch (error) {
        console.error(" Database error in findUser:", error);
        throw error;
    }
}
