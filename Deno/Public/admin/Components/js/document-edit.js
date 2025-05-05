/**
 * Document edit functionality
 * Handles editing of existing documents
 */

console.log('Document edit module loaded');

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
            this.fetchDocumentData(documentId)
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
            this.fetchDocumentData(documentId)
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
    
    // Fetch document data from the API
    fetchDocumentData: function(documentId) {
        console.log(`Fetching document data for ID: ${documentId}`);
        
        // Try both endpoints available in the system
        const endpoints = [
            `/api/documents/${documentId}`,
            `/api/document/${documentId}` // Alternate endpoint format
        ];
        
        // Try the first endpoint, fallback to the second if needed
        return fetch(endpoints[0])
            .then(response => {
                if (!response.ok) {
                    console.log(`First endpoint failed with status ${response.status}, trying alternate endpoint...`);
                    return fetch(endpoints[1]);
                }
                return response;
            })
            .then(response => {
                if (!response.ok) {
                    // If we got here, both endpoints failed
                    throw new Error(`Failed to fetch document: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Document data fetched successfully:`, data);
                // If the response is empty or doesn't have the expected structure,
                // create a default object with the document ID
                if (!data || Object.keys(data).length === 0) {
                    console.warn(`Empty data returned for document ${documentId}, using defaults`);
                    return {
                        id: documentId,
                        title: 'Untitled Document',
                        document_type: '',
                        date_published: new Date().toISOString(),
                        abstract: '',
                        authors: [],
                        research_agenda: []
                    };
                }
                
                // Fetch authors information separately if not included
                const fetchAuthorsPromise = (!data.authors || !Array.isArray(data.authors) || data.authors.length === 0) 
                    ? this.fetchAuthorsForDocument(documentId)
                    : Promise.resolve(data.authors);
                
                // Fetch research agenda separately if not included
                const fetchResearchAgendaPromise = (!data.research_agenda || !Array.isArray(data.research_agenda)) 
                    ? this.fetchResearchAgendaForDocument(documentId)
                    : Promise.resolve(data.research_agenda);
                
                // Wait for both promises to resolve
                return Promise.all([fetchAuthorsPromise, fetchResearchAgendaPromise])
                    .then(([authors, researchAgenda]) => {
                        // Merge the data
                        return {
                            ...data,
                            authors: authors || [],
                            research_agenda: researchAgenda || []
                        };
                    });
            });
    },
    
    // Fetch authors for a document separately
    fetchAuthorsForDocument: function(documentId) {
        console.log(`Fetching authors for document ${documentId}`);
        return fetch(`/api/document-authors/${documentId}`)
            .then(response => {
                if (!response.ok) {
                    console.warn(`Failed to fetch authors for document ${documentId}: ${response.status}`);
                    return [];
                }
                return response.json();
            })
            .then(data => {
                console.log(`Authors data for document ${documentId}:`, data);
                return data.authors || [];
            })
            .catch(error => {
                console.error(`Error fetching authors for document ${documentId}:`, error);
                return [];
            });
    },
    
    // Fetch research agenda for a document separately
    fetchResearchAgendaForDocument: function(documentId) {
        console.log(`Fetching research agenda for document ${documentId}`);
        
        // Try the junction table endpoint first
        return fetch(`/document-research-agenda/${documentId}`)
            .then(response => {
                if (!response.ok) {
                    console.warn(`No research agenda found in primary endpoint for document ${documentId}: ${response.status}`);
                    // If that fails, try the old endpoint that fetches from research_agenda table directly
                    return fetch(`/api/research-agenda/by-document/${documentId}`)
                        .then(oldResponse => {
                            if (!oldResponse.ok) {
                                console.warn(`No research agenda found in backup endpoint for document ${documentId}: ${oldResponse.status}`);
                                return [];
                            }
                            return oldResponse.json();
                        })
                        .catch(error => {
                            console.error(`Error checking backup research agenda endpoint: ${error}`);
                            return [];
                        });
                }
                return response.json();
            })
            .then(data => {
                console.log(`Research agenda data for document ${documentId}:`, data);
                // Handle different data formats from different endpoints
                if (Array.isArray(data)) {
                    // Old format - direct array of items
                    if (data.length > 0 && data[0].agenda_item) {
                        return data.map(item => item.agenda_item);
                    }
                    // New format - array of research agenda items
                    if (data.length > 0 && data[0].name) {
                        return data.map(item => item.name);
                    }
                } else if (data.agenda_items && Array.isArray(data.agenda_items)) {
                    // Possible wrapper format
                    return data.agenda_items;
                }
                return [];
            })
            .catch(error => {
                console.error(`Error fetching research agenda for document ${documentId}: ${error}`);
                return [];
            });
    },
    
    // Populate the edit form with document data
    populateEditForm: function(data) {
        // Set form values
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
        
        // Populate authors (assuming data.authors is an array of author objects)
        const selectedAuthorsContainer = document.getElementById('edit-single-document-selected-authors');
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
        const selectedTopicsContainer = document.getElementById('edit-single-document-selected-topics');
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
        
        // Populate preview section
        document.getElementById('edit-single-document-preview-title').textContent = data.title || 'Document Title';
        document.getElementById('edit-single-document-preview-type').textContent = data.document_type || '-';
        document.getElementById('edit-single-document-preview-date').textContent = data.date_published ? new Date(data.date_published).toLocaleDateString() : '-';
        
        // The abstract element in the preview might not exist since we reorganized the UI
        const abstractElement = document.getElementById('edit-single-document-preview-abstract');
        if (abstractElement) {
            abstractElement.textContent = data.abstract || 'No abstract available.';
        }
        
        // Set author text
        if (data.authors && Array.isArray(data.authors) && data.authors.length > 0) {
            const authorNames = data.authors.map(a => a.full_name || a.name || a).join(', ');
            document.getElementById('edit-single-document-preview-author').innerHTML = `<i class="fas fa-user"></i> ${authorNames}`;
        } else {
            document.getElementById('edit-single-document-preview-author').innerHTML = `<i class="fas fa-user"></i> No authors`;
        }
        
        // Set research agenda text (renamed from topics)
        if (data.research_agenda && Array.isArray(data.research_agenda) && data.research_agenda.length > 0) {
            const agendaNames = data.research_agenda.map(t => t.name || t).join(', ');
            document.getElementById('edit-single-document-preview-topics').textContent = agendaNames;
        } else {
            document.getElementById('edit-single-document-preview-topics').textContent = '-';
        }
        
        // Set document type icon
        const typeIcon = document.getElementById('edit-single-document-type-icon');
        if (typeIcon) {
            const iconPath = this.getDocumentTypeIcon(data.document_type);
            typeIcon.src = iconPath;
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
        this.fetchDocumentData(parentId).then(data => {
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
    
    // Save document changes
    saveDocument: function(formData) {
        const documentId = formData.get('document_id');
        console.log('Saving document:', documentId);
        
        // Gather selected authors
        const selectedAuthors = [];
        document.querySelectorAll('#edit-single-document-selected-authors .selected-author').forEach(element => {
            selectedAuthors.push({
                id: element.dataset.id,
                full_name: element.textContent.trim().replace('×', '')
            });
        });
        
        // Gather selected research agenda items
        const selectedResearchAgenda = [];
        document.querySelectorAll('#edit-single-document-selected-topics .selected-topic').forEach(element => {
            selectedResearchAgenda.push(element.textContent.trim().replace('×', ''));
        });
        
        // Prepare document data
        const documentData = {
            title: formData.get('title'),
            document_type: formData.get('document_type'),
            date_published: formData.get('date_published'),
            authors: selectedAuthors.map(author => author.id)
        };
        
        // Update document
        fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => Promise.reject(data.error || 'Failed to update document'));
            }
            return response.json();
        })
        .then(data => {
            console.log('Document updated:', data);
            
            // Now save research agenda items to both endpoints
            if (selectedResearchAgenda.length > 0) {
                // First try the old endpoint for backward compatibility
                fetch(`/document-research-agenda`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        document_id: documentId,
                        agenda_items: selectedResearchAgenda
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        console.warn('Warning: Research agenda items may not have been saved correctly to old endpoint');
                    }
                })
                .catch(error => {
                    console.error('Error saving research agenda items to old endpoint:', error);
                });
                
                // Now also use the new linkage endpoint that creates entries in the junction table
                fetch(`/api/document-research-agenda/link`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        document_id: documentId,
                        agenda_items: selectedResearchAgenda
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        console.warn('Warning: Failed to link research agenda items in junction table');
                        return response.json().then(data => Promise.reject(data.error || 'Failed to link research agenda items'));
                    }
                    return response.json();
                })
                .then(result => {
                    console.log('Research agenda linking result:', result);
                })
                .catch(error => {
                    console.error('Error linking research agenda items:', error);
                });
            }
            
            // Show success message
            this.showSaveSuccess();
            
            // Hide modal
            this.hideModal('edit-single-document-modal');
            
            // Refresh document list if available
            if (window.documentList && typeof window.documentList.loadDocuments === 'function') {
                window.documentList.loadDocuments(1, true);
            }
        })
        .catch(error => {
            console.error('Save error:', error);
            this.showSaveError(error);
        });
    },
    
    // Save compiled document changes
    saveCompiledDocument: function(formData) {
        const documentId = formData.get('document_id');
        console.log('Saving compiled document:', documentId);
        
        // Gather selected authors
        const selectedAuthors = [];
        document.querySelectorAll('#edit-compiled-document-selected-authors .selected-author').forEach(element => {
            selectedAuthors.push({
                id: element.dataset.id,
                full_name: element.textContent.trim().replace('×', '')
            });
        });
        
        // Gather selected research agenda items
        const selectedResearchAgenda = [];
        document.querySelectorAll('#edit-compiled-document-selected-topics .selected-topic').forEach(element => {
            selectedResearchAgenda.push(element.textContent.trim().replace('×', ''));
        });
        
        // Prepare document data
        const documentData = {
            title: formData.get('title'),
            document_type: formData.get('document_type'),
            date_published: formData.get('date_published'),
            authors: selectedAuthors.map(author => author.id)
        };
        
        // Update document
        fetch(`/api/compiled-documents/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => Promise.reject(data.error || 'Failed to update document'));
            }
            return response.json();
        })
        .then(data => {
            console.log('Compiled document updated:', data);
            
            // Now save research agenda items to both endpoints
            if (selectedResearchAgenda.length > 0) {
                // First try the old endpoint for backward compatibility
                fetch(`/document-research-agenda`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        document_id: documentId,
                        agenda_items: selectedResearchAgenda
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        console.warn('Warning: Research agenda items may not have been saved correctly to old endpoint');
                    }
                })
                .catch(error => {
                    console.error('Error saving research agenda items to old endpoint:', error);
                });
                
                // Now also use the new linkage endpoint that creates entries in the junction table
                fetch(`/api/document-research-agenda/link`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        document_id: documentId,
                        agenda_items: selectedResearchAgenda
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        console.warn('Warning: Failed to link research agenda items in junction table');
                        return response.json().then(data => Promise.reject(data.error || 'Failed to link research agenda items'));
                    }
                    return response.json();
                })
                .then(result => {
                    console.log('Research agenda linking result:', result);
                })
                .catch(error => {
                    console.error('Error linking research agenda items:', error);
                });
            }
            
            // Show success message
            this.showSaveSuccess();
            
            // Hide modal
            this.hideModal('edit-compiled-document-modal');
            
            // Refresh document list if available
            if (window.documentList && typeof window.documentList.loadDocuments === 'function') {
                window.documentList.loadDocuments(1, true);
            }
        })
        .catch(error => {
            console.error('Save error:', error);
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
    }
};

// Initialize document edit components when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing document edit functionality');
    
    // Set up global functions for use in other scripts
    window.showEditModal = window.documentEdit.showEditModal.bind(window.documentEdit);
    window.showCompiledEditModal = window.documentEdit.showCompiledEditModal.bind(window.documentEdit);
}); 