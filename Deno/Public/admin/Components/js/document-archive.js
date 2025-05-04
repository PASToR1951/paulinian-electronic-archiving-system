/**
 * Document archive functionality
 */

// Create a namespace for archive functionality
window.documentArchive = (function() {
    // State management object
    const archiveState = {
        isArchiveMode: false,
        documents: [],
        currentPage: 1,
        totalPages: 1,
        category: 'All',
        isLoading: false,
        transitionInProgress: false,
        cacheLifetimeMs: 5 * 60 * 1000, // 5 minutes cache lifetime
        
        // Methods to update state
        setArchiveMode(mode) {
            this.isArchiveMode = mode;
            // Trigger UI updates when mode changes
            updateArchiveButtonUI();
            updatePageTitle();
        },
        
        reset() {
            this.documents = [];
            this.currentPage = 1;
            this.totalPages = 1;
        }
    };
    
    // Document cache to improve performance
    const documentCache = {
        regular: {
            documents: [],
            timestamp: 0,
            page: 1,
            category: 'All',
            totalPages: 0
        },
        archived: {
            documents: [],
            timestamp: 0,
            page: 1,
            category: 'All',
            totalPages: 0
        },
        
        // Cache expiration time (5 minutes)
        expiryTime: 5 * 60 * 1000,
        
        // Store documents in cache
        storeDocuments(mode, docs, page, category) {
            const cache = mode === 'archived' ? this.archived : this.regular;
            cache.documents = docs;
            cache.timestamp = Date.now();
            cache.page = page;
            cache.category = category;
        },
        
        // Get documents from cache if valid
        getDocuments(mode, page, category) {
            const cache = mode === 'archived' ? this.archived : this.regular;
            
            // Check if cache is valid and matches current request
            if (
                cache.documents.length > 0 && 
                cache.page === page &&
                cache.category === category &&
                (Date.now() - cache.timestamp) < this.expiryTime
            ) {
                console.log(`Using cached ${mode} documents`);
                return cache.documents;
            }
            
            return null;
        },
        
        // Get the appropriate cache based on current mode
        getCurrentCache() {
            return archiveState.isArchiveMode ? this.archived : this.regular;
        },
        
        // Check if the current cache is still valid
        isCacheValid() {
            const cache = this.getCurrentCache();
            return cache.timestamp > 0 && 
                   (Date.now() - cache.timestamp) < archiveState.cacheLifetimeMs;
        },
        
        // Clear both caches
        clearAll() {
            this.regular = { documents: [], timestamp: 0, totalPages: 0 };
            this.archived = { documents: [], timestamp: 0, totalPages: 0 };
            console.log('Document cache cleared');
        }
    };

    // Legacy variables for backward compatibility
    let archivedDocuments = [];
    let currentPage = 1;
    let totalPages = 1;
    let filterCategory = "All";
    let isLoadingDocuments = false;

    /**
     * Initialize archive functionality
     */
    function initializeArchive() {
        console.log('Initializing archive functionality');
        
        // Make sure the archive state is reset
        archiveState.isArchiveMode = false;
        
        // Find the archive button
        const archiveBtn = document.getElementById('archive-btn');
        
        if (archiveBtn) {
            console.log('Archive button found, attaching click handler');
            
            // Make sure button doesn't have navigation attributes
            if (archiveBtn.hasAttribute('href')) {
                archiveBtn.removeAttribute('href');
            }
            
            // Make sure it's not inside a form
            const parentForm = archiveBtn.closest('form');
            if (parentForm) {
                console.warn('Archive button is inside a form, this might cause navigation issues');
                // Make sure it doesn't submit the form
                archiveBtn.setAttribute('type', 'button');
            }
            
            // Remove any existing event listeners and recreate the button
            const newArchiveBtn = archiveBtn.cloneNode(true);
            if (archiveBtn.parentNode) {
                archiveBtn.parentNode.replaceChild(newArchiveBtn, archiveBtn);
            }
            
            // Set correct initial state
            newArchiveBtn.classList.remove('active');
            newArchiveBtn.innerHTML = '<i class="fas fa-archive"></i>';
            newArchiveBtn.title = 'View Archived Documents';
            
            // Add event listener for the new button
            newArchiveBtn.addEventListener('click', function handleArchiveClick(e) {
                console.log('Archive button clicked');
                // Check if we have a dedicated archive page
                if (typeof window.USE_DEDICATED_ARCHIVE_PAGE !== 'undefined' && window.USE_DEDICATED_ARCHIVE_PAGE) {
                    // Navigate to dedicated archive page instead of toggling mode
                    window.location.href = 'archive-list.html';
                } else {
                    // Use the traditional toggle behavior
                    e.preventDefault();
                    e.stopPropagation();
                    toggleArchiveMode(e);
                    return false;
                }
            });
        } else {
            console.warn('Archive button not found. Make sure element with id "archive-btn" exists.');
        }
        
        // Check if we need to restore from archive mode based on URL parameter
        checkUrlParameters();
        
        // Add custom styles for archive mode
        addArchiveStyles();
        
        // Set a flag to prevent multiple initializations
        window.archiveInitialized = true;
        
        console.log('Archive functionality initialization complete');
    }
    
    /**
     * Check URL parameters to see if we should start in archive mode
     */
    function checkUrlParameters() {
        // Check if URL has archive=true parameter
        const url = new URL(window.location.href);
        const archiveParam = url.searchParams.get('archive');
        
        if (archiveParam === 'true' && !archiveState.isArchiveMode) {
            // Switch to archive mode if URL parameter is set
            archiveState.setArchiveMode(true);
            loadArchivedDocuments(1);
        }
    }
    
    /**
     * Update URL when toggling archive mode
     */
    function updateUrl() {
        // Create URL object from current location
        const url = new URL(window.location.href);
        
        if (archiveState.isArchiveMode) {
            url.searchParams.set('archive', 'true');
        } else {
            url.searchParams.delete('archive');
        }
        
        // Update URL without reloading page
        try {
            // Use history.pushState to avoid page reloads
            window.history.pushState({ archive: archiveState.isArchiveMode }, '', url.toString());
            console.log(`URL updated: ${url.toString()}`);
        } catch (err) {
            console.error('Error updating URL:', err);
            // If pushState fails, don't update the URL to avoid reload
        }
    }
    
    /**
     * Setup keyboard shortcuts for power users
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Alt+A to toggle archive mode
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                toggleArchiveMode();
            }
            
            // Escape key to exit archive mode if active
            if (e.key === 'Escape' && archiveState.isArchiveMode) {
                e.preventDefault();
                archiveState.setArchiveMode(false);
                if (window.documentFilters) {
                    window.documentFilters.resetFilters();
                }
                loadDocuments(1, true);
            }
        });
    }
    
    /**
     * Add custom styles for archive mode
     */
    function addArchiveStyles() {
        // Check if styles already exist
        if (document.getElementById('archive-styles')) {
            return;
        }
        
        // Create style element
        const style = document.createElement('style');
        style.id = 'archive-styles';
        style.textContent = `
            /* Archive view container */
            .archive-mode {
                background-color: #f9f9fa;
                border-radius: 8px;
                margin-bottom: 20px;
                padding: 15px;
            }
            
            .archive-banner {
                background-color: #f8f9fa;
                border-radius: 4px;
                padding: 15px;
                margin-bottom: 20px;
                border-left: 4px solid #6c757d;
            }
            
            .archive-header {
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 10px;
                text-align: center;
            }
            
            .archive-header h3 {
                margin: 0;
                color: #495057;
            }
            
            .archive-section {
                margin-bottom: 20px;
            }
            
            .archive-section-header {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 10px;
                color: #495057;
                padding-bottom: 5px;
                border-bottom: 1px solid #dee2e6;
            }
            
            /* Document cards - match main document view */
            .archive-mode .document-wrapper {
                margin-bottom: 10px;
                position: relative;
            }
            
            .archive-mode .document-card {
                display: flex;
                align-items: center;
                padding: 10px 15px;
                background-color: white;
                border-radius: 4px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
                border-left: 3px solid #dc3545; /* Red border to indicate archived status */
            }
            
            /* Style for expanded documents */
            .archive-mode .document-card.expanded {
                background-color: #f0f7ff;
                box-shadow: 0 2px 5px rgba(0,0,0,0.15);
            }
            
            .archive-mode .document-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                margin-right: 15px;
                flex-shrink: 0;
            }
            
            .archive-mode .document-icon img {
                max-width: 30px;
                max-height: 30px;
            }
            
            .archive-mode .document-info {
                flex: 1;
                min-width: 0;
                padding-right: 10px;
            }
            
            .archive-mode .document-title {
                font-size: 16px;
                font-weight: 500;
                margin: 0 0 5px 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .archive-mode .document-meta {
                font-size: 12px;
                color: #6c757d;
            }
            
            .archive-mode .toggle-indicator {
                display: inline-block;
                margin-right: 5px;
                color: #6c757d;
                transition: transform 0.2s ease;
            }
            
            .archive-mode .document-card.expanded .toggle-indicator {
                color: #0056b3;
            }
            
            .archive-mode .category-badge {
                display: inline-block;
                font-size: 11px;
                padding: 2px 5px;
                border-radius: 3px;
                background-color: #f0f0f0;
                color: #555;
                margin-top: 5px;
            }
            
            .archive-mode .category-badge.thesis {
                background-color: #e3f2fd;
                color: #0d47a1;
            }
            
            .archive-mode .category-badge.dissertation {
                background-color: #e8f5e9;
                color: #1b5e20;
            }
            
            .archive-mode .category-badge.confluence {
                background-color: #fff3e0;
                color: #e65100;
            }
            
            .archive-mode .category-badge.synergy {
                background-color: #f3e5f5;
                color: #4a148c;
            }
            
            .archive-mode .document-actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .archive-mode .action-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border-radius: 4px;
                background-color: #28a745;
                color: white;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .archive-mode .action-btn:hover {
                background-color: #218838;
            }
            
            /* Child documents styling */
            .archive-mode .children-container {
                margin-left: 30px;
                margin-bottom: 10px;
                padding: 0;
                transition: all 0.3s ease;
                max-height: 800px;
                overflow: auto;
            }
            
            .archive-mode .children-list {
                border-left: 2px solid #dee2e6;
                padding-left: 10px;
                margin-top: 5px;
            }
            
            .archive-mode .child-document-card {
                margin-bottom: 8px;
                background-color: white;
                border-radius: 4px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                transition: all 0.2s ease;
                border-left: 3px solid #dc3545; /* Red border to indicate archived status */
            }
            
            .archive-mode .child-document-card:hover {
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                background-color: #f8f9fa;
            }
            
            .archive-mode .child-document-inner {
                display: flex;
                align-items: center;
                padding: 8px 12px;
            }
            
            .archive-mode .child-document-card .document-icon {
                width: 28px;
                height: 28px;
                margin-right: 10px;
            }
            
            .archive-mode .child-document-card .document-icon img {
                max-width: 20px;
                max-height: 20px;
            }
            
            .archive-mode .child-document-card .document-title {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 3px;
            }
            
            .archive-mode .child-document-card .document-meta {
                font-size: 11px;
                color: #6c757d;
            }
            
            .archive-mode .meta-row {
                margin-bottom: 2px;
            }
            
            .archive-mode .meta-label {
                font-weight: 500;
                margin-right: 5px;
            }
            
            /* Parent information styling */
            .archive-mode .parent-info {
                margin-top: 5px;
                padding-top: 5px;
                border-top: 1px dotted #dee2e6;
            }
            
            .archive-mode .parent-label {
                color: #495057;
                font-weight: 500;
                margin-right: 5px;
            }
            
            .archive-mode .parent-title {
                color: #0056b3;
                font-weight: 500;
            }
            
            /* Loading indicator styling */
            .archive-mode .loading-indicator {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 0;
                background-color: #f8f9fa;
                border-radius: 8px;
                text-align: center;
            }
            
            .archive-mode .loading-animation {
                font-size: 24px;
                color: #6c757d;
                margin-bottom: 15px;
            }
            
            .archive-mode .loading-children {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 15px;
                color: #6c757d;
                font-size: 14px;
            }
            
            .archive-mode .loading-children i {
                margin-right: 10px;
            }
            
            .archive-mode .error-message {
                padding: 15px;
                background-color: #fff5f5;
                color: #e53e3e;
                border-radius: 4px;
                margin: 10px 0;
            }
            
            .archive-mode .retry-btn {
                background-color: #e53e3e;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                margin-top: 10px;
                cursor: pointer;
            }
            
            .archive-mode .no-children {
                padding: 15px;
                color: #6c757d;
                font-style: italic;
                text-align: center;
            }
            
            /* Collection hierarchical display styling */
            .archive-mode .collection-item {
                position: relative;
            }
            
            .archive-mode .collection-children {
                margin-left: 25px;
                padding-left: 15px;
                border-left: 2px solid #dee2e6;
            }
        `;
        
        // Add to document head
        document.head.appendChild(style);
    }

    /**
     * Toggle archive mode and update UI
     */
    function toggleArchiveMode(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        console.log('Toggling archive mode from', archiveState.isArchiveMode, 'to', !archiveState.isArchiveMode);
        
        // Show a loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
        document.body.appendChild(loadingOverlay);
        
        try {
            // Toggle the archive mode state BEFORE updating UI
            const wasInArchiveMode = archiveState.isArchiveMode;
            archiveState.isArchiveMode = !archiveState.isArchiveMode;
            
            // Log the state change for debugging
            console.log(`ARCHIVE MODE CHANGE: wasInArchiveMode=${wasInArchiveMode}, isArchiveMode=${archiveState.isArchiveMode}`);
            
            // Check if the button state is correct before making any changes
            const archiveBtn = document.getElementById('archive-btn') || 
                             document.querySelector('.archive-btn');
            if (archiveBtn) {
                console.log(`Pre-update button state: has active class=${archiveBtn.classList.contains('active')}, should have active=${archiveState.isArchiveMode}`);
            }
            
            // IMPORTANT: First update the button UI *before* replacing the category label
            // This way updateArchiveButtonUI can find the current button
            updateArchiveButtonUI();
            
            // Update page title 
            const pageTitleElement = document.querySelector('.page-title');
            if (pageTitleElement) {
                pageTitleElement.textContent = archiveState.isArchiveMode ? 'Archived Documents' : 'Documents List';
            }
            
            // Then update category label depending on mode
            const categoryLabel = document.querySelector('.category-container .label');
            if (categoryLabel) {
                if (archiveState.isArchiveMode) {
                    // Save original text if not already saved
                    if (!categoryLabel.dataset.originalText) {
                        categoryLabel.dataset.originalText = categoryLabel.textContent.trim();
                    }
                    
                    // Completely replace the label contents
                    categoryLabel.innerHTML = `
                        <span>Archived Documents</span>
                        <button id="exit-archive-btn" class="btn btn-sm btn-primary exit-archive-btn" type="button" title="Exit Archive Mode">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    
                    // Add event listener to exit button
                    setTimeout(() => {
                        const exitBtn = categoryLabel.querySelector('#exit-archive-btn');
                        if (exitBtn) {
                            exitBtn.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleArchiveMode(e);
                            });
                        }
                    }, 0);
                } else {
                    // Change back to original text with archive button
                    const originalText = categoryLabel.dataset.originalText || 'Categories';
                    
                    // Completely replace the label contents
                    categoryLabel.innerHTML = `
                        <span>${originalText}</span>
                        <button id="archive-btn" class="archive-btn" type="button" title="View Archived Documents">
                            <i class="fas fa-archive"></i>
                        </button>
                    `;
                    
                    // Reattach event listener to the archive button
                    setTimeout(() => {
                        const newArchiveBtn = categoryLabel.querySelector('#archive-btn');
                        if (newArchiveBtn) {
                            newArchiveBtn.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleArchiveMode(e);
                            });
                        }
                    }, 0);
                }
            }
            
            // Reset search input
            const searchInput = document.getElementById('search-input') || document.getElementById('search-documents');
            if (searchInput) {
                searchInput.value = '';
            }
            
            // Clear existing content
            const contentArea = document.getElementById('documents-container');
            if (contentArea) {
                contentArea.innerHTML = '';
                // Remove archive-mode class when exiting
                if (!archiveState.isArchiveMode) {
                    contentArea.classList.remove('archive-mode');
                }
            }
            
            // Clear filter selections if available
            if (window.documentFilters && typeof window.documentFilters.resetFilters === 'function' && !archiveState.isArchiveMode) {
                window.documentFilters.resetFilters();
            }
            
            // Always load the appropriate documents based on the NEW state
            if (archiveState.isArchiveMode) {
                console.log('Loading archived documents');
                loadArchivedDocuments(1);
            } else {
                console.log('Loading regular documents');
                if (typeof loadDocuments === 'function') {
                    loadDocuments(1, true);
                } else {
                    console.error('loadDocuments function not found');
                    showError('Could not load documents. Please refresh the page and try again.');
                }
            }
        } catch (error) {
            console.error('Error toggling archive mode:', error);
            showError('An error occurred while toggling archive mode. Please try again.');
        } finally {
            // Remove loading overlay after a minimum time (for UX)
            setTimeout(() => {
                if (document.body.contains(loadingOverlay)) {
                    document.body.removeChild(loadingOverlay);
                }
            }, 500);
        }
        
        return false;
    }
    
    /**
     * Update the archive button UI based on current state
     */
    function updateArchiveButtonUI() {
        console.log('Updating archive button UI, archive mode:', archiveState.isArchiveMode);
        
        // Find the archive button - could be in different places
        let archiveBtn = document.getElementById('archive-btn') || 
                           document.querySelector('.archive-btn');
        
        // If button not found, check if it's in the category header
        if (!archiveBtn) {
            const categoryHeader = document.querySelector('.category-header');
            if (categoryHeader) {
                archiveBtn = categoryHeader.querySelector('#archive-btn') || categoryHeader.querySelector('.archive-btn');
            }
        }
        
        // If still not found, check if it might be inside the label
        if (!archiveBtn) {
            const categoryLabel = document.querySelector('.category-container .label');
            if (categoryLabel) {
                archiveBtn = categoryLabel.querySelector('#archive-btn') || categoryLabel.querySelector('.archive-btn');
            }
        }
        
        // If still not found, create a new button as a fallback
        if (!archiveBtn) {
            console.warn('Archive button not found, creating a fallback button');
            const categoryLabel = document.querySelector('.category-container .label');
            
            if (categoryLabel) {
                archiveBtn = document.createElement('button');
                archiveBtn.id = 'archive-btn';
                archiveBtn.className = 'archive-btn';
                archiveBtn.type = 'button';
                archiveBtn.title = archiveState.isArchiveMode ? 'Exit Archive View' : 'View Archived Documents';
                archiveBtn.innerHTML = archiveState.isArchiveMode ? '<i class="fas fa-times"></i>' : '<i class="fas fa-archive"></i>';
                
                // Add event listener
                archiveBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleArchiveMode(e);
                });
                
                // Append to category label
                categoryLabel.appendChild(archiveBtn);
            }
        }
        
        if (archiveBtn) {
            // Check the current button state before updating
            const hasActiveClass = archiveBtn.classList.contains('active');
            console.log(`Button before update: has active class=${hasActiveClass}, should have active=${archiveState.isArchiveMode}`);
            
            // Check for mismatch between button state and archive mode
            if (hasActiveClass !== archiveState.isArchiveMode) {
                console.log('Button state does not match archive mode state - fixing');
            }
            
            console.log('Found archive button to update:', archiveBtn);
            
            if (archiveState.isArchiveMode) {
                // We are in archive mode
                archiveBtn.classList.add('active');
                archiveBtn.innerHTML = '<i class="fas fa-times"></i>';
                archiveBtn.title = 'Exit Archive View';
                
                // Add global visual indicator that we're in archive mode
                document.body.classList.add('archive-mode');
                
                // Update header
                const header = document.querySelector('.category-header');
                if (header) {
                    header.classList.add('archive-header');
                }
                
                // Remove banner creation from here - only create it in renderArchivedDocuments
            } else {
                // We are in normal mode
                archiveBtn.classList.remove('active');
                archiveBtn.innerHTML = '<i class="fas fa-archive"></i>';
                archiveBtn.title = 'View Archived Documents';
                
                // Remove archive mode indicators
                document.body.classList.remove('archive-mode');
                
                // Update header
                const header = document.querySelector('.category-header');
                if (header) {
                    header.classList.remove('archive-header');
                }
                
                // Remove banner if it exists
                const banner = document.querySelector('.archive-banner');
                if (banner) {
                    banner.remove();
                }
            }
            
            // Verify that the button state matches the archive mode after update
            const hasActiveClassAfter = archiveBtn.classList.contains('active');
            console.log(`Button after update: has active class=${hasActiveClassAfter}, should have active=${archiveState.isArchiveMode}`);
            
            // If there's still a mismatch, force the correct state
            if (hasActiveClassAfter !== archiveState.isArchiveMode) {
                console.warn('Button state still doesn\'t match archive mode after update - forcing correct state');
                if (archiveState.isArchiveMode) {
                    archiveBtn.classList.add('active');
                } else {
                    archiveBtn.classList.remove('active');
                }
            }
        } else {
            console.error('Archive button not found and could not be created - UI may be inconsistent');
        }
    }

    /**
     * Update the page title to reflect current mode
     */
    function updatePageTitle() {
        const originalTitle = document.title.replace(' - Archive', '');
        document.title = archiveState.isArchiveMode ? `${originalTitle} - Archive` : originalTitle;
    }

    /**
     * Load and render archived documents
     * @param {number} page - Page number to load
     * @param {string} category - Category filter
     */
    async function loadArchivedDocuments(page = 1, category = 'All') {
        try {
            // Show loading state
            archiveState.isLoading = true;
            updateLoadingState(true);
            
            // Reset current documents
            archiveState.documents = [];
            
            console.log(`Loading archived documents: page=${page}, category=${category}`);
            
            // Build URL with query parameters
            const timestamp = window.forceRefreshTimestamp || Date.now();
            
            // Add cache buster to force a fresh request
            let url = `/api/archived-docs?page=${page}&category=${category === 'All' ? '' : category}&_=${timestamp}`;
            
            // Add page size parameter
            url += `&limit=20`;  // Increased from 10 to 20 to show more documents at once
            
            console.log('Making API request to URL:', url);
            
            // Fetch archived documents from API
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error(`Failed to fetch archived documents: ${response.status} ${response.statusText}`);
                // Try to get more details
                try {
                    const errorData = await response.json();
                    console.error('Error details:', errorData);
                } catch (e) {
                    console.error('Could not parse error response');
                }
                
                throw new Error(`Failed to fetch archived documents: ${response.status} ${response.statusText}`);
            }
            
            // Log the raw response text for debugging
            const responseText = await response.text();
            console.log('Raw API response:', responseText);
            
            // Parse the response as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Error parsing JSON response:', e);
                throw new Error('Invalid JSON response from server');
            }
            
            console.log(`Received ${data.documents ? data.documents.length : 0} archived documents:`, data);
            
            // Show a message if no documents were found
            if (!data.documents || data.documents.length === 0) {
                const container = document.getElementById('documents-container');
                if (container) {
                    container.innerHTML = `
                        <div class="no-archived-docs">
                            <i class="fas fa-archive fa-3x"></i>
                            <p>No archived documents found.</p>
                            <p class="small">Documents that are archived will appear here.</p>
                        </div>
                    `;
                }
                updateLoadingState(false);
                archiveState.isLoading = false;
                return;
            }
            
            // Process each document to enrich with parent information if needed
            const documents = data.documents || [];
            
            // DEBUG: Check if any documents have is_compiled flag
            const hasCompiledDocs = documents.some(doc => doc.is_compiled === true);
            console.log(`Do we have any compiled documents? ${hasCompiledDocs}`);
            
            // Create debug display at top of page
            const debugInfo = document.createElement('div');
            debugInfo.style.background = '#f8f9fa';
            debugInfo.style.border = '1px solid #ddd';
            debugInfo.style.padding = '10px';
            debugInfo.style.marginBottom = '15px';
            debugInfo.style.fontSize = '12px';
            debugInfo.style.fontFamily = 'monospace';
            
            // Build debug info about documents
            let debugHtml = `<div><strong>Debug Info</strong> <small>(${documents.length} total documents)</small></div>`;
            debugHtml += '<ul style="list-style-type: none; padding-left: 10px; margin: 5px 0;">';
            
            // Count document types
            const compiledCount = documents.filter(doc => doc.is_compiled === true).length;
            const packageCount = documents.filter(doc => doc.is_package === true).length;
            const childCount = documents.filter(doc => doc.is_child === true).length;
            
            debugHtml += `<li>📊 Compiled docs: ${compiledCount}, Packages: ${packageCount}, Children: ${childCount}</li>`;
            
            // List all compiled documents
            const compiledDocsForDebug = documents.filter(doc => doc.is_compiled === true);
            if (compiledDocsForDebug.length > 0) {
                debugHtml += '<li>📁 Compiled documents:</li>';
                debugHtml += '<ul style="padding-left: 20px;">';
                compiledDocsForDebug.forEach(doc => {
                    debugHtml += `<li>ID: ${doc.id} - "${doc.title}"</li>`;
                });
                debugHtml += '</ul>';
            } else {
                debugHtml += '<li>❌ No compiled documents found!</li>';
            }
            
            debugHtml += '</ul>';
            debugInfo.innerHTML = debugHtml;
            
            // Add debug info to the DOM before the documents container
            const container = document.getElementById('documents-container');
            if (container && container.parentNode) {
                const debugContainer = document.getElementById('archive-debug-info');
                if (debugContainer) {
                    debugContainer.innerHTML = '';
                    debugContainer.appendChild(debugInfo);
                } else {
                    const newDebugContainer = document.createElement('div');
                    newDebugContainer.id = 'archive-debug-info';
                    newDebugContainer.appendChild(debugInfo);
                    container.parentNode.insertBefore(newDebugContainer, container);
                }
            }
            
            // Log each document to inspect its properties
            documents.forEach((doc, index) => {
                console.log(`Document ${index}: id=${doc.id}, title=${doc.title}, is_compiled=${doc.is_compiled}, is_package=${doc.is_package}, deleted_at=${doc.deleted_at}`);
            });
            
            // Ensure parent document flags are properly set
            documents.forEach(doc => {
                // Some backend implementations might use different properties
                // Make sure we set consistent flags for parent/compiled documents
                if (doc.is_compiled === true || doc.is_package === true) {
                    doc.is_compiled = true;
                    doc.is_package = true;
                    console.log(`Marked document as compiled/package: ${doc.id} - ${doc.title}`);
                }
            });
            
            // First pass to build a map of compiled documents
            const compiledDocsMap = {};
            for (const doc of documents) {
                if (doc.is_compiled) {
                    compiledDocsMap[doc.id] = doc;
                }
            }
            
            // Second pass to add parent info to child documents
            const enrichmentPromises = [];
            for (const doc of documents) {
                if (doc.is_child && doc.parent_compiled_id) {
                    // If we already have the parent in our list, use that info
                    if (compiledDocsMap[doc.parent_compiled_id]) {
                        doc.parent_title = compiledDocsMap[doc.parent_compiled_id].title;
                    } else {
                        // Otherwise, fetch parent info
                        enrichmentPromises.push(
                            fetchParentDocumentDetails(doc.id)
                                .then(parentInfo => {
                                    if (parentInfo) {
                                        doc.parent_title = parentInfo.parent_title;
                                    }
                                    return doc;
                                })
                                .catch(err => {
                                    console.warn(`Failed to enrich document ${doc.id} with parent info:`, err);
                                    return doc;
                                })
                        );
                    }
                }
            }
            
            // Wait for all enrichment to complete if any
            if (enrichmentPromises.length > 0) {
                console.log(`Enriching ${enrichmentPromises.length} documents with parent information...`);
                await Promise.allSettled(enrichmentPromises);
                console.log('Document enrichment complete');
            }
            
            // Update state
            archiveState.documents = documents;
            archiveState.currentPage = data.current_page || 1;
            archiveState.totalPages = data.total_pages || 1;
            
            // Cache the results
            archiveState.storeDocuments(true, documents, page, category);
            
            // Render the documents
            renderArchivedDocuments(documents, archiveState.currentPage, archiveState.totalPages);
            
            // Update URL
            updateUrl();
        } catch (error) {
            console.error('Error loading archived documents:', error);
            
            // Show error message
            const container = document.getElementById('documents-container');
            if (container) {
                container.innerHTML = `
                    <div class="archive-error">
                        <i class="fas fa-exclamation-triangle fa-3x"></i>
                        <p>Error loading archived documents</p>
                        <p class="small">${error.message}</p>
                        <button id="retry-archive-btn" class="btn btn-primary">Retry</button>
                    </div>
                `;
                
                // Add retry button handler
                const retryBtn = document.getElementById('retry-archive-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        loadArchivedDocuments(page, category);
                    });
                }
            }
        } finally {
            // Update loading state
            updateLoadingState(false);
            archiveState.isLoading = false;
        }
    }

    /**
     * Render archived documents in the container
     * @param {Array} documents - Array of archived documents
     * @param {number} currentPage - Current page number
     * @param {number} totalPages - Total number of pages
     */
    function renderArchivedDocuments(documents, currentPage, totalPages) {
        const container = document.getElementById('documents-container');
        
        // Clear container
        container.innerHTML = '';
        
        // Remove any existing archive banners to avoid duplicates
        const existingBanners = document.querySelectorAll('.archive-banner');
        existingBanners.forEach(banner => banner.remove());
        
        // Create archive mode container
        const archiveModeContainer = document.createElement('div');
        archiveModeContainer.className = 'archive-mode'; // Updated class name to match new CSS
        
        // Add archive banner
        const archiveBanner = document.createElement('div');
        archiveBanner.className = 'archive-banner';
        archiveBanner.innerHTML = `
            <div class="archive-header">
                <h3><i class="fas fa-archive"></i> Archive Mode</h3>
            </div>
            <p>You are viewing archived documents. These documents are not visible in the main document list.</p>
            `;
        archiveModeContainer.appendChild(archiveBanner);
        
        // Remove the exit button code since we already have one in the header
        
        // Create documents list container
        const documentsListContainer = document.createElement('div');
        documentsListContainer.className = 'documents-list-container';
        
        // Process documents
        if (documents.length === 0) {
            // Show empty state if no documents
            documentsListContainer.innerHTML = `
                <div class="no-archived-documents">
                    <div class="empty-state">
                        <i class="fas fa-archive"></i>
                        <h3>No Archived Documents</h3>
                        <p>There are no archived documents to display. When you archive a document, it will appear here.</p>
                    </div>
                    </div>
                `;
        } else {
            // Debug - log document data to help understand the structure
            console.log('All documents to render:', documents);
            
            // Organize documents into a hierarchy
            // 1. First identify parent/compiled documents - check both is_compiled AND is_package flags
            const parentDocuments = documents.filter(doc => doc.is_compiled === true || doc.is_package === true);
            console.log('Parent documents found:', parentDocuments.length, parentDocuments);
            
            // 2. Group child documents by parent
            const childrenMap = new Map(); // Map to store child documents by parent ID
            
            // Group child documents by parent
            documents.forEach(doc => {
                if (doc.is_child && doc.parent_compiled_id) {
                    if (!childrenMap.has(doc.parent_compiled_id)) {
                        childrenMap.set(doc.parent_compiled_id, []);
                    }
                    childrenMap.get(doc.parent_compiled_id).push(doc);
                }
            });
            
            // 3. Find standalone documents (not children and not parents)
            const standaloneDocuments = documents.filter(doc => 
                !doc.is_compiled && 
                !doc.is_package && 
                !doc.is_child && 
                !doc.parent_compiled_id
            );
            
            // Create sections
            
            // Create parent-child hierarchies section if there are parent documents
            if (parentDocuments.length > 0) {
                const hierarchySection = document.createElement('div');
                hierarchySection.className = 'archive-section';
                
                // Add section header
                const sectionHeader = document.createElement('h4');
                sectionHeader.className = 'archive-section-header';
                sectionHeader.innerHTML = `<i class="fas fa-folder"></i> Archived Document Collections (${parentDocuments.length})`;
                hierarchySection.appendChild(sectionHeader);
                
                // Create a document card for each parent document
                parentDocuments.forEach(parentDoc => {
                    try {
                        console.log(`Rendering parent document: ${parentDoc.id} - ${parentDoc.title}`);
                        // Create wrapper
                        const parentWrapper = document.createElement('div');
                        parentWrapper.className = 'document-wrapper';
                        hierarchySection.appendChild(parentWrapper);
                        
                        // Create card for parent document
                        const parentCard = createDocumentCard(parentDoc);
                        parentWrapper.appendChild(parentCard);
                        
                        // Create the children container
                        const childrenContainer = document.createElement('div');
                        childrenContainer.className = 'children-container';
                        childrenContainer.dataset.parent = parentDoc.id;
                        
                        // Initially collapsed
                        childrenContainer.style.display = 'none';
                        
                        // Get children for this parent
                        const children = childrenMap.get(parentDoc.id) || [];
                        
                        if (children.length > 0) {
                            // Pre-populate with children we already have
                            const childrenList = document.createElement('div');
                            childrenList.className = 'children-list';
                            
                            // Add each child document
                            children.forEach(childDoc => {
                                const childCard = createChildDocumentCard(childDoc);
                                childrenList.appendChild(childCard);
                            });
                            
                            childrenContainer.appendChild(childrenList);
                        } else {
                            // If no children found, show message
                            childrenContainer.innerHTML = `
                                <div class="no-children">
                                    <p>No child documents available in this collection.</p>
                                </div>
                            `;
                        }
                        
                        // Add children container to parent wrapper
                        parentWrapper.appendChild(childrenContainer);
                        
                    } catch (error) {
                        console.error(`Error rendering parent document ${parentDoc.id}:`, error);
                    }
                });
                
                documentsListContainer.appendChild(hierarchySection);
            }
            
            // Create standalone documents section if there are any
            if (standaloneDocuments.length > 0) {
                const standaloneSection = document.createElement('div');
                standaloneSection.className = 'archive-section';
                
                // Add section header
                const sectionHeader = document.createElement('h4');
                sectionHeader.className = 'archive-section-header';
                sectionHeader.innerHTML = `<i class="fas fa-file-alt"></i> Archived Individual Documents (${standaloneDocuments.length})`;
                standaloneSection.appendChild(sectionHeader);
                
                // Add each standalone document
                standaloneDocuments.forEach(doc => {
                    try {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'document-wrapper';
                        standaloneSection.appendChild(wrapper);
                        
                        const card = createDocumentCard(doc);
                        wrapper.appendChild(card);
                    } catch (error) {
                        console.error(`Error creating card for document ${doc.id}:`, error);
                    }
                });
                
                documentsListContainer.appendChild(standaloneSection);
            }
            
            // Create orphaned children section (children whose parents aren't in the archive)
            const orphanedChildren = documents.filter(doc => 
                doc.is_child && 
                doc.parent_compiled_id && 
                !parentDocuments.some(parent => parent.id === doc.parent_compiled_id)
            );
            
            if (orphanedChildren.length > 0) {
                const orphanedSection = document.createElement('div');
                orphanedSection.className = 'archive-section';
                
                // Add section header
                const sectionHeader = document.createElement('h4');
                sectionHeader.className = 'archive-section-header';
                sectionHeader.innerHTML = `<i class="fas fa-unlink"></i> Archived Child Documents (Parent Not Archived) (${orphanedChildren.length})`;
                orphanedSection.appendChild(sectionHeader);
                
                // Add each orphaned child document
                orphanedChildren.forEach(doc => {
                    try {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'document-wrapper';
                        orphanedSection.appendChild(wrapper);
                        
                        const card = createDocumentCard(doc);
                        wrapper.appendChild(card);
                    } catch (error) {
                        console.error(`Error creating card for orphaned document ${doc.id}:`, error);
                    }
                });
                
                documentsListContainer.appendChild(orphanedSection);
            }
            }
            
            // Add the documents list to the archive container
            archiveModeContainer.appendChild(documentsListContainer);
            
        // Add pagination if needed
        if (totalPages > 1) {
            const paginationContainer = document.createElement('div');
            paginationContainer.className = 'archive-pagination';
            paginationContainer.style.marginTop = '20px';
            
                renderPagination(currentPage, totalPages, paginationContainer, 'loadArchivedDocuments');
            
            archiveModeContainer.appendChild(paginationContainer);
        }
        
        // Add the archive container to the main container
        container.appendChild(archiveModeContainer);
    }

    /**
     * Create a document card element for an archived document
     * @param {Object} doc - Document object
     * @returns {HTMLElement} - Card element
     */
    function createDocumentCard(doc) {
        console.log(`Creating card for document:`, doc);
        
        // Create card container
        const card = document.createElement('div');
        card.className = 'document-card';
        card.setAttribute('data-document-id', doc.id);
        
        // Add classes based on document properties
        if (doc.is_compiled || doc.is_package) {
            card.classList.add('compiled-document');
            console.log(`This is a compiled document: ${doc.id}`);
        }
        
        card.classList.add('archived');
        
        // Get document type icon
        const iconSrc = getDocumentTypeIcon(doc.document_type || '');
        
        // Format the date when it was archived
        const archivedDate = formatDate(doc.deleted_at);
        
        // Format document authors
        let authors = 'Unknown';
        if (doc.authors) {
            if (Array.isArray(doc.authors) && doc.authors.length > 0) {
                authors = doc.authors.map(a => {
                    if (typeof a === 'string') return a;
                    return `${a.first_name || ''} ${a.last_name || ''}`.trim();
                }).join(', ');
            } else if (typeof doc.authors === 'string') {
                authors = doc.authors;
            }
        }
        
        // Check if this is a child document with a parent
        let parentInfo = '';
        if (doc.parent_compiled_id || doc.is_child) {
            const parentId = doc.parent_compiled_id;
            const parentTitle = doc.parent_title || 'Parent Document';
            
            parentInfo = `
                <div class="parent-info">
                    <span class="parent-label"><i class="fas fa-folder"></i> Part of:</span>
                    <span class="parent-title">${parentTitle}</span>
                </div>
            `;
        }
        
        // The toggle indicator for compiled documents
        const toggleIcon = (doc.is_compiled || doc.is_package) ? 
            '<span class="toggle-indicator">▶</span>' : '';
        
        // Create card inner HTML
        card.innerHTML = `
                <div class="document-icon">
                <img src="${iconSrc}" alt="Document" class="icon">
                </div>
                <div class="document-info">
                    <div class="document-header">
                    <h3 class="document-title">${toggleIcon}${doc.title || 'Untitled Document'}</h3>
                    <div class="document-meta">
                        <div class="meta-row"><span class="meta-label">Authors:</span> ${authors}</div>
                        <div class="meta-row"><span class="meta-label">Archived:</span> ${archivedDate}</div>
                        ${parentInfo}
                    </div>
                </div>
                ${doc.document_type ? `<div class="category-badge ${(doc.document_type || '').toLowerCase()}">${formatCategoryName(doc.document_type || '')}</div>` : ''}
                </div>
                <div class="document-actions">
                <button class="action-btn restore-btn" title="Restore Document" data-document-id="${doc.id}">
                        <i class="fas fa-trash-restore"></i>
                    </button>
                </div>`;
        
        // Add event listeners for compiled documents
        if (doc.is_compiled || doc.is_package) {
            // Make the title clickable to toggle
            const titleEl = card.querySelector('.document-title');
            if (titleEl) {
                titleEl.style.cursor = 'pointer';
                titleEl.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const wrapper = card.closest('.document-wrapper');
                    if (wrapper) {
                    toggleChildDocuments(doc.id, wrapper);
                    } else {
                        console.error('Could not find parent wrapper for compiled document', doc.id);
                    }
                });
            }
        }
        
        // Add restore button event listener
        const restoreBtn = card.querySelector('.restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const docId = doc.id;
                if (confirm('Are you sure you want to restore this document?')) {
                    restoreDocument(docId, doc.is_compiled || doc.is_package);
                }
            });
        }
        
        return card;
    }
    
    /**
     * Toggle the visibility of child documents
     * @param {string} parentId - ID of the parent document
     * @param {HTMLElement} wrapper - Parent card wrapper element
     */
    function toggleChildDocuments(parentId, wrapper) {
        if (!parentId || !wrapper) {
            console.error('Missing parentId or wrapper in toggleChildDocuments');
            return;
        }
        
        const card = wrapper.querySelector('.document-card');
        if (!card) {
            console.error('Could not find document card in wrapper');
            return;
        }
        
        console.log(`Toggling child documents for parent ${parentId}`);
        
        // Find existing children container or create one
        let childrenContainer = wrapper.querySelector('.children-container');
        
        if (!childrenContainer) {
            console.error('Could not find children container in wrapper - this should not happen');
            return;
        }
        
        // Toggle visibility
        const isVisible = childrenContainer.style.display !== 'none';
        const indicator = card.querySelector('.toggle-indicator');
        
        if (isVisible) {
            // Hide it
            childrenContainer.style.display = 'none';
            if (indicator) {
                indicator.textContent = '▶'; // Change to right arrow
            }
            card.classList.remove('expanded');
        } else {
            // Show it
            childrenContainer.style.display = 'block';
            if (indicator) {
                indicator.textContent = '▼'; // Change to down arrow
            }
            card.classList.add('expanded');
            
            // Check if we need to (re)load the child documents
            const isEmpty = !childrenContainer.querySelector('.children-list') && 
                            !childrenContainer.querySelector('.loading-children');
            
            if (isEmpty) {
                // Show loading indicator
                childrenContainer.innerHTML = '<div class="loading-children"><i class="fas fa-spinner fa-spin"></i> Loading contents...</div>';
                
                // Load the child documents
                fetchArchivedChildDocuments(parentId, childrenContainer);
            }
        }
    }

    /**
     * Get the icon class for a compiled document based on its category
     * @param {string} category - Document category
     * @returns {string} - Icon class
     */
    function getCompiledDocumentIcon(category) {
        if (!category) return 'fas fa-file-alt';
        
        const normalizedCategory = category.toLowerCase();
        
        switch(normalizedCategory) {
            case 'confluence':
                return 'fas fa-book text-warning';
            case 'thesis':
                return 'fas fa-graduation-cap text-primary';
            case 'dissertation':
                return 'fas fa-scroll text-success';
            case 'synergy':
                return 'fas fa-handshake text-info';
            default:
                return 'fas fa-file-alt';
        }
    }

    /**
     * Get the proper document type icon for display
     * @param {string} documentType - Document type string
     * @returns {string} - Icon image path
     */
    function getDocumentTypeIcon(documentType = '') {
        // Convert to lowercase for case-insensitive matching
        const type = documentType.toLowerCase();
        
        // Map document types to icon paths
        const iconMap = {
            'thesis': 'icons/Category-icons/thesis.png',
            'dissertation': 'icons/Category-icons/dissertation.png',
            'confluence': 'icons/Category-icons/confluence.png',
            'synergy': 'icons/Category-icons/synergy.png'
        };
        
        // Return the appropriate icon or the default
        return iconMap[type] || 'icons/Category-icons/default_category_icon.png';
    }

    /**
     * Format category name for display
     * @param {string} category - Raw category/document type
     * @returns {string} - Formatted category name
     */
    function formatCategoryName(category = '') {
        if (!category) return 'Uncategorized';
        
        // Convert to title case (first letter uppercase, rest lowercase)
        let formatted = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        
        // Handle synergy (rename to Departmental)
        if (formatted === 'Synergy') {
            formatted = 'Departmental';
        }
        
        return formatted;
    }

    /**
     * Format a date string in a user-friendly way
     * @param {string|Date|null} dateString - Date to format
     * @returns {string} - Formatted date string
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            
            // Check if the date is valid
            if (isNaN(date.getTime())) {
                return '';
            }
            
            // Get date components
            const day = date.getDate();
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            
            // Format as "15 Jun 2023"
            return `${day} ${month} ${year}`;
        } catch (e) {
            console.error('Error formatting date:', e);
            return '';
        }
    }

    /**
     * Restore a document from archive
     */
    function restoreDocument(docId, isParent = false, childIds = []) {
        console.log('Restoring document', docId, 'isParent:', isParent, 'childIds:', childIds);
        
        // Show confirmation dialog
        if (!confirm('Are you sure you want to restore this document?')) {
            return;
        }
        
        // Show loading indicator on the restore button
        const restoreButton = document.querySelector(`.btn-restore[data-id="${docId}"]`);
        if (restoreButton) {
            const originalText = restoreButton.innerHTML;
            restoreButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restoring...';
            restoreButton.disabled = true;
        }
        
        // Prepare data for the request
        const data = {
            document_id: docId,
            is_parent: isParent
        };
        
        // Add child IDs if provided
        if (childIds && childIds.length > 0) {
            data.child_ids = childIds;
        }
        
        // Send request to restore the document
        fetch('/admin/api/documents/restore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to restore document');
            }
            return response.json();
        })
        .then(data => {
            console.log('Document restored successfully', data);
            
            // Remove the document card from the archive view
            const documentCard = document.querySelector(`.document-card[data-id="${docId}"]`);
            if (documentCard) {
                // Add a success message before removing
                const successMessage = document.createElement('div');
                successMessage.className = 'alert alert-success archive-success';
                successMessage.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    Document restored successfully! It will now appear in the regular document list.
                `;
                documentCard.parentNode.insertBefore(successMessage, documentCard);
                
                // Animate the card removal
                documentCard.style.transition = 'all 0.5s ease';
                documentCard.style.opacity = '0';
                documentCard.style.height = '0';
                documentCard.style.marginBottom = '0';
                
                // Remove the card after animation completes
                setTimeout(() => {
                    documentCard.remove();
                    
                    // Check if we still have archived documents
                    checkRemainingArchived();
                    
                    // Remove success message after a delay
                    setTimeout(() => {
                        successMessage.style.opacity = '0';
                        setTimeout(() => successMessage.remove(), 500);
                    }, 3000);
                }, 500);
            }
        })
        .catch(error => {
            console.error('Error restoring document:', error);
            
            // Reset the restore button
            if (restoreButton) {
                restoreButton.innerHTML = '<i class="fas fa-undo"></i> Retry';
                restoreButton.disabled = false;
            }
            
            // Show error message
            showToast('Failed to restore document. Please try again.');
        });
    }

    /**
     * Check if there are any archived documents remaining
     * If not, exit archive mode
     */
    function checkRemainingArchived() {
        const remainingCards = document.querySelectorAll('.document-card');
        if (remainingCards.length === 0) {
            console.log('No more archived documents, exiting archive mode');
            
            // Show message that we're exiting archive mode
            const container = document.getElementById('documents-container');
            if (container) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'alert alert-info archive-empty';
                emptyMessage.innerHTML = `
                    <i class="fas fa-info-circle"></i>
                    No more archived documents. Returning to document list...
                `;
                container.appendChild(emptyMessage);
                
                // Wait a moment before exiting archive mode
                setTimeout(() => {
                    // Exit archive mode
                    toggleArchiveMode();
                }, 2000);
            }
        }
    }

    /**
     * Archives a document by marking it with deleted_at
     * Returns a Promise that resolves when the operation completes
     * @param {number} documentId - ID of the document to archive
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async function archiveDocument(documentId) {
        if (!documentId) {
            console.error('Cannot archive document: No document ID provided');
            showToast('Failed to archive: Missing document ID', 'error');
            return Promise.reject(new Error('No document ID provided'));
        }
        
        console.log(`Archiving document with ID: ${documentId}`);
        
        try {
            // Show loading indication
            showToast(`Archiving document...`, 'info');
            
            // First check if this document is already archived (to prevent double-archiving)
            const verifyResponse = await fetch(`/api/documents/${documentId}`);
            
            if (!verifyResponse.ok) {
                console.error(`Error verifying document ${documentId}: ${verifyResponse.status} ${verifyResponse.statusText}`);
                showToast('Failed to verify document status', 'error');
                return Promise.reject(new Error(`Failed to verify document status: ${verifyResponse.statusText}`));
            }
            
            const documentData = await verifyResponse.json();
            
            if (documentData.deleted_at) {
                console.log(`Document ${documentId} is already archived with deleted_at=${documentData.deleted_at}`);
                showToast('Document is already archived', 'warning');
                // Return success since the document is already in the desired state
                return true;
            }
            
            // Make the DELETE request to the soft-delete endpoint
            const response = await fetch(`/api/documents/${documentId}/soft-delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            // Check for HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Archive operation failed:', errorData.error || response.statusText);
                showToast(`Failed to archive document: ${errorData.error || response.statusText}`, 'error');
                return Promise.reject(new Error(`Failed to archive document: ${errorData.error || response.statusText}`));
            }
            
            // Parse the response
            const result = await response.json();
            console.log('Archive operation successful:', result);
            
            // If this is a compiled document with children, log details
            if (result.is_compiled && result.child_documents && result.child_documents.length) {
                console.log(`Archived compiled document with ${result.child_documents.length} child documents`);
            }
            
            // Verify the document is now properly archived
            const verifyArchiveResponse = await fetch(`/api/documents/${documentId}`);
            
            if (verifyArchiveResponse.ok) {
                const verifiedDoc = await verifyArchiveResponse.json();
                if (!verifiedDoc.deleted_at) {
                    console.warn(`Verification failed: Document ${documentId} does not have deleted_at set after archive operation`);
                    // We'll still report success since the server reported success
                } else {
                    console.log(`Verified: Document ${documentId} now has deleted_at=${verifiedDoc.deleted_at}`);
                }
            }
            
            // Add a timestamp to force cache refresh when loading documents
            window.forceRefreshTimestamp = Date.now();
            
            // Show success message
            showToast(
                result.is_compiled 
                    ? `Archived document package with ${result.child_count || 0} item${result.child_count !== 1 ? 's' : ''}` 
                    : 'Document archived successfully', 
                'success'
            );
            
            // If we're in archive mode, refresh the archive list
            if (window.documentArchive.isArchiveMode()) {
                loadArchivedDocuments(window.documentArchive.getCurrentCache().page || 1);
            } else {
                // Otherwise, force refresh the regular document list (in document-list.js)
                if (window.documentList && typeof window.documentList.refreshDocumentList === 'function') {
                    console.log('Forcing document list refresh after archive operation');
                    setTimeout(() => {
                        window.documentList.refreshDocumentList(true);
                    }, 300);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error in archive operation:', error);
            showToast(`Archive failed: ${error.message}`, 'error');
            return Promise.reject(error);
        }
    }

    /**
     * Fetch archived child documents for a compiled package
     * @param {string} parentId - ID of the parent compiled document
     * @param {HTMLElement} containerElement - Container to render children in
     */
    async function fetchArchivedChildDocuments(parentId, containerElement) {
        if (!parentId || !containerElement) {
            console.error('Missing required parameters for fetchArchivedChildDocuments');
            return;
        }
        
        try {
            // Show loading indicator
            containerElement.innerHTML = '<div class="loading-children"><i class="fas fa-spinner fa-spin"></i> Loading contents...</div>';
            
            // Fetch the parent document first to get its title
            let parentTitle = 'Parent Document';
            try {
                const parentResponse = await fetch(`/api/documents/${parentId}`);
                if (parentResponse.ok) {
                    const parentData = await parentResponse.json();
                    if (parentData && parentData.title) {
                        parentTitle = parentData.title;
                        console.log(`Got parent document title: "${parentTitle}"`);
                    }
                }
            } catch (err) {
                console.warn('Could not fetch parent document details:', err);
            }
            
            // Fetch the child documents
            const response = await fetch(`/api/documents/${parentId}/archived-children`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch child documents: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const childDocuments = data.documents || [];
            
            console.log(`Received ${childDocuments.length || 0} child documents for package ${parentId}`);
            
            // Clear container
            containerElement.innerHTML = '';
            
            // Check if we have child documents
            if (!childDocuments || childDocuments.length === 0) {
                containerElement.innerHTML = `
                    <div class="no-children">
                        <p>No documents found in this package.</p>
                    </div>
                `;
                return;
            }
            
            // Create a wrapper for the child documents
            const childrenWrapper = document.createElement('div');
            childrenWrapper.className = 'children-wrapper';
            childrenWrapper.style.width = '100%';
            childrenWrapper.style.padding = '10px 0';
            containerElement.appendChild(childrenWrapper);
            
            // Loop through and add each child document, including parent info
            childDocuments.forEach(child => {
                // Add parent document information to each child document
                child.parent_id = parentId;
                child.parent_title = parentTitle;
                
                // Create and add the child card
                const childCard = createChildDocumentCard(child);
                childrenWrapper.appendChild(childCard);
            });
            
        } catch (error) {
            console.error('Error fetching child documents:', error);
            containerElement.innerHTML = `
                <div class="error-message">
                    <p>Failed to load package contents: ${error.message}</p>
                    <button class="retry-btn">
                        <i class="fas fa-sync"></i> Try Again
                    </button>
                </div>
            `;
            
            // Add retry button functionality
            const retryBtn = containerElement.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', function() {
                    fetchArchivedChildDocuments(parentId, containerElement);
                });
            }
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
        
        // Format authors
        let authors = 'Unknown Author';
        if (child.authors) {
            if (Array.isArray(child.authors) && child.authors.length > 0) {
                authors = child.authors.map(a => {
                    if (typeof a === 'string') return a;
                    return `${a.first_name || ''} ${a.last_name || ''}`.trim();
                }).join(', ');
            } else if (typeof child.authors === 'string') {
                authors = child.authors;
            }
        }
        
        // Format date if available
        const archivedDate = formatDate(child.deleted_at) || 'Unknown date';
        
        // Get document type icon
        const iconSrc = getDocumentTypeIcon(child.document_type || child.category || 'default');
        
        // Create a more simplified layout based on the image
        childCard.innerHTML = `
            <div class="child-document-inner">
                <div class="document-icon">
                    <img src="${iconSrc}" alt="Document" class="small-icon">
                </div>
                <div class="document-info">
                    <h4 class="document-title">${child.title || 'Untitled Document'}</h4>
                    <div class="document-meta">
                    <span>Authors: ${authors}</span>
                </div>
            </div>
                <div class="document-actions">
                    <button class="action-btn restore-btn" title="Restore Document" data-document-id="${child.id}">
                        <i class="fas fa-trash-restore"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add restore button functionality
        const restoreBtn = childCard.querySelector('.restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm(`Are you sure you want to restore this document: "${child.title}"?`)) {
                    restoreDocument(child.id);
                }
            });
        }
        
        return childCard;
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast (success, error, warning, info)
     */
    function showToast(message, type = 'success') {
        // Check if toastr is available (common toast library)
        if (typeof toastr !== 'undefined') {
            toastr[type](message);
            return;
        }
        
        // If toastr is not available, create our own implementation
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-header">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                              type === 'error' ? 'fa-exclamation-circle' : 
                              type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                <strong class="mr-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="ml-2 mb-1 close" data-dismiss="toast">&times;</button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        // Check if a toast container exists
        let toastContainer = document.querySelector('.toast-container');
        
        // If not, create one
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Add the toast to the container
        toastContainer.appendChild(toast);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            toast.classList.add('showing');
            setTimeout(() => {
                toast.classList.add('show');
            }, 10);
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
        
        // Add click handler to close button
        const closeButton = toast.querySelector('.close');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            });
        }
    }
    
    /**
     * Render pagination controls
     * @param {number} currentPage - Current page number
     * @param {number} totalPages - Total number of pages
     * @param {HTMLElement} container - Container element for pagination
     * @param {string} callbackFunctionName - Name of the function to call when a page is clicked
     */
    function renderPagination(currentPage, totalPages, container, callbackFunctionName) {
        // Clear container
        container.innerHTML = '';
        
        // Create pagination element
        const pagination = document.createElement('nav');
        pagination.setAttribute('aria-label', 'Document pagination');
        
        const ul = document.createElement('ul');
        ul.className = 'pagination';
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link';
        prevLink.href = '#';
        prevLink.setAttribute('aria-label', 'Previous');
        prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
        
        if (currentPage > 1) {
            prevLink.addEventListener('click', function(e) {
                e.preventDefault();
                window[callbackFunctionName](currentPage - 1);
            });
        }
        
        prevLi.appendChild(prevLink);
        ul.appendChild(prevLi);
        
        // Determine which page numbers to show
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        // Adjust if we're near the end
        if (endPage - startPage < 4 && startPage > 1) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
            
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = i;
            
            if (i !== currentPage) {
                pageLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    window[callbackFunctionName](i);
                });
            }
            
            pageLi.appendChild(pageLink);
            ul.appendChild(pageLi);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link';
        nextLink.href = '#';
        nextLink.setAttribute('aria-label', 'Next');
        nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
        
        if (currentPage < totalPages) {
            nextLink.addEventListener('click', function(e) {
                e.preventDefault();
                window[callbackFunctionName](currentPage + 1);
            });
        }
        
        nextLi.appendChild(nextLink);
        ul.appendChild(nextLi);
        
        // Add pagination to container
        pagination.appendChild(ul);
        container.appendChild(pagination);
    }

    /**
     * Fetch parent document details for a child document
     * @param {number} childId - Child document ID
     * @returns {Promise<Object|null>} - Parent document details or null
     */
    async function fetchParentDocumentDetails(childId) {
        if (!childId) {
            console.error('Cannot fetch parent: No child document ID provided');
            return null;
        }
        
        try {
            // Check if we have the parent ID in the cache (from previous API responses)
            if (archiveState.childParentMap && archiveState.childParentMap[childId]) {
                console.log(`Using cached parent info for child ${childId}`);
                return archiveState.childParentMap[childId];
            }
            
            console.log(`Fetching parent document details for child ${childId}`);
            const response = await fetch(`/api/documents/${childId}/parent-info`);
            
            if (!response.ok) {
                console.warn(`Failed to fetch parent info: ${response.status} ${response.statusText}`);
                return null;
            }
            
            const data = await response.json();
            console.log(`Got parent details for child ${childId}:`, data);
            
            // Cache the parent details
            if (!archiveState.childParentMap) {
                archiveState.childParentMap = {};
            }
            
            if (data && data.parent_id) {
                archiveState.childParentMap[childId] = data;
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching parent document details:', error);
            return null;
        }
    }

    /**
     * Update the loading state in the UI
     * @param {boolean} isLoading - Whether the system is in a loading state
     */
    function updateLoadingState(isLoading) {
        const container = document.getElementById('documents-container');
        if (!container) return;
        
        // Show/hide loading indicator
        if (isLoading) {
            // Show loading indicator
            const loadingEl = document.createElement('div');
            loadingEl.className = 'loading-indicator';
            loadingEl.innerHTML = `
                <div class="loading-animation">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Loading archived documents...</p>
            `;
            
            // Clear container and add loading indicator
            container.innerHTML = '';
            container.appendChild(loadingEl);
        } else {
            // Remove loading indicator if it exists
            const loadingEl = container.querySelector('.loading-indicator');
            if (loadingEl) {
                loadingEl.remove();
            }
        }
    }

    // Public API
    return {
        // Archive mode state
        isArchiveMode: function() {
            return archiveState.isArchiveMode;
        },
        setArchiveMode: archiveState.setArchiveMode,
        toggleArchiveMode,
        
        // Core document operations
        archiveDocument,
        restoreDocument,
        
        // Document display functions
        loadArchivedDocuments,
        getCurrentCache: function() {
            return {
                isArchiveMode: archiveState.isArchiveMode,
                documents: archiveState.documents,
                page: archiveState.currentPage,
                totalPages: archiveState.totalPages,
                category: archiveState.category
            };
        },
        
        // Parent information functions
        getParentInfo: fetchParentDocumentDetails,
        
        // Initialization
        initializeArchive: initializeArchive
    };
})();

// Properly initialize archive functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if initialization has already happened to prevent duplicates
    if (window.archiveInitialized) {
        console.log('Archive functionality already initialized, skipping');
        return;
    }
    
    if (typeof initializeArchive === 'function') {
        initializeArchive();
        console.log('Archive functionality initialized');
    } else if (window.documentArchive && typeof window.documentArchive.initializeArchive === 'function') {
        window.documentArchive.initializeArchive();
        console.log('Archive functionality initialized through namespace');
    } else {
        console.error('Archive initialization function not found');
    }
    
    window.archiveInitialized = true;
});
