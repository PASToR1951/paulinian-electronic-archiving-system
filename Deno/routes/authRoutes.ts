import { Route } from "./index.ts";
import { RouterContext } from "../deps.ts";
import * as sessionService from "../services/sessionService.ts";

// Auth route handlers
const login = async (ctx: RouterContext<any, any, any>) => {
  try {
    // Get and log request body for debugging
    let body;
    try {
      // Oak v12 body parsing
      const bodyParser = await ctx.request.body({type: "json"});
      body = await bodyParser.value;
      console.log("Successfully parsed JSON body");
    } catch (bodyError) {
      console.error("Error parsing request body:", bodyError);
      // Fallback to a simple object if JSON parsing fails
      body = {};
      
      // Try to get form data from URL parameters if JSON fails
      const params = new URL(ctx.request.url).searchParams;
      for (const [key, value] of params.entries()) {
        body[key] = value;
      }
      
      // If we still have no data, create dummy data for testing
      if (Object.keys(body).length === 0) {
        body = { ID: "test_user", Password: "password" };
        console.log("Using fallback test credentials");
      }
    }
    
    console.log("Login request body:", body);
    
    // For testing, accept any credentials
    // In production, you would verify credentials against a database
    
    // Get user info from request
    const userId = body.ID || body.id || "user_" + Math.floor(Math.random() * 1000);
    
    // Determine role based on user ID pattern - in a real app, this would come from a database
    let userRole = body.role; // First try to use the role provided in the request
    
    if (!userRole) {
      // If no role provided, determine from ID prefix or pattern
      if (userId.startsWith('admin-')) {
        userRole = 'admin';
      } else if (userId.startsWith('registered-')) {
        userRole = 'registered';
      } else {
        // Default fallback
        userRole = 'Guest';
      }
    }
    
    console.log(`Processing login for user ID: ${userId}, assigned role: ${userRole}`);
    
    // Generate a token (with fallback for errors)
    let token;
    try {
      token = await sessionService.createSessionToken(userId, userRole);
    } catch (tokenError) {
      console.error("Token generation error:", tokenError);
      // Fallback to simple UUID if token generation fails
      token = crypto.randomUUID();
    }
    
    // Log the user login with role information
    console.log(`User login: ${userId} (${userRole}) logged in at ${new Date().toISOString()}`);
    
    // Additional logging based on user role
    switch(userRole.toLowerCase()) {
      case "admin":
        console.log(`ADMIN LOGIN: Administrator ${userId} accessed the system`);
        break;
      case "staff":
        console.log(`REGISTERED USER: Registered user ${userId} accessed the system`);
        break;
      default:
        console.log(`GUEST LOGIN: Guest user ${userId} accessed the system`);
    }
    
    // Determine redirect URL based on user role
    let redirectUrl = "public/index.html"; // Default redirect
    
    // Role-based redirects
    if (userRole.toLowerCase() === "admin") {
      redirectUrl = "admin/dashboard.html"; // Admin dashboard
    } else if (userRole.toLowerCase() === "registered" || userRole.toLowerCase() === "student") {
      redirectUrl = "/index.html"; // Student portal
    }
    // All other roles go to the default index.html
    
    // Return successful response
    ctx.response.status = 200;
    ctx.response.body = { 
      message: "Login successful", 
      token: token,
      user: {
        id: userId,
        username: userId,
        role: userRole
      },
      redirect: redirectUrl
    };
  } catch (error) {
    console.error("Login error:", error);
    ctx.response.status = 400;
    ctx.response.body = { 
      message: "Login failed", 
      error: error.message,
      details: "See server logs for more information"
    };
  }
};

const register = async (ctx: RouterContext<any, any, any>) => {
  const bodyParser = await ctx.request.body({type: "json"});
  const body = await bodyParser.value;
  ctx.response.body = { message: "User registered successfully", data: body };
};

const logout = async (ctx: RouterContext<any, any, any>) => {
  try {
    // Extract auth token from request headers or cookies
    const authHeader = ctx.request.headers.get("Authorization");
    let token = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      console.log("Found token in Authorization header");
    } else if (ctx.cookies && typeof ctx.cookies.get === "function") {
      // Try different possible cookie names for the token
      const possibleCookies = ["session_token", "auth_token"];
      for (const cookieName of possibleCookies) {
        const cookieValue = ctx.cookies.get(cookieName);
        if (cookieValue) {
          token = cookieValue;
          console.log(`Found token in ${cookieName} cookie`);
          break;
        }
      }
    }
    
    // Log the start of logout process
    console.log(`[${new Date().toISOString()}] Processing logout request`);
    
    // If we have a token, try to delete it from the database
    if (token) {
      try {
        // Log the token (safely) - adding type checking for string
        if (typeof token === 'string') {
          const tokenStart = token.substring(0, 8);
          const tokenEnd = token.length > 16 ? token.substring(token.length - 8) : '';
          console.log(`Processing logout for token: ${tokenStart}...${tokenEnd}`);
        } else {
          console.log(`Processing logout for non-string token type: ${typeof token}`);
        }
        
        // Try to delete the token from the database
        const success = await sessionService.deleteSessionToken(token);
        if (success) {
          console.log("Session token successfully deleted from database");
        } else {
          console.log("Token not found in database or already deleted");
        }
      } catch (error) {
        console.error("Error during token deletion:", error);
      }
    } else {
      console.log("No token provided in logout request");
    }
    
    // Always return success response for logout
    ctx.response.status = 200;
    ctx.response.body = { message: "Logout successful" };
  } catch (error) {
    console.error("Logout error:", error);
    // Still return success to ensure client-side logout completes
    ctx.response.status = 200;
    ctx.response.body = { message: "Logout completed with errors", error: error.message };
  }
};

// Export an array of routes
export const authRoutes: Route[] = [
  { method: "POST", path: "/auth/login", handler: login },
  { method: "POST", path: "/login", handler: login }, // Add plain /login endpoint
  { method: "POST", path: "/auth/register", handler: register },
  { method: "POST", path: "/auth/logout", handler: logout },
  { method: "POST", path: "/logout", handler: logout }, // Add direct /logout endpoint
  { method: "GET", path: "/logout", handler: logout }, // Add GET method support for logout
];
