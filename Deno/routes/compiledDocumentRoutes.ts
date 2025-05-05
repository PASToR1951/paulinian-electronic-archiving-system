import { Route } from "./index.ts";
import { RouterContext } from "../deps.ts";
import { 
    handleCreateCompiledDocument,
    handleGetCompiledDocument,
    handleAddDocumentsToCompilation,
    handleSoftDeleteCompiledDocument
} from "../api/compiledDocument.ts";

// Compiled Document route handlers
const createCompiledDocument = async (ctx: RouterContext<any, any, any>) => {
    const bodyParser = await ctx.request.body({type: "json"});
    const body = await bodyParser.value;
    
    // Convert context to Request
    const request = new Request(ctx.request.url.toString(), {
        method: "POST",
        headers: ctx.request.headers,
        body: JSON.stringify(body)
    });
    
    const response = await handleCreateCompiledDocument(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

const getCompiledDocument = async (ctx: RouterContext<any, any, any>) => {
    const id = ctx.params.id;
    
    // Convert context to Request
    const request = new Request(`${ctx.request.url.origin}/api/compiled-documents/${id}`, {
        method: "GET",
        headers: ctx.request.headers
    });
    
    const response = await handleGetCompiledDocument(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

const addDocumentsToCompilation = async (ctx: RouterContext<any, any, any>) => {
    const bodyParser = await ctx.request.body({type: "json"});
    const body = await bodyParser.value;
    
    // Convert context to Request
    const request = new Request(ctx.request.url.toString(), {
        method: "POST",
        headers: ctx.request.headers,
        body: JSON.stringify(body)
    });
    
    const response = await handleAddDocumentsToCompilation(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

// Add soft delete handler
const softDeleteCompiledDocument = async (ctx: RouterContext<any, any, any>) => {
    const id = ctx.params.id;
    
    // Convert context to Request
    const request = new Request(`${ctx.request.url.origin}/api/compiled-documents/${id}/soft-delete`, {
        method: "DELETE",
        headers: ctx.request.headers
    });
    
    const response = await handleSoftDeleteCompiledDocument(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

// Export an array of routes
export const compiledDocumentRoutes: Route[] = [
    { method: "POST", path: "/compiled-documents", handler: createCompiledDocument },
    { method: "GET", path: "/compiled-documents/:id", handler: getCompiledDocument },
    { method: "POST", path: "/compiled-documents/add-documents", handler: addDocumentsToCompilation },
    { method: "DELETE", path: "/compiled-documents/:id/soft-delete", handler: softDeleteCompiledDocument },
]; 