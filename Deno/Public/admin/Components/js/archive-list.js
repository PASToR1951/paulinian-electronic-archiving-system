/**
 * Archive List Page JavaScript
 * Handles fetching and displaying deleted/archived documents
 */

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Archive list page initialized');
    
    // Load initial data
    loadArchivedDocuments();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize category counters
    updateCategoryCounts();
});

/**
 * Load archived/deleted documents from the database
 * @param {number} page - Page number to load (default: 1)
 * @param {string} category - Category filter (default: 'All')
 * @param {string} searchQuery - Search term (default: '')
 */
async function loadArchivedDocuments(page = 1, category = 'All', searchQuery = '') {
    try {
        // Show loading state
        updateLoadingState(true);
        
        // Build URL with query parameters
        const timestamp = Date.now(); // Cache buster
        let url = `/api/archived-docs?page=${page}&limit=10&_=${timestamp}`;
        
        // Add category filter if not "All"
        if (category !== 'All') {
            url += `&category=${encodeURIComponent(category)}`;
        }
        
        // Add search query if provided
        if (searchQuery && searchQuery.trim() !== '') {
            url += `&search=${encodeURIComponent(searchQuery.trim())}`;
        }
        
        console.log('Fetching archived documents:', url);
        
        // Fetch archived documents from the API
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch archived documents: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received archived documents:', data);
        
        // Handle empty results
        if (!data.documents || data.documents.length === 0) {
            showNoDocumentsMessage();
            updatePagination(1, 1);
            updateLoadingState(false);
            return;
        }
        
        // Render the documents
        renderArchivedDocuments(data.documents, data.current_page || 1, data.total_pages || 1);
        
        // Update category counts
        updateCategoryCounts(data.category_counts || {});
        
    } catch (error) {
        console.error('Error loading archived documents:', error);
        showErrorMessage(error.message);
    } finally {
        updateLoadingState(false);
    }
}

/**
 * Set up all event listeners for the page
 */
function setupEventListeners() {
    // Category filter click handlers
    const categoryElements = document.querySelectorAll('.category');
    categoryElements.forEach(element => {
        element.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active state
            document.querySelectorAll('.category').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            
            // Load documents with the selected category
            loadArchivedDocuments(1, category, getSearchQuery());
        });
    });
    
    // Search input handler
    const searchInput = document.getElementById('search-documents');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const query = this.value;
            const activeCategory = document.querySelector('.category.active');
            const category = activeCategory ? activeCategory.getAttribute('data-category') : 'All';
            
            loadArchivedDocuments(1, category, query);
        }, 500)); // 500ms debounce delay
    }
    
    // Sort dropdown handler
    const sortDropdown = document.getElementById('sort-order');
    if (sortDropdown) {
        sortDropdown.addEventListener('change', function() {
            const sortOrder = this.value;
            const activeCategory = document.querySelector('.category.active');
            const category = activeCategory ? activeCategory.getAttribute('data-category') : 'All';
            
            // Store sort preference
            localStorage.setItem('archive_sort_order', sortOrder);
            
            // Reload documents with new sort order
            loadArchivedDocuments(1, category, getSearchQuery());
        });
        
        // Set initial sort order from localStorage if available
        const savedSortOrder = localStorage.getItem('archive_sort_order');
        if (savedSortOrder) {
            sortDropdown.value = savedSortOrder;
        }
    }
}

/**
 * Render archived documents to the container
 * @param {Array} documents - Array of document objects
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 */
function renderArchivedDocuments(documents, currentPage, totalPages) {
    const container = document.getElementById('documents-container');
    if (!container) {
        console.error('Documents container not found');
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Create document cards for each document
    documents.forEach(doc => {
        const card = createDocumentCard(doc);
        container.appendChild(card);
    });
    
    // Update pagination
    updatePagination(currentPage, totalPages);
}

/**
 * Create a document card for a single archived document
 * @param {Object} doc - Document object
 * @returns {HTMLElement} The document card element
 */
function createDocumentCard(doc) {
    const card = document.createElement('div');
    card.className = 'document-card archived';
    card.setAttribute('data-document-id', doc.id);
    card.setAttribute('data-document-type', (doc.document_type || '').toLowerCase());
    
    // Get the appropriate icon based on document type
    const iconSrc = getDocumentTypeIcon(doc.document_type);
    
    // Format dates
    const publishedDate = doc.publication_date ? formatDate(doc.publication_date) : 'N/A';
    const archivedDate = doc.deleted_at ? formatDate(doc.deleted_at) : 'N/A';
    
    // Create authors string from authors array or single author
    let authorsText = 'Unknown';
    if (doc.authors && Array.isArray(doc.authors) && doc.authors.length > 0) {
        authorsText = doc.authors.map(author => author.name || author).join(', ');
    } else if (doc.author) {
        authorsText = doc.author;
    }
    
    // Build card HTML
    card.innerHTML = `
        <div class="document-icon">
            <img src="${iconSrc}" alt="${doc.document_type || 'Document'} Icon">
        </div>
        <div class="document-info">
            <h3 class="document-title">${doc.title || 'Untitled Document'}</h3>
            <div class="document-meta">
                <div class="meta-item">
                    <i class="fas fa-user"></i> ${authorsText}
                </div>
                <div class="meta-item">
                    <i class="fas fa-calendar"></i> ${publishedDate}
                </div>
                <div class="archived-date">
                    <i class="fas fa-archive"></i> Archived on ${archivedDate}
                </div>
                ${doc.document_type ? `<div class="category-badge ${(doc.document_type || '').toLowerCase()}">${formatCategoryName(doc.document_type || '')}</div>` : ''}
            </div>
        </div>
        <div class="document-actions">
            <button class="action-btn restore-btn" title="Restore Document" data-document-id="${doc.id}">
                <i class="fas fa-trash-restore"></i>
            </button>
        </div>`;
    
    // Add restore button event listener
    const restoreBtn = card.querySelector('.restore-btn');
    if (restoreBtn) {
        restoreBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const docId = this.getAttribute('data-document-id');
            restoreDocument(docId);
        });
    }
    
    return card;
}

/**
 * Restore a document from the archive
 * @param {string|number} docId - Document ID to restore
 */
async function restoreDocument(docId) {
    try {
        console.log(`Restoring document: ${docId}`);
        
        // Show loading state
        updateLoadingState(true);
        
        // Call API to restore document
        const response = await fetch(`/api/restore-document/${docId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to restore document: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Restore result:', result);
        
        // Show success message
        showSuccessModal('Document restored successfully');
        
        // Remove the document card from view
        const card = document.querySelector(`.document-card[data-document-id="${docId}"]`);
        if (card) {
            card.style.opacity = '0';
            setTimeout(() => {
                card.remove();
                
                // Check if we need to reload the documents (if none left)
                const remainingCards = document.querySelectorAll('.document-card').length;
                if (remainingCards === 0) {
                    loadArchivedDocuments();
                }
                
                // Update category counts
                updateCategoryCounts();
            }, 500);
        }
        
    } catch (error) {
        console.error('Error restoring document:', error);
        showErrorMessage('Failed to restore document: ' + error.message);
    } finally {
        updateLoadingState(false);
    }
}

/**
 * Show success modal
 * @param {string} message - Success message to display
 */
function showSuccessModal(message) {
    const modal = document.getElementById('success-modal');
    if (modal) {
        const messageElement = modal.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        modal.style.display = 'flex';
        
        // Hide after 3 seconds
        setTimeout(() => {
            modal.style.display = 'none';
        }, 3000);
    }
}

/**
 * Show error message in the container
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
    const container = document.getElementById('documents-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

/**
 * Show no documents message
 */
function showNoDocumentsMessage() {
    const container = document.getElementById('documents-container');
    if (container) {
        container.innerHTML = `
            <div class="no-docs">
                <i class="fas fa-archive fa-3x"></i>
                <p>No archived documents found</p>
                <p class="small">Documents that are archived will appear here</p>
            </div>
        `;
    }
}

/**
 * Update category counts
 * @param {Object} counts - Object with category counts
 */
function updateCategoryCounts(counts = null) {
    if (!counts) {
        // If no counts provided, fetch them from the API
        fetch('/api/archived-category-counts')
            .then(response => response.json())
            .then(data => {
                updateCategoryCounts(data.counts);
            })
            .catch(error => {
                console.error('Error fetching category counts:', error);
            });
        return;
    }
    
    // Update each category count
    document.querySelectorAll('.category').forEach(category => {
        const categoryName = category.getAttribute('data-category');
        const countElement = category.querySelector('.category-file-count');
        
        if (countElement) {
            const count = categoryName === 'All' 
                ? Object.values(counts).reduce((sum, count) => sum + count, 0)
                : (counts[categoryName] || 0);
                
            countElement.textContent = `${count} ${count === 1 ? 'file' : 'files'}`;
        }
    });
}

/**
 * Update pagination controls
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 */
function updatePagination(currentPage, totalPages) {
    const entriesInfo = document.getElementById('entries-info');
    const pageLinks = document.getElementById('page-links');
    
    if (!entriesInfo || !pageLinks) {
        return;
    }
    
    // Update entries info
    const documentsCount = document.querySelectorAll('.document-card').length;
    entriesInfo.textContent = `Page ${currentPage} of ${totalPages} (${documentsCount} documents)`;
    
    // Clear previous page links
    pageLinks.innerHTML = '';
    
    // Don't show pagination if only one page
    if (totalPages <= 1) {
        return;
    }
    
    // Create pagination controls
    const createPageButton = (page, text, isActive = false, isDisabled = false) => {
        const button = document.createElement('button');
        button.className = `page-link ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`;
        button.textContent = text;
        button.disabled = isDisabled;
        
        if (!isDisabled && !isActive) {
            button.addEventListener('click', () => {
                const activeCategory = document.querySelector('.category.active');
                const category = activeCategory ? activeCategory.getAttribute('data-category') : 'All';
                loadArchivedDocuments(page, category, getSearchQuery());
            });
        }
        
        return button;
    };
    
    // Previous button
    pageLinks.appendChild(createPageButton(
        currentPage - 1,
        'Previous',
        false,
        currentPage === 1
    ));
    
    // Page numbers
    const maxPageButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    if (endPage - startPage + 1 < maxPageButtons) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    // First page
    if (startPage > 1) {
        pageLinks.appendChild(createPageButton(1, '1'));
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            pageLinks.appendChild(ellipsis);
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        pageLinks.appendChild(createPageButton(i, i.toString(), i === currentPage));
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            pageLinks.appendChild(ellipsis);
        }
        pageLinks.appendChild(createPageButton(totalPages, totalPages.toString()));
    }
    
    // Next button
    pageLinks.appendChild(createPageButton(
        currentPage + 1,
        'Next',
        false,
        currentPage === totalPages
    ));
}

/**
 * Get the current search query
 * @returns {string} Current search query
 */
function getSearchQuery() {
    const searchInput = document.getElementById('search-documents');
    return searchInput ? searchInput.value : '';
}

/**
 * Update the loading state
 * @param {boolean} isLoading - Whether the page is loading
 */
function updateLoadingState(isLoading) {
    const container = document.getElementById('documents-container');
    if (container) {
        if (isLoading) {
            container.classList.add('loading');
            // Add loading indicator if not already present
            if (!document.getElementById('loading-indicator')) {
                const loadingIndicator = document.createElement('div');
                loadingIndicator.id = 'loading-indicator';
                loadingIndicator.className = 'loading-indicator';
                loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Loading...</span>';
                container.appendChild(loadingIndicator);
            }
        } else {
            container.classList.remove('loading');
            // Remove loading indicator
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
    }
}

/**
 * Get document type icon
 * @param {string} documentType - Document type
 * @returns {string} Icon URL
 */
function getDocumentTypeIcon(documentType = '') {
    const type = (documentType || '').toLowerCase();
    
    switch (type) {
        case 'thesis':
            return 'icons/Category-icons/thesis.png';
        case 'dissertation':
            return 'icons/Category-icons/dissertation.png';
        case 'confluence':
            return 'icons/Category-icons/confluence.png';
        case 'synergy':
            return 'icons/Category-icons/synergy.png';
        default:
            return 'icons/Category-icons/default_category_icon.png';
    }
}

/**
 * Format category name
 * @param {string} category - Category name
 * @returns {string} Formatted category name
 */
function formatCategoryName(category = '') {
    if (!category) return 'Uncategorized';
    
    // Capitalize first letter
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

/**
 * Debounce function for event handlers
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 