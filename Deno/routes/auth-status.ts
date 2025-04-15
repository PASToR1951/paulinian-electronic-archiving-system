import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { client } from "../data/denopost_conn.ts";

const router = new Router();

router.get("/auth-status", async (context) => {
    const token = context.cookies.get("auth_token");

    if (!token) {
        console.log("No auth token found in cookies.");
        context.response.body = { role: null };
        return;
    }

    try {
        // Query the database to check if token exists
        const result = await client.queryObject<{ user_id: string; user_role: string }>(
            "SELECT user_id, user_role FROM tokens WHERE token = $1",
            [token]
        );

        if (result.rows.length === 0) {
            console.log(`Invalid token: ${token}`);
            context.response.body = { role: null };
            return;
        }

        const { user_role } = result.rows[0];
        console.log(`Authenticated as: ${user_role}`);
        context.response.body = { role: user_role };
    } catch (error) {
        console.error("Error checking auth status:", error);
        context.response.body = { role: null };
    }
});

export default router;
