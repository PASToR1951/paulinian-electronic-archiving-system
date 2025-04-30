/**
 * Document listing, filtering, and pagination functionality
 */

// Globals for document listing
let currentPage = 1;
const pageSize = 5;
let totalEntries = 0;
let currentCategoryFilter = null;
let currentSortOrder = 'latest';
let visibleEntriesCount = 0;
let expandedDocuments = new Set();
let globalDisplayedDocIds = new Set();

// Initialize document list functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load the document card components script dynamically if not already loaded
    if (!window.documentCardComponents) {
        const script = document.createElement('script');
        script.src = 'js/document-card-components.js';
        script.onload = function() {
            console.log('Document card components loaded successfully');
            // Now initialize the document list
            initializeDocumentList();
        };
        document.head.appendChild(script);
    } else {
        // Components already loaded, initialize directly
        initializeDocumentList();
    }
});

// Initialize the document list
function initializeDocumentList() {
    setupCategoryFilters();
    setupSortOrder();
    loadCategories();
    loadDocuments(1);
}

// Load category information and set up handlers
async function loadCategories() {
    try {
        console.log("Fetching categories from API...");
        const response = await fetch('/api/category');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const categories = await response.json();

        console.log('Fetched categories:', categories);

        // Calculate total file count for the "All" category
        let totalFileCount = 0;
        categories.forEach(category => {
            totalFileCount += Number(category.count) || 0;
        });

        // Update the "All" category file count
        const allCategoryElement = document.querySelector('.category[data-category="All"]');
        if (allCategoryElement) {
            const fileCountElement = allCategoryElement.querySelector(".category-file-count");
            if (fileCountElement) {
                fileCountElement.textContent = `${totalFileCount} files`;
            }
        }

        // Update individual category counts
        categories.forEach(category => {
            const categoryElement = document.querySelector(`.category[data-category="${category.name}"]`);
            if (categoryElement) {
                const fileCountElement = categoryElement.querySelector(".category-file-count");
                if (fileCountElement) {
                    const count = Number(category.count) || 0;
                    fileCountElement.textContent = `${count} files`;
                }
                
                // Add click handler for category filtering
                categoryElement.removeEventListener('click', categoryElement.clickHandler);
                categoryElement.clickHandler = () => {
                    filterByCategory(category.name);
                };
                categoryElement.addEventListener('click', categoryElement.clickHandler);
                categoryElement.style.cursor = 'pointer';
            }
        });

    } catch (error) {
        console.error("Error fetching categories:", error);
        // Set error state for file counts
        document.querySelectorAll('.category-file-count').forEach(element => {
            element.textContent = '0 files';
        });
    }
}

// Reset document tracking when changing filters or sorting
function resetDocumentTracking() {
    globalDisplayedDocIds.clear();
    currentPage = 1;
}

// Filter documents by category
function filterByCategory(categoryName) {
    console.log(`Filtering by category: ${categoryName}`);
    
    // Toggle filter if clicking the same category again
    if (currentCategoryFilter === categoryName) {
        console.log("Clearing category filter");
        currentCategoryFilter = null;
        document.querySelectorAll('.category').forEach(cat => {
            cat.classList.remove('active');
        });
    } else {
        console.log(`Setting filter to: ${categoryName}`);
        currentCategoryFilter = categoryName;
        
        // Highlight the selected category
        document.querySelectorAll('.category').forEach(cat => {
            const catName = cat.getAttribute('data-category');
            if (catName && catName.toLowerCase() === categoryName.toLowerCase()) {
                cat.classList.add('active');
            } else {
                cat.classList.remove('active');
            }
        });
    }
    
    // Reset to first page and clear tracking when filter changes
    resetDocumentTracking();
    loadDocuments(currentPage);

    // Update the filter indicator
    updateFilterIndicator();
}

// Setup sort order dropdown
function setupSortOrder() {
    const sortOrderSelect = document.getElementById('sort-order');
    if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', function() {
            currentSortOrder = this.value;
            console.log(`Sort order changed to: ${currentSortOrder}`);
            resetDocumentTracking();
            loadDocuments(1); // Reset to page 1 when sort order changes
        });
    }
}

// Load documents with pagination
async function loadDocuments(page = 1) {
    try {
        // Reset document tracking on ANY page change
        globalDisplayedDocIds.clear();

        // Remember which documents were expanded before we refresh
        const expandedDocIds = [];
        document.querySelectorAll('.document-card.compilation[data-is-expanded="true"]').forEach(card => {
            expandedDocIds.push(card.getAttribute('data-id'));
        });
        
        // Use the exact page size we want to display per page
        const exactPageSize = pageSize;
        
        // Add cache-busting parameter to prevent caching
        const cacheBuster = new Date().getTime();
        let url = `/api/documents?page=${page}&size=${exactPageSize}&_=${cacheBuster}`;
        
        // Apply category filter if set
        if (currentCategoryFilter && currentCategoryFilter !== 'All') {
            // Make sure category name is correctly capitalized - this is important for backend matching
            // For "Dissertation", "Thesis", "Confluence", "Synergy"
            let formattedCategory = currentCategoryFilter;
            
            // Map of expected category names with correct capitalization
            const categoryMap = {
                "dissertation": "Dissertation",
                "thesis": "Thesis",
                "confluence": "Confluence",
                "synergy": "Synergy"
            };
            
            // Use the correctly capitalized version if available
            const lowerCaseCategory = currentCategoryFilter.toLowerCase();
            if (categoryMap[lowerCaseCategory]) {
                formattedCategory = categoryMap[lowerCaseCategory];
            }
            
            url += `&category=${encodeURIComponent(formattedCategory)}`;
        }
        
        // Apply sort order
        url += `&sort=${encodeURIComponent(currentSortOrder)}`;
        
        console.log('Fetching documents from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            } catch (parseError) {
                throw new Error(`HTTP error! status: ${response.status}, response: ${errorText.substring(0, 100)}...`);
            }
        }
        
        const responseData = await response.json();
        
        const { documents, totalCount, totalPages, pageRedirected } = responseData;
        
        // If server redirected us to a different page, update our UI accordingly
        if (pageRedirected) {
            currentPage = 1;
            
            // Update URL if needed to reflect the page change
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('page', '1');
            window.history.replaceState({}, '', newUrl.toString());
        } else {
            // Update current page normally
            currentPage = page;
        }
        
        // Update total entries - we'll use the totalCount from the server
        totalEntries = totalCount;
        
        // Calculate expected number of pages based on pageSize and totalCount
        const expectedTotalPages = Math.ceil(totalCount / pageSize);
        
        // If server's totalPages doesn't match what we expect, use our calculated value
        const finalTotalPages = expectedTotalPages > 0 ? expectedTotalPages : totalPages;
        
        const documentContainer = document.querySelector("#documents-container");
        if (!documentContainer) {
            console.error("Document container not found");
            return;
        }
        
        // Clear existing contents
        documentContainer.innerHTML = "";
        
        // Check if we have documents to display
        if (!documents || documents.length === 0) {
            let filterMessage = '';
            if (currentCategoryFilter && currentCategoryFilter !== "All") {
                filterMessage += ` in category "${currentCategoryFilter}"`;
            }
            
            documentContainer.innerHTML = `<div class="no-docs">No documents found${filterMessage}</div>`;
            
            // Update pagination with zero pages
            updatePagination(0);
            return;
        }
        
        // Render documents
        renderDocuments(documents, documentContainer, expandedDocIds);
        
        // Update pagination
        updatePagination(finalTotalPages);
        
    } catch (error) {
        console.error("Error loading documents:", error);
        const documentContainer = document.querySelector("#documents-container");
        if (documentContainer) {
            documentContainer.innerHTML = `<div class="error-message">Error loading documents: ${error.message}</div>`;
        }
        updatePagination(0);
    }
}

// Render documents in the container
function renderDocuments(documents, container, expandedDocIds = []) {
    // Clear tracking of visible entries for this page
    visibleEntriesCount = 0;

    documents.forEach(doc => {
        if (globalDisplayedDocIds.has(doc.id)) {
            return; // Skip documents we've already displayed
        }
        
        globalDisplayedDocIds.add(doc.id);
        
        // Increment visible entries count (one per document card)
        visibleEntriesCount++;
        
        // Determine if this is a compiled document based on document_type
        // Note: We're checking for CONFLUENCE or SYNERGY in document_type,
        // but we'll display it according to its category
        const isCompiled = doc.document_type === 'CONFLUENCE' || doc.document_type === 'SYNERGY';
        
        if (isCompiled) {
            // This is a compiled document (a parent with children)
            const card = window.documentCardComponents.createCompiledDocumentCard(doc, expandedDocIds);
            container.appendChild(card);
            window.documentCardComponents.setupCompiledDocumentEventListeners(card);
            
            // If this document is expanded, load its children immediately
            if (expandedDocIds.includes(doc.id.toString()) && doc.id) {
                const childrenContainer = card.querySelector('.children-container');
                if (window.ensureAllChildDocumentsLoaded) {
                    window.ensureAllChildDocumentsLoaded(doc.id, childrenContainer);
                }
            }
        } else {
            // This is a regular document
            const card = window.documentCardComponents.createDocumentCard(doc);
            container.appendChild(card);
        }
    });
    
    // Update the entries info
    updateEntriesInfo();
}

// Update pagination links
function updatePagination(totalPages) {
    const paginationContainer = document.getElementById('page-links');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) {
        // If we have 0 or 1 pages, don't show pagination
        return;
    }
    
    // Add previous page button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&laquo;';
    prevBtn.className = 'page-link';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            loadDocuments(currentPage - 1);
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // Determine page range to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust start page if needed to always show 5 pages if available
    if (endPage - startPage < 4 && totalPages > 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Add page links
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = 'page-link' + (i === currentPage ? ' active' : '');
        pageBtn.addEventListener('click', () => loadDocuments(i));
        paginationContainer.appendChild(pageBtn);
    }
    
    // Add next page button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&raquo;';
    nextBtn.className = 'page-link';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadDocuments(currentPage + 1);
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// Update entries information
function updateEntriesInfo() {
    const entriesInfoElement = document.getElementById('entries-info');
    if (!entriesInfoElement) return;
    
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(start + visibleEntriesCount - 1, totalEntries);
    
    entriesInfoElement.textContent = totalEntries > 0 
        ? `Showing ${start} to ${end} of ${totalEntries} entries` 
        : 'No entries found';
}

// Update filter indicator
function updateFilterIndicator() {
    // Add visual indicator of active filters
    const indicator = document.querySelector('.filter-indicator');
    
    // Create or update the filter indicator
    if (currentCategoryFilter) {
        let indicatorHTML = `<div class="filter-badge">Category: ${currentCategoryFilter} <span class="clear-filter" data-filter="category">×</span></div>`;
        
        if (!indicator) {
            const newIndicator = document.createElement('div');
            newIndicator.className = 'filter-indicator';
            newIndicator.innerHTML = indicatorHTML;
            
            // Find where to insert it
            const container = document.querySelector('.category-container');
            if (container) {
                container.parentNode.insertBefore(newIndicator, container.nextSibling);
            }
        } else {
            indicator.innerHTML = indicatorHTML;
        }
        
        // Add event listener to clear filter buttons
        document.querySelectorAll('.clear-filter').forEach(btn => {
            btn.addEventListener('click', function() {
                const filterType = this.getAttribute('data-filter');
                if (filterType === 'category') {
                    currentCategoryFilter = null;
                    document.querySelectorAll('.category').forEach(cat => {
                        cat.classList.remove('active');
                    });
                    resetDocumentTracking();
                    loadDocuments(1);
                    updateFilterIndicator();
                }
            });
        });
    } else {
        // Remove the filter indicator if no filters active
        if (indicator) {
            indicator.remove();
        }
    }
}

// Setup category filters
function setupCategoryFilters() {
    // Add click handler for the "All" category
    const allCategory = document.querySelector('.category[data-category="All"]');
    if (allCategory) {
        allCategory.addEventListener('click', () => {
            filterByCategory('All');
        });
        allCategory.style.cursor = 'pointer';
    }
    
    // Individual category handlers are added in loadCategories()
}

// Setup document action listeners
function setupDocumentActionListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-document-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const documentId = btn.closest('.document-card').getAttribute('data-id');
            if (documentId) {
                window.editDocument(documentId);
            }
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-document-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.document-card');
            const documentId = card.getAttribute('data-id');
            if (documentId) {
                const documentTitle = card.querySelector('.document-title').textContent;
                window.openDeleteConfirmation({
                    id: documentId,
                    title: documentTitle
                });
            }
        });
    });
    
    // View buttons
    document.querySelectorAll('.view-document-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const documentId = btn.closest('.document-card').getAttribute('data-id');
            
            // Use the global preview function from document-preview.js
            if (documentId && window.openPdfModal) {
                // Fetch the document details first
                fetch(`/api/documents/${documentId}`)
                    .then(response => response.json())
                    .then(doc => {
                        window.openPdfModal(doc);
                    })
                    .catch(error => {
                        console.error('Error fetching document for preview:', error);
                    });
            }
        });
    });
    
    // Document card clicks for preview
    document.querySelectorAll('.document-card:not(.compilation)').forEach(card => {
        card.addEventListener('click', function() {
            const documentId = this.getAttribute('data-id');
            if (documentId && window.showDocumentPreview) {
                fetch(`/api/documents/${documentId}`)
                    .then(response => response.json())
                    .then(doc => {
                        window.showDocumentPreview(doc);
                    })
                    .catch(error => {
                        console.error('Error fetching document for preview:', error);
                    });
            }
        });
    });
    
    // Make entire compiled document row clickable for expansion
    document.querySelectorAll('.document-card.compilation').forEach(card => {
        // Add click handler to the entire row
        card.addEventListener('click', function(e) {
            // Don't handle clicks on action buttons
            if (e.target.closest('.document-actions')) {
                return;
            }
            
            const documentId = this.getAttribute('data-id');
            const childrenContainer = this.querySelector('.children-container');
            const toggleBtn = this.querySelector('.toggle-children-btn');
            
            if (childrenContainer && toggleBtn) {
                const isExpanded = childrenContainer.style.display !== 'none';
                childrenContainer.style.display = isExpanded ? 'none' : 'block';
                
                // Update the button text and icon
                toggleBtn.innerHTML = isExpanded 
                    ? '<i class="fas fa-chevron-down"></i> Show Studies' 
                    : '<i class="fas fa-chevron-up"></i> Hide Studies';
                
                // Update the data attribute for tracking expanded state
                this.setAttribute('data-is-expanded', !isExpanded);
                
                // Load children if needed
                if (!isExpanded && documentId) {
                    // Use window function from document-list.js
                    if (window.ensureAllChildDocumentsLoaded) {
                        window.ensureAllChildDocumentsLoaded(documentId, childrenContainer);
                    }
                }
            }
        });
    });
    
    // Toggle expansion for compiled documents (button click)
    document.querySelectorAll('.toggle-children-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.document-card');
            const documentId = card.getAttribute('data-id');
            const childrenContainer = card.querySelector('.children-container');
            
            if (childrenContainer) {
                const isExpanded = childrenContainer.style.display !== 'none';
                childrenContainer.style.display = isExpanded ? 'none' : 'block';
                
                // Update the button text and icon
                this.innerHTML = isExpanded 
                    ? '<i class="fas fa-chevron-down"></i> Show Studies' 
                    : '<i class="fas fa-chevron-up"></i> Hide Studies';
                
                // Update the data attribute for tracking expanded state
                card.setAttribute('data-is-expanded', !isExpanded);
                
                // Load children if needed
                if (!isExpanded && documentId) {
                    // Use window function from document-list.js
                    if (window.ensureAllChildDocumentsLoaded) {
                        window.ensureAllChildDocumentsLoaded(documentId, childrenContainer);
                    }
                }
            }
        });
    });
}

// Ensure all child documents are loaded
async function ensureAllChildDocumentsLoaded(documentId, childrenContainer) {
    // If children are already loaded, do nothing
    if (childrenContainer.querySelector('.child-document-card')) {
        childrenContainer.querySelector('.loading-children')?.remove();
        return;
    }
    
    try {
        // Show loading state
        childrenContainer.innerHTML = '<div class="loading-children">Loading studies...</div>';
        
        // Fetch all child documents
        const response = await fetch(`/api/documents/${documentId}/children`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const children = await response.json();
        
        // Remove loading indicator
        childrenContainer.innerHTML = '';
        
        // If no children, show message
        if (!children || children.length === 0) {
            childrenContainer.innerHTML = '<div class="no-children">No studies found in this compilation</div>';
            return;
        }
        
        // Render each child document
        children.forEach(child => {
            const childCard = window.documentCardComponents.createChildDocumentCard(child);
            childrenContainer.appendChild(childCard);
        });
        
        // Setup event listeners for children
        window.documentCardComponents.setupChildDocumentEventListeners(childrenContainer.closest('.document-card'));
        
    } catch (error) {
        console.error('Error loading child documents:', error);
        childrenContainer.innerHTML = '<div class="error-message">Error loading studies</div>';
    }
}

// Export functions to window for use in other modules
window.filterByCategory = filterByCategory;
window.loadDocuments = loadDocuments;
window.ensureAllChildDocumentsLoaded = ensureAllChildDocumentsLoaded; 