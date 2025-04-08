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
            
            // Search through pages for abstract
            const maxPagesToSearch = Math.min(5, pdf.numPages);
            let abstractText = "";
            let isAbstractSection = false;
            let abstractStartPage = -1;
            let abstractEndFound = false;
            let lastLineWasIncomplete = false;
            
            for (let pageNum = 1; pageNum <= maxPagesToSearch && !abstractEndFound; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Join text items into lines while preserving their positions
                const lines = [];
                let currentLine = [];
                let lastY = null;
                
                // Sort items by vertical position (top to bottom) and horizontal position (left to right)
                const sortedItems = textContent.items.sort((a, b) => {
                    const yDiff = Math.abs(a.transform[5] - b.transform[5]);
                    if (yDiff > 2) {
                        return b.transform[5] - a.transform[5];
                    }
                    return a.transform[4] - b.transform[4];
                });
                
                // Group items into lines
                for (const item of sortedItems) {
                    if (lastY === null || Math.abs(item.transform[5] - lastY) <= 2) {
                        currentLine.push(item);
                    } else {
                        if (currentLine.length > 0) {
                            lines.push(currentLine);
                        }
                        currentLine = [item];
                    }
                    lastY = item.transform[5];
                }
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                }
                
                // Convert lines to text while preserving formatting
                const pageLines = lines.map(line => {
                    const text = line.map(item => item.str).join('');
                    return text.trim();
                }).filter(line => line.length > 0);
                
                const pageText = pageLines.join('\n');
                
                // Check if this page contains the abstract
                if (!isAbstractSection) {
                    const abstractStart = findAbstractStart(pageText);
                    if (abstractStart) {
                        isAbstractSection = true;
                        abstractStartPage = pageNum;
                        abstractText = abstractStart;
                        lastLineWasIncomplete = !abstractStart.endsWith('.') && 
                                              !abstractStart.endsWith('?') && 
                                              !abstractStart.endsWith('!');
                    }
                } else {
                    const endMarkerRegex = new RegExp(
                        "^\\s*(introduction|keywords?:?|index terms:?|background|acknowledg(e|ement|ments)|1\\.?|i\\.?|chapter|section|references)\\b",
                        "im"
                    );
                    const endMatch = pageText.match(endMarkerRegex);

                    if (endMatch) {
                        const markerPosition = pageText.indexOf(endMatch[0]);
                        const abstractPart = pageText.substring(0, markerPosition).trim();

                        if (abstractPart.length > 30) {
                            abstractText += (lastLineWasIncomplete ? ' ' : '\n') + abstractPart;
                            abstractEndFound = true;
                            break;
                        }
                    } else if (pageNum === abstractStartPage) {
                        // Same page as abstract start, content already added
                        continue;
                    } else {
                        // Add content only if it appears to be continuation of the abstract
                        const cleanedText = pageText.replace(/^[\d\s\w]+$|Page \d+|^\d+$/gm, '').trim();
                        if (cleanedText && 
                            (lastLineWasIncomplete || /^[a-z,;)]/.test(cleanedText) || /[a-z][.?!]$/.test(abstractText)) && 
                            !cleanedText.toLowerCase().includes('acknowledge') &&
                            !cleanedText.includes('©') && 
                            !cleanedText.includes('copyright') &&
                            !/^\s*\d+\s*$/.test(cleanedText)) {
                            abstractText += (lastLineWasIncomplete ? ' ' : '\n') + cleanedText;
                            lastLineWasIncomplete = !cleanedText.endsWith('.') && 
                                                  !cleanedText.endsWith('?') && 
                                                  !cleanedText.endsWith('!');
                        } else {
                            abstractEndFound = true;
                        }
                    }
                }
            }
            
            // Clean up the abstract text
            if (abstractText) {
                abstractText = abstractText
                    .replace(/^ABSTRACT\s*[:.]?\s*/i, '') // Remove "ABSTRACT" header
                    .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
                    .replace(/\s+/g, ' ') // Normalize spaces
                    .replace(/\n\s*\n/g, '\n') // Remove empty lines
                    .replace(/acknowledgements?.*$/is, '') // Remove any acknowledgement section
                    .replace(/\s+/g, ' ') // Normalize spaces again after cleanup
                    .trim();
                
                // Split into paragraphs more accurately
                const paragraphs = abstractText
                    .split(/(?<=[.?!])\s+(?=[A-Z])/g) // keep only full-stop + capital start
                    .map(p => p.trim())
                    .filter(p => p.length > 0 && !p.match(/^(keywords?|chapter|section|index terms|acknowledge)/i));
                
                return `<div class="abstract-text">${paragraphs.map(p => 
                    `<p>${p}</p>`).join('')}</div>`;
            }
            
            return "No abstract found in the document.";
        } catch (error) {
            console.error('Error extracting text from PDF:', error);
            return "Unable to extract abstract from PDF.";
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

            try {
                // Extract text and abstract from PDF
                const extractedText = await extractTextFromPDF(file);
                console.log('Extracted abstract:', extractedText); // Debug log
                
                // Update preview and global variable
                extractedAbstract = extractedText;
                previewAbstract.innerHTML = extractedText;
                
                // Enable read document button
                const readButton = document.getElementById("read-document");
                if (readButton) {
                    readButton.disabled = false;
                    readButton.classList.remove("disabled-button");
                }
            } catch (error) {
                console.error('Error processing PDF:', error);
                previewAbstract.textContent = "Error extracting abstract from the document.";
            }
        } else {
            pageCountSpan.textContent = "0";
            previewAbstract.textContent = "Please upload a PDF file to extract the abstract.";
            extractedAbstract = "";
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
        formData.append('topics', JSON.stringify(selectedTopics));
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

// Update the CSS for abstract formatting
const abstractStyles = `
    .abstract-content {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        font-family: "Times New Roman", Times, serif;
        font-size: 12pt;
        line-height: 1.6;
        font-weight: normal !important;
    }
    
    .abstract-text {
        text-align: justify;
        hyphens: auto;
        font-weight: normal !important;
    }
    
    .abstract-text p {
        margin: 0 0 1em 0;
        text-indent: 0.5in;
        font-weight: normal !important;
        font-family: inherit;
    }
    
    .abstract-text p:first-child {
        text-indent: 0;
        font-weight: normal !important;
    }
    
    #preview-abstract {
        color: #333;
        font-weight: normal !important;
    }
    
    #preview-abstract * {
        font-weight: normal !important;
    }
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.textContent = abstractStyles;
document.head.appendChild(styleSheet);

// Function to find the start of the abstract
function findAbstractStart(text) {
    const abstractMarkers = [
        "abstract",
        "abstract:",
        "ABSTRACT",
        "ABSTRACT:",
        "Abstract",
        "Abstract:",
        "A B S T R A C T",
        "A B S T R A C T:"
    ];
    
    const lowerText = text.toLowerCase();
    for (const marker of abstractMarkers) {
        const index = lowerText.indexOf(marker.toLowerCase());
        if (index !== -1) {
            // Get the text after the abstract marker
            const startIndex = index + marker.length;
            let abstractText = text.substring(startIndex).trim();
            
            // Remove any leading colons or spaces
            abstractText = abstractText.replace(/^[:.\s]+/, '').trim();
            
            return abstractText;
        }
    }
    return null;
}
