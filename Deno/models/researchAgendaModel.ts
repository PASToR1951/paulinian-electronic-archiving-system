import { client } from "../db/denopost_conn.ts";

/**
 * Research Agenda interface
 */
export interface ResearchAgenda {
  id: number;
  document_id: number;
  agenda_item: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Standalone Research Agenda interface (not tied to a document)
 */
export interface ResearchAgendaItem {
  id: number;
  name: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class ResearchAgendaModel {
  /**
   * Add research agenda items to a document
   * @param documentId - The document ID
   * @param agendaItems - Array of agenda items
   * @returns True if successful, false otherwise
   */
  static async addItems(documentId: number, agendaItems: string[]): Promise<boolean> {
    try {
      // First delete any existing items for this document to avoid duplicates
      await client.queryArray(
        "DELETE FROM research_agenda WHERE document_id = $1",
        [documentId]
      );
      
      // Insert all new items
      for (const item of agendaItems) {
        if (item.trim()) {
          await client.queryArray(
            "INSERT INTO research_agenda (document_id, agenda_item) VALUES ($1, $2)",
            [documentId, item.trim()]
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error adding research agenda items:", error);
      return false;
    }
  }

  /**
   * Link research agenda items to a document in the junction table
   * @param documentId - The document ID
   * @param agendaItemIds - Array of research agenda item IDs
   * @returns True if successful, false otherwise
   */
  static async linkItemsToDocument(documentId: number, agendaItemIds: number[]): Promise<boolean> {
    try {
      // First delete any existing links for this document to avoid duplicates
      await client.queryArray(
        "DELETE FROM document_research_agenda WHERE document_id = $1",
        [documentId]
      );
      
      // Insert all new links
      for (const agendaItemId of agendaItemIds) {
        await client.queryArray(
          "INSERT INTO document_research_agenda (document_id, research_agenda_id) VALUES ($1, $2)",
          [documentId, agendaItemId]
        );
        console.log(`Linked research agenda ${agendaItemId} to document ${documentId}`);
      }
      
      return true;
    } catch (error) {
      console.error("Error linking research agenda items to document:", error);
      return false;
    }
  }

  /**
   * Link research agenda items to a document by name
   * @param documentId - The document ID
   * @param agendaItemNames - Array of research agenda item names
   * @returns Object with success status and array of linked item IDs
   */
  static async linkItemsToDocumentByName(
    documentId: number, 
    agendaItemNames: string[]
  ): Promise<{ success: boolean; linkedIds: number[] }> {
    try {
      const linkedIds: number[] = [];
      
      // First delete any existing links for this document to avoid duplicates
      await client.queryArray(
        "DELETE FROM document_research_agenda WHERE document_id = $1",
        [documentId]
      );
      
      // Process each agenda item
      for (const name of agendaItemNames) {
        if (!name.trim()) continue;
        
        // Try to find existing agenda item by name
        const existingItem = await client.queryObject(
          "SELECT id FROM research_agenda WHERE name ILIKE $1",
          [name.trim()]
        );
        
        let agendaItemId: number;
        
        if (existingItem.rows.length > 0) {
          // Use existing agenda item
          agendaItemId = Number((existingItem.rows[0] as any).id);
        } else {
          // Create new agenda item
          const newItem = await client.queryObject(
            "INSERT INTO research_agenda (name) VALUES ($1) RETURNING id",
            [name.trim()]
          );
          
          if (newItem.rows.length === 0) {
            console.error(`Failed to create research agenda item: ${name}`);
            continue;
          }
          
          agendaItemId = Number((newItem.rows[0] as any).id);
        }
        
        // Link to document
        await client.queryArray(
          "INSERT INTO document_research_agenda (document_id, research_agenda_id) VALUES ($1, $2)",
          [documentId, agendaItemId]
        );
        
        linkedIds.push(agendaItemId);
        console.log(`Linked research agenda "${name}" (ID: ${agendaItemId}) to document ${documentId}`);
      }
      
      return { success: true, linkedIds };
    } catch (error) {
      console.error("Error linking research agenda items to document by name:", error);
      return { success: false, linkedIds: [] };
    }
  }

  /**
   * Get all research agenda items for a document
   * @param documentId - The document ID
   * @returns Array of research agenda items
   */
  static async getByDocumentId(documentId: number): Promise<ResearchAgenda[]> {
    try {
      const result = await client.queryObject(
        "SELECT * FROM research_agenda WHERE document_id = $1 ORDER BY id",
        [documentId]
      );
      
      return result.rows as ResearchAgenda[];
    } catch (error) {
      console.error("Error fetching research agenda items:", error);
      return [];
    }
  }

  /**
   * Delete all research agenda items for a document
   * @param documentId - The document ID
   * @returns True if successful, false otherwise
   */
  static async deleteByDocumentId(documentId: number): Promise<boolean> {
    try {
      await client.queryArray(
        "DELETE FROM research_agenda WHERE document_id = $1",
        [documentId]
      );
      
      return true;
    } catch (error) {
      console.error("Error deleting research agenda items:", error);
      return false;
    }
  }

  /**
   * Create a new standalone research agenda item
   * @param name - The name of the research agenda
   * @param description - Optional description
   * @returns The created agenda item or null if failed
   */
  static async createAgendaItem(name: string, description?: string): Promise<ResearchAgendaItem | null> {
    try {
      // Check if the agenda item already exists
      const existingItem = await client.queryObject(
        "SELECT * FROM research_agenda WHERE name ILIKE $1",
        [name]
      );

      if (existingItem.rows.length > 0) {
        console.log(`Research agenda item already exists: ${name}`);
        return existingItem.rows[0] as ResearchAgendaItem;
      }

      // Create new agenda item
      const result = await client.queryObject(
        "INSERT INTO research_agenda (name) VALUES ($1) RETURNING *",
        [name]
      );

      if (result.rows.length === 0) {
        throw new Error("Failed to create research agenda item");
      }

      console.log(`Created new research agenda item: ${name}`);
      return result.rows[0] as ResearchAgendaItem;
    } catch (error) {
      console.error("Error creating research agenda item:", error);
      return null;
    }
  }

  /**
   * Create multiple research agenda items
   * @param items - Array of research agenda items to create
   * @returns Object containing successful items and errors
   */
  static async createAgendaItems(items: { name: string; description?: string }[]): 
    Promise<{ created: ResearchAgendaItem[]; errors: { name: string; error: string }[] }> {
    const created: ResearchAgendaItem[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const item of items) {
      try {
        // Skip items without name
        if (!item.name || !item.name.trim()) {
          errors.push({ 
            name: item.name || "unnamed", 
            error: "Name is required" 
          });
          continue;
        }

        // Check if the agenda item already exists
        const existingItem = await client.queryObject(
          "SELECT * FROM research_agenda WHERE name ILIKE $1",
          [item.name]
        );

        if (existingItem.rows.length > 0) {
          errors.push({ 
            name: item.name, 
            error: "Research agenda item already exists" 
          });
          continue;
        }

        // Create new agenda item
        const result = await client.queryObject(
          "INSERT INTO research_agenda (name) VALUES ($1) RETURNING *",
          [item.name]
        );

        if (result.rows.length === 0) {
          errors.push({ 
            name: item.name, 
            error: "Failed to create research agenda item" 
          });
        } else {
          created.push(result.rows[0] as ResearchAgendaItem);
          console.log(`Created new research agenda item: ${item.name}`);
        }
      } catch (error) {
        console.error(`Error creating research agenda item ${item.name}:`, error);
        errors.push({ 
          name: item.name, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    return { created, errors };
  }

  /**
   * Search for research agenda items by name
   * @param query - The search query
   * @returns Array of matching research agenda items
   */
  static async searchAgendaItems(query: string): Promise<ResearchAgendaItem[]> {
    try {
      if (query.length < 2) {
        return [];
      }

      const result = await client.queryObject(
        "SELECT * FROM research_agenda WHERE name ILIKE $1 ORDER BY name ASC LIMIT 10",
        [`%${query}%`]
      );

      return result.rows as ResearchAgendaItem[];
    } catch (error) {
      console.error("Error searching research agenda items:", error);
      return [];
    }
  }
} 