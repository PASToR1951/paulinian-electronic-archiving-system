import { client } from "../data/denopost_conn.ts";

export async function handleDocumentSubmission(req: Request): Promise<Response> {
    try {
        const formData = await req.formData();

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

        if (!title || !author || !year || !department || !category || !topic || !abstract) {
            return new Response(JSON.stringify({ message: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!(file instanceof File) || !file.type.includes("pdf")) {
            return new Response(JSON.stringify({ message: "Only PDF files are allowed" }), { status: 400 });
        }

        // Save PDF file
        const fileFolder = "./uploads/pdf";
        await Deno.mkdir(fileFolder, { recursive: true });

        const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const filePath = `${fileFolder}/${Date.now()}_${safeFileName}`;

        await Deno.writeFile(filePath, new Uint8Array(await file.arrayBuffer()));

        // Store document in PostgreSQL
        await client.queryArray(`
            INSERT INTO documents (title, author, year, volume, department, category, topic, abstract, file_path)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [title, author, year, volume, department, category, topic, abstract, filePath]);

        return new Response(JSON.stringify({ message: "Document submitted successfully!" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}
