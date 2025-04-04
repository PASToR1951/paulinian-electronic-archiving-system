// Globals
let currentPage = 1;
const pageSize = 10;
let totalEntries = 0;
let currentCategoryFilter = null; // Track current category filter

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();

        // Log available categories for debugging
        console.log("Available categories:", categories);

        // Calculate total file count for the "All" category
        let totalFileCount = 0;
        categories.forEach(category => {
            totalFileCount += category.file_count;
        });

        // Update the "All" category file count
        const allCategoryElement = document.querySelector('.category[data-category="All"]');
        if (allCategoryElement) {
            const fileCountElement = allCategoryElement.querySelector(".category-file-count");
            fileCountElement.textContent = `${totalFileCount} files`;
            
            // Add click handler for "All" category
            allCategoryElement.removeEventListener('click', allCategoryElement.clickHandler);
            allCategoryElement.clickHandler = () => {
                console.log("All category clicked");
                filterByCategory("All");
            };
            allCategoryElement.addEventListener('click', allCategoryElement.clickHandler);
            allCategoryElement.style.cursor = 'pointer';
        }

        categories.forEach(category => {
            // Find existing category element using data-category attribute
            const categoryElement = document.querySelector(`.category[data-category="${category.category_name}"]`);
            console.log(`Looking for category element: ${category.category_name}`, categoryElement);

            if (categoryElement) {
                console.log(`Found category element for ${category.category_name}`);
                
                // Update only the file count
                const fileCountElement = categoryElement.querySelector(".category-file-count");
                fileCountElement.textContent = `${category.file_count} files`;
                
                // Remove any existing click event to avoid duplicates
                categoryElement.removeEventListener('click', categoryElement.clickHandler);
                
                // Define the click handler and store reference for later removal
                categoryElement.clickHandler = () => {
                    console.log(`Category clicked: ${category.category_name}`);
                    filterByCategory(category.category_name);
                };
                
                // Add click event to filter by category
                categoryElement.addEventListener('click', categoryElement.clickHandler);
                
                // Make it visually clickable
                categoryElement.style.cursor = 'pointer';
            } else {
                console.warn(`Category element not found for: ${category.category_name}`);
            }
        });
        
        // Add direct click handler for Confluence category specifically
        const confluenceElement = document.querySelector('.category[data-category="Confluence"]');
        if (confluenceElement) {
            console.log("Found Confluence category element, ensuring click handler is attached");
            if (!confluenceElement.hasDirectHandler) {
                confluenceElement.hasDirectHandler = true;
                confluenceElement.addEventListener('click', function() {
                    console.log("Confluence category clicked directly");
                    filterByCategory("Confluence");
                });
            }
        } else {
            console.warn("Confluence category element not found!");
        }
        
        // Add direct click handler for Dissertation category specifically
        const dissertationElement = document.querySelector('.category[data-category="Dissertation"]');
        if (dissertationElement) {
            console.log("Found Dissertation category element, ensuring click handler is attached");
            if (!dissertationElement.hasDirectHandler) {
                dissertationElement.hasDirectHandler = true;
                dissertationElement.addEventListener('click', function() {
                    console.log("Dissertation category clicked directly");
                    filterByCategory("Dissertation");
                });
            }
        } else {
            console.warn("Dissertation category element not found!");
        }
        
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}

// Filter documents by category - making it globally accessible
window.filterByCategory = function(categoryName) {
    console.log(`Filtering by category: ${categoryName}`);
    
    // Toggle filter if clicking the same category again
    if (currentCategoryFilter === categoryName) {
        console.log("Clearing category filter");
        currentCategoryFilter = null;
        document.querySelectorAll('.category').forEach(cat => {
            cat.classList.remove('active');
        });
    } else {
        console.log(`Setting filter to: ${categoryName}`);
        currentCategoryFilter = categoryName;
        
        // Highlight the selected category
        document.querySelectorAll('.category').forEach(cat => {
            if (cat.getAttribute('data-category') === categoryName) {
                cat.classList.add('active');
                console.log(`Activated category: ${categoryName}`);
            } else {
                cat.classList.remove('active');
            }
        });
    }
    
    // Reset to first page and reload documents with filter
    currentPage = 1;
    loadDocuments(currentPage);
    
    // Update the filter indicator
    updateFilterIndicator();
}

// Add this new function to update the filter indicator
function updateFilterIndicator() {
    let filterIndicator = document.getElementById('filter-indicator');
    if (!filterIndicator) {
        filterIndicator = document.createElement('div');
        filterIndicator.id = 'filter-indicator';
        const table = document.getElementById('docs-table');
        table.parentNode.insertBefore(filterIndicator, table);
    }
    
    if (currentCategoryFilter && currentCategoryFilter !== "All") {
        filterIndicator.innerHTML = `
            <span class="filter-badge">Filtered by: ${currentCategoryFilter}</span>
            <button id="clear-filter" onclick="filterByCategory('${currentCategoryFilter}')">Clear Filter</button>
        `;
        filterIndicator.style.display = 'block';
    } else {
        filterIndicator.style.display = 'none';
    }
}

// Load categories and first page of documents on page load
document.addEventListener("DOMContentLoaded", () => {
    console.clear(); // Clear console for cleaner debugging
    console.log("Document ready, setting up category filtering");
    
    // First check if category elements exist in the DOM
    const categoryElements = document.querySelectorAll('.category');
    console.log(`Found ${categoryElements.length} category elements in the DOM:`);
    
    // Add direct click handlers for each category
    // Hard-coding the most common categories to ensure they work
    setupCategoryHandler("All");
    setupCategoryHandler("Confluence");
    setupCategoryHandler("Thesis");
    setupCategoryHandler("Dissertation");
    setupCategoryHandler("Synthesis");
    
    // Also try to set up handlers for any categories found in the DOM
    categoryElements.forEach(el => {
        const categoryName = el.getAttribute('data-category');
        if (categoryName) {
            console.log(`Found category in DOM: "${categoryName}"`);
            setupCategoryHandler(categoryName);
        } else {
            console.warn("Found category element without data-category attribute");
        }
    });
    
    // Add special direct handler for Thesis since it seems to have issues
    const thesisElement = document.querySelector('.category[data-category="Thesis"]');
    if (thesisElement) {
        console.log("Adding special direct handler for Thesis category");
        // Direct onclick attribute
        thesisElement.setAttribute('onclick', 'thesisClickHandler(); return false;');
        
        // Also add global handler
        window.thesisClickHandler = function() {
            console.log("Thesis special handler activated");
            currentCategoryFilter = "Thesis";
            
            // Highlight only this category
            document.querySelectorAll('.category').forEach(cat => {
                if (cat.getAttribute('data-category') === "Thesis") {
                    cat.classList.add('active');
                } else {
                    cat.classList.remove('active');
                }
            });
            
            // Directly load and filter documents
            currentPage = 1;
            loadDocuments(currentPage);
        };
    }
    
    // Load categories and documents
    loadCategories();
    loadDocuments(currentPage);
    
    // Hide the table header
    const tableHeader = document.querySelector("#docs-table thead");
    if (tableHeader) {
        tableHeader.style.display = "none";
    }
    
    // CSS has been moved to documents_page.css
    
    // Create direct links for categories if they don't exist
    const categoriesContainer = document.querySelector('.categories-container') || document.querySelector('.category').parentNode;
    if (categoriesContainer) {
        const addCategoryLink = (name) => {
            // Check if it already exists
            if (!document.querySelector(`.category[data-category="${name}"]`)) {
                console.log(`Creating link for missing category: ${name}`);
                const link = document.createElement('div');
                link.className = 'category';
                link.setAttribute('data-category', name);
                link.innerHTML = `
                    <div class="category-icon"><img src="/admin/Components/icons/Category-icons/confluence.png" alt="${name}"></div>
                    <div class="category-name">${name}</div>
                    <div class="category-file-count">? files</div>
                `;
                link.addEventListener('click', () => filterByCategory(name));
                categoriesContainer.appendChild(link);
            }
        };
        
        // Add links for common categories if they don't exist
        addCategoryLink('Confluence');
        addCategoryLink('Thesis');
        addCategoryLink('Dissertation');
    }
});

// Helper function to set up category handlers
function setupCategoryHandler(categoryName) {
    if (!categoryName) return;
    
    const element = document.querySelector(`.category[data-category="${categoryName}"]`);
    if (element) {
        console.log(`Setting up handler for "${categoryName}" category`);
        
        // Make sure it's visibly clickable
        element.style.cursor = 'pointer';
        
        // Add inline click handler
        element.setAttribute('onclick', `filterByCategory('${categoryName}'); return false;`);
        
        // Add standard event listener
        element.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Category clicked: "${categoryName}"`);
            filterByCategory(categoryName);
        });
    } else {
        console.warn(`Could not find element for category: "${categoryName}"`);
    }
}

async function loadDocuments(page = 1) {
    try {
        let url = `/api/documents?page=${page}&size=${pageSize}`;
        
        // Only add category parameter if a filter is active and it's not "All"
        if (currentCategoryFilter && currentCategoryFilter !== "All") {
            url += `&category=${encodeURIComponent(currentCategoryFilter)}`;
            console.log(`Applying category filter: ${currentCategoryFilter}`);
        }
        
        console.log(`Fetching documents from: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log('Received document data:', data);
        
        let documents = Array.isArray(data) ? data : [];
        
        const tbody = document.querySelector("#docs-table tbody");
        tbody.innerHTML = "";

        if (documents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-message">
                        No documents found${currentCategoryFilter && currentCategoryFilter !== "All" ? ` in category "${currentCategoryFilter}"` : ''}
                    </td>
                </tr>
            `;
            return;
        }

        // Filter documents by category on the client side as well
        if (currentCategoryFilter && currentCategoryFilter !== "All") {
            documents = documents.filter(doc => 
                doc.category_name && 
                doc.category_name.toLowerCase() === currentCategoryFilter.toLowerCase()
            );
        }

        documents.forEach(doc => {
            // Log document data for debugging
            console.log('Processing document:', doc);
            
            const row = document.createElement("tr");
            row.className = "document-card";
            
            const categoryIcon = getCategoryIcon(doc.category_name);
            
            const iconCell = document.createElement("td");
            iconCell.className = "doc-icon";
            iconCell.innerHTML = `<img src="${categoryIcon}" alt="${doc.category_name} Icon">`;
            
            const infoCell = document.createElement("td");
            infoCell.className = "doc-info";
            
            let authorDisplay = '';
            if (doc.author_names && Array.isArray(doc.author_names) && doc.author_names.length > 0) {
                authorDisplay = doc.author_names.join(', ');
            } else if (doc.author_name) {
                authorDisplay = doc.author_name;
            } else {
                authorDisplay = 'No Author Listed';
            }
            
            let headerContent = `<span class="doc-title">${doc.title || 'Untitled'}</span>`;
            headerContent += ` | <span class="doc-author">${authorDisplay}</span>`;
            
            if (doc.publication_date) {
                headerContent += ` | <span class="doc-year">${new Date(doc.publication_date).getFullYear()}</span>`;
            }

            // Process topics
            let topicsHtml = '';
            if (doc.document_topics && Array.isArray(doc.document_topics) && doc.document_topics.length > 0) {
                topicsHtml = doc.document_topics.map(topic => 
                    `<span class="tag topic">${topic.topic_name}</span>`
                ).join('');
            } else if (doc.topics && Array.isArray(doc.topics) && doc.topics.length > 0) {
                topicsHtml = doc.topics.map(topic => 
                    `<span class="tag topic">${typeof topic === 'string' ? topic : topic.topic_name}</span>`
                ).join('');
            } else {
                topicsHtml = '<span class="tag topic muted">No topics</span>';
            }
            
            infoCell.innerHTML = `
                <div class="doc-header">
                    ${headerContent}
                </div>
                <div class="doc-tags">
                    <span class="tag document-type">${doc.category_name || 'Uncategorized'}</span>
                    ${topicsHtml}
                </div>
            `;
            
            // Create actions cell
            const actionsCell = document.createElement("td");
            actionsCell.className = "actions";
            actionsCell.innerHTML = `
                <a href="#" class="view-icon" title="View Document" data-doc-id="${doc.id}">
                    <i class="fas fa-eye" aria-hidden="true">👁️</i> View
                </a>
                <a href="#" class="edit-icon" title="Edit Document" data-doc-id="${doc.id}">
                    <i class="fas fa-edit" aria-hidden="true">✏️</i> Edit
                </a>
                <a href="#" class="delete-icon" title="Delete Document" data-doc-id="${doc.id}">
                    <i class="fas fa-trash-alt" aria-hidden="true">🗑️</i> Delete
                </a>
            `;
            
            // Add event listeners for edit and delete buttons
            const editButton = actionsCell.querySelector('.edit-icon');
            const deleteButton = actionsCell.querySelector('.delete-icon');
            
            editButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showEditForm(doc);
            });
            
            deleteButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openDeleteConfirmation(doc);
            });
            
            // Add event listener for view button
            const viewButton = actionsCell.querySelector('.view-icon');
            viewButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showDocumentPreview(doc);
            });
            
            // Append cells to row
            row.appendChild(iconCell);
            row.appendChild(infoCell);
            row.appendChild(actionsCell);
            
            tbody.appendChild(row);
        });

        totalEntries = documents.length;
        updatePagination();
    } catch (error) {
        console.error("Error fetching documents:", error);
        
        // Display error message in the table
        const tbody = document.querySelector("#docs-table tbody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-message">Error loading documents</td></tr>`;
        } else {
            console.error("Could not find tbody element");
        }
    }
}

// Helper function to get the appropriate category icon
function getCategoryIcon(categoryName) {
    const iconMap = {
        'All': '/admin/Components/icons/Category-icons/default_category_icon.png',
        'Confluence': '/admin/Components/icons/Category-icons/confluence.png',
        'Dissertation': '/admin/Components/icons/Category-icons/dissertation.png',
        'Thesis': '/admin/Components/icons/Category-icons/thesis.png',
        'Synthesis': '/admin/Components/icons/Category-icons/synthesis.png'
    };
    
    // Check if the category exists in our map
    if (iconMap[categoryName]) {
        return iconMap[categoryName];
    }
    
    // Use a more reliable fallback - the default icon
    return '/admin/Components/icons/Category-icons/default_category_icon.png';
}

function updatePagination() {
    const totalPages = Math.ceil(totalEntries / pageSize);
    const entriesInfo = document.getElementById("entries-info");
    const pageLinks = document.getElementById("page-links");

    entriesInfo.textContent = `Showing ${Math.min((currentPage - 1) * pageSize + 1, totalEntries)} to ${Math.min(currentPage * pageSize, totalEntries)} of ${totalEntries} entries`;

    // Clear pagination before adding new buttons
    pageLinks.innerHTML = "";

    // Previous button
    const prevButton = document.createElement("button");
    prevButton.textContent = "< prev";
    prevButton.classList.add("prev-button");
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadDocuments(currentPage);
        }
    });
    pageLinks.appendChild(prevButton);

    // Page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.classList.add("page-number");
        if (i === currentPage) button.classList.add("active");
        button.addEventListener("click", () => {
            currentPage = i;
            loadDocuments(currentPage);
        });
        pageLinks.appendChild(button);
    }

    // Next button
    const nextButton = document.createElement("button");
    nextButton.textContent = "next >";
    nextButton.classList.add("next-button");
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadDocuments(currentPage);
        }
    });
    pageLinks.appendChild(nextButton);
}

// Function to show edit form
function showEditForm(doc) {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-form');
    
    // Populate form fields
    form.querySelector('#edit-title').value = doc.title;
    form.querySelector('#edit-publication-date').value = doc.publication_date;
    form.querySelector('#edit-abstract').value = doc.abstract || '';
    form.querySelector('#edit-category').value = doc.category_name.toLowerCase();
    
    // Show current file name if exists
    const currentFileContainer = form.querySelector('#current-file-container');
    if (doc.file) {
        currentFileContainer.innerHTML = `
            <div class="current-file">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>${doc.file.split('/').pop()}</span>
            </div>
        `;
    } else {
        currentFileContainer.innerHTML = '<p class="no-file">No file attached</p>';
    }

    // Show modal
    modal.style.display = 'flex';
}

// Function to handle edit form submission
async function handleEditSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const documentId = form.dataset.documentId;

    try {
        const response = await fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to update document');
        }

        // Show success message
        const successModal = document.getElementById('success-modal');
        successModal.style.display = 'flex';

        // Hide success message and refresh page after 2 seconds
        setTimeout(() => {
            successModal.style.display = 'none';
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error updating document:', error);
        alert('Error updating document. Please try again.');
    }
}

// Function to open delete confirmation
function openDeleteConfirmation(doc) {
    // Create confirmation dialog if it doesn't exist
    let confirmDialog = document.getElementById('delete-confirm-dialog');
    if (!confirmDialog) {
        confirmDialog = document.createElement('div');
        confirmDialog.id = 'delete-confirm-dialog';
        confirmDialog.className = 'modal';
        confirmDialog.innerHTML = `
            <div class="modal-content">
                <h2>Confirm Delete</h2>
                <p>Are you sure you want to delete the document "${doc.title}"?</p>
                <p>This action cannot be undone.</p>
                <div class="form-actions">
                    <button id="confirm-delete" class="delete-btn">Delete</button>
                    <button id="cancel-delete" class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmDialog);
        
        // Add event listeners
        document.getElementById('cancel-delete').addEventListener('click', () => {
            confirmDialog.style.display = 'none';
        });
        
        // Close dialog when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                confirmDialog.style.display = 'none';
            }
        });
    }
    
    // Update document ID for deletion
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    confirmDeleteBtn.onclick = async () => {
        try {
            const response = await fetch(`/api/documents/${doc.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Log the response for debugging
            console.log('Delete response status:', response.status);
            const responseData = await response.json();
            console.log('Delete response data:', responseData);
            
            if (response.ok) {
                // Close dialog
                confirmDialog.style.display = 'none';
                
                // Reload documents
                loadDocuments(currentPage);
                
                // Show success message
                alert('Document deleted successfully!');
            } else {
                const errorMessage = responseData.message || 'Unknown error occurred';
                console.error('Server error:', errorMessage);
                alert(`Error deleting document: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Error deleting document. Please try again. Details: ' + error.message);
        }
    };
    
    // Show dialog
    confirmDialog.style.display = 'block';
}

async function showDocumentPreview(doc) {
    console.log('Showing preview for document:', doc);
    
    try {
        // Fetch the latest document data
        const response = await fetch(`/api/documents/${doc.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch document details');
        }
        const documentData = await response.json();
        console.log('Fetched document details:', documentData);

        const modal = document.getElementById('preview-modal');
        if (!modal) {
            console.error('Preview modal not found in the DOM');
            return;
        }

        // Set document title and author
        const titleElement = document.getElementById('preview-title');
        const authorElement = document.getElementById('preview-author');
        if (titleElement) titleElement.textContent = documentData.title || 'Untitled';
        if (authorElement) authorElement.textContent = documentData.author_name || 'Not specified';

        // Set document info
        const dateElement = document.getElementById('preview-date');
        const topicsElement = document.getElementById('preview-topics');
        const pagesElement = document.getElementById('preview-pages');
        const addedDateElement = document.getElementById('preview-added-date');
        const abstractElement = document.getElementById('preview-abstract');

        if (dateElement) {
            const date = documentData.publication_date ? new Date(documentData.publication_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 'Not specified';
            dateElement.textContent = date;
        }

        if (topicsElement) {
            let topics = [];
            if (documentData.document_topics && Array.isArray(documentData.document_topics)) {
                topics = documentData.document_topics.map(t => t.topic_name);
            } else if (documentData.topics && Array.isArray(documentData.topics)) {
                topics = documentData.topics.map(t => typeof t === 'string' ? t : t.topic_name);
            }
            topicsElement.textContent = topics.length > 0 ? topics.join(', ') : 'None';
        }

        if (pagesElement) pagesElement.textContent = documentData.pages || 'Not specified';
        
        if (addedDateElement) {
            const addedDate = documentData.created_at ? new Date(documentData.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            addedDateElement.textContent = addedDate;
        }

        if (abstractElement) abstractElement.textContent = documentData.abstract || 'No abstract available.';

        // Set up read document button
        const readButton = document.getElementById('preview-read-btn');
        if (readButton) {
            if (documentData.file) {
                readButton.href = documentData.file;
                readButton.style.display = 'inline-block';
            } else {
                readButton.style.display = 'none';
            }
        }

        // Show modal
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error showing document preview:', error);
        alert('Failed to load document preview. Please try again.');
    }
}

function createCategoryElement(category, count) {
    const div = document.createElement('div');
    div.className = 'category';
    div.setAttribute('data-category', category.toLowerCase());

    const iconDiv = document.createElement('div');
    iconDiv.className = 'category-icon';
    iconDiv.innerHTML = `<img src="${getCategoryIcon(category)}" alt="${category} icon">`;

    const textDiv = document.createElement('div');
    textDiv.className = 'category-text';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'category-name';
    nameSpan.textContent = category;

    const countSpan = document.createElement('span');
    countSpan.className = 'category-file-count';
    countSpan.textContent = `${count} files`;

    textDiv.appendChild(nameSpan);
    textDiv.appendChild(countSpan);

    div.appendChild(iconDiv);
    div.appendChild(textDiv);

    div.addEventListener('click', () => filterByCategory(category));

    return div;
}
