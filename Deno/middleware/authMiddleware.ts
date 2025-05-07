import { Context, Next } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { validateSessionToken } from "../services/sessionService.ts";
import { client } from "../db/denopost_conn.ts";

export async function isAuthenticated(ctx: Context, next: Next) {
    try {
        const authHeader = ctx.request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            ctx.response.status = 401;
            ctx.response.body = { error: "Unauthorized" };
            return;
        }

        const token = authHeader.split(" ")[1];
        const userId = await validateSessionToken(token);

        if (!userId) {
            ctx.response.status = 401;
            ctx.response.body = { error: "Unauthorized" };
            return;
        }

        // Fetch user info (including role) from DB
        let userRole = null;
        try {
            const result = await client.queryObject(
                `SELECT r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
                [userId]
            );
            if (result.rows && result.rows.length > 0) {
                userRole = result.rows[0].role_name;
            }
        } catch (e) {
            console.error("Error fetching user role:", e as any);
        }

        ctx.state.user = { id: userId, role: userRole };
        await next();
    } catch (error) {
        console.error("Authentication error:", error);
        ctx.response.status = 401;
        ctx.response.body = { error: "Unauthorized" };
    }
}

export async function isAdmin(ctx: Context, next: Next) {
    try {
        const user = ctx.state.user;
        if (!user || !user.role || user.role.toLowerCase() !== "admin") {
            ctx.response.status = 403;
            ctx.response.body = { error: "Forbidden" };
            return;
        }
        await next();
    } catch (error) {
        console.error("Admin authorization error:", error);
        ctx.response.status = 403;
        ctx.response.body = { error: "Forbidden" };
    }
}
