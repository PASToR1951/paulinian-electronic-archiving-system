/**
 * Simple SMTP connection test script
 * Run with: deno run --allow-env --allow-net --allow-read scripts/test-smtp.ts
 */

// Load environment variables
import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
config({ path: "./deno/.env", export: true });

// Import SMTP client
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// Get SMTP configuration from environment variables
const EMAIL_CONFIG = {
  hostname: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
  port: parseInt(Deno.env.get("SMTP_PORT") || "465"),
  username: Deno.env.get("SMTP_USERNAME") || "",
  password: Deno.env.get("SMTP_PASSWORD") || "",
  useTLS: Deno.env.get("SMTP_TLS") !== "false"
};

console.log("📧 SMTP Connection Test");
console.log("-----------------------");
console.log("Host:", EMAIL_CONFIG.hostname);
console.log("Port:", EMAIL_CONFIG.port);
console.log("Username:", EMAIL_CONFIG.username);
console.log("Password:", EMAIL_CONFIG.password ? "****" : "[not set]");
console.log("TLS:", EMAIL_CONFIG.useTLS);
console.log("-----------------------");

// Function to test SMTP connection
async function testSMTPConnection() {
  console.log("🔄 Attempting to connect to SMTP server...");
  
  try {
    // Create SMTP client
    const client = new SMTPClient({
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
    
    console.log("✅ Successfully connected to SMTP server!");
    
    // Ask if user wants to send a test email
    console.log("\nWould you like to send a test email? (Y/n)");
    const response = prompt("Enter Y to send or any other key to exit: ");
    
    if (response?.toLowerCase() === "y") {
      // Ask for recipient email
      const recipient = prompt("Enter recipient email address: ");
      
      if (!recipient) {
        console.log("❌ No recipient provided. Exiting.");
        Deno.exit(1);
      }
      
      console.log(`🔄 Sending test email to ${recipient}...`);
      
      // Send a test email
      await client.send({
        from: EMAIL_CONFIG.username,
        to: recipient,
        subject: "SMTP Test Email",
        content: "This is a test email to verify SMTP configuration.",
        html: "<h1>SMTP Test</h1><p>This is a test email to verify SMTP configuration.</p>"
      });
      
      console.log("✅ Test email sent successfully!");
    } else {
      console.log("ℹ️ Test email skipped.");
    }
    
    // Close client connection
    await client.close();
    
  } catch (error: unknown) {
    console.error("❌ SMTP Connection Failed!");
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("\nTroubleshooting tips:");
    console.error("1. Check if the email and password are correct");
    console.error("2. For Gmail, make sure you've enabled 'Less secure app access' or created an App Password");
    console.error("3. Verify the SMTP host and port settings");
    console.error("4. Check your network connection and firewall settings");
    Deno.exit(1);
  }
}

// Run the test
await testSMTPConnection(); 