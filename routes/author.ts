import { client } from "../data/denopost_conn.ts";

// Function to get authors from the database
export async function getAuthors(req: Request): Promise<Response> {
  try {
    // Extract the search query from the request URL
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get("search") || "";

    // Use a parameterized query to prevent SQL injection
    const query = `SELECT name FROM authors WHERE name ILIKE $1 LIMIT 10`;
    const result = await client.queryArray(query, [`%${searchQuery}%`]);  // Pass the parameter as an array

    // Map the result to extract the author names
    const authors = result.rows.map((row) => row[0]);

    // Return the authors as a JSON response
    return new Response(JSON.stringify(authors), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching authors:", error);
    return new Response(JSON.stringify({ message: "Error fetching authors" }), { status: 500 });
  }
}
