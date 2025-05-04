// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sidebar script loaded');
    
    // Get the sidebar container
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        console.error('Sidebar container not found. Make sure an element with id="sidebar-container" exists.');
        return;
    }
    
    // Use absolute path to fetch sidebar HTML
    fetch('/admin/Components/side_bar.html')
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
  
  // Show loading popup
  const loadingPopup = document.createElement('div');
  loadingPopup.style.position = 'fixed';
  loadingPopup.style.top = '0';
  loadingPopup.style.left = '0';
  loadingPopup.style.width = '100%';
  loadingPopup.style.height = '100%';
  loadingPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  loadingPopup.style.display = 'flex';
  loadingPopup.style.justifyContent = 'center';
  loadingPopup.style.alignItems = 'center';
  loadingPopup.style.zIndex = '9999';
  
  const loadingContent = document.createElement('div');
  loadingContent.style.backgroundColor = 'white';
  loadingContent.style.padding = '20px';
  loadingContent.style.borderRadius = '10px';
  loadingContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
  loadingContent.style.display = 'flex';
  loadingContent.style.flexDirection = 'column';
  loadingContent.style.alignItems = 'center';
  loadingContent.style.gap = '15px';
  
  const spinner = document.createElement('div');
  spinner.style.width = '40px';
  spinner.style.height = '40px';
  spinner.style.border = '4px solid #f3f3f3';
  spinner.style.borderTop = '4px solid #10B981'; // Use primary green color
  spinner.style.borderRadius = '50%';
  spinner.style.animation = 'spin 1s linear infinite';
  
  // Add the animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  const loadingText = document.createElement('p');
  loadingText.textContent = 'Logging out...';
  loadingText.style.margin = '0';
  loadingText.style.fontFamily = 'Inter, sans-serif';
  loadingText.style.color = '#4b5563';
  
  loadingContent.appendChild(spinner);
  loadingContent.appendChild(loadingText);
  loadingPopup.appendChild(loadingContent);
  document.body.appendChild(loadingPopup);
  
  // Get the session token before clearing storage
  let sessionToken = null;
  
  // First check localStorage for session token
  try {
    sessionToken = localStorage.getItem('session_token');
    if (sessionToken) {
      console.log("Found session token in localStorage");
    }
  } catch (e) {
    console.error("Error accessing localStorage:", e);
  }
  
  // If not in localStorage, check cookies as fallback
  if (!sessionToken) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith('session_token=')) {
        sessionToken = cookie.substring('session_token='.length);
        console.log("Found session token in cookies");
        break;
      }
    }
  }
  
  // Double-check that token is a valid string
  if (sessionToken !== null && (typeof sessionToken !== 'string' || sessionToken.trim() === '')) {
    console.log("Invalid token format, setting to null");
    sessionToken = null;
  } else if (sessionToken) {
    console.log("Valid session token found for logout");
  }
  
  // Clear client-side storage 
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
  
  // Call the logout endpoint with the token if available
  fetch('/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
    }
  })
  .then(response => {
    console.log("Logout response status:", response.status);
    // Wait a moment to show the loading animation
    setTimeout(() => {
      // Remove loading popup
      document.body.removeChild(loadingPopup);
      // Redirect to entry/index page
      window.location.href = '/';
    }, 1000);
  })
  .catch(error => {
    console.error("Error during logout:", error);
    // Remove loading popup
    document.body.removeChild(loadingPopup);
    // Still redirect to entry/index page even if fetch fails
    window.location.href = '/';
  });
}

// Export the function for use in other files
globalThis.handleLogout = handleLogout;
window.handleLogout = handleLogout; // Make sure it's available on the window object for direct onclick handlers