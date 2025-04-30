import { createCompiledDocument as createCompiledDocumentService, getCompiledDocument as getCompiledDocumentService, addDocumentToCompilation as addDocumentToCompilationService, removeDocumentFromCompilation as removeDocumentFromCompilationService } from "../services/documentService.ts";

/**
 * Creates a new compiled document
 * @param compiledDoc The compiled document data
 * @param documentIds Array of document IDs to associate with the compiled document
 * @returns The created compiled document ID
 */
export async function createCompiledDocument(
  compiledDoc: {
    start_year?: number;
    end_year?: number;
    volume?: number;
    issue_number?: number;
    department?: string;
    category?: string;
  },
  documentIds: number[]
): Promise<number> {
  return await createCompiledDocumentService(compiledDoc, documentIds);
}

/**
 * Fetches a compiled document by ID
 * @param compiledDocId The compiled document ID
 * @returns The compiled document data
 */
export async function getCompiledDocument(compiledDocId: number): Promise<any> {
  return await getCompiledDocumentService(compiledDocId);
}

/**
 * Adds a document to a compilation
 * @param compiledDocId The compiled document ID
 * @param documentId The document ID to add
 */
export async function addDocumentToCompilation(compiledDocId: number, documentId: number): Promise<void> {
  await addDocumentToCompilationService(compiledDocId, documentId);
}

/**
 * Removes a document from a compilation
 * @param compiledDocId The compiled document ID
 * @param documentId The document ID to remove
 */
export async function removeDocumentFromCompilation(compiledDocId: number, documentId: number): Promise<void> {
  await removeDocumentFromCompilationService(compiledDocId, documentId);
} 