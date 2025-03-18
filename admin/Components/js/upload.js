document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("document-form");

    if (form) {
        form.addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevent full-page reload

            const formData = new FormData(this);

            try {
                const response = await fetch("/submit-document", {
                    method: "POST",
                    body: formData,
                });

                if (response.ok) {
                    // ✅ Store form data in sessionStorage
                    sessionStorage.setItem("title", formData.get("title"));
                    sessionStorage.setItem("author", formData.get("authorInput"));
                    sessionStorage.setItem("category", formData.get("category"));
                    sessionStorage.setItem("abstract", formData.get("abstract"));

                    // ✅ If user uploaded a cover, store its path
                    const coverFile = formData.get("cover");
                    if (coverFile) {
                        sessionStorage.setItem("coverPath", URL.createObjectURL(coverFile));
                    }

                    // ✅ Open success page (which will also load receipt)
                    globalThis.open("success.html", "_blank", "width=500,height=500");

                    // ✅ Reset form after submission
                    this.reset();
                } else {
                    alert("❌ Failed to submit document.");
                }
            } catch (error) {
                console.error("Error submitting document:", error);
                alert("❌ An error occurred while submitting.");
            }
        });
    }
});
// ✅ Ensure file input is clickable
document.querySelector(".upload-file").addEventListener("click", () => {
    document.getElementById("file").click();
});
document.querySelector(".upload-cover").addEventListener("click", () => {
    document.getElementById("cover").click();
});

document.getElementById("file").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
        const url = URL.createObjectURL(file);

        // Check if a PDF preview already exists
        let existingEmbed = document.getElementById("pdf-preview");
        if (!existingEmbed) {
            // Create a new <embed> element if it doesn't exist
            existingEmbed = document.createElement("embed");
            existingEmbed.id = "pdf-preview";
            existingEmbed.type = "application/pdf";
            existingEmbed.width = "100%";
            existingEmbed.height = "400px";
            existingEmbed.style.marginTop = "10px"; // Add spacing from text

            // Append to the preview-content div
            const previewContainer = document.querySelector(".preview-content");
            previewContainer.appendChild(existingEmbed);
        }

        // Update the PDF source
        existingEmbed.src = url;
    }
});