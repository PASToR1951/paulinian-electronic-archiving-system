import { 
    fetchDocuments, 
    getDocumentById, 
    createDocument, 
    updateDocument, 
    deleteDocument 
} from "../controllers/documentController.ts";

/**
 * Handle fetch documents request
 */
export async function handleFetchDocuments(req: Request): Promise<Response> {
    if (req.method === "GET") {
        return await fetchDocuments(req);
    }
    return new Response("Method Not Allowed", { status: 405 });
}

/**
 * Handle document by ID operations (GET, PUT, DELETE)
 */
export async function handleDocumentById(req: Request): Promise<Response> {
    const method = req.method;
    
    switch (method) {
        case "GET":
            return await getDocumentById(req);
        case "PUT":
            return await updateDocument(req);
        case "DELETE":
            return await deleteDocument(req);
        default:
            return new Response("Method Not Allowed", { status: 405 });
    }
}

/**
 * Handle document creation
 */
export async function handleCreateDocument(req: Request): Promise<Response> {
    if (req.method === "POST") {
        return await createDocument(req);
    }
    return new Response("Method Not Allowed", { status: 405 });
}

/**
 * Handle document update
 */
export async function handleUpdateDocument(req: Request): Promise<Response> {
    if (req.method === "PUT") {
        return await updateDocument(req);
    }
    return new Response("Method Not Allowed", { status: 405 });
}

/**
 * Handle document deletion
 */
export async function handleDeleteDocument(req: Request): Promise<Response> {
    if (req.method === "DELETE") {
        return await deleteDocument(req);
    }
    return new Response("Method Not Allowed", { status: 405 });
}
