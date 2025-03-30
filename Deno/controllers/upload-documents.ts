import { client } from "../data/denopost_conn.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

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
        const file = formData.get("file") as File;

        if (!title || !author || !year || !department || !category || !topic || !abstract || !file) {
            return new Response(JSON.stringify({ message: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Ensure file storage directory exists
        const uploadDir = "./filepathpdf";
        await ensureDir(uploadDir);

        // Save the file
        const filePath = `${uploadDir}/${file.name}`;
        const fileData = new Uint8Array(await file.arrayBuffer());

        await Deno.writeFile(filePath, fileData);

        console.log(`File saved at: ${filePath}`);

        return new Response(JSON.stringify({ message: "Document uploaded successfully!", filePath }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error processing form:", error);
        return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}
