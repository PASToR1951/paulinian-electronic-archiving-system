import { Router } from "https://deno.land/x/oak/mod.ts";
import { fetchCategories, fetchDocuments } from "../controllers/document-Controller.ts";

const router = new Router();

router.get("/api/categories", fetchCategories);
router.get("/api/documents", fetchDocuments);

export default router;
