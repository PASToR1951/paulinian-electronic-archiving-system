document.addEventListener("DOMContentLoaded", () => {
    const titleInput = document.getElementById("title");
    const authorInput = document.getElementById("authorInput");
    const publicationDateInput = document.getElementById("publication-date");
    const abstractInput = document.getElementById("abstract");
    const selectedAuthorsContainer = document.getElementById("selectedAuthors");
    const selectedTopicsContainer = document.getElementById("selectedTopics");
    const categorySelect = document.getElementById("category");
    const fileInput = document.getElementById("file");
    const pageCountSpan = document.getElementById("page-count");
    const previewAddedDate = document.getElementById("preview-added-date");

    const previewTitle = document.getElementById("preview-title");
    const previewAuthor = document.getElementById("preview-author");
    const previewYear = document.getElementById("preview-year");
    const previewAbstract = document.getElementById("preview-abstract");
    const previewTopic = document.getElementById("preview-topic");
    const categoryIcon = document.getElementById("category-icon");

    // Function to get PDF page count
    async function getPDFPageCount(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            return pdf.numPages;
        } catch (error) {
            console.error("Error getting PDF page count:", error);
            return 0;
        }
    }

    // Update page count and added date when file is selected
    fileInput.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            const pageCount = await getPDFPageCount(file);
            pageCountSpan.textContent = pageCount;
            
            // Set the added date to current date
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            previewAddedDate.textContent = `Added Date: ${formattedDate}`;
        } else {
            pageCountSpan.textContent = "0";
        }
    });

    // Update preview title
    titleInput.addEventListener("input", () => {
        previewTitle.textContent = titleInput.value || "Title of Document";
    });

    // Update preview publication date
    publicationDateInput.addEventListener("change", () => {
        const date = new Date(publicationDateInput.value);
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        previewYear.textContent = `Publishing Date: ${formattedDate}`;
    });

    // Update preview abstract
    abstractInput.addEventListener("input", () => {
        previewAbstract.textContent = abstractInput.value || "This is the default abstract text...";
    });

    // Update preview authors
    const updateAuthorsPreview = () => {
        const selectedAuthors = Array.from(selectedAuthorsContainer.querySelectorAll(".selected-author"))
            .map(el => el.textContent.replace("×", "").trim());
        previewAuthor.textContent = selectedAuthors.length > 0
            ? `by ${selectedAuthors.join(", ")}`
            : "by Author Name";
    };

    // Update preview topics
    const updateTopicsPreview = () => {
        const selectedTopics = Array.from(selectedTopicsContainer.querySelectorAll(".selected-topic"))
            .map(el => el.textContent.replace("×", "").trim());
        previewTopic.textContent = selectedTopics.length > 0
            ? `Topics: ${selectedTopics.join(", ")}`
            : "Topics: None";
    };

    // Update category icon
    categorySelect.addEventListener("change", () => {
        const category = categorySelect.value;
        if (category && category !== "default") {
            categoryIcon.src = `/admin/Components/icons/Category-icons/${category.toLowerCase()}.png`;
        } else {
            categoryIcon.src = "/admin/Components/icons/Category-icons/default_category_icon.png";
        }
    });

    // Create MutationObserver for authors
    const authorsObserver = new MutationObserver(updateAuthorsPreview);
    authorsObserver.observe(selectedAuthorsContainer, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Create MutationObserver for topics
    const topicsObserver = new MutationObserver(updateTopicsPreview);
    topicsObserver.observe(selectedTopicsContainer, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Initialize preview with default values
    updateAuthorsPreview();
    updateTopicsPreview();
    
    // Set initial added date to current date
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    previewAddedDate.textContent = `Added Date: ${formattedDate}`;
});

// Add event listener for form submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file');
    const readButton = document.getElementById('read-document');

    // Add event listener for form submission
    if (form) {
        form.addEventListener('submit', handleUpload);
    }

    // Add event listener for file input
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (readButton) {
                if (this.files && this.files[0]) {
                    readButton.disabled = false;
                    readButton.classList.remove('disabled-button');
                } else {
                    readButton.disabled = true;
                    readButton.classList.add('disabled-button');
                }
            }
        });
    }

    // Add event listener for read document button
    if (readButton) {
        readButton.addEventListener('click', function() {
            if (fileInput && fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const fileURL = URL.createObjectURL(file);
                window.open(fileURL, '_blank');
            }
        });
    }
});

async function handleUpload(event) {
    event.preventDefault();
    console.log("Upload started");

    const form = event.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;

    try {
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Uploading...
        `;

        // Get selected topics and authors
        const selectedTopics = Array.from(document.querySelectorAll('.selected-topic'))
            .map(el => el.textContent.replace('×', '').trim());
        const selectedAuthors = Array.from(document.querySelectorAll('.selected-author'))
            .map(el => el.textContent.replace('×', '').trim());

        // Add selected topics and authors to formData
        formData.append('topic', JSON.stringify(selectedTopics));
        formData.append('author', JSON.stringify(selectedAuthors));

        const response = await fetch('/api/submit-document', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        console.log('Upload response:', result);

        if (!response.ok) {
            throw new Error(result.message || 'Upload failed');
        }

        // Show success popup first
        const successModal = document.getElementById('success-modal');
        if (successModal) {
            successModal.style.display = 'flex';
        }

        // Populate receipt modal with document details
        document.getElementById('receiptDate').textContent = new Date().toLocaleString();
        document.getElementById('receiptTitle').textContent = formData.get('title');
        document.getElementById('receiptAuthors').textContent = selectedAuthors.join(', ');
        document.getElementById('receiptTopics').textContent = selectedTopics.join(', ');
        document.getElementById('receiptCategory').textContent = formData.get('category');
        document.getElementById('receiptYear').textContent = formData.get('publication_date');

        // After 2 seconds, hide success popup and show receipt popup
        setTimeout(() => {
            if (successModal) {
                successModal.style.display = 'none';
            }
            const receiptModal = document.getElementById('receipt-modal');
            if (receiptModal) {
                receiptModal.style.display = 'flex';
            }

            // After showing the receipt, wait 3 seconds then redirect
            setTimeout(() => {
                if (result.redirect) {
                    window.location.href = result.redirect;
                }
            }, 3000);
        }, 2000);

    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading document: ' + error.message);
    } finally {
        // Re-enable submit button and restore original text
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Close receipt function
function closeReceipt() {
    const receiptModal = document.getElementById('receipt-modal');
    if (receiptModal) {
        receiptModal.style.display = 'none';
        // Redirect after closing receipt
        window.location.href = '/admin/dashboard.html';
    }
}

// Print receipt function
function printReceipt() {
    const receiptContent = document.querySelector('.receipt-body');
    if (!receiptContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
        <html>
            <head>
                <title>Document Upload Receipt</title>
                <style>
                    body { 
                        padding: 20px;
                        font-family: Arial, sans-serif;
                    }
                    .receipt-body { 
                        max-width: 600px; 
                        margin: 0 auto;
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                    }
                    .receipt-header {
                        text-align: center;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid #eee;
                    }
                    .receipt-details p {
                        margin: 10px 0;
                    }
                </style>
            </head>
            <body>
                ${receiptContent.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
}

// Make functions available globally
window.closeReceipt = closeReceipt;
window.printReceipt = printReceipt;
