// Global variables for document list functionality
let globalDisplayedDocIds = new Set();
let expandedDocIds = []; // Tracks which compiled documents are expanded

// Debug function to fetch authors directly
async function fetchAuthorsForDocument(documentId) {
    try {
        console.log(`DEBUG: Fetching authors directly for document ${documentId}`);
        const response = await fetch(`/api/document-authors/${documentId}`);
        
        if (!response.ok) {
            console.error(`Error fetching authors: ${response.status} ${response.statusText}`);
            return [];
        }
        
        const data = await response.json();
        console.log(`Authors from API for document ${documentId}:`, data.authors);
        return data.authors;
    } catch (error) {
        console.error('Error fetching authors:', error);
        return [];
    }
}

/**
 * Initialize the document list and set up event listeners
 */
function initializeDocumentList() {
    console.log('INIT DEBUG: Initializing document list');
    
    // Add styles for volume-issue span
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .volume-issue {
            font-size: 0.8em;
            font-weight: normal;
            color: #666;
            margin-left: 10px;
            white-space: nowrap;
        }
        
        .document-title {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .publication-date {
            white-space: nowrap;
            color: #555;
            font-weight: 500;
        }
        
        .publication-date i {
            color: #4a6da7;
            margin-right: 4px;
        }
        
        .author-list i {
            color: #4a6da7;
            margin-right: 4px;
        }
    `;
    document.head.appendChild(styleEl);
    
    // Initialize filters and pagination via document-filters.js
    if (typeof window.documentFilters === 'object' && window.documentFilters !== null) {
        console.log('INIT DEBUG: window.documentFilters already initialized, reusing');
    } else {
        console.log('INIT DEBUG: window.documentFilters not found, initializing now');
        // Check if the function exists in the global scope
        if (typeof initializeFiltersAndPagination === 'function') {
            initializeFiltersAndPagination();
        } else {
            console.error('INIT DEBUG: initializeFiltersAndPagination function not found. Make sure document-filters.js is loaded before document-list.js');
            
            // Create a basic documentFilters object to prevent errors
            window.documentFilters = {
                setCurrentPage: () => console.log('Stub setCurrentPage called'),
                getCurrentCategoryFilter: () => null,
                getCurrentSortOrder: () => 'latest',
                getCurrentSearchQuery: () => '',
                updatePagination: () => console.log('Stub updatePagination called')
            };
        }
    }
    
    console.log('INIT DEBUG: Document filters status:', window.documentFilters ? 'Available' : 'Not available');
    
    // Make functions globally available
    window.documentList = {
        loadDocuments,
        refreshDocumentList,
        renderDocuments
    };
    
    console.log('INIT DEBUG: Exported document list functions to window.documentList');
    
    // Initial document load
    console.log('INIT DEBUG: Triggering initial document load');
    loadDocuments(1, true);
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('INIT DEBUG: DOM content loaded, initializing document list');
    initializeDocumentList();
});

/**
 * Fetch documents from the database with specified filters
 * @param {number} page - Page number to fetch 
 * @param {string|null} category - Category filter or null for all
 * @param {string} sortOrder - Sort order ('latest' or 'earliest')
 * @param {number} limit - Number of documents per page
 * @param {boolean} showLoading - Whether to show loading indicator
 * @returns {Promise<Object>} - The documents data
 */
async function fetchDocumentsFromDB(page = 1, category = null, sortOrder = 'latest', limit = 10, showLoading = true) {
    try {
        // Get search query if available
        const searchQuery = window.documentFilters && window.documentFilters.getCurrentSearchQuery 
            ? window.documentFilters.getCurrentSearchQuery() 
            : '';
            
        console.log(`Fetching documents: page=${page}, category=${category}, sort=${sortOrder}, limit=${limit}, search=${searchQuery}`);
        
        // Construct the API URL with query parameters
        let url = `/api/documents?page=${page}&size=${limit}&sort=${sortOrder}`;
        if (category && category !== 'All') {
            url += `&category=${encodeURIComponent(category)}`;
        }
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        
        // Add cache busting parameter if force refreshing
        if (window.forceRefreshTimestamp) {
            url += `&t=${window.forceRefreshTimestamp}`;
            // Clear the timestamp so we don't keep forcing refresh
            window.forceRefreshTimestamp = null;
        }
        
        // Show loading indicator in the container if requested
        if (showLoading) {
            document.getElementById('documents-container').innerHTML = '<div class="loading-documents"><i class="fas fa-spinner fa-spin"></i> Loading documents...</div>';
        }
        
        console.log('FETCH DEBUG: Making API request to URL:', url);
        console.log('FETCH DEBUG: Current document filters:', window.documentFilters);
        
        // Fetch documents from the API
        const response = await fetch(url, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        console.log('FETCH DEBUG: Response status:', response.status);
        console.log('FETCH DEBUG: Response headers:', Object.fromEntries([...response.headers]));
        
        if (!response.ok) {
            console.error('FETCH DEBUG: Response error:', response.status, response.statusText);
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('FETCH DEBUG: Documents data received:', data);
        
        if (data.documents && data.documents.length > 0) {
            console.log('FETCH DEBUG: First document:', data.documents[0]);
            // Check if is_compiled properties are set correctly
            data.documents.forEach((doc, index) => {
                console.log(`FETCH DEBUG: Document ${index} (ID: ${doc.id}): is_compiled = ${doc.is_compiled}, doc_type = ${doc.doc_type}, title = "${doc.title}"`);
                console.log(`FETCH DEBUG: Document ${index} deleted_at:`, doc.deleted_at);
                
                // Enhanced debugging to check all properties
                console.log(`FETCH DEBUG: Full properties of document ${doc.id}:`, Object.keys(doc));
                console.log(`FETCH DEBUG: Document ${doc.id} deleted_at type:`, typeof doc.deleted_at);
                if (doc.deleted_at) {
                    console.warn(`URGENT: Document ${doc.id} has deleted_at set but is still included in results!`);
                }
            });
            
            // Log all possible category-related fields
            const firstDoc = data.documents[0];
            console.log('FETCH DEBUG: All properties of first document:', Object.keys(firstDoc));
        } else {
            console.log('FETCH DEBUG: No documents returned');
        }
        
        // Filter out any documents that might have deleted_at set
        // This is an extra safeguard to ensure deleted documents don't appear in the main view
        if (data.documents) {
            // First log any documents that should be filtered out
            const deletedDocs = data.documents.filter(doc => doc.deleted_at);
            if (deletedDocs.length > 0) {
                console.warn('FETCH DEBUG: Found deleted documents that should be filtered out:', deletedDocs);
            }
            
            // Add client-side filtering as a backup for server filter
            const filteredDocs = data.documents.filter(doc => {
                if (doc.deleted_at) {
                    console.warn(`CLIENT: Filtering out document ${doc.id} (${doc.title}) because it has deleted_at set`);
                    return false;
                }
                return true;
            });
            
            // Check if we filtered anything
            if (filteredDocs.length !== data.documents.length) {
                console.warn(`CLIENT: Filtered out ${data.documents.length - filteredDocs.length} deleted documents on client side!`);
                // Replace the documents with filtered version
                data.documents = filteredDocs;
            }
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching documents:', error);
        document.getElementById('documents-container').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading documents: ${error.message}</p>
                <button onclick="loadDocuments(${page})">Try Again</button>
            </div>
        `;
        return { documents: [], totalDocuments: 0, totalPages: 0 };
    }
}

/**
 * Load documents and update the display
 * @param {number} page - Page number to load
 * @param {boolean} resetTracking - Whether to reset tracking variables
 */
async function loadDocuments(page = 1, resetTracking = true) {
    console.log(`Loading documents for page ${page}, resetTracking=${resetTracking}`);
    console.log('LOAD DEBUG: Current window.documentFilters:', window.documentFilters);
    
    // Validate page number
    if (page < 1) page = 1;
    
    // Update current page in filters
    if (window.documentFilters) {
        window.documentFilters.setCurrentPage(page);
    } else {
        console.error('LOAD DEBUG: window.documentFilters is not initialized!');
    }
    
    // Reset tracking if requested
    if (resetTracking) {
        globalDisplayedDocIds = new Set();
    }
    
    try {
        // Get filters and sort from document-filters.js
        const category = window.documentFilters ? window.documentFilters.getCurrentCategoryFilter() : null;
        const sortOrder = window.documentFilters ? window.documentFilters.getCurrentSortOrder() : 'latest';
        
        console.log('LOAD DEBUG: Using category filter:', category);
        console.log('LOAD DEBUG: Using sort order:', sortOrder);
        
        // Fetch documents from the API
        const data = await fetchDocumentsFromDB(
            page,
            category,
            sortOrder,
            10, // documents per page
            true // show loading indicator
        );
        
        if (!data || !data.documents) {
            console.error('LOAD DEBUG: No document data returned from server');
            throw new Error('No document data returned from server');
        }
        
        console.log('LOAD DEBUG: Successfully fetched documents:', data.documents.length);
        
        const { documents, totalPages, totalDocuments } = data;
        
        // Render documents
        renderDocuments('documents-container', documents, expandedDocIds);
        
        // Update pagination controls
        if (window.documentFilters) {
            window.documentFilters.updatePagination(totalPages);
        }
        
        // Update entries info display
        if (window.documentFilters) {
            window.documentFilters.setVisibleEntriesCount(documents.length);
        }
        
        // Update filter indicator (only if the function exists)
        if (window.documentFilters && typeof window.documentFilters.updateFilterIndicator === 'function') {
            window.documentFilters.updateFilterIndicator();
        }
        
        // If no documents found, show empty state
        if (documents.length === 0) {
            document.getElementById('documents-container').innerHTML = `
                <div class="no-docs">
                    <div class="empty-state">
                        <i class="fas fa-file-alt empty-icon"></i>
                        <p>No documents found</p>
                    </div>
                </div>
            `;
        }
        
        // Check if we need to search child documents
        const searchQuery = window.documentList ? window.documentList.currentSearchQuery : '';
        if (searchQuery && searchQuery.trim() !== '') {
            // Set a small delay to ensure documents are fully rendered
            setTimeout(() => {
                searchChildDocuments(searchQuery);
            }, 300);
        }
        
    } catch (error) {
        console.error('Error in loadDocuments:', error);
        document.getElementById('documents-container').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading documents: ${error.message}</p>
                <button onclick="loadDocuments(${page})">Try Again</button>
            </div>
        `;
    }
}

/**
 * Refresh the document list with current filters and page
 * @param {boolean} forceReload - Whether to force a complete reload from server
 */
function refreshDocumentList(forceReload = false) {
    console.log('Refreshing document list - forceReload:', forceReload);
    
    if (forceReload) {
        // Add a cache-busting parameter to force a complete reload
        window.forceRefreshTimestamp = Date.now();
        console.log('Setting force refresh timestamp:', window.forceRefreshTimestamp);
        
        // Also clear any cached document data if using document cache
        if (window.documentCache && typeof window.documentCache.clearAll === 'function') {
            window.documentCache.clearAll();
        }
        
        // Reset any document tracking variables
        globalDisplayedDocIds = new Set();
        expandedDocIds = [];
    }
    
    const currentPage = window.documentFilters ? 
        window.documentFilters.getCurrentPage() : 1;
    
    // Notify console for debugging
    console.log(`REFRESH: Loading documents for page ${currentPage}, resetTracking=true, forceReload=${forceReload}`);
    
    // Trigger the document loading with reset
    loadDocuments(currentPage, true);
}

/**
 * Renders a collection of documents into the specified container
 * @param {string|HTMLElement} containerId - Container ID or element to render documents in
 * @param {Array} documents - Array of document objects to render
 * @param {Array} expandedDocIds - Array of document IDs that should be expanded
 */
function renderDocuments(containerId, documents, expandedDocIds = []) {
    console.log(`Rendering ${documents?.length || 0} documents to container ${typeof containerId === 'string' ? containerId : 'element'}`);
    
    // Get container element
    let container;
    if (typeof containerId === 'string') {
        container = document.getElementById(containerId);
    } else {
        container = containerId;
    }
    
    if (!container) {
        console.error(`Container not found: ${containerId}`);
        return;
    }

    // Clear container and show loading first
    container.innerHTML = '<div class="loading-documents"><i class="fas fa-spinner fa-spin"></i> Loading documents...</div>';
    
    // Check if document card components are available
    if (typeof window.documentCardComponents === 'undefined') {
        console.log("Document card components not found, attempting to load dynamically");
        
        // Try to determine the correct path based on current location
        const scriptPaths = [
            'js/document-card-components.js',           // Direct js folder
            '../js/document-card-components.js',        // One level up
            'Components/js/document-card-components.js' // Components folder
        ];
        
        let loadAttempted = false;
        
        function tryNextPath(index) {
            if (index >= scriptPaths.length) {
                console.error("Failed to load document card components after trying all paths");
                renderBasicDocuments(container, documents);
                return;
            }
            
            const script = document.createElement('script');
            script.src = scriptPaths[index];
            console.log(`Attempting to load from: ${scriptPaths[index]}`);
            
            script.onload = function() {
                console.log(`Successfully loaded document components from ${scriptPaths[index]}`);
                if (typeof window.documentCardComponents !== 'undefined') {
                    console.log("Document card components now available, rendering documents");
                    // We'll call the render function again, but by this point the script is loaded
                    actuallyRenderDocuments(container, documents, expandedDocIds);
                } else {
                    console.error("Script loaded but documentCardComponents still not defined");
                    tryNextPath(index + 1);
                }
            };
            script.onerror = function() {
                console.error(`Failed to load document components from ${scriptPaths[index]}`);
                tryNextPath(index + 1);
            };
            document.head.appendChild(script);
            loadAttempted = true;
        }
        
        tryNextPath(0);
        
        if (loadAttempted) return; // Exit and wait for script to load
        
        // Fallback to basic rendering if script loading fails
        renderBasicDocuments(container, documents);
        return;
    }
    
    // If document card components are available, render directly
    actuallyRenderDocuments(container, documents, expandedDocIds);
}

/**
 * Actually renders documents after component loading issues are resolved
 * This avoids recursion and ensures we have a clean rendering process
 */
function actuallyRenderDocuments(container, documents, expandedDocIds = []) {
    // Reset tracking variables
    globalDisplayedDocIds = new Set();
    
    // If no documents, show empty state
    if (!documents || documents.length === 0) {
        container.innerHTML = `
            <div class="no-docs">
                <div class="empty-state">
                    <i class="fas fa-file-alt empty-icon"></i>
                    <p>No documents found</p>
                </div>
            </div>`;
        return;
    }
            
            // Clear container
            container.innerHTML = '';
            
            // Create document fragment for better performance
            const fragment = document.createDocumentFragment();
            
    // Track document IDs to avoid duplicates
    const renderedDocIds = new Set();
            
            // Process each document
            documents.forEach(doc => {
                try {
                    // Skip if already displayed
            if (!doc.id || renderedDocIds.has(doc.id)) {
                console.log(`Skipping duplicate document: ${doc.id}`);
                        return;
                    }
                    
            renderedDocIds.add(doc.id);
                    globalDisplayedDocIds.add(doc.id);
                    
                    let card;
                    
            // Debug the document properties
            console.log(`Document ${doc.id} properties:`, {
                id: doc.id,
                title: doc.title,
                is_compiled: doc.is_compiled,
                child_count: doc.child_count
            });
            
            // Check if this is a compiled document
            if (doc.is_compiled === true) {
                console.log(`Creating compiled document card for document ${doc.id} with ${doc.child_count || 0} children`);
                
                if (typeof window.documentCardComponents !== 'undefined' && 
                    typeof window.documentCardComponents.createCompiledDocumentCard === 'function') {
                    card = window.documentCardComponents.createCompiledDocumentCard(doc, expandedDocIds);
                    } else {
                    // Fallback to basic rendering if components not available
                    card = renderBasicDocumentCard(doc);
                }
                
                // Add a specific class for compiled documents
                card.classList.add('compiled-document-card');
                
                // If this document should be expanded, prepare to show children
                if (expandedDocIds.includes(doc.id)) {
                    setTimeout(() => {
                        toggleCompiledDocument(doc.id, card, true);
                    }, 100);
                }
            } else {
                // Regular document
                console.log(`Creating regular document card for document ${doc.id}`);
                
                if (typeof window.documentCardComponents !== 'undefined' && 
                    typeof window.documentCardComponents.createDocumentCard === 'function') {
                    card = window.documentCardComponents.createDocumentCard(doc);
                } else {
                    // Fallback to basic rendering if components not available
                    card = renderBasicDocumentCard(doc);
                }
                    }
                    
                    if (card) {
                        fragment.appendChild(card);
            } else {
                console.error(`Failed to create card for document ${doc.id}`);
            }
        } catch (error) {
            console.error(`Error rendering document ${doc.id}:`, error);
            
            // Create a basic fallback card
            const fallbackCard = document.createElement('div');
            fallbackCard.className = 'document-card error-card';
            fallbackCard.innerHTML = `
                <div class="card-header">
                    <h3>${doc.title || 'Untitled Document'}</h3>
                </div>
                <div class="card-body">
                    <p>Error rendering document: ${error.message}</p>
                </div>
            `;
            fragment.appendChild(fallbackCard);
        }
    });
    
    // Append all cards to container
            container.appendChild(fragment);
            
    // Update the visible entries count
    if (window.documentFilters) {
        window.documentFilters.setVisibleEntriesCount(renderedDocIds.size);
    }
    
    console.log(`Rendered ${renderedDocIds.size} unique documents`);
}

/**
 * Render documents using a basic card layout when document components are not available
 * @param {HTMLElement} container - Container to render documents in
 * @param {Array} documents - Array of document objects to render
 */
function renderBasicDocuments(container, documents) {
    console.log('Rendering basic document cards as fallback');
    
    // Clear container
    container.innerHTML = '';
    
    // Reset tracking variables
    globalDisplayedDocIds = new Set();
    
    // If no documents, show empty state
    if (!documents || documents.length === 0) {
        container.innerHTML = `
            <div class="no-docs">
                <div class="empty-state">
                    <i class="fas fa-file-alt empty-icon"></i>
                    <p>No documents found</p>
                </div>
            </div>`;
        return;
    }
    
    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Process each document
    documents.forEach(doc => {
            // Skip if already displayed
            if (globalDisplayedDocIds.has(doc.id)) {
                return;
            }
            
            globalDisplayedDocIds.add(doc.id);
            
        // Create a basic document card
        const card = renderBasicDocumentCard(doc);
            fragment.appendChild(card);
    });
    
    // Append all cards to container
    container.appendChild(fragment);
    
    // Update the visible entries count
    if (window.documentFilters) {
        window.documentFilters.setVisibleEntriesCount(documents.length);
    }
}

/**
 * Create a basic document card for fallback rendering
 * @param {Object} doc - Document object
 * @returns {HTMLElement} - Basic document card element
 */
function renderBasicDocumentCard(doc) {
    const card = document.createElement('div');
    card.className = 'document-card';
    card.dataset.documentId = doc.id;
    
    // Determine if it's a compiled document
    const isCompiled = doc.is_compiled === true;
    if (isCompiled) {
        card.classList.add('compiled');
    }
    
    // Format authors - handle different possible formats
    let authors = 'Unknown Author';
    if (doc.authors) {
        console.log(`Formatting authors for doc ${doc.id}:`, doc.authors);
        
        if (Array.isArray(doc.authors)) {
            if (doc.authors.length > 0) {
                // Format depends on the structure of author objects
                if (typeof doc.authors[0] === 'string') {
                    // Simple array of strings
                    authors = doc.authors.join(', ');
                } else if (doc.authors[0].full_name) {
                    // Array of objects with full_name
                    authors = doc.authors.map(author => author.full_name).join(', ');
                } else if (doc.authors[0].first_name || doc.authors[0].last_name) {
                    // Array of objects with first_name/last_name
                    authors = doc.authors.map(author => 
                        `${author.first_name || ''} ${author.last_name || ''}`.trim()
                    ).join(', ');
                                } else {
                    // Unknown format, dump whatever we have
                    authors = doc.authors.map(author => 
                        typeof author === 'object' ? JSON.stringify(author) : author
                    ).join(', ');
                }
            }
        } else if (typeof doc.authors === 'string') {
            // Direct string
            authors = doc.authors;
        } else if (typeof doc.authors === 'object') {
            // Single author object
            authors = doc.authors.full_name || 
                     `${doc.authors.first_name || ''} ${doc.authors.last_name || ''}`.trim() ||
                     JSON.stringify(doc.authors);
        }
    }
    
    // Format publication date with better display
    let pubDate = 'Unknown Date';
    if (doc.publish_date) {
        const dateObj = new Date(doc.publish_date);
        if (!isNaN(dateObj.getTime())) {
            pubDate = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } else if (doc.publication_date) {
        const dateObj = new Date(doc.publication_date);
        if (!isNaN(dateObj.getTime())) {
            pubDate = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } else if (isCompiled && doc.start_year) {
        pubDate = doc.start_year + (doc.end_year ? `-${doc.end_year}` : '');
    }
    
    // Get the appropriate icon for the category
    const getCategoryIcon = (category) => {
        const iconMap = {
            'THESIS': 'icons/Category-icons/thesis.png',
            'Thesis': 'icons/Category-icons/thesis.png',
            'DISSERTATION': 'icons/Category-icons/dissertation.png',
            'Dissertation': 'icons/Category-icons/dissertation.png',
            'CONFLUENCE': 'icons/Category-icons/confluence.png',
            'Confluence': 'icons/Category-icons/confluence.png',
            'SYNERGY': 'icons/Category-icons/synergy.png',
            'Synergy': 'icons/Category-icons/synergy.png'
        };
        return iconMap[category] || 'icons/Category-icons/default_category_icon.png';
    };
    
    // Format the document_type into a readable category name
    const formatDocumentType = (type) => {
        if (!type) return 'Uncategorized';
        
        // Convert to title case (first letter uppercase, rest lowercase)
        return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    };
    
    // Use document_type for category, fallback to category_name or category
    const documentType = doc.document_type || '';
    let category = formatDocumentType(documentType) || doc.category_name || doc.category || 'Uncategorized';
    
    // Change Synergy to Departmental
    if (category === 'Synergy') {
        category = 'Departmental';
    }
    
    console.log(`Rendering document ${doc.id} with type: ${documentType}, displayed as category: ${category}`);
    
    // Create the document card structure
    card.innerHTML = `
        <div class="document-icon">
            <img src="${getCategoryIcon(documentType || category)}" alt="${category} Icon">
        </div>
        <div class="document-info">
            <h3 class="document-title">
                ${isCompiled ? '<span class="toggle-indicator">▶</span>' : ''}
                ${doc.title || 'Untitled Document'} 
            </h3>
            <div class="document-meta">
                ${isCompiled ? 
                    `Volume ${doc.volume || ''} | <span class="publication-date"><i class="fas fa-calendar-day"></i> Published: ${pubDate}</span> | ${doc.child_count || 0} document${doc.child_count !== 1 ? 's' : ''}` : 
                    `<span class="author-list" data-document-id="${doc.id}"><i class="fas fa-user"></i> ${authors}</span> | <span class="publication-date"><i class="fas fa-calendar-day"></i> Published: ${pubDate}</span>`
                }
            </div>
            ${isCompiled ? 
                `<div class="category-badge ${(documentType || '').toLowerCase()}">${category}</div>` : 
                ''
            }
        </div>
        <div class="document-actions">
            ${isCompiled ? '' : 
            `<button class="action-btn view-btn" data-document-id="${doc.id}">
                <i class="fas fa-eye"></i> 
            </button>`}
            <button class="action-btn edit-btn" data-document-id="${doc.id}">
                <i class="fas fa-edit"></i> 
            </button>
            ${doc.parent_compiled_id ? '' : 
            `<button class="action-btn delete-btn" data-document-id="${doc.id}">
                <i class="fas fa-trash"></i> 
            </button>`}
        </div>
    `;
    
    // For non-compiled documents, fetch authors directly from API
    if (!isCompiled) {
        // Only fetch if the authors array is empty or doesn't look right
        if (!doc.authors || doc.authors.length === 0 || 
            (Array.isArray(doc.authors) && doc.authors.length > 0 && !doc.authors[0].full_name)) {
            fetchAuthorsForDocument(doc.id).then(authorData => {
                if (authorData && authorData.length > 0) {
                    const authorNames = authorData.map(author => author.full_name).join(', ');
                    const authorSpan = card.querySelector(`.author-list[data-document-id="${doc.id}"]`);
                    if (authorSpan) {
                        authorSpan.textContent = authorNames || 'Unknown Author';
                    }
                }
                                    });
                            }
                        }
    
    // Add event listeners
    if (!isCompiled) {
        card.querySelector('.view-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            // Call preview function if available, or show alert
            if (typeof showPreviewModal === 'function') {
                showPreviewModal(doc.id);
                    } else {
                alert(`Preview document: ${doc.title}`);
                }
            });
        }
    
    card.querySelector('.edit-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        // Call edit function if available, or show alert
        if (typeof editDocument === 'function') {
            editDocument(doc.id, isCompiled);
        } else {
            alert(`Edit document: ${doc.title}`);
        }
    });
    
    // Only add delete button event listener if the button exists (not a child document)
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // Call delete function if available, or show alert
            if (typeof deleteDocument === 'function') {
                deleteDocument(doc.id);
                        } else {
                alert(`Delete document: ${doc.title}`);
            }
        });
    }
    
    // For compiled documents, add click handler to toggle children
    if (isCompiled) {
        // Make the title clickable for toggle
        const titleElement = card.querySelector('.document-title');
        titleElement.style.cursor = 'pointer';
        titleElement.addEventListener('click', function() {
            toggleCompiledDocument(doc.id, card);
        });
    }
    
    return card;
}

/**
 * Toggle the display of children for a compiled document
 * @param {string|number} documentId - Document ID
 * @param {HTMLElement} card - The card element
 * @param {boolean} forceOpen - Optional parameter to force the children container to open
 */
function toggleCompiledDocument(documentId, card, forceOpen = false) {
    // Ensure we have a valid document ID
    if (!documentId) {
        console.error("Cannot toggle document with undefined ID");
        return;
    }

    console.log(`Toggling compiled document ${documentId}, forceOpen: ${forceOpen}`);
    
    // Get the card's wrapper (parent)
    const wrapper = card.closest('.compiled-document-wrapper');
    if (!wrapper) {
        console.error(`No wrapper found for document ${documentId}`);
        return;
    }
    
    // Find children container as a sibling to the card
    let childrenContainer = wrapper.querySelector(`.children-container[data-parent="${documentId}"]`);
    
    if (!childrenContainer) {
        // Create the container for child documents
        childrenContainer = document.createElement('div');
        childrenContainer.className = 'children-container';
        childrenContainer.dataset.parent = documentId;
        childrenContainer.style.display = 'none';
        childrenContainer.style.marginTop = '0';
        childrenContainer.style.marginBottom = '15px';
        childrenContainer.style.width = '95%';
        childrenContainer.style.marginLeft = 'auto';
        
        // Insert after the card
        wrapper.appendChild(childrenContainer);
        
        // Fetch children documents
        fetchChildDocuments(documentId, childrenContainer);
        
        // Update indicator
        const indicator = card.querySelector('.toggle-indicator');
        if (indicator) {
            indicator.textContent = '▼';
        }
        
        // Force display
        childrenContainer.style.display = 'block';
        
        // Update tracking array
        if (!expandedDocIds.includes(documentId)) {
            expandedDocIds.push(documentId);
            console.log(`Added document ${documentId} to expanded list`);
        }
    } else {
        // Toggle visibility unless forceOpen is true
        const isVisible = childrenContainer.style.display === 'block';
        
        if (isVisible && !forceOpen) {
            childrenContainer.style.display = 'none';
            
            // Update indicator
            const indicator = card.querySelector('.toggle-indicator');
            if (indicator) {
                indicator.textContent = '▶';
            }
            
            // Update tracking array
            const index = expandedDocIds.indexOf(documentId);
            if (index !== -1) {
                expandedDocIds.splice(index, 1);
                console.log(`Removed document ${documentId} from expanded list`);
            }
        } else if (!isVisible || forceOpen) {
            childrenContainer.style.display = 'block';
            
            // Update indicator
            const indicator = card.querySelector('.toggle-indicator');
            if (indicator) {
                indicator.textContent = '▼';
            }
            
            // Update tracking array
            if (!expandedDocIds.includes(documentId)) {
                expandedDocIds.push(documentId);
                console.log(`Added document ${documentId} to expanded list`);
            }
        }
    }
}

/**
 * Fetches child documents for a compiled document and displays them
 * @param {number} parentId - The ID of the parent compiled document
 * @param {HTMLElement} childrenContainer - The container to display child documents
 */
async function fetchChildDocuments(parentId, childrenContainer) {
  try {
    // Show loading indicator
    childrenContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    console.log(`Fetching child documents for parent ID: ${parentId}`);
    const response = await fetch(`/api/documents/${parentId}/children`);
        
        if (!response.ok) {
      throw new Error(`Failed to fetch child documents: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
    console.log(`Received ${data.documents.length} child documents for parent ID: ${parentId}`, data);
        
    // Clear loading indicator
        childrenContainer.innerHTML = '';
        
    if (data.documents.length === 0) {
      childrenContainer.innerHTML = '<div class="text-center py-3">No child documents found</div>';
            return;
        }
        
    // Create a document fragment to batch DOM operations
    const fragment = document.createDocumentFragment();
    
    // Render each child document
    data.documents.forEach(doc => {
      try {
        console.log(`Rendering child document: ${doc.id} - ${doc.title}`);
        const childCard = createChildDocumentCard(doc);
        if (childCard) {
          fragment.appendChild(childCard);
        }
                    } catch (error) {
        console.error(`Error rendering child document ${doc.id}:`, error);
      }
    });
    
    // Append all child documents at once
    childrenContainer.appendChild(fragment);
    
    } catch (error) {
    console.error('Error fetching child documents:', error);
    childrenContainer.innerHTML = `<div class="alert alert-danger">Error loading child documents: ${error.message}</div>`;
    }
}

/**
 * Create a card for a child document
 * @param {Object} child - Child document object
 * @returns {HTMLElement} - Child document card element
 */
function createChildDocumentCard(child) {
    const childCard = document.createElement('div');
    childCard.className = 'child-document-card';
    childCard.dataset.documentId = child.id;
    
    // Format authors - handle different possible formats
    let authors = 'Unknown Author';
    if (child.authors) {
        console.log(`Formatting authors for child doc ${child.id}:`, child.authors);
        
        if (Array.isArray(child.authors)) {
            if (child.authors.length > 0) {
                // Format depends on the structure of author objects
                if (typeof child.authors[0] === 'string') {
                    // Simple array of strings
                    authors = child.authors.join(', ');
                } else if (child.authors[0].full_name) {
                    // Array of objects with full_name
                    authors = child.authors.map(author => author.full_name).join(', ');
                } else if (child.authors[0].first_name || child.authors[0].last_name) {
                    // Array of objects with first_name/last_name
                    authors = child.authors.map(author => 
                        `${author.first_name || ''} ${author.last_name || ''}`.trim()
                    ).join(', ');
                } else {
                    // Unknown format, dump whatever we have
                    authors = child.authors.map(author => 
                        typeof author === 'object' ? JSON.stringify(author) : author
                    ).join(', ');
                }
            }
        } else if (typeof child.authors === 'string') {
            // Direct string
            authors = child.authors;
        } else if (typeof child.authors === 'object') {
            // Single author object
            authors = child.authors.full_name || 
                     `${child.authors.first_name || ''} ${child.authors.last_name || ''}`.trim() ||
                     JSON.stringify(child.authors);
        }
    }
    
    // Format publication date
    let pubDate = 'Unknown Date';
    if (child.publish_date) {
        const dateObj = new Date(child.publish_date);
        if (!isNaN(dateObj.getTime())) {
            pubDate = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } else if (child.publication_date) {
        const dateObj = new Date(child.publication_date);
        if (!isNaN(dateObj.getTime())) {
            pubDate = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }
    
    childCard.innerHTML = `
        <div class="document-info">
            <h4 class="document-title">${child.title || 'Untitled Document'}</h4>
            <div class="document-meta">
                <span class="author-list"><i class="fas fa-user"></i> ${authors}</span> | 
                <span class="publication-date"><i class="fas fa-calendar-day"></i> Published: ${pubDate}</span>
            </div>
        </div>
        <div class="document-actions">
            <button class="action-btn view-btn" data-document-id="${child.id}" title="View Document">
                <i class="fas fa-eye"></i>
            </button>
            <!-- Delete button removed for child documents -->
        </div>
    `;
    
    // Add event listener for view button
    childCard.querySelector('.view-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        
        // First fetch the document details to get the file path
        fetch(`/api/documents/${child.id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error fetching document: ${response.status}`);
                }
                return response.json();
            })
            .then(document => {
                if (document && document.file_path) {
                    // Open the PDF in a new tab
                    // Ensure we have a fully qualified URL by adding protocol and host if missing
                    let pdfPath = document.file_path;
                    
                    // If the path doesn't start with http or /, add the leading /
                    if (!pdfPath.startsWith('http') && !pdfPath.startsWith('/')) {
                        pdfPath = '/' + pdfPath;
                    }
                    
                    // If the path is relative (starts with /), prepend the current origin
                    if (pdfPath.startsWith('/')) {
                        pdfPath = window.location.origin + pdfPath;
                    }
                    
                    console.log(`Opening document with path: ${pdfPath}`);
                    window.open(pdfPath, '_blank');
                } else {
                    alert('PDF path not found for this document');
                }
            })
            .catch(error => {
                console.error('Error opening PDF:', error);
                alert(`Error opening document: ${error.message}`);
            });
    });
    
    return childCard;
}

/**
 * Toggle document expansion state for compiled documents
 * @param {string} documentId - Document ID
 * @param {boolean} isExpanded - Whether the document should be expanded
 */
function toggleDocumentExpansion(documentId, isExpanded) {
    console.log(`Toggling document expansion: ${documentId}, expanded: ${isExpanded}`);
    
    // Update expanded state in tracking array
    const index = expandedDocIds.indexOf(documentId);
    
    if (isExpanded && index === -1) {
        // Add to expanded docs if not already there
        expandedDocIds.push(documentId);
    } else if (!isExpanded && index !== -1) {
        // Remove from expanded docs
        expandedDocIds.splice(index, 1);
    }
}

/**
 * Search for matching child documents and expand parent documents when found
 * @param {string} query - Search query to match against child documents
 */
async function searchChildDocuments(query) {
    if (!query || query.trim() === '') return;
    
    console.log(`Searching child documents for: "${query}"`);
    
    // Get all compiled documents (parent documents with children)
    const compiledDocElements = document.querySelectorAll('.document-card[data-is-compiled="true"]');
    
    for (const compiledDocElement of compiledDocElements) {
        const documentId = compiledDocElement.getAttribute('data-document-id');
        if (!documentId) continue;
        
        try {
            console.log(`Fetching child documents for parent ${documentId} to search through them`);
            
            // Fetch child documents
            const response = await fetch(`/api/documents/${documentId}/children`);
            
            if (!response.ok) {
                throw new Error(`Error fetching child documents: ${response.status}`);
            }
            
            let data;
            try {
                const responseText = await response.text();
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error(`Error parsing JSON for document ${documentId}:`, parseError);
                    console.log('Raw response:', responseText);
                    continue; // Skip this document and move to the next one
                }
            } catch (error) {
                console.error(`Error reading response for document ${documentId}:`, error);
                continue;
            }
            
            // Validate the data structure
            if (!data || !Array.isArray(data.documents)) {
                console.error(`Invalid data structure for document ${documentId}:`, data);
                continue;
            }
            
            // Check if any child document matches the search query
            let hasMatch = false;
            const childrenWithMatches = [];
            
            if (data.documents && data.documents.length > 0) {
                for (const child of data.documents) {
                    // Skip invalid document objects
                    if (!child || typeof child !== 'object') {
                        console.warn('Invalid child document:', child);
                        continue;
                    }
                    
                    // Check for matches in title, author names, or description
                    const titleMatch = child.title && typeof child.title === 'string' && 
                                       child.title.toLowerCase().includes(query.toLowerCase());
                    
                    // Check for matches in author names
                    let authorMatch = false;
                    if (Array.isArray(child.authors) && child.authors.length > 0) {
                        authorMatch = child.authors.some(author => 
                            author && author.full_name && 
                            typeof author.full_name === 'string' && 
                            author.full_name.toLowerCase().includes(query.toLowerCase())
                        );
                    }
                    
                    // Check for matches in description
                    const descriptionMatch = child.description && 
                                            typeof child.description === 'string' && 
                                            child.description.toLowerCase().includes(query.toLowerCase());
                    
                    // If any part matches the search
                    if (titleMatch || authorMatch || descriptionMatch) {
                        hasMatch = true;
                        childrenWithMatches.push({
                            id: child.id,
                            title: child.title || 'Untitled Document',
                            titleMatch
                        });
                    }
                }
            }
            
            // If any child document matched the search, expand the parent
            if (hasMatch) {
                console.log(`Found matches in children of document ${documentId}, expanding it`);
                
                // Force expand the parent document
                const cardElement = compiledDocElement.closest('.document-card');
                if (cardElement) {
                    toggleCompiledDocument(documentId, cardElement, true);
                    
                    // Wait a bit for the children container to be populated
                    setTimeout(() => {
                        // Highlight matched child documents
                        childrenWithMatches.forEach(match => {
                            const childElement = document.querySelector(`.child-document-card[data-document-id="${match.id}"]`);
                            if (childElement) {
                                // Add a highlight class
                                childElement.classList.add('search-match');
                                
                                // Highlight the title text if it matched
                                if (match.titleMatch) {
                                    const titleElement = childElement.querySelector('.document-title');
                                    if (titleElement) {
                                        // Replace the title with highlighted version
                                        const title = titleElement.textContent;
                                        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                                        titleElement.innerHTML = title.replace(regex, '<span class="highlight">$1</span>');
                                    }
                                }
                            }
                        });
                    }, 500);
                }
            }
        } catch (error) {
            console.error(`Error searching child documents for parent ${documentId}:`, error);
        }
    }
}

/**
 * Add a delete button to a document card
 * @param {HTMLElement} card - The document card element
 * @param {number} documentId - The document ID
 */
function addDeleteButton(card, documentId) {
    // Get the document data from the card's dataset
    const isChildDoc = card.dataset.parentCompiledId !== undefined && card.dataset.parentCompiledId !== 'null';
    const isCompiled = card.classList.contains('compiled-document') || card.classList.contains('compilation');
    
    // Don't add delete button for child documents
    if (isChildDoc) {
        console.log(`Not adding delete button to child document ${documentId}`);
        return;
    }
    
    // Create button element
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.title = 'Archive Document';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.setAttribute('data-document-id', documentId);
    
    // Add click event
    deleteBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        
        // Use appropriate archive function based on document type
        if (window.documentArchive) {
            if (isCompiled && typeof window.documentArchive.archiveCompiledDocument === 'function') {
                // For compiled documents, use the specialized function
                console.log('Using documentArchive.archiveCompiledDocument for compiled document ID:', documentId);
                window.documentArchive.archiveCompiledDocument(documentId);
            } else if (typeof window.documentArchive.archiveDocument === 'function') {
                // For regular documents, use the standard archive function
                console.log('Using documentArchive.archiveDocument for ID:', documentId);
                window.documentArchive.archiveDocument(documentId);
            } else {
                // Fallback to legacy function
                console.log('Falling back to legacy deleteDocument for ID:', documentId);
                deleteDocument(documentId);
            }
        } else {
            console.log('Falling back to legacy deleteDocument for ID:', documentId);
            deleteDocument(documentId);
        }
    });
    
    // Add to card actions
    const actionsContainer = card.querySelector('.document-actions');
    if (actionsContainer) {
        actionsContainer.appendChild(deleteBtn);
    }
}

/**
 * Attempt to delete a document (archive it)
 * @param {number} documentId - Document ID to delete
 */
function deleteDocument(documentId) {
    console.log('Deleting document:', documentId);
    
    // Confirm the deletion first
    if (!confirm("Are you sure you want to archive this document? It will be moved to the archive.")) {
        console.log('Delete operation cancelled by user');
        return;
    }
    
    // Show a toast notification to indicate the operation is in progress
    showToast('Archiving document...', 'info');
    
    // Find the delete button to show loading state
    const deleteBtn = document.querySelector(`.delete-btn[data-document-id="${documentId}"]`);
    let originalHTML = '<i class="fas fa-trash"></i>';
    if (deleteBtn) {
        originalHTML = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        deleteBtn.disabled = true;
    }
    
    // First check if this is a compiled document by looking at the card element
    const docCard = document.querySelector(`.document-card[data-document-id="${documentId}"]`);
    const isCompiled = docCard && (
        docCard.classList.contains('compiled-document') || 
        docCard.classList.contains('compilation')
    );
    
    // Get document title for notification
    let docTitle = "Document";
    if (docCard) {
        const titleEl = docCard.querySelector('.document-title');
        if (titleEl) {
            docTitle = titleEl.textContent.trim();
            // Limit title length for notification
            if (docTitle.length > 40) {
                docTitle = docTitle.substring(0, 37) + '...';
            }
        }
    }
    
    // Use archive functionality based on document type
    if (window.documentArchive) {
        const archivePromise = isCompiled && typeof window.documentArchive.archiveCompiledDocument === 'function'
            ? window.documentArchive.archiveCompiledDocument(documentId)  // For compiled documents
            : window.documentArchive.archiveDocument(documentId);         // For regular documents
        
        archivePromise
            .then(() => {
                // Force refresh the document list after deletion
                setTimeout(() => {
                    console.log('Forcing document list refresh after deletion');
                    refreshDocumentList(true);
                    
                    // Show a better success message with document title
                    const successMsg = `${isCompiled ? 'Compilation' : 'Document'} "${docTitle}" has been archived successfully`;
                    showToast(successMsg, 'document-archived');
                }, 500);
            })
            .catch(error => {
                console.error('Error in archive operation:', error);
                showToast('Error occurred while archiving document: ' + (error.message || 'Unknown error'), 'error');
                
                // Reset the delete button
                if (deleteBtn) {
                    deleteBtn.innerHTML = originalHTML;
                    deleteBtn.disabled = false;
                }
            });
    } else {
        // Fallback direct API call if archive functionality is not available
        console.warn('Archive functionality not available, making direct API call');
        
        fetch(`/api/documents/${documentId}/soft-delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || response.statusText);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Document archived successfully:', data);
            
            // Show a better success message with document title
            const successMsg = `${isCompiled ? 'Compilation' : 'Document'} "${docTitle}" has been moved to the archive`;
            showToast(successMsg, 'document-archived');
            
            // Force refresh the document list after deletion
            setTimeout(() => {
                refreshDocumentList(true);
            }, 300);
        })
        .catch(error => {
            console.error('Error archiving document:', error);
            showToast('Error occurred while archiving document: ' + (error.message || 'Unknown error'), 'error');
            
            // Reset the delete button
            if (deleteBtn) {
                deleteBtn.innerHTML = originalHTML;
                deleteBtn.disabled = false;
            }
        });
    }
}

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info, document-archived, document-restored)
 */
function showToast(message, type = 'success') {
    // Check if toast container exists
    let toastContainer = document.getElementById('toast-container');
    
    // Create container if it doesn't exist
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Create a unique ID for the toast
    const toastId = 'toast-' + Date.now();
    toast.id = toastId;
    
    // Create toast content
    let icon;
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'document-archived':
            icon = '<i class="fas fa-archive"></i>';
            break;
        case 'document-restored':
            icon = '<i class="fas fa-history"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    // Auto remove after 5 seconds for success/info toasts, 8 seconds for errors/warnings
    const duration = (type === 'error' || type === 'warning') ? 8000 : 4000;
    
    toast.innerHTML = `
        <div class="toast-content">
            ${icon}
            <span>${message}</span>
        </div>
        <button class="close-btn"><i class="fas fa-times"></i></button>
        <div class="toast-progress"></div>
    `;
    
    // Add close button listener
    toast.querySelector('.close-btn').addEventListener('click', () => {
        removeToast(toastId);
    });
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Animate the progress bar
    const progressBar = toast.querySelector('.toast-progress');
    progressBar.style.animation = `toast-progress ${duration/1000}s linear forwards`;
    
    // Set timeout to remove the toast
    setTimeout(() => {
        removeToast(toastId);
    }, duration);
    
    // Function to remove a toast with animation
    function removeToast(id) {
        const toastToRemove = document.getElementById(id);
        if (toastToRemove) {
            toastToRemove.style.opacity = '0';
            toastToRemove.style.transform = 'translateX(100px)';
            
            // Wait for the animation to finish before removing from DOM
            setTimeout(() => {
                if (toastToRemove.parentNode) {
                    toastToRemove.parentNode.removeChild(toastToRemove);
                }
            }, 300);
        }
    }
}

/**
 * Confirm deletion of a compiled document and then delete it with all its children
 * @param {number} documentId - ID of the compiled document to delete
 */
function confirmDeleteCompiledDocument(documentId) {
    console.log(`Confirming delete for compiled document ${documentId}`);
    
    // First fetch document details to show in confirmation
    fetch(`/api/documents/${documentId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching document: ${response.status}`);
            }
            return response.json();
        })
        .then(document => {
            // Show confirmation with document details
            const childCount = document.child_count || 0;
            const confirmMessage = `Are you sure you want to archive "${document.title}" and all its ${childCount} child document${childCount !== 1 ? 's' : ''}? They will be moved to the archive.`;
            
            if (confirm(confirmMessage)) {
                // Use the specialized function if available
                if (window.documentArchive && typeof window.documentArchive.archiveCompiledDocument === 'function') {
                    console.log(`Using archiveCompiledDocument for compiled document ${documentId}`);
                    window.documentArchive.archiveCompiledDocument(documentId);
                } else {
                    // Fallback to standard archiving
                    console.log(`archiveCompiledDocument not available, falling back to standard archive for ${documentId}`);
                    deleteDocument(documentId);
                }
            } else {
                console.log('Delete operation cancelled by user');
            }
        })
        .catch(error => {
            console.error(`Error confirming delete for compiled document ${documentId}:`, error);
        });
}

/**
 * Edit a document by ID
 * @param {string|number} documentId - The ID of the document to edit
 * @param {boolean} isCompiled - Whether this is a compiled document
 */
function editDocument(documentId, isCompiled = false) {
    console.log(`Editing document with ID: ${documentId}, isCompiled: ${isCompiled}`);
    
    if (isCompiled) {
        // For compiled documents, use the compiled document edit modal
        if (typeof showCompiledEditModal === 'function') {
            showCompiledEditModal(documentId);
        } else if (window.compiledDocumentEdit && typeof window.compiledDocumentEdit.showCompiledEditModal === 'function') {
            window.compiledDocumentEdit.showCompiledEditModal(documentId);
        } else if (window.documentEdit && typeof window.documentEdit.showCompiledEditModal === 'function') {
            window.documentEdit.showCompiledEditModal(documentId);
        } else {
            alert(`Edit functionality for compiled document ${documentId} is not available yet.`);
        }
    } else {
        // For single documents, use the single document edit modal
        if (typeof showEditModal === 'function') {
            showEditModal(documentId);
        } else if (window.documentEdit && typeof window.documentEdit.showEditModal === 'function') {
            window.documentEdit.showEditModal(documentId);
        } else {
            alert(`Edit functionality for document ${documentId} is not available yet.`);
        }
    }
}