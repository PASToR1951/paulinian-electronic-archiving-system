import { Router } from "../deps.ts";
import { 
    handleAddResearchAgendaItems,
    handleGetResearchAgendaItems,
    handleCreateResearchAgendaItem,
    handleCreateResearchAgendaItems,
    handleSearchResearchAgendaItems
} from "../api/researchAgenda.ts";

// Create a router for research agenda routes
const router = new Router();

// Research Agenda route handlers
const addResearchAgendaItems = async (ctx: any) => {
    const bodyParser = await ctx.request.body({type: "json"});
    const body = await bodyParser.value;
    
    // Convert context to Request
    const request = new Request(ctx.request.url.toString(), {
        method: "POST",
        headers: ctx.request.headers,
        body: JSON.stringify(body)
    });
    
    const response = await handleAddResearchAgendaItems(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

const getResearchAgendaItems = async (ctx: any) => {
    const documentId = ctx.params.documentId;
    
    // Convert context to Request
    const request = new Request(`${ctx.request.url.origin}/api/document-research-agenda/${documentId}`, {
        method: "GET",
        headers: ctx.request.headers
    });
    
    const response = await handleGetResearchAgendaItems(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

// New handler for creating a single research agenda item
const createResearchAgendaItem = async (ctx: any) => {
    const bodyParser = await ctx.request.body({type: "json"});
    const body = await bodyParser.value;
    
    // Convert context to Request
    const request = new Request(ctx.request.url.toString(), {
        method: "POST",
        headers: ctx.request.headers,
        body: JSON.stringify(body)
    });
    
    const response = await handleCreateResearchAgendaItem(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

// New handler for batch creation of research agenda items
const createResearchAgendaItems = async (ctx: any) => {
    const bodyParser = await ctx.request.body({type: "json"});
    const body = await bodyParser.value;
    
    // Convert context to Request
    const request = new Request(ctx.request.url.toString(), {
        method: "POST",
        headers: ctx.request.headers,
        body: JSON.stringify(body)
    });
    
    const response = await handleCreateResearchAgendaItems(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

// New handler for searching research agenda items
const searchResearchAgendaItems = async (ctx: any) => {
    const query = ctx.request.url.searchParams.get("q") || "";
    console.log("Research agenda search handler hit:", ctx.request.url.toString());
    console.log("Search query:", query);
    
    // Convert context to Request - Changed to use the same URL that client is calling
    const request = new Request(`${ctx.request.url.origin}/research-agenda-items/search?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: ctx.request.headers
    });
    
    const response = await handleSearchResearchAgendaItems(request);
    
    // Convert Response back to context
    ctx.response.status = response.status;
    ctx.response.headers = response.headers;
    ctx.response.body = await response.json();
};

// Register routes
router.post("/document-research-agenda", addResearchAgendaItems);
router.get("/document-research-agenda/:documentId", getResearchAgendaItems);
router.post("/research-agenda-items", createResearchAgendaItem);
router.post("/research-agenda-items/batch", createResearchAgendaItems);
router.get("/research-agenda-items/search", searchResearchAgendaItems);

// Export the routes
export const researchAgendaRoutes = router.routes();

// Define the route interface for compatibility with index.ts
export interface Route {
    method: string;
    path: string;
    handler: (context: any) => Promise<void> | void;
}

// Keep the original array export for backward compatibility
export const researchAgendaRoutesArray: Route[] = [
    // Document-related research agenda routes
    { method: "POST", path: "/document-research-agenda", handler: addResearchAgendaItems },
    { method: "GET", path: "/document-research-agenda/:documentId", handler: getResearchAgendaItems },
    
    // Standalone research agenda item routes
    { method: "POST", path: "/research-agenda-items", handler: createResearchAgendaItem },
    { method: "POST", path: "/research-agenda-items/batch", handler: createResearchAgendaItems },
    { method: "GET", path: "/research-agenda-items/search", handler: searchResearchAgendaItems },
]; 