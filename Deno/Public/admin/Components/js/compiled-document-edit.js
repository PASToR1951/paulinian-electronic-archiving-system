/**
 * Compiled document editing functionality
 * Handles editing for Confluence and Synergy documents
 */

// Initialize compiled document edit functionality
document.addEventListener('DOMContentLoaded', function() {
    // Set up compiled edit form submission
    const compiledEditForm = document.getElementById('compiled-edit-form');
    if (compiledEditForm) {
        compiledEditForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const documentId = this.getAttribute('data-document-id');
            if (documentId) {
                handleCompiledEditFormSubmit(documentId, this);
            }
        });
    }
    
    // Set up year field validation
    const startYearInput = document.getElementById('compiled-edit-start-year');
    const endYearInput = document.getElementById('compiled-edit-end-year');
    
    if (startYearInput && endYearInput) {
        // Ensure end year is not less than start year
        endYearInput.addEventListener('change', function() {
            const startYear = parseInt(startYearInput.value);
            const endYear = parseInt(this.value);
            
            if (!isNaN(startYear) && !isNaN(endYear) && endYear < startYear) {
                alert('End year cannot be before start year');
                this.value = startYearInput.value;
            }
        });
        
        // Update preview when years change
        startYearInput.addEventListener('input', updateCompiledPreviewYears);
        endYearInput.addEventListener('input', updateCompiledPreviewYears);
    }
    
    // Set up volume field
    const volumeInput = document.getElementById('compiled-edit-volume');
    if (volumeInput) {
        volumeInput.addEventListener('input', function() {
            const previewVolume = document.getElementById('compiled-edit-preview-volume');
            if (previewVolume) {
                previewVolume.textContent = this.value || 'N/A';
            }
        });
    }
    
    // Set up title field
    const titleInput = document.getElementById('compiled-edit-title');
    if (titleInput) {
        titleInput.addEventListener('input', function() {
            const previewTitle = document.getElementById('compiled-edit-preview-title');
            if (previewTitle) {
                previewTitle.textContent = this.value || 'Compilation Title';
            }
        });
    }
    
    // Set up category field
    const categorySelect = document.getElementById('compiled-edit-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            // Update preview icon based on category
            const categoryName = this.options[this.selectedIndex].text;
            updateCompiledPreviewIcon(categoryName);
        });
    }
});

// Handle form submission for compiled document editing
async function handleCompiledEditFormSubmit(documentId, form) {
    try {
        const formData = new FormData(form);
        
        // Basic validation
        const title = formData.get('title');
        if (!title) {
            alert('Title is required');
            return;
        }
        
        // Prepare document data
        const documentData = {
            title: title,
            start_year: formData.get('start_year') || null,
            end_year: formData.get('end_year') || null,
            volume: formData.get('volume') || null,
            issue: formData.get('issue') || null,
            category_name: formData.get('category') || null
        };
        
        // Send update request
        const response = await fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update compiled document');
        }
        
        // Update child studies
        const studiesData = getStudiesData();
        if (studiesData.length > 0) {
            for (const study of studiesData) {
                if (!study.id) continue;
                
                // Update each study
                try {
                    const studyResponse = await fetch(`/api/documents/${study.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            title: study.title,
                            abstract: study.abstract
                        })
                    });
                    
                    if (!studyResponse.ok) {
                        console.warn(`Warning: Failed to update study: ${study.title}`);
                    }
                } catch (studyError) {
                    console.error(`Error updating study: ${study.title}`, studyError);
                }
            }
        }
        
        // Show success message
        window.docUtils?.showSuccess('Compilation updated successfully', () => {
            closeCompiledEditModal();
            // Reload document list
            if (window.loadDocuments) {
                window.loadDocuments(window.currentPage || 1);
            }
        }) || alert('Compilation updated successfully');
        
    } catch (error) {
        console.error('Error updating compiled document:', error);
        window.docUtils?.showError(`Error: ${error.message}`) || alert(`Error: ${error.message}`);
    }
}

// Edit a compiled document
async function editCompiledDocument(documentId, documentData) {
    console.log('Editing compiled document:', documentData);
    
    // Get form elements
    const editModal = document.getElementById('compiled-edit-modal');
    const editForm = document.getElementById('compiled-edit-form');
    const titleInput = document.getElementById('compiled-edit-title');
    const startYearInput = document.getElementById('compiled-edit-start-year');
    const endYearInput = document.getElementById('compiled-edit-end-year');
    const volumeInput = document.getElementById('compiled-edit-volume');
    const issueInput = document.getElementById('compiled-edit-issue');
    const categorySelect = document.getElementById('compiled-edit-category');
    
    if (!editModal || !editForm) {
        console.error('Compiled edit modal or form not found');
        return;
    }
    
    // Set form data attribute
    editForm.setAttribute('data-document-id', documentId);
    
    // Fill form with document data
    if (titleInput) titleInput.value = documentData.title || '';
    if (startYearInput) startYearInput.value = documentData.start_year || '';
    if (endYearInput) endYearInput.value = documentData.end_year || '';
    if (volumeInput) volumeInput.value = documentData.volume || '';
    if (issueInput) issueInput.value = documentData.issue || '';
    
    // Set category
    if (categorySelect && documentData.category_name) {
        // Find the option with the matching category name
        const options = Array.from(categorySelect.options);
        const matchingOption = options.find(option => 
            option.value.toLowerCase() === documentData.category_name.toLowerCase() ||
            option.textContent.toLowerCase() === documentData.category_name.toLowerCase()
        );
        
        if (matchingOption) {
            categorySelect.value = matchingOption.value;
        }
    }
    
    // Update preview
    updateCompiledEditPreview(documentData);
    
    // Load child studies
    await loadChildStudies(documentId);
    
    // Show the modal
    editModal.style.display = 'flex';
}

// Load child studies for a compiled document
async function loadChildStudies(documentId) {
    const studiesContainer = document.getElementById('compiled-studies-list');
    if (!studiesContainer) return;
    
    try {
        // Show loading state
        studiesContainer.innerHTML = '<div class="loading-studies">Loading studies...</div>';
        
        // Fetch child documents
        const response = await fetch(`/api/documents/${documentId}/children`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const children = await response.json();
        
        // Clear loading indicator
        studiesContainer.innerHTML = '';
        
        // If no children, show message
        if (!children || children.length === 0) {
            studiesContainer.innerHTML = '<div class="no-studies">No studies found in this compilation</div>';
            
            // Update preview study count
            updateCompiledPreviewStudyCount(0);
            return;
        }
        
        // Render each child document
        children.forEach((child, index) => {
            createStudyEditorElement(child, index + 1, studiesContainer);
        });
        
        // Update preview study count
        updateCompiledPreviewStudyCount(children.length);
        
        // Update preview studies list
        updateCompiledPreviewStudiesList(children);
        
    } catch (error) {
        console.error('Error loading child studies:', error);
        studiesContainer.innerHTML = '<div class="error-message">Error loading studies</div>';
    }
}

// Create an editor element for a study in a compiled document
function createStudyEditorElement(study, index, container) {
    const studyElement = document.createElement('div');
    studyElement.className = 'study-editor';
    studyElement.setAttribute('data-id', study.id);
    
    const authors = study.authors?.map(a => a.full_name).join(', ') || 'Unknown author';
    
    studyElement.innerHTML = `
        <div class="study-header">
            <div class="study-number">${index}</div>
            <div class="study-info">
                <input type="text" class="study-title-input" value="${study.title || ''}" placeholder="Study Title">
                <div class="study-authors">${authors}</div>
            </div>
        </div>
        <div class="study-content">
            <textarea class="study-abstract-input" placeholder="Abstract">${study.abstract || ''}</textarea>
        </div>
    `;
    
    container.appendChild(studyElement);
    
    // Add event listeners for title updates
    const titleInput = studyElement.querySelector('.study-title-input');
    if (titleInput) {
        titleInput.addEventListener('input', function() {
            // Update preview if needed
            updateCompiledPreviewStudiesList();
        });
    }
}

// Close the compiled edit modal
function closeCompiledEditModal() {
    const editModal = document.getElementById('compiled-edit-modal');
    if (editModal) {
        editModal.style.display = 'none';
        
        // Reset form
        const editForm = document.getElementById('compiled-edit-form');
        if (editForm) {
            editForm.reset();
            editForm.removeAttribute('data-document-id');
        }
        
        // Clear studies list
        const studiesContainer = document.getElementById('compiled-studies-list');
        if (studiesContainer) {
            studiesContainer.innerHTML = '';
        }
    }
}

// Get data for all studies in the editor
function getStudiesData() {
    const studies = [];
    const studyElements = document.querySelectorAll('.study-editor');
    
    studyElements.forEach(element => {
        const studyId = element.getAttribute('data-id');
        const titleInput = element.querySelector('.study-title-input');
        const abstractInput = element.querySelector('.study-abstract-input');
        
        if (studyId && titleInput) {
            studies.push({
                id: studyId,
                title: titleInput.value,
                abstract: abstractInput ? abstractInput.value : null
            });
        }
    });
    
    return studies;
}

// Update compiled document preview
function updateCompiledEditPreview(documentData) {
    // Get utility functions
    const formatDate = window.docUtils?.formatDate || (date => date ? new Date(date).toLocaleDateString() : 'N/A');
    
    // Update title
    const titleElement = document.getElementById('compiled-edit-preview-title');
    if (titleElement) {
        titleElement.textContent = documentData.title || 'Compilation Title';
    }
    
    // Update years
    updateCompiledPreviewYears();
    
    // Update volume
    const volumeElement = document.getElementById('compiled-edit-preview-volume');
    if (volumeElement) {
        volumeElement.textContent = documentData.volume || 'N/A';
    }
    
    // Update last updated date
    const dateElement = document.getElementById('compiled-edit-preview-date');
    if (dateElement) {
        dateElement.textContent = formatDate(documentData.updated_at || documentData.created_at);
    }
    
    // Update icon based on category
    updateCompiledPreviewIcon(documentData.category_name);
}

// Update years in the compiled document preview
function updateCompiledPreviewYears() {
    const yearsElement = document.getElementById('compiled-edit-preview-years');
    if (!yearsElement) return;
    
    const startYearInput = document.getElementById('compiled-edit-start-year');
    const endYearInput = document.getElementById('compiled-edit-end-year');
    
    const startYear = startYearInput ? startYearInput.value : '';
    const endYear = endYearInput ? endYearInput.value : '';
    
    if (startYear && endYear) {
        yearsElement.textContent = `${startYear} - ${endYear}`;
    } else if (startYear) {
        yearsElement.textContent = startYear;
    } else if (endYear) {
        yearsElement.textContent = endYear;
    } else {
        yearsElement.textContent = 'N/A';
    }
}

// Update preview icon based on category
function updateCompiledPreviewIcon(categoryName) {
    const previewIcon = document.querySelector('#compiled-edit-modal .preview-icon');
    if (!previewIcon) return;
    
    let iconText = 'C';
    let iconClass = '';
    
    switch (categoryName?.toLowerCase()) {
        case 'confluence':
            iconText = 'C';
            iconClass = 'confluence-icon';
            break;
        case 'synergy':
            iconText = 'S';
            iconClass = 'synergy-icon';
            break;
        default:
            iconText = 'C';
            iconClass = '';
    }
    
    previewIcon.textContent = iconText;
    
    // Reset classes first
    previewIcon.className = 'preview-icon';
    
    // Add new class if we have one
    if (iconClass) {
        previewIcon.classList.add(iconClass);
    }
}

// Update compiled preview study count
function updateCompiledPreviewStudyCount(count) {
    const studiesCountElement = document.getElementById('compiled-edit-preview-studies');
    if (studiesCountElement) {
        studiesCountElement.textContent = count;
    }
}

// Update studies list in the compiled document preview
function updateCompiledPreviewStudiesList(studies) {
    const studiesListElement = document.getElementById('compiled-edit-preview-studies-list');
    if (!studiesListElement) return;
    
    // If studies are not provided, get them from the editor
    if (!studies) {
        const studyData = getStudiesData();
        if (studyData.length === 0) {
            studiesListElement.innerHTML = '<p class="no-studies">No studies in this compilation</p>';
            return;
        }
        
        studies = studyData;
    }
    
    // Create HTML for studies list
    let html = '';
    studies.forEach((study, index) => {
        html += `
            <div class="study-preview-item">
                <span class="study-number">${index + 1}</span>
                <div class="study-preview-content">
                    <h4>${study.title || 'Untitled Study'}</h4>
                    <p>${study.authors?.map(a => a.full_name).join(', ') || 'Unknown author'}</p>
                </div>
            </div>
        `;
    });
    
    studiesListElement.innerHTML = html;
}

// Export functions to window for use in other modules
window.editCompiledDocument = editCompiledDocument;
window.closeCompiledEditModal = closeCompiledEditModal; 