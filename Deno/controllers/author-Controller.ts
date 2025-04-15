import { client } from "../data/denopost_conn.ts";
<<<<<<< Updated upstream
import { Request } from "https://deno.land/x/oak@v17.1.4/request.ts";
=======
import { Request } from "https://deno.land/x/oak@v12.6.1/request.ts";
>>>>>>> Stashed changes

// Define the Author interface
interface Author {
  author_id: string;
  full_name: string;
  department?: string;
  email?: string;
  affiliation?: string;
  year_of_graduation?: number;
  linkedin?: string;
  biography?: string;
  orcid_id?: string;
  profile_picture?: string;
  document_count?: bigint;
}

export async function searchAuthors(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query') || '';
    
    const result = await client.queryObject<{ author_id: string; full_name: string }>(
      `SELECT author_id, full_name FROM authors 
       WHERE LOWER(full_name) LIKE LOWER($1) 
       ORDER BY full_name`,
      [`%${query}%`]
    );
    
    return new Response(JSON.stringify(result.rows), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error searching authors:", error);
    return new Response(JSON.stringify({ error: "Failed to search authors" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
