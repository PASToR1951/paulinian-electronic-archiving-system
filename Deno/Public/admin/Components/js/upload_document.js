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
            updateCompiledPreview();
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
    updateCompiledPreview();
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
        let storagePath = 'storage/single/';
        
        if (categoryValue === 'Thesis') {
            documentType = 'THESIS';
            categoryId = 1; // Set the appropriate category ID for Thesis
            storagePath += 'thesis/';
        } else if (categoryValue === 'Dissertation') {
            documentType = 'DISSERTATION';
            categoryId = 2; // Set the appropriate category ID for Dissertation
            storagePath += 'dissertation/';
        } else {
            throw new Error('Invalid document type');
        }
        
        // Ensure the directory exists before uploading
        await ensureDirectoriesExist(storagePath);
        
        // First upload the file
        const file = fileInput.files[0];
        const fileData = new FormData();
        fileData.append('file', file, file.name); // Add filename explicitly
        
        // Add storage path to the form data
        fileData.append('storagePath', storagePath);
        
        console.log('Uploading single document file:', file.name, 'Size:', file.size, 'bytes', 'Path:', storagePath);
        
        // Upload file first
        const fileUploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: fileData
        });
        
        if (!fileUploadResponse.ok) {
            let errorMessage;
            try {
            const errorData = await fileUploadResponse.json();
                errorMessage = errorData.error || errorData.details || 'Failed to upload file';
            } catch (jsonError) {
                errorMessage = `Failed to upload file: ${fileUploadResponse.status} ${fileUploadResponse.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const fileResult = await fileUploadResponse.json();
        const filePath = fileResult.filePath;
        
        console.log('File upload successful:', fileResult);
        
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
            pages: pageCount
        };
        
        // Update the preview with the document data
        updateDocumentPreview(fileResult);
        
        // Save document to database
        const documentResponse = await fetch('/api/documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        });
        
        if (!documentResponse.ok) {
            let errorMessage;
            try {
            const errorData = await documentResponse.json();
                errorMessage = errorData.error || 'Failed to save document';
            } catch (jsonError) {
                errorMessage = `Failed to save document: ${documentResponse.status} ${documentResponse.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const result = await documentResponse.json();
        const documentId = result.id;
        
        // Now that we have the document ID, create the file record
        const fileRecord = {
            file_name: fileResult.originalName,
            file_path: filePath,
            file_size: fileResult.size,
            file_type: fileResult.fileType || 'application/octet-stream',
            document_id: documentId
        };
        
        // Save file record to database
        try {
            const fileRecordResponse = await fetch('/api/files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fileRecord)
            });
            
            if (!fileRecordResponse.ok) {
                const errorData = await fileRecordResponse.json();
                console.warn('Warning: Failed to create file record:', errorData.error || 'Unknown error');
            } else {
                console.log('File record created successfully');
            }
        } catch (fileRecordError) {
            console.warn('Warning: Error creating file record:', fileRecordError);
            // Continue even if file record creation fails
        }
        
        // Save author information
        if (formData.get('author')) {
            const authors = formData.get('author').split(';').map(name => name.trim()).filter(name => name !== '');
            
            if (authors.length > 0) {
                const authorData = {
                    document_id: documentId,
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
                // First add items to the old endpoint for backward compatibility
                const researchAgendaData = {
                    document_id: documentId,
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
                    console.warn('Warning: Research agenda items may not have been saved correctly to old endpoint');
                }
                
                // Now also use the new linkage endpoint that creates entries in the junction table
                const linkResponse = await fetch('/api/document-research-agenda/link', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(researchAgendaData)
                });
                
                if (!linkResponse.ok) {
                    console.warn('Warning: Failed to link research agenda items in junction table');
                } else {
                    const linkResult = await linkResponse.json();
                    console.log('Research agenda linking result:', linkResult);
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
        // Log all study section data for debugging
        logStudySectionData();
        
        // First validate all research sections
        if (!validateResearchSections()) {
            showError('Please fix the errors in the research sections before submitting.');
            return;
        }
        
        showLoading('Saving compiled document...');
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Debug information - log research sections
        const researchSections = document.querySelectorAll('.research-section');
        console.log(`Found ${researchSections.length} research sections`);
        
        // Count sections with valid files
        let sectionsWithFiles = 0;
        researchSections.forEach((section, index) => {
            // Use the broader selector to find file inputs
            const fileInput = section.querySelector('input[type="file"], .research-file, .hidden-file-input, #file-upload-' + (index+1));
            
            console.log(`Section ${index+1} file input element:`, fileInput);
            
            if (fileInput) {
                console.log(`Section ${index+1} file input name:`, fileInput.name);
                console.log(`Section ${index+1} file input id:`, fileInput.id);
                console.log(`Section ${index+1} has files:`, fileInput.files ? fileInput.files.length : 0);
                
                if (fileInput.files && fileInput.files.length > 0) {
                    sectionsWithFiles++;
                    console.log(`Section ${index+1} has file: ${fileInput.files[0].name}`);
        } else {
                    console.log(`Section ${index+1} has no file or empty files collection`);
                }
            } else {
                console.log(`Section ${index+1} - NO file input found!`);
            }
        });
        console.log(`${sectionsWithFiles} out of ${researchSections.length} sections have files`);
        
        // Validate required fields
        const title = formData.get('title');
        const category = formData.get('category');
        
        if (!category) {
            throw new Error('Category is required');
        }
        
        // Determine category ID based on category name
        let categoryId = 0;
        switch (category.toLowerCase()) {
            case 'confluence':
                categoryId = 3; // ID for Confluence category
                break;
            case 'synergy':
                categoryId = 4; // ID for Synergy category
                break;
            default:
                throw new Error('Invalid category');
        }
        
        // Determine document type based on category
        const documentType = category === 'Synergy' ? 'SYNERGY' : 'CONFLUENCE';
        
        // Create storage path for compiled document
        const compiledStoragePath = `storage/compiled/${category.toLowerCase()}/`;
        
        // Ensure the directory exists
        await ensureDirectoriesExist(compiledStoragePath);
        await ensureDirectoriesExist(compiledStoragePath + 'studies/');
        
        // Set department_id if it's a Synergy document
        let departmentId = null;
        if (documentType === 'SYNERGY') {
            const departmentalSelect = document.getElementById('compiled-departmental');
            if (departmentalSelect && departmentalSelect.value) {
                departmentId = parseInt(departmentalSelect.value);
            }
            
            if (!departmentId) {
                showError('Department is required for Synergy documents.');
                hideLoading();
                return;
            }
        }
        
        // Create compiled document data directly in the compiled_documents table
        // instead of going through the documents table first
        const compiledDocData = {
            start_year: formData.get('pub-year-start') ? parseInt(formData.get('pub-year-start')) : null,
            end_year: formData.get('pub-year-end') ? parseInt(formData.get('pub-year-end')) : null,
            volume: formData.get('volume') ? parseInt(formData.get('volume')) : null,
            issue_number: documentType === 'SYNERGY' ? null : (formData.get('issued-no') ? parseInt(formData.get('issued-no')) : null),
            department: departmentId ? getSelectedDepartmentText() : null,
            category: category.toUpperCase() // Ensure category is uppercase to match enum values
        };
        
        // Call API to create the compiled document entry
        const compiledDocResponse = await fetch('/api/compiled-documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                compiledDoc: compiledDocData,
                documentIds: [] // Start with empty array, will add children later
            })
        });
        
        if (!compiledDocResponse.ok) {
            const errorData = await compiledDocResponse.json();
            console.warn('Warning: Failed to create compiled document entry:', errorData.error);
            throw new Error(`Failed to create compiled document entry: ${errorData.error || 'Unknown error'}`);
        }
        
        const compiledDocResult = await compiledDocResponse.json();
        console.log('Created compiled document entry with ID:', compiledDocResult.id);
        
        // Store the compiled document ID (this is the ID in the compiled_documents table)
        const compiledDocEntryId = compiledDocResult.id;
        
        // Process each research section (use existing researchSections variable)
        const studyPromises = [];
        const studyDocumentIds = [];
        
        for (let i = 0; i < researchSections.length; i++) {
            const section = researchSections[i];
            // Use the broader selector to find file inputs
            const fileInput = section.querySelector('input[type="file"], .research-file, .hidden-file-input, #file-upload-' + (i+1));
            
            // Try multiple selectors for finding the title input
            const titleInput = section.querySelector('.research-title, input[name^="research"][name$="[study_title]"], #study-title-' + (i+1));
            
            console.log(`Section ${i+1} title input:`, titleInput);
            if (titleInput) {
                console.log(`Section ${i+1} title value:`, titleInput.value);
            }
            
            // Try to find the abstract input with multiple selectors
            const abstractInput = section.querySelector('.research-abstract, textarea[name^="research"][name$="[abstract]"], #research-abstract-' + (i+1));
            console.log(`Section ${i+1} abstract input:`, abstractInput);
            
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                console.log(`Skipping section ${i+1} - no file uploaded`);
                continue; // Skip sections without files
            }
            
            if (!titleInput) {
                console.log(`ERROR: Title input not found for section ${i+1}`);
                throw new Error(`Title input not found for section ${i+1}. Please refresh the page and try again.`);
            }
            
            if (!titleInput.value || titleInput.value.trim() === '') {
                console.log(`ERROR: Missing title for section ${i+1}`);
                throw new Error(`Each study must have a title (section ${i+1} is missing a title)`);
            }
            
            const file = fileInput.files[0];
            console.log(`Processing study ${i+1} file: ${file.name} (${file.size} bytes) for section with title: ${titleInput.value}`);
            
            // Create study-specific file upload
            const studyFormData = new FormData();
            studyFormData.append('file', file);
            studyFormData.append('storagePath', `${compiledStoragePath}studies/`);
            
            // Upload the study file
            const studyFileResponse = await fetch('/api/upload', {
                method: 'POST',
                body: studyFormData
            });
            
            if (!studyFileResponse.ok) {
                const errorData = await studyFileResponse.json();
                throw new Error(errorData.error || 'Failed to upload study file');
            }
            
            const fileResult = await studyFileResponse.json();
            
            // Get study category ID (should match the parent document category)
            let studyCategoryId = categoryId;
            
            // Get abstract text with a null check
            const abstractText = abstractInput && abstractInput.value ? abstractInput.value.trim() : 'No abstract provided';
            
            // Create study document data (will be linked to the compiled document)
            const studyData = {
                title: titleInput.value,
                abstract: abstractText,
                publication_date: new Date().toISOString().split('T')[0],
                document_type: documentType,
                file_path: fileResult.filePath,
                category_id: studyCategoryId,
                pages: 0,
                is_public: true,
                compiled_parent_id: compiledDocEntryId  // Reference to the compiled document ID
            };
            
            // Extract metadata from PDF if available
            if (fileResult.metadata && fileResult.fileType === 'pdf') {
                studyData.abstract = fileResult.metadata.abstract || abstractText;
                studyData.pages = fileResult.metadata.pageCount || 0;
            }
                
            // Save study document to database
            const studyPromise = fetch('/api/documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studyData)
            }).then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.error || 'Failed to save study document');
                    });
                }
                return response.json();
            }).then(async result => {
                // Store the study document ID for later linking to the compiled document
                const studyDocId = result.id;
                studyDocumentIds.push(studyDocId);
                
                // Find author input in this research section
                const authorInput = section.querySelector('.authors-input, input[name^="research"][name$="[authors]"], #authors-' + (i+1));
                
                // Process authors if present
                if (authorInput && authorInput.value && authorInput.value.trim() !== '') {
                    try {
                        console.log(`Processing authors for study ${i+1} with ID ${studyDocId}`);
                        
                        // Split authors by semicolon and clean up
                        const authors = authorInput.value.split(';')
                            .map(name => name.trim())
                            .filter(name => name !== '');
                        
                        if (authors.length > 0) {
                            console.log(`Found ${authors.length} authors for study ${i+1}: ${authors.join(', ')}`);
                            
                            // Prepare data for document-authors endpoint
                            const authorData = {
                                document_id: studyDocId,
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
                                const errorText = await authorResponse.text();
                                console.warn(`Warning: Authors may not have been saved correctly for study ${i+1}:`, 
                                    authorResponse.status, errorText);
                            } else {
                                console.log(`Successfully associated ${authors.length} authors with study ${i+1}`);
                            }
                        }
                    } catch (authorError) {
                        console.error(`Error processing authors for study ${i+1}:`, authorError);
                        // Continue with document creation even if author association fails
                    }
                } else {
                    console.log(`No authors specified for study ${i+1}`);
                }
                
                // Add research agenda items if provided
                if (section.querySelector('.research-agenda')) {
                    const researchAgendaInput = section.querySelector('.research-agenda');
                    const researchAgendaItems = researchAgendaInput.value.split(',').map(item => item.trim()).filter(item => item !== '');
                    
                    if (researchAgendaItems.length > 0) {
                        // First add items to research_agenda table (backwards compatibility)
                        const researchAgendaData = {
                            document_id: studyDocId,
                            agenda_items: researchAgendaItems
                        };
                        
                        try {
                            // Send research agenda items to the document-research-agenda endpoint
                            const researchAgendaResponse = await fetch('/document-research-agenda', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(researchAgendaData)
                            });
                            
                            if (!researchAgendaResponse.ok) {
                                console.warn(`Warning: Research agenda items for section ${i+1} may not have been saved correctly`);
                            }
                            
                            // Now also link to the junction table
                            const linkResponse = await fetch('/api/document-research-agenda/link', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(researchAgendaData)
                            });
                            
                            if (!linkResponse.ok) {
                                console.warn(`Warning: Failed to link research agenda items for section ${i+1}`);
                            } else {
                                const linkResult = await linkResponse.json();
                                console.log(`Research agenda linking result for section ${i+1}:`, linkResult);
                            }
                        } catch (agendaError) {
                            console.warn(`Error saving research agenda items for section ${i+1}:`, agendaError);
                        }
                    }
                }
                
                return result;
            });
            
            studyPromises.push(studyPromise);
        }
        
        // Wait for all study documents to be saved
        await Promise.all(studyPromises);
        
        // Link all child documents to the compiled document if we have a valid compiled doc ID
        if (studyDocumentIds.length > 0) {
            try {
                console.debug(`Creating junction table entries for compiled document ${compiledDocEntryId} with ${studyDocumentIds.length} child documents`);
                console.debug('Child document IDs:', studyDocumentIds);
                        
                const linkResponse = await fetch('/api/compiled-documents/add-documents', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        compiledDocumentId: compiledDocEntryId, // Use the ID from compiled_documents table
                        documentIds: studyDocumentIds
                    })
                });
                
                if (!linkResponse.ok) {
                    const errorData = await linkResponse.json();
                    console.warn('Warning: Failed to link some child documents to compilation:', errorData.error);
                    // Continue anyway since the documents were created, but show a more informative message
                    showError(`Compiled document created, but some studies may not appear in the list. Please check the console for details or try refreshing the document list.`);
                } else {
                    const linkResult = await linkResponse.json();
                    console.debug('Junction table entries created:', linkResult);
                    
                    // Check if any failures occurred
                    if (linkResult.results && linkResult.results.some(r => !r.success)) {
                        const failedCount = linkResult.results.filter(r => !r.success).length;
                        console.warn(`${failedCount} out of ${linkResult.results.length} document links failed`);
                        showError(`Compiled document created, but ${failedCount} studies may not appear in the list. Please check the console for details.`);
                    }
                }
            } catch (linkError) {
                console.error('Error linking child documents to compilation:', linkError);
                // Continue anyway since the documents were created
                showError(`Compiled document created, but studies may not appear in the list due to an error: ${linkError.message}`);
            }
        }
        
        // Display upload summary in the console
        console.log("-------------------------------------------");
        console.log("📊 COMPILED DOCUMENT UPLOAD SUMMARY");
        console.log("-------------------------------------------");
        console.log(`✅ Compiled Document ID: ${compiledDocEntryId}`);
        console.log(`📚 Title: ${formData.get('title') || `${category} ${formData.get('volume') || ''}`}`);
        console.log(`📚 Type: ${documentType}`);
        console.log(`📚 Category: ${category}`);
        console.log(`📚 Volume: ${formData.get('volume') || 'N/A'}`);
        
        if (documentType === "SYNERGY") {
            console.log(`📚 Department: ${departmentId ? getSelectedDepartmentText() : 'N/A'}`);
        } else {
            console.log(`📚 Issue: ${formData.get('issued-no') || 'N/A'}`);
        }
        
        console.log(`📚 Years: ${formData.get('pub-year-start') || 'N/A'} - ${formData.get('pub-year-end') || 'N/A'}`);
        console.log(`📚 Child Studies: ${studyDocumentIds.length} (found ${researchSections.length} research sections, ${sectionsWithFiles} with files)`);
        console.log(`📁 Storage Path: ${compiledStoragePath}`);
        console.log("-------------------------------------------");
        
        hideLoading();
        
        // Show success message or warning if files were skipped
        if (sectionsWithFiles === 0) {
            showError('No study files were uploaded. Please add at least one study with a file.');
        } else if (sectionsWithFiles < researchSections.length) {
            showWarning(`Compiled document created with ${studyDocumentIds.length} studies. Note: ${researchSections.length - sectionsWithFiles} sections did not have files attached.`, function() {
                // Reset form
                form.reset();
                
                // Clear research sections
                const researchContainer = document.getElementById('research-sections-container');
                if (researchContainer) {
                    researchContainer.innerHTML = '';
                    addResearchSection(); // Add one empty section
                }
            });
        } else {
            showSuccess('Compiled document created successfully', function() {
                // Reset form
                form.reset();
                
                // Clear research sections
                const researchContainer = document.getElementById('research-sections-container');
                if (researchContainer) {
                    researchContainer.innerHTML = '';
                    addResearchSection(); // Add one empty section
                } else {
                    console.warn('Research sections container not found when trying to clear sections');
                }
            });
        }
        
    } catch (error) {
        hideLoading();
        console.error('Error creating compiled document:', error);
        
        // Provide more detailed error information
        let errorMessage = error.message;
        if (error.stack) {
            console.error('Error stack:', error.stack);
        }
        
        // Check if it's a TypeError with 'null' in the message (common for DOM element issues)
        if (error instanceof TypeError && error.message.includes('null')) {
            errorMessage = 'Form field error: ' + error.message + '. Please make sure all required fields are filled out.';
        }
        
        showError(errorMessage);
    }
}

/**
 * Helper function to ensure directories exist
 * @param {string} path - Directory path
 */
async function ensureDirectoriesExist(path) {
    try {
        // Use a simple fetch to trigger server-side directory creation
        await fetch('/api/ensure-directory', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
            body: JSON.stringify({ path })
        });
    } catch (error) {
        console.warn('Could not ensure directory exists:', path, error);
        // Continue anyway as the upload might still work if directory exists
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

/**
 * Show warning message
 * @param {string} message Warning message to display
 * @param {Function} callback Optional callback function to execute on confirmation
 */
function showWarning(message, callback) {
    Swal.fire({
        title: 'Warning',
        text: message,
        icon: 'warning',
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

// Function to update compiled document preview
function updateCompiledPreview() {
    // Get form elements
    const titleElement = document.getElementById('preview-main-title');
    const pubYearElement = document.getElementById('preview-pub-year');
    const volumeElement = document.getElementById('preview-volume');
    const categoryElement = document.getElementById('preview-category');
    const categorySelect = document.getElementById('compiled-category');
    const volumeInput = document.getElementById('compiled-volume');
    const departmentalSelect = document.getElementById('compiled-departmental');
    const issuedNoInput = document.getElementById('compiled-issued-no');
    
    if (!titleElement || !categorySelect) return;
    
    // Get the category value
    const category = categorySelect.value;
    
    // Build the title based on category, volume, and department or issue number
    let title = category || 'Compiled Document';
    
    if (volumeInput && volumeInput.value) {
        title += ` Volume ${volumeInput.value}`;
    }
    
    if (category === 'Synergy') {
        // For Synergy, use the department name
        if (departmentalSelect && departmentalSelect.selectedIndex > 0) {
            title += ` - ${getSelectedDepartmentText()}`;
        }
    } else {
        // For other types, use the issue number
        if (issuedNoInput && issuedNoInput.value) {
            title += ` Issue ${issuedNoInput.value}`;
        }
    }
    
    // Update title in preview
    titleElement.textContent = title;
    
    // Update other elements as needed
    if (categoryElement) {
        categoryElement.textContent = category || 'N/A';
    }
    
    if (volumeElement && volumeInput) {
        volumeElement.textContent = volumeInput.value || 'N/A';
    }
    
    // Update icon
    const previewIcon = document.getElementById('compiled-preview-category-icon');
    if (previewIcon) {
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
                e.stopPropagation();
                this.classList.remove('drag-over');
                
                if (e.dataTransfer.files.length > 0) {
                    fileInput.files = e.dataTransfer.files;
                    
                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    fileInput.dispatchEvent(event);
                }
            });
            
            // Handle file selection
            fileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    const fileName = this.files[0].name;
                    const fileNameDisplay = container.querySelector('.file-name-display');
                    const fileSize = (this.files[0].size / 1024).toFixed(1);
                    
                    if (fileNameDisplay) {
                        fileNameDisplay.innerHTML = `
                            <div class="flex items-center">
                                <i data-lucide="file" class="w-4 h-4 mr-1 text-primary"></i>
                                <span class="font-medium">${fileName}</span>
                                <span class="text-xs text-gray-500 ml-1">(${fileSize} KB)</span>
                            </div>
                        `;
                        
                        // Re-initialize Lucide icons if needed
                        if (window.lucide) {
                            window.lucide.createIcons();
                        }
                    }
                    
                    console.log(`File selected for research section ${fileId}: ${fileName} (${fileSize} KB)`);
                    
                    // Also add a visual indication that the file was selected
                    const uploadContainer = container.querySelector(`#file-upload-container-${fileId}`);
                    if (uploadContainer) {
                        uploadContainer.classList.add('border-primary', 'bg-primary-50');
                        uploadContainer.classList.remove('border-gray-300', 'border-dashed');
                        uploadContainer.innerHTML = `
                            <div class="space-y-1 text-center">
                                <i data-lucide="check-circle" class="mx-auto h-12 w-12 text-success"></i>
                                <div class="text-sm text-success font-medium">File uploaded successfully</div>
                                <div class="text-xs text-gray-500">${fileName} (${fileSize} KB)</div>
                                <button type="button" class="mt-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded" 
                                    onclick="document.getElementById('file-upload-${fileId}').click()">
                                    Replace File
                                </button>
                            </div>
                        `;
                        
                        // Re-initialize Lucide icons
                        if (window.lucide) {
                            window.lucide.createIcons();
                        }
                    }
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
            // Add a new research section to the form
            addResearchSection();
            
            // Setup file inputs for the new study
            setupStudyFileInputs();
        });
    }
}); 

/**
 * Handles file selection for PDF uploads
 * @param {Event} event - The file input change event
 */
async function handleFileSelection(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    
    if (!file) return;
    
    // Only accept PDF files
    if (file.type !== 'application/pdf') {
        showError('Please select a valid PDF file.');
        fileInput.value = '';
        return;
    }
    
    // Show loading indicator
    const uploadBox = document.querySelector('.upload-box');
    uploadBox.classList.add('loading');
    
    try {
        // Upload file to server
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/documents/upload-file', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload file');
        }
        
        const data = await response.json();
        
        // Store file info and extract metadata
        fileUploadResult = data;
        
        // Show success indicator and file name
        uploadBox.classList.remove('loading');
        uploadBox.classList.add('success');
        
        // Show file name
        const fileIndicator = document.getElementById('file-indicator');
        fileIndicator.textContent = file.name;
        fileIndicator.style.display = 'block';
        
        // Update form with metadata if available
        if (data.metadata) {
            // Set abstract from PDF
            const abstractTextarea = document.getElementById('abstract');
            if (abstractTextarea && data.metadata.abstract) {
                abstractTextarea.value = data.metadata.abstract;
            }
            
            // Set extracted page count
            const pageCount = data.metadata.pageCount || 0;
            document.getElementById('page-count-value').textContent = pageCount;
        }
    } catch (error) {
        console.error('File upload error:', error);
        uploadBox.classList.remove('loading');
        uploadBox.classList.add('error');
        showError(`Upload failed: ${error.message}`);
        
        // Reset file input
        fileInput.value = '';
    }
}

/**
 * Prepares data for document creation
 * @returns {Object} Document data ready for submission
 */
function prepareDocumentData() {
    // Get form values
    const title = document.getElementById('title').value;
    const abstract = document.getElementById('abstract').value;
    const publicationDate = document.getElementById('publication-date').value;
    const volumeNumber = document.getElementById('volume').value;
    const category = document.getElementById('category').value;
    
    // Create document data object
    const documentData = {
        title,
        abstract,
        publication_date: publicationDate,
        volume: volumeNumber,
        category,
        document_type: 'research',
        pages: 0,
        is_public: document.getElementById('is-public').checked,
        authors: selectedAuthors.map(author => ({ id: author.id })),
        topics: selectedTopics.map(topic => ({ id: topic.id }))
    };
    
    // Add metadata from file upload if available
    if (fileUploadResult && fileUploadResult.metadata) {
        documentData.pages = fileUploadResult.metadata.pageCount || 0;
        documentData.file_path = fileUploadResult.filePath;
    }
    
    return documentData;
}

// Add a function to fetch departments from the API
async function fetchDepartments() {
    try {
        const response = await fetch('/api/departments');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching departments:", error);
        return [];
    }
}

// Populate the departmental dropdown with values from the database
async function populateDepartmentalDropdown() {
    const departmentalSelect = document.getElementById('compiled-departmental');
    if (!departmentalSelect) return;
    
    try {
        // Clear existing options except the first one
        while (departmentalSelect.options.length > 1) {
            departmentalSelect.remove(1);
        }
        
        // Fetch departments from the API
        const departments = await fetchDepartments();
        
        // Add each department as an option
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id; // Use the department ID as the value
            option.textContent = `${dept.department_name} (${dept.code})`; // Show both name and code
            departmentalSelect.appendChild(option);
        });
        
        // Add an event listener to update the preview when selection changes
        departmentalSelect.addEventListener('change', updateCompiledPreview);
    } catch (error) {
        console.error("Error populating departmental dropdown:", error);
    }
}

// When compiling a Synergy document, handle the department selection
function handleCategoryChange() {
    const categoryInput = document.getElementById('compiled-category');
    const issuedNoContainer = document.getElementById('compiled-issued-no-container');
    const issuedNoInput = document.getElementById('compiled-issued-no');
    const departmentalSelect = document.getElementById('compiled-departmental');
    
    if (!categoryInput || !issuedNoContainer || !issuedNoInput || !departmentalSelect) return;
    
    if (categoryInput.value === 'Synergy') {
        // If Synergy is selected, show departmental dropdown and hide issued no input
        issuedNoInput.style.display = 'none';
        departmentalSelect.style.display = 'block';
        
        // Load departments if not already loaded
        populateDepartmentalDropdown();
        
        // Update label
        const label = document.getElementById('compiled-issued-no-label');
        if (label) label.textContent = 'Department';
    } else {
        // For other categories, show issued no input and hide departmental dropdown
        issuedNoInput.style.display = 'block';
        departmentalSelect.style.display = 'none';
        
        // Update label
        const label = document.getElementById('compiled-issued-no-label');
        if (label) label.textContent = 'Issued No.';
    }
    
    // Update preview
    updateCompiledPreview();
}

// Function to get the selected department text (name and code)
function getSelectedDepartmentText() {
    const departmentalSelect = document.getElementById('compiled-departmental');
    if (!departmentalSelect || departmentalSelect.selectedIndex < 0) return '';
    
    return departmentalSelect.options[departmentalSelect.selectedIndex].text;
}

/**
 * Adds a new research section to the compiled document form
 */
function addResearchSection() {
    // Find the sections container
    const sectionsContainer = document.getElementById('research-sections-container');
    if (!sectionsContainer) {
        console.error('Research sections container not found');
        return;
    }
    
    // Calculate next section ID
    const existingSections = document.querySelectorAll('.research-section');
    const nextId = existingSections.length + 1;
    
    // Create new section element
    const newSection = document.createElement('div');
    newSection.className = 'research-section bg-primary-light border border-emerald-200 rounded-lg p-4 relative';
    newSection.dataset.sectionId = nextId;
    
    // Create the inner HTML for the research section
    newSection.innerHTML = `
        <button type="button" class="remove-section-btn absolute top-2 right-2 text-gray-400 hover:text-red-600" title="Remove Section">
            <i data-lucide="x-circle" class="w-5 h-5"></i>
        </button>
        <div class="research-header flex items-center justify-between cursor-pointer" onclick="toggleResearchSection(this)">
            <h3 class="text-md font-semibold text-primary-dark flex items-center">
                <i data-lucide="file-text" class="w-5 h-5 mr-2"></i> Research ${nextId}
                <i data-lucide="chevron-down" class="toggle-icon w-5 h-5 ml-2 text-gray-500"></i>
            </h3>
        </div>
        <div class="research-content space-y-4 mt-3">
            <div>
                <label for="study-title-${nextId}" class="block text-sm font-medium text-gray-700">Study Title <span class="text-red-500">*</span></label>
                <input type="text" id="study-title-${nextId}" name="research[${nextId}][study_title]" 
                    placeholder="Enter study title" class="research-title form-input study-title-input mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" required>
            </div>
            <div>
                <label for="research-abstract-${nextId}" class="block text-sm font-medium text-gray-700">Abstract</label>
                <textarea id="research-abstract-${nextId}" name="research[${nextId}][abstract]" 
                    placeholder="Enter abstract" class="research-abstract form-textarea mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" rows="3"></textarea>
            </div>
            <div>
                <label for="file-upload-${nextId}" class="block text-sm font-medium text-gray-700 mb-1">Attach File</label>
                <div id="file-upload-container-${nextId}" class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary transition-colors duration-200 ease-in-out">
                    <div class="space-y-1 text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <div class="flex text-sm text-gray-600 justify-center">
                            <label for="file-upload-${nextId}" class="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark">
                                <span>Upload a file</span>
                                <input id="file-upload-${nextId}" name="research[${nextId}][file]" type="file" 
                                    class="research-file hidden-file-input" required accept=".pdf" style="opacity: 0; position: absolute; z-index: -1;">
                            </label>
                            <p class="pl-1">or drag and drop</p>
                        </div>
                        <p class="text-xs text-gray-500">PDF up to 10MB</p>
                        <p class="file-name-display text-sm text-gray-900 font-medium pt-2" id="file-name-${nextId}"></p>
                    </div>
                </div>
                <div class="mt-2">
                    <button type="button" class="text-xs text-primary hover:text-primary-dark" 
                        onclick="checkFileInput(${nextId})">Check file status</button>
                </div>
            </div>
        </div>
    `;
    
    // Add the new section to the container
    sectionsContainer.appendChild(newSection);
    
    // Initialize the icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // Add event listener for the remove button
    const removeBtn = newSection.querySelector('.remove-section-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            newSection.remove();
            // Update the studies list in the preview
            updateStudiesList();
        });
    }
    
    // Add file change event listener
    const fileInput = newSection.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (this.files.length > 0) {
                const fileName = this.files[0].name;
                const fileNameDisplay = newSection.querySelector('.file-name-display');
                const fileSize = (this.files[0].size / 1024).toFixed(1);
                
                if (fileNameDisplay) {
                    fileNameDisplay.innerHTML = `
                        <div class="flex items-center">
                            <i data-lucide="file" class="w-4 h-4 mr-1 text-primary"></i>
                            <span class="font-medium">${fileName}</span>
                            <span class="text-xs text-gray-500 ml-1">(${fileSize} KB)</span>
                        </div>
                    `;
                    
                    // Re-initialize Lucide icons if needed
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }
                
                console.log(`File selected for research section ${nextId}: ${fileName} (${fileSize} KB)`);
                
                // Also add a visual indication that the file was selected
                const uploadContainer = newSection.querySelector(`#file-upload-container-${nextId}`);
                if (uploadContainer) {
                    uploadContainer.classList.add('border-primary', 'bg-primary-50');
                    uploadContainer.classList.remove('border-gray-300', 'border-dashed');
                    uploadContainer.innerHTML = `
                        <div class="space-y-1 text-center">
                            <i data-lucide="check-circle" class="mx-auto h-12 w-12 text-success"></i>
                            <div class="text-sm text-success font-medium">File uploaded successfully</div>
                            <div class="text-xs text-gray-500">${fileName} (${fileSize} KB)</div>
                            <button type="button" class="mt-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded" 
                                onclick="document.getElementById('file-upload-${nextId}').click()">
                                Replace File
                            </button>
                        </div>
                    `;
                    
                    // Re-initialize Lucide icons
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }
            }
        });
        
        // Add drag and drop support
        const uploadContainer = newSection.querySelector(`#file-upload-container-${nextId}`);
        if (uploadContainer) {
            uploadContainer.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                uploadContainer.classList.add('border-primary');
            });
            
            uploadContainer.addEventListener('dragleave', function(e) {
                e.preventDefault();
                e.stopPropagation();
                uploadContainer.classList.remove('border-primary');
            });
            
            uploadContainer.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                uploadContainer.classList.remove('border-primary');
                
                if (e.dataTransfer.files.length > 0) {
                    fileInput.files = e.dataTransfer.files;
                    
                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    fileInput.dispatchEvent(event);
                }
            });
        }
    }
    
    console.log(`Added new research section ${nextId}`);
    
    // Update the studies list in the preview
    if (typeof updateStudiesList === 'function') {
        updateStudiesList();
    }
    
    return newSection;
}

/**
 * Debug function to check if a file input has a file
 * @param {number} sectionId - The section ID
 */
function checkFileInput(sectionId) {
    const fileInput = document.getElementById(`file-upload-${sectionId}`);
    if (!fileInput) {
        alert(`File input #file-upload-${sectionId} not found!`);
        return;
    }
    
    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        alert(`File selected: ${file.name} (${(file.size/1024).toFixed(1)} KB)`);
    } else {
        alert('No file selected yet!');
        
        // Try to help the user identify the file input
        fileInput.classList.remove('sr-only');
        fileInput.classList.add('border', 'border-red-500', 'p-2', 'block', 'mt-2');
        
        setTimeout(() => {
            fileInput.classList.add('sr-only');
            fileInput.classList.remove('border', 'border-red-500', 'p-2', 'block', 'mt-2');
        }, 5000);
    }
} 

/**
 * Validate all research sections before submission
 * @returns {boolean} True if all sections are valid, false otherwise
 */
function validateResearchSections() {
    const researchSections = document.querySelectorAll('.research-section');
    let isValid = true;
    
    researchSections.forEach((section, index) => {
        const sectionId = section.getAttribute('data-section-id') || (index + 1);
        
        // Check title input
        const titleInput = section.querySelector('.study-title-input, input[name^="research"][name$="[study_title]"], #study-title-' + sectionId);
        if (!titleInput || !titleInput.value.trim()) {
            console.log(`Validation error: Missing title for research section ${sectionId}`);
            if (titleInput) {
                titleInput.classList.add('border-red-500');
                titleInput.classList.remove('border-gray-300');
            }
            isValid = false;
        } else {
            if (titleInput) {
                titleInput.classList.remove('border-red-500');
                titleInput.classList.add('border-gray-300');
            }
        }
        
        // Check author input
        const authorInput = section.querySelector('.authors-input, input[name^="research"][name$="[authors]"], #authors-' + sectionId);
        if (!authorInput || !authorInput.value.trim()) {
            console.warn(`Warning: No authors specified for research section ${sectionId}`);
            if (authorInput) {
                // Add a visual warning but don't make it a validation error
                authorInput.classList.add('border-yellow-500');
                authorInput.classList.remove('border-gray-300');
            }
            // Don't set isValid = false since authors are helpful but not required
        } else {
            if (authorInput) {
                authorInput.classList.remove('border-yellow-500');
                authorInput.classList.add('border-gray-300');
            }
        }
        
        // Check file input
        const fileUploadInput = section.querySelector('input[type="file"]');
        const fileNameDisplay = section.querySelector('.file-name-display');
        
        if (!fileUploadInput || !fileUploadInput.files || fileUploadInput.files.length === 0) {
            console.log(`Validation error: Missing file for research section ${sectionId}`);
            const fileUploadContainer = section.querySelector(`#file-upload-container-${sectionId}`);
            if (fileUploadContainer) {
                fileUploadContainer.classList.add('border-red-500');
                fileUploadContainer.classList.remove('border-gray-300', 'border-dashed');
            }
            isValid = false;
        } else {
            const fileUploadContainer = section.querySelector(`#file-upload-container-${sectionId}`);
            if (fileUploadContainer) {
                fileUploadContainer.classList.remove('border-red-500');
                fileUploadContainer.classList.add('border-gray-300', 'border-dashed');
            }
        }
    });
    
    if (!isValid) {
        console.log('Validation failed for research sections');
    }
    
    return isValid;
}

/**
 * Log all data in study sections for debugging
 */
function logStudySectionData() {
    console.log('--- STUDY SECTION DATA DUMP ---');
    const sections = document.querySelectorAll('.research-section');
    
    sections.forEach((section, index) => {
        const sectionId = index + 1;
        console.log(`\nSection ${sectionId} data:`);
        
        // Title field
        const titleInput = section.querySelector('.research-title, input[name^="research"][name$="[study_title]"], #study-title-' + sectionId);
        console.log(`- Title element:`, titleInput);
        console.log(`- Title value:`, titleInput ? titleInput.value : 'NOT FOUND');
        
        // Abstract field
        const abstractInput = section.querySelector('.research-abstract, textarea[name^="research"][name$="[abstract]"], #research-abstract-' + sectionId);
        console.log(`- Abstract element:`, abstractInput);
        console.log(`- Abstract value:`, abstractInput ? abstractInput.value : 'NOT FOUND');
        
        // File input
        const fileInput = section.querySelector('input[type="file"], .research-file, .hidden-file-input, #file-upload-' + sectionId);
        console.log(`- File input element:`, fileInput);
        console.log(`- File selected:`, fileInput && fileInput.files && fileInput.files.length > 0 ? 
            `${fileInput.files[0].name} (${fileInput.files[0].size} bytes)` : 'NO FILE');
    });
    console.log('--- END DATA DUMP ---');
}

/**
 * Extract just the department code from the selected department text
 * Example: "Computer Science (CS)" -> "CS"
 * @returns {string} The department code or an empty string if not found
 */
function getDepartmentCode() {
    const departmentText = getSelectedDepartmentText();
    
    // Try to extract code in parentheses, e.g., "Department Name (CODE)"
    const codeMatch = departmentText.match(/\(([^)]+)\)/);
    
    if (codeMatch && codeMatch[1]) {
        return codeMatch[1].trim();
    }
    
    // If no parentheses, return the department text or a default
    return departmentText || '';
}