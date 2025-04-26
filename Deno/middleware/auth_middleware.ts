import { client } from "../data/denopost_conn.ts";

interface AuthResult {
  ok: boolean;
  response?: Response;
}

export async function checkAuth(req: Request): Promise<AuthResult> {
    try {
        const cookies = req.headers.get("cookie") || "";
        const sessionToken = cookies.match(/session_token=([^;]+)/)?.[1];

        if (!sessionToken) {
            return {
                ok: false,
                response: new Response(JSON.stringify({ error: "Authentication required" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" }
                })
            };
        }

        // Check if token exists in database
        const result = await client.queryObject(`
            SELECT token FROM tokens WHERE token = $1
        `, [sessionToken]);

        if (result.rows.length > 0) {
            return { ok: true };
        } else {
            return {
                ok: false,
                response: new Response(JSON.stringify({ error: "Invalid session" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" }
                })
            };
        }
    } catch (error) {
        console.error("Auth check error:", error instanceof Error ? error.message : String(error));
        return {
            ok: false,
            response: new Response(JSON.stringify({ error: "Authentication error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            })
        };
    }
} 