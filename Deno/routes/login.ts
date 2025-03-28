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
            console.error(" Failed to parse request JSON:", jsonError);
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

        // Redirect based on role
        const redirectUrl = user.role === "Isadmin" ? "/admin/dashboard.html" : "/index.html";
        console.log(`Redirecting User (${user.role}) to: ${redirectUrl}`);

        // **Fix: Ensure we return the response immediately**
        return jsonResponse({ message: "Login successful", token, redirect: redirectUrl }, 200);
    } catch (error) {
        console.error("Unexpected error in handleLoginRequest:", error);

        // **Fix: Always return a response in the catch block**
        return jsonResponse({ message: "Internal Server Error", error: error.message }, 500);
    }
}

// **Fix: Ensure a new Response object is always returned**
function jsonResponse(data: object, status: number): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

export { handleLoginRequest };
