/**
 * Document archive functionality
 */

let isArchiveMode = false;

/**
 * Initialize archive functionality
 */
function initializeArchive() {
    // Add event listener to the archive button
    const archiveBtn = document.getElementById('archive-btn');
    if (archiveBtn) {
        archiveBtn.addEventListener('click', toggleArchiveMode);
    }
}

/**
 * Toggle between normal and archive mode
 */
function toggleArchiveMode() {
    isArchiveMode = !isArchiveMode;
    updateArchiveButtonUI();
    
    if (isArchiveMode) {
        loadArchivedDocuments();
    } else {
        // Return to normal document view
        if (window.documentFilters) {
            window.documentFilters.resetFilters();
        }
        loadDocuments(1, true);
    }
}

/**
 * Update the archive button UI based on the current mode
 */
function updateArchiveButtonUI() {
    const archiveBtn = document.getElementById('archive-btn');
    if (archiveBtn) {
        if (isArchiveMode) {
            archiveBtn.classList.add('active');
            archiveBtn.innerHTML = '<i class="fas fa-times"></i>';
            archiveBtn.title = 'Exit Archive Mode';
            
            // Update category header label
            const label = document.querySelector('.category-header .label');
            if (label) {
                label.firstChild.textContent = 'Archived Documents';
            }
        } else {
            archiveBtn.classList.remove('active');
            archiveBtn.innerHTML = '<i class="fas fa-archive"></i>';
            archiveBtn.title = 'View Archived Documents';
            
            // Restore original category header label
            const label = document.querySelector('.category-header .label');
            if (label) {
                label.firstChild.textContent = 'Categories';
            }
        }
    }
}

/**
 * Load archived documents from the API
 * @param {number} page - Page number to load
 */
async function loadArchivedDocuments(page = 1) {
    try {
        // Show loading indicator
        document.getElementById('documents-container').innerHTML = '<div class="loading-documents"><i class="fas fa-spinner fa-spin"></i> Loading archived documents...</div>';
        
        // Get filters and sort
        const category = window.documentFilters ? window.documentFilters.getCurrentCategoryFilter() : null;
        const sortOrder = window.documentFilters ? window.documentFilters.getCurrentSortOrder() : 'latest';
        
        // Construct URL with parameters
        let url = `/api/documents/archived?page=${page}&limit=10&sort=${sortOrder}`;
        if (category && category !== 'All') {
            url += `&category=${encodeURIComponent(category)}`;
        }
        
        // Fetch archived documents
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const { documents, totalPages, totalDocuments } = data;
        
        // Render archived documents
        renderArchivedDocuments('documents-container', documents);
        
        // Update pagination
        if (window.documentFilters) {
            window.documentFilters.updatePagination(totalPages);
            window.documentFilters.setCurrentPage(page);
            window.documentFilters.setVisibleEntriesCount(documents.length);
        }
        
    } catch (error) {
        console.error('Error loading archived documents:', error);
        document.getElementById('documents-container').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading archived documents: ${error.message}</p>
                <button onclick="loadArchivedDocuments(1)">Try Again</button>
            </div>
        `;
    }
}

/**
 * Render archived documents in the container
 * @param {string} containerId - ID of the container element
 * @param {Array} documents - Array of document objects
 */
function renderArchivedDocuments(containerId, documents) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container not found: ${containerId}`);
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // If no documents, show empty state
    if (!documents || documents.length === 0) {
        container.innerHTML = `
            <div class="no-docs">
                <div class="empty-state">
                    <i class="fas fa-archive empty-icon"></i>
                    <p>No archived documents found</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Render each archived document
    documents.forEach(doc => {
        const card = createArchivedDocumentCard(doc);
        container.appendChild(card);
    });
}

/**
 * Create a card for an archived document
 * @param {Object} doc - Document object
 * @returns {HTMLElement} - Document card element
 */
function createArchivedDocumentCard(doc) {
    // Create card element
    const card = document.createElement('div');
    card.className = 'document-card archived';
    card.dataset.documentId = doc.id;
    
    // Format document info
    const authors = doc.authors ? formatAuthors(doc.authors) : 'Unknown Author';
    const pubDate = formatDate(doc.publish_date || doc.publication_date);
    const documentType = doc.document_type || '';
    const category = formatCategoryName(documentType);
    const archivedDate = formatDate(doc.deleted_at);
    
    // Create card HTML
    card.innerHTML = `
        <div class="document-icon">
            <img src="${getCategoryIcon(documentType)}" alt="${category} Icon">
        </div>
        <div class="document-info">
            <h3 class="document-title">${doc.title || 'Untitled Document'}</h3>
            <div class="document-meta">
                Volume ${doc.volume || ''} ${doc.volume && doc.issue ? '| Issue ' + doc.issue : ''} 
                <br>Authors: ${authors}
                <div class="archived-date">Archived: ${archivedDate}</div>
            </div>
            <div class="category-badge ${(documentType || '').toLowerCase()}">${category}</div>
        </div>
        <div class="document-actions">
            <button class="action-btn restore-btn" title="Restore Document" data-document-id="${doc.id}">
                <i class="fas fa-undo"></i> Restore
            </button>
        </div>
    `;
    
    // Add event listener for restore button
    card.querySelector('.restore-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        restoreDocument(doc.id);
    });
    
    return card;
}

/**
 * Restore a document from the archive
 * @param {number} documentId - ID of the document to restore
 */
async function restoreDocument(documentId) {
    try {
        // Show loading state on the button
        const restoreBtn = document.querySelector(`.restore-btn[data-document-id="${documentId}"]`);
        if (restoreBtn) {
            restoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restoring...';
            restoreBtn.disabled = true;
        }
        
        // Call the restore API
        const response = await fetch(`/api/documents/${documentId}/restore`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Server returned ${response.status}`);
        }
        
        // Show success message
        showToast('Document restored successfully!');
        
        // Reload archived documents to update the list
        loadArchivedDocuments(window.documentFilters ? window.documentFilters.getCurrentPage() : 1);
        
    } catch (error) {
        console.error('Error restoring document:', error);
        showToast(`Error: ${error.message}`, 'error');
        
        // Reset button state
        const restoreBtn = document.querySelector(`.restore-btn[data-document-id="${documentId}"]`);
        if (restoreBtn) {
            restoreBtn.innerHTML = '<i class="fas fa-undo"></i> Restore';
            restoreBtn.disabled = false;
        }
    }
}

/**
 * Archive (soft delete) a document
 * @param {number} documentId - ID of the document to archive
 */
async function archiveDocument(documentId) {
    try {
        // Confirm before archiving
        if (!confirm('Are you sure you want to archive this document? It will be moved to the archive.')) {
            return;
        }
        
        // Call the soft delete API
        const response = await fetch(`/api/documents/${documentId}/soft-delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Server returned ${response.status}`);
        }
        
        // Show success message
        showToast('Document archived successfully!');
        
        // Reload documents to update the list
        if (isArchiveMode) {
            loadArchivedDocuments(window.documentFilters ? window.documentFilters.getCurrentPage() : 1);
        } else {
            loadDocuments(window.documentFilters ? window.documentFilters.getCurrentPage() : 1);
        }
        
    } catch (error) {
        console.error('Error archiving document:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast ('success' or 'error')
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-progress"></div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    // Allow clicking to dismiss
    toast.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
}

// Export functions for use in other modules
window.documentArchive = {
    initializeArchive,
    toggleArchiveMode,
    loadArchivedDocuments,
    archiveDocument,
    restoreDocument
}; 