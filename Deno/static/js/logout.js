/**
 * Redirecting to the new script location
 * This file exists to support backward compatibility
 */

console.log('Logout.js: Redirecting to new script location');

// Dynamically load the side_bar.js script
const script = document.createElement('script');
script.src = '/admin/Components/js/side_bar.js';
script.type = 'text/javascript';
document.head.appendChild(script);

/**
 * Logout functionality
 * Handles the user logout process
 */

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

function handleLogout(event) {
  event.preventDefault();
  
  console.log("Logout function called");
  
  // Call the logout endpoint
  fetch('/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.ok || response.status === 200) {
      console.log("Logout successful");
      // Redirect to login page
      window.location.href = '/login.html';
    } else {
      console.error("Logout failed:", response.statusText);
      alert("Failed to logout. Please try again.");
    }
  })
  .catch(error => {
    console.error("Error during logout:", error);
    alert("An error occurred during logout. Please try again.");
  });
}

// Initialize prevention on page load
window.addEventListener('load', preventBackNavigation);

// Additional prevention for browser back button
window.addEventListener('beforeunload', function() {
    preventBackNavigation();
});

// Export the function for use in other files
window.handleLogout = handleLogout; 