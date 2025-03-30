import { Router } from "https://deno.land/x/oak/mod.ts";
import { searchOrCreateTopic } from "../controllers/topic-Controller.ts";

const router = new Router();

router.get("/api/topics", searchOrCreateTopic);

export default router;
