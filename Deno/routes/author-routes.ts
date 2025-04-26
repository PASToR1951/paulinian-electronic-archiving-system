/**
 * Author routes configuration
 */

import { Router } from "../utils/router.ts";
import {
  searchAuthors,
  fetchAuthorById,
  fetchDocumentsByAuthor,
  handleCreateAuthor,
  handleUpdateAuthor,
  handleDeleteAuthor,
  handleRestoreAuthor
} from "../controllers/author-Controller.ts";

// Create a router for author endpoints
const authorRouter = new Router();

// GET /api/authors - Search for authors
authorRouter.get("/api/authors", searchAuthors);

// GET /api/authors/:id - Get a specific author
authorRouter.get("/api/authors/:id", (req, params) => {
  return fetchAuthorById(params.id);
});

// GET /api/authors/:id/documents - Get documents by author
authorRouter.get("/api/authors/:id/documents", (req, params) => {
  return fetchDocumentsByAuthor(params.id);
});

// POST /api/authors - Create a new author
authorRouter.post("/api/authors", handleCreateAuthor);

// PUT /api/authors/:id - Update an author
authorRouter.put("/api/authors/:id", (req, params) => {
  return handleUpdateAuthor(params.id, req);
});

// DELETE /api/authors/:id - Delete an author
authorRouter.delete("/api/authors/:id", (req, params) => {
  return handleDeleteAuthor(params.id);
});

// POST /api/authors/:id/restore - Restore a deleted author
authorRouter.post("/api/authors/:id/restore", (req, params) => {
  return handleRestoreAuthor(params.id);
});

export default authorRouter;
