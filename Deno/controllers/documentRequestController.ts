import { RouterContext } from "../deps.ts";
import { DocumentRequestModel, DocumentRequest } from "../models/documentRequestModel.ts";
import { DocumentModel } from "../models/documentModel.ts";

export class DocumentRequestController {
    private documentRequestModel: DocumentRequestModel;

    constructor(documentRequestModel: DocumentRequestModel) {
        this.documentRequestModel = documentRequestModel;
    }

    // Create a new document request
    async createRequest(ctx: RouterContext<any, any, any>) {
        try {
            const body = ctx.request.body();
            const requestData = await body.value;

            // Validate required fields
            const requiredFields = ['document_id', 'full_name', 'email', 'affiliation', 'reason', 'reason_details'];
            for (const field of requiredFields) {
                if (!requestData[field]) {
                    ctx.response.status = 400;
                    ctx.response.body = { error: `Missing required field: ${field}` };
                    return;
                }
            }

            // Check if document exists
            const document = await DocumentModel.getById(parseInt(requestData.document_id));
            if (!document) {
                ctx.response.status = 404;
                ctx.response.body = { error: 'Document not found' };
                return;
            }

            // Create the request
            const request = await this.documentRequestModel.create(requestData);
            
            ctx.response.status = 201;
            ctx.response.body = request;
        } catch (error) {
            console.error('Error creating document request:', error);
            ctx.response.status = 500;
            ctx.response.body = { error: 'Internal server error' };
        }
    }

    // Get all document requests (admin only)
    async getAllRequests(ctx: RouterContext<any, any, any>) {
        try {
            const requests = await this.documentRequestModel.getAll();
            ctx.response.body = requests;
        } catch (error) {
            console.error('Error getting document requests:', error);
            ctx.response.status = 500;
            ctx.response.body = { error: 'Internal server error' };
        }
    }

    // Get requests by status (admin only)
    async getRequestsByStatus(ctx: RouterContext<any, any, any>) {
        try {
            const status = ctx.params?.status;
            if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
                ctx.response.status = 400;
                ctx.response.body = { error: 'Invalid status' };
                return;
            }

            const requests = await this.documentRequestModel.getByStatus(status as 'pending' | 'approved' | 'rejected');
            ctx.response.body = requests;
        } catch (error) {
            console.error('Error getting document requests by status:', error);
            ctx.response.status = 500;
            ctx.response.body = { error: 'Internal server error' };
        }
    }

    // Get requests for a specific document
    async getRequestsByDocumentId(ctx: RouterContext<any, any, any>) {
        try {
            const documentId = ctx.params?.documentId;
            if (!documentId) {
                ctx.response.status = 400;
                ctx.response.body = { error: 'Document ID is required' };
                return;
            }

            const requests = await this.documentRequestModel.getByDocumentId(documentId);
            ctx.response.body = requests;
        } catch (error) {
            console.error('Error getting document requests:', error);
            ctx.response.status = 500;
            ctx.response.body = { error: 'Internal server error' };
        }
    }

    // Update request status (admin only)
    async updateRequestStatus(ctx: RouterContext<any, any, any>) {
        try {
            const requestId = ctx.params?.id;
            const body = ctx.request.body();
            const { status, reviewedBy, reviewNotes } = await body.value;

            if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
                ctx.response.status = 400;
                ctx.response.body = { error: 'Invalid status' };
                return;
            }

            if (!reviewedBy) {
                ctx.response.status = 400;
                ctx.response.body = { error: 'Reviewer information is required' };
                return;
            }

            const success = await this.documentRequestModel.updateStatus(
                requestId,
                status as 'pending' | 'approved' | 'rejected',
                reviewedBy,
                reviewNotes
            );

            if (!success) {
                ctx.response.status = 404;
                ctx.response.body = { error: 'Request not found' };
                return;
            }

            ctx.response.body = { message: 'Request status updated successfully' };
        } catch (error) {
            console.error('Error updating request status:', error);
            ctx.response.status = 500;
            ctx.response.body = { error: 'Internal server error' };
        }
    }

    // Delete a request (admin only)
    async deleteRequest(ctx: RouterContext<any, any, any>) {
        try {
            const requestId = ctx.params?.id;
            const success = await this.documentRequestModel.delete(requestId);

            if (!success) {
                ctx.response.status = 404;
                ctx.response.body = { error: 'Request not found' };
                return;
            }

            ctx.response.body = { message: 'Request deleted successfully' };
        } catch (error) {
            console.error('Error deleting request:', error);
            ctx.response.status = 500;
            ctx.response.body = { error: 'Internal server error' };
        }
    }

    // Check if user has access to a document
    async checkDocumentAccess(ctx: RouterContext<any, any, any>) {
        try {
            const documentId = ctx.params?.documentId;
            const email = ctx.request.url.searchParams.get('email');

            // First check if the document is public
            const document = await DocumentModel.getById(parseInt(documentId || '0'));
            if (!document) {
                ctx.response.status = 404;
                ctx.response.body = { error: 'Document not found' };
                return;
            }

            // If document is public, allow access
            if (document.is_public) {
                ctx.response.body = { hasAccess: true };
                return;
            }

            // If no email provided, treat as guest user
            if (!email) {
                ctx.response.body = { hasAccess: false };
                return;
            }

            // Check if user has an approved request
            const hasAccess = await this.documentRequestModel.hasApprovedRequest(documentId || '', email);
            ctx.response.body = { hasAccess };
        } catch (error) {
            console.error('Error checking document access:', error);
            ctx.response.status = 500;
            ctx.response.body = { error: 'Internal server error' };
        }
    }
} 