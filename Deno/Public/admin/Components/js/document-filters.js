// Global variables for filtering and pagination
let currentPage = 1;
let currentCategoryFilter = null;
let currentSort = 'latest';
let currentSearchQuery = '';
let visibleEntriesCount = 0;

/**
 * Filter documents by category
 * @param {string} categoryName - Category name to filter by
 */
function filterByCategory(categoryName) {
    console.log(`Filtering by category: ${categoryName}`);
    
    // Check if we're clicking the already active category
    const isActiveCategory = document.querySelector(`.category[data-category="${categoryName}"].active`) !== null;
    
    if (isActiveCategory) {
        // If clicking the active category, clear the filter and set to All
        console.log(`Clearing filter as ${categoryName} is already active`);
        currentCategoryFilter = null;
        
        // Remove active class from all categories
        document.querySelectorAll('.category').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Set "All" category as active
        document.querySelector('.category[data-category="All"]').classList.add('active');
    } else {
        // Convert display category names to document_type ENUM values for API
        const categoryTypeMap = {
            'All': 'All',
            'Thesis': 'THESIS',
            'Dissertation': 'DISSERTATION',
            'Confluence': 'CONFLUENCE',
            'Synergy': 'SYNERGY'
        };
        
        // Use the mapped value for the filter
        currentCategoryFilter = categoryTypeMap[categoryName] || categoryName;
        
        console.log(`Mapped category from ${categoryName} to ${currentCategoryFilter}`);
        
        // Update active category styling
        document.querySelectorAll('.category').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-category') === categoryName);
        });
    }
    
    currentPage = 1; // Reset to first page when changing filters
    
    // Load documents with the updated filter
    if (window.documentList && window.documentList.loadDocuments) {
        window.documentList.loadDocuments(1, true);
    }
}

/**
 * Set up event listeners for category filters
 */
function setupCategoryFilters() {
    console.log('Setting up category filters');
    
    document.querySelectorAll('.category').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            filterByCategory(category);
        });
    });
}

/**
 * Load categories and update their counts
 */
async function loadCategories() {
    console.log('Loading categories');
    
    try {
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const categories = await response.json();
        console.log('Categories loaded:', categories);
        
        // Update category counts
        updateCategoryCounts(categories);
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

/**
 * Update category counts in the UI
 * @param {Array} categories - Array of category objects with counts
 */
function updateCategoryCounts(categories) {
    console.log('Updating category counts:', categories);
    
    // Calculate total documents across all categories
    let totalDocs = 0;
    categories.forEach(cat => {
        totalDocs += cat.count;
    });
    
    // Update the "All" category count
    const allCountElement = document.querySelector('.category[data-category="All"] .category-file-count');
    if (allCountElement) {
        allCountElement.textContent = `${totalDocs} files`;
    }
    
    // Map API document_type to display names
    const typeDisplayMap = {
        'THESIS': 'Thesis',
        'DISSERTATION': 'Dissertation',
        'CONFLUENCE': 'Confluence',
        'SYNERGY': 'Synergy'
    };
    
    // Update each individual category count
    categories.forEach(category => {
        // Use the display name mapped from document_type
        const displayName = typeDisplayMap[category.name] || category.name;
        console.log(`Updating count for category: ${category.name} -> ${displayName} with count: ${category.count}`);
        const countElement = document.querySelector(`.category[data-category="${displayName}"] .category-file-count`);
        if (countElement) {
            countElement.textContent = `${category.count} ${category.count === 1 ? 'file' : 'files'}`;
        } else {
            console.warn(`Could not find element for category: ${displayName}`);
        }
    });
}

/**
 * Set up event listeners for sort order dropdown
 */
function setupSortOrder() {
    console.log('Setting up sort order');
    
    const sortOrderSelect = document.getElementById('sort-order');
    if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', function() {
            if (window.documentList && window.documentList.loadDocuments) {
                window.documentList.loadDocuments(1, true);
            }
        });
    }
}

/**
 * Set up event listeners for pagination controls
 */
function setupPaginationControls() {
    console.log('Setting up pagination controls');
    
    const pageLinks = document.getElementById('page-links');
    if (pageLinks) {
        pageLinks.addEventListener('click', function(e) {
            if (e.target.matches('.page-link')) {
                e.preventDefault();
                const page = parseInt(e.target.getAttribute('data-page'));
                if (!isNaN(page) && window.documentList && window.documentList.loadDocuments) {
                    window.documentList.loadDocuments(page);
                }
            }
        });
    }
}

/**
 * Update pagination controls based on total pages
 * @param {number} totalPages - Total number of pages
 */
function updatePagination(totalPages) {
    console.log(`Updating pagination for ${totalPages} total pages`);
    
    const pageLinks = document.getElementById('page-links');
    if (!pageLinks) return;
    
    // Clear existing pagination
    pageLinks.innerHTML = '';
    
    if (totalPages <= 1) {
        // No pagination needed
        return;
    }
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.classList.add('page-link', 'prev');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.setAttribute('data-page', Math.max(1, currentPage - 1));
    pageLinks.appendChild(prevButton);
    
    // Determine which page numbers to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.classList.add('page-link');
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.textContent = i;
        pageButton.setAttribute('data-page', i);
        pageLinks.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.classList.add('page-link', 'next');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.setAttribute('data-page', Math.min(totalPages, currentPage + 1));
    pageLinks.appendChild(nextButton);
}

/**
 * Update entries information display
 */
function updateEntriesInfo() {
    const entriesInfo = document.getElementById('entries-info');
    if (entriesInfo) {
        entriesInfo.textContent = `Showing ${visibleEntriesCount} document(s)`;
    }
}

/**
 * Update filter indicator based on current filter
 */
function updateFilterIndicator() {
    // Function intentionally left empty to remove filter indicator
    // The category buttons themselves now show the active state
}

/**
 * Initialize filters and pagination
 */
function initializeFiltersAndPagination() {
    console.log('Initializing filters and pagination');
    
    // Set up event listeners
    setupCategoryFilters();
    setupSortOrder();
    setupPaginationControls();
    setupSearchInput();
    
    // Load initial categories
    loadCategories();
}

/**
 * Set the current page
 * @param {number} page - Page number
 */
function setCurrentPage(page) {
    currentPage = page;
}

/**
 * Set the visible entries count
 * @param {number} count - Number of visible entries
 */
function setVisibleEntriesCount(count) {
    visibleEntriesCount = count;
    updateEntriesInfo();
}

/**
 * Get the current category filter
 * @returns {string|null} Current category filter or null
 */
function getCurrentCategoryFilter() {
    return currentCategoryFilter;
}

/**
 * Get the current sort order from the UI
 * @returns {string} Current sort order
 */
function getCurrentSortOrder() {
    const sortOrderSelect = document.getElementById('sort-order');
    return sortOrderSelect ? sortOrderSelect.value : 'latest';
}

/**
 * Get the current page
 * @returns {number} Current page number
 */
function getCurrentPage() {
    return currentPage;
}

/**
 * Setup search input handler
 */
function setupSearchInput() {
    const searchInput = document.getElementById('search-documents');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearchQuery = this.value.trim();
            currentPage = 1; // Reset to first page when searching
            
            if (window.documentList && window.documentList.loadDocuments) {
                // Store the search query so we can process it after loading documents
                window.documentList.currentSearchQuery = currentSearchQuery;
                
                // Load documents with search
                window.documentList.loadDocuments(1, true);
            }
        });
    }
}

/**
 * Get current search query
 * @returns {string} Current search query
 */
function getCurrentSearchQuery() {
    return currentSearchQuery;
}

/**
 * Reset all filters to their default state
 */
function resetFilters() {
    // Reset category filter
    currentCategoryFilter = null;
    document.querySelectorAll('.category').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Set "All" category as active
    const allCategory = document.querySelector('.category[data-category="All"]');
    if (allCategory) {
        allCategory.classList.add('active');
    }
    
    // Reset page
    currentPage = 1;
    
    // Reset sort order
    const sortOrderSelect = document.getElementById('sort-order');
    if (sortOrderSelect) {
        sortOrderSelect.value = 'latest';
        currentSort = 'latest';
    }
    
    // Reset search query
    currentSearchQuery = '';
    const searchInput = document.getElementById('search-documents');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Load documents with reset filters
    if (window.documentList && window.documentList.loadDocuments) {
        window.documentList.loadDocuments(1, true);
    }
}

// Export functions for use in other modules
window.documentFilters = {
    initializeFiltersAndPagination,
    setCurrentPage,
    setVisibleEntriesCount,
    getCurrentCategoryFilter,
    getCurrentSortOrder,
    getCurrentPage,
    getCurrentSearchQuery,
    updatePagination,
    updateFilterIndicator,
    resetFilters
}; 