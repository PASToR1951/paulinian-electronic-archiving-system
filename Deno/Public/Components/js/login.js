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

            try {
                console.log("Sending login request...");
                const response = await fetch("http://localhost:8000/login", { 
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ID, Password }),
                });

                console.log("Waiting for server response...");

                let data;
                try {
                    data = await response.json();
                } catch {
                    console.error("Server returned a non-JSON response.");
                    alert("An unexpected error occurred. Please try again.");
                    isSubmitting = false;
                    return;
                }

                console.log("Server Response:", data);

                if (response.ok) {
                    alert("Login successful! Redirecting...");
                    globalThis.location.href = data.redirect;
                } else {
                    alert(data.message || "Login failed.");
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
