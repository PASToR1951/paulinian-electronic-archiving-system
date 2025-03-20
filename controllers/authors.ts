import { client } from "../data/denopost_conn.ts";

export async function fetchAuthors(req: Request): Promise<Response> {
    try {
        const url = new URL(req.url);
        const searchQuery = url.searchParams.get("search") || "";

        // Query authors from the database
        const result = await client.queryArray(
            "SELECT first_name, middle_name, last_name FROM authors WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 10",
            [`%${searchQuery}%`]
        );

        const authors = result.rows.map(([firstName, middleName, lastName]) => ({
            firstName,
            middleName,
            lastName,
        }));

        return new Response(JSON.stringify(authors), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("❌ Error fetching authors:", error);
        return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}
