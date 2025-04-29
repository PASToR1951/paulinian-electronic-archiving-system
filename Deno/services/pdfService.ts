// PDF Service - Extracts metadata from PDF files

/**
 * Extract metadata from a PDF file
 * @param filePath The path to the PDF file
 * @returns Object containing metadata like abstract, pageCount, etc.
 */
export async function extractPdfMetadata(filePath: string) {
  try {
    console.log(`Attempting to extract metadata from PDF: ${filePath}`);
    
    // For now, we'll use a simple implementation with core Deno functionality
    // In a production environment, you might want to use a more robust PDF library
    
    // Read the first part of the file to extract basic metadata
    // This is a simplified approach - a real PDF parser would be more accurate
    const fileBytes = await Deno.readFile(filePath);
    
    // Convert to text (only looking at the first part where metadata is likely to be)
    // This is a simplified approach and won't work for all PDFs
    let content = "";
    try {
      // Convert first 20KB of the PDF to text - enough for basic metadata
      const decoder = new TextDecoder("utf-8");
      content = decoder.decode(fileBytes.slice(0, 20000));
    } catch (e) {
      console.warn("Could not decode PDF as text:", e);
    }
    
    // Extract page count (very simplified approach)
    const pageCount = estimatePageCount(fileBytes);
    
    // Extract a potential abstract (simplified)
    const abstract = extractAbstract(content);
    
    return {
      abstract: abstract || "No abstract could be extracted automatically.",
      pageCount,
      extractionMethod: "basic",
      extractionSuccess: true
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error extracting PDF metadata:", errorMessage);
    return {
      abstract: "Error extracting metadata from PDF.",
      pageCount: 0,
      extractionMethod: "failed",
      extractionSuccess: false,
      error: errorMessage
    };
  }
}

/**
 * Estimate page count from PDF byte array
 * This is a very simplified approach and may not be accurate for all PDFs
 */
function estimatePageCount(pdfBytes: Uint8Array): number {
  try {
    // Convert to text to search for page patterns
    const decoder = new TextDecoder("utf-8");
    const partialText = decoder.decode(pdfBytes.slice(0, 10000));
    
    // Look for typical patterns that indicate page count
    const pageCountPattern = /\/Count\s+(\d+)/;
    const match = partialText.match(pageCountPattern);
    
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    
    // If no direct count found, estimate based on file size (very rough)
    // ~100KB per page is a rough estimate
    return Math.max(1, Math.floor(pdfBytes.length / 100000));
  } catch (e) {
    console.warn("Error estimating page count:", e);
    return 1; // Default to 1 page
  }
}

/**
 * Extract abstract from PDF text content
 * Very simplified approach that looks for common patterns
 */
function extractAbstract(content: string): string | null {
  try {
    // Look for common patterns that might indicate an abstract
    // Try several approaches
    
    // Approach 1: Look for "Abstract" section
    let abstractRegex = /abstract\s*[\.\:\n\r](.*?)(?:\n\r?\s*\n\r?|\s*introduction)/is;
    let match = content.match(abstractRegex);
    
    if (match && match[1]) {
      let abstract = match[1].trim();
      if (abstract.length > 50) {
        return cleanText(abstract);
      }
    }
    
    // Approach 2: Look for text after title and before introduction
    abstractRegex = /title[\.\:\n\r](.*?)(?:\n\r?\s*\n\r?)(.*?)(?:\s*introduction|chapter|section)/is;
    match = content.match(abstractRegex);
    
    if (match && match[2]) {
      let abstract = match[2].trim();
      if (abstract.length > 50) {
        return cleanText(abstract);
      }
    }
    
    // Approach 3: Just take the first substantial paragraph after any title or header
    const paragraphs = content.split(/\n\r?\s*\n\r?/);
    for (let i = 0; i < Math.min(10, paragraphs.length); i++) {
      const paragraph = paragraphs[i].trim();
      if (paragraph.length > 100 && paragraph.length < 1000 && 
          !paragraph.match(/^(title|table of contents|chapter|section)/i)) {
        return cleanText(paragraph);
      }
    }
    
    return null;
  } catch (e) {
    console.warn("Error extracting abstract:", e);
    return null;
  }
}

/**
 * Clean up extracted text
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E]/g, '') // Remove non-printable ASCII characters
    .trim();
} 