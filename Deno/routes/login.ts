import { findUser } from "../auth/userStore.ts";
import { createSessionToken } from "../auth/session.ts";
import { Request } from "https://deno.land/x/oak@v17.1.4/request.ts";

async function handleLoginRequest(req: Request): Promise<Response> {
    console.log("Received /login request");

    try {
        // Get request data based on content type
        const contentType = req.headers.get("content-type")?.toLowerCase() || "";
        let requestData;

        if (contentType.includes("application/json")) {
            try {
                const body = req.body;
                requestData = await body.json();
            } catch (jsonError) {
                console.error("Failed to parse request JSON:", jsonError);
                return jsonResponse({ message: "Invalid JSON format" }, 400);
            }
        } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
            try {
                const body = req.body;
                const formData = await body.formData();
                requestData = {
                    ID: formData.get("ID"),
                    Password: formData.get("Password")
                };
            } catch (formError) {
                console.error("Failed to parse form data:", formError);
                return jsonResponse({ message: "Invalid form data" }, 400);
            }
        } else {
            console.error("Unsupported content type:", contentType);
            return jsonResponse({ message: "Unsupported content type" }, 400);
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
        return jsonResponse({ 
            message: "Internal Server Error", 
            error: error instanceof Error ? error.message : String(error) 
        }, 500);
    }
}

function jsonResponse(data: object, status: number): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

export { handleLoginRequest };
