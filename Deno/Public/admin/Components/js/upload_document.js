/**
 * Upload Document JavaScript - Handles form submission and API integration
 */

document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const singleDocForm = document.getElementById('uploadSingleForm');
    const compiledDocForm = document.getElementById('uploadCompiledForm');
    
    // Initialize the Read Document button in disabled state
    const readDocBtn = document.querySelector('#singleDocPreview button');
    if (readDocBtn) {
        // Ensure initial state is correct (not filled)
        readDocBtn.classList.remove('text-white', 'bg-primary', 'hover:bg-primary-dark', 'border-transparent');
        readDocBtn.classList.add('text-primary-dark', 'bg-white', 'border-primary');
        readDocBtn.disabled = true;
        
        readDocBtn.addEventListener('click', function(e) {
            // If button is disabled, prevent default action and show message
            if (this.disabled) {
                e.preventDefault();
                alert('Please upload a document first');
                return false;
            }
        });
    }
    
    // Initialize file upload listeners
    initializeFileUpload();
    
    // Form submission handlers
    if (singleDocForm) {
        singleDocForm.addEventListener('submit', handleSingleDocumentSubmit);
        
        // Add input event listeners to update preview in real-time
        const titleInput = singleDocForm.querySelector('input[name="title"]');
        const authorInput = singleDocForm.querySelector('input[name="author"]');
        
        if (titleInput) {
            titleInput.addEventListener('input', function() {
                const previewTitle = document.getElementById('previewTitle');
                if (previewTitle) {
                    previewTitle.textContent = this.value || 'Document Title';
                }
            });
        }
        
        if (authorInput) {
            authorInput.addEventListener('input', function() {
                const previewAuthor = document.getElementById('previewAuthor');
                if (previewAuthor) {
                    previewAuthor.textContent = this.value ? `by ${this.value}` : 'by Unknown Author';
                }
            });
        }
    }
    
    if (compiledDocForm) {
        compiledDocForm.addEventListener('submit', handleCompiledDocumentSubmit);
    }
    
    // Initialize category change listener to update preview in real-time
    const categoryInput = document.getElementById('single-category');
    if (categoryInput) {
        // Update category in preview when selected
        categoryInput.addEventListener('change', function() {
            const previewCategory = document.getElementById('previewCategory');
            if (previewCategory) {
                const selectedOption = this.options[this.selectedIndex];
                previewCategory.textContent = (this.value && selectedOption.text !== 'Choose a category') 
                    ? selectedOption.text 
                    : 'N/A';
            }
            // Also update icon
            updatePreviewIcon(this.value);
        });
        
        // Initialize the preview with current selection
        const previewCategory = document.getElementById('previewCategory');
        if (previewCategory && categoryInput.value) {
            const selectedOption = categoryInput.options[categoryInput.selectedIndex];
            previewCategory.textContent = (categoryInput.value && selectedOption.text !== 'Choose a category') 
                ? selectedOption.text 
                : 'N/A';
        }
        
        // Initial icon update
        updatePreviewIcon(categoryInput.value);
    }
    
    // Set current date for added date
    const previewAddedDate = document.getElementById('previewAddedDate');
    if (previewAddedDate) {
        const today = new Date();
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        previewAddedDate.textContent = today.toLocaleDateString('en-US', dateOptions);
    }
    
    // Initialize publication date preview updates
    const pubMonthInput = document.getElementById('single-pubMonth');
    const pubYearInput = document.getElementById('single-pubYear');
    
    if (pubMonthInput && pubYearInput) {
        const updatePublicationDate = function() {
            const previewPubDate = document.getElementById('previewPubDate');
            if (!previewPubDate) return;
            
            let pubDateText = 'N/A';
            const month = pubMonthInput.options[pubMonthInput.selectedIndex].text;
            const year = pubYearInput.value;
            
            if (month !== 'Select Month' && year) {
                pubDateText = `${month} ${year}`;
            } else if (month !== 'Select Month') {
                pubDateText = month;
            } else if (year) {
                pubDateText = year;
            }
            
            previewPubDate.textContent = pubDateText;
        };
        
        pubMonthInput.addEventListener('change', updatePublicationDate);
        pubYearInput.addEventListener('input', updatePublicationDate);
    }
    
    // Handle compiled document category change
    const compiledCategory = document.getElementById('compiled-category');
    if (compiledCategory) {
        compiledCategory.addEventListener('change', function() {
            updateCompiledPreviewIcon(this.value);
        });
    }
    
    // File drag and drop handling for single document
    const singleDropZone = document.getElementById('single-dropZone');
    const singleFileInput = document.getElementById('single-file-upload');
    
    if (singleDropZone && singleFileInput) {
        // Highlight drop area when dragging over it
        singleDropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('border-primary');
        });
        
        singleDropZone.addEventListener('dragleave', function() {
            this.classList.remove('border-primary');
        });
        
        // Handle file drop
        singleDropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('border-primary');
            
            if (e.dataTransfer.files.length > 0) {
                singleFileInput.files = e.dataTransfer.files;
                const fileNameDisplay = document.getElementById('single-fileNameDisplay');
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = e.dataTransfer.files[0].name;
                }
                
                // Update the document preview with the file
                updateDocumentPreview(e.dataTransfer.files[0]);
            }
        });
    }
    
    // Call the update functions on page load to set initial icons
    const singleCategoryInitial = categoryInput ? categoryInput.value : '';
    updatePreviewIcon(singleCategoryInitial);
    
    const compiledCategoryInitial = compiledCategory ? compiledCategory.value : '';
    updateCompiledPreviewIcon(compiledCategoryInitial);
});

/**
 * Initialize file upload functionality
 */
function initializeFileUpload() {
    // Handle drag and drop for single document
    const singleDropZone = document.getElementById('single-dropZone');
    const singleFileInput = document.getElementById('single-file-upload');
    
    if (singleDropZone && singleFileInput) {
        // Drag events for single document upload
        singleDropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            singleDropZone.classList.add('drag-over');
        });
        
        singleDropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            singleDropZone.classList.remove('drag-over');
        });
        
        singleDropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            singleDropZone.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length) {
                singleFileInput.files = e.dataTransfer.files;
                
                // Update display
                const fileNameDisplay = document.getElementById('single-fileNameDisplay');
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = e.dataTransfer.files[0].name;
                }
                
                // Update preview button to indicate file is selected
                updateFileSelectedUI('single-file-upload', true, e.dataTransfer.files[0].name);
                
                // Update the document preview with the file
                updateDocumentPreview(e.dataTransfer.files[0]);
            }
        });
        
        // Listen for changes to file input
        singleFileInput.addEventListener('change', function(e) {
            if (this.files.length > 0) {
                // Update preview button to indicate file is selected
                updateFileSelectedUI('single-file-upload', true, this.files[0].name);
                
                // Update the document preview with the file
                updateDocumentPreview(this.files[0]);
            } else {
                // Reset preview if no file is selected
                updateFileSelectedUI('single-file-upload', false);
                updateDocumentPreview(null);
            }
        });
    }
    
    // Initialize file input change handlers for compiled document
    document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', function(e) {
            const fileNameDisplay = this.closest('.file-input-area').querySelector('.file-name-display');
            if (fileNameDisplay && this.files.length > 0) {
                fileNameDisplay.textContent = this.files[0].name;
            }
        });
    });
}

/**
 * Update the UI to reflect file selection status
 * @param {string} fileInputId The ID of the file input element
 * @param {boolean} isSelected Whether a file is selected
 * @param {string} fileName The name of the selected file (if any)
 */
function updateFileSelectedUI(fileInputId, isSelected, fileName = '') {
    const fileInputContainer = document.getElementById(`${fileInputId}Container`);
    if (!fileInputContainer) return;
    
    const fileUploadButton = fileInputContainer.querySelector('.file-upload-button');
    const fileUploadText = fileInputContainer.querySelector('.file-upload-text');
    const fileUploadIcon = fileInputContainer.querySelector('.file-upload-icon');
    
    if (isSelected) {
        // File is selected - update UI to show active state
        fileInputContainer.classList.add('file-selected');
        fileInputContainer.classList.remove('drag-over');
        
        if (fileUploadButton) {
            fileUploadButton.classList.add('bg-success', 'bg-opacity-10', 'border-success');
            fileUploadButton.classList.remove('bg-gray-50', 'border-dashed');
        }
        
        if (fileUploadText) {
            fileUploadText.textContent = 'File selected';
            fileUploadText.classList.add('text-success');
        }
        
        if (fileUploadIcon) {
            fileUploadIcon.setAttribute('data-lucide', 'check-circle');
            fileUploadIcon.classList.add('text-success');
        }
        
        // Add filename display if it doesn't exist
        let filenameElement = fileInputContainer.querySelector('.selected-filename');
        if (!filenameElement && fileName) {
            filenameElement = document.createElement('div');
            filenameElement.className = 'selected-filename text-sm mt-2 font-medium text-gray-700';
            filenameElement.textContent = fileName;
            fileInputContainer.appendChild(filenameElement);
        } else if (filenameElement && fileName) {
            filenameElement.textContent = fileName;
        }
    } else {
        // No file selected - reset to default state
        fileInputContainer.classList.remove('file-selected', 'drag-over');
        
        if (fileUploadButton) {
            fileUploadButton.classList.remove('bg-success', 'bg-opacity-10', 'border-success');
            fileUploadButton.classList.add('bg-gray-50', 'border-dashed');
        }
        
        if (fileUploadText) {
            fileUploadText.textContent = 'Click to upload or drag and drop';
            fileUploadText.classList.remove('text-success');
        }
        
        if (fileUploadIcon) {
            fileUploadIcon.setAttribute('data-lucide', 'upload-cloud');
            fileUploadIcon.classList.remove('text-success');
        }
        
        // Remove filename display if it exists
        const filenameElement = fileInputContainer.querySelector('.selected-filename');
        if (filenameElement) {
            fileInputContainer.removeChild(filenameElement);
        }
    }
    
    // Re-render Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
}

/**
 * Handle single document form submission
 * @param {Event} e Form submit event
 */
async function handleSingleDocumentSubmit(e) {
    e.preventDefault();
    
    try {
        // Show loading state
        showLoading('Uploading document...');
        
        // Get form data
        const formData = new FormData(e.target);
        
        // Get file
        const fileInput = document.getElementById('single-file-upload');
        if (fileInput.files.length === 0) {
            showError('Please select a file to upload');
            return;
        }
        
        // Prepare document data
        const categorySelect = document.getElementById('single-category');
        const categoryValue = categorySelect.value;
        
        let documentType;
        let categoryId = null;
        
        if (categoryValue === 'Thesis') {
            documentType = 'THESIS';
            categoryId = 1; // Set the appropriate category ID for Thesis
        } else if (categoryValue === 'Dissertation') {
            documentType = 'DISSERTATION';
            categoryId = 2; // Set the appropriate category ID for Dissertation
        } else {
            throw new Error('Invalid document type');
        }
        
        // First upload the file
        const file = fileInput.files[0];
        const fileData = new FormData();
        fileData.append('file', file);
        
        // Set the storage path based on document type
        let storagePath = 'storage/single/';
        
        if (categoryValue === 'Thesis') {
            storagePath += 'thesis/';
        } else if (categoryValue === 'Dissertation') {
            storagePath += 'dissertation/';
        }
        
        // Add storage path to the form data
        fileData.append('storagePath', storagePath);
        
        // Upload file first
        const fileUploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: fileData
        });
        
        if (!fileUploadResponse.ok) {
            const errorData = await fileUploadResponse.json();
            throw new Error(errorData.error || 'Failed to upload file');
        }
        
        const fileResult = await fileUploadResponse.json();
        const filePath = fileResult.filePath;
        
        // Create publication date from month and year if both exist
        const pubMonth = formData.get('pubMonth');
        const pubYear = formData.get('pubYear');
        let publicationDate = null;
        
        if (pubMonth && pubYear) {
            publicationDate = `${pubYear}-${pubMonth}-01`; // Use first day of month
        }
        
        // Get metadata from upload result if available
        let abstract = 'Extracting abstract from file...';
        let pageCount = 0;
        
        if (fileResult.metadata && fileResult.fileType === 'pdf') {
            console.log('Using extracted PDF metadata:', fileResult.metadata);
            abstract = fileResult.metadata.abstract || abstract;
            pageCount = fileResult.metadata.pageCount || 0;
        }
        
        // Create document object
        const documentData = {
            title: formData.get('title'),
            abstract: abstract,
            publication_date: publicationDate,
            file_path: filePath,
            is_public: true, // Default to public
            document_type: documentType,
            research_agenda: formData.get('researchAgenda') || null,
            category_id: categoryId,
            page_count: pageCount
        };
        
        // Update the preview with the document data
        updateDocumentPreview(fileResult);
        
        // Save document to database
        const documentResponse = await fetch('/documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        });
        
        if (!documentResponse.ok) {
            const errorData = await documentResponse.json();
            throw new Error(errorData.error || 'Failed to save document');
        }
        
        const result = await documentResponse.json();
        
        // Save author information
        if (formData.get('author')) {
            const authors = formData.get('author').split(';').map(name => name.trim()).filter(name => name !== '');
            
            if (authors.length > 0) {
                const authorData = {
                    document_id: result.id,
                    authors: authors
                };
                
                // Send authors to the document-authors endpoint
                const authorResponse = await fetch('/document-authors', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(authorData)
                });
                
                if (!authorResponse.ok) {
                    console.warn('Warning: Authors may not have been saved correctly');
                }
            }
        }
        
        // Save research agenda items if provided
        if (formData.get('researchAgenda')) {
            const researchAgendaItems = formData.get('researchAgenda').split(',').map(item => item.trim()).filter(item => item !== '');
            
            if (researchAgendaItems.length > 0) {
                const researchAgendaData = {
                    document_id: result.id,
                    agenda_items: researchAgendaItems
                };
                
                // Send research agenda items to the document-research-agenda endpoint
                const researchAgendaResponse = await fetch('/document-research-agenda', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(researchAgendaData)
                });
                
                if (!researchAgendaResponse.ok) {
                    console.warn('Warning: Research agenda items may not have been saved correctly');
                }
            }
        }
        
        // Show success
        showSuccess('Document uploaded successfully!', function() {
            // Redirect back to upload document page
            window.location.href = 'upload_document.html';
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        showError(error.message || 'An error occurred during upload');
    } finally {
        hideLoading();
    }
}

/**
 * Handle compiled document form submission
 * @param {Event} e Form submit event
 */
async function handleCompiledDocumentSubmit(e) {
    e.preventDefault();
    
    try {
        // Show loading state
        showLoading('Uploading compiled document...');
        
        // Get form data
        const formData = new FormData(e.target);
        
        // Get category
        const categorySelect = document.getElementById('compiled-category');
        const categoryValue = categorySelect.value;
        
        let documentType;
        let compiledStoragePath = 'storage/compiled/';
        let categoryId = null;
        
        if (categoryValue === 'Confluence') {
            documentType = 'CONFLUENCE';
            compiledStoragePath += 'confluence/';
            categoryId = 3; // Set the appropriate category ID for Confluence
        } else if (categoryValue === 'Synergy') {
            documentType = 'SYNERGY';
            compiledStoragePath += 'synergy/';
            categoryId = 4; // Set the appropriate category ID for Synergy
        } else {
            throw new Error('Invalid document type');
        }
        
        // Create compiled document data
        const compiledDocumentData = {
            title: `${categoryValue} ${formData.get('volume') || ''} ${formData.get('issued-no') || ''}`.trim(),
            start_year: formData.get('pub-year-start') || null,
            end_year: formData.get('pub-year-end') || null,
            volume: formData.get('volume') || null,
            issue: formData.get('issued-no') || null,
            is_public: true,
            document_type: documentType,
            file_path: compiledStoragePath, // Store the path to the compiled document folder
            category_id: categoryId
        };
        
        // Save compiled document to database
        const documentResponse = await fetch('/documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(compiledDocumentData)
        });
        
        if (!documentResponse.ok) {
            const errorData = await documentResponse.json();
            throw new Error(errorData.error || 'Failed to save compiled document');
        }
        
        const compiledResult = await documentResponse.json();
        const compiledDocumentId = compiledResult.id;
        
        // Process each research section
        const researchSections = document.querySelectorAll('.research-section');
        const studyPromises = [];
        
        for (const section of researchSections) {
            const sectionId = section.dataset.sectionId;
            const titleInput = section.querySelector(`#study-title-${sectionId}`);
            const authorsInput = section.querySelector(`#authors-${sectionId}`);
            const researchAgendaInput = section.querySelector(`#research-agenda-${sectionId}`);
            const fileInput = section.querySelector(`input[type="file"]`);
            
            if (!titleInput || !titleInput.value) {
                continue; // Skip if no title
            }
            
            if (!fileInput || fileInput.files.length === 0) {
                throw new Error(`Please attach a file for "${titleInput.value}"`);
            }
            
            // Upload file
            const file = fileInput.files[0];
            const fileData = new FormData();
            fileData.append('file', file);
            
            // Store study files in the same location as the parent document
            fileData.append('storagePath', compiledStoragePath + 'studies/');
            
            const fileUploadPromise = fetch('/api/upload', {
                method: 'POST',
                body: fileData
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.error || `Failed to upload file for "${titleInput.value}"`);
                    });
                }
                return response.json();
            })
            .then(fileResult => {
                // Create study document that is linked to the compiled document
                const studyData = {
                    title: titleInput.value,
                    file_path: fileResult.filePath,
                    is_public: true,
                    document_type: 'THESIS', // Default to thesis
                    parent_document_id: compiledDocumentId,
                    category_id: 1, // Default to thesis category ID
                    page_count: 0,
                    abstract: 'Study within compiled document'
                };
                
                // If metadata was extracted, use it
                if (fileResult.metadata && fileResult.fileType === 'pdf') {
                    studyData.abstract = fileResult.metadata.abstract || studyData.abstract;
                    studyData.page_count = fileResult.metadata.pageCount || 0;
                }
                
                // Save study to database
                return fetch('/documents', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(studyData)
                });
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.error || `Failed to save study "${titleInput.value}"`);
                    });
                }
                return response.json();
            })
            .then(studyResult => {
                const promises = [];
                
                // Save author information if provided
                if (authorsInput && authorsInput.value) {
                    const authors = authorsInput.value.split(';')
                        .map(name => name.trim())
                        .filter(name => name !== '');
                    
                    if (authors.length > 0) {
                        const authorData = {
                            document_id: studyResult.id,
                            authors: authors
                        };
                        
                        const authorPromise = fetch('/document-authors', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(authorData)
                        })
                        .then(response => {
                            if (!response.ok) {
                                console.warn(`Warning: Authors may not have been saved correctly for "${titleInput.value}"`);
                            }
                            return response;
                        });
                        
                        promises.push(authorPromise);
                    }
                }
                
                // Save research agenda items if provided
                if (researchAgendaInput && researchAgendaInput.value) {
                    const researchAgendaItems = researchAgendaInput.value.split(',')
                        .map(item => item.trim())
                        .filter(item => item !== '');
                    
                    if (researchAgendaItems.length > 0) {
                        const researchAgendaData = {
                            document_id: studyResult.id,
                            agenda_items: researchAgendaItems
                        };
                        
                        const researchAgendaPromise = fetch('/document-research-agenda', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(researchAgendaData)
                        })
                        .then(response => {
                            if (!response.ok) {
                                console.warn(`Warning: Research agenda items may not have been saved correctly for "${titleInput.value}"`);
                            }
                            return response;
                        });
                        
                        promises.push(researchAgendaPromise);
                    }
                }
                
                return Promise.all(promises);
            });
            
            studyPromises.push(fileUploadPromise);
        }
        
        // Wait for all studies to be processed
        await Promise.all(studyPromises);
        
        // Show success
        showSuccess('Compiled document uploaded successfully!', function() {
            // Redirect back to upload document page
            window.location.href = 'upload_document.html';
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        showError(error.message || 'An error occurred during upload');
    } finally {
        hideLoading();
    }
}

/**
 * Show loading message
 * @param {string} message Loading message to display
 */
function showLoading(message = 'Processing...') {
    // Check if loading overlay already exists
    let loadingOverlay = document.getElementById('loadingOverlay');
    
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50';
        loadingOverlay.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto">
                <div class="flex items-center space-x-4">
                    <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span id="loadingMessage" class="text-gray-700 text-lg font-medium">${message}</span>
                </div>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    } else {
        document.getElementById('loadingMessage').textContent = message;
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * Hide loading message
 */
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * Show error message
 * @param {string} message Error message to display
 */
function showError(message) {
    Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10B981'
    });
}

/**
 * Show success message
 * @param {string} message Success message to display
 * @param {Function} callback Optional callback function to execute on confirmation
 */
function showSuccess(message, callback) {
    Swal.fire({
        title: 'Success',
        text: message,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10B981'
    }).then(result => {
        if (result.isConfirmed && callback) {
            callback();
        }
    });
}

// Function to update preview icon based on document category
function updatePreviewIcon(category) {
    const previewIcon = document.getElementById('preview-category-icon');
    if (!previewIcon) return;
    
    let iconPath = 'icons/category-icons/default_category_icon.png';
    
    // Set the appropriate icon based on the selected category
    switch (category) {
        case 'Thesis':
            iconPath = 'icons/category-icons/thesis.png';
            break;
        case 'Dissertation':
            iconPath = 'icons/category-icons/dissertation.png';
            break;
        case 'Confluence':
            iconPath = 'icons/category-icons/confluence.png';
            break;
        case 'Synergy':
            iconPath = 'icons/category-icons/synergy.png';
            break;
        default:
            iconPath = 'icons/category-icons/default_category_icon.png';
    }
    
    previewIcon.src = iconPath;
    console.log('Updated single document preview icon to:', iconPath);
}

// Function to update compiled document preview icon
function updateCompiledPreviewIcon(category) {
    const previewIcon = document.getElementById('compiled-preview-category-icon');
    if (!previewIcon) return;
    
    let iconPath = 'icons/category-icons/default_category_icon.png';
    
    // Set the appropriate icon based on the selected category
    switch (category) {
        case 'Confluence':
            iconPath = 'icons/category-icons/confluence.png';
            break;
        case 'Synergy':
            iconPath = 'icons/category-icons/synergy.png';
            break;
        default:
            iconPath = 'icons/category-icons/default_category_icon.png';
    }
    
    previewIcon.src = iconPath;
    console.log('Updated compiled document preview icon to:', iconPath);
}

/**
 * Update the document preview section with the uploaded file
 * @param {File} file The uploaded file
 */
function updateDocumentPreview(file) {
    const previewSection = document.getElementById('singleDocPreview');
    const readDocumentBtn = previewSection ? previewSection.querySelector('button') : null;
    const previewAbstract = document.getElementById('previewAbstract');
    
    if (!previewSection || !readDocumentBtn) return;
    
    if (file) {
        // Show the preview section if it was hidden
        previewSection.classList.add('active');
        
        // Update read document button style to indicate file is ready
        readDocumentBtn.classList.remove('text-primary-dark', 'bg-white');
        readDocumentBtn.classList.add('text-white', 'bg-primary', 'hover:bg-primary-dark', 'border-transparent');
        readDocumentBtn.disabled = false;
        
        // Set onclick handler to open the file in a new tab
        readDocumentBtn.onclick = function(e) {
            const url = URL.createObjectURL(file);
            window.open(url, '_blank');
        };
        
        // Update file name display for better visibility (optional)
        const fileNameDisplay = document.getElementById('single-fileNameDisplay');
        if (fileNameDisplay) {
            fileNameDisplay.innerHTML = `
                <div class="flex items-center mt-2">
                    <i data-lucide="file" class="w-4 h-4 mr-1 text-primary"></i>
                    <span class="text-sm font-medium">${file.name}</span>
                    <span class="ml-2 text-xs text-gray-500">(${(file.size / 1024).toFixed(1)} KB)</span>
                </div>
            `;
            // Re-initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
        }
        
        // Extract abstract from PDF if possible
        if (file.type === 'application/pdf' && previewAbstract) {
            previewAbstract.textContent = 'Extracting abstract...';
            
            // Load PDF.js script if not already loaded
            if (!window.pdfjsLib) {
                // Add PDF.js script to document
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
                script.onload = function() {
                    // Once PDF.js is loaded, extract the abstract
                    extractPDFAbstract(file, previewAbstract);
                };
                document.head.appendChild(script);
            } else {
                // PDF.js already loaded, extract the abstract
                extractPDFAbstract(file, previewAbstract);
            }
        } else if (previewAbstract) {
            previewAbstract.textContent = file.type === 'application/pdf' 
                ? 'Loading abstract extraction capabilities...' 
                : 'Abstract extraction is only available for PDF files.';
        }
        
        // Update the category in preview as well
        const categorySelect = document.getElementById('single-category');
        const previewCategory = document.getElementById('previewCategory');
        
        if (categorySelect && previewCategory) {
            const selectedOption = categorySelect.options[categorySelect.selectedIndex];
            previewCategory.textContent = (categorySelect.value && selectedOption.text !== 'Choose a category') 
                ? selectedOption.text 
                : 'N/A';
        }
    } else {
        // Reset read document button style
        readDocumentBtn.classList.remove('text-white', 'bg-primary', 'hover:bg-primary-dark', 'border-transparent');
        readDocumentBtn.classList.add('text-primary-dark', 'bg-white');
        readDocumentBtn.disabled = true;
        readDocumentBtn.onclick = function(e) {
            e.preventDefault();
            alert('Please upload a document first');
            return false;
        };
        
        // Clear file name display
        const fileNameDisplay = document.getElementById('single-fileNameDisplay');
        if (fileNameDisplay) {
            fileNameDisplay.innerHTML = '';
        }
        
        // Reset abstract
        if (previewAbstract) {
            previewAbstract.textContent = 'Abstract will be extracted when you upload a PDF file.';
        }
    }
}

/**
 * Extract abstract from PDF file using PDF.js
 * @param {File} file - The PDF file to extract from
 * @param {HTMLElement} abstractElement - Element to display the abstract in
 */
function extractPDFAbstract(file, abstractElement) {
    if (!file || !abstractElement) return;
    
    abstractElement.textContent = 'Extracting abstract...';
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const typedArray = new Uint8Array(e.target.result);
        
        // Initialize PDF.js
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        
        // Load the PDF document
        const loadingTask = window.pdfjsLib.getDocument({ data: typedArray });
        loadingTask.promise.then(async function(pdf) {
            try {
                // Search through the first few pages for abstract
                const maxPagesToSearch = Math.min(5, pdf.numPages);
                let abstractText = "";
                let isAbstractSection = false;
                let abstractStartPage = -1;
                let abstractEndFound = false;
                let lastLineWasIncomplete = false;
                
                for (let pageNum = 1; pageNum <= maxPagesToSearch && !abstractEndFound; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    
                    // Join text items into lines while preserving their positions
                    const lines = [];
                    let currentLine = [];
                    let lastY = null;
                    
                    // Sort items by vertical position (top to bottom) and horizontal position (left to right)
                    const sortedItems = textContent.items.sort((a, b) => {
                        const yDiff = Math.abs(a.transform[5] - b.transform[5]);
                        if (yDiff > 2) {
                            return b.transform[5] - a.transform[5];
                        }
                        return a.transform[4] - b.transform[4];
                    });
                    
                    // Group items into lines
                    for (const item of sortedItems) {
                        if (lastY === null || Math.abs(item.transform[5] - lastY) <= 2) {
                            currentLine.push(item);
                        } else {
                            if (currentLine.length > 0) {
                                lines.push(currentLine);
                            }
                            currentLine = [item];
                        }
                        lastY = item.transform[5];
                    }
                    if (currentLine.length > 0) {
                        lines.push(currentLine);
                    }
                    
                    // Convert lines to text while preserving formatting
                    const pageLines = lines.map(line => {
                        const text = line.map(item => item.str).join('');
                        return text.trim();
                    }).filter(line => line.length > 0);
                    
                    const pageText = pageLines.join('\n');
                    
                    // Check if this page contains the abstract
                    if (!isAbstractSection) {
                        const abstractStart = findAbstractStart(pageText);
                        if (abstractStart) {
                            isAbstractSection = true;
                            abstractStartPage = pageNum;
                            abstractText = abstractStart;
                            lastLineWasIncomplete = !abstractStart.endsWith('.') && 
                                                  !abstractStart.endsWith('?') && 
                                                  !abstractStart.endsWith('!');
                        }
                    } else {
                        const endMarkerRegex = new RegExp(
                            "^\\s*(introduction|keywords?:?|index terms:?|background|acknowledg(e|ement|ments)|1\\.?|i\\.?|chapter|section|references)\\b",
                            "im"
                        );
                        const endMatch = pageText.match(endMarkerRegex);

                        if (endMatch) {
                            const markerPosition = pageText.indexOf(endMatch[0]);
                            const abstractPart = pageText.substring(0, markerPosition).trim();

                            if (abstractPart.length > 30) {
                                abstractText += (lastLineWasIncomplete ? ' ' : '\n') + abstractPart;
                                abstractEndFound = true;
                                break;
                            }
                        } else if (pageNum === abstractStartPage) {
                            // Same page as abstract start, content already added
                            continue;
                        } else {
                            // Add content only if it appears to be continuation of the abstract
                            const cleanedText = pageText.replace(/^[\d\s\w]+$|Page \d+|^\d+$/gm, '').trim();
                            if (cleanedText && 
                                (lastLineWasIncomplete || /^[a-z,;)]/.test(cleanedText) || /[a-z][.?!]$/.test(abstractText)) && 
                                !cleanedText.toLowerCase().includes('acknowledge') &&
                                !cleanedText.includes('copyright') &&
                                !/^\s*\d+\s*$/.test(cleanedText)) {
                                abstractText += (lastLineWasIncomplete ? ' ' : '\n') + cleanedText;
                                lastLineWasIncomplete = !cleanedText.endsWith('.') && 
                                                      !cleanedText.endsWith('?') && 
                                                      !cleanedText.endsWith('!');
                            } else {
                                abstractEndFound = true;
                            }
                        }
                    }
                }
                
                // Clean up the abstract text
                if (abstractText) {
                    abstractText = cleanAbstractText(abstractText);
                    
                    // Format as HTML with paragraphs
                    const paragraphs = abstractText
                        .split(/(?<=[.!?])\s+(?=[A-Z])/g) // Split by full-stop + capital start
                        .map(p => p.trim())
                        .filter(p => p.length > 0 && !p.match(/^(keywords?|chapter|section|index terms|acknowledge)/i));
                    
                    const formattedAbstract = `<div class="abstract-text">${paragraphs.map(p => 
                        `<p>${p}</p>`).join('')}</div>`;
                    
                    // Update the abstract element with formatted content
                    abstractElement.innerHTML = formattedAbstract;
                    
                    // Add styling for abstract display
                    addAbstractStyles();
                } else {
                    abstractElement.textContent = "No abstract found in the document.";
                }
            } catch (error) {
                console.error('Error extracting abstract:', error);
                abstractElement.textContent = "Error extracting abstract from PDF.";
            }
        }).catch(function(error) {
            console.error('Error loading PDF:', error);
            abstractElement.textContent = 'Unable to load PDF content. Try a different file.';
        });
    };
    
    reader.onerror = function() {
        abstractElement.textContent = 'Error reading PDF file.';
    };
    
    reader.readAsArrayBuffer(file);
}

/**
 * Function to find the start of the abstract
 * @param {string} text - Text content from PDF
 * @returns {string|null} - The abstract text if found
 */
function findAbstractStart(text) {
    const abstractMarkers = [
        "abstract",
        "abstract:",
        "ABSTRACT",
        "ABSTRACT:",
        "Abstract",
        "Abstract:",
        "A B S T R A C T",
        "A B S T R A C T:"
    ];
    
    const lowerText = text.toLowerCase();
    for (const marker of abstractMarkers) {
        const index = lowerText.indexOf(marker.toLowerCase());
        if (index !== -1) {
            // Get the text after the abstract marker
            const startIndex = index + marker.length;
            let abstractText = text.substring(startIndex).trim();
            
            // Remove any leading colons or spaces
            abstractText = abstractText.replace(/^[:.\s]+/, '').trim();
            
            return abstractText;
        }
    }
    return null;
}

/**
 * Clean extracted abstract text
 * @param {string} text - Raw abstract text
 * @returns {string} - Cleaned abstract text
 */
function cleanAbstractText(text) {
    if (!text) return '';
    
    return text
        .replace(/^ABSTRACT\s*[:.]?\s*/i, '') // Remove "ABSTRACT" header
        .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .replace(/acknowledgements?.*$/is, '') // Remove any acknowledgement section
        .replace(/keywords?:.*$/im, '') // Remove keywords section
        .replace(/\s+/g, ' ') // Normalize spaces again after cleanup
        .trim();
}

/**
 * Add CSS styling for abstract display
 */
function addAbstractStyles() {
    // Check if styles are already added
    if (document.getElementById('abstract-styles')) return;
    
    const abstractStyles = `
        .abstract-text {
            text-align: justify;
            hyphens: auto;
            font-weight: normal !important;
        }
        
        .abstract-text p {
            margin: 0 0 1em 0;
            text-indent: 0.5in;
            font-weight: normal !important;
            font-family: inherit;
        }
        
        .abstract-text p:first-child {
            text-indent: 0;
            font-weight: normal !important;
        }
        
        #previewAbstract {
            color: #333;
            font-weight: normal !important;
        }
        
        #previewAbstract * {
            font-weight: normal !important;
        }
    `;
    
    // Add styles to document
    const styleSheet = document.createElement("style");
    styleSheet.id = 'abstract-styles';
    styleSheet.textContent = abstractStyles;
    document.head.appendChild(styleSheet);
}

/**
 * Update category in the preview based on selected category
 */
function updateCategoryInPreview() {
    const categorySelect = document.getElementById('single-category');
    const previewCategory = document.getElementById('previewCategory');
    
    if (!categorySelect || !previewCategory) return;
    
    const selectedOption = categorySelect.options[categorySelect.selectedIndex];
    previewCategory.textContent = (categorySelect.value && selectedOption.text !== 'Choose a category') 
        ? selectedOption.text 
        : 'N/A';
}

// Function to setup file inputs for compiled document studies
function setupStudyFileInputs() {
    document.querySelectorAll('.compiled-study-container').forEach((container, index) => {
        const fileInput = container.querySelector('.study-file-input');
        const fileInputContainer = container.querySelector('.study-file-container');
        const fileId = `study-file-${index + 1}`;
        
        if (fileInput && fileInputContainer) {
            // Set unique ID for this file input
            fileInput.id = fileId;
            fileInputContainer.id = `${fileId}Container`;
            
            // Add drag and drop functionality
            fileInputContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileInputContainer.classList.add('drag-over');
            });
            
            fileInputContainer.addEventListener('dragleave', (e) => {
                e.preventDefault();
                fileInputContainer.classList.remove('drag-over');
            });
            
            fileInputContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                fileInputContainer.classList.remove('drag-over');
                
                if (e.dataTransfer.files.length > 0) {
                    fileInput.files = e.dataTransfer.files;
                    updateFileSelectedUI(fileId, true, e.dataTransfer.files[0].name);
                }
            });
            
            // Handle file selection
            fileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    updateFileSelectedUI(fileId, true, this.files[0].name);
                } else {
                    updateFileSelectedUI(fileId, false);
                }
            });
        }
    });
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Setup single file upload
    const singleFileInput = document.getElementById('single-file-upload');
    if (singleFileInput) {
        const singleFileContainer = document.getElementById('single-file-uploadContainer');
        
        // Add drag and drop functionality
        if (singleFileContainer) {
            singleFileContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                singleFileContainer.classList.add('drag-over');
            });
            
            singleFileContainer.addEventListener('dragleave', (e) => {
                e.preventDefault();
                singleFileContainer.classList.remove('drag-over');
            });
            
            singleFileContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                singleFileContainer.classList.remove('drag-over');
                
                if (e.dataTransfer.files.length > 0) {
                    singleFileInput.files = e.dataTransfer.files;
                    updateFileSelectedUI('single-file-upload', true, e.dataTransfer.files[0].name);
                    // Update document preview
                    updateDocumentPreview(e.dataTransfer.files[0]);
                }
            });
        }
        
        // Handle file selection
        singleFileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                updateFileSelectedUI('single-file-upload', true, this.files[0].name);
                // Update document preview
                updateDocumentPreview(this.files[0]);
            } else {
                updateFileSelectedUI('single-file-upload', false);
                // Reset document preview
                updateDocumentPreview(null);
            }
        });
    }
    
    // Initial setup for compiled document studies
    setupStudyFileInputs();
    
    // Add handler for the "Add Study" button
    const addStudyBtn = document.getElementById('addStudyBtn');
    if (addStudyBtn) {
        addStudyBtn.addEventListener('click', () => {
            // ... existing code ...
            
            // Setup file inputs for the new study
            setupStudyFileInputs();
        });
    }
}); 