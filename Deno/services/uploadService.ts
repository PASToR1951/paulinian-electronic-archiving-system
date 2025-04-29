// Simple file upload service

import { ensureDir, extname, join } from "../deps.ts";

/**
 * Save a file to the specified path
 * @param file The file to save
 * @param storagePath The path to save the file to (relative to the project root)
 * @returns The path to the saved file (relative to the project root)
 */
export async function saveFile(file, storagePath = "storage/uploads") {
  try {
    console.log("Saving file:", file.name, "to path:", storagePath);
    
    // Ensure the directory exists
    await ensureDir(storagePath);
    
    // Create a unique filename based on timestamp and original filename
    const fileExt = extname(file.name || "");
    const timestamp = Date.now();
    const uniqueName = `${timestamp}_${Math.floor(Math.random() * 10000)}${fileExt}`;
    
    // Create the full path
    const filePath = join(storagePath, uniqueName);
    
    // Get the file content
    let fileContent;
    if (file.path) {
      // If it's a temporary file with a path (from multipart form)
      fileContent = await Deno.readFile(file.path);
    } else if (file.arrayBuffer) {
      // If it's a File object with arrayBuffer method
      const buffer = await file.arrayBuffer();
      fileContent = new Uint8Array(buffer);
    } else {
      throw new Error("Unsupported file object format");
    }
    
    // Write the file to disk
    await Deno.writeFile(filePath, fileContent);
    
    console.log(`File successfully saved to ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error("Error saving file:", error);
    throw new Error(`Failed to save file: ${error.message}`);
  }
}

/**
 * Delete a file
 * @param filePath The path to the file to delete
 */
export async function deleteFile(filePath) {
  try {
    console.log("Deleting file:", filePath);
    await Deno.remove(filePath);
    console.log(`File ${filePath} successfully deleted`);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
} 