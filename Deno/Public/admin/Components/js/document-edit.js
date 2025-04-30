/**
 * Document editing functionality
 * Handles regular document editing
 */

// Initialize edit functionality
document.addEventListener('DOMContentLoaded', function() {
    // Set up edit form submission
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const documentId = this.getAttribute('data-document-id');
            if (documentId) {
                handleEditFormSubmit(documentId, this);
            }
        });
    }
    
    // Set up file upload box in edit form
    const uploadBox = document.getElementById('edit-upload-box');
    const fileInput = document.getElementById('edit-file');
    
    if (uploadBox && fileInput) {
        uploadBox.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function() {
            updateFileDisplay(this);
        });
    }
});

// Handle form submission for document editing
async function handleEditFormSubmit(documentId, form) {
    try {
        const formData = new FormData(form);
        
        // Basic validation
        const title = formData.get('title');
        if (!title) {
            alert('Title is required');
            return;
        }
        
        // Prepare document data
        const documentData = {
            title: title,
            publication_date: formData.get('publication_date') || null,
            category_name: formData.get('category') || null,
            volume: formData.get('volume') || null,
        };
        
        // Get authors (may be from selected authors list)
        const selectedAuthors = getSelectedAuthors();
        if (selectedAuthors.length > 0) {
            documentData.authors = selectedAuthors;
        }
        
        // Get topics (may be from selected topics list)
        const selectedTopics = getSelectedTopics();
        if (selectedTopics.length > 0) {
            documentData.topics = selectedTopics;
        }
        
        // Check if we have a file to upload
        const fileInput = document.getElementById('edit-file');
        let fileUploadResult = null;
        
        if (fileInput && fileInput.files.length > 0) {
            // Upload file first
            const fileFormData = new FormData();
            fileFormData.append('file', fileInput.files[0]);
            
            const fileUploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: fileFormData
            });
            
            if (!fileUploadResponse.ok) {
                throw new Error('Failed to upload file');
            }
            
            fileUploadResult = await fileUploadResponse.json();
            documentData.file_path = fileUploadResult.filePath;
            
            // If we got metadata from the upload, use it
            if (fileUploadResult.metadata) {
                documentData.abstract = fileUploadResult.metadata.abstract || documentData.abstract;
                documentData.pages = fileUploadResult.metadata.pageCount || documentData.pages;
            }
        }
        
        // Send update request
        const response = await fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update document');
        }
        
        // If we uploaded a file, also update the file record
        if (fileUploadResult) {
            const fileData = {
                file_name: fileUploadResult.originalName,
                file_path: fileUploadResult.filePath,
                file_size: fileUploadResult.size,
                file_type: fileUploadResult.fileType,
                document_id: documentId
            };
            
            // Create or update file record
            const fileResponse = await fetch('/api/files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fileData)
            });
            
            if (!fileResponse.ok) {
                console.warn('Warning: File record may not have been updated properly');
            }
        }
        
        // Show success message
        window.docUtils?.showSuccess('Document updated successfully', () => {
            closeEditModal();
            // Reload document list
            if (window.loadDocuments) {
                window.loadDocuments(window.currentPage || 1);
            }
        }) || alert('Document updated successfully');
        
    } catch (error) {
        console.error('Error updating document:', error);
        window.docUtils?.showError(`Error: ${error.message}`) || alert(`Error: ${error.message}`);
    }
}

// Edit a document - main entry point
async function editDocument(documentId) {
    console.log('Editing document:', documentId);
    
    try {
        // Fetch document data
        const response = await fetch(`/api/documents/${documentId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch document (status ${response.status})`);
        }
        
        const documentData = await response.json();
        console.log('Document data:', documentData);
        
        // Determine if this is a regular document or a compiled document
        if (documentData.document_type === 'CONFLUENCE' || documentData.document_type === 'SYNERGY') {
            // Compiled document - use different edit form
            if (window.editCompiledDocument) {
                window.editCompiledDocument(documentId, documentData);
            } else {
                console.error('Compiled document editing not available');
            }
        } else {
            // Regular document
            editSingleDocument(documentId, documentData);
        }
    } catch (error) {
        console.error('Error preparing document edit:', error);
        window.docUtils?.showError(`Error: ${error.message}`) || alert(`Error: ${error.message}`);
    }
}

// Edit a single (non-compiled) document
function editSingleDocument(documentId, documentData) {
    // Get form elements
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const titleInput = document.getElementById('edit-title');
    const authorInput = document.getElementById('edit-author');
    const publicationDateInput = document.getElementById('edit-publication-date');
    const volumeInput = document.getElementById('edit-volume');
    const topicInput = document.getElementById('edit-topic');
    const categorySelect = document.getElementById('edit-category');
    
    if (!editModal || !editForm) {
        console.error('Edit modal or form not found');
        return;
    }
    
    // Set form data attribute
    editForm.setAttribute('data-document-id', documentId);
    
    // Fill form with document data
    if (titleInput) titleInput.value = documentData.title || '';
    
    // Handle authors (may need to populate selected authors list)
    if (authorInput && documentData.authors) {
        // Clear any existing selected authors
        const selectedAuthorsContainer = document.getElementById('edit-selected-authors');
        if (selectedAuthorsContainer) {
            selectedAuthorsContainer.innerHTML = '';
            
            // Add each author as a selected item
            documentData.authors.forEach(author => {
                addSelectedAuthor(author);
            });
        }
    }
    
    // Set publication date
    if (publicationDateInput && documentData.publication_date) {
        // Format date as YYYY-MM-DD for input element
        const date = new Date(documentData.publication_date);
        if (!isNaN(date.getTime())) {
            const formattedDate = date.toISOString().split('T')[0];
            publicationDateInput.value = formattedDate;
        }
    }
    
    // Set volume
    if (volumeInput) volumeInput.value = documentData.volume || '';
    
    // Handle topics (may need to populate selected topics list)
    if (topicInput && documentData.topics) {
        // Clear any existing selected topics
        const selectedTopicsContainer = document.getElementById('edit-selected-topics');
        if (selectedTopicsContainer) {
            selectedTopicsContainer.innerHTML = '';
            
            // Add each topic as a selected item
            documentData.topics.forEach(topic => {
                addSelectedTopic(topic);
            });
        }
    }
    
    // Set category
    if (categorySelect && documentData.category_name) {
        // Find the option with the matching category name
        const options = Array.from(categorySelect.options);
        const matchingOption = options.find(option => 
            option.value.toLowerCase() === documentData.category_name.toLowerCase() ||
            option.textContent.toLowerCase() === documentData.category_name.toLowerCase()
        );
        
        if (matchingOption) {
            categorySelect.value = matchingOption.value;
        }
    }
    
    // Show current file information if available
    updateCurrentFileInfo(documentData);
    
    // Update preview
    updateEditPreview(documentData);
    
    // Show the modal
    editModal.style.display = 'flex';
}

// Close the edit modal
function closeEditModal() {
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        editModal.style.display = 'none';
        
        // Reset form
        const editForm = document.getElementById('edit-form');
        if (editForm) {
            editForm.reset();
            editForm.removeAttribute('data-document-id');
        }
        
        // Clear selected authors and topics
        const selectedAuthors = document.getElementById('edit-selected-authors');
        const selectedTopics = document.getElementById('edit-selected-topics');
        
        if (selectedAuthors) selectedAuthors.innerHTML = '';
        if (selectedTopics) selectedTopics.innerHTML = '';
        
        // Clear file display
        const fileContainer = document.getElementById('current-file-container');
        if (fileContainer) fileContainer.innerHTML = '';
    }
}

// Update file display when a new file is selected
function updateFileDisplay(fileInput) {
    if (!fileInput || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    const fileContainer = document.getElementById('current-file-container');
    
    if (fileContainer) {
        fileContainer.innerHTML = `
            <div class="selected-file">
                <i class="far fa-file-pdf"></i>
                <span>${file.name}</span>
                <small>(${(file.size / 1024).toFixed(1)} KB)</small>
                <button type="button" class="remove-file-btn" title="Remove file">×</button>
            </div>
        `;
        
        // Add remove button functionality
        const removeBtn = fileContainer.querySelector('.remove-file-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                fileInput.value = '';
                fileContainer.innerHTML = '';
            });
        }
    }
}

// Update current file information in the edit form
function updateCurrentFileInfo(documentData) {
    const fileContainer = document.getElementById('current-file-container');
    if (!fileContainer) return;
    
    // Check if the document has a file
    if (documentData.file_path) {
        let fileName = 'Document file';
        let fileSize = '';
        
        // Try to get file information if available
        if (documentData.files && documentData.files.length > 0) {
            const file = documentData.files[0];
            fileName = file.file_name || fileName;
            fileSize = file.file_size ? ` (${(file.file_size / 1024).toFixed(1)} KB)` : '';
        } else {
            // Extract filename from path
            const pathParts = documentData.file_path.split('/');
            fileName = pathParts[pathParts.length - 1];
        }
        
        fileContainer.innerHTML = `
            <div class="current-file">
                <i class="far fa-file-pdf"></i>
                <span>${fileName}</span>
                <small>${fileSize}</small>
                <span class="file-note">Current file</span>
            </div>
        `;
    }
}

// Update the edit preview with document data
function updateEditPreview(documentData) {
    // Get utility functions
    const formatDate = window.docUtils?.formatDate || (date => date ? new Date(date).toLocaleDateString() : 'N/A');
    const getTopicsHtml = window.docUtils?.getTopicsHtml || (topics => topics?.map(t => t.name).join(', ') || 'N/A');
    
    // Get preview elements
    const titleElement = document.getElementById('edit-preview-title');
    const authorElement = document.getElementById('edit-preview-author');
    const yearElement = document.getElementById('edit-preview-year');
    const topicElement = document.getElementById('edit-preview-topic');
    const pageCountElement = document.getElementById('edit-page-count');
    const dateElement = document.getElementById('edit-preview-added-date');
    const abstractElement = document.getElementById('edit-preview-abstract');
    const readButton = document.getElementById('edit-read-document');
    
    // Update preview content
    if (titleElement) titleElement.textContent = documentData.title || 'Document Title';
    
    if (authorElement) {
        const authors = documentData.authors?.map(a => a.full_name).join(', ') || 'Unknown author';
        authorElement.textContent = `by ${authors}`;
    }
    
    if (yearElement) yearElement.textContent = formatDate(documentData.publication_date);
    
    if (topicElement) topicElement.innerHTML = getTopicsHtml(documentData.topics);
    
    if (pageCountElement) pageCountElement.textContent = documentData.pages || '0';
    
    if (dateElement) dateElement.textContent = formatDate(documentData.updated_at || documentData.created_at);
    
    if (abstractElement) abstractElement.innerHTML = documentData.abstract || 'No abstract available.';
    
    // Set up read button
    if (readButton && documentData.file_path) {
        readButton.style.display = 'block';
        readButton.onclick = function() {
            if (window.openPdfModal) {
                window.openPdfModal(documentData);
            }
        };
    } else if (readButton) {
        readButton.style.display = 'none';
    }
}

// Get selected authors from the UI
function getSelectedAuthors() {
    const selectedAuthors = [];
    const authorElements = document.querySelectorAll('#edit-selected-authors .selected-author');
    
    authorElements.forEach(element => {
        const authorId = element.getAttribute('data-id');
        const authorName = element.getAttribute('data-name');
        
        if (authorId && authorName) {
            selectedAuthors.push({
                id: authorId,
                full_name: authorName
            });
        } else if (authorName) {
            // Just name without ID (new author)
            selectedAuthors.push({
                full_name: authorName
            });
        }
    });
    
    return selectedAuthors;
}

// Get selected topics from the UI
function getSelectedTopics() {
    const selectedTopics = [];
    const topicElements = document.querySelectorAll('#edit-selected-topics .selected-topic');
    
    topicElements.forEach(element => {
        const topicId = element.getAttribute('data-id');
        const topicName = element.getAttribute('data-name');
        
        if (topicId && topicName) {
            selectedTopics.push({
                id: topicId,
                name: topicName
            });
        } else if (topicName) {
            // Just name without ID (new topic)
            selectedTopics.push({
                name: topicName
            });
        }
    });
    
    return selectedTopics;
}

// Add a selected author to the UI
function addSelectedAuthor(author) {
    const selectedAuthorsContainer = document.getElementById('edit-selected-authors');
    if (!selectedAuthorsContainer) return;
    
    // Check if this author is already selected
    const existingAuthor = selectedAuthorsContainer.querySelector(`.selected-author[data-id="${author.id}"]`);
    if (existingAuthor) return;
    
    const authorElement = document.createElement('div');
    authorElement.className = 'selected-author';
    authorElement.setAttribute('data-id', author.id || '');
    authorElement.setAttribute('data-name', author.full_name || author.name || '');
    
    authorElement.innerHTML = `
        <span>${author.full_name || author.name}</span>
        <button type="button" class="remove-author-btn" title="Remove author">×</button>
    `;
    
    // Add remove button functionality
    const removeBtn = authorElement.querySelector('.remove-author-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            authorElement.remove();
            // Update preview when author is removed
            updateEditPreviewAuthor();
        });
    }
    
    selectedAuthorsContainer.appendChild(authorElement);
    
    // Update preview with new author
    updateEditPreviewAuthor();
}

// Add a selected topic to the UI
function addSelectedTopic(topic) {
    const selectedTopicsContainer = document.getElementById('edit-selected-topics');
    if (!selectedTopicsContainer) return;
    
    // Check if this topic is already selected
    const existingTopic = selectedTopicsContainer.querySelector(`.selected-topic[data-id="${topic.id}"]`);
    if (existingTopic) return;
    
    const topicElement = document.createElement('div');
    topicElement.className = 'selected-topic';
    topicElement.setAttribute('data-id', topic.id || '');
    topicElement.setAttribute('data-name', topic.name || '');
    
    topicElement.innerHTML = `
        <span>${topic.name}</span>
        <button type="button" class="remove-topic-btn" title="Remove topic">×</button>
    `;
    
    // Add remove button functionality
    const removeBtn = topicElement.querySelector('.remove-topic-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            topicElement.remove();
            // Update preview when topic is removed
            updateEditPreviewTopic();
        });
    }
    
    selectedTopicsContainer.appendChild(topicElement);
    
    // Update preview with new topic
    updateEditPreviewTopic();
}

// Update the preview author when selection changes
function updateEditPreviewAuthor() {
    const authorElement = document.getElementById('edit-preview-author');
    if (!authorElement) return;
    
    const authors = getSelectedAuthors().map(a => a.full_name).join(', ') || 'Unknown author';
    authorElement.textContent = `by ${authors}`;
}

// Update the preview topic when selection changes
function updateEditPreviewTopic() {
    const topicElement = document.getElementById('edit-preview-topic');
    if (!topicElement) return;
    
    const topics = getSelectedTopics();
    topicElement.innerHTML = window.docUtils?.getTopicsHtml(topics) || topics.map(t => t.name).join(', ') || 'N/A';
}

// Export functions to window for use in other modules
window.editDocument = editDocument;
window.closeEditModal = closeEditModal;
window.addSelectedAuthor = addSelectedAuthor;
window.addSelectedTopic = addSelectedTopic; 