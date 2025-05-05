/**
 * Document card component functions
 * This file contains functions for creating document cards
 */

// Document card components object to be exported
window.documentCardComponents = {
    createDocumentCard,
    createCompiledDocumentCard,
    createChildDocumentCard,
    formatAuthors,
    formatDate,
    getTopicColors,
    getCategoryIcon,
    formatCategoryName
};

/**
 * Create a document card element
 * @param {Object} doc - Document object
 * @returns {HTMLElement} - The document card element
 */
function createDocumentCard(doc) {
    console.log(`Creating document card for: ${doc.title || 'Untitled'} (ID: ${doc.id})`);
    
    // Create the card element
    const card = document.createElement('div');
    card.className = 'document-card';
    card.dataset.documentId = doc.id;
    card.dataset.documentType = doc.document_type || '';
    
    // Format authors initially - may be updated later
    let authors = formatAuthors(doc.authors);
    
    // Format date
    const pubDate = formatDate(doc.publish_date || doc.publication_date);
    
    // Format document type - try category_name first, then document_type
    const documentType = doc.document_type || '';
    const category = formatCategoryName(documentType);
    
    // Generate topic colors
    const topicColors = getTopicColors(doc.topics);
    
    // Create card HTML
    card.innerHTML = `
        <div class="document-icon">
            <img src="${getCategoryIcon(documentType)}" alt="${category} Icon">
        </div>
        <div class="document-info">
            <h3 class="document-title">${doc.title || 'Untitled Document'}</h3>
            <div class="document-meta">
                <span class="meta-item"><i class="fas fa-user"></i> <span class="author-display" data-document-id="${doc.id}">${authors}</span></span>
                <span class="meta-item"><i class="fas fa-calendar-alt"></i> ${pubDate || 'N/A'}</span>
            </div>
            ${topicColors}
        </div>
        <div class="document-actions">
            <button class="action-btn view-btn" data-document-id="${doc.id}">
                <i class="fas fa-eye"></i> 
            </button>
            <button class="action-btn edit-btn" data-document-id="${doc.id}">
                <i class="fas fa-edit"></i> 
            </button>
            <button class="action-btn delete-btn" data-document-id="${doc.id}">
                <i class="fas fa-trash"></i> 
            </button>
        </div>
    `;
    
    // Add event listeners
    setupDocumentCardEventListeners(card, doc);
    
    // Fetch authors separately if they're not available or empty
    if (!doc.authors || !Array.isArray(doc.authors) || doc.authors.length === 0) {
        fetchAuthorsForDocument(doc.id)
            .then(authorData => {
                const authorDisplay = card.querySelector(`.author-display[data-document-id="${doc.id}"]`);
                if (authorDisplay && authorData && authorData.length > 0) {
                    authorDisplay.textContent = formatAuthors(authorData);
                }
            })
            .catch(error => {
                console.error(`Error fetching authors for document ${doc.id}:`, error);
            });
    }
    
    return card;
}

/**
 * Fetch authors for a document from the API
 * @param {string|number} documentId - Document ID
 * @returns {Promise<Array>} - Promise resolving to array of author objects
 */
async function fetchAuthorsForDocument(documentId) {
    try {
        const response = await fetch(`/api/document-authors/${documentId}`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Authors fetched for document ${documentId}:`, data.authors);
        return data.authors || [];
    } catch (error) {
        console.error(`Error fetching authors for document ${documentId}:`, error);
        return [];
    }
}

/**
 * Create a card for a compiled document
 * @param {Object} doc - Compiled document object
 * @param {Array} expandedDocIds - Array of expanded document IDs
 * @returns {HTMLElement} - Compiled document card element
 */
function createCompiledDocumentCard(doc, expandedDocIds = []) {
    console.log(`Creating compiled document card for: ${doc.title || 'Untitled'} (ID: ${doc.id})`);
    
    // Create a wrapper that will contain both the card and its children
    const wrapper = document.createElement('div');
    wrapper.className = 'compiled-document-wrapper';
    wrapper.dataset.compiledId = doc.id;
    
    // Create the card element
    const card = document.createElement('div');
    card.className = 'document-card compiled';
    card.dataset.documentId = doc.id;
    card.dataset.documentType = doc.document_type || '';
    
    // Format date
    let pubDate = '';
    if (doc.start_year) {
        pubDate = doc.start_year + (doc.end_year ? `-${doc.end_year}` : '');
    } else if (doc.publish_date || doc.publication_date) {
        pubDate = formatDate(doc.publish_date || doc.publication_date);
    }
    
    // Format document type
    const documentType = doc.document_type || '';
    const category = formatCategoryName(documentType);
    
    // Check if expanded
    const isExpanded = expandedDocIds.includes(doc.id);
    const toggleIndicator = isExpanded ? '▼' : '▶';
    
    // Use appropriate fields from compiled_documents
    const volume = doc.volume || '';
    const issueNumber = doc.issue_number || doc.issue || '';
    
    // Format year range for display - use direct properties first
    let yearDisplay = '';
    if (doc.start_year !== undefined) {
        yearDisplay = `${doc.start_year}${doc.end_year ? `-${doc.end_year}` : ''}`;
    } else if (pubDate) {
        yearDisplay = pubDate;
    }
    
    console.log('Document data:', { 
        id: doc.id, 
        start_year: doc.start_year, 
        end_year: doc.end_year,
        yearDisplay,
        is_compiled: doc.is_compiled
    });
    
    // Create card HTML with improved display - hide elements if data is missing
    card.innerHTML = `
        <div class="document-icon">
            <img src="${getCategoryIcon(documentType)}" alt="${category} Icon">
        </div>
        <div class="document-info">
            <h3 class="document-title">
                <span class="toggle-indicator">${toggleIndicator}</span>
                ${category} Vol. ${volume}${issueNumber ? `, Issue No. ${issueNumber}` : ''}
                ${yearDisplay ? ` (${yearDisplay})` : ''}
            </h3>
            <div class="document-meta">
                <span class="meta-item"><i class="fas fa-file-alt"></i> ${doc.child_count || 0} document${doc.child_count !== 1 ? 's' : ''}</span>
                <span class="meta-item"><i class="fas fa-info-circle"></i> Click to view contents</span>
            </div>
        </div>
        <div class="document-actions">
            <button class="action-btn expand-btn" title="Show contained documents">
                <i class="fas fa-list"></i>
            </button>
            <button class="action-btn edit-btn" title="Edit compilation">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" title="Archive compilation">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add the card to the wrapper
    wrapper.appendChild(card);
    
    // Add event listeners
    setupCompiledDocumentCardEventListeners(card, doc, isExpanded, expandedDocIds);
    
    // Create child container if expanded
    if (isExpanded) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children-container';
        childrenContainer.dataset.parent = doc.id;
        childrenContainer.style.display = 'block';
        childrenContainer.style.marginTop = '0';
        childrenContainer.style.marginBottom = '15px';
        childrenContainer.style.width = '95%';
        childrenContainer.style.marginLeft = 'auto';
        
        // Add children container after card
        wrapper.appendChild(childrenContainer);
        
        // Load child documents
        fetchAndRenderChildDocuments(doc.id, childrenContainer);
    }
    
    return wrapper;
}

/**
 * Create a child document card (for documents within a compilation)
 * @param {Object} child - Child document object
 * @returns {HTMLElement} - Child document card element
 */
function createChildDocumentCard(child) {
    const childCard = document.createElement('div');
    childCard.className = 'child-document-card';
    childCard.dataset.documentId = child.id;
    
    // Format authors initially - may be updated later
    const authors = formatAuthors(child.authors);
    
    // Format date
    const pubDate = formatDate(child.publish_date || child.publication_date);
    
    // Format document type - try category_name first, then document_type
    const documentType = child.document_type || child.doc_type || '';
    
    // Create document info section
    const infoDiv = document.createElement('div');
    infoDiv.className = 'child-document-info';
    
    // Create title element
    const titleElement = document.createElement('h4');
    titleElement.className = 'child-document-title';
    titleElement.textContent = child.title || 'Untitled Document';
    infoDiv.appendChild(titleElement);
    
    // Create author element
    const authorElement = document.createElement('div');
    authorElement.className = 'child-document-author';
    authorElement.innerHTML = `<i class="fas fa-user"></i> ${authors}`;
    infoDiv.appendChild(authorElement);
    
    // Create metadata section
    const metadataElement = document.createElement('div');
    metadataElement.className = 'child-document-metadata';
    
    // Add publication date if available
    if (pubDate) {
        const dateElement = document.createElement('div');
        dateElement.className = 'meta-item';
        dateElement.innerHTML = `<i class="fas fa-calendar-alt"></i> ${pubDate}`;
        metadataElement.appendChild(dateElement);
    }
    
    // Add document type if available
    if (documentType) {
        const typeElement = document.createElement('div');
        typeElement.className = 'meta-item';
        typeElement.innerHTML = `<i class="fas fa-file-alt"></i> ${formatCategoryName(documentType)}`;
        metadataElement.appendChild(typeElement);
    }
    
    infoDiv.appendChild(metadataElement);
    childCard.appendChild(infoDiv);
    
    // Create actions section
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'child-document-actions';
    
    // Add view button
    const viewButton = document.createElement('button');
    viewButton.className = 'action-button view';
    viewButton.innerHTML = '<i class="fas fa-eye"></i> View';
    viewButton.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // First fetch the document details to get the file path
        fetch(`/api/documents/${child.id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error fetching document: ${response.status}`);
                }
                return response.json();
            })
            .then(document => {
                if (document && document.file_path) {
                    // Open the PDF in a new tab or viewer
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
                    
                    // Use PDF viewer modal if available
                    if (typeof showPdfViewer === 'function') {
                        showPdfViewer(pdfPath, document.title || 'Document');
                    } else {
                        // Fallback to opening in new tab
                        window.open(pdfPath, '_blank');
                    }
                } else {
                    alert('PDF path not found for this document');
                }
            })
            .catch(error => {
                console.error('Error opening PDF:', error);
                alert(`Error opening document: ${error.message}`);
            });
    });
    
    actionsDiv.appendChild(viewButton);
    childCard.appendChild(actionsDiv);
    
    return childCard;
}

/**
 * Format authors array into a readable string
 * @param {Array} authors - Array of author objects
 * @returns {string} - Formatted authors string
 */
function formatAuthors(authors) {
    if (!authors || !Array.isArray(authors) || authors.length === 0) {
        return 'Unknown Author';
    }
    
    return authors.map(author => {
        // Handle full_name property first (from API)
        if (author.full_name) {
            return author.full_name;
        }
        
        // Handle first_name and last_name properties
        const firstName = author.first_name || '';
        const lastName = author.last_name || '';
        
        if (firstName || lastName) {
            return `${firstName} ${lastName}`.trim();
        }
        
        // Handle string format
        if (typeof author === 'string') {
            return author;
        }
        
        return '';
    }).filter(name => name).join(', ') || 'Unknown Author';
}

/**
 * Format date into a readable string
 * @param {string} date - Date string
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    if (!date) return 'Unknown Date';
    
    try {
        return new Date(date).toLocaleDateString();
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Unknown Date';
    }
}

/**
 * Generate colored dots for document topics
 * @param {Array} topics - Array of topic objects
 * @returns {string} - HTML for topic colors
 */
function getTopicColors(topics) {
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
        return '';
    }
    
    const topicColorHTML = topics.map(topic => {
        const topicColor = getTopicColor(topic.name);
        return `<span class="topic-dot" style="background-color: ${topicColor};" title="${topic.name}"></span>`;
    }).join('');
    
    return `<div class="topic-colors">${topicColorHTML}</div>`;
}

/**
 * Get a color for a topic based on its name
 * @param {string} topicName - Topic name
 * @returns {string} - CSS color value
 */
function getTopicColor(topicName) {
    if (!topicName) return '#888888';
    
    // Use a hash function to get a consistent color for each topic name
    let hash = 0;
    for (let i = 0; i < topicName.length; i++) {
        hash = topicName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert to hex color
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).slice(-2);
    }
    
    return color;
}

/**
 * Get the icon path for a category
 * @param {string} category - Category name
 * @returns {string} - Path to category icon
 */
function getCategoryIcon(category) {
    const iconMap = {
        'THESIS': 'icons/Category-icons/thesis.png',
        'Thesis': 'icons/Category-icons/thesis.png',
        'DISSERTATION': 'icons/Category-icons/dissertation.png',
        'Dissertation': 'icons/Category-icons/dissertation.png',
        'CONFLUENCE': 'icons/Category-icons/confluence.png',
        'Confluence': 'icons/Category-icons/confluence.png',
        'SYNERGY': 'icons/Category-icons/synergy.png',
        'Synergy': 'icons/Category-icons/synergy.png'
    };
    
    return iconMap[category] || 'icons/Category-icons/default_category_icon.png';
}

/**
 * Format category name for display
 * @param {string} category - Category name
 * @returns {string} - Formatted category name
 */
function formatCategoryName(category) {
    if (!category) return 'Uncategorized';
    
    // Map from database values to display names
    const displayMap = {
        'THESIS': 'Thesis',
        'DISSERTATION': 'Dissertation',
        'CONFLUENCE': 'Confluence',
        'SYNERGY': 'Synergy'
    };
    
    return displayMap[category] || category;
}

/**
 * Set up event listeners for a document card
 * @param {HTMLElement} card - Document card element
 * @param {Object} doc - Document data
 */
function setupDocumentCardEventListeners(card, doc) {
    // View button
    card.querySelector('.view-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        
        // First fetch the document details to get the file path
        fetch(`/api/documents/${doc.id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error fetching document: ${response.status}`);
                }
                return response.json();
            })
            .then(document => {
                if (document && document.file_path) {
                    // Open the PDF in a new tab
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
                    window.open(pdfPath, '_blank');
                } else {
                    alert('PDF path not found for this document');
                }
            })
            .catch(error => {
                console.error('Error opening PDF:', error);
                alert(`Error opening document: ${error.message}`);
            });
    });
    
    // Edit button
    card.querySelector('.edit-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        if (typeof editDocument === 'function') {
            // Use the editDocument function with isCompiled=false for regular documents
            editDocument(doc.id, false);
        } else if (typeof showEditModal === 'function') {
            showEditModal(doc.id);
        } else {
            alert(`Edit document: ${doc.title}`);
        }
    });
    
    // Delete (archive) button
    card.querySelector('.delete-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        if (window.documentArchive && typeof window.documentArchive.archiveDocument === 'function') {
            window.documentArchive.archiveDocument(doc.id);
        } else {
            alert(`This would archive document: ${doc.title}`);
        }
    });
}

/**
 * Set up event listeners for compiled document cards
 * @param {HTMLElement} card - The document card element
 * @param {Object} doc - Document object
 * @param {boolean} isExpanded - Whether the card is expanded
 * @param {Array} expandedDocIds - Array of expanded document IDs
 */
function setupCompiledDocumentCardEventListeners(card, doc, isExpanded, expandedDocIds) {
    // Function to toggle expansion state
    const toggleExpansion = function(e) {
        // Stop propagation to prevent multiple triggers
        e.stopPropagation();
        
        // Close any other open containers first
        document.querySelectorAll('.children-container').forEach(container => {
            if (container.parentElement !== card.parentElement) {
                const parentCard = container.previousElementSibling;
                if (parentCard && parentCard.querySelector('.toggle-indicator')) {
                    parentCard.querySelector('.toggle-indicator').textContent = '▶';
                }
                container.remove();
                // Update expanded state in array
                const docId = parseInt(parentCard.dataset.documentId);
                const idx = expandedDocIds.indexOf(docId);
                if (idx > -1) expandedDocIds.splice(idx, 1);
            }
        });
        
        // Toggle expansion
        if (isExpanded) {
            // Remove from expanded IDs
            const index = expandedDocIds.indexOf(doc.id);
            if (index > -1) {
                expandedDocIds.splice(index, 1);
            }
            
            // Update UI
            card.querySelector('.toggle-indicator').textContent = '▶';
            const childrenContainer = card.parentElement.querySelector(`.children-container[data-parent="${doc.id}"]`);
            if (childrenContainer) {
                childrenContainer.remove();
            }
        } else {
            // Add to expanded IDs
            if (!expandedDocIds.includes(doc.id)) {
                expandedDocIds.push(doc.id);
            }
            
            // Update UI
            card.querySelector('.toggle-indicator').textContent = '▼';
            
            // Create children container as a sibling after the card
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'children-container';
            childrenContainer.dataset.parent = doc.id;
            childrenContainer.style.display = 'block';
            childrenContainer.style.marginTop = '0';
            childrenContainer.style.marginBottom = '15px';
            childrenContainer.style.width = '95%';
            childrenContainer.style.marginLeft = 'auto';
            
            // Insert the container after the card
            card.parentElement.insertBefore(childrenContainer, card.nextSibling);
            
            // Load child documents
            fetchAndRenderChildDocuments(doc.id, childrenContainer);
        }
        
        // Update the expanded state
        isExpanded = !isExpanded;
    };
    
    // Make an expansion area element to consolidate click handling
    const expandAreaSelector = document.createElement('div');
    expandAreaSelector.className = 'expansion-area';
    expandAreaSelector.style.cursor = 'pointer';
    expandAreaSelector.innerHTML = card.querySelector('.document-title').innerHTML;
    
    // Replace title with our expansion area
    card.querySelector('.document-title').innerHTML = '';
    card.querySelector('.document-title').appendChild(expandAreaSelector);
    
    // Set up a single click handler on the expansion area
    expandAreaSelector.addEventListener('click', toggleExpansion);
    
    // Do NOT set up click handler on the expand button - it was causing duplicate triggers
    const expandBtn = card.querySelector('.expand-btn');
    if (expandBtn) {
        expandBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Stop propagation to prevent bubbling
            toggleExpansion(e);  // Directly call the toggle function
        });
    }
    
    // Set up edit button event
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof editDocument === 'function') {
                // Use the editDocument function with isCompiled=true for compiled documents
                editDocument(doc.id, true);
            } else if (typeof showCompiledEditModal === 'function') {
                showCompiledEditModal(doc.id);
            } else {
                alert(`Edit compiled document: ${doc.title || 'Untitled Compilation'}`);
            }
        });
    }
    
    // Set up delete button event
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // First check if our archiveCompiledDocument function is available
            if (window.documentArchive && typeof window.documentArchive.archiveCompiledDocument === 'function') {
                if (confirm(`Are you sure you want to archive "${doc.title || 'this compilation'}" and all its child documents? They will be moved to the archive.`)) {
                    console.log(`Using archiveCompiledDocument for compiled document ${doc.id}`);
                    
                    // Show a toast notification that archiving is in progress
                    if (typeof showToast === 'function') {
                        showToast('Archiving document...', 'info');
                    }
                    
                    // Disable the delete button to prevent multiple clicks
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    
                    // Call the archive function
                    window.documentArchive.archiveCompiledDocument(doc.id)
                        .catch(error => {
                            console.error('Error archiving compiled document:', error);
                            
                            // Show a more detailed error message
                            if (typeof showToast === 'function') {
                                const errorMsg = error.message || 'Server connection error';
                                showToast(`Archive failed: ${errorMsg}. Please try again later or contact support.`, 'error');
                            }
                        })
                        .finally(() => {
                            // Re-enable the delete button
                            deleteBtn.disabled = false;
                            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                        });
                }
            } 
            // Fall back to generic confirmation function if available
            else if (typeof confirmDeleteCompiledDocument === 'function') {
                confirmDeleteCompiledDocument(doc.id);
            } 
            // Last resort fallback
            else {
                if (confirm(`Are you sure you want to delete "${doc.title || 'this compilation'}" and all its child documents?`)) {
                    alert(`Compiled document ${doc.id} would be deleted`);
                }
            }
        });
    }
}

/**
 * Fetch and render child documents for a compiled document
 * @param {string|number} compiledDocId - Compiled document ID
 * @param {HTMLElement} container - Container to render children in
 */
function fetchAndRenderChildDocuments(compiledDocId, container) {
    // Show loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-children';
    loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading documents...';
    container.appendChild(loadingElement);
    
    // Fetch child documents
    fetch(`/api/documents/${compiledDocId}/children`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch child documents: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Remove loading indicator
            container.removeChild(loadingElement);
            
            // Check if there are any child documents
            if (!data.documents || data.documents.length === 0) {
                const noChildrenElement = document.createElement('div');
                noChildrenElement.className = 'no-children-message';
                noChildrenElement.textContent = 'No documents found in this compilation';
                container.appendChild(noChildrenElement);
                return;
            }
            
            // Create a fragment to hold all child documents
            const fragment = document.createDocumentFragment();
            
            // Render each child document
            data.documents.forEach(childDoc => {
                try {
                    const childCard = createChildDocumentCard(childDoc);
                    fragment.appendChild(childCard);
                } catch (error) {
                    console.error(`Error rendering child document ${childDoc.id}:`, error);
                    // Add error indicator
                    const errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    errorElement.textContent = `Error loading document: ${childDoc.title || 'Unknown'}`;
                    fragment.appendChild(errorElement);
                }
            });
            
            // Add all child documents to container
            container.appendChild(fragment);
        })
        .catch(error => {
            console.error('Error fetching child documents:', error);
            
            // Remove loading indicator
            if (container.contains(loadingElement)) {
                container.removeChild(loadingElement);
            }
            
            // Show error message
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error loading documents: ${error.message}`;
            container.appendChild(errorElement);
        });
} 