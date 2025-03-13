import { client } from "../data/denopost_conn.ts";

const roleMap: Record<number, string> = {
    1: "Isadmin",
    2: "User",
};

export async function findUser(ID: string, Password: string) {
    try {
        if (!client.connected) { 
            await client.connect();
        }

        console.log(`🔍 Checking user in database: ID=${ID}`);
        const result = await client.queryObject<{
            school_id: string;
            password: string;
            role: string; 
        }>(
            `SELECT c.school_id, c.password, r.role_name AS role
             FROM credentials c 
             JOIN roles r ON c.role = r.id  
             WHERE c.school_id = $1 AND c.password = $2`,  
            [ID, Password]
        );

        console.log(" Database Query Result:", result.rows);

        if (result.rows.length > 0) {
            const user = result.rows[0];

            console.log(`🔍 User Role Retrieved from Database: ${user.role}`);
            return {
                school_id: user.school_id,
                role: user.role,
            };
        }

        console.error(" No user found for ID:", ID);
        return null;
    } catch (error) {
        console.error(" Database error in findUser:", error);
        throw error;
    }
}
