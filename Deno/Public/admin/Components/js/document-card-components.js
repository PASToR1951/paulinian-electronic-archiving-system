/**
 * Document Card Components
 * 
 * This file contains the functions for creating document cards
 * both single and compiled document types, including helper functions.
 */

/**
 * Creates a document card for a single document
 * 
 * @param {Object} doc - The document object
 * @return {HTMLElement} - The document card element
 */
function createDocumentCard(doc) {
    // Format date for display
    const date = new Date(doc.publication_date);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Format authors for display
    const authorText = doc.authors && doc.authors.length > 0
        ? doc.authors.map(author => author.full_name).join(', ')
        : 'Unknown Author';

    // Create HTML for topics/research agenda with colored tags
    let topicsHtml = '';
    if (doc.topics && doc.topics.length > 0) {
        topicsHtml = doc.topics.map(topic => {
            const color = generateTopicColor(topic.name);
            return `<span class="topic-tag" style="background-color: ${color}">${topic.name}</span>`;
        }).join('');
    } else {
        topicsHtml = '<span class="no-topics">None</span>';
    }

    // Ensure consistent display with category
    const displayCategory = doc.category_name || 'Uncategorized';

    // Create card with flexbox layout
    const card = document.createElement('div');
    card.className = 'document-card';
    card.setAttribute('data-id', doc.id);
    card.setAttribute('data-category', displayCategory);
    card.setAttribute('data-document-type', doc.document_type || '');
    
    card.innerHTML = `
        <div class="card-header">
            <div class="document-title">${doc.title}</div>
            <div class="document-actions">
                <button class="preview-btn" title="Preview"><i class="fas fa-eye"></i></button>
                <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="card-body">
            <div class="document-meta">
                <span class="author">${authorText}</span>
                <span class="date">${formattedDate}</span>
            </div>
            <div class="document-abstract">${doc.abstract || 'No abstract available'}</div>
            <div class="document-footer">
                <div class="research-agenda">
                    <div class="section-label">Research Agenda:</div>
                    <div class="topics-container">${topicsHtml}</div>
                </div>
                <div class="document-stats">
                    <span class="metadata-item"><i class="fas fa-folder"></i> ${displayCategory}</span>
                    ${doc.document_type && doc.document_type.toUpperCase() !== displayCategory.toUpperCase() ? 
                      `<span class="metadata-item"><i class="fas fa-file"></i> ${doc.document_type}</span>` : ''}
                    <span class="metadata-item"><i class="fas fa-file-alt"></i> ${doc.pages || 0} pages</span>
                </div>
            </div>
        </div>
    `;

    // Add event listeners for actions
    setupSingleDocumentEventListeners(card, doc.id);
    
    return card;
}

/**
 * Creates a compiled document card (with children)
 * 
 * @param {Object} doc - The document object
 * @param {Array<string>} expandedDocIds - List of expanded document IDs
 * @return {HTMLElement} - The compiled document card element
 */
function createCompiledDocumentCard(doc, expandedDocIds = []) {
    const isExpanded = expandedDocIds.includes(doc.id.toString());
    
    // Direct mapping for document types to icon paths
    const iconMapping = {
        'CONFLUENCE': 'icons/Category-icons/confluence.png',
        'SYNERGY': 'icons/Category-icons/synergy.png',
        'THESIS': 'icons/Category-icons/thesis.png',
        'DISSERTATION': 'icons/Category-icons/dissertation.png'
    };
    
    // Category name to icon mapping
    const categoryMapping = {
        'Confluence': 'icons/Category-icons/confluence.png',
        'Synergy': 'icons/Category-icons/synergy.png',
        'Thesis': 'icons/Category-icons/thesis.png',
        'Dissertation': 'icons/Category-icons/dissertation.png'
    };
    
    // PRIORITIZE CATEGORY NAME FOR ICON SELECTION AND DISPLAY
    // This ensures consistency with the category filter
    const displayCategory = doc.category_name || 'Uncategorized';
    let iconPath;
    if (displayCategory && categoryMapping[displayCategory]) {
        // Use category name for icon if available
        iconPath = categoryMapping[displayCategory];
    } else {
        // Fall back to document type if category doesn't match
        const documentType = doc.document_type ? doc.document_type.toUpperCase() : '';
        iconPath = iconMapping[documentType] || 'icons/Category-icons/default_category_icon.png';
    }
    
    const card = document.createElement('div');
    card.className = 'document-card compilation';
    card.setAttribute('data-id', doc.id);
    card.setAttribute('data-is-expanded', isExpanded);
    card.setAttribute('data-document-type', doc.document_type || '');
    card.setAttribute('data-category', displayCategory);
    
    // Format years for compiled documents
    const years = [];
    if (doc.start_year) years.push(doc.start_year);
    if (doc.end_year) years.push(doc.end_year);
    const yearStr = years.length > 0 ? years.join(' - ') : 'N/A';
    
    // Get child count
    const childCount = doc.children?.length || 0;
    
    card.innerHTML = `
        <div class="document-icon">
            <img src="${iconPath}" alt="${displayCategory}" class="category-icon">
        </div>
        <div class="document-info">
            <h3 class="document-title">${doc.title}</h3>
            <p class="document-volume">Volume ${doc.volume || 'N/A'}${doc.issue ? ', Issue ' + doc.issue : ''}</p>
            <div class="document-metadata">
                <span class="metadata-item"><i class="far fa-calendar"></i> ${yearStr}</span>
                <span class="metadata-item"><i class="fas fa-tag"></i> ${displayCategory}</span>
                ${doc.document_type && doc.document_type.toUpperCase() !== displayCategory.toUpperCase() ? 
                  `<span class="metadata-item"><i class="fas fa-file-text"></i> ${doc.document_type}</span>` : ''}
                <span class="metadata-item"><i class="fas fa-book"></i> ${childCount} studies</span>
            </div>
            <button class="toggle-children-btn">
                <i class="fas fa-chevron-${isExpanded ? 'up' : 'down'}"></i> 
                ${isExpanded ? 'Hide' : 'Show'} Studies
            </button>
        </div>
        <div class="document-actions">
            <button class="action-btn edit-document-btn" title="Edit Compiled Document"><i class="far fa-edit"></i></button>
            <button class="action-btn delete-document-btn" title="Delete Compiled Document"><i class="far fa-trash-alt"></i></button>
        </div>
        <div class="children-container" style="display: ${isExpanded ? 'block' : 'none'}">
            <!-- Child documents will be loaded here -->
            <div class="loading-children">Loading studies...</div>
        </div>
    `;
    
    return card;
}

/**
 * Creates a card for a child document within a compiled document
 * 
 * @param {Object} child - The child document object
 * @return {HTMLElement} - The child document card element
 */
function createChildDocumentCard(child) {
    const date = new Date(child.publication_date);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Format authors
    const authorText = child.authors && child.authors.length > 0
        ? child.authors.map(author => author.full_name).join(', ')
        : 'Unknown Author';

    // Create HTML for topics/research agenda with colored tags
    let topicsHtml = '';
    if (child.topics && child.topics.length > 0) {
        topicsHtml = child.topics.map(topic => {
            const color = generateTopicColor(topic.name);
            return `<span class="topic-tag" style="background-color: ${color}">${topic.name}</span>`;
        }).join('');
    } else {
        topicsHtml = '<span class="no-topics">None</span>';
    }

    const childCard = document.createElement('div');
    childCard.className = 'child-document-card';
    childCard.setAttribute('data-id', child.id);
    
    childCard.innerHTML = `
        <div class="card-header">
            <div class="document-title">${child.title}</div>
            <div class="document-actions">
                <button class="preview-btn" title="Preview"><i class="fas fa-eye"></i></button>
            </div>
        </div>
        <div class="card-body">
            <div class="document-meta">
                <span class="author">${authorText}</span>
                <span class="date">${formattedDate}</span>
            </div>
            <div class="document-abstract">${child.abstract || 'No abstract available'}</div>
            <div class="document-footer">
                <div class="research-agenda">
                    <div class="section-label">Research Agenda:</div>
                    <div class="topics-container">${topicsHtml}</div>
                </div>
                <div class="document-stats">
                    <span class="metadata-item"><i class="fas fa-folder"></i> ${child.category_name}</span>
                    <span class="metadata-item"><i class="fas fa-file-alt"></i> ${child.pages || 0} pages</span>
                </div>
            </div>
        </div>
    `;

    return childCard;
}

/**
 * Setup event listeners for a single document card
 * 
 * @param {HTMLElement} card - The document card element
 * @param {number|string} documentId - The document ID
 */
function setupSingleDocumentEventListeners(card, documentId) {
    // Preview button
    const previewBtn = card.querySelector('.preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof window.previewDocument === 'function') {
                window.previewDocument(documentId);
            } else if (typeof window.showDocumentPreview === 'function') {
                fetch(`/api/documents/${documentId}`)
                    .then(response => response.json())
                    .then(doc => {
                        window.showDocumentPreview(doc);
                    })
                    .catch(error => {
                        console.error('Error fetching document for preview:', error);
                    });
            }
        });
    }
    
    // Edit button
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof window.editDocument === 'function') {
                window.editDocument(documentId);
            }
        });
    }
    
    // Delete button
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof window.confirmDeleteDocument === 'function') {
                window.confirmDeleteDocument(documentId);
            } else if (typeof window.openDeleteConfirmation === 'function') {
                const documentTitle = card.querySelector('.document-title').textContent;
                window.openDeleteConfirmation({
                    id: documentId,
                    title: documentTitle
                });
            }
        });
    }
    
    // Click on entire card
    card.addEventListener('click', function() {
        if (typeof window.showDocumentPreview === 'function') {
            fetch(`/api/documents/${documentId}`)
                .then(response => response.json())
                .then(doc => {
                    window.showDocumentPreview(doc);
                })
                .catch(error => {
                    console.error('Error fetching document for preview:', error);
                });
        }
    });
}

/**
 * Setup event listeners for a compiled document card
 * 
 * @param {HTMLElement} card - The compiled document card element
 */
function setupCompiledDocumentEventListeners(card) {
    const documentId = card.getAttribute('data-id');
    
    // Edit button
    const editBtn = card.querySelector('.edit-document-btn');
    if (editBtn) {
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof window.editDocument === 'function') {
                window.editDocument(documentId);
            }
        });
    }
    
    // Delete button
    const deleteBtn = card.querySelector('.delete-document-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof window.openDeleteConfirmation === 'function') {
                const documentTitle = card.querySelector('.document-title').textContent;
                window.openDeleteConfirmation({
                    id: documentId,
                    title: documentTitle
                });
            }
        });
    }
    
    // Toggle button
    const toggleBtn = card.querySelector('.toggle-children-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleChildrenContainer(card, documentId);
        });
    }
    
    // Make entire card clickable for toggling
    card.addEventListener('click', function(e) {
        // Don't handle clicks on action buttons
        if (e.target.closest('.document-actions')) {
            return;
        }
        
        toggleChildrenContainer(card, documentId);
    });
    
    // Setup preview button for each child document card
    setupChildDocumentEventListeners(card);
}

/**
 * Toggle children container for a compiled document
 * 
 * @param {HTMLElement} card - The compiled document card
 * @param {string|number} documentId - The document ID
 */
function toggleChildrenContainer(card, documentId) {
    const childrenContainer = card.querySelector('.children-container');
    const toggleBtn = card.querySelector('.toggle-children-btn');
    
    if (childrenContainer && toggleBtn) {
        const isExpanded = childrenContainer.style.display !== 'none';
        childrenContainer.style.display = isExpanded ? 'none' : 'block';
        
        // Update the button text and icon
        toggleBtn.innerHTML = isExpanded 
            ? '<i class="fas fa-chevron-down"></i> Show Studies' 
            : '<i class="fas fa-chevron-up"></i> Hide Studies';
        
        // Update the data attribute for tracking expanded state
        card.setAttribute('data-is-expanded', !isExpanded);
        
        // Load children if needed
        if (!isExpanded && documentId) {
            if (typeof window.ensureAllChildDocumentsLoaded === 'function') {
                window.ensureAllChildDocumentsLoaded(documentId, childrenContainer);
            }
        }
    }
}

/**
 * Setup event listeners for child document cards
 * 
 * @param {HTMLElement} compiledCard - The parent compiled document card
 */
function setupChildDocumentEventListeners(compiledCard) {
    const childCards = compiledCard.querySelectorAll('.child-document-card');
    childCards.forEach(childCard => {
        const childId = childCard.getAttribute('data-id');
        const previewBtn = childCard.querySelector('.preview-btn');
        
        if (previewBtn && childId) {
            previewBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (typeof window.previewDocument === 'function') {
                    window.previewDocument(childId);
                }
            });
        }
    });
}

/**
 * Generate a color for a research agenda topic
 * 
 * @param {string} topicName - The name of the topic
 * @return {string} - A hex color code
 */
function generateTopicColor(topicName) {
    // Create a simple hash of the topic name
    let hash = 0;
    for (let i = 0; i < topicName.length; i++) {
        hash = topicName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to a hue value (0-360)
    const hue = hash % 360;
    
    // Use HSL to create a vibrant but not too dark color
    // Saturation and lightness values chosen for readability
    return `hsl(${hue}, 70%, 65%)`;
}

/**
 * Helper function to generate research agenda bubbles with different colors
 * 
 * @param {Array} topics - Array of topic objects
 * @return {string} HTML for the topic bubbles
 */
function getResearchAgendaBubbles(topics) {
    if (!topics || topics.length === 0) return '<span class="topic-tag no-topics">N/A</span>';
    
    // Array of colors for the bubbles
    const colors = [
        '#4285F4', '#EA4335', '#FBBC05', '#34A853', // Google colors
        '#8E44AD', '#3498DB', '#1ABC9C', '#F39C12', // More colors
        '#D35400', '#2ECC71', '#E74C3C', '#16A085'  // Even more colors
    ];
    
    return topics.map((topic, index) => {
        const colorIndex = index % colors.length;
        const bgColor = colors[colorIndex];
        const textColor = isLightColor(bgColor) ? '#333' : '#fff';
        
        return `<span class="topic-tag research-agenda-bubble" style="background-color: ${bgColor}; color: ${textColor};">${topic.name || topic}</span>`;
    }).join('');
}

/**
 * Helper function to determine if a color is light or dark
 * 
 * @param {string} color - Hex color code
 * @return {boolean} - True if the color is light
 */
function isLightColor(color) {
    // Convert hex to RGB
    let r, g, b;
    if (color.length === 7) {
        r = parseInt(color.substring(1, 3), 16);
        g = parseInt(color.substring(3, 5), 16);
        b = parseInt(color.substring(5, 7), 16);
    } else {
        return true; // Default to light if invalid color
    }
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128; // Return true if color is light
}

// Export all functions for use in other modules
window.documentCardComponents = {
    createDocumentCard,
    createCompiledDocumentCard,
    createChildDocumentCard,
    setupSingleDocumentEventListeners,
    setupCompiledDocumentEventListeners,
    setupChildDocumentEventListeners,
    toggleChildrenContainer,
    generateTopicColor,
    getResearchAgendaBubbles,
    isLightColor
}; 