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
    
    // Format authors
    const authors = formatAuthors(doc.authors);
    
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
                Volume ${doc.volume || ''} ${doc.volume && doc.issue ? '| Issue ' + doc.issue : ''} 
                <br>Authors: ${authors}
            </div>
            <div class="category-badge ${(documentType || '').toLowerCase()}">${category}</div>
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
    
    return card;
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
    
    // Create card HTML with improved display - hide elements if data is missing
    card.innerHTML = `
        <div class="document-icon">
            <img src="${getCategoryIcon(documentType)}" alt="${category} Icon">
        </div>
        <div class="document-info">
            <h3 class="document-title">
                <span class="toggle-indicator">${toggleIndicator}</span>
                ${doc.title || 'Untitled Compilation'}
            </h3>
            <div class="document-meta">
                
                
                <span class="meta-item"><i class="fas fa-file-alt"></i> ${doc.child_count || 0} document${doc.child_count !== 1 ? 's' : ''}</span>
            </div>
            
        </div>
        <div class="document-actions">
            <button class="action-btn expand-btn" title="View Child Documents">
                <i class="fas fa-list"></i>
            </button>
            <button class="action-btn edit-btn" title="Edit Compilation">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" title="Delete Compilation">
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
    
    // Add styling to match the screenshot
    childCard.style.display = 'flex';
    childCard.style.justifyContent = 'space-between';
    childCard.style.alignItems = 'center';
    childCard.style.padding = '10px 15px';
    childCard.style.margin = '5px 0';
    childCard.style.borderRadius = '4px';
    childCard.style.backgroundColor = 'white';
    childCard.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    childCard.style.transition = 'all 0.2s ease';
    
    // Format authors
    const authors = formatAuthors(child.authors);
    
    // Format date
    const pubDate = formatDate(child.publish_date || child.publication_date);
    
    // Format document type - try category_name first, then document_type
    const documentType = child.document_type || child.doc_type || '';
    const category = formatCategoryName(documentType);
    
    childCard.innerHTML = `
        <div class="document-info" style="flex: 1;">
            <h4 class="document-title" style="margin: 0 0 5px 0; font-size: 16px;">${child.title || 'Untitled Document'}</h4>
            <div class="document-meta" style="font-size: 13px; color: #666;">
                 ${authors || 'Unknown Author'}
            </div>
        </div>
        <div class="document-actions" style="display: flex; gap: 8px;">
            <button class="action-btn view-btn" title="View Document" style="background: #4299e1; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">
                View
            </button>
        </div>
    `;
    
    // Add hover effect
    childCard.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#f0f7ff';
        this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.15)';
    });
    
    childCard.addEventListener('mouseout', function() {
        this.style.backgroundColor = 'white';
        this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    });
    
    // Add event listener for view button
    childCard.querySelector('.view-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        if (typeof showPreviewModal === 'function') {
            showPreviewModal(child.id);
        } else {
            alert(`Preview document: ${child.title}`);
        }
    });
    
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
    
    return authors.map(author => 
        `${author.first_name || ''} ${author.last_name || ''}`
    ).join(', ');
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
        if (typeof showPreviewModal === 'function') {
            showPreviewModal(doc.id);
        } else {
            alert(`View document: ${doc.title}`);
        }
    });
    
    // Edit button
    card.querySelector('.edit-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        if (typeof showEditModal === 'function') {
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
            if (typeof showCompiledEditModal === 'function') {
                showCompiledEditModal(doc.id);
            } else {
                alert(`Edit compiled document: ${doc.title}`);
            }
        });
    }
    
    // Set up delete button event
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof confirmDeleteCompiledDocument === 'function') {
                confirmDeleteCompiledDocument(doc.id);
            } else {
                if (confirm(`Are you sure you want to delete "${doc.title}" and all its child documents?`)) {
                    alert(`Compiled document ${doc.id} would be deleted`);
                }
            }
        });
    }
}

/**
 * Fetch and render child documents for a compiled document
 * @param {string|number} compiledDocId - Parent document ID
 * @param {HTMLElement} container - Container to render child documents in
 */
function fetchAndRenderChildDocuments(compiledDocId, container) {
    // Show loading
    container.innerHTML = '<div class="loading-children"><i class="fas fa-spinner fa-spin"></i> Loading child documents...</div>';
    
    // Set full width styling on the container
    container.style.width = '100%';
    container.style.marginLeft = '0';
    container.style.borderLeft = '4px solid #3498db';
    container.style.backgroundColor = '#f8f9fa';
    
    // Fetch child documents from API
    fetch(`/api/documents/${compiledDocId}/children`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // API now returns an object with a "documents" property
            if (!data || !data.documents || !Array.isArray(data.documents)) {
                console.error('Invalid child documents data:', data);
                throw new Error('Invalid data format for child documents');
            }
            
            // Get the documents array from the response
            const childDocs = data.documents;
            
            // Clear container
            container.innerHTML = '';
            
            // If no children, show message
            if (childDocs.length === 0) {
                container.innerHTML = '<div class="no-children" style="padding: 15px; text-align: center;">No child documents found</div>';
                return;
            }
            
            // Create a wrapper for the child documents
            const childrenWrapper = document.createElement('div');
            childrenWrapper.className = 'children-wrapper';
            childrenWrapper.style.width = '100%';
            childrenWrapper.style.padding = '10px 0';
            container.appendChild(childrenWrapper);
            
            // Render each child document
            childDocs.forEach(child => {
                const childCard = createChildDocumentCard(child);
                childrenWrapper.appendChild(childCard);
            });
        })
        .catch(error => {
            console.error('Error fetching child documents:', error);
            container.innerHTML = `<div class="error-message" style="padding: 15px; color: #e74c3c;">Error loading child documents: ${error.message}</div>`;
        });
} 