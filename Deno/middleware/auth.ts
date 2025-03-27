import { client } from "../data/denopost_conn.ts";

export async function isAdminAuthenticated(req: Request, next: (req: Request) => Promise<Response>): Promise<Response> {
    const token = req.headers.get("Authorization");

    if (!token) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }

    const result = await client.queryObject("SELECT user_id FROM tokens WHERE token = $1", [token]);

    if (result.rows.length === 0) {
        return new Response(JSON.stringify({ message: "Invalid token" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }

    return next(req);
}
