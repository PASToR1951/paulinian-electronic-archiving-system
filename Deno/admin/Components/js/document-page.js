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

// Update the loadDocuments function to group documents by title
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
        url += `&sort=${currentSortOrder}`;
        
        console.log('Fetching documents from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.text();
        const documents = JSON.parse(responseData);
        
        // Group documents by title
        const groupedDocuments = documents.reduce((acc, doc) => {
            if (!acc[doc.title]) {
                acc[doc.title] = [];
            }
            acc[doc.title].push(doc);
            return acc;
        }, {});

        // Sort each group by volume
        Object.values(groupedDocuments).forEach(group => {
            group.sort((a, b) => {
                const volA = parseInt(a.volume) || 0;
                const volB = parseInt(b.volume) || 0;
                return volA - volB;
            });
        });
        
        let documentsToDisplay = Object.values(groupedDocuments).map(group => group[0]); // Take first document from each group
        
        const tbody = document.querySelector("#docs-table tbody");
        tbody.innerHTML = "";

        if (documentsToDisplay.length === 0) {
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

        // Filter documents by category on the client side
        if (currentCategoryFilter && currentCategoryFilter !== "All") {
            documentsToDisplay = documentsToDisplay.filter(doc => 
                doc.category_name && 
                doc.category_name.toLowerCase() === currentCategoryFilter.toLowerCase()
            );
        }

        documentsToDisplay.forEach(doc => {
            const row = document.createElement("tr");
            row.className = "document-card";
            row.setAttribute('data-category', doc.category_name || '');
            row.setAttribute('data-volume', doc.volume || '');
            row.setAttribute('data-title', doc.title || '');
            row.style.cursor = 'pointer';
            
            // Create the main document row without action buttons
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

            // Add volume count badge if there are multiple volumes
            const volumeCount = groupedDocuments[doc.title].length;
            if (volumeCount > 1) {
                headerContent += ` <span class="volume-count-badge">${volumeCount} Volumes</span>`;
            }
            
            infoCell.innerHTML = `
                <div class="doc-header">
                    ${headerContent}
                </div>
                <div class="doc-tags">
                    <span class="tag document-type">${doc.category_name || 'Uncategorized'}</span>
                    ${getTopicsHtml(doc)}
                </div>
            `;
            
            // Append cells to row
            row.appendChild(iconCell);
            row.appendChild(infoCell);
            
            // Add click handler for the entire row
            row.addEventListener('click', async (e) => {
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
                    if (Math.abs(dropdownTop - rowRect.bottom) < 2) { // Using small threshold for floating point differences
                        existingDropdown.remove();
                        return;
                    }
                }

                // Remove any existing dropdowns
                document.querySelectorAll('.similar-docs-dropdown').forEach(dropdown => {
                    dropdown.remove();
                });

                const similarDocs = groupedDocuments[doc.title];
                const dropdownContainer = document.createElement('div');
                dropdownContainer.className = 'similar-docs-dropdown';
                
                const listContainer = document.createElement('div');
                listContainer.className = 'similar-docs-list';
                
                // For single volume documents, just show the current document
                const docsToShow = similarDocs || [doc];
                
                docsToShow.forEach(similarDoc => {
                    const docItem = document.createElement('div');
                    docItem.className = 'similar-doc-item';
                    
                    const categoryIcon = getCategoryIcon(similarDoc.category_name);
                    
                    docItem.innerHTML = `
                        <div class="doc-icon">
                            <img src="${categoryIcon}" alt="${similarDoc.category_name} Icon">
                        </div>
                        <div class="doc-info">
                            <div class="doc-header">
                                <span class="doc-title">${similarDoc.title || 'Untitled'}</span>
                                ${similarDoc.volume ? `<span class="doc-volume">Volume ${similarDoc.volume}</span>` : ''}
                                <span class="doc-author">${similarDoc.author_names ? similarDoc.author_names.join(', ') : 'No Author'}</span>
                                <span class="doc-year">${new Date(similarDoc.publication_date).getFullYear()}</span>
                            </div>
                            <div class="doc-tags">
                                <span class="tag document-type">${similarDoc.category_name || 'Uncategorized'}</span>
                                ${getTopicsHtml(similarDoc)}
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
                        showDocumentPreview(similarDoc);
                    });
                    
                    const editButton = docItem.querySelector('.edit-icon');
            editButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                        editDocument(similarDoc.document_id || similarDoc.id);
            });
            
                    const deleteButton = docItem.querySelector('.delete-icon');
            deleteButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                        openDeleteConfirmation(similarDoc);
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

        totalEntries = documentsToDisplay.length;
        updatePagination();
    } catch (error) {
        console.error("Error loading documents:", error);
        const tbody = document.querySelector("#docs-table tbody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-message">Error loading documents</td></tr>`;
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
            currentPage--;
            loadDocuments(currentPage);
        }
    });
    pageLinks.appendChild(prevButton);

    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages || 1, startPage + 4);

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
    nextButton.className = "pagination-btn next-button" + (currentPage === (totalPages || 1) ? " disabled" : "");
    nextButton.disabled = currentPage === (totalPages || 1);
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadDocuments(currentPage);
        }
    });
    pageLinks.appendChild(nextButton);

    // Add additional styles to ensure consistent display
    pageLinks.style.display = 'flex';
    pageLinks.style.justifyContent = 'center';
    pageLinks.style.marginTop = '20px';
    entriesInfo.style.display = 'block';
    entriesInfo.style.textAlign = 'center';
    entriesInfo.style.marginBottom = '10px';
}

// Helper function to create page number buttons
function createPageButton(pageNum) {
    const button = document.createElement("button");
    button.textContent = pageNum;
    button.className = "pagination-btn page-number" + (pageNum === currentPage ? " active" : "");
    button.addEventListener("click", () => {
        if (pageNum !== currentPage) {
            currentPage = pageNum;
            loadDocuments(currentPage);
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
const uploadBox = document.querySelector('.upload-box');
const fileInput = document.getElementById('edit-file');

uploadBox.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
        const fileName = this.files[0].name;
        uploadBox.querySelector('p').textContent = fileName;
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
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched document data:', data);
        
        // Handle both single object and array responses
        const documentData = Array.isArray(data) ? data[0] : data;
        
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
                
                const formData = new FormData();
                formData.append('title', document.getElementById('edit-title').value);
                formData.append('publication_date', document.getElementById('edit-publication-date').value);
                formData.append('volume', document.getElementById('edit-volume').value);
                formData.append('category', document.getElementById('edit-category').value);
                
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
                
                try {
                    const updateResponse = await fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            body: formData
        });

                    if (!updateResponse.ok) {
                        throw new Error(`HTTP error! status: ${updateResponse.status}`);
        }

                    // Show success modal
        const successModal = document.getElementById('success-modal');
        successModal.style.display = 'flex';

                    // Close modals and refresh documents after delay
        setTimeout(() => {
            successModal.style.display = 'none';
                        closeEditModal();
                        loadDocuments(currentPage);
        }, 2000);
    } catch (error) {
        console.error('Error updating document:', error);
        alert('Error updating document. Please try again.');
    }
            };
        }
    } catch (error) {
        console.error('Error editing document:', error);
        alert('Error editing document details. Please try again.');
        closeEditModal();
    }
}

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    modal.style.display = 'none';
    document.getElementById('edit-form').reset();
    selectedAuthors.innerHTML = '';
    selectedTopics.innerHTML = '';
    document.getElementById('current-file-container').innerHTML = '';
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
        const documentData = await response.json();
        console.log('Fetched document details:', documentData);

        // Get the first document if an array is returned
        const data = Array.isArray(documentData) ? documentData[0] : documentData;
        console.log('Processing document data:', data);

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
            const createdAt = data.created_at || doc.created_at;
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
            const filePath = data.file || doc.file;
            if (filePath) {
                readButton.href = filePath;
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
    const sortDropdown = document.getElementById('sort-order');
    if (sortDropdown) {
        sortDropdown.addEventListener('change', (event) => {
            currentSortOrder = event.target.value;
            currentPage = 1; // Reset to first page when sort changes
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
    
    // Add event listener with a slight delay to avoid immediate closing
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

