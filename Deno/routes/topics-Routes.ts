import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { searchTopics, createTopic } from "../controllers/topic-Controller.ts";

const router = new Router();

router.get("/api/topics", async (ctx) => {
  try {
    const response = await searchTopics(ctx.request);
    ctx.response.body = await response.json();
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
  } catch (error) {
    console.error("Error in topics route:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

router.post("/api/topics", async (ctx) => {
  try {
    const response = await createTopic(ctx.request);
    ctx.response.body = await response.json();
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
  } catch (error) {
    console.error("Error creating topic:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

export { router };
