// logout.ts
import { client } from "../data/denopost_conn.ts";  // PostgreSQL connection file

export async function handleLogout(req: Request): Promise<Response> {
    try {
        // Get the session token from cookies
        const cookies = req.headers.get("cookie") || "";
        const sessionToken = cookies.match(/session_token=([^;]+)/)?.[1];

        // Security headers to prevent caching and back navigation
        const securityHeaders = {
            "Location": "/index.html",
            "Set-Cookie": "session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "no-referrer",
            "Clear-Site-Data": "\"cache\", \"cookies\", \"storage\""
        };

        if (!sessionToken) {
            // If no session token, just redirect to index
            return new Response(null, {
                status: 302,
                headers: securityHeaders
            });
        }

        // Invalidate session by removing the session token from the tokens table
        await client.queryObject(`
            DELETE FROM tokens WHERE token = $1
        `, [sessionToken]);

        // Create response with cleared cookie and redirect
        return new Response(null, {
            status: 302,
            headers: securityHeaders
        });
    } catch (error) {
        console.error("Error during logout:", error);
        // Even if there's an error, try to redirect to index
        return new Response(null, {
            status: 302,
            headers: {
                "Location": "/index.html",
                "Set-Cookie": "session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
                "X-Frame-Options": "DENY",
                "X-Content-Type-Options": "nosniff",
                "X-XSS-Protection": "1; mode=block",
                "Referrer-Policy": "no-referrer",
                "Clear-Site-Data": "\"cache\", \"cookies\", \"storage\""
            }
        });
    }
} 
