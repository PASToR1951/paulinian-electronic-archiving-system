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
        const query = url.searchParams.get("q")?.trim() || "";

        console.log("Searching for topics with query:", query);

        if (!query) {
            return new Response(JSON.stringify([]), { 
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        
        const result = await client.queryObject(
            `SELECT * FROM topics WHERE topic_name ILIKE $1 ORDER BY topic_name LIMIT 10`,
            [`${query}%`]
        );

        

        console.log("Topic search results:", result.rows);
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

        console.log("Sending POST request to create topic:", topicName);

        if (!topicName) {
            return new Response(JSON.stringify({ error: "Invalid topic name" }), {
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
            console.log("Topic already exists:", checkResult.rows[0]);
            return new Response(JSON.stringify({
                message: "Topic already exists",
                topic: checkResult.rows[0]
            }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // Insert new topic
        const insertResult = await client.queryObject(
            `INSERT INTO topics (topic_name) VALUES ($1) RETURNING *`,
            [topicName]
        );

        console.log("New Topic Created:", insertResult.rows);
        return new Response(JSON.stringify(insertResult.rows[0]), {
            headers: { "Content-Type": "application/json" },
            status: 201,
        });

    } catch (error) {
        console.error("Database error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}