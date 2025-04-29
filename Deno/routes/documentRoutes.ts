import { Route } from "./index.ts";
import { RouterContext } from "../deps.ts";
import { 
    handleFetchDocuments, 
    handleDocumentById, 
    handleCreateDocument 
} from "../api/document.ts";

// Document route handlers
const getDocuments = async (ctx: RouterContext<any, any, any>) => {
    // Convert context to Request
    const request = new Request(ctx.request.url.toString(), {
        method: ctx.request.method,
        headers: ctx.request.headers
    });
    
    const response = await handleFetchDocuments(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

const getDocumentById = async (ctx: RouterContext<any, any, any>) => {
    const id = ctx.params.id;
    
    // Convert context to Request
    const request = new Request(`${ctx.request.url.origin}/api/documents/${id}`, {
        method: "GET",
        headers: ctx.request.headers
    });
    
    const response = await handleDocumentById(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

const createDocument = async (ctx: RouterContext<any, any, any>) => {
    const bodyParser = await ctx.request.body({type: "json"});
    const body = await bodyParser.value;
    
    // Convert context to Request
    const request = new Request(ctx.request.url.toString(), {
        method: "POST",
        headers: ctx.request.headers,
        body: JSON.stringify(body)
    });
    
    const response = await handleCreateDocument(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

const updateDocument = async (ctx: RouterContext<any, any, any>) => {
    const id = ctx.params.id;
    const bodyParser = await ctx.request.body({type: "json"});
    const body = await bodyParser.value;
    
    // Convert context to Request
    const request = new Request(`${ctx.request.url.origin}/api/documents/${id}`, {
        method: "PUT",
        headers: ctx.request.headers,
        body: JSON.stringify(body)
    });
    
    const response = await handleDocumentById(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

const deleteDocument = async (ctx: RouterContext<any, any, any>) => {
    const id = ctx.params.id;
    
    // Convert context to Request
    const request = new Request(`${ctx.request.url.origin}/api/documents/${id}`, {
        method: "DELETE",
        headers: ctx.request.headers
    });
    
    const response = await handleDocumentById(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

// Export an array of routes
export const documentRoutes: Route[] = [
    { method: "GET", path: "/documents", handler: getDocuments },
    { method: "GET", path: "/documents/:id", handler: getDocumentById },
    { method: "POST", path: "/documents", handler: createDocument },
    { method: "PUT", path: "/documents/:id", handler: updateDocument },
    { method: "DELETE", path: "/documents/:id", handler: deleteDocument },
];
