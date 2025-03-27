import { findUser } from "../auth/userStore.ts";
import { createSessionToken } from "../auth/session.ts";

async function handleLoginRequest(req: Request): Promise<Response> {
    console.log("Received /login request");

    try {
        // Validate request content type
        const contentType = req.headers.get("content-type")?.toLowerCase() || "";
        if (!contentType.includes("application/json")) {
            console.error("Request body is not JSON!");
            return jsonResponse("Invalid request format", 400);
        }

        // Parse request body
        const { ID, Password } = await req.json();
        console.log("Received Login Data:", { ID, Password });

        if (!ID || !Password) {
            console.error("Missing ID or Password!");
            return jsonResponse("Missing ID or Password", 400);
        }

        // Authenticate user
        const user = await findUser(ID, Password);
        if (!user) {
            console.error("Invalid credentials for ID:", ID);
            return jsonResponse("Invalid credentials", 401);
        }

        console.log(`User authenticated: ${JSON.stringify(user)}`);

        // Generate session token
        const token = await createSessionToken(user.school_id, user.role);
        console.log(`Generated session token: ${token}`);

        // Redirect based on role
        const redirectUrl = user.role === "Isadmin" ? "/admin/dashboard.html" : "/index.html";
        console.log(`Redirecting User (${user.role}) to: ${redirectUrl}`);

        return jsonResponse({ message: "Login successful", token, redirect: redirectUrl }, 200);
    } catch (error) {
        console.error("Unexpected error in handleLoginRequest:", error);
        return jsonResponse("Internal Server Error", 500);
    }
}

//  Utility function to send JSON responses
function jsonResponse(message: string | object, status: number): Response {
    return new Response(
        JSON.stringify(typeof message === "string" ? { message } : message),
        { status, headers: { "Content-Type": "application/json" } }
    );
}

export { handleLoginRequest };
