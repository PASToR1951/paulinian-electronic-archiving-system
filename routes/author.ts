import { client } from "../data/denopost_conn.ts";

export async function getAuthors(_: Request): Promise<Response> {
    try {
        const result = await client.queryArray("SELECT name FROM authors");
        const authors = result.rows.map((row) => row[0]);

        return new Response(JSON.stringify(authors), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching authors:", error);
        return new Response(JSON.stringify({ message: "Error fetching authors" }), { status: 500 });
    }
}
