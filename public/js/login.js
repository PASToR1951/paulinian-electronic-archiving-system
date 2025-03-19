document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM fully loaded!");

    setTimeout(() => {
        const loginForm = document.getElementById("login-form");
        if (!loginForm) {
            console.error(" Login form not found! Check `id=\"login-form\"` in log-in.html.");
            return;
        }

        console.log(" Login form found!");

        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const ID = document.getElementById("wf-log-in-id")?.value.trim();
            const Password = document.getElementById("wf-log-in-password")?.value.trim();

            if (!ID || !Password) {
                console.error(" Missing ID or Password!");
                alert("Please fill in both fields.");
                return;
            }

            try {
                console.log("📡 Sending login request...");
                const response = await fetch("http://localhost:8000/login", { 
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ID, Password }),
                });

                console.log("Waiting for server response...");
                const data = await response.json();
                console.log("📨 Server Response:", data);

                if (response.ok) {
                    alert("Login successful! Redirecting...");
                    globalThis.location.href = data.redirect;
                } else {
                    alert("" + data.message);
                }
            } catch (error) {
                console.error(" Login request error:", error);
                alert("Internal Server Error. Please try again later.");
            }
        });
    }, 100);
});
