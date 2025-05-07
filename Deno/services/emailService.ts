/**
 * Email Service
 * Handles sending emails, including those with attachments
 */

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { ensureDir } from "https://deno.land/std@0.190.0/fs/ensure_dir.ts";

// Email configuration using environment variables with fallbacks to working credentials
const EMAIL_CONFIG = {
  hostname: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
  port: parseInt(Deno.env.get("SMTP_PORT") || "465"),
  // Use hardcoded working credentials if environment variables aren't found
  username: Deno.env.get("SMTP_USERNAME") || "christianjames2212003@gmail.com",
  password: Deno.env.get("SMTP_PASSWORD") || "gjox pkdu xasv yudj",
  useTLS: Deno.env.get("SMTP_TLS") !== "false"    // True by default
};

// Log current email configuration (with password masked)
console.log("[EMAIL CONFIG] Host:", EMAIL_CONFIG.hostname);
console.log("[EMAIL CONFIG] Port:", EMAIL_CONFIG.port);
console.log("[EMAIL CONFIG] Username:", EMAIL_CONFIG.username);
console.log("[EMAIL CONFIG] Password set:", EMAIL_CONFIG.password ? "Yes" : "No");
console.log("[EMAIL CONFIG] TLS enabled:", EMAIL_CONFIG.useTLS);

// Log a warning if credentials are missing
if (!EMAIL_CONFIG.username || !EMAIL_CONFIG.password) {
  console.warn("WARNING: Email credentials not configured. Set SMTP_USERNAME and SMTP_PASSWORD environment variables.");
}

// Initialize SMTP client
let smtpClient: SMTPClient | null = null;

/**
 * Initializes the SMTP client with the provided configuration
 */
function initializeClient() {
  if (!smtpClient) {
    try {
      smtpClient = new SMTPClient({
        connection: {
          hostname: EMAIL_CONFIG.hostname,
          port: EMAIL_CONFIG.port,
          tls: EMAIL_CONFIG.useTLS,
          auth: {
            username: EMAIL_CONFIG.username,
            password: EMAIL_CONFIG.password,
          },
        },
      });
      console.log("SMTP client initialized");
    } catch (error) {
      console.error("Error initializing SMTP client:", error);
      throw error;
    }
  }
}

/**
 * Logs email activity to a file for tracking purposes
 * @param action The action being performed
 * @param details Details about the email
 */
async function logEmailActivity(action: string, details: Record<string, any>): Promise<void> {
  try {
    // Ensure logs directory exists
    await ensureDir("./logs");
    
    const now = new Date();
    const timestamp = now.toISOString();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Create a log entry
    const logEntry = {
      timestamp,
      action,
      ...details
    };
    
    // Format log message
    const logMessage = JSON.stringify(logEntry) + "\n";
    
    // Append to daily log file
    const logFile = `./logs/email-activity-${date}.log`;
    
    await Deno.writeTextFile(logFile, logMessage, { append: true })
      .catch(async (err) => {
        // If file doesn't exist, create it
        if (err instanceof Deno.errors.NotFound) {
          await Deno.writeTextFile(logFile, logMessage);
        } else {
          throw err;
        }
      });
      
    console.log(`[SMTP] Activity logged to ${logFile}`);
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error("[SMTP] Error logging activity:", error);
  }
}

/**
 * Sends an email with an attachment
 * @param to Recipient email address
 * @param subject Email subject
 * @param text Plain text content
 * @param html HTML content (optional)
 * @param filePath Path to the file to attach (optional)
 * @param fileName Name to display for the attachment (optional)
 * @returns Promise that resolves when the email is sent
 */
export async function sendEmailWithAttachment(
  to: string,
  subject: string,
  text: string,
  html?: string,
  filePath?: string,
  fileName?: string
): Promise<boolean> {
  try {
    console.log(`[SMTP] Initializing email client for sending to: ${to}`);
    initializeClient();
    
    if (!smtpClient) {
      console.error("[SMTP] Failed to initialize SMTP client");
      return false;
    }
    
    // Build email content
    const message: any = {
      from: EMAIL_CONFIG.username,
      to: to,
      subject: subject,
      content: text
    };
    
    // Add HTML content if provided
    if (html) {
      message.html = html;
    }
    
    // Add attachment if provided
    if (filePath) {
      try {
        console.log(`[SMTP] 📎 Attempting to attach file from path: ${filePath}`);
        const fileContent = await Deno.readFile(filePath);
        const attachmentName = fileName || filePath.split('/').pop() || 'attachment';
        
        const fileSize = fileContent.length;
        console.log(`[SMTP] File read successfully - Size: ${fileSize} bytes, Using name: ${attachmentName}`);
        
        message.attachments = [{
          filename: attachmentName,
          content: fileContent
        }];
        
        console.log(`[SMTP] Attachment added to email (${fileSize} bytes)`);
      } catch (fileError) {
        console.error(`[SMTP] ❌ Error reading attachment file ${filePath}:`, fileError);
        // Continue sending email without attachment
        console.log(`[SMTP] Will continue sending email without attachment`);
      }
    }
    
    // Send the email
    console.log(`[SMTP] Sending email to ${to} with subject "${subject}"${filePath ? ' including attachment' : ''}`);
    await smtpClient.send(message);
    console.log(`[SMTP] ✅ Email successfully sent to ${to} with subject "${subject}"`);
    return true;
  } catch (error) {
    console.error("[SMTP] Error sending email:", error);
    return false;
  }
}

/**
 * Sends an email notification when a document request is approved with the document attached
 * @param email Recipient email
 * @param fullName Recipient's name
 * @param documentTitle Title of the document
 * @param documentFilePath Path to the document file
 * @returns Promise resolving to boolean indicating success
 */
export async function sendApprovedRequestEmail(
  email: string,
  fullName: string,
  documentTitle: string,
  documentFilePath: string
): Promise<boolean> {
  console.log(`[SMTP] Preparing approval email for document: "${documentTitle}"`);
  console.log(`[SMTP] Document path: ${documentFilePath}`);
  
  // Log the beginning of this activity
  await logEmailActivity("DOCUMENT_APPROVAL_START", {
    recipient: email,
    recipient_name: fullName,
    document: documentTitle,
    document_path: documentFilePath
  });
  
  const subject = `Your request for "${documentTitle}" has been approved`;
  
  const text = `
Dear ${fullName},

We are pleased to inform you that your request to access "${documentTitle}" has been approved.

The document you requested is attached to this email. Please note that this document is subject to our usage policies and should not be redistributed without permission.

If you have any questions or need further assistance, please don't hesitate to contact us.

Thank you for using our electronic archiving system.

Best regards,
Paulinian Electronic Archiving System
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #047857; color: white; padding: 10px 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Document Request Approved</h2>
    </div>
    <div class="content">
      <p>Dear ${fullName},</p>
      <p>We are pleased to inform you that your request to access <strong>"${documentTitle}"</strong> has been approved.</p>
      <p>The document you requested is attached to this email. Please note that this document is subject to our usage policies and should not be redistributed without permission.</p>
      <p>If you have any questions or need further assistance, please don't hesitate to contact us.</p>
      <p>Thank you for using our electronic archiving system.</p>
      <p>Best regards,<br>Paulinian Electronic Archiving System</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

  try {
    // Check if file exists before sending
    let fileSize = 0;
    try {
      const fileInfo = await Deno.stat(documentFilePath);
      fileSize = fileInfo.size;
      console.log(`[SMTP] Verified document exists: ${documentFilePath} (${fileInfo.size} bytes)`);
    } catch (error) {
      console.error(`[SMTP] ⚠️ Warning: Could not verify document existence: ${documentFilePath}`, error);
      
      // Log file not found
      await logEmailActivity("DOCUMENT_NOT_FOUND", {
        recipient: email,
        document: documentTitle,
        document_path: documentFilePath,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    const result = await sendEmailWithAttachment(
      email,
      subject,
      text,
      html,
      documentFilePath
    );
    
    // Log the result
    if (result) {
      console.log(`[SMTP] ✅ Approval email with document successfully sent to ${email}`);
      
      // Log success
      await logEmailActivity("DOCUMENT_SENT_SUCCESS", {
        recipient: email,
        recipient_name: fullName,
        document: documentTitle,
        document_path: documentFilePath,
        file_size: fileSize
      });
    } else {
      console.error(`[SMTP] ❌ Failed to send approval email to ${email}`);
      
      // Log failure
      await logEmailActivity("DOCUMENT_SENT_FAILURE", {
        recipient: email,
        document: documentTitle,
        document_path: documentFilePath,
        error: "Email sending failed"
      });
    }
    
    return result;
  } catch (error) {
    console.error(`[SMTP] Error in sendApprovedRequestEmail:`, error);
    
    // Log error
    await logEmailActivity("DOCUMENT_SENT_ERROR", {
      recipient: email,
      document: documentTitle,
      document_path: documentFilePath,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return false;
  }
}

/**
 * Sends an email notification when a document request is rejected
 * @param email Recipient email
 * @param fullName Recipient's name
 * @param documentTitle Title of the document
 * @param reason Reason for rejection
 * @returns Promise resolving to boolean indicating success
 */
export async function sendRejectedRequestEmail(
  email: string,
  fullName: string,
  documentTitle: string,
  reason: string
): Promise<boolean> {
  const subject = `Your request for "${documentTitle}" has been rejected`;
  
  const text = `
Dear ${fullName},

We regret to inform you that your request to access "${documentTitle}" has been rejected.

Reason for rejection: ${reason}

If you have any questions or believe this was in error, please contact our administration.

Thank you for your understanding.

Best regards,
Paulinian Electronic Archiving System
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 10px 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
    .reason { background-color: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Document Request Rejected</h2>
    </div>
    <div class="content">
      <p>Dear ${fullName},</p>
      <p>We regret to inform you that your request to access <strong>"${documentTitle}"</strong> has been rejected.</p>
      <div class="reason">
        <p><strong>Reason for rejection:</strong><br>${reason}</p>
      </div>
      <p>If you have any questions or believe this was in error, please contact our administration.</p>
      <p>Thank you for your understanding.</p>
      <p>Best regards,<br>Paulinian Electronic Archiving System</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

  return await sendEmailWithAttachment(
    email,
    subject,
    text,
    html
  );
} 