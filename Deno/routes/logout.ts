import { client } from "../data/denopost_conn.ts";

export async function handleLogout(req: Request): Promise<Response> {
    try {
        // Get the session token from cookies
        const cookies = req.headers.get("cookie") || "";
        const sessionToken = cookies.match(/session_token=([^;]+)/)?.[1];

        if (sessionToken) {
            // Delete the token from the database
            await client.queryObject(
                "DELETE FROM tokens WHERE token = $1",
                [sessionToken]
            );
        }

        // Clear any stored user data in localStorage
        const response = new Response(null, {
            status: 302,
            headers: {
                "Location": "/index.html",
                "Set-Cookie": "session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        });

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        // Even if there's an error, still try to redirect to index
        return new Response(null, {
            status: 302,
            headers: {
                "Location": "/index.html",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        });
    }
}
