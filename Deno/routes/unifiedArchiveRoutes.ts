import { Router } from "../deps.ts";
import {
  getAllArchivedDocuments,
  getArchivedDocumentById,
  archiveDocument,
  restoreDocument,
  getArchivedChildDocuments
} from "../controllers/unifiedArchiveController.ts";

const router = new Router();

// Unified archive API routes
router
  .get("/api/archives", getAllArchivedDocuments)
  .get("/api/archives/:id", getArchivedDocumentById)
  .post("/api/archives", archiveDocument)
  .delete("/api/archives/:id", restoreDocument)
  .get("/api/archives/:id/children", getArchivedChildDocuments)
  // Add a specific route for compiled documents to fix the archiving issue
  .post("/api/archives/compiled/:id", archiveDocument);

export const unifiedArchiveRoutes = router.routes();
export const unifiedArchiveAllowedMethods = router.allowedMethods(); 