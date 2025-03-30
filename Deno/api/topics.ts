import { Router } from "https://deno.land/x/oak/mod.ts";
import { searchTopics, createTopic } from "../controllers/topic-Controller.ts";  

const router = new Router();

router.get("/api/topics", searchTopics);
router.post("/api/topics", createTopic); 

export default router;
