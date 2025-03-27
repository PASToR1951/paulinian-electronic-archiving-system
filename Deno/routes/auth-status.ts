import { Router } from "https://deno.land/x/oak/mod.ts";
import { getToken } from "./session.ts";

const router = new Router();

router.get("/auth-status", async (context) => {
    const token = context.cookies.get("auth_token");

    if (!token) {
        console.log("No auth token found in cookies.");
        context.response.body = { role: null };
        return;
    }

    const session = await (await getToken(token));

    if (!session) {
        console.log(`Invalid token: ${token}`);
        context.response.body = { role: null };
        return;
    }

    console.log(`Authenticated as: ${session.user_role}`);
    context.response.body = { role: session.user_role };
});

export default router;
