/**
 * CSS Loader script - ensures all required CSS files are loaded with fallbacks
 */

document.addEventListener('DOMContentLoaded', function() {
    // Common CSS files needed for admin pages
    const requiredCssFiles = [
        '/admin/Components/css/side_bar.css',
        '/admin/Components/css/navbar_header.css',
        '/admin/Components/css/page_header.css'
    ];
    
    // Check if each CSS file is already loaded
    const loadedStylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => link.getAttribute('href'));
    
    // Load any missing CSS files
    requiredCssFiles.forEach(cssFile => {
        // Convert to lowercase for case-insensitive comparison
        const cssLower = cssFile.toLowerCase();
        const isLoaded = loadedStylesheets.some(loaded => {
            return loaded && loaded.toLowerCase() === cssLower;
        });
        
        if (!isLoaded) {
            console.log(`Loading missing CSS file: ${cssFile}`);
            loadCssFile(cssFile);
        }
    });
});

// Helper function to load a CSS file
function loadCssFile(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    
    // Add error handling
    link.onerror = function() {
        console.error(`Failed to load CSS: ${href}`);
        // Try alternate path with different casing
        const altHref = href.replace('/Components/', '/components/');
        if (altHref !== href) {
            console.log(`Trying alternate CSS path: ${altHref}`);
            loadCssFile(altHref);
        }
    };
    
    document.head.appendChild(link);
}
