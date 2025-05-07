/**
 * Document edit functionality
 * Handles editing of existing documents
 */

console.log('Document edit module loaded');

// Add toast notification styles
(function() {
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            max-width: 250px;
            font-size: 14px;
            padding: 10px 15px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            opacity: 0;
            transform: translateY(10px);
            animation: slide-in-toast 0.3s forwards;
        }
        
        @keyframes slide-in-toast {
            to { opacity: 1; transform: translateY(0); }
        }
        
        .toast-success {
            background-color: #e8f5e9;
            color: #2e7d32;
            border-left: 3px solid #2e7d32;
        }
        
        .toast-error {
            background-color: #ffebee;
            color: #c62828;
            border-left: 3px solid #c62828;
        }
        
        /* Success Popup Styles */
        .success-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.3);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }
        
        .success-popup {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            padding: 25px 30px;
            text-align: center;
            max-width: 300px;
            animation: popup-appear 0.3s ease-out;
        }
        
        @keyframes popup-appear {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
        }
        
        .success-popup-icon {
            color: #2e7d32;
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .success-popup-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #333;
        }
        
        .success-popup-message {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
        }
        
        .success-popup-button {
            background-color: #2e7d32;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .success-popup-button:hover {
            background-color: #1b5e20;
        }
        
        /* Dropdown Styles */
        .dropdown-list {
            position: absolute;
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            width: 100%;
            max-height: 250px;
            overflow-y: auto;
            z-index: 1000;
            margin-top: 2px;
        }
        
        .dropdown-item {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s;
        }
        
        .dropdown-item:hover {
            background-color: #f5f5f5;
        }
        
        .dropdown-item .item-name {
            font-weight: 500;
            margin-bottom: 2px;
        }
        
        .dropdown-item .item-detail {
            font-size: 12px;
            color: #666;
        }
        
        .dropdown-item .item-detail-small {
            font-size: 11px;
            color: #888;
        }
        
        .dropdown-item.no-results,
        .dropdown-item.error,
        .dropdown-item.loading {
            color: #888;
            font-style: italic;
        }
        
        .dropdown-item.create-new {
            color: #2e7d32;
            font-weight: 500;
        }
        
        .dropdown-item.create-new i {
            margin-right: 5px;
        }
        
        /* Selected items styles */
        .selected-author,
        .selected-topic {
            display: inline-block;
            background-color: #e3f2fd;
            color: #1565c0;
            padding: 4px 8px;
            border-radius: 4px;
            margin: 4px;
            font-size: 14px;
        }
        
        .selected-topic {
            background-color: #e8f5e9;
            color: #2e7d32;
        }
        
        .remove-author,
        .remove-topic {
            margin-left: 5px;
            cursor: pointer;
            font-weight: bold;
        }
        
        .remove-author:hover,
        .remove-topic:hover {
            color: #f44336;
        }
    `;
    document.head.appendChild(style);
})();

// Function to show a toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}

// Document edit module
window.documentEdit = {
    // Function to show the edit modal for a single document
    showEditModal: function(documentId) {
        console.log(`Showing edit modal for document ID: ${documentId}`);
        
        // First, load the modals HTML if not already loaded
        this.loadModalHTML().then(() => {
            // Get the modal elements
            const modal = document.getElementById('edit-single-document-modal');
            if (!modal) {
                console.error('Edit modal not found in DOM');
                showToast('Error loading edit modal. Please refresh the page and try again.', 'error');
                return;
            }
            
            // Show a loading indicator
            showToast('Loading document data...', 'info');
            
            // Set the document ID in the form
            document.getElementById('edit-single-document-id').value = documentId;
            
            // Display the modal first with a loading state
            modal.style.display = 'flex';
            
            // Add a loading indicator to the form
            const form = modal.querySelector('.left-panel');
            if (form) {
                const loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'loading-overlay';
                loadingOverlay.innerHTML = '<div class="spinner"><i class="fas fa-spinner fa-spin"></i></div><div class="loading-text">Loading document data...</div>';
                form.appendChild(loadingOverlay);
            }
            
            // Fetch document data and populate the form
            this.fetchDocumentData(documentId, false)
                .then(data => {
                    // Remove loading overlay
                    const loadingOverlay = modal.querySelector('.loading-overlay');
                    if (loadingOverlay) {
                        loadingOverlay.remove();
                    }
                    
                    this.populateEditForm(data);
                })
                .catch(error => {
                    console.error('Error fetching document data:', error);
                    showToast('Error loading document data. Please try again.', 'error');
                    
                    // Remove loading overlay
                    const loadingOverlay = modal.querySelector('.loading-overlay');
                    if (loadingOverlay) {
                        loadingOverlay.remove();
                    }
                    
                    // Show error in the form
                    const formContent = modal.querySelector('.left-panel');
                    if (formContent) {
                        formContent.innerHTML = `
                            <div class="error-container">
                                <i class="fas fa-exclamation-triangle"></i>
                                <h3>Error Loading Document</h3>
                                <p>${error.message}</p>
                                <button class="btn-secondary cancel-edit-btn">Close</button>
                            </div>
                        `;
                        
                        const closeBtn = formContent.querySelector('.cancel-edit-btn');
                        if (closeBtn) {
                            closeBtn.addEventListener('click', () => {
                                modal.style.display = 'none';
                            });
                        }
                    }
                });
        }).catch(error => {
            console.error('Error loading modal HTML:', error);
            showToast('Error loading edit modal. Please refresh the page and try again.', 'error');
        });
    },
    
    // Function to show the edit modal for a compiled document
    showCompiledEditModal: function(documentId) {
        console.log(`Showing edit modal for compiled document ID: ${documentId}`);
        
        // First, load the modals HTML if not already loaded
        this.loadModalHTML().then(() => {
            // Get the modal elements
            const modal = document.getElementById('edit-compiled-document-modal');
            if (!modal) {
                console.error('Compiled edit modal not found in DOM');
                showToast('Error loading edit modal. Please refresh the page and try again.', 'error');
                return;
            }
            
            // Show a loading indicator
            showToast('Loading compilation data...', 'info');
            
            // Set the document ID in the form
            document.getElementById('edit-compiled-document-id').value = documentId;
            
            // Display the modal first with a loading state
            modal.style.display = 'flex';
            
            // Add a loading indicator to the form
            const form = modal.querySelector('.left-panel');
            if (form) {
                const loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'loading-overlay';
                loadingOverlay.innerHTML = '<div class="spinner"><i class="fas fa-spinner fa-spin"></i></div><div class="loading-text">Loading compilation data...</div>';
                form.appendChild(loadingOverlay);
            }
            
            // Fetch compiled document data and populate the form
            this.fetchDocumentData(documentId, true)
                .then(data => {
                    // Remove loading overlay
                    const loadingOverlay = modal.querySelector('.loading-overlay');
                    if (loadingOverlay) {
                        loadingOverlay.remove();
                    }
                    
                    this.populateCompiledEditForm(data);
                })
                .catch(error => {
                    console.error('Error fetching compiled document data:', error);
                    showToast('Error loading compilation data. Please try again.', 'error');
                    
                    // Remove loading overlay
                    const loadingOverlay = modal.querySelector('.loading-overlay');
                    if (loadingOverlay) {
                        loadingOverlay.remove();
                    }
                    
                    // Show error in the form
                    const formContent = modal.querySelector('.left-panel');
                    if (formContent) {
                        formContent.innerHTML = `
                            <div class="error-container">
                                <i class="fas fa-exclamation-triangle"></i>
                                <h3>Error Loading Compilation</h3>
                                <p>${error.message}</p>
                                <button class="btn-secondary cancel-edit-btn">Close</button>
                            </div>
                        `;
                        
                        const closeBtn = formContent.querySelector('.cancel-edit-btn');
                        if (closeBtn) {
                            closeBtn.addEventListener('click', () => {
                                modal.style.display = 'none';
                            });
                        }
                    }
                });
        }).catch(error => {
            console.error('Error loading modal HTML:', error);
            showToast('Error loading edit modal. Please refresh the page and try again.', 'error');
        });
    },
    
    // Load the modal HTML if not already present
    loadModalHTML: function() {
        return new Promise((resolve, reject) => {
            // Check if modals are already loaded
            if (document.getElementById('edit-single-document-modal') && 
                document.getElementById('edit-compiled-document-modal') &&
                document.getElementById('pdf-viewer-modal')) {
                console.log('Modals already loaded in the DOM, re-initializing event listeners');
                this.setupModalEventListeners();
                resolve();
                return;
            }
            
            console.log('Loading edit modal HTML');
            
            // Load the modal HTML
            fetch('/admin/Components/modals/edit-document-modals.html')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load modals: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    console.log('Modal HTML loaded successfully, length:', html.length);
                    
                    // Create a temporary div to hold the HTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    
                    // Extract the modals from the HTML
                    const modals = [
                        tempDiv.querySelector('#edit-single-document-modal'),
                        tempDiv.querySelector('#edit-compiled-document-modal'),
                        tempDiv.querySelector('#select-child-document-modal'),
                        tempDiv.querySelector('#pdf-viewer-modal')
                    ];
                    
                    // Log what we found to help with debugging
                    console.log('Found modals:', 
                        modals[0] ? 'single-edit ✓' : 'single-edit ✗',
                        modals[1] ? 'compiled-edit ✓' : 'compiled-edit ✗',
                        modals[2] ? 'select-child ✓' : 'select-child ✗',
                        modals[3] ? 'pdf-viewer ✓' : 'pdf-viewer ✗'
                    );
                    
                    // Check if we found all the required modals
                    if (!modals[0] || !modals[1] || !modals[3]) {
                        console.error('Some required modals were not found in the loaded HTML');
                        // Try to extract the entire body contents as a fallback
                        const bodyContent = tempDiv.querySelector('body');
                        if (bodyContent) {
                            console.log('Attempting to use entire body content as fallback');
                            document.body.insertAdjacentHTML('beforeend', bodyContent.innerHTML);
                        } else {
                            console.error('No body content found in the HTML');
                            throw new Error('Required modals not found in HTML');
                        }
                    } else {
                        // Append the modals to the document body
                        modals.forEach(modal => {
                            if (modal) {
                                // Check if a modal with this ID already exists
                                const existingModal = document.getElementById(modal.id);
                                if (existingModal) {
                                    console.log(`Modal with ID ${modal.id} already exists, replacing`);
                                    existingModal.parentNode.replaceChild(modal, existingModal);
                                } else {
                                    document.body.appendChild(modal);
                                }
                            }
                        });
                    }
                    
                    // Set up event listeners for the modals
                    this.setupModalEventListeners();
                    
                    // Do a final check that everything loaded correctly
                    setTimeout(() => {
                        // Double-check that all required modals are in the DOM
                        const singleModal = document.getElementById('edit-single-document-modal');
                        const compiledModal = document.getElementById('edit-compiled-document-modal');
                        const pdfModal = document.getElementById('pdf-viewer-modal');
                        
                        if (!singleModal || !compiledModal || !pdfModal) {
                            console.error('Modals still missing after load:', 
                                !singleModal ? 'single-edit' : '',
                                !compiledModal ? 'compiled-edit' : '',
                                !pdfModal ? 'pdf-viewer' : ''
                            );
                            
                            // Try one more time with direct HTML insertion if needed
                            if (!singleModal || !compiledModal || !pdfModal) {
                                console.log('Attempting emergency direct HTML insertion');
                                this.insertEmergencyModals();
                            }
                        }
                    }, 100);
                    
                    resolve();
                })
                .catch(error => {
                    console.error('Error loading modals:', error);
                    reject(error);
                });
        });
    },
    
    // Emergency function to directly insert the most essential modal HTML
    insertEmergencyModals: function() {
        // Check which modals are missing
        const singleModal = document.getElementById('edit-single-document-modal');
        const compiledModal = document.getElementById('edit-compiled-document-modal');
        const pdfModal = document.getElementById('pdf-viewer-modal');
        
        // If PDF viewer modal is missing, insert a basic version
        if (!pdfModal) {
            const pdfModalHtml = `
                <div id="pdf-viewer-modal" style="display: none;">
                    <div class="pdf-modal-content">
                        <div class="pdf-modal-header">
                            <h3 id="pdf-viewer-title">Document Preview</h3>
                            <button id="close-pdf-btn" class="close-button">×</button>
                        </div>
                        <div class="pdf-container">
                            <iframe id="pdf-iframe" src=""></iframe>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', pdfModalHtml);
            console.log('Emergency PDF viewer modal inserted');
        }
        
        // Re-setup event listeners
        this.setupModalEventListeners();
    },
    
    // Set up event listeners for modals
    setupModalEventListeners: function() {
        console.log('Setting up modal event listeners');
        
        // Single document modal
        const singleModal = document.getElementById('edit-single-document-modal');
        if (singleModal) {
            console.log('Found single document modal');
            
            // Cancel button - try multiple selector approaches to ensure we find all buttons
            const cancelButtons = singleModal.querySelectorAll('.cancel-edit-btn, button.btn-secondary');
            console.log(`Found ${cancelButtons.length} cancel buttons in single document modal`);
            
            cancelButtons.forEach(button => {
                // Remove any existing event listeners to prevent duplicates
                button.removeEventListener('click', () => singleModal.style.display = 'none');
                
                // Add the event listener
                button.addEventListener('click', () => {
                    console.log('Cancel button clicked in single document modal');
                    singleModal.style.display = 'none';
                });
                
                console.log('Added click event listener to cancel button:', button);
            });
            
            // Form submission
            const form = document.getElementById('edit-single-document-form');
            if (form) {
                // Remove any existing listeners to prevent duplicates
                const oldListener = form._editSubmitListener;
                if (oldListener) {
                    form.removeEventListener('submit', oldListener);
                }
                
                // Create new listener
                const submitListener = (e) => {
                    e.preventDefault();
                    this.saveDocument(new FormData(form));
                };
                
                // Store reference to listener for future removal
                form._editSubmitListener = submitListener;
                
                // Add the event listener
                form.addEventListener('submit', submitListener);
            }
            
            // File upload handling
            const fileInput = document.getElementById('edit-single-document-file');
            const fileIndicator = document.getElementById('edit-single-document-file-indicator');
            if (fileInput && fileIndicator) {
                // Remove any existing listeners to prevent duplicates
                const oldListener = fileInput._editChangeListener;
                if (oldListener) {
                    fileInput.removeEventListener('change', oldListener);
                }
                
                // Create new listener
                const changeListener = (e) => {
                    if (fileInput.files.length > 0) {
                        fileIndicator.textContent = fileInput.files[0].name;
                    } else {
                        fileIndicator.textContent = '';
                    }
                };
                
                // Store reference to listener for future removal
                fileInput._editChangeListener = changeListener;
                
                // Add the event listener
                fileInput.addEventListener('change', changeListener);
            }
            
            // Initialize author search input
            const authorSearchInput = document.getElementById('edit-single-document-author-search');
            if (authorSearchInput && typeof window.initAuthorSearchInput === 'function') {
                this.initializeAuthorSearch(authorSearchInput, 'edit-single-document-selected-authors');
            } else {
                console.warn('Author search input or initialization function not found');
            }
            
            // Initialize research agenda search
            const topicSearchInput = document.getElementById('edit-single-document-topic-search');
            if (topicSearchInput) {
                this.initializeResearchAgendaSearch(topicSearchInput, 'edit-single-document-selected-topics');
            }
            
            // Read document button
            const readBtn = document.getElementById('edit-single-document-read-btn');
            if (readBtn) {
                console.log('Found read document button in single document modal');
                
                // Remove any existing event listeners to prevent duplicates
                readBtn.removeEventListener('click', readBtn._readBtnListener);
                
                // Create new listener with proper "this" context
                const self = this;
                const readBtnListener = function() {
                    console.log('Read document button clicked');
                    const docId = document.getElementById('edit-single-document-id').value;
                    console.log('Document ID for PDF viewer:', docId);
                    self.showPdfViewer(docId);
                };
                
                // Store reference to listener for future removal
                readBtn._readBtnListener = readBtnListener;
                
                // Add the event listener
                readBtn.addEventListener('click', readBtnListener);
                console.log('Added click event listener to read button');
            } else {
                console.warn('Read document button not found in single document modal!');
            }
        } else {
            console.warn('Single document modal not found!');
        }
        
        // Compiled document modal
        const compiledModal = document.getElementById('edit-compiled-document-modal');
        if (compiledModal) {
            console.log('Found compiled document modal');
            
            // Cancel button
            const cancelButtons = compiledModal.querySelectorAll('.cancel-edit-btn, button.btn-secondary');
            console.log(`Found ${cancelButtons.length} cancel buttons in compiled document modal`);
            
            cancelButtons.forEach(button => {
                // Remove any existing event listeners to prevent duplicates
                button.removeEventListener('click', () => compiledModal.style.display = 'none');
                
                // Add the event listener
                button.addEventListener('click', () => {
                    console.log('Cancel button clicked in compiled document modal');
                    compiledModal.style.display = 'none';
                });
                
                console.log('Added click event listener to cancel button:', button);
            });
            
            // Form submission
            const form = document.getElementById('edit-compiled-document-form');
            if (form) {
                // Remove any existing listeners to prevent duplicates
                const oldListener = form._editSubmitListener;
                if (oldListener) {
                    form.removeEventListener('submit', oldListener);
                }
                
                // Create new listener
                const submitListener = (e) => {
                    e.preventDefault();
                    this.saveCompiledDocument(new FormData(form));
                };
                
                // Store reference to listener for future removal
                form._editSubmitListener = submitListener;
                
                // Add the event listener
                form.addEventListener('submit', submitListener);
            }
            
            // Initialize author search input
            const authorSearchInput = document.getElementById('edit-compiled-document-author-search');
            if (authorSearchInput && typeof window.initAuthorSearchInput === 'function') {
                this.initializeAuthorSearch(authorSearchInput, 'edit-compiled-document-selected-authors');
            } else {
                console.warn('Author search input or initialization function not found');
            }
            
            // Initialize research agenda search
            const topicSearchInput = document.getElementById('edit-compiled-document-topic-search');
            if (topicSearchInput) {
                this.initializeResearchAgendaSearch(topicSearchInput, 'edit-compiled-document-selected-topics');
            }
            
            // File upload handling
            const fileInput = document.getElementById('edit-compiled-document-file');
            const fileIndicator = document.getElementById('edit-compiled-document-file-indicator');
            if (fileInput && fileIndicator) {
                // Remove any existing listeners to prevent duplicates
                const oldListener = fileInput._editChangeListener;
                if (oldListener) {
                    fileInput.removeEventListener('change', oldListener);
                }
                
                // Create new listener
                const changeListener = (e) => {
                    if (fileInput.files.length > 0) {
                        fileIndicator.textContent = fileInput.files[0].name;
                    } else {
                        fileIndicator.textContent = '';
                    }
                };
                
                // Store reference to listener for future removal
                fileInput._editChangeListener = changeListener;
                
                // Add the event listener
                fileInput.addEventListener('change', changeListener);
            }
            
            // Read document button
            const readBtn = document.getElementById('edit-compiled-document-read-btn');
            if (readBtn) {
                console.log('Found read document button in compiled document modal');
                
                // Remove any existing event listeners to prevent duplicates
                readBtn.removeEventListener('click', readBtn._readBtnListener);
                
                // Create new listener with proper "this" context
                const self = this;
                const readBtnListener = function() {
                    console.log('Read document button clicked');
                    const docId = document.getElementById('edit-compiled-document-id').value;
                    console.log('Document ID for PDF viewer:', docId);
                    self.showPdfViewer(docId);
                };
                
                // Store reference to listener for future removal
                readBtn._readBtnListener = readBtnListener;
                
                // Add the event listener
                readBtn.addEventListener('click', readBtnListener);
                console.log('Added click event listener to read button');
            } else {
                console.warn('Read document button not found in compiled document modal!');
            }
            
            // Add child document button
            const addChildBtn = document.getElementById('add-child-document-btn');
            if (addChildBtn) {
                // Remove any existing event listeners to prevent duplicates
                addChildBtn.removeEventListener('click', addChildBtn._addChildListener);
                
                // Create new listener with proper "this" context 
                const self = this;
                const addChildListener = function() {
                    self.showChildDocumentSelector();
                };
                
                // Store reference to listener for future removal
                addChildBtn._addChildListener = addChildListener;
                
                // Add the event listener
                addChildBtn.addEventListener('click', addChildListener);
            }
        } else {
            console.warn('Compiled document modal not found!');
        }
        
        // Child document selection modal
        const selectModal = document.getElementById('select-child-document-modal');
        if (selectModal) {
            // Cancel button
            const cancelBtn = document.getElementById('close-select-document-btn');
            if (cancelBtn) {
                // Remove any existing event listeners to prevent duplicates
                cancelBtn.removeEventListener('click', () => selectModal.style.display = 'none');
                
                // Add the event listener
                cancelBtn.addEventListener('click', () => {
                    selectModal.style.display = 'none';
                });
            }
            
            // Search input
            const searchInput = document.getElementById('child-document-search');
            if (searchInput) {
                // Remove any existing listeners to prevent duplicates
                const oldListener = searchInput._searchListener;
                if (oldListener) {
                    searchInput.removeEventListener('input', oldListener);
                }
                
                // Create new listener with proper "this" context
                const self = this;
                const searchListener = function(e) {
                    self.searchAvailableDocuments(e.target.value);
                };
                
                // Store reference to listener for future removal
                searchInput._searchListener = searchListener;
                
                // Add the event listener
                searchInput.addEventListener('input', searchListener);
            }
        }
        
        // PDF viewer modal
        const pdfModal = document.getElementById('pdf-viewer-modal');
        if (pdfModal) {
            // Close button
            const closeBtn = document.getElementById('close-pdf-btn');
            if (closeBtn) {
                // Remove any existing event listeners to prevent duplicates
                closeBtn.removeEventListener('click', () => pdfModal.style.display = 'none');
                
                // Add the event listener
                closeBtn.addEventListener('click', () => {
                    pdfModal.style.display = 'none';
                });
            }
        }
        
        console.log('Modal event listeners setup complete');
    },
    
    // Fetch document data for editing
    fetchDocumentData: function(documentId, isCompiled) {
        return new Promise((resolve, reject) => {
            console.log(`Fetching document data for ID: ${documentId}`);
            
            // Try different potential endpoints for the document
            let endpoints = [];
            
            if (isCompiled) {
                // For compiled documents, try compiled-specific endpoints first
                endpoints = [
                    `/api/compiled-documents/${documentId}`,
                    `/api/documents/${documentId}`,
                    `/api/document/${documentId}`
                ];
            } else {
                // For regular documents, try standard endpoints
                endpoints = [
                    `/api/documents/${documentId}`,
                    `/api/document/${documentId}`
                ];
            }
            
            // Try each endpoint in sequence
            this.tryEndpoints(endpoints)
                .then(data => {
                    console.log('Document data fetched successfully:', data);
                    
                    // Ensure we have at least a bare minimum document structure
                    if (!data || typeof data !== 'object') {
                        console.warn('Document data is not an object, creating default structure');
                        data = {
                            id: documentId,
                            title: 'Unknown Document',
                            document_type: '',
                            date_published: null,
                            authors: [],
                            research_agenda: []
                        };
                    }
                    
                    // Ensure document ID is set
                    if (!data.id) {
                        data.id = documentId;
                    }
                    
                    // Make sure other essential fields exist
                    if (!data.title) data.title = 'Untitled Document';
                    if (!data.document_type) data.document_type = '';
                    
                    // Normalize field names - some APIs might use different names
                    if (!data.date_published && data.publication_date) {
                        data.date_published = data.publication_date;
                    }
                    
                    // For API compatibility, make sure all expected fields exist
                    if (!data.authors) data.authors = [];
                    if (!data.research_agenda && data.topics) {
                        data.research_agenda = data.topics;
                    } else if (!data.research_agenda) {
                        data.research_agenda = [];
                    }
                    
                    resolve(data);
                })
                .catch(error => {
                    console.error('Error fetching document data:', error);
                    
                    // Create fallback document object in case of failure
                    const fallbackData = {
                        id: documentId,
                        title: 'Error Loading Document',
                        document_type: '',
                        date_published: null,
                        authors: [],
                        research_agenda: []
                    };
                    
                    // Attempt to fetch the most critical data separately
                    this.fetchMinimalDocumentData(documentId)
                        .then(minimalData => {
                            // Combine fallback with any data we were able to get
                            const combinedData = { ...fallbackData, ...minimalData };
                            resolve(combinedData);
                        })
                        .catch(minimalError => {
                            console.error('Even minimal data fetch failed:', minimalError);
                            // Use complete fallback
                            resolve(fallbackData);
                        });
                });
        });
    },
    
    // Helper function to fetch minimal document data when main endpoints fail
    fetchMinimalDocumentData: function(documentId) {
        return new Promise(async (resolve, reject) => {
            try {
                const minimalData = { id: documentId };
                
                // Try to at least get the title
                try {
                    const titleResponse = await fetch(`/api/documents/${documentId}/title`);
                    if (titleResponse.ok) {
                        const titleData = await titleResponse.json();
                        minimalData.title = titleData.title || 'Unknown Title';
                    }
                } catch (titleError) {
                    console.warn('Failed to fetch document title:', titleError);
                }
                
                // Try to get authors
                try {
                    const authors = await this.fetchAuthorsForDocument(documentId);
                    minimalData.authors = authors;
                } catch (authorsError) {
                    console.warn('Failed to fetch document authors:', authorsError);
                }
                
                // Try to get research agenda
                try {
                    const researchAgenda = await this.fetchResearchAgendaForDocument(documentId);
                    minimalData.research_agenda = researchAgenda;
                } catch (agendaError) {
                    console.warn('Failed to fetch document research agenda:', agendaError);
                }
                
                resolve(minimalData);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Helper function to try multiple endpoints in sequence
    tryEndpoints: function(endpoints) {
        return new Promise(async (resolve, reject) => {
            let lastError = null;
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying to fetch from endpoint: ${endpoint}`);
                    const response = await fetch(endpoint);
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        // If the response is empty or doesn't have the expected structure,
                        // create a default object with the document ID
                        if (!data || Object.keys(data).length === 0) {
                            // Extract ID from endpoint URL
                            const idMatch = endpoint.match(/\/(\d+)$/);
                            const docId = idMatch ? idMatch[1] : 'unknown';
                            
                            console.warn(`Empty data returned for document ${docId}, using defaults`);
                            return resolve({
                                id: docId,
                                title: 'Untitled Document',
                                document_type: '',
                                date_published: new Date().toISOString(),
                                abstract: '',
                                authors: [],
                                research_agenda: []
                            });
                        }
                        
                        // Ensure document ID is available
                        const docId = data.id;
                        if (!docId) {
                            console.warn('Document data missing ID, extracting from endpoint');
                            // Try to extract ID from the endpoint URL
                            const idMatch = endpoint.match(/\/(\d+)$/);
                            data.id = idMatch ? idMatch[1] : 'unknown';
                        }
                        
                        // Fetch authors information separately if not included
                        const fetchAuthorsPromise = (!data.authors || !Array.isArray(data.authors) || data.authors.length === 0) 
                            ? this.fetchAuthorsForDocument(data.id)
                            : Promise.resolve(data.authors);
                        
                        // Fetch research agenda separately if not included
                        const fetchResearchAgendaPromise = (!data.research_agenda || !Array.isArray(data.research_agenda)) 
                            ? this.fetchResearchAgendaForDocument(data.id)
                            : Promise.resolve(data.research_agenda);
                        
                        // Wait for both promises to resolve
                        return Promise.all([fetchAuthorsPromise, fetchResearchAgendaPromise])
                            .then(([authors, researchAgenda]) => {
                                // Merge the data
                                resolve({
                                    ...data,
                                    authors: authors || [],
                                    research_agenda: researchAgenda || []
                                });
                            });
                    } else {
                        console.log(`Endpoint ${endpoint} failed with status ${response.status}`);
                        lastError = new Error(`Failed to fetch document: ${response.status}`);
                    }
                } catch (error) {
                    console.log(`Error trying endpoint ${endpoint}:`, error);
                    lastError = error;
                }
            }
            
            // If we got here, all endpoints failed
            console.error('All endpoints failed for document fetch');
            reject(lastError || new Error('Failed to fetch document data from any endpoint'));
        });
    },
    
    // Fetch authors for a document separately
    fetchAuthorsForDocument: function(documentId) {
        console.log(`Fetching authors for document ${documentId}`);
        
        // Try multiple potential endpoints
        const endpoints = [
            `/api/document-authors/${documentId}`,
            `/api/documents/${documentId}/authors`,
            `/document-authors/${documentId}`
        ];
        
        return new Promise(async (resolve, reject) => {
            try {
                let authors = [];
                let succeeded = false;
                
                // Try each endpoint sequentially
                for (const endpoint of endpoints) {
                    try {
                        console.log(`Trying to fetch authors from: ${endpoint}`);
                        const response = await fetch(endpoint);
                        
                        if (response.ok) {
                            const data = await response.json();
                            console.log(`Authors data from ${endpoint}:`, data);
                            
                            // Handle different API response formats
                            if (data.authors && Array.isArray(data.authors)) {
                                authors = data.authors;
                                succeeded = true;
                                console.log(`Found ${authors.length} authors at ${endpoint}`);
                                break;
                            } else if (Array.isArray(data)) {
                                authors = data;
                                succeeded = true;
                                console.log(`Found ${authors.length} authors at ${endpoint} (array format)`);
                                break;
                            } else if (data.document_authors && Array.isArray(data.document_authors)) {
                                authors = data.document_authors;
                                succeeded = true;
                                console.log(`Found ${authors.length} authors at ${endpoint} (document_authors format)`);
                                break;
                            } else {
                                console.warn(`Response from ${endpoint} doesn't contain authors in expected format:`, data);
                            }
                        } else {
                            console.warn(`Failed to fetch authors from ${endpoint}: ${response.status}`);
                        }
                    } catch (endpointError) {
                        console.warn(`Error fetching authors from ${endpoint}:`, endpointError);
                    }
                }
                
                // If no authors found, try one more strategy - get document and extract authors
                if (!succeeded && authors.length === 0) {
                    try {
                        console.log('Trying to extract authors from document data');
                        const docResponse = await fetch(`/api/documents/${documentId}`);
                        
                        if (docResponse.ok) {
                            const docData = await docResponse.json();
                            
                            if (docData.authors && Array.isArray(docData.authors)) {
                                authors = docData.authors;
                                console.log(`Extracted ${authors.length} authors from document data`);
                            }
                        }
                    } catch (docError) {
                        console.warn('Error extracting authors from document:', docError);
                    }
                }
                
                // Process authors to ensure consistent format
                const formattedAuthors = authors.map(author => {
                    // Handle string-only authors
                    if (typeof author === 'string') {
                        return { id: 'unknown', full_name: author };
                    }
                    
                    // Handle object authors with different property names
                    let authorObj = { ...author };
                    
                    // Ensure id exists
                    if (!authorObj.id && authorObj.author_id) {
                        authorObj.id = authorObj.author_id;
                    } else if (!authorObj.id) {
                        authorObj.id = 'unknown';
                    }
                    
                    // Ensure full_name exists
                    if (!authorObj.full_name && authorObj.name) {
                        authorObj.full_name = authorObj.name;
                    } else if (!authorObj.full_name) {
                        authorObj.full_name = 'Unknown Author';
                    }
                    
                    return authorObj;
                });
                
                console.log(`Returning ${formattedAuthors.length} formatted authors`);
                resolve(formattedAuthors);
            } catch (error) {
                console.error(`Error in fetchAuthorsForDocument:`, error);
                resolve([]); // Resolve with empty array instead of rejecting
            }
        });
    },
    
    // Fetch keywords for a document separately
    fetchResearchAgendaForDocument: function(documentId) {
        console.log(`[KEYWORDS] Fetching keywords for document ${documentId}`);
        
        // Try multiple potential endpoints
        const endpoints = [
            `/document-research-agenda/${documentId}`,
            `/api/document-research-agenda/${documentId}`,
            `/api/documents/${documentId}/topics`,
            `/api/documents/${documentId}/research-agenda`
        ];
        
        return new Promise(async (resolve, reject) => {
            try {
                let agendaItems = [];
                let succeeded = false;
                
                // Try each endpoint sequentially
                for (const endpoint of endpoints) {
                    try {
                        console.log(`[KEYWORDS] Trying endpoint: ${endpoint}`);
                        const response = await fetch(endpoint);
                        
                        if (response.ok) {
                            const data = await response.json();
                            console.log(`[KEYWORDS] Response from ${endpoint}:`, data);
                            
                            // Handle different response formats
                            if (Array.isArray(data)) {
                                agendaItems = data;
                                succeeded = true;
                                break;
                            } else if (data.items && Array.isArray(data.items)) {
                                agendaItems = data.items;
                                succeeded = true;
                                break;
                            } else if (data.agenda_items && Array.isArray(data.agenda_items)) {
                                agendaItems = data.agenda_items;
                                succeeded = true;
                                break;
                            } else if (data.topics && Array.isArray(data.topics)) {
                                agendaItems = data.topics;
                                succeeded = true;
                                break;
                            } else if (data.research_agenda && Array.isArray(data.research_agenda)) {
                                agendaItems = data.research_agenda;
                                succeeded = true;
                                break;
                            }
                        }
                    } catch (endpointError) {
                        console.warn(`[KEYWORDS] Error fetching from ${endpoint}:`, endpointError);
                    }
                }
                
                // If no items found, try direct document query as a last resort
                if (!succeeded || agendaItems.length === 0) {
                    try {
                        console.log('[KEYWORDS] Trying to extract from document data');
                        const docResponse = await fetch(`/api/documents/${documentId}`);
                        
                        if (docResponse.ok) {
                            const docData = await docResponse.json();
                            
                            // Try different field names that might contain keywords data
                            if (docData.research_agenda && Array.isArray(docData.research_agenda)) {
                                agendaItems = docData.research_agenda;
                            } else if (docData.topics && Array.isArray(docData.topics)) {
                                agendaItems = docData.topics;
                            } else if (docData.subject_areas && Array.isArray(docData.subject_areas)) {
                                agendaItems = docData.subject_areas;
                            }
                        }
                    } catch (docError) {
                        console.warn('[KEYWORDS] Error extracting from document:', docError);
                    }
                }
                
                // Format the items
                const formattedItems = agendaItems.map(item => {
                    // Handle string-only items
                    if (typeof item === 'string') {
                        return {
                            id: 'unknown',
                            name: item
                        };
                    }
                    
                    // Handle object items
                    const itemObj = { ...item };
                    
                    // Ensure name exists
                    if (!itemObj.name && itemObj.title) {
                        itemObj.name = itemObj.title;
                    } else if (!itemObj.name && itemObj.agenda_name) {
                        itemObj.name = itemObj.agenda_name;
                    } else if (!itemObj.name && itemObj.topic) {
                        itemObj.name = itemObj.topic;
                    } else if (!itemObj.name) {
                        console.warn('[KEYWORDS] Item has no name:', itemObj);
                        itemObj.name = 'Unknown Item';
                    }
                    
                    return itemObj;
                }).filter(item => item !== null);
                
                console.log(`[KEYWORDS] Final formatted items (${formattedItems.length}):`, formattedItems);
                resolve(formattedItems);
            } catch (error) {
                console.error(`[KEYWORDS] Error in fetchResearchAgendaForDocument:`, error);
                reject(error);
            }
        });
    },
    
    // Populate the edit form with document data
    populateEditForm: function(data) {
        console.log('Populating edit form with data:', data);
        
        // Set form fields
        document.getElementById('edit-single-document-title').value = data.title || '';
        document.getElementById('edit-single-document-type').value = data.document_type || '';
        
        // Format date for input field (YYYY-MM-DD)
        if (data.date_published) {
            const date = new Date(data.date_published);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('edit-single-document-date').value = formattedDate;
        } else {
            document.getElementById('edit-single-document-date').value = '';
        }
        
        // Ensure data.authors is an array
        if (!data.authors || !Array.isArray(data.authors)) {
            console.warn('Document has no authors or authors is not an array, fetching authors separately');
            // Try to fetch authors
            this.fetchAuthorsForDocument(data.id)
                .then(authors => {
                    data.authors = authors;
                    this.populateAuthorsContainer(data.authors);
                })
                .catch(error => {
                    console.error('Error fetching authors:', error);
                    data.authors = [];
                });
        } else {
            this.populateAuthorsContainer(data.authors);
        }
        
        // Ensure data.research_agenda is an array
        if (!data.research_agenda || !Array.isArray(data.research_agenda)) {
            console.warn('Document has no research agenda or research_agenda is not an array, fetching research agenda separately');
            // Try to fetch research agenda
            this.fetchResearchAgendaForDocument(data.id)
                .then(researchAgenda => {
                    data.research_agenda = researchAgenda;
                    this.populateResearchAgendaContainer(data.research_agenda);
                })
                .catch(error => {
                    console.error('Error fetching research agenda:', error);
                    data.research_agenda = [];
                });
        } else {
            this.populateResearchAgendaContainer(data.research_agenda);
        }
        
        // Populate abstract
        const abstractElement = document.getElementById('edit-single-document-abstract');
        if (abstractElement) {
            abstractElement.value = data.abstract || '';
        }
        
        // Populate preview section
        document.getElementById('edit-single-document-preview-title').textContent = data.title || 'Document Title';
        document.getElementById('edit-single-document-preview-type').textContent = data.document_type || '-';
        document.getElementById('edit-single-document-preview-date').textContent = data.date_published ? new Date(data.date_published).toLocaleDateString() : '-';
        
        // The abstract element in the preview might not exist since we reorganized the UI
        const previewAbstractElement = document.getElementById('edit-single-document-preview-abstract');
        if (previewAbstractElement) {
            previewAbstractElement.textContent = data.abstract || 'No abstract available.';
        }
        
        // Initialize search inputs after a short delay to allow containers to be populated
        setTimeout(() => {
            // Initialize author search
            const authorSearchInput = document.getElementById('edit-single-document-author-search');
            const selectedAuthorsContainerId = 'edit-single-document-selected-authors';
            
            if (authorSearchInput) {
                // Try to initialize with our new enhanced version
                try {
                    this.initializeAuthorSearch(authorSearchInput, selectedAuthorsContainerId);
                    console.log('Author search initialized successfully');
                } catch (error) {
                    console.error('Error initializing author search:', error);
                    this.dummyAuthorSearchInit(authorSearchInput); // Fallback
                }
            }
            
            // Initialize research agenda search
            const topicSearchInput = document.getElementById('edit-single-document-topic-search');
            const selectedTopicsContainerId = 'edit-single-document-selected-topics';
            
            if (topicSearchInput) {
                // Try to initialize with our enhanced version
                try {
                    this.initializeResearchAgendaSearch(topicSearchInput, selectedTopicsContainerId);
                    console.log('Research agenda search initialized successfully');
                } catch (error) {
                    console.error('Error initializing research agenda search:', error);
                    // No fallback needed, basic functionality will work without it
                }
            }
        }, 100);
        
        // Set document type icon
        const typeIcon = document.getElementById('edit-single-document-type-icon');
        if (typeIcon) {
            const iconPath = this.getDocumentTypeIcon(data.document_type);
            typeIcon.src = iconPath;
        }
        
        // Set up "View Document" button
        const viewDocBtn = document.getElementById('edit-single-document-view-btn');
        if (viewDocBtn && data.id) {
            viewDocBtn.href = `/open-doc.html?id=${data.id}`;
            viewDocBtn.classList.remove('disabled');
        }
    },
    
    // Helper function to populate authors container
    populateAuthorsContainer: function(authors) {
        const selectedAuthorsContainer = document.getElementById('edit-single-document-selected-authors');
        if (!selectedAuthorsContainer) {
            console.error('Authors container not found');
            return;
        }
        
        // Clear existing content
        selectedAuthorsContainer.innerHTML = '';
        
        // Populate with authors
        if (authors && Array.isArray(authors) && authors.length > 0) {
            console.log(`Populating authors container with ${authors.length} authors:`, authors);
            authors.forEach(author => {
                // Skip if author is null or undefined
                if (!author) return;
                
                const authorElement = document.createElement('div');
                authorElement.className = 'selected-author';
                authorElement.dataset.id = author.id || 'unknown';
                authorElement.innerHTML = `
                    ${author.full_name || author.name || author}
                    <span class="remove-author" data-id="${author.id || 'unknown'}">&times;</span>
                `;
                selectedAuthorsContainer.appendChild(authorElement);
            });
            
            // Add event listeners to remove buttons
            const removeButtons = selectedAuthorsContainer.querySelectorAll('.remove-author');
            removeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.target.parentElement.remove();
                });
            });
        } else {
            console.warn('No authors found for this document');
        }
    },
    
    // Helper function to populate keywords container
    populateResearchAgendaContainer: function(researchAgenda) {
        const selectedTopicsContainer = document.getElementById('edit-single-document-selected-topics');
        if (!selectedTopicsContainer) {
            console.error('Keywords container not found');
            return;
        }
        
        // Clear existing content
        selectedTopicsContainer.innerHTML = '';
        
        // Populate with keywords items
        if (researchAgenda && Array.isArray(researchAgenda) && researchAgenda.length > 0) {
            console.log(`Populating keywords container with ${researchAgenda.length} items:`, researchAgenda);
            researchAgenda.forEach(item => {
                // Skip if item is null or undefined
                if (!item) return;
                
                // Handle different formats of keywords items
                let itemId = 'unknown';
                let itemName = '';
                
                if (typeof item === 'string') {
                    itemName = item;
                } else if (item.id && item.name) {
                    itemId = item.id;
                    itemName = item.name;
                } else if (item.id && item.title) {
                    itemId = item.id;
                    itemName = item.title;
                } else if (item.name) {
                    itemId = 'unknown';
                    itemName = item.name;
                } else if (item.title) {
                    itemId = 'unknown';
                    itemName = item.title;
                }
                
                if (!itemName) {
                    console.warn('Keywords item has no name, skipping', item);
                    return;
                }
                
                const topicElement = document.createElement('div');
                topicElement.className = 'selected-topic';
                topicElement.dataset.id = itemId;
                topicElement.innerHTML = `
                    ${itemName}
                    <span class="remove-topic" data-id="${itemId}">&times;</span>
                `;
                
                // Add to container
                selectedTopicsContainer.appendChild(topicElement);
                
                // Add click handler to remove button
                const removeBtn = topicElement.querySelector('.remove-topic');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        topicElement.remove();
                    });
                }
            });
        } else {
            console.warn('No keywords items found for this document');
        }
    },
    
    // Populate the compiled document edit form
    populateCompiledEditForm: function(data) {
        // Set form values
        document.getElementById('edit-compiled-document-title').value = data.title || '';
        document.getElementById('edit-compiled-document-type').value = data.document_type || '';
        
        // Format date for input field (YYYY-MM-DD)
        if (data.date_published) {
            const date = new Date(data.date_published);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('edit-compiled-document-date').value = formattedDate;
        } else {
            document.getElementById('edit-compiled-document-date').value = '';
        }
        
        // Populate authors
        const selectedAuthorsContainer = document.getElementById('edit-compiled-document-selected-authors');
        if (selectedAuthorsContainer && data.authors && Array.isArray(data.authors)) {
            selectedAuthorsContainer.innerHTML = '';
            data.authors.forEach(author => {
                const authorElement = document.createElement('div');
                authorElement.className = 'selected-author';
                authorElement.dataset.id = author.id || 'unknown';
                authorElement.innerHTML = `
                    ${author.full_name || author.name || author}
                    <span class="remove-author" data-id="${author.id || 'unknown'}">&times;</span>
                `;
                selectedAuthorsContainer.appendChild(authorElement);
            });
            
            // Add event listeners to remove buttons
            const removeButtons = selectedAuthorsContainer.querySelectorAll('.remove-author');
            removeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.target.parentElement.remove();
                });
            });
        }
        
        // Populate research agenda (renamed from topics)
        const selectedTopicsContainer = document.getElementById('edit-compiled-document-selected-topics');
        if (selectedTopicsContainer && data.research_agenda && Array.isArray(data.research_agenda)) {
            selectedTopicsContainer.innerHTML = '';
            data.research_agenda.forEach(item => {
                const topicElement = document.createElement('div');
                topicElement.className = 'selected-topic';
                topicElement.dataset.id = item.id || 'unknown';
                topicElement.innerHTML = `
                    ${item.name || item}
                    <span class="remove-topic" data-id="${item.id || 'unknown'}">&times;</span>
                `;
                selectedTopicsContainer.appendChild(topicElement);
            });
            
            // Add event listeners to remove buttons
            const removeButtons = selectedTopicsContainer.querySelectorAll('.remove-topic');
            removeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.target.parentElement.remove();
                });
            });
        }
        
        // Load child documents
        this.loadChildDocuments(data.id, data.children || []);
        
        // Populate preview section
        document.getElementById('edit-compiled-document-preview-title').textContent = data.title || 'Compilation Title';
        document.getElementById('edit-compiled-document-preview-type').textContent = data.document_type || '-';
        document.getElementById('edit-compiled-document-preview-date').textContent = data.date_published ? new Date(data.date_published).toLocaleDateString() : '-';
        
        // The abstract element in the preview might not exist since we reorganized the UI
        const abstractElement = document.getElementById('edit-compiled-document-preview-abstract');
        if (abstractElement) {
            abstractElement.textContent = data.abstract || 'No abstract available.';
        }
        
        document.getElementById('edit-compiled-document-preview-count').textContent = data.child_count || 0;
        
        // Set author text
        if (data.authors && Array.isArray(data.authors) && data.authors.length > 0) {
            const authorNames = data.authors.map(a => a.full_name || a.name || a).join(', ');
            document.getElementById('edit-compiled-document-preview-author').innerHTML = `<i class="fas fa-user"></i> ${authorNames}`;
        } else {
            document.getElementById('edit-compiled-document-preview-author').innerHTML = `<i class="fas fa-user"></i> Multiple Authors`;
        }
        
        // Set research agenda text (renamed from topics)
        if (data.research_agenda && Array.isArray(data.research_agenda) && data.research_agenda.length > 0) {
            const agendaNames = data.research_agenda.map(t => t.name || t).join(', ');
            document.getElementById('edit-compiled-document-preview-topics').textContent = agendaNames;
        } else {
            document.getElementById('edit-compiled-document-preview-topics').textContent = '-';
        }
        
        // Set document type icon
        const typeIcon = document.getElementById('edit-compiled-document-type-icon');
        if (typeIcon) {
            const iconPath = this.getDocumentTypeIcon(data.document_type);
            typeIcon.src = iconPath;
        }
        
        // Load preview of child documents
        this.updateChildDocumentsPreview(data.children || []);
    },
    
    // Load and display child documents in the compiled document edit form
    loadChildDocuments: function(parentId, children = []) {
        const container = document.getElementById('edit-compiled-document-children');
        if (!container) return;
        
        if (!children.length) {
            container.innerHTML = '<div class="no-children-message">No child documents added yet.</div>';
            return;
        }
        
        container.innerHTML = '';
        
        children.forEach(child => {
            const childElement = document.createElement('div');
            childElement.className = 'compilation-study-item';
            childElement.dataset.id = child.id;
            
            childElement.innerHTML = `
                <div class="study-info">
                    <div class="study-title">${child.title || 'Untitled Document'}</div>
                    <div class="study-author">${child.author_names || 'Unknown Author'}</div>
                </div>
                <div class="study-actions">
                    <button class="remove-child-btn" data-id="${child.id}" title="Remove from compilation">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(childElement);
        });
        
        // Add event listeners to remove buttons
        const removeButtons = container.querySelectorAll('.remove-child-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const childId = e.target.closest('button').dataset.id;
                this.removeChildDocument(childId);
            });
        });
    },
    
    // Update the child documents preview in the right panel
    updateChildDocumentsPreview: function(children = []) {
        const container = document.getElementById('edit-compiled-document-preview-children');
        if (!container) return;
        
        if (!children.length) {
            container.innerHTML = '<div class="no-children-message">No child documents added.</div>';
            return;
        }
        
        container.innerHTML = '';
        
        children.forEach(child => {
            const childElement = document.createElement('div');
            childElement.className = 'preview-child-item';
            
            childElement.innerHTML = `
                <div class="preview-child-title">${child.title || 'Untitled Document'}</div>
                <div class="preview-child-author">${child.author_names || 'Unknown Author'}</div>
            `;
            
            container.appendChild(childElement);
        });
    },
    
    // Remove a child document from the compilation
    removeChildDocument: function(childId) {
        // Get parent document ID
        const parentId = document.getElementById('edit-compiled-document-id').value;
        
        // Find and remove the child element from the list
        const childElement = document.querySelector(`.compilation-study-item[data-id="${childId}"]`);
        if (childElement) {
            childElement.remove();
        }
        
        // Update the preview
        this.fetchDocumentData(parentId, true).then(data => {
            // Filter out the removed child
            const updatedChildren = (data.children || []).filter(child => child.id != childId);
            this.updateChildDocumentsPreview(updatedChildren);
            
            // Update child count
            document.getElementById('edit-compiled-document-preview-count').textContent = updatedChildren.length;
        });
        
        // Notify success
        showToast('Child document removed from compilation', 'success');
    },
    
    // Show the child document selection modal
    showChildDocumentSelector: function() {
        const modal = document.getElementById('select-child-document-modal');
        if (!modal) return;
        
        // Display the modal
        modal.style.display = 'flex';
        
        // Load available documents
        this.loadAvailableDocuments();
    },
    
    // Load available documents for selection
    loadAvailableDocuments: function() {
        const container = document.getElementById('available-documents-container');
        if (!container) return;
        
        container.innerHTML = '<div class="loading-documents"><i class="fas fa-spinner fa-spin"></i> Loading documents...</div>';
        
        // Fetch non-compiled documents that can be added as children
        fetch('/api/documents?type=regular&limit=50')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch documents: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                this.renderAvailableDocuments(data.documents || []);
            })
            .catch(error => {
                console.error('Error loading available documents:', error);
                container.innerHTML = `<div class="error-message">Error loading documents: ${error.message}</div>`;
            });
    },
    
    // Render available documents for selection
    renderAvailableDocuments: function(documents) {
        const container = document.getElementById('available-documents-container');
        if (!container) return;
        
        if (!documents.length) {
            container.innerHTML = '<div class="no-documents-message">No documents available to add.</div>';
            return;
        }
        
        container.innerHTML = '';
        
        documents.forEach(doc => {
            const docElement = document.createElement('div');
            docElement.className = 'available-document-item';
            docElement.dataset.id = doc.id;
            
            const formattedDate = doc.date_published ? new Date(doc.date_published).toLocaleDateString() : 'Unknown date';
            
            docElement.innerHTML = `
                <div class="available-document-info">
                    <div class="available-document-title">${doc.title || 'Untitled Document'}</div>
                    <div class="available-document-meta">
                        ${doc.author_names || 'Unknown Author'} | ${formattedDate} | ${doc.document_type || 'Unknown Type'}
                    </div>
                </div>
                <button class="select-document-btn" data-id="${doc.id}">Add</button>
            `;
            
            container.appendChild(docElement);
        });
        
        // Add event listeners to select buttons
        const selectButtons = container.querySelectorAll('.select-document-btn');
        selectButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const docId = e.target.dataset.id;
                this.addChildDocument(docId);
            });
        });
    },
    
    // Search available documents
    searchAvailableDocuments: function(query) {
        const items = document.querySelectorAll('.available-document-item');
        
        items.forEach(item => {
            const title = item.querySelector('.available-document-title').textContent.toLowerCase();
            const meta = item.querySelector('.available-document-meta').textContent.toLowerCase();
            
            if (title.includes(query.toLowerCase()) || meta.includes(query.toLowerCase())) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    // Add a child document to the compilation
    addChildDocument: function(childId) {
        const parentId = document.getElementById('edit-compiled-document-id').value;
        
        // Fetch child document data
        fetch(`/api/documents/${childId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch child document: ${response.status}`);
                }
                return response.json();
            })
            .then(childData => {
                // Add to the child documents list
                const container = document.getElementById('edit-compiled-document-children');
                
                // Remove "no children" message if present
                const noChildrenMsg = container.querySelector('.no-children-message');
                if (noChildrenMsg) {
                    container.innerHTML = '';
                }
                
                const childElement = document.createElement('div');
                childElement.className = 'compilation-study-item';
                childElement.dataset.id = childData.id;
                
                childElement.innerHTML = `
                    <div class="study-info">
                        <div class="study-title">${childData.title || 'Untitled Document'}</div>
                        <div class="study-author">${childData.author_names || 'Unknown Author'}</div>
                    </div>
                    <div class="study-actions">
                        <button class="remove-child-btn" data-id="${childData.id}" title="Remove from compilation">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                
                container.appendChild(childElement);
                
                // Add event listener to remove button
                childElement.querySelector('.remove-child-btn').addEventListener('click', (e) => {
                    this.removeChildDocument(childData.id);
                });
                
                // Update the preview
                this.updateChildDocumentsPreview([...this.getSelectedChildDocuments(), childData]);
                
                // Update child count
                const countElement = document.getElementById('edit-compiled-document-preview-count');
                countElement.textContent = parseInt(countElement.textContent || '0') + 1;
                
                // Close the selection modal
                document.getElementById('select-child-document-modal').style.display = 'none';
                
                // Notify success
                showToast('Child document added to compilation', 'success');
            })
            .catch(error => {
                console.error('Error adding child document:', error);
                showToast('Error adding child document. Please try again.', 'error');
            });
    },
    
    // Get the currently selected child documents
    getSelectedChildDocuments: function() {
        const children = [];
        const childElements = document.querySelectorAll('.compilation-study-item');
        
        childElements.forEach(element => {
            children.push({
                id: element.dataset.id,
                title: element.querySelector('.study-title').textContent,
                author_names: element.querySelector('.study-author').textContent
            });
        });
        
        return children;
    },
    
    // Show PDF viewer
    showPdfViewer: function(documentId) {
        console.log(`Opening document ID: ${documentId} in new tab`);
        
        // Fetch the document to get the file path
        fetch(`/api/documents/${documentId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error fetching document: ${response.status}`);
                }
                return response.json();
            })
            .then(document => {
                if (document && document.file_path) {
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
                    // Open in new tab
                    window.open(pdfPath, '_blank');
                } else {
                    console.error('No file path found for document:', document);
                    alert('Error: The document file could not be found.');
                }
            })
            .catch(error => {
                console.error('Error opening document:', error);
                alert(`Error: ${error.message}`);
            });
    },
    
    // Show success message
    showSaveSuccess: function() {
        // Create success popup
        const popup = document.createElement('div');
        popup.className = 'success-popup-overlay';
        popup.innerHTML = `
            <div class="success-popup">
                <div class="success-popup-icon">✓</div>
                <div class="success-popup-title">Changes Saved</div>
                <div class="success-popup-message">Your changes have been saved successfully.</div>
                <button class="success-popup-button">OK</button>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(popup);
        
        // Add button click handler to close
        const button = popup.querySelector('.success-popup-button');
        if (button) {
            button.addEventListener('click', () => {
                document.body.removeChild(popup);
            });
        }
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, 3000);
    },
    
    // Show error message
    showSaveError: function(error) {
        // Create small toast notification
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.textContent = error instanceof Error ? error.message : error;
        
        // Add to document
        document.body.appendChild(toast);
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 5000);
    },
    
    // Hide modal by ID
    hideModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        } else {
            console.warn(`Modal with ID ${modalId} not found`);
        }
    },
    
    // Save changes to a document
    saveDocument: function(formData) {
        console.log('Saving document changes...');
        
        const documentId = formData.get('document_id');
        if (!documentId) {
            console.error('No document ID provided for save operation');
            this.showSaveError('Invalid document ID');
            return;
        }
        
        // Create data object from form data
        const data = {
            id: documentId,
            title: formData.get('title'),
            document_type: formData.get('document_type'),
            date_published: formData.get('date_published')
        };
        
        console.log('Document data to save:', data);
        
        // Gather selected authors
        const selectedAuthors = [];
        document.querySelectorAll('#edit-single-document-selected-authors .selected-author').forEach(element => {
            selectedAuthors.push({
                id: element.dataset.id,
                name: element.textContent.trim().replace('×', '')
            });
        });
        
        console.log('Selected authors:', selectedAuthors);
        
        // Gather selected research agenda items
        const selectedTopics = [];
        document.querySelectorAll('#edit-single-document-selected-topics .selected-topic').forEach(element => {
            selectedTopics.push({
                id: element.dataset.id,
                name: element.textContent.trim().replace('×', '')
            });
        });
        
        console.log('Selected research agenda items:', selectedTopics);
        
        // First, update basic document data
        fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                authors: selectedAuthors.map(author => author.id)
            })
        })
        .then(response => {
            if (!response.ok) {
                console.error('Error updating document:', response.status);
                return response.json().then(data => Promise.reject(data.error || 'Failed to update document'));
            }
            return response.json();
        })
        .then(result => {
            console.log('Document updated successfully:', result);
            
            // Now save research agenda items to both endpoints
            const agendaItemNames = selectedTopics.map(item => item.name);
            
                // First try the old endpoint for backward compatibility
            return fetch(`/api/documents/${documentId}/topics`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                body: JSON.stringify({ topics: agendaItemNames })
                })
                .then(response => {
                    if (!response.ok) {
                        console.warn('Warning: Research agenda items may not have been saved correctly to old endpoint');
                    }
                return result; // Continue with the original result
                })
                .catch(error => {
                    console.error('Error saving research agenda items to old endpoint:', error);
                return result; // Continue with the original result
            });
        })
        .then(result => {
            // Now save to the new research agenda endpoint
            const agendaItemIds = selectedTopics
                .filter(item => item.id !== 'new')
                .map(item => item.id);
                
            const agendaItemNames = selectedTopics
                .filter(item => item.id === 'new')
                .map(item => item.name);
                
            return fetch(`/document-research-agenda`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        document_id: documentId,
                        agenda_ids: agendaItemIds,
                        agenda_names: agendaItemNames,
                        agenda_items: selectedTopics.map(item => item.name) // For backward compatibility
                    })
                })
                .then(response => {
                    if (!response.ok) {
                    console.warn('Warning: Failed to link research agenda items using main endpoint, trying fallback');
                    // Try fallback endpoint
                    return fetch(`/api/document-research-agenda/link`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            document_id: documentId,
                            agenda_items: selectedTopics.map(item => item.name)
                        })
                    })
                    .then(fallbackResponse => {
                        if (!fallbackResponse.ok) {
                            console.warn('Warning: Failed to link research agenda items in fallback endpoint');
                            return fallbackResponse.json().then(data => Promise.reject(data.error || 'Failed to link research agenda items'));
                        }
                        return fallbackResponse.json();
                    });
                }
                
                    return response.json();
                })
                .then(result => {
                    console.log('Research agenda linking result:', result);
                return result;
                })
                .catch(error => {
                    console.error('Error linking research agenda items:', error);
                return result; // Continue with the original result
            });
        })
        .then(result => {
            // Handle file upload if provided
            const fileInput = document.getElementById('edit-single-document-file');
            if (fileInput && fileInput.files.length > 0) {
                const fileFormData = new FormData();
                fileFormData.append('file', fileInput.files[0]);
                
                return fetch(`/api/documents/${documentId}/file`, {
                    method: 'POST',
                    body: fileFormData
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => Promise.reject(data.error || 'Failed to upload file'));
                    }
                    return response.json();
                });
            }
            
            return result;
        })
        .then(result => {
            // Show success message and close modal
            this.showSaveSuccess();
            document.getElementById('edit-single-document-modal').style.display = 'none';
            
            // Refresh document list if available
            if (window.documentList && typeof window.documentList.reloadDocuments === 'function') {
                window.documentList.reloadDocuments();
            }
        })
        .catch(error => {
            console.error('Error saving document:', error);
            this.showSaveError(error);
        });
    },
    
    // Save changes to a compiled document
    saveCompiledDocument: function(formData) {
        console.log('Saving compiled document changes...');
        
        const documentId = formData.get('document_id');
        if (!documentId) {
            console.error('No document ID provided for save operation');
            this.showSaveError('Invalid document ID');
            return;
        }
        
        // Create data object from form data
        const data = {
            id: documentId,
            title: formData.get('title'),
            document_type: formData.get('document_type'),
            date_published: formData.get('date_published'),
            is_compiled: true
        };
        
        console.log('Compiled document data to save:', data);
        
        // Gather selected authors
        const selectedAuthors = [];
        document.querySelectorAll('#edit-compiled-document-selected-authors .selected-author').forEach(element => {
            selectedAuthors.push({
                id: element.dataset.id,
                name: element.textContent.trim().replace('×', '')
            });
        });
        
        console.log('Selected authors:', selectedAuthors);
        
        // Gather selected research agenda items
        const selectedTopics = [];
        document.querySelectorAll('#edit-compiled-document-selected-topics .selected-topic').forEach(element => {
            selectedTopics.push({
                id: element.dataset.id,
                name: element.textContent.trim().replace('×', '')
            });
        });
        
        console.log('Selected research agenda items:', selectedTopics);
        
        // First, update basic document data
        fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                authors: selectedAuthors.map(author => author.id)
            })
        })
        .then(response => {
            if (!response.ok) {
                console.error('Error updating compiled document:', response.status);
                return response.json().then(data => Promise.reject(data.error || 'Failed to update compiled document'));
            }
            return response.json();
        })
        .then(result => {
            console.log('Compiled document updated successfully:', result);
            
            // Now save research agenda items to both endpoints
            const agendaItemNames = selectedTopics.map(item => item.name);
            
                // First try the old endpoint for backward compatibility
            return fetch(`/api/documents/${documentId}/topics`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                body: JSON.stringify({ topics: agendaItemNames })
                })
                .then(response => {
                    if (!response.ok) {
                        console.warn('Warning: Research agenda items may not have been saved correctly to old endpoint');
                    }
                return result; // Continue with the original result
                })
                .catch(error => {
                    console.error('Error saving research agenda items to old endpoint:', error);
                return result; // Continue with the original result
            });
        })
        .then(result => {
            // Now save to the new research agenda endpoint
            const agendaItemIds = selectedTopics
                .filter(item => item.id !== 'new')
                .map(item => item.id);
                
            const agendaItemNames = selectedTopics
                .filter(item => item.id === 'new')
                .map(item => item.name);
                
            return fetch(`/document-research-agenda`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        document_id: documentId,
                        agenda_ids: agendaItemIds,
                        agenda_names: agendaItemNames,
                        agenda_items: selectedTopics.map(item => item.name) // For backward compatibility
                    })
                })
                .then(response => {
                    if (!response.ok) {
                    console.warn('Warning: Failed to link research agenda items using main endpoint, trying fallback');
                    // Try fallback endpoint
                    return fetch(`/api/document-research-agenda/link`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            document_id: documentId,
                            agenda_items: selectedTopics.map(item => item.name)
                        })
                    })
                    .then(fallbackResponse => {
                        if (!fallbackResponse.ok) {
                            console.warn('Warning: Failed to link research agenda items in fallback endpoint');
                            return fallbackResponse.json().then(data => Promise.reject(data.error || 'Failed to link research agenda items'));
                        }
                        return fallbackResponse.json();
                    });
                }
                
                    return response.json();
                })
                .then(result => {
                    console.log('Research agenda linking result:', result);
                return result;
                })
                .catch(error => {
                    console.error('Error linking research agenda items:', error);
                return result; // Continue with the original result
            });
        })
        .then(result => {
            // Handle file upload if provided
            const fileInput = document.getElementById('edit-compiled-document-file');
            if (fileInput && fileInput.files.length > 0) {
                const fileFormData = new FormData();
                fileFormData.append('file', fileInput.files[0]);
                
                return fetch(`/api/documents/${documentId}/file`, {
                    method: 'POST',
                    body: fileFormData
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => Promise.reject(data.error || 'Failed to upload file'));
                    }
                    return response.json();
                });
            }
            
            return result;
        })
        .then(result => {
            // Show success message and close modal
            this.showSaveSuccess();
            document.getElementById('edit-compiled-document-modal').style.display = 'none';
            
            // Refresh document list if available
            if (window.documentList && typeof window.documentList.reloadDocuments === 'function') {
                window.documentList.reloadDocuments();
            }
        })
        .catch(error => {
            console.error('Error saving compiled document:', error);
            this.showSaveError(error);
        });
    },
    
    // Get document type icon URL
    getDocumentTypeIcon: function(documentType) {
        // Map document types to icon paths
        const iconMap = {
            'THESIS': '/admin/Components/icons/Category-icons/thesis.png',
            'DISSERTATION': '/admin/Components/icons/Category-icons/dissertation.png',
            'CONFLUENCE': '/admin/Components/icons/Category-icons/confluence.png',
            'SYNERGY': '/admin/Components/icons/Category-icons/synergy.png'
        };
        
        // Get the normalized document type
        const normType = documentType?.toUpperCase() || '';
        
        // Return the mapped icon path or default
        return iconMap[normType] || '/admin/Components/icons/Category-icons/default_category_icon.png';
    },
    
    // Initialize Author Search
    initializeAuthorSearch: function(inputElement, selectedContainerId) {
        if (!inputElement) return;
        
        console.log('Initializing author search input:', inputElement.id);
        
        // Try to use the global function first if available
        if (typeof window.initAuthorSearchInput === 'function' && window.initAuthorSearchInput !== this.dummyAuthorSearchInit) {
            try {
                console.log('Using global author search initialization');
                window.initAuthorSearchInput(inputElement);
                return;
            } catch (error) {
                console.error('Error using global author search function, falling back to internal implementation:', error);
                // Continue with internal implementation
            }
        } else {
            console.log('Using internal author search implementation');
        }
        
        // Create author dropdown container
        const dropdownId = `${inputElement.id}-dropdown`;
        
        // First remove any existing dropdown to avoid duplicates
        const existingDropdown = document.getElementById(dropdownId);
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // Create new dropdown element with absolute positioning
        const dropdownContainer = document.createElement('div');
        dropdownContainer.style.position = 'relative';
        dropdownContainer.style.width = '100%';
        
        const dropdown = document.createElement('div');
        dropdown.id = dropdownId;
        dropdown.className = 'dropdown-list';
        dropdown.style.display = 'none';
        dropdownContainer.appendChild(dropdown);
        
        // Insert the dropdown container after the input element
        const parent = inputElement.parentNode;
        if (parent.nextSibling) {
            parent.parentNode.insertBefore(dropdownContainer, parent.nextSibling);
        } else {
            parent.parentNode.appendChild(dropdownContainer);
        }
        
        console.log(`Created author dropdown with ID: ${dropdownId}`);
        
        // Debounce function for search delay
        const debounce = (func, delay) => {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        };
        
        // Search authors as user types
        const searchAuthors = debounce(async (query) => {
            if (query.length < 2) {
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
                return;
            }
            
            // Show loading indicator
            dropdown.innerHTML = '<div class="dropdown-item loading"><i class="fas fa-spinner fa-spin"></i> Searching authors...</div>';
            dropdown.style.display = 'block';
            
            try {
                // Try multiple potential author search endpoints
                let response;
                let authorsData;
                let authors = [];
                
                // First try the search endpoints
                let endpoints = [
                    `/api/authors/search?q=${encodeURIComponent(query)}`,
                    `/authors/search?q=${encodeURIComponent(query)}`,
                    `/api/authors?name=${encodeURIComponent(query)}`
                ];
                
                // Try each endpoint until one works
                for (const endpoint of endpoints) {
                    try {
                        console.log(`Trying author search endpoint: ${endpoint}`);
                        response = await fetch(endpoint);
                        
                        if (response.ok) {
                            authorsData = await response.json();
                            console.log(`Found working author endpoint: ${endpoint}`);
                            
                            // Format the data based on response structure
                            if (authorsData.authors) {
                                authors = authorsData.authors;
                            } else if (Array.isArray(authorsData)) {
                                authors = authorsData;
                            }
                            
                            if (authors.length > 0) {
                                break; // We found results, stop trying endpoints
                            } else {
                                console.log('Endpoint returned 0 authors, trying next endpoint');
                            }
                        } else {
                            console.warn(`Endpoint ${endpoint} failed with status ${response.status}`);
                        }
                    } catch (err) {
                        console.warn(`Error with endpoint ${endpoint}:`, err);
                    }
                }
                
                // If no search endpoints worked or returned results, try getting all authors as fallback
                if (authors.length === 0) {
                    console.log('No authors found via search endpoints, trying to fetch all authors');
                    try {
                        const allAuthorsResponse = await fetch('/api/authors/all');
                        
                        if (allAuthorsResponse.ok) {
                            const allAuthorsData = await allAuthorsResponse.json();
                            
                            // Filter authors by the search query manually
                            if (allAuthorsData.authors && Array.isArray(allAuthorsData.authors)) {
                                const lowerQuery = query.toLowerCase();
                                authors = allAuthorsData.authors.filter(author => {
                                    const fullName = (author.full_name || '').toLowerCase();
                                    const affiliation = (author.affiliation || '').toLowerCase();
                                    const spudId = (author.spud_id || '').toLowerCase();
                                    
                                    return fullName.includes(lowerQuery) || 
                                           affiliation.includes(lowerQuery) ||
                                           spudId.includes(lowerQuery);
                                });
                            }
                            
                            console.log(`Found ${authors.length} authors by filtering all authors`);
                        }
                    } catch (err) {
                        console.warn('Error fetching all authors:', err);
                    }
                }
                
                // Update dropdown with results
                dropdown.innerHTML = '';
                
                if (authors.length === 0) {
                    dropdown.innerHTML = '<div class="dropdown-item no-results">No authors found</div>';
                    
                    // Add option to create new author
                    if (query.length >= 3) {
                        const createItem = document.createElement('div');
                        createItem.className = 'dropdown-item create-new';
                        createItem.innerHTML = `<div class="item-name"><i class="fas fa-plus"></i> Create "${query}"</div>`;
                        
                        // Add click handler to create and select new author
                        createItem.addEventListener('click', () => {
                            this.selectAuthor('new', query, selectedContainerId);
                            dropdown.style.display = 'none';
                            inputElement.value = '';
                        });
                        
                        dropdown.appendChild(createItem);
                    }
                } else {
                    authors.forEach(author => {
                        const item = document.createElement('div');
                        item.className = 'dropdown-item';
                        item.dataset.id = author.id;
                        item.dataset.name = author.full_name || author.name;
                        
                        // Format with name and affiliation if available
                        let authorDisplay = `<div class="item-name">${author.full_name || author.name}</div>`;
                        if (author.affiliation) {
                            authorDisplay += `<div class="item-detail">${author.affiliation}</div>`;
                        }
                        if (author.spud_id) {
                            authorDisplay += `<div class="item-detail-small">ID: ${author.spud_id}</div>`;
                        }
                        
                        item.innerHTML = authorDisplay;
                        
                        // Add click handler to select the author
                        item.addEventListener('click', () => {
                            this.selectAuthor(author.id, author.full_name || author.name, selectedContainerId);
                            dropdown.style.display = 'none';
                            inputElement.value = '';
                        });
                        
                        dropdown.appendChild(item);
                    });
                }
                
                // Position dropdown directly under the input field
                dropdown.style.display = 'block';
            } catch (error) {
                console.error('Error searching authors:', error);
                dropdown.innerHTML = '<div class="dropdown-item error">Error searching authors</div>';
            }
        }, 300);
        
        // Add input event listener
        inputElement.addEventListener('input', (e) => {
            searchAuthors(e.target.value);
        });
        
        // Handle focus to reshow dropdown if there's a value
        inputElement.addEventListener('focus', () => {
            if (inputElement.value.length >= 2) {
                searchAuthors(inputElement.value);
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!inputElement.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    },
    
    // A dummy function for the fallback implementation
    dummyAuthorSearchInit: function(inputElement) {
        console.log('Using fallback author search implementation');
    },
    
    // Select an author and add to the selected list
    selectAuthor: function(authorId, authorName, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Check if author already selected
        const existingAuthor = container.querySelector(`.selected-author[data-id="${authorId}"]`);
        if (existingAuthor) return;
        
        // Create author element
        const authorElement = document.createElement('div');
        authorElement.className = 'selected-author';
        authorElement.dataset.id = authorId;
        authorElement.innerHTML = `
            ${authorName}
            <span class="remove-author" data-id="${authorId}">&times;</span>
        `;
        
        // Add to container
        container.appendChild(authorElement);
        
        // Add click handler to remove button
        const removeBtn = authorElement.querySelector('.remove-author');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                authorElement.remove();
            });
        }
    },
    
    // Initialize Research Agenda Search
    initializeResearchAgendaSearch: function(inputElement, selectedContainerId) {
        if (!inputElement) return;
        
        console.log('Initializing research agenda search input:', inputElement.id);
        
        // Create dropdown container
        const dropdownId = `${inputElement.id}-dropdown`;
        
        // First remove any existing dropdown to avoid duplicates
        const existingDropdown = document.getElementById(dropdownId);
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // Create new dropdown element with absolute positioning
        const dropdownContainer = document.createElement('div');
        dropdownContainer.style.position = 'relative';
        dropdownContainer.style.width = '100%';
        
        const dropdown = document.createElement('div');
        dropdown.id = dropdownId;
        dropdown.className = 'dropdown-list';
        dropdown.style.display = 'none';
        dropdownContainer.appendChild(dropdown);
        
        // Insert the dropdown container after the input element
        const parent = inputElement.parentNode;
        if (parent.nextSibling) {
            parent.parentNode.insertBefore(dropdownContainer, parent.nextSibling);
        } else {
            parent.parentNode.appendChild(dropdownContainer);
        }
        
        console.log(`Created research agenda dropdown with ID: ${dropdownId}`);
        
        // Debounce function for search delay
        const debounce = (func, delay) => {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        };
        
        // Search research agenda items as user types
        const searchAgendaItems = debounce(async (query) => {
            if (query.length < 2) {
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
                return;
            }
            
            // Show loading indicator
            dropdown.innerHTML = '<div class="dropdown-item loading"><i class="fas fa-spinner fa-spin"></i> Searching research agenda items...</div>';
            dropdown.style.display = 'block';
            
            try {
                // Try multiple potential research agenda endpoints
                let items = [];
                let response;
                
                // Define all potential endpoints to try
                let endpoints = [
                    `/research-agenda-items/search?q=${encodeURIComponent(query)}`,
                    `/api/research-agenda-items/search?q=${encodeURIComponent(query)}`,
                    `/document-research-agenda/search?q=${encodeURIComponent(query)}`
                ];
                
                // Try each endpoint until one works
                for (const endpoint of endpoints) {
                    try {
                        console.log(`Trying research agenda endpoint: ${endpoint}`);
                        response = await fetch(endpoint);
                        
                        if (response.ok) {
                            const data = await response.json();
                            console.log(`Found working research agenda endpoint: ${endpoint}`, data);
                            
                            // Format the data based on response structure
                            if (data.items) {
                                items = data.items;
                            } else if (Array.isArray(data)) {
                                items = data;
                            } else if (data.agendaItems) {
                                items = data.agendaItems;
                            }
                            
                            if (items.length > 0) {
                                break; // We found results, stop trying endpoints
                            } else {
                                console.log('Endpoint returned 0 items, trying next endpoint');
                            }
                        } else {
                            console.warn(`Endpoint ${endpoint} failed with status ${response.status}`);
                        }
                    } catch (err) {
                        console.warn(`Error with endpoint ${endpoint}:`, err);
                    }
                }
                
                // If no search endpoints worked or returned results, try getting all research agenda items
                if (items.length === 0) {
                    console.log('No items found via search endpoints, trying to fetch all research agenda items');
                    try {
                        // Try the all research agenda items endpoint
                        const allItemsResponse = await fetch('/research-agenda-items/search?q=');
                        
                        if (allItemsResponse.ok) {
                            const allItemsData = await allItemsResponse.json();
                            console.log('All research agenda items:', allItemsData);
                            
                            // Filter items by the search query manually
                            if (allItemsData.items && Array.isArray(allItemsData.items)) {
                                const lowerQuery = query.toLowerCase();
                                items = allItemsData.items.filter(item => {
                                    const name = (item.name || '').toLowerCase();
                                    const description = (item.description || '').toLowerCase();
                                    
                                    return name.includes(lowerQuery) || description.includes(lowerQuery);
                                });
                            } else if (Array.isArray(allItemsData)) {
                                const lowerQuery = query.toLowerCase();
                                items = allItemsData.filter(item => {
                                    const name = (item.name || '').toLowerCase();
                                    const description = (item.description || '').toLowerCase();
                                    
                                    return name.includes(lowerQuery) || description.includes(lowerQuery);
                                });
                            }
                            
                            console.log(`Found ${items.length} research agenda items by filtering all items`);
                        }
                    } catch (err) {
                        console.warn('Error fetching all research agenda items:', err);
                    }
                }
                
                // Update dropdown with results
                dropdown.innerHTML = '';
                
                // Always add option to create a new item
                const exactMatchFound = items.some(item => 
                    (item.name || '').toLowerCase() === query.toLowerCase()
                );
                
                if (items.length > 0) {
                    items.forEach(item => {
                        const dropdownItem = document.createElement('div');
                        dropdownItem.className = 'dropdown-item';
                        dropdownItem.dataset.id = item.id;
                        dropdownItem.dataset.name = item.name;
                        
                        // Add item details including description if available
                        let itemDisplay = `<div class="item-name">${item.name}</div>`;
                        if (item.description) {
                            itemDisplay += `<div class="item-detail">${item.description}</div>`;
                        }
                        
                        dropdownItem.innerHTML = itemDisplay;
                        
                        // Add click handler to select the item
                        dropdownItem.addEventListener('click', () => {
                            this.selectResearchAgendaItem(item.id, item.name, selectedContainerId);
                            dropdown.style.display = 'none';
                            inputElement.value = '';
                        });
                        
                        dropdown.appendChild(dropdownItem);
                    });
                } else {
                    dropdown.innerHTML = '<div class="dropdown-item no-results">No research agenda items found</div>';
                }
                
                // If no exact match found, add option to create new item 
                if (!exactMatchFound && query.length >= 3) {
                    const createItem = document.createElement('div');
                    createItem.className = 'dropdown-item create-new';
                    createItem.innerHTML = `<div class="item-name"><i class="fas fa-plus"></i> Create "${query}"</div>`;
                    
                    // Add click handler to create and select new item
                    createItem.addEventListener('click', () => {
                        this.selectResearchAgendaItem('new', query, selectedContainerId);
                        dropdown.style.display = 'none';
                        inputElement.value = '';
                    });
                    
                    dropdown.appendChild(createItem);
                }
                
                // Position dropdown directly under the input field
                dropdown.style.display = 'block';
            } catch (error) {
                console.error('Error searching research agenda items:', error);
                dropdown.innerHTML = '<div class="dropdown-item error">Error searching</div>';
            }
        }, 300);
        
        // Add input event listener
        inputElement.addEventListener('input', (e) => {
            searchAgendaItems(e.target.value);
        });
        
        // Handle focus to reshow dropdown if there's a value
        inputElement.addEventListener('focus', () => {
            if (inputElement.value.length >= 2) {
                searchAgendaItems(inputElement.value);
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!inputElement.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    },
    
    // Create and select a new research agenda item
    createAndSelectResearchAgenda: async function(name, containerId) {
        if (!name.trim()) return;
        
        try {
            // Create the new research agenda item - FIX: Use correct endpoint path
            const response = await fetch('/research-agenda-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: name.trim() })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to create research agenda item: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Created new research agenda item:', result);
            
            // Select the newly created item
            this.selectResearchAgenda(result.id || 'new', name.trim(), containerId);
        } catch (error) {
            console.error('Error creating research agenda item:', error);
            alert('Error creating research agenda item. Please try again.');
            
            // Still select it with a temporary ID
            this.selectResearchAgenda('new', name.trim(), containerId);
        }
    },
    
    // Select a research agenda item and add to the selected list
    selectResearchAgendaItem: function(itemId, itemName, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Check if item already selected
        const existingItem = container.querySelector(`.selected-topic[data-id="${itemId}"]`);
        if (existingItem) return;
        
        // Create item element
        const itemElement = document.createElement('div');
        itemElement.className = 'selected-topic';
        itemElement.dataset.id = itemId;
        itemElement.innerHTML = `
            ${itemName}
            <span class="remove-topic" data-id="${itemId}">&times;</span>
        `;
        
        // Add to container
        container.appendChild(itemElement);
        
        // Add click handler to remove button
        const removeBtn = itemElement.querySelector('.remove-topic');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                itemElement.remove();
            });
        }
    },
};

// Initialize document edit components when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing document edit functionality');
    
    // Set up global functions for use in other scripts
    window.showEditModal = window.documentEdit.showEditModal.bind(window.documentEdit);
    window.showCompiledEditModal = window.documentEdit.showCompiledEditModal.bind(window.documentEdit);
    
    // Create a fallback author search function if the main one isn't available
    if (typeof window.initAuthorSearchInput !== 'function') {
        console.log('Author search function not found, creating fallback implementation');
        window.initAuthorSearchInput = function(inputElement) {
            // This is a simplified fallback implementation
            console.log('Using fallback author search implementation');
            // The document edit module will use its own implementation
        };
    }
}); 