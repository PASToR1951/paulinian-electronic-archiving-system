/**
 * This script updates all admin HTML pages to directly include the sidebar and navbar content
 * Run this script with: deno run --allow-read --allow-write update_admin_pages.js
 */

// Use path module for cross-platform path handling
import * as path from "https://deno.land/std/path/mod.ts";

// Base admin directory (where this script is located)
const scriptDir = path.dirname(path.fromFileUrl(import.meta.url));
const adminDir = path.dirname(scriptDir); // Parent of Components directory

console.log(`Script directory: ${scriptDir}`);
console.log(`Admin directory: ${adminDir}`);

// Find all HTML files in the admin directory
const htmlFiles = [];

async function findHtmlFiles(dir) {
  for await (const entry of Deno.readDir(dir)) {
    const entryPath = path.join(dir, entry.name);
    
    if (entry.isDirectory) {
      // Skip node_modules and hidden directories
      if (entry.name !== "node_modules" && !entry.name.startsWith(".")) {
        await findHtmlFiles(entryPath);
      }
    } else if (entry.isFile && entry.name.endsWith(".html")) {
      // Skip the component HTML files themselves
      if (entry.name === "side_bar.html" || entry.name === "navbar_header.html") {
        continue;
      }
      htmlFiles.push(entryPath);
    }
  }
}

// Find all HTML files
await findHtmlFiles(adminDir);
console.log(`Found ${htmlFiles.length} HTML files to update`);

// Read sidebar and navbar content
let sidebarContent = "";
let navbarContent = "";

try {
  const sidebarPath = path.join(scriptDir, "side_bar.html");
  sidebarContent = await Deno.readTextFile(sidebarPath);
  console.log(`Loaded sidebar content from ${sidebarPath}`);
  
  // Extract just the nav element from the sidebar HTML
  const sidebarMatch = sidebarContent.match(/<nav class="side-bar"[\s\S]*?<\/nav>/);
  if (sidebarMatch) {
    sidebarContent = sidebarMatch[0];
    console.log("Extracted sidebar nav element");
  } else {
    console.error("Could not extract sidebar nav element");
  }
} catch (error) {
  console.error("Error loading sidebar content:", error);
}

// Create proper navbar header structure
const navbarHeaderStructure = `
  <!-- Navbar header with proper structure -->
  <div class="header">
    <div class="logo">
      <div class="logo-spud" style="background-image: url('/admin/Components/img/logo1.png');"></div>
      
      <div class="content">
        <span class="spud-text">St Paul University Dumaguete</span>
        <p>CARITAS VERITAS SCIENTIA</p> 
      </div>
    </div>
  </div>
`;

// CSS to ensure is included
const requiredCssLinks = `
  <link rel="stylesheet" href="/admin/Components/css/side_bar.css">
  <link rel="stylesheet" href="/admin/Components/css/navbar_header.css">
  <link rel="stylesheet" href="/admin/Components/css/page_header.css">
`;

// Process each HTML file
for (const filePath of htmlFiles) {
  try {
    console.log(`Processing file: ${filePath}`);
    let content = await Deno.readTextFile(filePath);
    
    // Ensure CSS files are included in head
    if (!content.includes("side_bar.css") || !content.includes("navbar_header.css")) {
      content = content.replace(
        "</head>",
        `${requiredCssLinks}\n</head>`
      );
      console.log(`Added CSS links to ${filePath}`);
    }

    // Replace existing sidebar containers with the actual content
    const sidebarPattern = /<div id="side-bar">[\s\S]*?<\/div>/;
    
    if (sidebarContent && content.match(sidebarPattern)) {
      content = content.replace(sidebarPattern, sidebarContent);
      console.log(`Injected sidebar content into ${filePath}`);
    } else if (sidebarContent) {
      // If no sidebar container exists, add the sidebar content at the start of body
      content = content.replace(
        /<body[^>]*>/,
        `$&\n  ${sidebarContent}`
      );
      console.log(`Added sidebar content to ${filePath}`);
    }
    
    // Replace or add navbar header with the proper structure
    const navbarPattern = /<div id="navbar-header">[\s\S]*?<\/div>/;
    const headerPattern = /<div class="header"[\s\S]*?<\/div>/;
    
    if (content.match(headerPattern)) {
      // Replace existing header with proper structure
      content = content.replace(headerPattern, navbarHeaderStructure);
      console.log(`Replaced existing header with proper structure in ${filePath}`);
    } else if (content.match(navbarPattern)) {
      // Replace navbar container with proper header structure
      content = content.replace(navbarPattern, navbarHeaderStructure);
      console.log(`Replaced navbar container with header in ${filePath}`);
    } else if (sidebarContent) {
      // Add header after sidebar
      content = content.replace(
        sidebarContent,
        `${sidebarContent}\n  ${navbarHeaderStructure}`
      );
      console.log(`Added header after sidebar in ${filePath}`);
    }
    
    // Remove any references to common.js since we're not using it anymore
    content = content.replace(
      /<script src=["']\/admin\/Components\/js\/common\.js["']><\/script>\s*/g, 
      ""
    );
    
    // Remove css-loader.js too since we're directly including the CSS
    content = content.replace(
      /<script src=["']\/admin\/Components\/js\/css-loader\.js["']><\/script>\s*/g, 
      ""
    );
    
    // Remove dynamic loading of sidebar and navbar
    content = content.replace(
      /fetch\(['"]\/admin\/Components\/navbar_header\.html['"]\)[\s\S]*?fetch\(['"]\/admin\/Components\/side_bar\.html['"]\)[\s\S]*?<\/script>/,
      "// Sidebar and navbar are now directly included in the HTML\n</script>"
    );
    
    // Fix all relative paths to use absolute paths
    content = content.replace(
      /src=["']\.\/js\//g,
      'src="/admin/Components/js/'
    );
    
    content = content.replace(
      /href=["']\.\/css\//g,
      'href="/admin/Components/css/'
    );
    
    // Write the updated content back to the file
    await Deno.writeTextFile(filePath, content);
    console.log(`Updated ${filePath}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

console.log("All admin HTML files have been updated!");
