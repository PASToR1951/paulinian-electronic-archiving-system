import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { DocumentRequestController } from "../controllers/documentRequestController.ts";
import { isAuthenticated, isAdmin } from "../middleware/authMiddleware.ts";

export function createDocumentRequestRoutes(controller: DocumentRequestController): Router {
    const router = new Router();

    // Public routes
    router.post("/api/document-requests", controller.createRequest.bind(controller));
    router.get("/api/documents/:documentId/access", controller.checkDocumentAccess.bind(controller));

    // Admin routes
    router.get("/api/document-requests", isAuthenticated, isAdmin, controller.getAllRequests.bind(controller));
    router.get("/api/document-requests/status/:status", isAuthenticated, isAdmin, controller.getRequestsByStatus.bind(controller));
    router.get("/api/documents/:documentId/requests", isAuthenticated, isAdmin, controller.getRequestsByDocumentId.bind(controller));
    router.patch("/api/document-requests/:id/status", isAuthenticated, isAdmin, controller.updateRequestStatus.bind(controller));
    router.delete("/api/document-requests/:id", isAuthenticated, isAdmin, controller.deleteRequest.bind(controller));

    return router;
} 