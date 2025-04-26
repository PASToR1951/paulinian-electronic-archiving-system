import { findUser } from "../auth/userStore.ts";
import { createSessionToken } from "../auth/session.ts";

async function handleLoginRequest(req: Request): Promise<Response> {
    console.log("Received /login request", { method: req.method, url: req.url });
    console.log("Headers:", Object.fromEntries(req.headers.entries()));

    try {
        // Get the request body as text first
        const bodyText = await req.text();
        console.log("Raw request body:", bodyText);
        
        // Try to parse as JSON
        let requestData;
        try {
            requestData = JSON.parse(bodyText);
        } catch (jsonError) {
            console.error("Failed to parse request JSON:", jsonError);
            return jsonResponse({ message: "Invalid JSON format" }, 400);
        }

        console.log("Parsed request data:", requestData);

        // Extract credentials - be flexible with field names
        const ID = requestData.ID || requestData.id || requestData.username || requestData.user_id || "";
        const Password = requestData.Password || requestData.password || "";
        
        console.log("Extracted credentials:", { ID: ID || "[missing]", Password: Password ? "[provided]" : "[missing]" });

        if (!ID || !Password) {
            console.error("Missing ID or Password!");
            return jsonResponse({ message: "Missing ID or Password" }, 400);
        }

        // Authenticate user
        console.log(`Checking user in database: ID=${ID}`);
        try {
            const user = await findUser(ID, Password);
            console.log("Auth result:", user ? "User found" : "No matching user");
            
            if (!user) {
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
                // Use absolute URL to ensure proper redirection
                redirectUrl = "http://localhost:8000/admin/dashboard.html";
            } else {
                redirectUrl = "http://localhost:8000/index.html";
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
        } catch (authError) {
            console.error("Error during authentication:", authError);
            return jsonResponse({ message: "Authentication error", details: authError.message }, 500);
        }
    } catch (error) {
        console.error("Unexpected error in handleLoginRequest:", error);
        return jsonResponse({ message: "Internal Server Error", error: error.message }, 500);
    }
}

function jsonResponse(data: object, status: number): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    });
}

export { handleLoginRequest };
