/**
 * Command-line tool to view email activity logs
 * 
 * Run with: deno run --allow-read scripts/view-email-logs.ts [date]
 * Where [date] is an optional date in YYYY-MM-DD format (defaults to today)
 */

const LOGS_DIR = "./logs";

// Get date parameter or use today
const dateParam = Deno.args[0];
const date = dateParam || new Date().toISOString().split('T')[0];

// Validate date format
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`❌ Invalid date format. Please use YYYY-MM-DD format.`);
  Deno.exit(1);
}

// Construct log file path
const logFile = `${LOGS_DIR}/email-activity-${date}.log`;

console.log(`📋 Viewing email activity logs for ${date}\n`);

try {
  // Check if file exists
  try {
    await Deno.stat(logFile);
  } catch (error) {
    console.error(`❌ No log file found for ${date}`);
    Deno.exit(1);
  }
  
  // Read log file
  const logContent = await Deno.readTextFile(logFile);
  
  // Parse and display logs
  const logEntries = logContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
  
  // Filter for document sending activities
  const documentActivities = logEntries.filter(entry => 
    entry.action.startsWith('DOCUMENT_')
  );
  
  if (documentActivities.length === 0) {
    console.log(`ℹ️ No document email activities found for ${date}`);
    Deno.exit(0);
  }
  
  console.log(`📄 Found ${documentActivities.length} document email activities:\n`);
  
  // Display document activities in a formatted way
  documentActivities.forEach((entry, index) => {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    
    console.log(`📝 Activity #${index + 1} - ${time}`);
    console.log(`   Action: ${entry.action}`);
    
    if (entry.recipient) {
      console.log(`   Recipient: ${entry.recipient_name || ''} <${entry.recipient}>`);
    }
    
    if (entry.document) {
      console.log(`   Document: "${entry.document}"`);
    }
    
    if (entry.document_path) {
      console.log(`   Path: ${entry.document_path}`);
    }
    
    if (entry.file_size !== undefined) {
      console.log(`   File Size: ${formatFileSize(entry.file_size)}`);
    }
    
    if (entry.error) {
      console.log(`   Error: ${entry.error}`);
    }
    
    console.log();
  });
  
  // Display success/failure summary
  const successful = documentActivities.filter(e => e.action === 'DOCUMENT_SENT_SUCCESS').length;
  const failed = documentActivities.filter(e => 
    e.action === 'DOCUMENT_SENT_FAILURE' || e.action === 'DOCUMENT_SENT_ERROR'
  ).length;
  
  console.log(`📊 Summary:`);
  console.log(`   Total document activities: ${documentActivities.length}`);
  console.log(`   Successfully sent: ${successful}`);
  console.log(`   Failed to send: ${failed}`);
  
} catch (error: unknown) {
  console.error(`❌ Error reading log file: ${error instanceof Error ? error.message : String(error)}`);
  Deno.exit(1);
}

/**
 * Format file size in a human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
} 