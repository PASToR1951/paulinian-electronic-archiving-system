import { client } from "../data/denopost_conn.ts";
<<<<<<< Updated upstream
import { Request } from "https://deno.land/x/oak@v17.1.4/request.ts";
=======
import { Request } from "https://deno.land/x/oak@v12.6.1/request.ts";
>>>>>>> Stashed changes

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
        const query = url.searchParams.get('query') || '';
        
        const result = await client.queryObject<{ id: number; topic_name: string }>(
            `SELECT id, topic_name FROM topics 
             WHERE LOWER(topic_name) LIKE LOWER($1) 
             ORDER BY topic_name`,
            [`%${query}%`]
        );
        
        return new Response(JSON.stringify(result.rows), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error searching topics:", error);
        return new Response(JSON.stringify({ error: "Failed to search topics" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function createTopic(req: Request): Promise<Response> {
    try {
        const body = await req.body({ type: "json" }).value;
        const { topic_name } = body as { topic_name: string };

        if (!topic_name) {
            return new Response(JSON.stringify({ error: "Topic name is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const result = await client.queryObject<{ id: number; topic_name: string }>(
            `INSERT INTO topics (topic_name) VALUES ($1) RETURNING id, topic_name`,
            [topic_name]
        );

        return new Response(JSON.stringify(result.rows[0]), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error creating topic:", error);
        return new Response(JSON.stringify({ error: "Failed to create topic" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}