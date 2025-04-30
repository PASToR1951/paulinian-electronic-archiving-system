/**
 * Document preview functionality
 * Handles preview modal and PDF viewer
 */

// Document preview handlers
document.addEventListener('DOMContentLoaded', function() {
    // Ensure modals are hidden on page load
    initializeModals();
    
    // Close modals on ESC key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePreviewModal();
            closePdfModal();
        }
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        const previewModal = document.getElementById('preview-modal');
        const pdfModal = document.getElementById('pdf-modal');
        
        if (previewModal && event.target === previewModal) {
            closePreviewModal();
        }
        
        if (pdfModal && event.target === pdfModal) {
            closePdfModal();
        }
    });
    
    // Set up read document button in preview modal
    const readDocBtn = document.getElementById('readDocumentBtn');
    if (readDocBtn) {
        readDocBtn.addEventListener('click', function() {
            const docId = this.getAttribute('data-document-id');
            if (docId) {
                fetch(`/api/documents/${docId}`)
                    .then(response => response.json())
                    .then(doc => {
                        openPdfModal(doc);
                    })
                    .catch(error => {
                        console.error('Error fetching document for PDF view:', error);
                    });
            }
        });
    }
});

// Initialize modals to ensure they're hidden on page load
function initializeModals() {
    const modals = [
        document.getElementById('preview-modal'),
        document.getElementById('pdf-modal'),
        document.getElementById('edit-modal'),
        document.getElementById('compiled-edit-modal'),
        document.getElementById('success-modal')
    ];
    
    modals.forEach(modal => {
        if (modal) {
            modal.style.display = 'none';
            console.log(`Initialized modal: ${modal.id}`);
        }
    });
}

/**
 * Displays document details in the preview modal
 * @param {Object} doc - The document object to display
 */
function displayDocumentPreview(doc) {
    console.log('Displaying preview for document:', doc);
    
    // Set document title and author
    const titleElement = document.getElementById('previewTitle');
    titleElement.textContent = doc.title;
    
    // Format authors for display
    const authorElement = document.getElementById('previewAuthor');
    const authorText = doc.authors && doc.authors.length > 0
        ? doc.authors.map(author => author.full_name).join(', ')
        : 'Unknown Author';
    authorElement.textContent = authorText;
    
    // Format publication date
    const publishDateElement = document.getElementById('previewPublishDate');
    const publishDate = doc.publication_date
        ? new Date(doc.publication_date).toLocaleDateString()
        : 'Unknown';
    publishDateElement.textContent = publishDate;
    
    // Format topics with colored tags
    const topicsElement = document.getElementById('previewTopics');
    topicsElement.innerHTML = '';
    
    if (doc.topics && doc.topics.length > 0) {
        const topicTags = doc.topics.map(topic => {
            const color = generateTopicColor(topic.name);
            return `<span class="topic-tag" style="background-color: ${color}">${topic.name}</span>`;
        }).join('');
        topicsElement.innerHTML = topicTags;
    } else {
        topicsElement.textContent = 'None';
    }
    
    // Set page count
    const pagesElement = document.getElementById('previewPages');
    pagesElement.textContent = doc.pages || '0';
    
    // Format added date
    const addedDateElement = document.getElementById('previewAddedDate');
    const addedDate = doc.created_at
        ? new Date(doc.created_at).toLocaleDateString()
        : 'Unknown';
    addedDateElement.textContent = addedDate;
    
    // Set abstract
    const abstractElement = document.getElementById('previewAbstract');
    abstractElement.textContent = doc.abstract || 'No abstract available';
    
    // Setup read document button
    const readButton = document.getElementById('readDocumentBtn');
    readButton.addEventListener('click', () => openPdfViewer(doc.file_path));
    
    // Show the preview modal
    const previewModal = document.getElementById('preview-modal');
    previewModal.style.display = 'flex';
}

// Show document preview
async function showDocumentPreview(doc) {
    if (!doc) {
        console.error('No document provided for preview');
        return;
    }
    
    console.log('Showing preview for document:', doc);
    
    // Get or use helper functions from utilities
    const formatDate = window.docUtils?.formatDate || (date => date ? new Date(date).toLocaleDateString() : 'N/A');
    const getTopicsHtml = window.docUtils?.getTopicsHtml || (topics => topics?.map(t => t.name).join(', ') || 'N/A');
    
    // Get elements
    const previewModal = document.getElementById('preview-modal');
    const titleElement = document.getElementById('previewTitle');
    const authorElement = document.getElementById('previewAuthor');
    const publishDateElement = document.getElementById('previewPublishDate');
    const topicsElement = document.getElementById('previewTopics');
    const pagesElement = document.getElementById('previewPages');
    const addedDateElement = document.getElementById('previewAddedDate');
    const abstractElement = document.getElementById('previewAbstract');
    const readDocumentBtn = document.getElementById('readDocumentBtn');
    
    if (!previewModal || !titleElement) {
        console.error('Preview modal elements not found');
        return;
    }
    
    // Set preview icon based on document category
    updatePreviewIcon(doc.category_name);
    
    // Update preview content
    titleElement.textContent = doc.title || 'Untitled Document';
    
    // Set author info
    if (authorElement) {
        const authors = doc.authors?.map(a => a.full_name).join(', ') || 'Unknown author';
        authorElement.textContent = `by ${authors}`;
    }
    
    // Set publishing date
    if (publishDateElement) {
        if (doc.document_type === 'CONFLUENCE' || doc.document_type === 'SYNERGY') {
            // For compiled documents, use start_year and end_year
            const years = [];
            if (doc.start_year) years.push(doc.start_year);
            if (doc.end_year) years.push(doc.end_year);
            publishDateElement.textContent = years.length ? years.join(' - ') : 'N/A';
        } else {
            // For regular documents, use publication_date
            publishDateElement.textContent = formatDate(doc.publication_date);
        }
    }
    
    // Set topics
    if (topicsElement) {
        topicsElement.innerHTML = getTopicsHtml(doc.topics);
    }
    
    // Set page count
    if (pagesElement) {
        pagesElement.textContent = doc.pages || '0';
    }
    
    // Set added date (created_at)
    if (addedDateElement) {
        addedDateElement.textContent = formatDate(doc.created_at);
    }
    
    // Set abstract or description
    if (abstractElement) {
        if (doc.document_type === 'CONFLUENCE' || doc.document_type === 'SYNERGY') {
            // For compiled documents, show different content
            abstractElement.innerHTML = `
                <h4>Volume ${doc.volume || 'N/A'}${doc.issue ? ', Issue ' + doc.issue : ''}</h4>
                <p>${doc.abstract || doc.description || 'No description available for this compilation.'}</p>
                <p class="studies-count">${doc.child_count || 0} studies in this compilation</p>
            `;
        } else {
            // For regular documents, show abstract
            abstractElement.innerHTML = doc.abstract || 'No abstract available.';
        }
    }
    
    // Set up read document button
    if (readDocumentBtn) {
        readDocumentBtn.setAttribute('data-document-id', doc.id);
        
        // Hide read button for compiled documents that don't have their own file
        if ((doc.document_type === 'CONFLUENCE' || doc.document_type === 'SYNERGY') && !doc.file_path.endsWith('.pdf')) {
            readDocumentBtn.style.display = 'none';
        } else {
            readDocumentBtn.style.display = 'block';
        }
    }
    
    // Show the modal with flex display
    previewModal.style.display = 'flex';
}

// Close preview modal
function closePreviewModal() {
    const previewModal = document.getElementById('preview-modal');
    if (previewModal) {
        previewModal.style.display = 'none';
    }
}

// Update preview icon based on document category
function updatePreviewIcon(categoryName) {
    const previewIcon = document.querySelector('.preview-modal .preview-icon');
    if (!previewIcon) return;
    
    let iconText = '?';
    let iconClass = '';
    
    switch (categoryName?.toLowerCase()) {
        case 'thesis':
            iconText = 'T';
            iconClass = 'thesis-icon';
            break;
        case 'dissertation':
            iconText = 'D';
            iconClass = 'dissertation-icon';
            break;
        case 'confluence':
            iconText = 'C';
            iconClass = 'confluence-icon';
            break;
        case 'synergy':
            iconText = 'S';
            iconClass = 'synergy-icon';
            break;
        default:
            iconText = '?';
            iconClass = '';
    }
    
    previewIcon.textContent = iconText;
    
    // Reset classes first
    previewIcon.className = 'preview-icon';
    
    // Add new class if we have one
    if (iconClass) {
        previewIcon.classList.add(iconClass);
    }
}

// Open PDF viewer modal
function openPdfModal(doc) {
    if (!doc || !doc.file_path) {
        console.error('No document or file path provided for PDF view');
        return;
    }
    
    console.log('Opening PDF view for document:', doc);
    
    const pdfModal = document.getElementById('pdf-modal');
    const pdfViewer = document.getElementById('pdf-viewer');
    const modalTitle = document.getElementById('pdf-modal-title');
    
    if (!pdfModal || !pdfViewer) {
        console.error('PDF modal elements not found');
        return;
    }
    
    // Set modal title
    if (modalTitle) {
        modalTitle.textContent = doc.title || 'Document Viewer';
    }
    
    // Determine the file URL
    let fileUrl = doc.file_path;
    
    // Make sure we have a valid URL
    if (!fileUrl.startsWith('http') && !fileUrl.startsWith('/')) {
        fileUrl = '/' + fileUrl;
    }
    
    // Load the PDF
    pdfViewer.src = fileUrl;
    
    // Show the modal with flex display
    pdfModal.style.display = 'flex';
    
    // Add fullscreen class to body to prevent scrolling
    document.body.classList.add('fullscreen-modal-open');
}

// Close PDF viewer modal
function closePdfModal() {
    const pdfModal = document.getElementById('pdf-modal');
    const pdfViewer = document.getElementById('pdf-viewer');
    
    if (pdfModal) {
        pdfModal.style.display = 'none';
    }
    
    if (pdfViewer) {
        // Clear the iframe source to stop the PDF
        pdfViewer.src = '';
    }
    
    // Remove fullscreen class from body
    document.body.classList.remove('fullscreen-modal-open');
}

// Export functions to window for use in other modules
window.showDocumentPreview = showDocumentPreview;
window.closePreviewModal = closePreviewModal;
window.openPdfModal = openPdfModal;
window.closePdfModal = closePdfModal; 