import { ResearchAgendaModel } from "../models/researchAgendaModel.ts";

/**
 * Handle adding research agenda items to a document
 */
export async function handleAddResearchAgendaItems(request: Request): Promise<Response> {
  try {
    if (request.body) {
      const body = await request.json();
      
      if (!body.document_id) {
        return new Response(JSON.stringify({ error: "Document ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Check for all possible ways to provide agenda items
      const hasAgendaItems = body.agenda_items && Array.isArray(body.agenda_items) && body.agenda_items.length > 0;
      const hasAgendaNames = body.agenda_names && Array.isArray(body.agenda_names) && body.agenda_names.length > 0;
      const hasAgendaIds = body.agenda_ids && Array.isArray(body.agenda_ids) && body.agenda_ids.length > 0;
      
      // If neither traditional agenda_items nor the new format is provided, return an error
      if (!hasAgendaItems && !hasAgendaNames && !hasAgendaIds) {
        return new Response(JSON.stringify({ error: "At least one agenda item is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      let success = false;
      
      // Process based on available data
      if (hasAgendaItems) {
        // Traditional approach - simply add the agenda items by name
        success = await ResearchAgendaModel.addItems(
          parseInt(body.document_id),
          body.agenda_items
        );
      } else {
        // New approach - handle IDs and names separately
        
        // First handle IDs if present
        if (hasAgendaIds) {
          success = await ResearchAgendaModel.linkItemsToDocument(
            parseInt(body.document_id),
            body.agenda_ids.map((id: string) => parseInt(id))
          );
        }
        
        // Then handle names if present
        if (hasAgendaNames) {
          const result = await ResearchAgendaModel.linkItemsToDocumentByName(
            parseInt(body.document_id),
            body.agenda_names
          );
          success = result.success;
        }
      }
      
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
  } catch (error) {
    console.error("Error adding research agenda items:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Handle getting research agenda items for a document
 */
export async function handleGetResearchAgendaItems(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const paths = url.pathname.split('/');
    const documentId = paths[paths.length - 1];
    
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
  } catch (error) {
    console.error("Error fetching research agenda items:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Handle creation of a new standalone research agenda item
 */
export async function handleCreateResearchAgendaItem(request: Request): Promise<Response> {
  try {
    if (request.body) {
      const body = await request.json();
      
      if (!body.name) {
        return new Response(JSON.stringify({ error: "Agenda item name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      const result = await ResearchAgendaModel.createAgendaItem(
        body.name
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
  } catch (error) {
    console.error("Error creating research agenda item:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Handle batch creation of multiple research agenda items
 */
export async function handleCreateResearchAgendaItems(request: Request): Promise<Response> {
  try {
    if (request.body) {
      const body = await request.json();
      
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
  } catch (error) {
    console.error("Error in batch agenda item creation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Handle searching for research agenda items
 */
export async function handleSearchResearchAgendaItems(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    
    const items = await ResearchAgendaModel.searchAgendaItems(query);
    
    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error searching research agenda items:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}