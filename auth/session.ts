import { client } from "../data/denopost_conn.ts";

export async function createSessionToken(userID: string, userRole: string): Promise<string> {
    const token = crypto.randomUUID();
    await client.queryArray(
        "INSERT INTO tokens (token, user_id, user_role) VALUES ($1, $2, $3)", 
        [token, userID, userRole]
    );
    return token;
}




