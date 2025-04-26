fetch('side_bar.html')
.then(response => response.text())
.then(data => {
    document.getElementById('side-bar').innerHTML = data;
    highlightActiveSidebarLink(); // Call the function after sidebar is injected
})
.catch(error => console.error('Error loading sidebar:', error));

// Highlight active sidebar link
function highlightActiveSidebarLink() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('#side-bar a.icon-wrapper');
    
    console.log("Current page:", currentPage); // Check the current page URL
    console.log("Sidebar links:", navLinks); // Check the selected links

    navLinks.forEach(link => {
        const href = new URL(link.href).pathname;
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
    window.history.pushState(null, '', window.location.href);
    
    // Prevent back navigation
    window.addEventListener('popstate', function() {
        window.history.pushState(null, '', window.location.href);
    });
    
    // Disable back button
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = function() {
        window.history.pushState(null, '', window.location.href);
    };
}

// Additional prevention for browser back button
window.addEventListener('beforeunload', function() {
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
    window.location.href = '/index.html';
  })
  .catch(error => {
    console.error("Error during logout:", error);
    // Still redirect to index page even if fetch fails
    window.location.href = '/index.html';
  });
}

// Export the function for use in other files
window.handleLogout = handleLogout;