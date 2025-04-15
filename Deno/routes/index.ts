import { Router, send } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const router = new Router();

router.get("/", async (ctx) => {
  await send(ctx, "index.html", {
    root: `${Deno.cwd()}/public`,
  });
});

export { router }; // Named export
