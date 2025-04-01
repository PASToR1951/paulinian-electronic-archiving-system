import { findUser } from "../auth/userStore.ts";
import { createSessionToken } from "../auth/session.ts";

async function handleLoginRequest(req: Request): Promise<Response> {
    console.log("Received /login request");

    try {
        // Validate content type
        const contentType = req.headers.get("content-type")?.toLowerCase() || "";
        if (!contentType.includes("application/json")) {
            console.error("Request body is not JSON!");
            return jsonResponse({ message: "Invalid request format" }, 400);
        }

        // Parse request body safely
        let requestData;
        try {
            requestData = await req.json();
        } catch (jsonError) {
            console.error("Failed to parse request JSON:", jsonError);
            return jsonResponse({ message: "Invalid JSON format" }, 400);
        }

        const { ID, Password } = requestData;
        console.log("Received Login Data:", { ID, Password });

        if (!ID || !Password) {
            console.error("Missing ID or Password!");
            return jsonResponse({ message: "Missing ID or Password" }, 400);
        }

        // Authenticate user
        console.log(`Checking user in database: ID=${ID}`);
        const user = await findUser(ID, Password);
        if (!user) {
            console.error("Invalid credentials for ID:", ID);
            return jsonResponse({ message: "Invalid credentials" }, 401);
        }

        console.log(`User authenticated: ${JSON.stringify(user)}`);

        // Generate session token
        const token = await createSessionToken(user.school_id, user.role);
        console.log(`Generated session token: ${token}`);

        // Check role and redirect accordingly
        const role = user.role.toLowerCase();
        console.log(`User role (lowercase): ${role}`);
        
        let redirectUrl;
        if (role === "admin" || role === "isadmin" || role === "administrator") {
            redirectUrl = "/admin/dashboard.html";
        } else {
            redirectUrl = "/index.html";
        }
        
        console.log(`Redirecting User (${role}) to: ${redirectUrl}`);

        // Create response with session token cookie
        const response = jsonResponse({ 
            message: "Login successful", 
            token, 
            redirect: redirectUrl,
            role: user.role 
        }, 200);

        // Set the session token cookie
        response.headers.set(
            "Set-Cookie",
            `session_token=${token}; Path=/; HttpOnly; SameSite=Strict`
        );

        return response;
    } catch (error) {
        console.error("Unexpected error in handleLoginRequest:", error);
        return jsonResponse({ message: "Internal Server Error", error: error.message }, 500);
    }
}

function jsonResponse(data: object, status: number): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

export { handleLoginRequest };
