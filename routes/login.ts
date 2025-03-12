import { Router } from "https://deno.land/x/oak@v17.1.4/mod.ts";

const router = new Router();

router.post("/login", async (context) => {
  const body = await context.request.body({ type: "json" }).value;
  const { username, password } = body;

  // Replace with your actual authentication logic
  if (username === "admin" && password === "password") {
    context.response.status = 200;
    context.response.body = { message: "Login successful", redirect: "/admin/dashboard.html" };
  } else if (username === "user" && password === "password") {
    context.response.status = 200;
    context.response.body = { message: "Login successful", redirect: "/user" };
  } else {
    context.response.status = 401;
    context.response.body = { message: "Invalid credentials" };
  }
});

export default router;