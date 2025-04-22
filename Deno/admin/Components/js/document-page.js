// Globals
let currentPage = 1;
const pageSize = 5;
let totalEntries = 0;
let currentCategoryFilter = null; // Track current category filter
let currentVolumeFilter = null; // Track current volume filter
let currentSortOrder = 'latest'; // Track current sort order

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
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        const documents = responseData.documents || [];
        
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
        
        // Handle category click - only for filtering, not for showing dropdown
        categoryElement.addEventListener('click', (event) => {
            // If clicking on the dropdown or volume indicator, don't process
            if (event.target.closest('.volume-dropdown') || event.target.closest('.volume-indicator')) {
                return;
            }
            
            // Filter by category
            filterByCategory(categoryName);
            
            // Close any open dropdowns
            document.querySelectorAll('.volume-dropdown.show').forEach(d => {
                d.classList.remove('show');
            });
        });
        
        // Reset category selection when clicking another category
        document.querySelectorAll('.category').forEach(cat => {
            if (cat !== categoryElement) {
                cat.addEventListener('click', () => {
                    dropdown.classList.remove('show');
                });
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!categoryElement.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        });
    } catch (error) {
        console.error(`Error setting up volume dropdown for category ${categoryName}:`, error);
        // Don't throw the error, just log it and continue
    }
}

// Filter documents by volume
function filterByVolume(categoryName, volume) {
    console.log(`Filtering by volume: ${volume} in category: ${categoryName}`);
    
    // Set the category filter if not already set
    if (categoryName && categoryName !== 'All' && currentCategoryFilter !== categoryName) {
        currentCategoryFilter = categoryName;
        // Update category visual state
            document.querySelectorAll('.category').forEach(cat => {
            if (cat.getAttribute('data-category') === categoryName) {
                    cat.classList.add('active');
                } else {
                    cat.classList.remove('active');
                }
            });
    }
            
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
                const catName = cat.getAttribute('data-category');
            if (catName && catName.toLowerCase() === categoryName.toLowerCase()) {
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

// Update the loadDocuments function
async function loadDocuments(page = 1) {
    try {
        let url = `/api/documents?page=${page}&size=${pageSize}`;
        
        // Apply category filter if set
        if (currentCategoryFilter && currentCategoryFilter !== 'All') {
            url += `&category=${encodeURIComponent(currentCategoryFilter)}`;
        }
        
        // Apply volume filter if set
        if (currentVolumeFilter) {
            url += `&volume=${encodeURIComponent(currentVolumeFilter)}`;
        }
        
        // Apply sort order
        url += `&sort=${encodeURIComponent(currentSortOrder)}`;
        
        console.log('Fetching documents from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('API Response:', responseData);
        
        const { documents, totalCount, totalPages } = responseData;
        console.log('Documents received:', documents);
        
        // Update total entries
        totalEntries = totalCount;
        
        // Update current page
        currentPage = page;
        
        const tbody = document.querySelector("#docs-table tbody");
        if (!tbody) {
            console.error("Table body not found");
            return;
        }
        
        tbody.innerHTML = "";

        if (!documents || documents.length === 0) {
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

        // Group documents by title
        const groupedDocuments = documents.reduce((groups, doc) => {
            const title = doc.title || 'Untitled';
            if (!groups[title]) {
                groups[title] = [];
            }
            groups[title].push(doc);
            return groups;
        }, {});

        // Display grouped documents
        Object.entries(groupedDocuments).forEach(([title, docs]) => {
            const row = document.createElement("tr");
            row.className = "document-card";
            row.setAttribute('data-category', docs[0].category_name || '');
            row.setAttribute('data-title', title);
            row.style.cursor = 'pointer';
            
            // Create the main document row
            const categoryIcon = getCategoryIcon(docs[0].category_name);
            
            const iconCell = document.createElement("td");
            iconCell.className = "doc-icon";
            iconCell.innerHTML = `<img src="${categoryIcon}" alt="${docs[0].category_name} Icon">`;
            
            const infoCell = document.createElement("td");
            infoCell.className = "doc-info";
            
            // Get all unique authors from all volumes
            const allAuthors = new Set();
            docs.forEach(doc => {
                if (doc.author_names && Array.isArray(doc.author_names)) {
                    doc.author_names.forEach(author => allAuthors.add(author));
                } else if (doc.author_name) {
                    allAuthors.add(doc.author_name);
                }
            });
            const authorDisplay = allAuthors.size > 0 ? Array.from(allAuthors).join(', ') : 'No Author Listed';
            
            let headerContent = `<span class="doc-title">${title}</span>`;
            if (docs.length > 1) {
                headerContent += ` | <span class="doc-volume-count">${docs.length} Volumes</span>`;
            } else if (docs[0].volume) {
                headerContent += ` | <span class="doc-volume">Volume ${docs[0].volume}</span>`;
            }
            headerContent += ` | <span class="doc-author">${authorDisplay}</span>`;
            
            if (docs[0].publication_date) {
                headerContent += ` | <span class="doc-year">${new Date(docs[0].publication_date).getFullYear()}</span>`;
            }
            
            infoCell.innerHTML = `
                <div class="doc-header">
                    ${headerContent}
                </div>
                <div class="doc-tags">
                    <span class="tag document-type">${docs[0].category_name || 'Uncategorized'}</span>
                    ${getTopicsHtml(docs[0])}
                </div>
            `;
            
            // Append cells to row
            row.appendChild(iconCell);
            row.appendChild(infoCell);
            
            // Add click handler for the row
            row.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons
                if (e.target.closest('.action-buttons')) {
                    return;
                }

                // Check if there's an existing dropdown for this row
                const existingDropdown = document.querySelector('.similar-docs-dropdown');
                if (existingDropdown) {
                    // If clicking the same row that has the dropdown open, close it
                    const rowRect = row.getBoundingClientRect();
                    const dropdownTop = parseInt(existingDropdown.style.top) - window.scrollY;
                    if (Math.abs(dropdownTop - rowRect.bottom) < 2) {
                        existingDropdown.remove();
                        return;
                    }
                }

                // Remove any existing dropdowns
                document.querySelectorAll('.similar-docs-dropdown').forEach(dropdown => {
                    dropdown.remove();
                });

                const dropdownContainer = document.createElement('div');
                dropdownContainer.className = 'similar-docs-dropdown';
                
                const listContainer = document.createElement('div');
                listContainer.className = 'similar-docs-list';
                
                // Add each document version to the dropdown
                docs.forEach(doc => {
                    const docItem = document.createElement('div');
                    docItem.className = 'similar-doc-item';
                    
                    // Get authors for this specific volume
                    let volumeAuthors = 'No Author Listed';
                    if (doc.author_names && Array.isArray(doc.author_names)) {
                        volumeAuthors = doc.author_names.join(', ');
                    } else if (doc.author_name) {
                        volumeAuthors = doc.author_name;
                    }
                    
                    docItem.innerHTML = `
                        <div class="doc-icon">
                            <img src="${categoryIcon}" alt="${doc.category_name} Icon">
                        </div>
                        <div class="doc-info">
                            <div class="doc-header">
                                <span class="doc-title">${doc.title || 'Untitled'}</span>
                                ${doc.volume ? `<span class="doc-volume">Volume ${doc.volume}</span>` : ''}
                                <span class="doc-author">${volumeAuthors}</span>
                                <span class="doc-year">${new Date(doc.publication_date).getFullYear()}</span>
                            </div>
                            <div class="doc-tags">
                                <span class="tag document-type">${doc.category_name || 'Uncategorized'}</span>
                                ${getTopicsHtml(doc)}
                            </div>
                        </div>
                        <div class="actions">
                            <div class="action-buttons">
                                <a href="#" class="view-icon" title="View Document">
                                    👁️ <span>View</span>
                                </a>
                                <a href="#" class="edit-icon" title="Edit Document">
                                    ✏️ <span>Edit</span>
                                </a>
                                <a href="#" class="delete-icon" title="Delete Document">
                                    🗑️
                                </a>
                            </div>
                        </div>
                    `;
                    
                    // Add event listeners for buttons
                    const viewButton = docItem.querySelector('.view-icon');
                    viewButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openPdfModal(doc);
                    });
                    
                    const editButton = docItem.querySelector('.edit-icon');
                    editButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        editDocument(doc.id || doc.document_id);
                    });
                    
                    const deleteButton = docItem.querySelector('.delete-icon');
                    deleteButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openDeleteConfirmation(doc);
                    });
                    
                    listContainer.appendChild(docItem);
                });
                
                dropdownContainer.appendChild(listContainer);
                
                // Position the dropdown
                const table = document.querySelector('#docs-table');
                const tableRect = table.getBoundingClientRect();
                const rowRect = row.getBoundingClientRect();
                
                dropdownContainer.style.position = 'absolute';
                dropdownContainer.style.top = `${rowRect.bottom + window.scrollY}px`;
                dropdownContainer.style.left = `${tableRect.left}px`;
                dropdownContainer.style.width = `${tableRect.width}px`;
                dropdownContainer.style.zIndex = '1000';
                
                // Add to document body
                document.body.appendChild(dropdownContainer);

                // Add mouseleave event to close dropdown when mouse leaves
                dropdownContainer.addEventListener('mouseleave', () => {
                    dropdownContainer.remove();
                });

                // Add mouseenter event to prevent closing when hovering over dropdown
                dropdownContainer.addEventListener('mouseenter', () => {
                    // Clear any existing timeout
                    if (dropdownContainer._closeTimeout) {
                        clearTimeout(dropdownContainer._closeTimeout);
                    }
                });

                // Add mouseleave event to the row to close dropdown when leaving the row
                row.addEventListener('mouseleave', (e) => {
                    // Check if mouse is moving to the dropdown
                    const relatedTarget = e.relatedTarget;
                    if (!relatedTarget || !dropdownContainer.contains(relatedTarget)) {
                        dropdownContainer._closeTimeout = setTimeout(() => {
                            dropdownContainer.remove();
                        }, 100); // Small delay to allow for mouse movement to dropdown
                    }
                });

                // Close dropdown when clicking outside
                const closeDropdown = (event) => {
                    if (!dropdownContainer.contains(event.target) && !row.contains(event.target)) {
                        dropdownContainer.remove();
                        document.removeEventListener('click', closeDropdown);
                    }
                };
                
                // Add event listener with a slight delay
                setTimeout(() => {
                    document.addEventListener('click', closeDropdown);
                }, 100);
            });
            
            tbody.appendChild(row);
        });

        // Update pagination UI
        updatePagination();
    } catch (error) {
        console.error("Error loading documents:", error);
        const tbody = document.querySelector("#docs-table tbody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-message">Error loading documents: ${error.message}</td></tr>`;
        }
    }
}

// Helper function to get topics HTML
function getTopicsHtml(doc) {
    if (doc.document_topics && Array.isArray(doc.document_topics) && doc.document_topics.length > 0) {
        return doc.document_topics.map(topic => 
            `<span class="tag topic">${topic.topic_name}</span>`
        ).join('');
    } else if (doc.topics && Array.isArray(doc.topics) && doc.topics.length > 0) {
        return doc.topics.map(topic => 
            `<span class="tag topic">${typeof topic === 'string' ? topic : topic.topic_name}</span>`
        ).join('');
    }
    return '<span class="tag topic muted">No topics</span>';
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

// Update the updatePagination function
function updatePagination() {
    const totalPages = Math.ceil(totalEntries / pageSize);
    const entriesInfo = document.getElementById("entries-info");
    const pageLinks = document.getElementById("page-links");

    if (!entriesInfo || !pageLinks) return;

    // Update entries info
    const startEntry = Math.min((currentPage - 1) * pageSize + 1, totalEntries);
    const endEntry = Math.min(currentPage * pageSize, totalEntries);
    entriesInfo.textContent = `Showing ${startEntry} to ${endEntry} of ${totalEntries} entries`;

    // Clear existing pagination
    pageLinks.innerHTML = "";

    // Previous button
    const prevButton = document.createElement("button");
    prevButton.textContent = "< prev";
    prevButton.className = "pagination-btn prev-button" + (currentPage === 1 ? " disabled" : "");
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            loadDocuments(currentPage - 1);
        }
    });
    pageLinks.appendChild(prevButton);

    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust start page if we're near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    // First page and ellipsis
    if (startPage > 1) {
        const firstButton = createPageButton(1);
        pageLinks.appendChild(firstButton);
        if (startPage > 2) {
            const ellipsis = document.createElement("span");
            ellipsis.textContent = "...";
            ellipsis.className = "pagination-ellipsis";
            pageLinks.appendChild(ellipsis);
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = createPageButton(i);
        pageLinks.appendChild(pageButton);
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement("span");
            ellipsis.textContent = "...";
            ellipsis.className = "pagination-ellipsis";
            pageLinks.appendChild(ellipsis);
        }
        const lastButton = createPageButton(totalPages);
        pageLinks.appendChild(lastButton);
    }

    // Next button
    const nextButton = document.createElement("button");
    nextButton.textContent = "next >";
    nextButton.className = "pagination-btn next-button" + (currentPage === totalPages ? " disabled" : "");
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            loadDocuments(currentPage + 1);
        }
    });
    pageLinks.appendChild(nextButton);
}

function createPageButton(pageNum) {
    const button = document.createElement("button");
    button.textContent = pageNum;
    button.className = "pagination-btn page-number" + (pageNum === currentPage ? " active" : "");
    button.addEventListener("click", () => {
        if (pageNum !== currentPage) {
            loadDocuments(pageNum);
        }
    });
    return button;
}

// Add pagination styles
const paginationStyle = document.createElement('style');
paginationStyle.textContent = `
    #page-links {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 20px;
        justify-content: center;
    }

    .pagination-btn {
        padding: 8px 12px;
        border: 1px solid #e0e0e0;
        background-color: white;
        color: #333;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;
    }

    .pagination-btn:hover:not(.disabled):not(.active) {
        background-color: #f5f5f5;
        border-color: #1976d2;
    }

    .pagination-btn.active {
        background-color: #1976d2;
        color: white;
        border-color: #1976d2;
    }

    .pagination-btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .pagination-ellipsis {
        color: #666;
        padding: 0 4px;
    }

    #entries-info {
        text-align: center;
        color: #666;
        margin-bottom: 10px;
    }
`;
document.head.appendChild(paginationStyle);

// Author search functionality
let authorSearchTimeout;
const authorInput = document.getElementById('edit-author');
const authorList = document.getElementById('edit-author-list');
const selectedAuthors = document.getElementById('edit-selected-authors');

authorInput.addEventListener('input', function() {
    clearTimeout(authorSearchTimeout);
    const query = this.value.trim();
    
    if (query === '') {
        authorList.innerHTML = '';
        return;
    }
    
    authorList.innerHTML = '<div class="dropdown-item">Searching...</div>';
    
    authorSearchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/authors?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            authorList.innerHTML = '';
            
            if (!Array.isArray(data)) {
                console.error('Unexpected API response:', data);
                authorList.innerHTML = '<div class="dropdown-item text-danger">Unexpected response</div>';
                return;
            }
            
            if (data.length === 0) {
                // Show "Create Author" option when no author is found
                const createAuthorItem = document.createElement('div');
                createAuthorItem.classList.add('dropdown-item', 'create-author');
                createAuthorItem.innerHTML = `<span class="create-author-text">Create Author: "${query}"</span>`;
                createAuthorItem.addEventListener('click', () => addSelectedAuthor({ full_name: query }));
                authorList.appendChild(createAuthorItem);
            } else {
                data.forEach(author => {
                    const item = document.createElement('div');
                    item.className = 'dropdown-item';
                    item.textContent = author.name || author.full_name;
                    item.addEventListener('click', () => {
                        addSelectedAuthor(author);
                        authorInput.value = '';
                        authorList.innerHTML = '';
                    });
                    authorList.appendChild(item);
                });
            }
        } catch (error) {
            console.error('Error searching authors:', error);
            authorList.innerHTML = '<div class="dropdown-item text-danger">Error searching authors</div>';
        }
    }, 300);
});

function addSelectedAuthor(author) {
    const authorTag = document.createElement('div');
    authorTag.className = 'selected-author';
    authorTag.innerHTML = `
        ${author.name || author.full_name}
        <span class="remove-author" data-id="${author.author_id}">&times;</span>
    `;
    
    authorTag.querySelector('.remove-author').addEventListener('click', () => {
        authorTag.remove();
    });
    
    selectedAuthors.appendChild(authorTag);
    authorInput.value = '';
}

// Topic search functionality
let topicSearchTimeout;
const topicInput = document.getElementById('edit-topic');
const topicList = document.getElementById('edit-topic-list');
const selectedTopics = document.getElementById('edit-selected-topics');

topicInput.addEventListener('input', function() {
    clearTimeout(topicSearchTimeout);
    const query = this.value.trim();
    
    if (query === '') {
        topicList.innerHTML = '';
        return;
    }
    
    topicList.innerHTML = '<div class="dropdown-item">Searching...</div>';
    
    topicSearchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/topics/search?q=${encodeURIComponent(query)}`);
            const topics = await response.json();
            
            topicList.innerHTML = '';
            
            if (topics.length === 0) {
                topicList.innerHTML = '<div class="dropdown-item">No topics found</div>';
                return;
            }
            
            topics.forEach(topic => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.textContent = topic.topic_name;
                item.addEventListener('click', () => {
                    addSelectedTopic(topic);
                    topicInput.value = '';
                    topicList.innerHTML = '';
                });
                topicList.appendChild(item);
            });
        } catch (error) {
            console.error('Error searching topics:', error);
            topicList.innerHTML = '<div class="dropdown-item">Error searching topics</div>';
        }
    }, 300);
});

function addSelectedTopic(topic) {
    const topicTag = document.createElement('div');
    topicTag.className = 'selected-topic';
    topicTag.innerHTML = `
        ${topic.topic_name}
        <span class="remove-topic" data-id="${topic.topic_id}">&times;</span>
    `;
    
    topicTag.querySelector('.remove-topic').addEventListener('click', () => {
        topicTag.remove();
    });
    
    selectedTopics.appendChild(topicTag);
}

// File upload functionality
const uploadBox = document.getElementById('edit-upload-box');
const fileInput = document.getElementById('edit-file');
const fileIndicator = document.getElementById('current-file-container');

uploadBox.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
        const fileName = this.files[0].name;
        // Update the file indicator instead of the paragraph
        fileIndicator.textContent = fileName;
    }
});

// Edit document functionality
async function editDocument(documentId) {
    try {
        const modal = document.getElementById('edit-modal');
        modal.style.display = 'flex';
        
        console.log('Fetching document with ID:', documentId);
        
        // Fetch document details
        const response = await fetch(`/api/documents/${documentId}`);
        console.log("Fetch response status:", response.status);
        const data = await response.json();
        
        // More detailed logging
        console.log("Complete document data:", data);
        console.log("Document created_at:", data.created_at);
        console.log("Document created_at type:", typeof data.created_at);
        
        const documentData = Array.isArray(data) ? data[0] : data;
        console.log('Fetched document data:', documentData);

        if (!documentData) {
            throw new Error('No document data received');
        }
        
        // Populate form fields with null checks
        const titleInput = document.getElementById('edit-title');
        if (titleInput) titleInput.value = documentData.title || '';
        
        const dateInput = document.getElementById('edit-publication-date');
        if (dateInput && documentData.publication_date) {
            // Format date to YYYY-MM-DD for input
            const date = new Date(documentData.publication_date);
            const formattedDate = date.toISOString().split('T')[0];
            dateInput.value = formattedDate;
        }
        
        const volumeInput = document.getElementById('edit-volume');
        if (volumeInput) volumeInput.value = documentData.volume || '';
        
        const categorySelect = document.getElementById('edit-category');
        if (categorySelect && documentData.category_name) {
            categorySelect.value = documentData.category_name.toLowerCase();
        }

        // Update abstract preview
        const previewAbstract = document.getElementById('edit-preview-abstract');
        if (previewAbstract) {
            if (documentData.abstract) {
                previewAbstract.innerHTML = `<p>${documentData.abstract}</p>`;
            } else {
                previewAbstract.innerHTML = '<p>No abstract available.</p>';
            }
        }
        
        // Update added date in preview using the document's creation date
        const previewAddedDate = document.getElementById('edit-preview-added-date');
        if (previewAddedDate) {
            console.log("Document data for added date:", documentData);
            console.log("updated_at field:", documentData.updated_at);
            
            // Use the updated_at field if available, otherwise use current date
            let dateToShow;
            if (documentData.updated_at) {
                dateToShow = new Date(documentData.updated_at);
            } else {
                // Fallback to current date if no updated_at field
                dateToShow = new Date();
            }
            
            const formattedDate = dateToShow.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            previewAddedDate.textContent = formattedDate;
        }
        
        // Clear and populate authors
        const selectedAuthors = document.getElementById('edit-selected-authors');
        if (selectedAuthors) {
            selectedAuthors.innerHTML = '';
            if (documentData.author_names && Array.isArray(documentData.author_names)) {
                documentData.author_names.forEach(authorName => {
                    const authorTag = document.createElement('div');
                    authorTag.className = 'selected-author';
                    authorTag.innerHTML = `
                        ${authorName}
                        <span class="remove-author">&times;</span>
                    `;
                    authorTag.querySelector('.remove-author').addEventListener('click', () => {
                        authorTag.remove();
                    });
                    selectedAuthors.appendChild(authorTag);
                });
            }
        }
        
        // Clear and populate topics
        const selectedTopics = document.getElementById('edit-selected-topics');
        if (selectedTopics) {
            selectedTopics.innerHTML = '';
            const topics = documentData.document_topics || documentData.topics || [];
            topics.forEach(topic => {
                const topicName = typeof topic === 'string' ? topic : topic.topic_name;
                const topicTag = document.createElement('div');
                topicTag.className = 'selected-topic';
                topicTag.innerHTML = `
                    ${topicName}
                    <span class="remove-topic">&times;</span>
                `;
                topicTag.querySelector('.remove-topic').addEventListener('click', () => {
                    topicTag.remove();
                });
                selectedTopics.appendChild(topicTag);
            });
        }
        
        // Display current file with preview option
        const currentFileContainer = document.getElementById('current-file-container');
        if (currentFileContainer) {
            if (documentData.file) {
                const fileName = documentData.file.split('/').pop();
                currentFileContainer.innerHTML = `
                    <div class="current-file-info">
                        <p>Current file: <span class="file-name">${fileName}</span></p>
                        <div class="file-actions">
                            <button type="button" class="preview-btn" onclick="window.open('${documentData.file}', '_blank')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                Preview
                            </button>
                        </div>
                    </div>
                    <div class="file-replace-info">
                        <p>Upload a new file to replace the current one:</p>
                    </div>
                `;
            } else {
                currentFileContainer.innerHTML = '<p>No file attached</p>';
            }
        }
        
        // Handle form submission
        const form = document.getElementById('edit-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                
                try {
                    const formData = new FormData();
                    formData.append('title', document.getElementById('edit-title').value);
                    formData.append('publication_date', document.getElementById('edit-publication-date').value);
                    formData.append('volume', document.getElementById('edit-volume').value);
                    
                    // Get the selected category value
                    const categorySelect = document.getElementById('edit-category');
                    const selectedCategory = categorySelect.value;
                    if (selectedCategory === 'default') {
                        throw new Error('Please select a valid category');
                    }
                    formData.append('category', selectedCategory);
                    
                    // Add selected authors
                    const authors = Array.from(selectedAuthors.children).map(author => 
                        author.textContent.trim().replace('×', '').trim()
                    );
                    formData.append('author', JSON.stringify(authors));
                    
                    // Add selected topics
                    const topics = Array.from(selectedTopics.children).map(topic => 
                        topic.textContent.trim().replace('×', '').trim()
                    );
                    formData.append('topics', JSON.stringify(topics));
                    
                    // Add file if selected
                    const file = document.getElementById('edit-file').files[0];
                    if (file) {
                        formData.append('file', file);
                    }
                    
                    // Show loading state
                    const submitButton = form.querySelector('button[type="submit"]');
                    const originalButtonText = submitButton.innerHTML;
                    submitButton.disabled = true;
                    submitButton.innerHTML = 'Saving...';
                    
                    const updateResponse = await fetch(`/api/documents/${documentId}`, {
                        method: 'PUT',
                        body: formData
                    });

                    if (!updateResponse.ok) {
                        const errorData = await updateResponse.json();
                        throw new Error(errorData.message || 'Failed to update document');
                    }

                    // Show success modal
                    const successModal = document.getElementById('success-modal');
                    if (successModal) {
                        successModal.style.display = 'flex';
                        
                        // Close modals and refresh documents after delay
                        setTimeout(() => {
                            successModal.style.display = 'none';
                            closeEditModal();
                            loadDocuments(currentPage);
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Error updating document:', error);
                    alert('Error updating document: ' + error.message);
                } finally {
                    // Reset submit button state
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalButtonText;
                    }
                }
            };
        }
    } catch (error) {
        console.error('Error editing document:', error);
        alert('Error editing document details: ' + error.message);
        closeEditModal();
    }
}

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset form
    const form = document.getElementById('edit-form');
    if (form) {
        form.reset();
    }
    
    // Clear selected authors and topics
    const selectedAuthors = document.getElementById('edit-selected-authors');
    const selectedTopics = document.getElementById('edit-selected-topics');
    if (selectedAuthors) selectedAuthors.innerHTML = '';
    if (selectedTopics) selectedTopics.innerHTML = '';
    
    // Clear current file container
    const currentFileContainer = document.getElementById('current-file-container');
    if (currentFileContainer) {
        currentFileContainer.innerHTML = '';
    }
}

// Function to open delete confirmation
function openDeleteConfirmation(doc) {
    console.log('Opening delete confirmation for document:', doc);
    
    let confirmDialog = document.getElementById('delete-confirm-dialog');
    if (!confirmDialog) {
        confirmDialog = document.createElement('div');
        confirmDialog.id = 'delete-confirm-dialog';
        confirmDialog.className = 'modal';
        confirmDialog.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 2000;
            justify-content: center;
            align-items: center;
        `;
        
        confirmDialog.innerHTML = `
            <div class="modal-content" style="
                background-color: white;
                padding: 20px;
                border-radius: 5px;
                max-width: 400px;
                width: 90%;
                height:auto;
                position: relative;
            ">
                <h2 style="margin-top: 0;">Confirm Delete</h2>
                <p>Are you sure you want to delete the document "${doc.title}"?</p>
                <p>This action cannot be undone.</p>
                <div class="form-actions" style="
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                ">
                    <button id="cancel-delete" class="cancel-btn" style="
                        padding: 8px 16px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        background-color: #f8f9fa;
                        cursor: pointer;
                    ">Cancel</button>
                    <button id="confirm-delete" class="delete-btn" style="
                        padding: 8px 16px;
                        border: none;
                        border-radius: 4px;
                        background-color: #dc3545;
                        color: white;
                        cursor: pointer;
                    ">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmDialog);
        
        // Add event listeners
        document.getElementById('cancel-delete').addEventListener('click', () => {
            confirmDialog.style.display = 'none';
        });
        
        // Close dialog when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === confirmDialog) {
                confirmDialog.style.display = 'none';
            }
        });
    }
    
    // Update document ID for deletion
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    confirmDeleteBtn.onclick = async () => {
        try {
            const documentId = doc.id || doc.document_id;
            if (!documentId) {
                throw new Error('Document ID not found');
            }
            
            console.log('Sending delete request for document:', documentId);
            const response = await fetch(`/api/documents/${documentId}`, {
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
    confirmDialog.style.display = 'flex';
}

async function showDocumentPreview(doc) {
    console.log('Showing preview for document:', doc);
    
    try {
        // Fetch the latest document data
        const response = await fetch(`/api/documents/${doc.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch document details');
        }
        const data = await response.json();
        console.log('Fetched document data:', data);
        
        // Get the first document if an array is returned
        const documentData = Array.isArray(data) ? data[0] : data;
        console.log('Processing document data:', documentData);

        const modal = document.getElementById('preview-modal');
        if (!modal) {
            console.error('Preview modal not found in the DOM');
            return;
        }

        // Ensure modal is above dropdown
        modal.style.zIndex = '2000';

        // Set document title and author
        const titleElement = document.getElementById('preview-title');
        const authorElement = document.getElementById('preview-author');
        if (titleElement) titleElement.textContent = data.title || doc.title || 'Untitled';
        if (authorElement) {
            let authorText = '';
            if (data.author_names && Array.isArray(data.author_names)) {
                authorText = data.author_names.join(', ');
            } else if (data.author_name) {
                authorText = data.author_name;
            } else if (doc.author_name) {
                authorText = doc.author_name;
            } else {
                authorText = 'Not specified';
            }
            authorElement.textContent = authorText;
        }

        // Set category icon
        const categoryIcon = document.getElementById('preview-category-icon');
        if (categoryIcon) {
            const categoryName = data.category_name || doc.category_name;
            if (categoryName) {
                const iconPath = `/admin/Components/icons/Category-icons/${categoryName.toLowerCase()}.png`;
                categoryIcon.src = iconPath;
                categoryIcon.alt = `${categoryName} Icon`;
            } else {
                categoryIcon.src = '/admin/Components/icons/Category-icons/default_category_icon.png';
                categoryIcon.alt = 'Default Category Icon';
            }
        }

        // Set document info
        const dateElement = document.getElementById('preview-date');
        const topicsElement = document.getElementById('preview-topics');
        const pagesElement = document.getElementById('preview-pages');
        const addedDateElement = document.getElementById('preview-added-date');
        const abstractElement = document.getElementById('preview-abstract');

        if (dateElement) {
            const pubDate = data.publication_date || doc.publication_date;
            const date = pubDate ? new Date(pubDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 'Not specified';
            dateElement.textContent = date;
        }

        if (topicsElement) {
            let topics = [];
            if (data.document_topics && Array.isArray(data.document_topics)) {
                topics = data.document_topics.map(t => t.topic_name);
            } else if (data.topics && Array.isArray(data.topics)) {
                topics = data.topics.map(t => typeof t === 'string' ? t : t.topic_name);
            } else if (doc.topics && Array.isArray(doc.topics)) {
                topics = doc.topics;
            }
            topicsElement.textContent = topics.length > 0 ? topics.join(', ') : 'None';
        }

        if (pagesElement) {
            pagesElement.textContent = data.pages || doc.pages || 'Not specified';
        }
        
        if (addedDateElement) {
            const createdAt = data.updated_at || doc.updated_at;
            const addedDate = createdAt ? new Date(createdAt).toLocaleDateString('en-US', {
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

        // Set abstract with proper formatting
        if (abstractElement) {
            if (data.abstract) {
                abstractElement.innerHTML = `<p>${data.abstract}</p>`;
            } else if (doc.abstract) {
                abstractElement.innerHTML = `<p>${doc.abstract}</p>`;
            } else {
                abstractElement.innerHTML = '<p>No abstract available.</p>';
            }
        }

        // Set up read document button
        const readButton = document.getElementById('preview-read-btn');
        if (readButton) {
            const pdfUrl = `/documents/${doc.file_path}`;
            console.log('Document file path from preview:', doc.file_path);
            if (pdfUrl) {
                readButton.href = pdfUrl;
                readButton.style.display = 'inline-block';
            } else {
                readButton.style.display = 'none';
            }
        }

        // Show modal
        modal.style.display = 'flex';

        // Remove any existing click event listeners
        const existingHandler = modal._clickHandler;
        if (existingHandler) {
            modal.removeEventListener('click', existingHandler);
        }

        // Add click event listener to close modal when clicking outside
        modal._clickHandler = function(event) {
            if (event.target === modal) {
                closePreviewModal();
            }
        };
        modal.addEventListener('click', modal._clickHandler);

    } catch (error) {
        console.error('Error showing document preview:', error);
        alert('Failed to load document preview. Please try again.');
    }
}

// Function to close preview modal
function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Add event listener for escape key to close modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePreviewModal();
    }
});

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
            
            // Remove any existing click handlers
            category.replaceWith(category.cloneNode(true));
            const newCategory = document.querySelector(`.category[data-category="${categoryName}"]`);
            
            // Add new click handler
            newCategory.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                filterByCategory(categoryName);
            });
            
            // Make sure it's visibly clickable
            newCategory.style.cursor = 'pointer';
        } else {
            console.warn("Found category element without data-category attribute");
        }
    });
    
    // Hide the table header
    const tableHeader = document.querySelector("#docs-table thead");
    if (tableHeader) {
        tableHeader.style.display = "none";
    }
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
    const sortDropdown = document.getElementById('sort-order');
    if (sortDropdown) {
        sortDropdown.addEventListener('change', (event) => {
            console.log('Sort order changed to:', event.target.value);
            currentSortOrder = event.target.value; // Update the current sort order
            currentPage = 1; // Reset to first page
            loadDocuments(currentPage);
        });
    }
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
                highlightActiveSidebarLink();
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
                
                // Initialize date picker after loading the HTML
                setTimeout(() => {
                    if (typeof window.initializePageHeaderDatePicker === 'function') {
                        window.initializePageHeaderDatePicker();
                        console.log("Date picker initialized");
                    } else {
                        console.warn("Date picker initialization function not found");
                    }
                }, 100); // Small delay to ensure DOM is updated
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

// Function to show volume dropdown for a document row
function showVolumeDropdown(row, category, volume) {
    // Remove any existing dropdowns
    document.querySelectorAll('.row-volume-dropdown').forEach(dropdown => {
        dropdown.remove();
    });
    
    // Create volume dropdown container
    const volumeDropdownContainer = document.createElement("div");
    volumeDropdownContainer.className = "row-volume-dropdown";
    
    // Create volume indicator
    const volumeIndicator = document.createElement("div");
    volumeIndicator.className = "row-volume-indicator";
    volumeIndicator.textContent = volume ? `Volume ${volume}` : "No Volume";
    volumeDropdownContainer.appendChild(volumeIndicator);
    
    // Create dropdown
    const dropdown = document.createElement("div");
    dropdown.className = "row-volume-options";
    
    // Add "All Volumes" option
    const allVolumesItem = document.createElement("div");
    allVolumesItem.className = "row-volume-item";
    allVolumesItem.textContent = "All Volumes";
    allVolumesItem.addEventListener("click", (event) => {
        event.stopPropagation();
        // Keep the category filter but clear volume filter
        currentVolumeFilter = null;
        loadDocuments(currentPage);
        volumeDropdownContainer.remove();
        
        // Update active state
        dropdown.querySelectorAll(".row-volume-item").forEach(item => {
            item.classList.remove("active");
        });
        allVolumesItem.classList.add("active");
    });
    dropdown.appendChild(allVolumesItem);
    
    // Add volume option for this document
    if (volume) {
        const volumeItem = document.createElement("div");
        volumeItem.className = "row-volume-item";
        volumeItem.textContent = `Volume ${volume}`;
        volumeItem.addEventListener("click", (event) => {
            event.stopPropagation();
            // Keep the category filter and set volume filter
            currentVolumeFilter = volume;
            loadDocuments(currentPage);
            volumeDropdownContainer.remove();
            
            // Update active state
            dropdown.querySelectorAll(".row-volume-item").forEach(item => {
                item.classList.remove("active");
            });
            volumeItem.classList.add("active");
        });
        dropdown.appendChild(volumeItem);
    }
    
    // Add dropdown to container
    volumeDropdownContainer.appendChild(dropdown);
    
    // Position the dropdown near the row
    const rowRect = row.getBoundingClientRect();
    volumeDropdownContainer.style.position = 'absolute';
    volumeDropdownContainer.style.top = `${rowRect.bottom + window.scrollY}px`;
    volumeDropdownContainer.style.left = `${rowRect.left + window.scrollX}px`;
    
    // Add to document body
    document.body.appendChild(volumeDropdownContainer);

    // Show dropdown
    dropdown.classList.add("show");
    
    // Close dropdown when clicking outside
    const closeDropdown = (event) => {
        if (!volumeDropdownContainer.contains(event.target) && !row.contains(event.target)) {
            volumeDropdownContainer.remove();
            document.removeEventListener('click', closeDropdown);
        }
    };
    
    // Add event listener with a slight delay
    setTimeout(() => {
        document.addEventListener('click', closeDropdown);
    }, 100);
}

// Add CSS styles for the similar documents dropdown
const style = document.createElement('style');
style.textContent = `
    .volume-count-badge {
        background-color: #1976d2;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        margin-left: 8px;
    }

    .similar-docs-dropdown {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin: 4px 0;
        z-index: 100;
    }

    .similar-docs-list {
        max-height: 300px;
        overflow-y: auto;
    }

    .similar-doc-item {
        display: grid;
        grid-template-columns: 40px 1fr auto;
        align-items: center;
        padding: 16px;
        border: 2px solid transparent;
        border-bottom: 1px solid #f0f0f0;
        transition: all 0.2s ease;
        gap: 16px;
        cursor: pointer;
    }

    .similar-doc-item:last-child {
        border-bottom: 2px solid transparent;
    }

    .similar-doc-item:hover {
        border: 2px solid #1976d2;
        background-color: #f8f9fa;
        transform: translateY(-1px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .similar-doc-item .doc-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .similar-doc-item .doc-icon img {
        width: 32px;
        height: 32px;
        object-fit: contain;
    }

    .similar-doc-item .doc-info {
        min-width: 0;
    }

    .similar-doc-item .doc-header {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 4px;
    }

    .similar-doc-item .doc-title {
        font-weight: 500;
        color: #333;
    }

    .similar-doc-item .doc-volume {
        color: #1976d2;
    }

    .similar-doc-item .doc-author,
    .similar-doc-item .doc-year {
        color: #666;
    }

    .similar-doc-item .doc-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .similar-doc-item .tag {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.85em;
        background-color: #f0f0f0;
        color: #666;
    }

    .similar-doc-item .tag.document-type {
        background-color: #e3f2fd;
        color: #1976d2;
    }

    .similar-doc-item .actions {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        justify-content: flex-end;
    }

    .similar-doc-item .action-buttons {
        display: grid;
        grid-template-areas:
            "view delete"
            "edit delete";
        gap: 8px;
        min-width: 140px;
        position: relative;
        z-index: 101;
    }

    .similar-doc-item .view-icon,
    .similar-doc-item .edit-icon,
    .similar-doc-item .delete-icon {
        padding: 8px 12px;
        border-radius: 4px;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background-color 0.2s;
        white-space: nowrap;
        z-index: 102;
    }

    .similar-doc-item .view-icon {
        color: #1976d2;
        grid-area: view;
    }

    .similar-doc-item .edit-icon {
        color: #00796b;
        grid-area: edit;
    }

    .similar-doc-item .delete-icon {
        color: #d32f2f;
        grid-area: delete;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .similar-doc-item .view-icon:hover {
        background-color: #e3f2fd;
    }

    .similar-doc-item .edit-icon:hover {
        background-color: #e0f2f1;
    }

    .similar-doc-item .delete-icon:hover {
        background-color: #ffebee;
    }

    /* Modal styles with higher z-index */
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        justify-content: center;
        align-items: center;
    }

    #preview-modal,
    #edit-modal,
    #delete-confirm-dialog {
        z-index: 2000;
    }

    .modal-content {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 800px;
        width: 90%;
        position: relative;
        z-index: 2001;
    }

    /* Ensure modal form elements stay on top */
    .modal input,
    .modal select,
    .modal textarea,
    .modal button {
        position: relative;
        z-index: 2002;
    }
`;
document.head.appendChild(style);

// Setup pagination
function setupPagination() {
    console.log("Setting up pagination");
    const pageLinks = document.getElementById("page-links");
    const entriesInfo = document.getElementById("entries-info");
    
    if (!pageLinks || !entriesInfo) {
        console.error("Pagination elements not found");
        return;
    }
    
    // Add pagination styles
    const style = document.createElement('style');
    style.textContent = `
        #page-links {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin-top: 20px;
        }
        
        .pagination-btn {
            padding: 8px 12px;
            border: 1px solid #e0e0e0;
            background-color: white;
            color: #333;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .pagination-btn:hover:not(.disabled):not(.active) {
            background-color: #f5f5f5;
            border-color: #1976d2;
        }
        
        .pagination-btn.active {
            background-color: #1976d2;
            color: white;
            border-color: #1976d2;
        }
        
        .pagination-btn.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .pagination-ellipsis {
            color: #666;
            padding: 0 4px;
        }
        
        #entries-info {
            text-align: center;
            color: #666;
            margin-bottom: 10px;
        }
    `;
    document.head.appendChild(style);
    
    // Initial pagination update
    updatePagination();
}

function openPdfModal(doc) {
    console.log('Opening PDF modal with document:', doc);
    
    // Get the modal and iframe elements
    const modal = document.getElementById('pdf-modal');
    const iframe = document.getElementById('pdf-viewer');
    const modalTitle = document.getElementById('pdf-modal-title');
    
    if (!modal || !iframe) {
        console.error('PDF viewer elements not found');
        return;
    }

    // Get authors for this document
    let authorDisplay = 'No Author Listed';
    if (doc.author_names && Array.isArray(doc.author_names)) {
        authorDisplay = doc.author_names.join(', ');
    } else if (doc.author_name) {
        authorDisplay = doc.author_name;
    }

    // Set the modal title with document details
    let titleContent = `<span class="doc-title">${doc.title || 'Untitled'}</span>`;
    if (doc.volume) {
        titleContent += ` | <span class="doc-volume">Volume ${doc.volume}</span>`;
    }
    titleContent += ` | <span class="doc-author">${authorDisplay}</span>`;
    if (doc.publication_date) {
        titleContent += ` | <span class="doc-year">${new Date(doc.publication_date).getFullYear()}</span>`;
    }
    
    modalTitle.innerHTML = titleContent;

    // Get the file path
    let pdfPath = doc.file;
    if (!pdfPath) {
        console.error('No file path found for document:', doc);
        alert('Error: Document file path is missing.');
        return;
    }

    // Clean up the file path - extract just the filename
    const cleanPath = pdfPath.split('/').pop();
    const pdfUrl = `/filepathpdf/${cleanPath}`;
    
    console.log('Loading PDF from URL:', pdfUrl);
    
    // Set the iframe source and show the modal
    iframe.src = pdfUrl;
    modal.classList.add('active');

    // Add event listeners for closing the modal
    modal.onclick = function(event) {
        if (event.target === modal) {
            closePdfModal();
        }
    };

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePdfModal();
        }
    });
}

function closePdfModal() {
    const modal = document.getElementById('pdf-modal');
    const iframe = document.getElementById('pdf-viewer');
    
    if (modal) {
        modal.classList.remove('active');
    }
    
    if (iframe) {
        iframe.src = '';
    }
    
    // Remove event listeners
    modal.onclick = null;
    document.removeEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePdfModal();
        }
    });
}

// Update the createDocumentRow function to use the modal viewer
function createDocumentRow(doc) {
    console.log('Creating row for document:', doc);
    const row = document.createElement("tr");
    row.className = "document-card";
    
    // Create cells
    const titleCell = document.createElement("td");
    const authorCell = document.createElement("td");
    const dateCell = document.createElement("td");
    const categoryCell = document.createElement("td");
    const actionsCell = document.createElement("td");
    
    // Set content
    titleCell.textContent = doc.title;
    authorCell.textContent = Array.isArray(doc.author_names) ? doc.author_names.join(", ") : "";
    dateCell.textContent = new Date(doc.publication_date).toLocaleDateString();
    categoryCell.textContent = doc.category_name;
    
    // Create dropdown for actions
    const dropdownContent = document.createElement("div");
    dropdownContent.className = "dropdown-content";
    dropdownContent.style.display = "none";
    
    // Create action buttons
    const viewButton = document.createElement("button");
    viewButton.textContent = "View";
    viewButton.onclick = (e) => {
        e.stopPropagation();
        console.log('View button clicked for document:', doc);
        console.log('Document file path:', doc.file);
        console.log('Document properties:', Object.keys(doc));
        // Pass the full document object instead of just the title
        openPdfModal(doc);
    };
    
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.onclick = (e) => {
        e.stopPropagation();
        openEditModal(doc);
    };
    
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = (e) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this document?")) {
            deleteDocument(doc.id);
        }
    };
    
    // Add buttons to dropdown
    dropdownContent.appendChild(viewButton);
    dropdownContent.appendChild(editButton);
    dropdownContent.appendChild(deleteButton);
    
    // Add dropdown to actions cell
    actionsCell.appendChild(dropdownContent);
    
    // Add click handler to row
    row.onclick = function() {
        // Close all other dropdowns
        const allDropdowns = document.querySelectorAll('.dropdown-content');
        allDropdowns.forEach(dropdown => {
            if (dropdown !== dropdownContent) {
                dropdown.style.display = 'none';
            }
        });
        
        // Toggle this dropdown
        dropdownContent.style.display = dropdownContent.style.display === 'none' ? 'block' : 'none';
    };
    
    // Add cells to row
    row.appendChild(titleCell);
    row.appendChild(authorCell);
    row.appendChild(dateCell);
    row.appendChild(categoryCell);
    row.appendChild(actionsCell);
    
    return row;
}

// Update the preview modal's view button
function updatePreviewModal(doc) {
    // ... existing code ...
    
    const previewReadBtn = document.getElementById('preview-read-btn');
    if (previewReadBtn) {
        previewReadBtn.onclick = (e) => {
            e.preventDefault();
            
            // Debug log the entire document object
            console.log('Preview document object:', doc);
            
            // Get the file path from the correct property
            const filePath = doc.file_path || doc.file || doc.filepath || doc.document_path;
            console.log('Document file path from preview:', filePath);
            
            if (!filePath) {
                console.error('No file path found in document:', doc);
                alert('Error: Could not find the document file.');
                return;
            }
            
            openPdfModal(doc.title, filePath);
        };
    }
    
    // ... rest of the existing code ...
}

function showPreview(document) {
    // Update preview content with document details
    document.getElementById('previewTitle').textContent = document.title || 'Title of Document';
    document.getElementById('previewAuthor').textContent = `by ${document.author_names?.join(', ') || 'Author Name'}`;
    document.getElementById('previewPublishDate').textContent = document.publication_date || '2021';
    document.getElementById('previewTopics').textContent = document.topics?.map(t => t.topic_name).join(', ') || 'None';
    document.getElementById('previewPages').textContent = document.pages || '0';
    document.getElementById('previewAddedDate').textContent = document.added_date || 'April 4, 2025';
    document.getElementById('previewAbstract').textContent = document.abstract || 'This is the default abstract text...';

    // Set up read document button
    const readBtn = document.getElementById('readDocumentBtn');
    readBtn.onclick = () => openPdfModal(document);
}

// Function to extract text from PDF using PDF.js
async function extractTextFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Search through pages for abstract
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
                        !cleanedText.includes('©') && 
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
            abstractText = abstractText
                .replace(/^ABSTRACT\s*[:.]?\s*/i, '') // Remove "ABSTRACT" header
                .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
                .replace(/\s+/g, ' ') // Normalize spaces
                .replace(/\n\s*\n/g, '\n') // Remove empty lines
                .replace(/acknowledgements?.*$/is, '') // Remove any acknowledgement section
                .replace(/\s+/g, ' ') // Normalize spaces again after cleanup
                .trim();
            
            // Split into paragraphs more accurately
            const paragraphs = abstractText
                .split(/(?<=[.?!])\s+(?=[A-Z])/g) // keep only full-stop + capital start
                .map(p => p.trim())
                .filter(p => p.length > 0 && !p.match(/^(keywords?|chapter|section|index terms|acknowledge)/i));
            
            return `<div class="abstract-text">${paragraphs.map(p => 
                `<p>${p}</p>`).join('')}</div>`;
        }
        
        return "No abstract found in the document.";
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        return "Unable to extract abstract from PDF.";
    }
}

// Function to find the start of the abstract
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

// Add event listener for file input in edit form
document.addEventListener('DOMContentLoaded', () => {
    const editFileInput = document.getElementById('edit-file');
    if (editFileInput) {
        editFileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file && file.type === "application/pdf") {
                try {
                    // Extract text and abstract from PDF
                    const extractedText = await extractTextFromPDF(file);
                    console.log('Extracted abstract:', extractedText);
                    
                    // Update preview abstract
                    const previewAbstract = document.getElementById('edit-preview-abstract');
                    if (previewAbstract) {
                        previewAbstract.innerHTML = extractedText;
                    }
                    
                    // Store the abstract for form submission
                    window.extractedAbstract = extractedText;
                    
                    // Get page count
                    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
                    const pageCount = pdf.numPages;
                    const pageCountElement = document.getElementById('edit-page-count');
                    if (pageCountElement) {
                        pageCountElement.textContent = pageCount;
                    }
                    
                } catch (error) {
                    console.error('Error processing PDF:', error);
                    const previewAbstract = document.getElementById('edit-preview-abstract');
                    if (previewAbstract) {
                        previewAbstract.textContent = "Error extracting abstract from the document.";
                    }
                }
            } else {
                const previewAbstract = document.getElementById('edit-preview-abstract');
                if (previewAbstract) {
                    previewAbstract.textContent = "Please upload a PDF file to extract the abstract.";
                }
            }
        });
    }
});

// Update the CSS for abstract formatting
const abstractStyles = `
    .abstract-content {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        font-family: "Times New Roman", Times, serif;
        font-size: 12pt;
        line-height: 1.6;
        font-weight: normal !important;
    }
    
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
    
    #edit-preview-abstract {
        color: #333;
        font-weight: normal !important;
    }
    
    #edit-preview-abstract * {
        font-weight: normal !important;
    }
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.textContent = abstractStyles;
document.head.appendChild(styleSheet);
