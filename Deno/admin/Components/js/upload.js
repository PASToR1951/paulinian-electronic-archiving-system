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

        const response = await fetch('/submit-document', {
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
