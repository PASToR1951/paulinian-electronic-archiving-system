import { client } from "../data/denopost_conn.ts";

async function handleSessionRequest(req: Request): Promise<Response> {
    console.log("Received /session request");

    try {
        const authHeader = req.headers.get("Authorization");

        if (!authHeader) {
            console.log("No session token found. Assigning guest session.");
            return jsonResponse({ role: "guest" }, 200);
        }

        const token = authHeader.split(" ")[1];  // Extract token from "Bearer <token>"
        console.log("Received token:", token);

        // Query the database to check if token exists
        const result = await client.queryObject<{ user_id: string; user_role: string }>(
            "SELECT user_id, user_role FROM tokens WHERE token = $1",
            [token]
        );

        if (result.rows.length === 0) {
            console.error("Invalid session token!");
            return jsonResponse({ message: "Invalid session token" }, 401);
        }

        const { user_id, user_role } = result.rows[0];
        console.log(`Session verified: ${user_id} (${user_role})`);

        return jsonResponse({ school_id: user_id, role: user_role }, 200);

    } catch (error) {
        console.error("Session error:", error);
        return jsonResponse({ message: "Internal Server Error" }, 500);
    }
}

// Utility function to return JSON responses
function jsonResponse(data: object, status: number): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

export { handleSessionRequest };
