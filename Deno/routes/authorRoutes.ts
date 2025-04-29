import { Router } from "../deps.ts";
import { 
  searchAuthors, 
  testAuthorApi, 
  createAuthor,
  createAuthors,
  deleteAuthor, 
  restoreAuthor 
} from "../controllers/authorController.ts";

// Create a router for author-related routes
const router = new Router();

// Author search route
router.get("/authors/search", searchAuthors);

// Author API test route
router.get("/api/authors/test", testAuthorApi);

// Author creation route
router.post("/authors", createAuthor);

// Batch author creation route
router.post("/authors/batch", createAuthors);

// Author deletion route
router.delete("/authors/:id", deleteAuthor);

// Author restoration route
router.post("/authors/:id/restore", restoreAuthor);

// Export the routes
export const authorRoutes = router.routes(); 