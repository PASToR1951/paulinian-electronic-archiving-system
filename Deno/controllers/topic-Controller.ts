import { client } from "../data/denopost_conn.ts";

async function ensureDatabaseConnection() {
    try {
        await client.queryObject("SELECT 1"); // Simple query to check if connected
    } catch (error) {
        console.error("Database reconnection failed, attempting to reconnect...");
        try {
            await client.connect();
            console.log("Database reconnected.");
        } catch (connError) {
            console.error("Database reconnection failed:", connError);
            return new Response(JSON.stringify({ error: "Database connection lost" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    }
}

export async function searchTopics(req: Request): Promise<Response> {
    await ensureDatabaseConnection(); 
    try {
        const url = new URL(req.url);
        const query = url.searchParams.get("q") || ""; // Extract query parameter

        console.log("Searching for topics with query:", query);

        const result = await client.queryObject(
            `SELECT * FROM topics WHERE topic_name ILIKE $1`, 
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

export async function createTopic(req: Request): Promise<Response> {
    try {
        const body = await req.json();
        const topicName = body.topic_name?.trim();

        if (!topicName) {
            return new Response(JSON.stringify({ error: "Topic name is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Check if topic already exists
        const checkResult = await client.queryObject(
            `SELECT * FROM topics WHERE topic_name = $1`,
            [topicName]
        );

        if (checkResult.rows.length > 0) {
            return new Response(JSON.stringify(checkResult.rows[0]), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Create new topic
        const result = await client.queryObject(
            `INSERT INTO topics (topic_name) VALUES ($1) RETURNING *`,
            [topicName]
        );

        return new Response(JSON.stringify(result.rows[0]), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error creating topic:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}