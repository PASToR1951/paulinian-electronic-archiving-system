import { Router } from "https://deno.land/x/oak/mod.ts";
import { handleGetAuthors, handleGetTopics } from "../api/index.ts";

const router = new Router();

router.get("/api/authors", handleGetAuthors);

export default router;
