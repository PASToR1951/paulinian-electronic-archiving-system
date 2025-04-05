// Define extractedAbstract in the global scope
let extractedAbstract = "";

document.addEventListener("DOMContentLoaded", () => {
    const titleInput = document.getElementById("title");
    const authorInput = document.getElementById("authorInput");
    const publicationDateInput = document.getElementById("publication_date");
    const selectedAuthorsContainer = document.getElementById("selectedAuthors");
    const selectedTopicsContainer = document.getElementById("selectedTopics");
    const categorySelect = document.getElementById("category");
    const fileInput = document.getElementById("file");
    const pageCountSpan = document.getElementById("page-count");
    const previewAddedDate = document.getElementById("preview-added-date");

    const previewTitle = document.getElementById("preview-title");
    const previewAuthor = document.getElementById("preview-author");
    const previewYear = document.getElementById("preview-year");
    const previewTopic = document.getElementById("preview-topic");
    const previewAbstract = document.getElementById("preview-abstract");
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

    // Function to extract text from PDF using PDF.js
    async function extractTextFromPDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            // Get the first page (usually contains abstract)
            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();
            
            // Extract text from the page and clean up formatting
            const text = textContent.items
                .map(item => {
                    // Remove any bold markers or special characters
                    let cleanText = item.str.replace(/\*\*/g, '').replace(/\*/g, '');
                    return cleanText;
                })
                .join(' ');
            return text;
        } catch (error) {
            console.error('Error extracting text from PDF:', error);
            return "Unable to extract abstract from PDF.";
        }
    }

    // Function to find abstract in extracted text
    function findAbstract(text) {
        // Common abstract markers
        const abstractMarkers = [
            "abstract",
            "summary",
            "synopsis"
        ];

        // Split text into paragraphs
        const paragraphs = text.split(/\n\s*\n/);
        
        // Look for paragraph starting with abstract markers
        for (const paragraph of paragraphs) {
            const lowerParagraph = paragraph.toLowerCase();
            if (abstractMarkers.some(marker => lowerParagraph.startsWith(marker))) {
                // Remove the marker word and clean up the text
                return paragraph.replace(new RegExp(`^(${abstractMarkers.join('|')})[:\s]*`, 'i'), '').trim();
            }
        }

        // If no abstract marker found, return first paragraph
        return paragraphs[0] || "No abstract found in the document.";
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

            // Extract text from PDF
            const extractedText = await extractTextFromPDF(file);
            extractedAbstract = findAbstract(extractedText);
            
            // Update preview
            previewAbstract.textContent = extractedAbstract || "No abstract found in the document.";
            
            // Enable read document button
            const readButton = document.getElementById("read-document");
            if (readButton) {
                readButton.disabled = false;
                readButton.classList.remove("disabled-button");
            }
        } else {
            pageCountSpan.textContent = "0";
            previewAbstract.textContent = "Please upload a PDF file to extract the abstract.";
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

    // Add event listener for form submission
    const form = document.getElementById("upload-form");
    if (form) {
        form.addEventListener("submit", handleUpload);
    }

    // Add event listener for read document button
    const readButton = document.getElementById("read-document");
    if (readButton) {
        readButton.addEventListener('click', function() {
            if (fileInput && fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const fileURL = URL.createObjectURL(file);
                window.open(fileURL, '_blank');
            }
        });
    }

    // Add event listener for close receipt button
    const closeReceiptButton = document.getElementById("close-receipt");
    if (closeReceiptButton) {
        closeReceiptButton.addEventListener("click", function() {
            const receiptModal = document.getElementById("receipt-modal");
            if (receiptModal) {
                receiptModal.style.display = "none";
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

        // Log form data for debugging
        console.log('Form data before processing:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        // Ensure all required fields are present
        const title = formData.get('title');
        const publicationDate = formData.get('publication_date');
        const category = formData.get('category');
        const file = formData.get('file');
        const volumeNo = formData.get('volume-no');

        if (!title || !publicationDate || !category || !file) {
            throw new Error('Please fill in all required fields: Title, Publication Date, Category, and File');
        }

        if (selectedAuthors.length === 0) {
            throw new Error('Please add at least one author');
        }

        // Create document data object
        const documentData = {
            title: title,
            authors: selectedAuthors,
            category: category,
            topics: selectedTopics,
            volume: volumeNo,
            publicationDate: publicationDate,
            abstract: extractedAbstract || ''
        };

        // Add selected topics and authors to formData
        formData.append('topic', JSON.stringify(selectedTopics));
        formData.append('author', JSON.stringify(selectedAuthors));
        formData.append('abstract', extractedAbstract || '');
        formData.append('department', 'Computer Science'); // Default department

        // Log final form data for debugging
        console.log('Final form data:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

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

        // Use the document data we created instead of the response
        setTimeout(() => {
            updateReceiptModal(documentData);
        }, 2000);

    } catch (error) {
        console.error('Error uploading document:', error);
        alert('Error uploading document: ' + error.message);
    } finally {
        // Reset submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Update receipt modal with document details
function updateReceiptModal(documentData) {
    try {
        console.log('Updating receipt modal with data:', documentData);
        
        // Update receipt date
        const currentDate = new Date().toLocaleDateString();
        document.getElementById('receiptDate').textContent = currentDate;

        // Update document details
        document.getElementById('receiptTitle').textContent = documentData.title || 'No Title';
        document.getElementById('receiptAuthor').textContent = Array.isArray(documentData.authors) ? 
            documentData.authors.join(', ') : documentData.authors || 'No Author';
        document.getElementById('receiptCategory').textContent = documentData.category || 'No Category';
        document.getElementById('receiptVolume').textContent = documentData.volume || 'N/A';

        // Update category icon
        const categoryIcon = document.getElementById('receipt-category-icon');
        categoryIcon.src = getCategoryIcon(documentData.category);

        // Update topics
        const topicsContainer = document.getElementById('receiptTopics');
        topicsContainer.innerHTML = ''; // Clear existing topics
        
        if (Array.isArray(documentData.topics) && documentData.topics.length > 0) {
            documentData.topics.forEach((topic, index) => {
                const topicBadge = document.createElement('div');
                topicBadge.className = 'topic-badge';
                topicBadge.textContent = topic;
                topicsContainer.appendChild(topicBadge);
            });
        }

        // Show the receipt modal
        const receiptModal = document.getElementById('receipt-modal');
        if (receiptModal) {
            receiptModal.style.display = 'flex';
        }

        // Hide success modal
        const successModal = document.getElementById('success-modal');
        if (successModal) {
            successModal.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating receipt modal:', error);
    }
}

// Function to get category icon path
function getCategoryIcon(category) {
    const categoryIcons = {
        'thesis': './icons/Category-icons/thesis.png',
        'dissertation': './icons/Category-icons/dissertation.png',
        'confluence': './icons/Category-icons/confluence.png',
        'synergy': './icons/Category-icons/synergy.png',
        'default': './icons/Category-icons/default_category_icon.png'
    };
    
    return categoryIcons[category.toLowerCase()] || categoryIcons.default;
}
