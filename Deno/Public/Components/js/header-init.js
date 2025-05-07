// Check for logged in user and update header UI
document.addEventListener('DOMContentLoaded', function() {
    // Function to initialize header after it's loaded
    function initializeHeader() {
        // Initialize search component if available
        if (typeof window.initializeSearchComponent === 'function') {
            window.initializeSearchComponent();
        }
        
        // Initialize user dropdown (check login status)
        updateUserDropdown();
    }
    
    // Function to check user login status and update header UI
    function updateUserDropdown() {
        const loginContainer = document.getElementById('loginContainer');
        const userDropdownContainer = document.getElementById('userDropdownContainer');
        const userName = document.getElementById('userName');
        
        if (!loginContainer || !userDropdownContainer || !userName) {
            console.log('Header elements not found. Header might not be loaded yet.');
            return;
        }
        
        // Get user info from sessionStorage instead of localStorage
        let userInfo = null;
        try {
            userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        } catch (e) {
            console.log('No user info found or invalid format');
        }
        
        // If logged in
        if (userInfo && (userInfo.isLoggedIn || userInfo.token)) {
            // Check if server has been restarted since login
            checkServerRestart(userInfo).then(isRestarted => {
                if (isRestarted) {
                    console.log('Server has been restarted. Logging out automatically...');
                    performLogout();
                    return;
                }
                
                // Continue with normal flow if server hasn't restarted
                loginContainer.style.display = 'none';
                userDropdownContainer.style.display = 'block';
                
                // Set username
                userName.textContent = userInfo.username || userInfo.id || 'User';
                
                // Add role indicator if not a regular user
                if (userInfo.role && userInfo.role.toLowerCase() !== 'user') {
                    userName.textContent += ` (${userInfo.role})`;
                }
                
                // Set up dropdown toggle
                const userDropdownBtn = document.getElementById('userDropdownBtn');
                const userDropdownMenu = document.getElementById('userDropdownMenu');
                
                if (userDropdownBtn && userDropdownMenu) {
                    // Toggle dropdown when button is clicked
                    userDropdownBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        userDropdownMenu.classList.toggle('show');
                    });
                    
                    // Close dropdown when clicking elsewhere
                    document.addEventListener('click', function(e) {
                        if (!userDropdownBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                            userDropdownMenu.classList.remove('show');
                        }
                    });
                    
                    // Set up logout button
                    const logoutBtn = document.getElementById('logoutBtn');
                    if (logoutBtn) {
                        logoutBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            
                            // Call logout function if it exists
                            if (typeof window.logout === 'function') {
                                window.logout();
                            } else {
                                // Fallback logout
                                performLogout();
                            }
                        });
                    }
                }
            }).catch(error => {
                console.error('Error checking server restart:', error);
                // Show login button as a fallback in case of errors
                loginContainer.style.display = 'block';
                userDropdownContainer.style.display = 'none';
            });
        } else {
            // Not logged in
            loginContainer.style.display = 'block';
            userDropdownContainer.style.display = 'none';
        }
    }
    
    // Function to check if server has been restarted
    async function checkServerRestart(userInfo) {
        if (!userInfo || !userInfo.serverTime) {
            return true; // Treat as restarted if no serverTime is stored
        }
        
        try {
            // Make a lightweight request to the server
            const response = await fetch('/ping', { 
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store' // Prevent caching
            });
            
            if (!response.ok) {
                // If server returns error, assume it's been restarted
                return true;
            }
            
            // Check server response data
            const data = await response.json();
            
            // If server doesn't include timestamp or it's different than stored value
            // We consider it a server restart
            if (!data.serverStartTime || 
                !userInfo.serverTime || 
                data.serverStartTime > userInfo.serverTime) {
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error checking server status:', error);
            // Assume server restarted if we can't verify
            return true;
        }
    }
    
    // Fallback logout function
    function performLogout() {
        // Call the logout endpoint
        fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        }).then(function(response) {
            // Clear sessionStorage and cookies
            sessionStorage.removeItem('userInfo');
            document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            
            // Update UI
            const loginContainer = document.getElementById('loginContainer');
            const userDropdownContainer = document.getElementById('userDropdownContainer');
            
            if (loginContainer && userDropdownContainer) {
                loginContainer.style.display = 'block';
                userDropdownContainer.style.display = 'none';
            }
            
            // Redirect if needed
            if (window.location.pathname.includes('/admin/') || 
                window.location.pathname.includes('/profile') || 
                window.location.pathname.includes('/settings')) {
                window.location.href = '/log-in.html';
            } else {
                // Reload current page
                window.location.reload();
            }
        }).catch(function(error) {
            console.error('Logout error:', error);
        });
    }
    
    // Check if header is already loaded
    if (document.querySelector('.nav-bar')) {
        // Header is already in the DOM, initialize it
        initializeHeader();
    } else {
        // Wait for header to be loaded
        // This handles cases where the header is loaded dynamically
        const observer = new MutationObserver(function(mutations) {
            if (document.querySelector('.nav-bar')) {
                observer.disconnect();
                initializeHeader();
            }
        });
        
        // Start observing
        observer.observe(document.body, { 
            childList: true,
            subtree: true
        });
        
        // Fallback: try again after a short delay
        setTimeout(function() {
            if (document.querySelector('.nav-bar')) {
                initializeHeader();
            }
        }, 500);
    }
}); 