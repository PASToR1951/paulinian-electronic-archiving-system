import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { searchAuthors } from "../controllers/author-Controller.ts";
import { searchTopics } from "../controllers/topic-Controller.ts";

const router = new Router();

// These routes are now handled directly in server.ts using the proper Oak routers
// This file is kept for backward compatibility if any code still references it

export default router;
