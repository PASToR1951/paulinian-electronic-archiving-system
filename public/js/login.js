document.addEventListener("DOMContentLoaded", () => {
  console.log(" DOM fully loaded!");

  setTimeout(() => { //  Delay execution slightly to ensure form is present
      const loginForm = document.getElementById("login-form");
      if (!loginForm) {
          console.error(" Login form not found! Is `id=\"login-form\"` in log-in.html?");
          return;
      }

      console.log(" Login form found!");

      loginForm.addEventListener("submit", async (event) => {
          event.preventDefault(); //  Prevents normal form submission

          const ID = document.getElementById("wf-log-in-id")?.value.trim();
          const Password = document.getElementById("wf-log-in-password")?.value.trim();

          console.log(" Submitting Login:", { ID, Password });

          if (!ID || !Password) {
              console.error(" Missing ID or Password!");
              alert("Please fill in both fields.");
              return;
          }

          try {
              console.log(" Sending login request...");
              const response = await fetch("/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" }, // Ensure JSON format
                  body: JSON.stringify({ ID, Password }), // PLEASE LORD E Convert data to JSON
              });

              console.log(" Waiting for server response...");
              const data = await response.json();
              console.log(" Server Response:", data);

              if (response.ok) {
                  alert(" Login successful! Redirecting...");
                  window.location.href = data.redirect;
              } else {
                  alert(" " + data.message);
              }
          } catch (error) {
              console.error(" Login request error:", error);
              alert(" Internal Server Error. Please try again later.");
          }
      });
  }, 100); //  Small delay to ensure `login-form` is available
});
