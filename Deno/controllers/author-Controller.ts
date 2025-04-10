import { client } from "../data/denopost_conn.ts";

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

export async function searchAuthors(req: Request) {
  try {
      const url = new URL(req.url);
      const query = url.searchParams.get("q") || ""; // Extract query parameter

      console.log("Searching for authors with query:", query);

      const result = await client.queryObject<Author>(`
        SELECT 
          a.author_id, 
          a.full_name, 
          a.department, 
          a.email,
          a.affiliation,
          a.year_of_graduation,
          a.linkedin,
          a.biography,
          a.orcid_id,
          a.profile_picture,
          COUNT(d.id) as document_count
        FROM 
          authors a
        LEFT JOIN 
          document_authors da ON a.author_id = da.author_id
        LEFT JOIN 
          documents d ON da.document_id = d.id
        WHERE 
          a.full_name ILIKE $1
        GROUP BY 
          a.author_id, a.full_name, a.department, a.email, a.affiliation, a.year_of_graduation,
          a.linkedin, a.biography, a.orcid_id, a.profile_picture
      `, [`%${query}%`]);

      console.log("Query Result:", result.rows);

      // Map the response to match what the React app expects
      const mappedAuthors = result.rows.map(author => ({
          id: author.author_id,
          name: author.full_name,
          department: author.department || '',
          email: author.email || '',
          affiliation: author.affiliation || '',
          documentCount: Number(author.document_count) || 0,
          orcid: author.orcid_id || '',
          biography: author.biography || '',
          profilePicture: author.profile_picture || '',
          yearOfGraduation: author.year_of_graduation || '',
          linkedin: author.linkedin || '',
          gender: 'M' // Default value
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
