import { Router } from "https://deno.land/x/oak/mod.ts";
import { deleteToken } from "./session.ts";

const router = new Router();

router.post("/logout", async (context) => {
    const token = context.cookies.get("auth_token");

    if (token) {
        await deleteToken(token);
        console.log("🚪 User logged out.");
    }

    context.response.status = 200;
    context.response.body = { message: "Logged out successfully" };
    context.response.headers.set("Set-Cookie", "auth_token=; HttpOnly; Path=/; Secure; Max-Age=0");
});

export default router; 
