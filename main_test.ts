import { assertEquals } from "@std/assert";
import { add } from "./main.ts";

Deno.test(function addTest() {
  assertEquals(add(2, 3), 5);
});
console.log("Starting test...");

import { createClient, closeClient } from "./data/denopost_conn.ts";

async function testConnection() {
    try {
        console.log("Connecting to PostgreSQL...");

        const client = await createClient();


        await closeClient(client);
    } catch (error) {
        console.error("Database connection failed:", error);
    }
}

testConnection();
console.log("Test script executed.");
