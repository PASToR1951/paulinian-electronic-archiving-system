// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sidebar script loaded');
    
    // Get the sidebar container
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        console.error('Sidebar container not found. Make sure an element with id="sidebar-container" exists.');
        return;
    }
    
    fetch('side_bar.html')
    .then(response => response.text())
    .then(data => {
        sidebarContainer.innerHTML = data;
        
        // Find the sidebar element inside the container
        const sideBar = sidebarContainer.querySelector('#side-bar') || sidebarContainer;
        
        // If the sidebar exists, highlight the active link
        if (sideBar) {
            highlightActiveSidebarLink(sideBar);
        }
    })
    .catch(error => console.error('Error loading sidebar:', error));
});

// Highlight active sidebar link
function highlightActiveSidebarLink(sideBar) {
    const currentPage = globalThis.location.pathname;
    // Find links either in the sidebar element or in the document if sidebar not provided
    const navLinks = sideBar ? 
        sideBar.querySelectorAll('a.icon-wrapper') : 
        document.querySelectorAll('#side-bar a.icon-wrapper');
    
    console.log("Current page:", currentPage); // Check the current page URL
    console.log("Sidebar links:", navLinks); // Check the selected links

    navLinks.forEach(link => {
        // Get the pathname from the link's href
        const href = new URL(link.href, globalThis.location.origin).pathname;
        console.log("Link href:", href); // Check the href attribute of each link

        // Skip highlighting for logout link
        if (href === '/logout') {
            link.classList.remove('active');
            return;
        }

        if (href === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Side bar functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Side bar script loaded');
  
  // Setup logout functionality
  setupLogout();
  
  // Initialize prevention on page load
  preventBackNavigation();
});

// Function to prevent back navigation
function preventBackNavigation() {
    // Clear all history entries
    globalThis.history.pushState(null, '', globalThis.location.href);
    
    // Prevent back navigation
    globalThis.addEventListener('popstate', function() {
        globalThis.history.pushState(null, '', globalThis.location.href);
    });
    
    // Disable back button
    globalThis.history.pushState(null, '', globalThis.location.href);
    globalThis.onpopstate = function() {
        globalThis.history.pushState(null, '', globalThis.location.href);
    };
}

// Additional prevention for browser back button
globalThis.addEventListener('beforeunload', function() {
    preventBackNavigation();
});

/**
 * Setup logout functionality
 */
function setupLogout() {
  // Try multiple selectors to find the logout button
  const logoutButton = document.querySelector('.logout-btn') || 
                       document.querySelector('a[href="/logout"]') ||
                       document.querySelector('.icon-wrapper [onclick*="handleLogout"]');
  
  if (logoutButton) {
    // Remove any existing event listeners
    logoutButton.removeEventListener('click', handleLogout);
    // Add fresh event listener
    logoutButton.addEventListener('click', handleLogout);
    console.log('Logout button found and listener attached');
  } else {
    console.warn('Logout button not found');
    // Add a fallback timeout to try again after sidebar is fully loaded
    setTimeout(() => {
      const retryLogoutButton = document.querySelector('.logout-btn') || 
                                document.querySelector('a[href="/logout"]') ||
                                document.querySelector('.icon-wrapper [onclick*="handleLogout"]');
      if (retryLogoutButton) {
        retryLogoutButton.removeEventListener('click', handleLogout);
        retryLogoutButton.addEventListener('click', handleLogout);
        console.log('Logout button found on retry and listener attached');
      }
    }, 1000);
  }
}

function handleLogout(event) {
  event.preventDefault();
  console.log("Logout function called");
  
  // Clear client-side storage first
  try {
    localStorage.clear();
    console.log("Cleared localStorage");
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    console.log("Cleared cookies");
  } catch (e) {
    console.error("Error clearing client storage:", e);
  }
  
  // Call the logout endpoint
  fetch('/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log("Logout response status:", response.status);
    // Always redirect to index page
    globalThis.location.href = '/index.html';
  })
  .catch(error => {
    console.error("Error during logout:", error);
    // Still redirect to index page even if fetch fails
    globalThis.location.href = '/index.html';
  });
}

// Export the function for use in other files
globalThis.handleLogout = handleLogout;