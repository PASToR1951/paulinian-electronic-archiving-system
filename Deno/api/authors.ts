import { Router } from "https://deno.land/x/oak/mod.ts";
import { searchAuthors } from "../controllers/author-Controller.ts";

const router = new Router();
router.get("/api/authors", searchAuthors);

export default router;
