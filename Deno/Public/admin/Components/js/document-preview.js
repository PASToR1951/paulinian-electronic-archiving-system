/**
 * Document preview module
 * This file handles document preview functionality
 */

// Document preview object to be exported
window.documentPreview = {
    showPreviewModal,
    closePreviewModal,
    openPdfViewer,
    closePdfModal
};

/**
 * Show the preview modal for a document
 * @param {string|number} documentId - The ID of the document to preview
 */
async function showPreviewModal(documentId) {
    console.log(`Showing preview modal for document ID: ${documentId}`);
    
    try {
        // Fetch document details from API
        const response = await fetch(`/api/documents/${documentId}`);
        if (!response.ok) {
            throw new Error(`Error fetching document: ${response.status}`);
        }
        
        const docData = await response.json();
        console.log('Document data for preview:', docData);
        
        // Fetch authors separately to ensure we get them
        let authors = [];
        try {
            const authorsResponse = await fetch(`/api/document-authors/${documentId}`);
            if (authorsResponse.ok) {
                const authorsData = await authorsResponse.json();
                authors = authorsData.authors || [];
                console.log('Authors data for preview:', authors);
            }
        } catch (authorError) {
            console.error('Error fetching authors:', authorError);
            // Continue with empty authors array
        }
        
        // Populate the preview modal with document data
        const previewModal = document.getElementById('preview-modal');
        
        // Title
        const previewTitle = document.getElementById('previewTitle');
        if (previewTitle) {
            previewTitle.textContent = docData.title || 'Untitled Document';
        }
        
        // Author(s)
        const previewAuthor = document.getElementById('previewAuthor');
        if (previewAuthor) {
            let authorText = 'Unknown Author';
            
            // First try with fetched authors
            if (authors && Array.isArray(authors) && authors.length > 0) {
                authorText = authors
                    .map(author => {
                        return author.full_name || `${author.first_name || ''} ${author.last_name || ''}`.trim();
                    })
                    .filter(name => name) // Remove empty names
                    .join(', ');
            } 
            // Fallback to document authors if available
            else if (docData.authors && Array.isArray(docData.authors) && docData.authors.length > 0) {
                authorText = docData.authors
                    .map(author => {
                        if (typeof author === 'string') return author;
                        return author.full_name || `${author.first_name || ''} ${author.last_name || ''}`.trim();
                    })
                    .filter(name => name) // Remove empty names
                    .join(', ');
            }
            
            previewAuthor.textContent = `by ${authorText}`;
        }
        
        // Publishing date
        const previewPublishDate = document.getElementById('previewPublishDate');
        if (previewPublishDate) {
            const date = docData.publish_date || docData.publication_date;
            previewPublishDate.textContent = date ? new Date(date).toLocaleDateString() : 'Unknown';
        }
        
        // Topics
        const previewTopics = document.getElementById('previewTopics');
        if (previewTopics) {
            let topicsText = 'None';
            
            if (docData.topics && Array.isArray(docData.topics) && docData.topics.length > 0) {
                topicsText = docData.topics
                    .map(topic => typeof topic === 'string' ? topic : (topic.name || ''))
                    .filter(name => name)
                    .join(', ');
            }
            
            previewTopics.textContent = topicsText;
        }
        
        // Pages (if available)
        const previewPages = document.getElementById('previewPages');
        if (previewPages) {
            previewPages.textContent = docData.pages || docData.page_count || 'Unknown';
        }
        
        // Added date
        const previewAddedDate = document.getElementById('previewAddedDate');
        if (previewAddedDate) {
            const date = docData.created_at || docData.added_date;
            previewAddedDate.textContent = date ? new Date(date).toLocaleDateString() : 'Unknown';
        }
        
        // Abstract
        const previewAbstract = document.getElementById('previewAbstract');
        if (previewAbstract) {
            previewAbstract.textContent = docData.abstract || docData.description || 'No abstract available.';
        }
        
        // Set read document button action
        const readDocumentBtn = document.getElementById('readDocumentBtn');
        if (readDocumentBtn) {
            readDocumentBtn.onclick = function() {
                // Use docData if it has file_path, otherwise fetch document details again
                if (docData && docData.file_path) {
                    const pdfPath = `/${docData.file_path}`;
                    window.open(pdfPath, '_blank');
                } else {
                    // Fetch document details if file_path is not available
                    fetch(`/api/documents/${documentId}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Error fetching document: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(document => {
                            if (document && document.file_path) {
                                // Open the PDF in a new tab
                                const pdfPath = `/${document.file_path}`;
                                window.open(pdfPath, '_blank');
                            } else {
                                alert('PDF path not found for this document');
                            }
                        })
                        .catch(error => {
                            console.error('Error opening PDF:', error);
                            alert(`Error opening document: ${error.message}`);
                        });
                }
            };
        }
        
        // Display the modal
        previewModal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error showing preview modal:', error);
        alert(`Error loading document preview: ${error.message}`);
    }
}

/**
 * Close the preview modal
 */
function closePreviewModal() {
    const previewModal = document.getElementById('preview-modal');
    if (previewModal) {
        previewModal.style.display = 'none';
    }
}

/**
 * Open the PDF viewer for a document
 * @param {string|number} documentId - The ID of the document to view
 */
function openPdfViewer(documentId) {
    console.log(`Opening PDF viewer for document ID: ${documentId}`);
    
    try {
        // Set the iframe source to the document PDF URL
        const pdfViewer = document.getElementById('pdf-viewer');
        if (pdfViewer) {
            pdfViewer.src = `/api/documents/${documentId}/pdf`;
        } else {
            console.error('PDF viewer iframe not found');
            return;
        }
        
        // Set the modal title if document title is available
        const modalTitle = document.getElementById('pdf-modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Document Viewer';
            
            // Try to fetch document title
            fetch(`/api/documents/${documentId}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.title) {
                        modalTitle.textContent = data.title;
                    }
                })
                .catch(err => console.error('Error fetching document title:', err));
        }
        
        // Show the modal
        const pdfModal = document.getElementById('pdf-modal');
        if (pdfModal) {
            pdfModal.style.display = 'flex';
            pdfModal.classList.add('active');
        } else {
            console.error('PDF modal not found');
        }
    } catch (error) {
        console.error('Error opening PDF viewer:', error);
        alert(`Error opening document: ${error.message}`);
    }
}

/**
 * Close the PDF viewer modal
 */
function closePdfModal() {
    const pdfModal = document.getElementById('pdf-modal');
    if (pdfModal) {
        pdfModal.style.display = 'none';
        pdfModal.classList.remove('active');
        
        // Clear the iframe source to stop loading the PDF
        const pdfViewer = document.getElementById('pdf-viewer');
        if (pdfViewer) {
            pdfViewer.src = '';
        }
    }
}

// Set up global functions for use in other scripts
window.showPreviewModal = showPreviewModal;
window.closePreviewModal = closePreviewModal;
window.openPdfViewer = openPdfViewer;
window.closePdfModal = closePdfModal;

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing document preview functionality');
    
    // Close preview modal when clicking the close button
    const previewCloseButton = document.querySelector('.preview-close');
    if (previewCloseButton) {
        previewCloseButton.addEventListener('click', closePreviewModal);
    }
    
    // Close PDF modal when clicking the close button
    const pdfCloseButton = document.querySelector('#pdf-modal .close-button');
    if (pdfCloseButton) {
        pdfCloseButton.addEventListener('click', closePdfModal);
    }
});
