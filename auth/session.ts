import { client } from "../data/denopost_conn.ts";

export async function createSessionToken(userID: string, userRole: string): Promise<string> {
    // Generate a new token
    const token = crypto.randomUUID();
    
    // Get the current timestamp for the created_at field
    const createdAt = new Date().toISOString(); // You can also use `.toUTCString()` or `.getTime()` for different formats

    // Insert the new token into the database, including the created_at timestamp
    await client.queryArray(
        "INSERT INTO tokens (token, user_id, user_role, created_at) VALUES ($1, $2, $3, $4)", 
        [token, userID, userRole, createdAt]
    );

    // Return the generated token
    return token;
}
