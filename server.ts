import { Application, send } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { router } from "./routes/index.ts";

// Load .env from the current directory
const env = config({ path: ".env" });

console.log("Loaded ENV:", env); // Debugging

const client = new Client({
  user: env.PGUSER,
  database: env.PGDATABASE,
  hostname: env.PGHOST,
  password: env.PGPASSWORD,
  port: Number(env.PGPORT),
});

await client.connect();

const app = new Application();

app.use(async (context, next) => {
  try {
    await next();
    if (context.response.status === 404) {
      await send(context, context.request.url.pathname, {
        root: `${Deno.cwd()}/public`,
        index: "index.html",
      });
    }
  } catch (err) {
    console.error(err);
    context.response.status = 500;
    context.response.body = "Internal Server Error";
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
