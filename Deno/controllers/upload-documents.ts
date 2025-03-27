import { client } from "../data/denopost_conn.ts";

export async function handleDocumentSubmission(req: Request): Promise<Response> {
    try {
        const formData = await req.formData();

        console.log("Received form data:");
        for (const entry of formData.entries()) {
            console.log(entry[0], entry[1]);
        }

        // Extract form values
        const title = formData.get("title")?.toString();
        const author = formData.get("author")?.toString();
        const year = formData.get("year")?.toString();
        const volume = formData.get("volume-no")?.toString();
        const department = formData.get("department")?.toString();
        const category = formData.get("category")?.toString();
        const topic = formData.get("topic")?.toString();
        const abstract = formData.get("abstract")?.toString();
        const file = formData.get("file");

        console.log({ title, author, year, department, category, topic, abstract, file });

        if (!title || !author || !year || !department || !category || !topic || !abstract) {
            return new Response(JSON.stringify({ message: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ message: "Document received!" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error processing form:", error);
        return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}

