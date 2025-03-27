document.addEventListener("DOMContentLoaded", () => {
    console.log("🔄 Checking user authentication status...");

    const authBtn = document.getElementById("auth-btn");
    const userRole = localStorage.getItem("userRole"); // Get stored user role

    if (authBtn) {
        if (userRole === "Isregistered") {
            console.log(" User is registered. Updating navbar...");
            authBtn.outerHTML = `<button id="logout-btn" class="nav-link loginbtn w-nav-link">Logout</button>`;

            // Add logout event listener
            document.getElementById("logout-btn").addEventListener("click", () => {
                console.log("🚪 Logging out user...");
                localStorage.removeItem("userRole"); // Remove user role
                globalThis.location.href = "/log-in.html"; // Redirect to login page
            });
        } else {
            console.log("its me navbar.js User is not logged in.");
        }
    } else {
        console.error("auth-btn element not found in navbar.");
    }
});
