// Global variables for filtering and pagination
let currentPage = 1;
let currentCategoryFilter = null;
let visibleEntriesCount = 0;

/**
 * Filter documents by category
 * @param {string} categoryName - Category name to filter by
 */
function filterByCategory(categoryName) {
    console.log(`Filtering by category: ${categoryName}`);
    
    // Reset all active categories
    document.querySelectorAll('.category').forEach(cat => {
        cat.classList.remove('active');
    });
    
    // Set or clear the current category filter
    if (categoryName === 'All') {
        currentCategoryFilter = null;
        document.querySelector('.category[data-category="All"]').classList.add('active');
    } else {
        currentCategoryFilter = categoryName;
        document.querySelector(`.category[data-category="${categoryName}"]`).classList.add('active');
    }
    
    // Reset to page 1 and load documents
    if (window.documentList && window.documentList.loadDocuments) {
        window.documentList.loadDocuments(1, true);
    }
    
    // Update filter indicator
    updateFilterIndicator();
}

/**
 * Set up event listeners for category filters
 */
function setupCategoryFilters() {
    console.log('Setting up category filters');
    
    document.querySelectorAll('.category').forEach(category => {
        category.addEventListener('click', function() {
            const categoryName = this.getAttribute('data-category');
            filterByCategory(categoryName);
        });
    });
}

/**
 * Load categories and update their counts
 */
async function loadCategories() {
    console.log('Loading categories');
    
    try {
        const response = await fetch('/api/category');
        
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
    console.log('Updating category counts');
    
    // Calculate total documents across all categories
    let totalDocs = 0;
    categories.forEach(cat => {
        totalDocs += cat.count;
    });
    
    // Update the "All" category count
    const allCategoryElement = document.querySelector('.category[data-category="All"] .category-file-count');
    if (allCategoryElement) {
        allCategoryElement.textContent = `${totalDocs} files`;
    }
    
    // Update each individual category count
    categories.forEach(category => {
        const categoryElement = document.querySelector(`.category[data-category="${category.name}"] .category-file-count`);
        if (categoryElement) {
            categoryElement.textContent = `${category.count} ${category.count === 1 ? 'file' : 'files'}`;
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
    console.log('Updating filter indicator');
    
    let indicator = document.querySelector('.filter-indicator');
    
    if (currentCategoryFilter) {
        // Create or update indicator
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'filter-indicator';
            document.querySelector('.docs-container').insertBefore(indicator, document.getElementById('documents-container'));
        }
        
        indicator.innerHTML = `
            <span>Filtered by: <strong>${currentCategoryFilter}</strong></span>
            <button class="clear-filter" data-filter="category">Clear</button>
        `;
        
        document.querySelectorAll('.clear-filter').forEach(btn => {
            btn.addEventListener('click', function() {
                const filterType = this.getAttribute('data-filter');
                if (filterType === 'category') {
                    currentCategoryFilter = null;
                    document.querySelectorAll('.category').forEach(cat => {
                        cat.classList.remove('active');
                    });
                    if (window.documentList && window.documentList.loadDocuments) {
                        window.documentList.loadDocuments(1, true);
                    }
                    if (indicator) {
                        indicator.remove();
                    }
                }
            });
        });
    } else if (indicator) {
        indicator.remove();
    }
}

/**
 * Initialize filters and pagination
 */
function initializeFiltersAndPagination() {
    setupCategoryFilters();
    setupSortOrder();
    setupPaginationControls();
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

// Export functions for use in document-list.js
window.documentFilters = {
    initializeFiltersAndPagination,
    filterByCategory,
    updatePagination,
    setCurrentPage,
    setVisibleEntriesCount,
    getCurrentCategoryFilter,
    getCurrentSortOrder,
    updateFilterIndicator,
    getCurrentPage
}; 