// Simple file upload service

import { ensureDir, extname, join } from "../deps.ts";
import { createFile } from "../controllers/fileController.ts";

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
    
    // Get the file content - enhanced to handle more formats
    let fileContent;
    if (file.content) {
      // Direct content access (byte array or Uint8Array)
      fileContent = file.content;
    } else if (file.bytes) {
      // Some APIs provide a bytes property
      fileContent = file.bytes;
    } else if (file.path) {
      // If it's a temporary file with a path (from multipart form)
      try {
        fileContent = await Deno.readFile(file.path);
      } catch (pathError) {
        console.error("Error reading file from path:", pathError);
        throw new Error(`Could not read temporary file: ${pathError.message}`);
      }
    } else if (file.arrayBuffer) {
      // If it's a File object with arrayBuffer method
      try {
        const buffer = await file.arrayBuffer();
        fileContent = new Uint8Array(buffer);
      } catch (bufferError) {
        console.error("Error processing array buffer:", bufferError);
        throw new Error(`Could not process file buffer: ${bufferError.message}`);
      }
    } else if (file instanceof Uint8Array || file instanceof ArrayBuffer) {
      // Direct binary data
      fileContent = file instanceof ArrayBuffer ? new Uint8Array(file) : file;
    } else if (typeof file === 'string' && file.startsWith('data:')) {
      // Handle data URI format
      try {
        const base64String = file.split(',')[1];
        fileContent = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
      } catch (dataUriError) {
        console.error("Error processing data URI:", dataUriError);
        throw new Error(`Invalid data URI format: ${dataUriError.message}`);
      }
    } else {
      console.error("Unsupported file format:", file);
      throw new Error("Unsupported file object format. File must contain a path, arrayBuffer method, content, or bytes property.");
    }
    
    if (!fileContent || fileContent.length === 0) {
      throw new Error("File content is empty");
    }
    
    // Write the file to disk
    await Deno.writeFile(filePath, fileContent);
    
    console.log(`File successfully saved to ${filePath}`);
    
    // Get file size
    let fileSize = 0;
    try {
      const fileInfo = await Deno.stat(filePath);
      fileSize = fileInfo.size;
      console.log(`File size: ${fileSize} bytes`);
    } catch (statError) {
      console.warn(`Warning: Could not get file size: ${statError.message}`);
    }
    
    // Return file information without creating a database record
    return {
      path: filePath,
      name: file.name || uniqueName,
      size: fileSize,
      type: file.type || getMimeTypeFromExtension(fileExt)
    };
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

/**
 * Get MIME type from file extension
 * @param extension File extension with dot (e.g., ".pdf")
 * @returns MIME type string or application/octet-stream if unknown
 */
function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
} 