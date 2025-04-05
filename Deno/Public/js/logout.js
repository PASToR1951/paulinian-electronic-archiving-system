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

async function handleLogout(event) {
    event.preventDefault();
    try {
        // Clear all stored data
        localStorage.clear();
        sessionStorage.clear();
        
        // Remove any cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });

        // Call the logout endpoint
        const response = await fetch('/logout', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Force redirect to index
            window.location.replace('/index.html');
        } else {
            console.error('Logout failed');
            window.location.replace('/index.html');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        window.location.replace('/index.html');
    }
}

// Initialize prevention on page load
window.addEventListener('load', preventBackNavigation);

// Additional prevention for browser back button
window.addEventListener('beforeunload', function() {
    preventBackNavigation();
}); 