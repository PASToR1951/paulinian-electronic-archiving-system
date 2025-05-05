// Global variables for archived document list functionality
let globalDisplayedDocIds = new Set();
let currentPage = 1;
let currentCategoryFilter = null;
let currentSort = 'latest';
let currentSearchQuery = '';
let visibleEntriesCount = 0;

/**
 * Initialize the archived document list and set up event listeners
 */
function initializeArchivedDocumentList() {
    console.log('Initializing archived document list');
    
    // Setup event listeners for category cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            filterByCategory(category);
        });
    });

    // Set up search input
    const searchInput = document.getElementById('search-documents');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            currentSearchQuery = this.value.trim();
            loadArchivedDocuments(1, true);
        }, 500));
    }

    // Set up sort order dropdown
    const sortOrderDropdown = document.getElementById('sort-order');
    if (sortOrderDropdown) {
        sortOrderDropdown.addEventListener('change', function() {
            currentSort = this.value;
            loadArchivedDocuments(1, true);
        });
    }
    
    // Initial document load - this will also load category counts from the API
    loadArchivedDocuments(1, true);
}

/**
 * Fetch archived documents from the database with specified filters
 * @param {number} page - Page number to fetch 
 * @param {string|null} category - Category filter or null for all
 * @param {string} sortOrder - Sort order ('latest' or 'earliest')
 * @param {number} limit - Number of documents per page
 * @param {boolean} showLoading - Whether to show loading indicator
 * @returns {Promise<Object>} - The documents data
 */
async function fetchArchivedDocumentsFromDB(page = 1, category = null, sortOrder = 'latest', limit = 10, searchQuery = '', showLoading = true) {
    try {
        console.log(`Fetching archived documents: page=${page}, category=${category}, sort=${sortOrder}, limit=${limit}, search=${searchQuery}`);
        
        // Construct the API URL with query parameters
        // Updated to use the new unified API endpoint
        let url = `/api/archives?page=${page}&size=${limit}`;
        
        // Add sort parameter - convert to appropriate format for unified API
        url += `&sort=${sortOrder === 'latest' ? 'desc' : 'asc'}`;
        
        // Add category filter if present
        if (category && category !== 'All') {
            url += `&type=${encodeURIComponent(category)}`;
        }
        
        // Add search parameter if present
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        
        // Show loading indicator in the container if requested
        if (showLoading) {
            document.getElementById('documents-container').innerHTML = '<div class="loading-documents"><i class="fas fa-spinner fa-spin"></i> Loading archived documents...</div>';
        }
        
        console.log('Making API request to:', url);
        
        // Fetch documents from the API
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Archived documents data received:', data);
        
        // Log the first document to examine its structure
        if (data.documents && data.documents.length > 0) {
            console.log('First document complete structure:', JSON.stringify(data.documents[0], null, 2));
        }
        
        // Update category counts from the API response
        if (data.category_counts) {
            console.log('DEBUG: Using category counts from archives API:', data.category_counts);
            updateCategoryCounts(data.category_counts);
        } else {
            console.warn('No category_counts found in API response');
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching archived documents:', error);
        document.getElementById('documents-container').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading archived documents: ${error.message}</p>
                <button onclick="loadArchivedDocuments(${page})">Try Again</button>
            </div>
        `;
        return { documents: [], total_documents: 0, total_pages: 0 };
    }
}

/**
 * Update category count badges
 * @param {Array} categories - Array of category objects with counts from the API
 */
function updateCategoryCounts(categories) {
    console.log('DEBUG: Updating archive page category counts with data:', categories);
    
    // Calculate total documents across all categories
    let totalCount = 0;
    categories.forEach(cat => {
        totalCount += Number(cat.count);
    });
    
    console.log('DEBUG: Total archived document count:', totalCount);
    
    // Update All category count
    const allCategoryCount = document.querySelector('.category-card[data-category="All"] .category-count');
    if (allCategoryCount) {
        allCategoryCount.textContent = `${totalCount} ${totalCount === 1 ? 'file' : 'files'}`;
        console.log('DEBUG: Updated All category count to', totalCount);
    } else {
        console.error('DEBUG: Could not find All category count element in archive page');
        console.log('DEBUG: Looking for element with selector: ".category-card[data-category="All"] .category-count"');
        // List all category cards for debugging
        const allCards = document.querySelectorAll('.category-card');
        console.log('DEBUG: Found these category cards:', Array.from(allCards).map(card => `${card.getAttribute('data-category')} (${card.querySelector('.category-name')?.textContent})`));
    }
    
    // Update individual category counts using direct category mapping
    categories.forEach(category => {
        // The category object format from /api/archives is { category: "THESIS", count: 2 }
        const categoryName = category.category || category.name; // Support both formats
        const count = Number(category.count);
        
        // In archive-documents.html, data-category uses UPPERCASE already
        const selector = `.category-card[data-category="${categoryName}"] .category-count`;
        
        console.log(`DEBUG: Looking for archive category element with selector: "${selector}"`);
        
        const countElement = document.querySelector(selector);
        if (countElement) {
            countElement.textContent = `${count} ${count === 1 ? 'file' : 'files'}`;
            console.log(`DEBUG: Updated archive ${categoryName} category count to ${count}`);
        } else {
            console.warn(`DEBUG: Could not find category count element for ${categoryName} in archive page`);
            // Try to find the closest matching element
            document.querySelectorAll('.category-card').forEach(card => {
                console.log(`DEBUG: Found card with data-category="${card.getAttribute('data-category')}" and name="${card.querySelector('.category-name')?.textContent}"`);
            });
        }
    });
}

/**
 * Filter documents by category
 * @param {string} categoryName - Category name to filter by
 */
function filterByCategory(categoryName) {
    console.log(`Filtering by category: ${categoryName}`);
    
    // Check if we're clicking the already active category
    const isActiveCategory = document.querySelector(`.category-card[data-category="${categoryName}"].active`) !== null;
    
    if (isActiveCategory) {
        // If clicking the active category, clear the filter and set to All
        console.log(`Clearing filter as ${categoryName} is already active`);
        currentCategoryFilter = null;
        
        // Update active state
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Make "All" active
        document.querySelector('.category-card[data-category="All"]').classList.add('active');
    } else {
        // Otherwise set the filter to the clicked category
        currentCategoryFilter = categoryName === 'All' ? null : categoryName;
        
        // Update active state
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('active');
        });
        card = document.querySelector(`.category-card[data-category="${categoryName}"]`);
        if (card) {
            card.classList.add('active');
        }
    }
    
    // Reload documents with filter
    loadArchivedDocuments(1, true);
}

/**
 * Load archived documents and update the display
 * @param {number} page - Page number to load
 * @param {boolean} resetTracking - Whether to reset tracking variables
 */
async function loadArchivedDocuments(page = 1, resetTracking = true) {
    console.log(`Loading archived documents for page ${page}, resetTracking=${resetTracking}`);
    
    // Validate page number
    if (page < 1) page = 1;
    
    // Update current page
    currentPage = page;
    
    // Reset tracking if requested
    if (resetTracking) {
        globalDisplayedDocIds = new Set();
    }
    
    try {
        // Fetch documents from the API
        const data = await fetchArchivedDocumentsFromDB(
            page,
            currentCategoryFilter,
            currentSort,
            10, // documents per page
            currentSearchQuery,
            true // show loading indicator
        );
        
        if (!data || !data.documents) {
            throw new Error('No document data returned from server');
        }
        
        const { documents, total_pages, total_documents } = data;
        
        // Render documents
        renderArchivedDocuments('documents-container', documents);
        
        // Update pagination
        updatePagination(total_pages);
        
        // Update entries info
        updateEntriesInfo(documents.length, page, total_documents);
        
        // If no documents found, show empty state
        if (documents.length === 0) {
            document.getElementById('documents-container').innerHTML = `
                <div class="no-docs">
                    <div class="empty-state">
                        <i class="fas fa-archive"></i>
                        <p>No archived documents found</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading archived documents:', error);
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
        console.error(`Container element with ID "${containerId}" not found`);
        return;
    }
    
    // Clear the container
    container.innerHTML = '';
    
    // Track displayed document IDs
    visibleEntriesCount = 0;
    
    // If no documents, show message
    if (!documents || documents.length === 0) {
        container.innerHTML = `
            <div class="no-docs">
                <i class="fas fa-folder-open"></i>
                <p>No archived documents found</p>
            </div>
        `;
        return;
    }
    
    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Group documents by parent ID for compiled documents
    const compiledDocumentsMap = new Map();
    const standaloneDocuments = [];
    
    // First pass: identify parent documents and standalone documents
    documents.forEach(doc => {
        // Check if it's a parent (compiled) document
        if (doc.is_compilation || doc.is_compiled || doc.child_count > 0) {
            compiledDocumentsMap.set(doc.id, {
                parent: doc,
                children: []
            });
        } 
        // Check if it has a parent (is a child document)
        else if (doc.parent_document_id) {
            // Store temporarily if we haven't seen the parent yet
            if (!compiledDocumentsMap.has(doc.parent_document_id)) {
                compiledDocumentsMap.set(doc.parent_document_id, {
                    parent: null,
                    children: [doc]
                });
            } else {
                // Add to existing parent
                compiledDocumentsMap.get(doc.parent_document_id).children.push(doc);
            }
        } 
        // It's a standalone document
        else {
            standaloneDocuments.push(doc);
        }
    });
    
    // Second pass: assign any children to their parents
    documents.forEach(doc => {
        if (doc.parent_document_id && compiledDocumentsMap.has(doc.parent_document_id)) {
            // Make sure this child is in its parent's children array
            const parentEntry = compiledDocumentsMap.get(doc.parent_document_id);
            
            // Only add if not already in the array
            const isAlreadyAdded = parentEntry.children.some(child => child.id === doc.id);
            if (!isAlreadyAdded) {
                parentEntry.children.push(doc);
            }
        }
    });
    
    // Now render the compiled documents with their children
    compiledDocumentsMap.forEach((entry) => {
        if (entry.parent) {
            // Create a wrapper for the parent and its children
            const compilationWrapper = document.createElement('div');
            compilationWrapper.className = 'compilation-wrapper';
            
            // Create the parent card
            const parentCard = createCompiledParentCard(entry.parent, entry.children.length);
            compilationWrapper.appendChild(parentCard);
            
            // Create container for children (initially hidden)
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'children-container';
            childrenContainer.style.display = 'none'; // Start collapsed
            
            // Add children header
            const childrenHeader = document.createElement('div');
            childrenHeader.className = 'children-header';
            childrenHeader.textContent = 'Child Documents';
            childrenContainer.appendChild(childrenHeader);
            
            // Add child documents
            if (entry.children.length > 0) {
                entry.children.forEach(childDoc => {
                    const childCard = createChildDocumentCard(childDoc);
                    childrenContainer.appendChild(childCard);
                });
            } else {
                // Show message if no children (rare case)
                const noChildrenMsg = document.createElement('div');
                noChildrenMsg.className = 'no-children-message';
                noChildrenMsg.textContent = 'No child documents found';
                childrenContainer.appendChild(noChildrenMsg);
            }
            
            compilationWrapper.appendChild(childrenContainer);
            fragment.appendChild(compilationWrapper);
            
            // Track parent for pagination
            globalDisplayedDocIds.add(entry.parent.id);
            visibleEntriesCount++;
            
            // Track children for pagination
            entry.children.forEach(child => {
                globalDisplayedDocIds.add(child.id);
                // Don't increment visibleEntriesCount for children as they're part of the parent
            });
        }
    });
    
    // Add standalone documents
    standaloneDocuments.forEach(doc => {
        try {
            // Create document card
            const card = createArchivedDocumentCard(doc);
            
            // Add to fragment
            fragment.appendChild(card);
            
            // Track for pagination
            globalDisplayedDocIds.add(doc.id);
            visibleEntriesCount++;
        } catch (error) {
            console.error(`Error rendering document ${doc.id}:`, error);
        }
    });
    
    // Add all cards to the container at once
    container.appendChild(fragment);
    
    // Add event listeners for expanding/collapsing compiled documents
    document.querySelectorAll('.document-card.compilation').forEach(card => {
        card.addEventListener('click', function(event) {
            // Prevent triggering when clicking on action buttons
            if (event.target.closest('.document-actions') || event.target.closest('.action-btn')) {
                return;
            }
            
            const compilationWrapper = this.closest('.compilation-wrapper');
            const childrenContainer = compilationWrapper.querySelector('.children-container');
            const isExpanded = this.getAttribute('data-is-expanded') === 'true';
            
            // Toggle expanded state
            this.setAttribute('data-is-expanded', !isExpanded);
            
            // Update icon
            const expandIcon = this.querySelector('.expand-icon');
            if (expandIcon) {
                expandIcon.innerHTML = isExpanded ? '<i class="fas fa-chevron-right"></i>' : '<i class="fas fa-chevron-down"></i>';
            }
            
            // Toggle children visibility
            childrenContainer.style.display = isExpanded ? 'none' : 'block';
        });
    });
}

/**
 * Create a parent card for a compiled document
 * @param {Object} doc - Parent document data
 * @param {number} childCount - Number of child documents
 * @returns {HTMLElement} - The parent document card
 */
function createCompiledParentCard(doc, childCount) {
    // Create the document card container
    const card = document.createElement('div');
    card.className = 'document-card archived compilation';
    card.dataset.id = doc.id;
    card.dataset.isExpanded = 'false'; // Start collapsed
    
    // Get icon path for document type
    const iconPath = getCategoryIcon(doc.document_type || doc.category);
    
    // Format archive date
    const formattedArchiveDate = formatDocumentDate(doc.deleted_at || doc.deleted_at_formatted || doc.archived_at);
    
    // Format document type
    const documentType = formatDocumentType(doc.document_type || doc.category);
    
    // Format year range if available
    let yearRangeText = "";
    if (doc.start_year && doc.end_year) {
        yearRangeText = `${doc.start_year}-${doc.end_year}`;
    } else if (doc.start_year) {
        yearRangeText = `${doc.start_year}`;
    } else {
        yearRangeText = "Unknown year";
    }
    
    // Generate HTML for the card to match the document list view
    card.innerHTML = `
        <div class="document-icon">
            <img src="${iconPath}" alt="${documentType}">
        </div>
        <div class="document-info">
            <h3 class="document-title">
                <span class="expand-icon"><i class="fas fa-chevron-right"></i></span>
                ${documentType} Vol. ${doc.volume || ''}, Issue No. ${doc.issue || ''} (${yearRangeText})
            </h3>
            <div class="document-meta">
                <span class="meta-item"><i class="fas fa-folder"></i> ${childCount} documents</span>
                <span class="meta-item"><i class="fas fa-calendar-alt"></i> Archived: ${formattedArchiveDate}</span>
            </div>
        </div>
        <div class="document-actions">
            <button class="action-btn restore-btn" data-id="${doc.id}" title="Restore compilation">
                <i class="fas fa-trash-restore"></i>
            </button>
        </div>
    `;
    
    // Add click event to restore button
    card.querySelector('.restore-btn').addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent triggering parent card expansion
        restoreDocument(doc.id);
    });
    
    return card;
}

/**
 * Create a child document card
 * @param {Object} doc - Child document data
 * @returns {HTMLElement} - The child document card
 */
function createChildDocumentCard(doc) {
    // Create the document card container
    const card = document.createElement('div');
    card.className = 'child-document-card';
    card.dataset.id = doc.id;
    
    // Get icon path for document type
    const iconPath = getCategoryIcon(doc.document_type || doc.category);
    
    // Format document type
    const documentType = formatDocumentType(doc.document_type || doc.category);
    
    // Format authors
    const authors = formatAuthors(doc.authors || '');
    
    // Generate HTML for the card to match child documents in document list
    card.innerHTML = `
        <div class="document-icon">
            <img src="${iconPath}" alt="${documentType}" style="width: 24px; height: 24px;">
        </div>
        <div class="document-info">
            <h4 class="document-title">${doc.title || 'Untitled Document'}</h4>
            <div class="document-meta">
                <span class="meta-item"><i class="fas fa-user"></i> ${authors}</span>
            </div>
        </div>
        <div class="document-actions">
            <span class="child-badge" title="This document will be restored with its parent">
                <i class="fas fa-link"></i> Child
            </span>
        </div>
    `;
    
    return card;
}

/**
 * Format document date with consistent handling
 * @param {string|Object} dateValue - Date value from document
 * @returns {string} - Formatted date string
 */
function formatDocumentDate(dateValue) {
    if (!dateValue) return "Unknown date";
    
    try {
        // Handle special 'Unknown' marker from the backend
        if (dateValue === 'Unknown') {
            return "Unknown date";
        }
        
        // Handle ISO string format
        if (typeof dateValue === 'string') {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric'
                });
            }
        }
        
        // Handle date object with components
        if (typeof dateValue === 'object' && dateValue !== null) {
            // Check if it's an empty object
            if (Object.keys(dateValue).length === 0) {
                return "Unknown date";
            }
            
            // PostgreSQL dates might come as objects with specific format
            if (dateValue.year && dateValue.month && dateValue.day) {
                const year = parseInt(dateValue.year);
                let month = parseInt(dateValue.month);
                let day = parseInt(dateValue.day);
                
                if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric'
                    });
                }
            }
            
            // It could be a Date object
            if (dateValue.toISOString) {
                return dateValue.toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric'
                });
            }
        }
    } catch (error) {
        console.warn(`Error formatting date:`, error);
    }
    
    return "Unknown date";
}

/**
 * Create a document card for an archived document
 * @param {Object} doc - Document data
 * @returns {HTMLElement} - The document card element
 */
function createArchivedDocumentCard(doc) {
    // Create the document card container
    const card = document.createElement('div');
    card.className = 'document-card archived';
    card.dataset.id = doc.id; // Set data-id attribute for easier selection
    
    // Get icon path for document type
    const iconPath = getCategoryIcon(doc.document_type || doc.category);
    
    // Debug: Log the entire document object to find all date fields
    console.log(`Complete document ${doc.id} data:`, doc);
    
    // Format publication date
    let formattedPublicationDate = "Unknown date";
    // First check for the pre-formatted date field
    if (doc.publication_date_formatted) {
        console.log(`Using pre-formatted publication_date for document ${doc.id}:`, doc.publication_date_formatted);
        formattedPublicationDate = new Date(doc.publication_date_formatted).toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        });
    }
    // Fall back to the original publication_date field
    else if (doc.publication_date) {
        console.log(`Raw publication_date for document ${doc.id}:`, doc.publication_date);
        const pubDateValue = doc.publication_date;
        try {
            // Handle special 'Unknown' marker from the backend
            if (pubDateValue === 'Unknown') {
                formattedPublicationDate = "Unknown date";
            }
            else if (typeof pubDateValue === 'string') {
                // Handle ISO string format 
                const pubDate = new Date(pubDateValue);
                if (!isNaN(pubDate.getTime())) {
                    formattedPublicationDate = pubDate.toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric'
                    });
                }
            } else if (typeof pubDateValue === 'object' && pubDateValue !== null) {
                // Check if it's an empty object
                if (Object.keys(pubDateValue).length === 0) {
                    formattedPublicationDate = "Unknown date";
                }
                // PostgreSQL dates might come as objects with specific format
                else if (pubDateValue.year && pubDateValue.month && pubDateValue.day) {
                    // Months in JavaScript are 0-indexed, but we expect 1-indexed from DB
                    let month = parseInt(pubDateValue.month);
                    let day = parseInt(pubDateValue.day);
                    const year = parseInt(pubDateValue.year);
                    
                    // Validate date components
                    if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
                        // Format with user-friendly month name
                        const date = new Date(year, month - 1, day);
                        formattedPublicationDate = date.toLocaleDateString('en-US', {
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric'
                        });
                    } else {
                        // Use numeric format as fallback
                        formattedPublicationDate = `${pubDateValue.month}/${pubDateValue.day}/${pubDateValue.year}`;
                    }
                }
                // It could be a Date object
                else if (pubDateValue.toISOString) {
                    formattedPublicationDate = pubDateValue.toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric'
                    });
                }
            }
        } catch (error) {
            console.warn(`Error formatting publication date for document ${doc.id}:`, error);
        }
    }
    
    // Format archive date using the formatted field when available
    let formattedArchiveDate = "Unknown date";
    if (doc.deleted_at_formatted) {
        console.log(`Using pre-formatted deleted_at for document ${doc.id}:`, doc.deleted_at_formatted);
        formattedArchiveDate = new Date(doc.deleted_at_formatted).toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        });
    }
    // Fall back to the original deleted_at field
    else {
        const possibleArchiveDateFields = ['deleted_at', 'archived_at', 'DELETED_AT', 'archived_date', 'deleted_date'];
        
        // Find the first available archive date field
        let archiveDateField = null;
        for (const field of possibleArchiveDateFields) {
        if (doc[field]) {
                archiveDateField = field;
                console.log(`Found archive date field: ${field} with value:`, doc[field]);
            break;
        }
    }
    
        // Process the archive date if found
        if (archiveDateField) {
            const dateValue = doc[archiveDateField];
        try {
            if (typeof dateValue === 'string') {
                const archivedDate = new Date(dateValue);
                if (!isNaN(archivedDate.getTime())) {
                        formattedArchiveDate = archivedDate.toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric'
                    });
                }
            } else if (typeof dateValue === 'object' && dateValue !== null) {
                // Check if it's an empty object
                if (Object.keys(dateValue).length === 0) {
                        // Use current date as fallback
                        formattedArchiveDate = new Date().toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric'
                    });
                } 
                    // It could be a Date object
                else if (dateValue.toISOString) {
                        formattedArchiveDate = dateValue.toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric'
                    });
                    } 
                    // Or an object with date components
                    else if (dateValue.year && dateValue.month && dateValue.day) {
                        // Format with user-friendly month name
                        const date = new Date(
                            parseInt(dateValue.year), 
                            parseInt(dateValue.month) - 1, 
                            parseInt(dateValue.day)
                        );
                        if (!isNaN(date.getTime())) {
                            formattedArchiveDate = date.toLocaleDateString('en-US', {
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric'
                            });
                        } else {
                            formattedArchiveDate = `${dateValue.month}/${dateValue.day}/${dateValue.year}`;
                        }
                }
            }
        } catch (error) {
                console.warn(`Error formatting archive date for document ${doc.id}:`, error);
            }
        }
    }
    
    // Format document type
    const documentType = formatDocumentType(doc.document_type || doc.category);
    const documentTypeClass = documentType.toLowerCase();
    
    // Format authors
    const authors = formatAuthors(doc.authors || '');
    
    // Check if this is a compiled document with child items
    const isCompilation = doc.is_compilation || doc.is_compiled || doc.child_count > 0;
    if (isCompilation) {
        card.classList.add('compilation');
    }
    
    // Format date display based on document type
    let dateDisplay = "";
    if (isCompilation && (doc.start_year || doc.end_year)) {
        // For compilations with start/end year
        if (doc.start_year && doc.end_year) {
            dateDisplay = `<span class="meta-item"><i class="fas fa-calendar-day"></i> Year Range: ${doc.start_year}-${doc.end_year}</span>`;
        } else if (doc.start_year) {
            dateDisplay = `<span class="meta-item"><i class="fas fa-calendar-day"></i> Year: ${doc.start_year}</span>`;
        }
    } else {
        // For regular documents with publication date
        dateDisplay = `<span class="meta-item"><i class="fas fa-calendar-day"></i> Published: ${formattedPublicationDate}</span>`;
    }
    
    const childCount = doc.child_count || 0;
    
    // Generate HTML for the card
    card.innerHTML = `
        <div class="document-icon">
            <img src="${iconPath}" alt="${documentType}">
        </div>
        <div class="document-info">
            <h3 class="document-title">${doc.title || 'Untitled Document'}</h3>
            <div class="document-meta">
                <span class="meta-item"><i class="fas fa-user"></i> ${authors}</span>
                ${dateDisplay}
                <span class="meta-item"><i class="fas fa-calendar-alt"></i> Archived: ${formattedArchiveDate}</span>
            </div>
            ${isCompilation ? `<span class="compilation-badge"><i class="fas fa-layer-group"></i> ${childCount} items</span>` : ''}
        </div>
        <div class="document-actions">
            <button class="action-btn restore-btn" data-id="${doc.id}" title="Restore document">
                <i class="fas fa-trash-restore"></i>
            </button>
        </div>
    `;
    
    // Add click event to restore button
    card.querySelector('.restore-btn').addEventListener('click', function() {
        restoreDocument(doc.id);
    });
    
    // Track this document ID as displayed
    globalDisplayedDocIds.add(doc.id);
    visibleEntriesCount++;
    
    return card;
}

/**
 * Get icon path for a document category
 * @param {string} category - Document category
 * @returns {string} - Icon path
 */
function getCategoryIcon(category) {
    if (!category) {
        return 'icons/Category-icons/default_category_icon.png';
    }
    
    // Normalize category to handle case variations
    const normalizedCategory = category.toString().toUpperCase();
    
    const iconMap = {
        'THESIS': 'icons/Category-icons/thesis.png',
        'DISSERTATION': 'icons/Category-icons/dissertation.png',
        'CONFLUENCE': 'icons/Category-icons/confluence.png',
        'SYNERGY': 'icons/Category-icons/synergy.png'
    };
    
    return iconMap[normalizedCategory] || 'icons/Category-icons/default_category_icon.png';
}

/**
 * Format document type for display
 * @param {string} type - Document type
 * @returns {string} - Formatted document type
 */
function formatDocumentType(type) {
    // If the type is not provided, return "Unknown"
    if (!type) return 'Unknown';
    
    // Format types with specific display names
    const typeMap = {
        'THESIS': 'Thesis',
        'DISSERTATION': 'Dissertation',
        'CONFLUENCE': 'Confluence',
        'SYNERGY': 'Synergy'
    };
    
    return typeMap[type] || type;
}

/**
 * Format authors for display
 * @param {Array|string} authors - Array of author names or comma-separated string
 * @returns {string} - Formatted authors string
 */
function formatAuthors(authors) {
    if (!authors) {
        return '<span class="no-author">No authors</span>';
    }
    
    // If authors is already a string, just return it
    if (typeof authors === 'string') {
        return authors.trim() || '<span class="no-author">No authors</span>';
    }
    
    // If authors is an array, join it
    if (Array.isArray(authors)) {
        return authors.length > 0 ? 
            authors.join(', ') : 
            '<span class="no-author">No authors</span>';
    }
    
    // Fallback for any other case
    return '<span class="no-author">No authors</span>';
}

/**
 * Restore an archived document by its ID
 * @param {number} documentId - ID of the document to restore
 */
async function restoreDocument(documentId) {
    if (!documentId) {
        console.error('Cannot restore document: No ID provided');
        return;
    }
    
    if (!confirm('Are you sure you want to restore this document? It will be available in the main document list.')) {
        return;
    }
    
    try {
        console.log(`Restoring document with ID: ${documentId}`);
        
        // Show loading state on the document card
        const docCard = document.querySelector(`.document-card[data-id="${documentId}"]`);
        if (docCard) {
            docCard.classList.add('loading');
            const actionsElement = docCard.querySelector('.document-actions');
            if (actionsElement) {
                actionsElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restoring...';
            }
        }
        
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
        
        // Check if this is a compiled document (has the 'compiled' class)
        const isCompiled = docCard && (docCard.classList.contains('compiled') || docCard.classList.contains('compilation'));
        console.log(`Document ${documentId} isCompiled: ${isCompiled}`);
        
        // Use the unified API endpoint for restoration
        // Using DELETE method on /api/archives/:id which undeletes the document
        const response = await fetch(`/api/archives/${documentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server returned ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Document restored successfully:', result);
        
        // Create a better success message with document title and type
        const successMessage = `${isCompiled ? 'Compilation' : 'Document'} "${docTitle}" has been restored successfully.`;
        
        // Show success message
        showSuccessModal(successMessage);
        
        // If toast function exists, show toast too
        if (typeof showToast === 'function') {
            showToast(successMessage, 'document-restored');
        }
        
        // Refresh the document list
        setTimeout(() => {
            loadArchivedDocuments(currentPage, false);
            
            // If we have document list refresh functionality available, call it too
            if (window.documentList && typeof window.documentList.refreshDocumentList === 'function') {
                window.documentList.refreshDocumentList(true);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error restoring document:', error);
        showErrorModal(`Failed to restore document: ${error.message || 'Unknown error'}`);
        
        // Remove loading state from card if still present
        const docCard = document.querySelector(`.document-card[data-id="${documentId}"]`);
        if (docCard) {
            docCard.classList.remove('loading');
            renderActionsForCard(docCard, documentId);
        }
    }
}

/**
 * Render the action buttons for a document card
 * @param {HTMLElement} cardElement - The document card element
 * @param {number} documentId - ID of the document
 */
function renderActionsForCard(cardElement, documentId) {
    const actionsElement = cardElement.querySelector('.document-actions');
    if (actionsElement) {
        actionsElement.innerHTML = `
            <button class="action-btn restore-btn" data-id="${documentId}" title="Restore document">
                <i class="fas fa-trash-restore"></i>
            </button>
        `;
        
        // Re-attach event listener
        const restoreBtn = actionsElement.querySelector('.restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', function() {
                restoreDocument(documentId);
            });
        }
    }
}

/**
 * Update pagination controls
 * @param {number} totalPages - Total number of pages
 */
function updatePagination(totalPages) {
    const paginationEl = document.querySelector('.pagination .page-links');
    if (!paginationEl) return;
    
    paginationEl.innerHTML = '';
    
    if (totalPages <= 1) {
        return;
    }
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn prev';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.onclick = () => loadArchivedDocuments(currentPage - 1);
    paginationEl.appendChild(prevBtn);
    
    // Page numbers
    const maxPageNumbers = 5; // Maximum number of page numbers to show
    
    // Determine range of page numbers to display
    let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
    let endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);
    
    // Adjust if we're at the end
    if (endPage - startPage + 1 < maxPageNumbers) {
        startPage = Math.max(1, endPage - maxPageNumbers + 1);
    }
    
    // First page button if start page is not 1
    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'pagination-btn';
        firstBtn.textContent = '1';
        firstBtn.onclick = () => loadArchivedDocuments(1);
        paginationEl.appendChild(firstBtn);
        
        // Add ellipsis if start page is not 2
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationEl.appendChild(ellipsis);
        }
    }
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-btn';
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.textContent = i.toString();
        pageBtn.onclick = () => loadArchivedDocuments(i);
        paginationEl.appendChild(pageBtn);
    }
    
    // Last page button if end page is not the last page
    if (endPage < totalPages) {
        // Add ellipsis if end page is not totalPages - 1
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationEl.appendChild(ellipsis);
        }
        
        const lastBtn = document.createElement('button');
        lastBtn.className = 'pagination-btn';
        lastBtn.textContent = totalPages.toString();
        lastBtn.onclick = () => loadArchivedDocuments(totalPages);
        paginationEl.appendChild(lastBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn next';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.onclick = () => loadArchivedDocuments(currentPage + 1);
    paginationEl.appendChild(nextBtn);
}

/**
 * Update entries info display
 * @param {number} visibleCount - Number of visible entries
 * @param {number} page - Current page number
 * @param {number} totalCount - Total number of entries
 */
function updateEntriesInfo(visibleCount, page, totalCount) {
    const entriesInfo = document.getElementById('entries-info');
    if (!entriesInfo) return;
    
    visibleEntriesCount = visibleCount;
    
    if (totalCount === 0) {
        entriesInfo.textContent = 'No entries found';
        return;
    }
    
    const start = (page - 1) * 10 + 1;
    const end = Math.min(start + visibleCount - 1, totalCount);
    
    entriesInfo.textContent = `Showing ${start} to ${end} of ${totalCount} entries`;
}

/**
 * Show success modal
 * @param {string} message - Message to display
 */
function showSuccessModal(message) {
    const modal = document.getElementById('success-modal');
    if (modal) {
        const modalMessage = modal.querySelector('p');
        if (modalMessage) {
            modalMessage.textContent = message;
        }
        
        // Add visible class for animation
        modal.style.display = 'flex';
        
        // Trigger animation with a small delay to allow display:flex to take effect
        setTimeout(() => {
            modal.classList.add('visible');
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            // First fade out
            modal.classList.remove('visible');
            
            // Then hide completely after transition completes
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }, 3000);
    } else {
        // Fallback to toast notification if modal not found
        if (typeof showToast === 'function') {
            showToast(message, 'success');
        } else {
            alert(message);
        }
    }
}

/**
 * Show error modal
 * @param {string} message - Message to display
 */
function showErrorModal(message) {
    const modal = document.getElementById('error-modal');
    if (modal) {
        const modalMessage = modal.querySelector('p');
        if (modalMessage) {
            modalMessage.textContent = message;
        }
        
        // Add visible class for animation
        modal.style.display = 'flex';
        
        // Trigger animation with a small delay to allow display:flex to take effect
        setTimeout(() => {
            modal.classList.add('visible');
        }, 10);
        
        // Hide after 4 seconds for errors (slightly longer than success)
        setTimeout(() => {
            // First fade out
            modal.classList.remove('visible');
            
            // Then hide completely after transition completes
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }, 4000);
    } else {
        // Fallback to toast notification if modal not found
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            alert('Error: ' + message);
        }
    }
}

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeArchivedDocumentList);