import { client } from "../data/denopost_conn.ts";

export async function searchAuthors(req: Request) {
  try {
      const url = new URL(req.url);
      const query = url.searchParams.get("q") || ""; // Extract query parameter

      console.log("Searching for authors with query:", query);

      const result = await client.queryObject(
          `SELECT * FROM authors WHERE full_name ILIKE $1`, 
          [`%${query}%`]
      );

      console.log("Query Result:", result.rows);

      return new Response(JSON.stringify(result.rows), {
          headers: { "Content-Type": "application/json" },
      });
  } catch (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
      });
  }
}
