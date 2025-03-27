import { Router, send } from "https://deno.land/x/oak@v17.1.4/mod.ts";

const adminRouter = new Router();

adminRouter.get("/admin/dashboard.html", async (ctx) => {
  await send(ctx, "dashboard.html", {
    root: `${Deno.cwd()}/admin`,
  });
});

export { adminRouter };