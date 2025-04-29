import { ResearchAgendaModel } from "../models/researchAgendaModel.ts";
import type { Request, Response } from "../deps.ts";

/**
 * Add research agenda items to a document
 */
export async function addResearchAgendaItems(req: Request): Promise<Response> {
  try {
    if (req.body) {
      const body = await req.json();
      
      if (!body.document_id) {
        return new Response(JSON.stringify({ error: "Document ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      if (!body.agenda_items || !Array.isArray(body.agenda_items) || body.agenda_items.length === 0) {
        return new Response(JSON.stringify({ error: "At least one agenda item is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      const success = await ResearchAgendaModel.addItems(
        parseInt(body.document_id),
        body.agenda_items
      );
      
      if (success) {
        return new Response(JSON.stringify({ message: "Research agenda items added successfully" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } else {
        throw new Error("Failed to add research agenda items");
      }
    } else {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error: unknown) {
    console.error("Error adding research agenda items:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Get research agenda items for a document
 */
export async function getResearchAgendaItems(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const documentId = path.split("/").pop();
    
    if (!documentId) {
      return new Response(JSON.stringify({ error: "Document ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const items = await ResearchAgendaModel.getByDocumentId(parseInt(documentId));
    
    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: unknown) {
    console.error("Error fetching research agenda items:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Delete research agenda items for a document
 */
export async function deleteResearchAgendaItems(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const documentId = path.split("/").pop();
    
    if (!documentId) {
      return new Response(JSON.stringify({ error: "Document ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const success = await ResearchAgendaModel.deleteByDocumentId(parseInt(documentId));
    
    if (success) {
      return new Response(JSON.stringify({ message: "Research agenda items deleted successfully" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      throw new Error("Failed to delete research agenda items");
    }
  } catch (error: unknown) {
    console.error("Error deleting research agenda items:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Create a new standalone research agenda item
 */
export async function createResearchAgendaItem(req: Request): Promise<Response> {
  try {
    if (req.body) {
      const body = await req.json();
      
      if (!body.name) {
        return new Response(JSON.stringify({ error: "Agenda item name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      const result = await ResearchAgendaModel.createAgendaItem(
        body.name,
        body.description
      );
      
      if (result) {
        return new Response(JSON.stringify({
          message: "Research agenda item created successfully",
          item: result
        }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      } else {
        throw new Error("Failed to create research agenda item");
      }
    } else {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error: unknown) {
    console.error("Error creating research agenda item:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Create multiple research agenda items in batch
 */
export async function createResearchAgendaItems(req: Request): Promise<Response> {
  try {
    if (req.body) {
      const body = await req.json();
      
      if (!Array.isArray(body)) {
        return new Response(JSON.stringify({ error: "Request body must be an array of agenda items" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      if (body.length === 0) {
        return new Response(JSON.stringify({ error: "At least one agenda item is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Check if each item has a name
      for (const item of body) {
        if (!item.name) {
          return new Response(JSON.stringify({ error: "All agenda items must have a name" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
      
      const result = await ResearchAgendaModel.createAgendaItems(body);
      
      return new Response(JSON.stringify({
        message: `Created ${result.created.length} agenda items with ${result.errors.length} errors`,
        created: result.created,
        errors: result.errors
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error: unknown) {
    console.error("Error in batch agenda item creation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Search for research agenda items
 */
export async function searchResearchAgendaItems(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";
    
    const items = await ResearchAgendaModel.searchAgendaItems(query);
    
    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: unknown) {
    console.error("Error searching research agenda items:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
} 