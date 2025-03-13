import { findUser } from "../auth/userStore.ts";

async function handleLoginRequest(req: Request): Promise<Response> {
  console.log(" Received /login request");
  console.log(" Checking request headers:", req.headers);

  try {
      const contentType = req.headers.get("content-type")?.toLowerCase() || "";
      if (!contentType.includes("application/json")) {
          console.error(" Request body is not JSON!");
          return new Response(
              JSON.stringify({ message: "Invalid request format" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
          );
      }

      console.log("🔄 Parsing JSON request...");
      const body = await req.json();
      console.log(" Request body received:", body);

      const { ID, Password } = body;

      if (!ID || !Password) {
          console.error(" Missing ID or Password in request!");
          return new Response(
              JSON.stringify({ message: "Missing ID or Password" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
          );
      }

      console.log(`🔍 Checking user in database for ID: ${ID}`);
      const user = await findUser(ID, Password);
      console.log("🔎 Database Query Result:", user);

      if (!user) {
          console.error(" Invalid credentials for ID:", ID);
          return new Response(
              JSON.stringify({ message: "Invalid credentials" }),
              { status: 401, headers: { "Content-Type": "application/json" } }
          );
      }

      let redirectUrl = "/index.html";
      if (user.role === "Isadmin") {
          redirectUrl = "/admin/dashboard.html";
      }

      console.log(` Login successful! Redirecting to: ${redirectUrl}`);
      return new Response(
          JSON.stringify({ message: "Login successful", redirect: redirectUrl }),
          { status: 200, headers: { "Content-Type": "application/json" } }
      );
  } catch (error) {
      console.error(" Unexpected error in handleLoginRequest:", error);
      return new Response(
          JSON.stringify({ message: "Internal Server Error" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
      );
  }
}

export { handleLoginRequest };
