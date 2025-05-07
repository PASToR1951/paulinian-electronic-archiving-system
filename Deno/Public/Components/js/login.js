document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded!");

    setTimeout(() => {
        const loginForm = document.getElementById("login-form");
        if (!loginForm) {
            console.error("Login form not found! Check `id=\"login-form\"` in log-in.html.");
            return;
        }

        console.log("Login form found!");

        let isSubmitting = false; 

        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (isSubmitting) {
                console.warn("Login already in progress...");
                return;
            }
            isSubmitting = true; 

            const ID = document.getElementById("wf-log-in-id")?.value.trim();
            const Password = document.getElementById("wf-log-in-password")?.value.trim();

            if (!ID || !Password) {
                console.error("Missing ID or Password!");
                alert("Please fill in both fields.");
                isSubmitting = false;
                return;
            }

            const loginData = { ID, Password };
            console.log("Preparing to send login data:", loginData);

            try {
                console.log("Sending login request...");
                const response = await fetch("/login", { 
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(loginData),
                    credentials: "include" // Important for cookies
                });

                console.log("Waiting for server response...");
                console.log("Response status:", response.status);
                console.log("Response headers:", Object.fromEntries([...response.headers]));

                let data;
                const responseText = await response.text();
                console.log("Raw response:", responseText);
                
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error("Failed to parse JSON:", parseError);
                    alert("Server returned an invalid response format. Please try again.");
                    isSubmitting = false;
                    return;
                }

                console.log("Server Response:", data);

                if (response.ok) {
                    // Store the session token and user info
                    if (data.token) {
                        // Set cookie to expire when browser closes (no expiration date)
                        document.cookie = `session_token=${data.token}; path=/`;
                        
                        // Add server timestamp to detect restarts
                        const serverTime = data.serverTime || Date.now();
                        
                        // Store user information including role and server timestamp
                        const userInfo = {
                            isLoggedIn: true,
                            token: data.token,
                            id: data.userId || ID,
                            role: data.role || 'User',
                            username: data.username || ID,
                            serverTime: serverTime,
                            loginTime: Date.now()
                        };
                        
                        // Store in sessionStorage instead of localStorage so it's cleared when browser closes
                        sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
                        console.log("User info stored:", userInfo);
                        
                        // Update header UI
                        updateHeaderUI(userInfo);
                    }
                    
                    // Redirect based on role
                    if (data.redirect) {
                        console.log(`Redirecting to ${data.redirect}...`);
                        // Force redirect with explicit window.location assignment
                        window.location = data.redirect;
                        
                        // Fallback redirect in case the above doesn't work
                        setTimeout(() => {
                            console.log("Fallback redirect activated");
                            document.location.href = data.redirect;
                        }, 500);
                    } else {
                        console.log("No redirect URL provided, defaulting to index");
                        window.location = "http://localhost:8000/index.html";
                    }
                } else {
                    alert(data.message || "Login failed. Please check your credentials.");
                }
            } catch (error) {
                console.error("Login request error:", error);
                alert("Internal Server Error. Please try again later.");
            } finally {
                isSubmitting = false; 
            }
        });
    }, 100);
});

// Function to update header UI after login
function updateHeaderUI(userInfo) {
    if (!userInfo) return;
    
    // Try to get the header elements
    const loginContainer = document.getElementById('loginContainer');
    const userDropdownContainer = document.getElementById('userDropdownContainer');
    const userName = document.getElementById('userName');
    
    // If header elements exist on the current page
    if (loginContainer && userDropdownContainer && userName) {
        loginContainer.style.display = 'none';
        userDropdownContainer.style.display = 'block';
        
        // Set user name
        userName.textContent = userInfo.username || userInfo.id || 'User';
        
        // Add role if not a regular user
        if (userInfo.role && userInfo.role.toLowerCase() !== 'user') {
            userName.textContent += ` (${userInfo.role})`;
        }
    }
}

// Add a global logout function that can be called from anywhere
window.logout = async function() {
    try {
        // Call the logout endpoint
        const response = await fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        // Clear both localStorage and sessionStorage
        localStorage.removeItem('userInfo');
        localStorage.removeItem('session_token');
        sessionStorage.removeItem('userInfo');
        sessionStorage.removeItem('session_token');
        
        // Clear cookies
        document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Update UI if on a page with the header
        const loginContainer = document.getElementById('loginContainer');
        const userDropdownContainer = document.getElementById('userDropdownContainer');
        
        if (loginContainer && userDropdownContainer) {
            loginContainer.style.display = 'block';
            userDropdownContainer.style.display = 'none';
        }
        
        // If on an admin page, redirect to login
        if (window.location.pathname.includes('/admin/')) {
            window.location.href = '/log-in.html';
        } else if (window.location.pathname.includes('/profile') || 
            window.location.pathname.includes('/settings')) {
            window.location.href = '/log-in.html';
        } else {
            // Optional: reload the current page
            window.location.reload();
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
};
