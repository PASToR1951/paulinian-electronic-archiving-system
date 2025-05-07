import { Route } from "./index.ts";
import { RouterContext } from "../deps.ts";
import { sendApprovedRequestEmail, sendRejectedRequestEmail } from "../services/emailService.ts";
import { DocumentModel } from "../models/documentModel.ts";

/**
 * Send approval email with document attachment
 */
const sendApprovalEmail = async (ctx: RouterContext<any, any, any>) => {
  try {
    const bodyParser = await ctx.request.body({ type: "json" });
    const { email, fullName, documentTitle, documentId } = await bodyParser.value;
    
    console.log(`[EMAIL SERVICE] Processing approval email request for document ID: ${documentId}`);
    console.log(`[EMAIL SERVICE] Request details: recipient=${email}, document="${documentTitle}"`);
    
    // Validate required fields
    if (!email || !documentId) {
      ctx.response.status = 400;
      ctx.response.body = { 
        success: false, 
        message: "Email and documentId are required" 
      };
      return;
    }
    
    // Get the file path from document ID
    console.log(`[EMAIL SERVICE] Retrieving document path for ID: ${documentId}`);
    const documentPath = await DocumentModel.getDocumentPath(documentId);
    
    if (!documentPath) {
      console.error(`[EMAIL SERVICE] Document file not found for ID: ${documentId}`);
      ctx.response.status = 404;
      ctx.response.body = { 
        success: false, 
        message: "Document file not found" 
      };
      return;
    }
    
    console.log(`[EMAIL SERVICE] Found document at path: ${documentPath}`);
    
    // Verify the file exists
    try {
      const fileInfo = await Deno.stat(documentPath);
      console.log(`[EMAIL SERVICE] File verified: ${documentPath} (${fileInfo.size} bytes)`);
    } catch (error) {
      console.error(`[EMAIL SERVICE] ⚠️ Error accessing file: ${documentPath}`, error instanceof Error ? error.message : String(error));
      console.log(`[EMAIL SERVICE] Will attempt to send email anyway, but attachment may fail`);
    }
    
    // Send the email with attachment
    console.log(`[EMAIL SERVICE] Sending approval email with document attachment to ${email}`);
    const success = await sendApprovedRequestEmail(
      email,
      fullName || "User",
      documentTitle || "Requested Document",
      documentPath
    );
    
    if (success) {
      console.log(`[EMAIL SERVICE] ✅ Document successfully sent to ${email}`);
      ctx.response.body = { 
        success: true, 
        message: "Approval email sent successfully",
        documentPath: documentPath,
        recipient: email
      };
    } else {
      console.error(`[EMAIL SERVICE] Failed to send approval email to ${email}`);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        message: "Failed to send approval email" 
      };
    }
  } catch (error: unknown) {
    console.error("Error in sendApprovalEmail:", error instanceof Error ? error.message : String(error));
    ctx.response.status = 500;
    ctx.response.body = { 
      success: false, 
      message: "Server error while sending email", 
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Send rejection email
 */
const sendRejectionEmail = async (ctx: RouterContext<any, any, any>) => {
  try {
    const bodyParser = await ctx.request.body({ type: "json" });
    const { email, fullName, documentTitle, reason } = await bodyParser.value;
    
    // Validate required fields
    if (!email || !reason) {
      ctx.response.status = 400;
      ctx.response.body = { 
        success: false, 
        message: "Email and reason are required" 
      };
      return;
    }
    
    // Send the rejection email
    const success = await sendRejectedRequestEmail(
      email,
      fullName || "User",
      documentTitle || "Requested Document",
      reason
    );
    
    if (success) {
      ctx.response.body = { 
        success: true, 
        message: "Rejection email sent successfully" 
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        message: "Failed to send rejection email" 
      };
    }
  } catch (error: unknown) {
    console.error("Error in sendRejectionEmail:", error);
    ctx.response.status = 500;
    ctx.response.body = { 
      success: false, 
      message: "Server error while sending email", 
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// Export email routes
export const emailRoutes: Route[] = [
  { method: "POST", path: "/api/email/send-approval", handler: sendApprovalEmail },
  { method: "POST", path: "/api/email/send-rejection", handler: sendRejectionEmail },
]; 