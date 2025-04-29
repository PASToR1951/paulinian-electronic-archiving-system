document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const successModal = document.getElementById("success-modal");
    const receiptModal = document.getElementById("receipt-modal");
    const closeReceiptBtn = document.getElementById("close-receipt");

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(form);

        try {
            const response = await fetch("/api/submit-document", {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Upload Success:", result);

                // Show success modal
                successModal.style.display = "flex";

                // Automatically show receipt after 2 seconds
                setTimeout(() => {
                    successModal.style.display = "none";  // Hide success popup
                    showReceipt(formData);  // Show receipt
                }, 2000);
            } else {
                console.error("Upload Failed:", response.statusText);
                alert("Upload failed! Please try again.");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("An error occurred. Please try again.");
        }
    });

    function showReceipt(formData) {
        document.getElementById("receipt-title").textContent = formData.get("title");
        document.getElementById("receipt-author").textContent = formData.get("author");
        document.getElementById("receipt-category").textContent = formData.get("category");
        document.getElementById("receipt-summary").textContent = formData.get("abstract");

        // Show receipt modal
        receiptModal.style.display = "flex";
    }

    // Close receipt modal
    closeReceiptBtn.addEventListener("click", () => {
        receiptModal.style.display = "none";
    });
});
