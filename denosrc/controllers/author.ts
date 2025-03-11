/*denosrc/controllers/author.ts*/

export async function addAuthor(request: Request): Promise<Response> {
    try {
        const body = await request.json();
        const { name, email } = body;

        if (!name || !email) {
            return new Response("Name and email are required", { status: 400 });
        }

        console.log("Adding author:", { name, email });

        return new Response(JSON.stringify({ message: "Author added successfully" }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error adding author:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
