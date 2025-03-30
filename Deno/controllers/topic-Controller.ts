import { client } from "../data/denopost_conn.ts";

export async function searchTopics(req: Request) {
    try {
        const url = new URL(req.url);
        const query = url.searchParams.get("q")?.trim() || ""; // Extract and trim query

        console.log("Searching for topics with query:", query);

        if (!query) {
            return new Response(JSON.stringify({ error: "Query parameter is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        await client.connect();

        // Check if the topic exists
        const result = await client.queryObject(
            `SELECT * FROM topics WHERE topic_name ILIKE $1`,
            [`%${query}%`]
        );

        if (result.rows.length > 0) {
            console.log("Topic found:", result.rows);
            await client.end();
            return new Response(JSON.stringify(result.rows), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // If the topic does not exist, create it
        console.log("Topic not found. Creating new topic:", query);
        const insertResult = await client.queryObject(
            `INSERT INTO topics (topic_name) VALUES ($1) RETURNING *`,
            [query]
        );

        await client.end();

        console.log("New Topic Created:", insertResult.rows);
        return new Response(JSON.stringify(insertResult.rows), {
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
