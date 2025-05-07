import { client } from "../db/denopost_conn.ts";

export interface DocumentRequest {
    id?: number;
    document_id: string;
    full_name: string;
    email: string;
    affiliation: string;
    reason: string;
    reason_details: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: Date;
    updated_at: Date;
    reviewed_by?: string;
    reviewed_at?: Date;
    review_notes?: string;
    // Joined document properties
    book_title?: string;
    author_name?: string;
    volume?: string;
}

export class DocumentRequestModel {
    constructor() {}

    // Create a new document request
    async create(request: Omit<DocumentRequest, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<DocumentRequest> {
        const now = new Date();
        const result = await client.queryObject(
            `INSERT INTO document_requests 
            (document_id, full_name, email, affiliation, reason, reason_details, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $7)
            RETURNING *`,
            [
                request.document_id,
                request.full_name,
                request.email,
                request.affiliation,
                request.reason,
                request.reason_details,
                now
            ]
        );
        return result.rows[0] as DocumentRequest;
    }

    // Get all document requests
    async getAll(): Promise<DocumentRequest[]> {
        const result = await client.queryObject(
            `SELECT 
                dr.*,
                d.title as book_title,
                d.volume as volume,
                a.full_name as author_name
            FROM document_requests dr
            LEFT JOIN documents d ON dr.document_id = d.id::text
            LEFT JOIN LATERAL (
                SELECT a.full_name, da.document_id
                FROM document_authors da
                JOIN authors a ON da.author_id = a.id
                WHERE da.document_id = d.id
                ORDER BY da.author_order
                LIMIT 1
            ) a ON true
            ORDER BY dr.created_at DESC`
        );
        return result.rows as DocumentRequest[];
    }

    // Get requests by status
    async getByStatus(status: DocumentRequest['status']): Promise<DocumentRequest[]> {
        const result = await client.queryObject(
            `SELECT 
                dr.*,
                d.title as book_title,
                d.volume as volume,
                a.full_name as author_name
            FROM document_requests dr
            LEFT JOIN documents d ON dr.document_id = d.id::text
            LEFT JOIN LATERAL (
                SELECT a.full_name, da.document_id
                FROM document_authors da
                JOIN authors a ON da.author_id = a.id
                WHERE da.document_id = d.id
                ORDER BY da.author_order
                LIMIT 1
            ) a ON true
            WHERE dr.status = $1
            ORDER BY dr.created_at DESC`,
            [status]
        );
        return result.rows as DocumentRequest[];
    }

    // Get requests for a specific document
    async getByDocumentId(documentId: string): Promise<DocumentRequest[]> {
        const result = await client.queryObject(
            `SELECT 
                dr.*,
                d.title as book_title,
                d.volume as volume,
                a.full_name as author_name
            FROM document_requests dr
            LEFT JOIN documents d ON dr.document_id = d.id::text
            LEFT JOIN LATERAL (
                SELECT a.full_name, da.document_id
                FROM document_authors da
                JOIN authors a ON da.author_id = a.id
                WHERE da.document_id = d.id
                ORDER BY da.author_order
                LIMIT 1
            ) a ON true
            WHERE dr.document_id = $1
            ORDER BY dr.created_at DESC`,
            [documentId]
        );
        return result.rows as DocumentRequest[];
    }

    // Get a single request by ID
    async getById(id: number): Promise<DocumentRequest | null> {
        const result = await client.queryObject(
            `SELECT 
                dr.*,
                d.title as book_title,
                d.volume as volume,
                a.full_name as author_name
            FROM document_requests dr
            LEFT JOIN documents d ON dr.document_id = d.id::text
            LEFT JOIN LATERAL (
                SELECT a.full_name, da.document_id
                FROM document_authors da
                JOIN authors a ON da.author_id = a.id
                WHERE da.document_id = d.id
                ORDER BY da.author_order
                LIMIT 1
            ) a ON true
            WHERE dr.id = $1`,
            [id]
        );
        return result.rows[0] as DocumentRequest || null;
    }

    // Update request status
    async updateStatus(
        id: number,
        status: DocumentRequest['status'],
        reviewedBy: string,
        reviewNotes?: string
    ): Promise<boolean> {
        const result = await client.queryObject(
            `UPDATE document_requests 
            SET status = $1, 
                reviewed_by = $2, 
                reviewed_at = $3, 
                review_notes = $4,
                updated_at = $3
            WHERE id = $5
            RETURNING id`,
            [status, reviewedBy, new Date(), reviewNotes, id]
        );
        return (result.rowCount ?? 0) > 0;
    }

    // Delete a request
    async delete(id: number): Promise<boolean> {
        const result = await client.queryObject(
            `DELETE FROM document_requests WHERE id = $1`,
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    }

    // Check if user has an approved request for a document
    async hasApprovedRequest(documentId: string, email: string): Promise<boolean> {
        const result = await client.queryObject(
            `SELECT id FROM document_requests 
            WHERE document_id = $1 
            AND email = $2 
            AND status = 'approved'`,
            [documentId, email]
        );
        return (result.rowCount ?? 0) > 0;
    }
} 