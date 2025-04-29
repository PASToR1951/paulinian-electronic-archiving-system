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
                    // Store the session token
                    if (data.token) {
                        // Store token in both cookie and localStorage for redundancy
                        document.cookie = `session_token=${data.token}; path=/`;
                        localStorage.setItem('session_token', data.token);
                        console.log("Session token set in cookie and localStorage");
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
