import { client } from "../data/denopost_conn.ts";

// Define the Author interface
interface Author {
  author_id: string;
  full_name: string;
  department?: string;
  email?: string;
  [key: string]: any; // For other properties
}

export async function searchAuthors(req: Request) {
  try {
      const url = new URL(req.url);
      const query = url.searchParams.get("q") || ""; // Extract query parameter

      console.log("Searching for authors with query:", query);

      const result = await client.queryObject<Author>(
          `SELECT * FROM authors WHERE full_name ILIKE $1`, 
          [`%${query}%`]
      );

      console.log("Query Result:", result.rows);

      // Map the response to match what the React app expects
      const mappedAuthors = result.rows.map(author => ({
          id: author.author_id,
          name: author.full_name,
          department: author.department,
          email: author.email,
          document_count: 0 // Default value since we don't have this info yet
      }));

      return new Response(JSON.stringify(mappedAuthors), {
          headers: { "Content-Type": "application/json" },
      });
  } catch (error: unknown) {
      console.error("Database error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: errorMessage }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
      });
  }
}
