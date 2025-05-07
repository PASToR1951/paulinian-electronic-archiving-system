import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// Use the email that worked in GMass test
const EMAIL = "christianjames2212003@gmail.com"; 
const PASSWORD = "gjox pkdu xasv yudj "; // Replace with your actual password

console.log("Initializing SMTP test with:", EMAIL);

let client: SMTPClient | null = null;

try {
  // Initialize client
  client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: EMAIL,
        password: PASSWORD,
      },
    },
  });
  
  console.log("Client initialized successfully");
  console.log("Sending test email...");
  
  // Make sure from and to are properly formatted
  await client.send({
    from: EMAIL, // This should be a valid email address
    to: "officeresearch520@gmail.com",
    subject: "Direct SMTP Test",
    content: "This is a direct test email"
  });
  
  console.log("✅ Success! Email sent");
} catch (error: unknown) {
  console.error("❌ Failed:", error instanceof Error ? error.message : String(error));
  // Additional debug info
  console.error("Check that:");
  console.error("1. The email address format is correct (no spaces, proper @ symbol)");
  console.error("2. The password is correct");
  console.error("3. You've allowed less secure apps or created an App Password");
} finally {
  // Only close the client if it was successfully initialized
  if (client) {
    try {
      await client.close();
      console.log("SMTP connection closed");
    } catch (closeError: unknown) {
      console.error("Error closing connection:", 
        closeError instanceof Error ? closeError.message : String(closeError));
    }
  }
}