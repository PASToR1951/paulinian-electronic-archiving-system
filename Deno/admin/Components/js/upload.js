document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("upload-form");
    const fileInput = document.getElementById("file");
    const coverInput = document.getElementById("cover");
    const readButton = document.getElementById("read-document"); // Read Document Button
    let pdfURL = ""; // Stores the uploaded PDF URL

    if (form) {
        form.addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevent full-page reload

            const formData = new FormData(this);
            const file = fileInput.files[0]; // Get file directly from input
            const cover = coverInput.files[0];

            // Ensure the PDF file is required
            if (!file || file.type !== "application/pdf") {
                alert("Please attach a valid PDF file before submitting.");
                return;
            }

            // Remove the cover file if it's empty
            if (!cover) {
                formData.delete("cover");
            }

            try {
                const response = await fetch("http://localhost:8000/submit-document", {
                    method: "POST",
                    body: formData,
                });

                const result = await response.json();
                console.log(" Server response:", result);

                if (response.ok) {
                    alert(result.message);

                    // Reset form inputs
                    fileInput.value = "";
                    coverInput.value = "";
                    form.reset();

                    // Reset Read Document button
                    pdfURL = "";
                    readButton.disabled = true;
                    readButton.classList.remove("active-button");
                    readButton.classList.add("disabled-button");
                } else {
                    alert("Failed to submit document.");
                }
            } catch (error) {
                console.error("Error submitting document:", error);
                alert("An error occurred while submitting.");
            }
        });
    }

    // FIXED: Enable "Read Document" button when a PDF is selected
    fileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];

        if (file && file.type === "application/pdf") {
            pdfURL = URL.createObjectURL(file); // Generate a URL for the file

            // Ensure the button is properly activated
            readButton.disabled = false;
            readButton.classList.remove("disabled-button");
            readButton.classList.add("active-button");
        } else {
            // Reset Read Document button if the file is not a PDF
            pdfURL = "";
            readButton.disabled = true;
            readButton.classList.remove("active-button");
            readButton.classList.add("disabled-button");
        }
    });

    // FIXED: Open the PDF in a new tab when clicking "Read Document"
    readButton.addEventListener("click", () => {
        if (pdfURL) {
            window.open(pdfURL, "_blank");
        }
    });
});
