import { findUser } from "../auth/userStore.ts";

async function handleSessionRequest(req: Request): Promise<Response> {
    console.log("📩 Received /session request");

    try {
        const authHeader = req.headers.get("Authorization");
        let session;

        if (authHeader) {
            try {
                session = JSON.parse(atob(authHeader.split(" ")[1]));
                console.log("🔍 Decoded session:", session);
            } catch {
                return new Response(JSON.stringify({ message: "Invalid session token" }), { status: 401 });
            }
        } else {
            console.log("👤 No session token found. Assigning guest session.");
            session = { role: "guest" };
        }

        if (session.role !== "guest") {
            const user = await findUser(session.ID);
            if (!user) {
                return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
            }

            return new Response(
                JSON.stringify({ school_id: user.school_id, role: user.role }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ role: "guest" }),  // ✅ Response for guests
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("❌ Session error:", error);
        return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}

export { handleSessionRequest };
