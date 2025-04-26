/**
 * Common JavaScript to be included on all admin pages
 * Handles sidebar loading, authentication checks, and other shared functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Common.js loaded - setting up admin page components');
    
    // Create sidebar and navbar containers if they don't exist
    ensureContainersExist();
    
    // Load sidebar
    loadSidebar();
    
    // Load navbar header
    loadNavbarHeader();
    
    // Check authentication
    checkAuthState();
});

// Ensure the required container elements exist
function ensureContainersExist() {
    // Check for sidebar container
    if (!document.getElementById('side-bar')) {
        console.log('Creating sidebar container');
        const sidebarDiv = document.createElement('div');
        sidebarDiv.id = 'side-bar';
        document.body.insertBefore(sidebarDiv, document.body.firstChild);
    }
    
    // Check for navbar container
    if (!document.getElementById('navbar-header')) {
        console.log('Creating navbar container');
        const navbarDiv = document.createElement('div');
        navbarDiv.id = 'navbar-header';
        // Insert after sidebar
        const sidebar = document.getElementById('side-bar');
        if (sidebar && sidebar.nextSibling) {
            document.body.insertBefore(navbarDiv, sidebar.nextSibling);
        } else {
            document.body.appendChild(navbarDiv);
        }
    }
}

// Try multiple paths when fetching a resource
async function fetchWithFallbacks(paths) {
    let lastError = null;
    
    for (const path of paths) {
        try {
            console.log(`Trying to fetch: ${path}`);
            const response = await fetch(path);
            if (response.ok) {
                console.log(`Successfully fetched: ${path}`);
                return await response.text();
            }
            console.log(`Failed to fetch ${path}: ${response.status}`);
        } catch (error) {
            console.error(`Error fetching ${path}:`, error);
            lastError = error;
        }
    }
    
    // If we get here, all fetches failed
    throw lastError || new Error('Failed to fetch resource from all paths');
}

// Load sidebar content
function loadSidebar() {
    const sidebarContainer = document.getElementById('side-bar');
    if (!sidebarContainer) {
        console.error('Sidebar container not found and could not be created!');
        return;
    }
    
    console.log('Loading sidebar content');
    
    // Try multiple possible paths for the sidebar HTML
    const sidebarPaths = [
        '/admin/Components/side_bar.html',
        '/admin/components/side_bar.html',
        '/Components/side_bar.html',
        '/components/side_bar.html'
    ];
    
    fetchWithFallbacks(sidebarPaths)
        .then(data => {
            // Fix CSS paths in the HTML before inserting it
            data = fixHtmlResourcePaths(data);
            sidebarContainer.innerHTML = data;
            console.log('Sidebar content loaded successfully');
            // Need to make sure links in the sidebar use absolute paths
            fixSidebarLinks();
            // Force load required CSS files
            loadRequiredCssFiles();
            highlightActiveSidebarLink(); // Highlight the current page in the sidebar
        })
        .catch(error => {
            console.error('Error loading sidebar:', error);
            sidebarContainer.innerHTML = '<div class="sidebar-error">Failed to load sidebar</div>';
        });
}

// Fix sidebar links to use absolute paths
function fixSidebarLinks() {
    const sidebarLinks = document.querySelectorAll('#side-bar a');
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('/') && !href.startsWith('http')) {
            // Convert relative link to absolute
            link.setAttribute('href', `/admin/Components/${href}`);
            console.log(`Fixed sidebar link: ${href} -> /admin/Components/${href}`);
        }
    });
}

// Load navbar header content
function loadNavbarHeader() {
    const navbarContainer = document.getElementById('navbar-header');
    if (!navbarContainer) {
        console.error('Navbar container not found and could not be created!');
        return;
    }
    
    console.log('Loading navbar content');
    
    // Try multiple possible paths for the navbar HTML
    const navbarPaths = [
        '/admin/Components/navbar_header.html',
        '/admin/components/navbar_header.html',
        '/Components/navbar_header.html',
        '/components/navbar_header.html'
    ];
    
    fetchWithFallbacks(navbarPaths)
        .then(data => {
            // Fix CSS paths in the HTML before inserting it
            data = fixHtmlResourcePaths(data);
            navbarContainer.innerHTML = data;
            console.log('Navbar content loaded successfully');
            // Force load required CSS files
            loadRequiredCssFiles();
        })
        .catch(error => {
            console.error('Error loading navbar:', error);
            navbarContainer.innerHTML = '<div class="navbar-error">Failed to load navigation</div>';
        });
}

// Fix resource paths in HTML content
function fixHtmlResourcePaths(html) {
    // First, extract and remove any style and link tags from the loaded content
    // so they don't conflict with the ones we already loaded in the main page
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Extract and process all link elements
    const linkElements = tempDiv.querySelectorAll('link[rel="stylesheet"]');
    linkElements.forEach(link => {
        // Get the href
        const href = link.getAttribute('href');
        if (href) {
            // Convert relative paths to absolute
            if (!href.startsWith('/') && !href.startsWith('http')) {
                const absolutePath = `/admin/Components/${href.replace(/^\.\//, '')}`;
                console.log(`Ensuring CSS is loaded: ${absolutePath}`);
                // Instead of changing the link, ensure this CSS is loaded in the main document
                ensureCssIsLoaded(absolutePath);
            } else {
                // For absolute paths, just make sure they're loaded
                ensureCssIsLoaded(href);
            }
        }
        // Remove the link from the content we'll insert
        link.parentNode.removeChild(link);
    });
    
    // Fix remaining relative paths in the HTML content
    // Fix relative CSS paths
    html = tempDiv.innerHTML;
    html = html.replace(/href=\"css\//g, 'href="/admin/Components/css/');
    html = html.replace(/href=\"\.\/css\//g, 'href="/admin/Components/css/');
    
    // Fix relative JS paths
    html = html.replace(/src=\"js\//g, 'src="/admin/Components/js/');
    html = html.replace(/src=\"\.\/js\//g, 'src="/admin/Components/js/');
    
    // Fix relative image paths
    html = html.replace(/src=\"img\//g, 'src="/admin/Components/img/');
    html = html.replace(/src=\"\.\/img\//g, 'src="/admin/Components/img/');
    
    return html;
}

// Make sure a CSS file is loaded in the main document
function ensureCssIsLoaded(href) {
    const normalizedHref = href.toLowerCase();
    // Check if it's already loaded
    const isLoaded = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .some(link => {
            const linkHref = link.getAttribute('href');
            return linkHref && linkHref.toLowerCase() === normalizedHref;
        });
    
    if (!isLoaded) {
        console.log(`Adding missing CSS to document: ${href}`);
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        
        // Add error handling
        link.onerror = function() {
            console.error(`Failed to load CSS: ${href}`);
            // Try alternate paths
            const altPaths = [
                href.replace('/Components/', '/components/'),
                href.replace('/components/', '/Components/'),
                href.replace('/admin/', '/'),
                `/admin/Components/css/${href.split('/').pop()}`
            ];
            
            for (const alt of altPaths) {
                if (alt !== href) {
                    console.log(`Trying alternate CSS path: ${alt}`);
                    ensureCssIsLoaded(alt);
                }
            }
        };
        
        document.head.appendChild(link);
    }
}

// Force load critical CSS files
function loadRequiredCssFiles() {
    const requiredCssFiles = [
        '/admin/Components/css/side_bar.css',
        '/admin/Components/css/navbar_header.css',
        '/admin/Components/css/page_header.css'
    ];
    
    const loadedCssFiles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => link.getAttribute('href'));
    
    requiredCssFiles.forEach(cssFile => {
        // Check if this CSS file is already loaded
        const isLoaded = loadedCssFiles.some(loaded => {
            return loaded && (loaded === cssFile || loaded.toLowerCase() === cssFile.toLowerCase());
        });
        
        if (!isLoaded) {
            console.log(`Force loading CSS file: ${cssFile}`);
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssFile;
            document.head.appendChild(link);
        }
    });
}

// Highlight the current page in the sidebar
function highlightActiveSidebarLink() {
    // Wait a bit to ensure sidebar links are loaded
    setTimeout(() => {
        const currentPage = window.location.pathname;
        const navLinks = document.querySelectorAll('#side-bar a.icon-wrapper');
        
        console.log("Current page:", currentPage);
        
        if (navLinks.length === 0) {
            console.warn('No sidebar links found to highlight');
            return;
        }
        
        navLinks.forEach(link => {
            try {
                const href = new URL(link.href).pathname;
                
                // Check if current page is the same as or a subpage of the link
                if (href === currentPage || 
                    (href !== '/' && currentPage.startsWith(href))) {
                    link.classList.add('active');
                    console.log(`Highlighted link: ${href}`);
                } else {
                    link.classList.remove('active');
                }
            } catch (error) {
                console.error('Error processing sidebar link:', error);
            }
        });
    }, 500); // Delay to ensure sidebar is loaded
}

// Check if user is authenticated
function checkAuthState() {
    // Check for session token cookie
    const sessionToken = getCookie('session_token');
    
    if (!sessionToken) {
        console.warn('No session token found, user might not be authenticated');
        // We won't automatically redirect as this could cause loops
        // Users will be redirected by the server if they try to access protected content
    } else {
        console.log('Session token found, user is authenticated');
    }
}

// Helper function to get a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}
