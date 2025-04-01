import { client } from "../data/denopost_conn.ts";

export async function checkAuth(req: Request): Promise<boolean> {
    try {
        const cookies = req.headers.get("cookie") || "";
        const sessionToken = cookies.match(/session_token=([^;]+)/)?.[1];

        if (!sessionToken) {
            return false;
        }

        // Check if token exists in database
        const result = await client.queryObject(`
            SELECT token FROM tokens WHERE token = $1
        `, [sessionToken]);

        return result.rows.length > 0;
    } catch (error) {
        console.error("Auth check error:", error);
        return false;
    }
} 