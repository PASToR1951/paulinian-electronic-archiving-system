// Globals
let currentPage = 1;
const pageSize = 10;
let totalEntries = 0;
let currentCategoryFilter = null; // Track current category filter
let currentVolumeFilter = null; // Track current volume filter

async function loadCategories() {
    try {
        console.log("Fetching categories from API...");
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const categories = await response.json();

        console.log('Fetched categories:', categories);

        // Calculate total file count for the "All" category
        let totalFileCount = 0;
        categories.forEach(category => {
            totalFileCount += Number(category.file_count) || 0;
        });

        console.log('Total file count:', totalFileCount);

        // Update the "All" category file count
        const allCategoryElement = document.querySelector('.category[data-category="All"]');
        if (allCategoryElement) {
            const fileCountElement = allCategoryElement.querySelector(".category-file-count");
            if (fileCountElement) {
                fileCountElement.textContent = `${totalFileCount} files`;
                console.log(`Updated All category count to: ${totalFileCount} files`);
            } else {
                console.warn("Could not find file count element for All category");
            }
        } else {
            console.warn("Could not find All category element");
        }

        // Update individual category counts
        categories.forEach(category => {
            console.log(`Processing category: ${category.category_name} with count: ${category.file_count}`);
            const categoryElement = document.querySelector(`.category[data-category="${category.category_name}"]`);
            if (categoryElement) {
                const fileCountElement = categoryElement.querySelector(".category-file-count");
                if (fileCountElement) {
                    const count = Number(category.file_count) || 0;
                    console.log(`Setting count for ${category.category_name}:`, count);
                    fileCountElement.textContent = `${count} files`;
                } else {
                    console.warn(`Could not find file count element for ${category.category_name}`);
                }
                
                // Add click handler for category filtering
                categoryElement.removeEventListener('click', categoryElement.clickHandler);
                categoryElement.clickHandler = () => {
                    filterByCategory(category.category_name);
                };
                categoryElement.addEventListener('click', categoryElement.clickHandler);
                categoryElement.style.cursor = 'pointer';
                
                // Add volume dropdown functionality
                setupVolumeDropdown(categoryElement, category.category_name);
            } else {
                console.warn(`Could not find category element for ${category.category_name}`);
            }
        });

    } catch (error) {
        console.error("Error fetching categories:", error);
        // Set error state for file counts
        document.querySelectorAll('.category-file-count').forEach(element => {
            element.textContent = '0 files';
        });
    }
}

// Setup volume dropdown for a category
async function setupVolumeDropdown(categoryElement, categoryName) {
    try {
        console.log(`Setting up volume dropdown for ${categoryName}`);
        
        // Get documents for this category to determine available volumes
        const response = await fetch(`/api/documents${categoryName !== "All" ? `?category=${encodeURIComponent(categoryName)}` : ''}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const documents = await response.json();
        
        // Extract unique volumes from documents
        const volumes = new Set();
        documents.forEach(doc => {
            if (doc.volume) {
                volumes.add(doc.volume);
            }
        });
        
        // Convert to array and sort
        const availableVolumes = Array.from(volumes).sort((a, b) => {
            const numA = parseInt(a) || 0;
            const numB = parseInt(b) || 0;
            return numA - numB;
        });
        
        console.log(`Available volumes for ${categoryName}:`, availableVolumes);
        
        // Create volume indicator
        const volumeIndicator = document.createElement('div');
        volumeIndicator.className = 'volume-indicator';
        volumeIndicator.textContent = availableVolumes.length;
        categoryElement.appendChild(volumeIndicator);
        
        // Create dropdown container
        const dropdown = document.createElement('div');
        dropdown.className = 'volume-dropdown';
        
        // Add "All Volumes" option
        const allVolumesItem = document.createElement('div');
        allVolumesItem.className = 'volume-item';
        allVolumesItem.textContent = 'All Volumes';
        allVolumesItem.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent category click
            filterByVolume(categoryName, null);
            dropdown.classList.remove('show');
            
            // Update active state
            dropdown.querySelectorAll('.volume-item').forEach(item => {
                item.classList.remove('active');
            });
            allVolumesItem.classList.add('active');
        });
        dropdown.appendChild(allVolumesItem);
        
        // Add volume options
        availableVolumes.forEach(volume => {
            const volumeItem = document.createElement('div');
            volumeItem.className = 'volume-item';
            volumeItem.textContent = `Volume ${volume}`;
            volumeItem.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent category click
                filterByVolume(categoryName, volume);
                dropdown.classList.remove('show');
                
                // Update active state
                dropdown.querySelectorAll('.volume-item').forEach(item => {
                    item.classList.remove('active');
                });
                volumeItem.classList.add('active');
            });
            dropdown.appendChild(volumeItem);
        });
        
        // Add dropdown to category
        categoryElement.appendChild(dropdown);
        
        // Track if category is selected
        let isCategorySelected = false;
        let isFirstClick = true;
        
        // Handle category click
        categoryElement.addEventListener('click', (event) => {
            // If clicking on the dropdown or volume indicator, don't process
            if (event.target.closest('.volume-dropdown') || event.target.closest('.volume-indicator')) {
                return;
            }
            
            // First click - select the category
            if (isFirstClick) {
                isFirstClick = false;
                isCategorySelected = true;
                filterByCategory(categoryName);
                
                // Close any open dropdowns
                document.querySelectorAll('.volume-dropdown.show').forEach(d => {
                    d.classList.remove('show');
                });
            } 
            // Second click or subsequent clicks - toggle the dropdown
            else {
                dropdown.classList.toggle('show');
            }
        });
        
        // Reset category selection when clicking another category
        document.querySelectorAll('.category').forEach(cat => {
            if (cat !== categoryElement) {
                cat.addEventListener('click', () => {
                    isFirstClick = true;
                    isCategorySelected = false;
                    dropdown.classList.remove('show');
                });
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!categoryElement.contains(event.target)) {
                dropdown.classList.remove('show');
                if (!event.target.closest('.category')) {
                    isFirstClick = true;
                    isCategorySelected = false;
                }
            }
        });
    } catch (error) {
        console.error(`Error setting up volume dropdown for category ${categoryName}:`, error);
    }
}

// Filter documents by volume
function filterByVolume(categoryName, volume) {
    console.log(`Filtering by volume: ${volume} in category: ${categoryName}`);
    
    // Set the volume filter
    currentVolumeFilter = volume;
    
    // Reset to first page and reload documents with filter
    currentPage = 1;
    loadDocuments(currentPage);
    
    // Update the filter indicator
    updateFilterIndicator();
}

// Update the filterByCategory function to handle volume filters
window.filterByCategory = function(categoryName) {
    console.log(`Filtering by category: ${categoryName}`);
    
    // Toggle filter if clicking the same category again
    if (currentCategoryFilter === categoryName) {
        console.log("Clearing category filter");
        currentCategoryFilter = null;
        currentVolumeFilter = null; // Clear volume filter too
        document.querySelectorAll('.category').forEach(cat => {
            cat.classList.remove('active');
        });
    } else {
        console.log(`Setting filter to: ${categoryName}`);
        currentCategoryFilter = categoryName;
        currentVolumeFilter = null; // Reset volume filter when changing category
        
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

// Update the loadDocuments function to include volume filtering
async function loadDocuments(page = 1) {
    try {
        let url = `/api/documents?page=${page}&size=${pageSize}`;
        
        // Add category parameter if a filter is active and it's not "All"
        if (currentCategoryFilter && currentCategoryFilter !== "All") {
            url += `&category=${encodeURIComponent(currentCategoryFilter)}`;
            console.log(`Applying category filter: ${currentCategoryFilter}`);
        }
        
        // Add volume parameter if a volume filter is active
        if (currentVolumeFilter) {
            url += `&volume=${encodeURIComponent(currentVolumeFilter)}`;
            console.log(`Applying volume filter: ${currentVolumeFilter}`);
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
            let filterMessage = '';
            if (currentCategoryFilter && currentCategoryFilter !== "All") {
                filterMessage += ` in category "${currentCategoryFilter}"`;
            }
            if (currentVolumeFilter) {
                filterMessage += ` and volume "${currentVolumeFilter}"`;
            }
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-message">
                        No documents found${filterMessage}
                    </td>
                </tr>
            `;
            return;
        }

        // Filter documents by category and volume on the client side
        if (currentCategoryFilter && currentCategoryFilter !== "All") {
            documents = documents.filter(doc => 
                doc.category_name && 
                doc.category_name.toLowerCase() === currentCategoryFilter.toLowerCase()
            );
        }
        
        // Apply volume filter if set
        if (currentVolumeFilter) {
            documents = documents.filter(doc => 
                doc.volume && 
                doc.volume.toString() === currentVolumeFilter.toString()
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
            if (doc.volume) {
                headerContent += ` | <span class="doc-volume">Volume ${doc.volume}</span>`;
            }
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
        console.error("Error loading documents:", error);
        
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
        'Synergy': '/admin/Components/icons/Category-icons/synergy.png'
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

// Update the filter indicator to show volume filter
function updateFilterIndicator() {
    const filterIndicator = document.getElementById('filter-indicator');
    if (!filterIndicator) return;
    
    if (currentCategoryFilter && currentCategoryFilter !== "All") {
        let filterText = `Category: ${currentCategoryFilter}`;
        
        if (currentVolumeFilter) {
            filterText += ` | Volume: ${currentVolumeFilter}`;
        }
        
        filterIndicator.innerHTML = `
            <span class="filter-badge">${filterText}</span>
            <button id="clear-filter">Clear Filter</button>
        `;
        
        document.getElementById('clear-filter').addEventListener('click', () => {
            currentCategoryFilter = null;
            currentVolumeFilter = null;
            document.querySelectorAll('.category').forEach(cat => {
                cat.classList.remove('active');
            });
            document.querySelectorAll('.volume-item').forEach(item => {
                item.classList.remove('active');
            });
            loadDocuments(1);
            updateFilterIndicator();
        });
    } else {
        filterIndicator.innerHTML = '';
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load sidebar and navbar
        await loadSidebar();
        await loadNavbar();
        await loadPageHeader();
        
        // Load categories first
        await loadCategories();
        
        // Setup category filters
        setupCategoryFilters();
        
        // Setup volume filter dropdown
        setupVolumeFilterDropdown();
        
        // Load initial documents
        await loadDocuments(1);
        
        // Setup pagination
        setupPagination();
        
        // Setup search functionality
        setupSearch();
        
        // Setup document type filter
        setupDocumentTypeFilter();
        
        // Setup topic filter
        setupTopicFilter();
        
        // Setup year filter
        setupYearFilter();
        
        // Setup author filter
        setupAuthorFilter();
        
        // Setup department filter
        setupDepartmentFilter();
        
        // Setup sort functionality
        setupSort();
        
        // Setup filter indicator
        updateFilterIndicator();
        
        console.log('Page initialized successfully');
    } catch (error) {
        console.error('Error initializing page:', error);
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

// Setup volume filter dropdown
async function setupVolumeFilterDropdown() {
    const dropdown = document.querySelector('.volume-filter-dropdown');
    const selected = document.querySelector('.volume-filter-selected');
    const options = document.querySelector('.volume-filter-options');
    
    if (!dropdown || !selected || !options) {
        console.error('Volume filter elements not found');
        return;
    }
    
    // Toggle dropdown on click
    selected.addEventListener('click', () => {
        dropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!dropdown.contains(event.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // Update volumes when category changes
    document.querySelectorAll('.category').forEach(category => {
        category.addEventListener('click', async () => {
            const categoryName = category.getAttribute('data-category');
            if (categoryName && categoryName !== 'All') {
                await updateVolumeOptions(categoryName);
            } else {
                // Clear volume options for "All" category
                options.innerHTML = '<div class="volume-filter-option" data-volume="all">All Volumes</div>';
                selected.textContent = 'All Volumes';
                currentVolumeFilter = null;
                loadDocuments(currentPage);
            }
        });
    });
    
    // Handle volume selection
    options.addEventListener('click', (event) => {
        const option = event.target.closest('.volume-filter-option');
        if (!option) return;
        
        const volume = option.getAttribute('data-volume');
        
        // Update selected text
        selected.textContent = volume === 'all' ? 'All Volumes' : `Volume ${volume}`;
        
        // Update active state
        options.querySelectorAll('.volume-filter-option').forEach(opt => {
            opt.classList.remove('active');
        });
        option.classList.add('active');
        
        // Close dropdown
        dropdown.classList.remove('active');
        
        // Apply filter
        currentVolumeFilter = volume === 'all' ? null : volume;
        loadDocuments(currentPage);
    });
}

// Update volume options based on selected category
async function updateVolumeOptions(categoryName) {
    try {
        // Get documents for the selected category
        const response = await fetch(`/api/documents?category=${encodeURIComponent(categoryName)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const documents = await response.json();
        
        const options = document.querySelector('.volume-filter-options');
        const selected = document.querySelector('.volume-filter-selected');
        
        // Clear existing options except "All Volumes"
        options.innerHTML = '<div class="volume-filter-option" data-volume="all">All Volumes</div>';
        
        // Extract unique volumes from documents
        const volumes = new Set();
        documents.forEach(doc => {
            if (doc.volume) {
                volumes.add(doc.volume);
            }
        });
        
        // Sort volumes numerically
        const sortedVolumes = Array.from(volumes).sort((a, b) => {
            const numA = parseInt(a) || 0;
            const numB = parseInt(b) || 0;
            return numA - numB;
        });
        
        // Add volume options
        sortedVolumes.forEach(volume => {
            const option = document.createElement('div');
            option.className = 'volume-filter-option';
            option.setAttribute('data-volume', volume);
            option.textContent = `Volume ${volume}`;
            options.appendChild(option);
        });
        
        // Reset selected text
        selected.textContent = 'All Volumes';
        
        // Reset volume filter
        currentVolumeFilter = null;
    } catch (error) {
        console.error(`Error fetching volumes for category ${categoryName}:`, error);
    }
}

// Setup category filters
function setupCategoryFilters() {
    console.log("Setting up category filters");
    
    // Add click handlers for each category
    document.querySelectorAll('.category').forEach(category => {
        const categoryName = category.getAttribute('data-category');
        if (categoryName) {
            console.log(`Setting up handler for category: ${categoryName}`);
            category.addEventListener('click', () => filterByCategory(categoryName));
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
    
    // Hide the table header
    const tableHeader = document.querySelector("#docs-table thead");
    if (tableHeader) {
        tableHeader.style.display = "none";
    }
}

// Setup pagination
function setupPagination() {
    console.log("Setting up pagination");
    // This is a placeholder for pagination setup
    // Implement pagination functionality as needed
}

// Setup search functionality
function setupSearch() {
    console.log("Setting up search functionality");
    // This is a placeholder for search setup
    // Implement search functionality as needed
}

// Setup document type filter
function setupDocumentTypeFilter() {
    console.log("Setting up document type filter");
    // This is a placeholder for document type filter setup
    // Implement document type filter functionality as needed
}

// Setup topic filter
function setupTopicFilter() {
    console.log("Setting up topic filter");
    // This is a placeholder for topic filter setup
    // Implement topic filter functionality as needed
}

// Setup year filter
function setupYearFilter() {
    console.log("Setting up year filter");
    // This is a placeholder for year filter setup
    // Implement year filter functionality as needed
}

// Setup author filter
function setupAuthorFilter() {
    console.log("Setting up author filter");
    // This is a placeholder for author filter setup
    // Implement author filter functionality as needed
}

// Setup department filter
function setupDepartmentFilter() {
    console.log("Setting up department filter");
    // This is a placeholder for department filter setup
    // Implement department filter functionality as needed
}

// Setup sort functionality
function setupSort() {
    console.log("Setting up sort functionality");
    // This is a placeholder for sort setup
    // Implement sort functionality as needed
}

// Load sidebar
async function loadSidebar() {
    console.log("Loading sidebar");
    const sidebarContainer = document.getElementById('side-bar');
    if (sidebarContainer) {
        try {
            const response = await fetch('/admin/Components/side_bar.html');
            if (response.ok) {
                const html = await response.text();
                sidebarContainer.innerHTML = html;
                console.log("Sidebar loaded successfully");
            } else {
                console.error('Failed to load sidebar:', response.status);
                // Provide a fallback sidebar
                sidebarContainer.innerHTML = `
                    <div class="sidebar">
                        <div class="sidebar-header">
                            <h2>Navigation</h2>
                        </div>
                        <div class="sidebar-menu">
                            <a href="/admin/dashboard.html" class="menu-item">
                                <i class="fas fa-home"></i>
                                <span>Dashboard</span>
                            </a>
                            <a href="/admin/documents.html" class="menu-item active">
                                <i class="fas fa-file-alt"></i>
                                <span>Documents</span>
                            </a>
                            <a href="/admin/upload_doc.html" class="menu-item">
                                <i class="fas fa-upload"></i>
                                <span>Upload Document</span>
                            </a>
                            <a href="/admin/settings.html" class="menu-item">
                                <i class="fas fa-cog"></i>
                                <span>Settings</span>
                            </a>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading sidebar:', error);
            // Provide a fallback sidebar
            sidebarContainer.innerHTML = `
                <div class="sidebar">
                    <div class="sidebar-header">
                        <h2>Navigation</h2>
                    </div>
                    <div class="sidebar-menu">
                        <a href="/admin/dashboard.html" class="menu-item">
                            <i class="fas fa-home"></i>
                            <span>Dashboard</span>
                        </a>
                        <a href="/admin/documents.html" class="menu-item active">
                            <i class="fas fa-file-alt"></i>
                            <span>Documents</span>
                        </a>
                        <a href="/admin/upload_doc.html" class="menu-item">
                            <i class="fas fa-upload"></i>
                            <span>Upload Document</span>
                        </a>
                        <a href="/admin/settings.html" class="menu-item">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </a>
                    </div>
                </div>
            `;
        }
    } else {
        console.error('Sidebar container not found');
    }
}

// Load navbar
async function loadNavbar() {
    console.log("Loading navbar");
    const navbarContainer = document.getElementById('navbar-header');
    if (navbarContainer) {
        try {
            const response = await fetch('/admin/Components/navbar_header.html');
            if (response.ok) {
                const html = await response.text();
                navbarContainer.innerHTML = html;
                console.log("Navbar loaded successfully");
            } else {
                console.error('Failed to load navbar:', response.status);
                // Provide a fallback navbar
                navbarContainer.innerHTML = `
                    <div class="navbar">
                        <div class="navbar-brand">
                            <h1>Paulinian Electronic Archiving System</h1>
                        </div>
                        <div class="navbar-menu">
                            <a href="/admin/dashboard.html">Dashboard</a>
                            <a href="/admin/documents.html" class="active">Documents</a>
                            <a href="/admin/upload_doc.html">Upload</a>
                            <a href="/admin/settings.html">Settings</a>
                        </div>
                        <div class="navbar-end">
                            <div class="user-menu">
                                <span>Admin</span>
                                <a href="/logout">Logout</a>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading navbar:', error);
            // Provide a fallback navbar
            navbarContainer.innerHTML = `
                <div class="navbar">
                    <div class="navbar-brand">
                        <h1>Paulinian Electronic Archiving System</h1>
                    </div>
                    <div class="navbar-menu">
                        <a href="/admin/dashboard.html">Dashboard</a>
                        <a href="/admin/documents.html" class="active">Documents</a>
                        <a href="/admin/upload_doc.html">Upload</a>
                        <a href="/admin/settings.html">Settings</a>
                    </div>
                    <div class="navbar-end">
                        <div class="user-menu">
                            <span>Admin</span>
                            <a href="/logout">Logout</a>
                        </div>
                    </div>
                </div>
            `;
        }
    } else {
        console.error('Navbar container not found');
    }
}

// Load page header
async function loadPageHeader() {
    console.log("Loading page header");
    const headerContainer = document.getElementById('page-header');
    if (headerContainer) {
        try {
            const response = await fetch('/admin/Components/page_header.html');
            if (response.ok) {
                const html = await response.text();
                headerContainer.innerHTML = html;
                console.log("Page header loaded successfully");
            } else {
                console.error('Failed to load page header:', response.status);
                // Provide a fallback header
                headerContainer.innerHTML = `
                    <div class="page-header">
                        <h1>Documents</h1>
                        <p>Manage and view all documents in the system</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading page header:', error);
            // Provide a fallback header
            headerContainer.innerHTML = `
                <div class="page-header">
                    <h1>Documents</h1>
                    <p>Manage and view all documents in the system</p>
                </div>
            `;
        }
    } else {
        console.error('Page header container not found');
    }
}

// Function to setup volume filter for a category
function setupVolumeFilter(category) {
    const volumeFilter = document.querySelector(`.category[data-category="${category}"] .volume-filter-dropdown`);
    if (!volumeFilter) return;

    const selected = volumeFilter.querySelector('.volume-filter-selected');
    const options = volumeFilter.querySelector('.volume-filter-options');
    
    // Clear existing options
    options.innerHTML = '';
    
    // Add "All Volumes" option
    const allOption = document.createElement('div');
    allOption.className = 'volume-filter-option';
    allOption.dataset.volume = 'all';
    allOption.textContent = 'All Volumes';
    options.appendChild(allOption);

    // Get available volumes for this category
    const availableVolumes = getAvailableVolumesForCategory(category);
    
    // Add available volume options
    availableVolumes.forEach(volume => {
        const option = document.createElement('div');
        option.className = 'volume-filter-option';
        option.dataset.volume = volume;
        option.textContent = `Volume ${volume}`;
        options.appendChild(option);
    });

    // Toggle dropdown
    selected.addEventListener('click', () => {
        options.classList.toggle('show');
    });

    // Handle option selection
    options.addEventListener('click', (e) => {
        if (e.target.classList.contains('volume-filter-option')) {
            const volume = e.target.dataset.volume;
            selected.textContent = volume === 'all' ? 'All Volumes' : `Volume ${volume}`;
            options.classList.remove('show');
            
            // Update current filters
            currentFilters.volume = volume;
            
            // Reload documents with new filters
            loadDocuments();
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!volumeFilter.contains(e.target)) {
            options.classList.remove('show');
        }
    });
}

// Function to get available volumes for a category
function getAvailableVolumesForCategory(category) {
    // Get all documents for this category
    const categoryDocs = documents.filter(doc => doc.category === category);
    
    // Extract unique volume numbers
    const volumes = new Set();
    categoryDocs.forEach(doc => {
        if (doc.volume) {
            volumes.add(doc.volume);
        }
    });
    
    // Convert to array and sort
    return Array.from(volumes).sort((a, b) => a - b);
}
