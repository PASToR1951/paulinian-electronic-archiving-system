import { Context, send } from "https://deno.land/x/oak@v17.1.4/mod.ts";

const fileWhitelist = [
  "/",
  "/index.html",
  "/log-in.html",
  "/css/webflow-style.css",
  "/js/jquery.js",
  "/js/webflow-script.js",
  "/js/login.js",
  "/images/spud_logo_s.png",
  // Add other static files as needed
];

export async function staticFileMiddleware(context: Context, next: () => Promise<unknown>) {
  const filePath = context.request.url.pathname;

  if (fileWhitelist.includes(filePath)) {
    await send(context, filePath, {
      root: `${Deno.cwd()}/public`,
    });
  } else {
    await next();
  }
  
}