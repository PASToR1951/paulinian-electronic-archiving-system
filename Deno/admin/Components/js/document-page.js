// Globals
let currentPage = 1;
const pageSize = 5;
let totalEntries = 0;
let currentCategoryFilter = null; // Track current category filter
// Volume filtering has been removed - now handled by compiled documents
let currentSortOrder = 'latest'; // Track current sort order
// New variable to track the actual count of visible entries on the page (counting compiled docs as one)
let visibleEntriesCount = 0;
// Keep track of expanded compiled documents
let expandedDocuments = new Set();

// Remove custom CSS for document container as it's now handled in CSS files
// const docContainerStyle = document.createElement('style');
// docContainerStyle.textContent = `
//     #documents-container {
//         height: 600px; /* Set fixed height */
//         max-height: 600px;
//         overflow-y: auto; /* Enable vertical scrolling */
//         padding: 10px;
//         border: 1px solid #eee;
//         border-radius: 8px;
//     }
// `;
// document.head.appendChild(docContainerStyle);

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
            totalFileCount += Number(category.count) || 0;
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
            console.log(`Processing category: ${category.name} with count: ${category.count}`);
            const categoryElement = document.querySelector(`.category[data-category="${category.name}"]`);
            if (categoryElement) {
                const fileCountElement = categoryElement.querySelector(".category-file-count");
                if (fileCountElement) {
                    const count = Number(category.count) || 0;
                    console.log(`Setting count for ${category.name}:`, count);
                    fileCountElement.textContent = `${count} files`;
                } else {
                    console.warn(`Could not find file count element for ${category.category_name}`);
                }
                
                // Add click handler for category filtering
                categoryElement.removeEventListener('click', categoryElement.clickHandler);
                categoryElement.clickHandler = () => {
                    filterByCategory(category.name);
                };
                categoryElement.addEventListener('click', categoryElement.clickHandler);
                categoryElement.style.cursor = 'pointer';
                
                // Volume dropdown functionality removed as it's now handled by compiled documents
            } else {
                console.warn(`Could not find category element for ${category.name}`);
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

// Volume dropdown functionality removed as it's now handled by compiled documents

// Volume filtering functionality removed as it's now handled by compiled documents

// Category filtering function
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

// Update the loadDocuments function to handle grouped documents
async function loadDocuments(page = 1) {
    try {
        // Remember which documents were expanded before we refresh
        const expandedDocIds = [];
        document.querySelectorAll('.document-card.compilation[data-is-expanded="true"]').forEach(card => {
            expandedDocIds.push(card.getAttribute('data-id'));
        });
        
        // Calculate an adjusted page size to account for compiled documents
        // Request more documents than needed to ensure we have enough visible ones
        const adjustedPageSize = pageSize + 5; // Request extra documents to account for hidden compiled children
        
        // Add cache-busting parameter to prevent caching
        const cacheBuster = new Date().getTime();
        let url = `/api/documents?page=${page}&size=${adjustedPageSize}&_=${cacheBuster}`;
        
        // Apply category filter if set
        if (currentCategoryFilter && currentCategoryFilter !== 'All') {
            url += `&category=${encodeURIComponent(currentCategoryFilter)}`;
        }
        
        // Volume filter has been removed - now handled by compiled documents
        
        // Apply sort order
        url += `&sort=${encodeURIComponent(currentSortOrder)}`;
        
        console.log('Fetching documents from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            try {
                const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            } catch (parseError) {
                throw new Error(`HTTP error! status: ${response.status}, response: ${errorText.substring(0, 100)}...`);
            }
        }
        
        const responseData = await response.json();
        console.log('API Response:', responseData);
        
        const { documents, totalCount, totalPages } = responseData;
        console.log('Documents received:', documents);
        console.log('First document from API:', documents.length > 0 ? JSON.stringify(documents[0], null, 2) : 'No documents');
        
        // Update total entries - we'll use the totalCount from the server
        totalEntries = totalCount;
        
        // Update current page
        currentPage = page;
        
        const documentContainer = document.querySelector("#documents-container");
        if (!documentContainer) {
            console.error("Document container not found");
            return;
        }
        
        // Clear existing contents
        documentContainer.innerHTML = "";

        // Ensure the container can expand when needed
        documentContainer.style.overflow = 'visible';
        documentContainer.style.position = 'relative';

        if (!documents || documents.length === 0) {
            let filterMessage = '';
            if (currentCategoryFilter && currentCategoryFilter !== "All") {
                filterMessage += ` in category "${currentCategoryFilter}"`;
            }
            documentContainer.innerHTML = `
                <div class="empty-message">
                    No documents found${filterMessage}
                </div>
            `;
            return;
        }

        // Track how many visible documents we've displayed
        let visibleDocCount = 0;
        const maxVisibleDocs = pageSize; // Display at most 5 documents
        
        // Reset visible entries count for this page
        visibleEntriesCount = 0;
        
        // Group documents by type - regular documents and compiled document parents
        const regularDocs = [];
        const compiledDocs = [];
        
        // Separate documents into regular and compiled categories
        documents.forEach(doc => {
            if (doc.is_compiled_parent) {
                compiledDocs.push(doc);
            } else if (!doc.compiled_document_id) {
                regularDocs.push(doc);
            }
            // Skip individual compiled documents as they'll be displayed under their parent
        });
        
        // Combine the documents in the order from the server
        const displayDocuments = [];
        let regularIndex = 0;
        let compiledIndex = 0;
        
        documents.forEach(doc => {
            if (doc.is_compiled_parent && compiledIndex < compiledDocs.length) {
                displayDocuments.push(compiledDocs[compiledIndex++]);
            } else if (!doc.compiled_document_id && regularIndex < regularDocs.length) {
                displayDocuments.push(regularDocs[regularIndex++]);
            }
        });
        
        // Ensure we only show the maximum number of visible documents
        const docsToDisplay = displayDocuments.slice(0, maxVisibleDocs);
        
        // Render each document
        docsToDisplay.forEach((doc, index) => {
            if (doc.is_compiled_parent) {
                // This is a compiled document parent - use our specialized function
                const wrapper = createCompiledDocumentRow(doc, documentContainer);
                
                // Special handling for compiled documents in the last row
                if (index === maxVisibleDocs - 1) {
                    // This is the last document in the page and it's a compiled document
                    wrapper.classList.add('last-in-page');
                }
                
                // Check if this document was previously expanded
                if (expandedDocIds.includes(doc.id)) {
                    // Expand it again
                    const card = wrapper.querySelector('.document-card');
                    const childrenContainer = wrapper.querySelector('.children-container');
                    const expandIcon = card.querySelector('.expand-icon');
                    
                    card.setAttribute('data-is-expanded', 'true');
                    expandIcon.textContent = '▼';
                    childrenContainer.style.display = 'block';
                    childrenContainer.style.maxHeight = 'none';
                    childrenContainer.style.overflow = 'visible';
                    
                    // Make sure it's fully visible
                    setTimeout(() => {
                        const rect = childrenContainer.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;
                        
                        if (rect.bottom > viewportHeight) {
                            childrenContainer.scrollIntoView({behavior: 'smooth', block: 'start'});
                        }
                    }, 100);
                }
                
                visibleDocCount++;
                visibleEntriesCount++; // Count compiled document as one entry
            } else if (!doc.compiled_document_id) {
                // This is a regular document (not part of a compilation)
                const card = createDocumentRow(doc);
                documentContainer.appendChild(card);
                visibleDocCount++;
                visibleEntriesCount++; // Count regular document as one entry
            }
        });

        console.log(`Displayed ${visibleEntriesCount} visible entries (${visibleDocCount} visible documents)`);
        
        // Update pagination
        updatePagination(totalPages);
    } catch (error) {
        console.error("Error loading documents:", error);
        // Display error message to user
        const documentContainer = document.querySelector("#documents-container");
        if (documentContainer) {
            documentContainer.innerHTML = `
                <div class="error-message">
                    <h3>Error loading documents</h3>
                    <p>${error.message || "Unknown error"}</p>
                </div>
            `;
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

// Update the updatePagination function to improve handling of compiled documents
function updatePagination(totalPages) {
    const entriesInfo = document.getElementById("entries-info");
    const pageLinks = document.getElementById("page-links");

    if (!entriesInfo || !pageLinks) return;

    // Calculate the start and end entries for display
    const startEntry = totalEntries > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const endEntry = Math.min(startEntry + visibleEntriesCount - 1, totalEntries);
    
    // Update entries info to show actual visible entries
    entriesInfo.textContent = `Showing ${startEntry} to ${endEntry} of ${totalEntries} entries`;

    // Clear existing pagination
    pageLinks.innerHTML = "";

    // If there are no entries, don't show pagination
    if (totalEntries === 0 || totalPages === 0) {
        return;
    }

    // Previous button
    const prevButton = document.createElement("button");
    prevButton.textContent = "< prev";
    prevButton.className = "pagination-btn prev-button" + (currentPage === 1 ? " disabled" : "");
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            // Remember scroll position
            const scrollPosition = window.scrollY;
            
            // Close any expanded documents before changing page
            document.querySelectorAll('.document-card.compilation[data-is-expanded="true"]').forEach(card => {
                const childrenContainer = card.nextElementSibling;
                card.setAttribute('data-is-expanded', 'false');
                card.querySelector('.expand-icon').textContent = '▶';
                childrenContainer.style.display = 'none';
            });
            
            loadDocuments(currentPage - 1).then(() => {
                // Restore scroll position
                window.scrollTo(0, scrollPosition);
            });
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
        const firstButton = createPageButton(1, totalPages);
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
        const pageButton = createPageButton(i, totalPages);
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
        const lastButton = createPageButton(totalPages, totalPages);
        pageLinks.appendChild(lastButton);
    }

    // Next button
    const nextButton = document.createElement("button");
    nextButton.textContent = "next >";
    nextButton.className = "pagination-btn next-button" + (currentPage === totalPages ? " disabled" : "");
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            // Remember scroll position
            const scrollPosition = window.scrollY;
            
            // Close any expanded documents before changing page
            document.querySelectorAll('.document-card.compilation[data-is-expanded="true"]').forEach(card => {
                const childrenContainer = card.nextElementSibling;
                card.setAttribute('data-is-expanded', 'false');
                card.querySelector('.expand-icon').textContent = '▶';
                childrenContainer.style.display = 'none';
            });
            
            loadDocuments(currentPage + 1).then(() => {
                // Restore scroll position
                window.scrollTo(0, scrollPosition);
            });
        }
    });
    pageLinks.appendChild(nextButton);
}

// Updated createPageButton to handle compiled documents better
function createPageButton(pageNum, totalPages) {
    const button = document.createElement("button");
    button.textContent = pageNum;
    button.className = "pagination-btn page-number" + (pageNum === currentPage ? " active" : "");
    button.addEventListener("click", () => {
        if (pageNum !== currentPage) {
            // Remember scroll position
            const scrollPosition = window.scrollY;
            
            // Close any expanded documents before changing page
            document.querySelectorAll('.document-card.compilation[data-is-expanded="true"]').forEach(card => {
                const childrenContainer = card.nextElementSibling;
                card.setAttribute('data-is-expanded', 'false');
                card.querySelector('.expand-icon').textContent = '▶';
                childrenContainer.style.display = 'none';
            });
            
            loadDocuments(pageNum).then(() => {
                // Restore scroll position
                window.scrollTo(0, scrollPosition);
            });
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

// Main document edit handler - determines which modal to show based on document type
async function editDocument(documentId) {
    try {
        console.log('Fetching document with ID:', documentId);
        
        // Fetch document details to determine type
        const response = await fetch(`/api/documents/${documentId}`);
        console.log("Fetch response status:", response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch document: ${response.status}`);
        }
        
        const data = await response.json();
        const documentData = Array.isArray(data) ? data[0] : data;
        
        if (!documentData) {
            throw new Error('No document data received');
        }
        
        console.log('Document data:', documentData);
        
        // Determine which modal to show based on document type
        if (documentData.is_compiled_parent || documentData.child_documents) {
            // This is a compiled document
            await editCompiledDocument(documentId, documentData);
        } else {
            // This is a single document
            await editSingleDocument(documentId, documentData);
        }
    } catch (error) {
        console.error('Error determining document type:', error);
        alert('Error loading document: ' + error.message);
    }
}

// Edit for single documents
async function editSingleDocument(documentId, documentData) {
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

// Edit for compiled documents
async function editCompiledDocument(documentId, documentData) {
    try {
        const modal = document.getElementById('compiled-edit-modal');
        modal.style.display = 'flex';
        
        console.log('Loading compiled document data:', documentData);

        // Populate form fields
        const titleInput = document.getElementById('compiled-edit-title');
        if (titleInput) titleInput.value = documentData.title || '';
        
        // Set years
        const startYearInput = document.getElementById('compiled-edit-start-year');
        if (startYearInput) startYearInput.value = documentData.start_year || '';
        
        const endYearInput = document.getElementById('compiled-edit-end-year');
        if (endYearInput) endYearInput.value = documentData.end_year || '';
        
        // Set volume and issue
        const volumeInput = document.getElementById('compiled-edit-volume');
        if (volumeInput) volumeInput.value = documentData.compiled_volume || documentData.volume || '';
        
        const issueInput = document.getElementById('compiled-edit-issue');
        if (issueInput) issueInput.value = documentData.compiled_issued_no || '';
        
        // Set category
        const categorySelect = document.getElementById('compiled-edit-category');
        if (categorySelect && documentData.category_name) {
            categorySelect.value = documentData.category_name.toLowerCase();
        }
        
        // Update preview sections
        const previewTitle = document.getElementById('compiled-edit-preview-title');
        if (previewTitle) previewTitle.textContent = documentData.title || 'Untitled Compilation';
        
        // Update years display
        const previewYears = document.getElementById('compiled-edit-preview-years');
        if (previewYears) {
            const startYear = documentData.start_year || '?';
            const endYear = documentData.end_year || '?';
            previewYears.textContent = `${startYear}-${endYear}`;
        }
        
        // Update volume
        const previewVolume = document.getElementById('compiled-edit-preview-volume');
        if (previewVolume) {
            previewVolume.textContent = documentData.compiled_volume || documentData.volume || '?';
        }
        
        // Update added date
        const previewDate = document.getElementById('compiled-edit-preview-date');
        if (previewDate && documentData.updated_at) {
            const date = new Date(documentData.updated_at);
            previewDate.textContent = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        
        // Populate child documents/studies
        const childDocuments = documentData.child_documents || [];
        const studiesContainer = document.getElementById('compiled-studies-list');
        const previewStudiesList = document.getElementById('compiled-edit-preview-studies-list');
        const previewStudiesCount = document.getElementById('compiled-edit-preview-studies');
        
        if (studiesContainer) studiesContainer.innerHTML = '';
        if (previewStudiesList) previewStudiesList.innerHTML = '';
        if (previewStudiesCount) previewStudiesCount.textContent = childDocuments.length;
        
        // Add each study to the list
        childDocuments.forEach((study, index) => {
            // Add to the form list
            if (studiesContainer) {
                // Create document entry similar to upload form
                const entryContainer = document.createElement('div');
                entryContainer.className = 'document-entry';
                entryContainer.setAttribute('data-id', study.id);
                
                // Create document entry header with entry number
                const entryHeader = document.createElement('div');
                entryHeader.className = 'entry-header';
                
                const entryNumber = document.createElement('div');
                entryNumber.className = 'entry-number';
                entryNumber.textContent = index + 1;
                
                // Create title bar
                const titleBar = document.createElement('div');
                titleBar.className = 'title-bar';
                
                // Entry title
                const entryTitle = document.createElement('div');
                entryTitle.className = 'entry-title';
                entryTitle.textContent = study.title || 'Untitled Study';
                
                // Entry actions
                const entryActions = document.createElement('div');
                entryActions.className = 'entry-actions';
                
                // Edit button
                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'edit-btn';
                editBtn.innerHTML = '<span>✏️</span> Edit';
                editBtn.setAttribute('data-id', study.id);
                
                // Remove button
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '<span>🗑️</span> Remove';
                removeBtn.setAttribute('data-id', study.id);
                
                // Add actions to entry actions
                entryActions.appendChild(editBtn);
                entryActions.appendChild(removeBtn);
                
                // Add to title bar
                titleBar.appendChild(entryTitle);
                titleBar.appendChild(entryActions);
                
                // Create document info area
                const entryInfo = document.createElement('div');
                entryInfo.className = 'entry-info';
                
                // Add author info
                const authorInfo = document.createElement('div');
                authorInfo.className = 'author-info';
                authorInfo.innerHTML = `<strong>Author(s):</strong> ${Array.isArray(study.author_names) ? study.author_names.join(', ') : 'No Author Listed'}`;
                
                // Add publication date
                const pubDateInfo = document.createElement('div');
                pubDateInfo.className = 'publication-date';
                if (study.publication_date) {
                    const date = new Date(study.publication_date);
                    pubDateInfo.innerHTML = `<strong>Publication Year:</strong> ${date.getFullYear()}`;
                } else {
                    pubDateInfo.innerHTML = '<strong>Publication Year:</strong> Not specified';
                }
                
                // Add category info
                const categoryInfo = document.createElement('div');
                categoryInfo.className = 'category-info';
                categoryInfo.innerHTML = `<strong>Category:</strong> ${study.category_name || 'Not specified'}`;
                
                // Add all info elements
                entryInfo.appendChild(authorInfo);
                entryInfo.appendChild(pubDateInfo);
                entryInfo.appendChild(categoryInfo);
                
                // Assemble entry header
                entryHeader.appendChild(entryNumber);
                entryHeader.appendChild(titleBar);
                
                // Assemble entry container
                entryContainer.appendChild(entryHeader);
                entryContainer.appendChild(entryInfo);
                
                // Add event listeners
                editBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editSingleDocument(study.id, study);
                });
                
                removeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Show confirmation before removing
                    if (confirm(`Are you sure you want to remove "${study.title}" from this compilation?`)) {
                        // Handle study removal
                        console.log('Removing study:', study.id);
                        // This would need API implementation for removing a study from compilation
                        entryContainer.remove();
                    }
                });
                
                // Add to studies container
                studiesContainer.appendChild(entryContainer);
            }
            
            // Add to preview list
            if (previewStudiesList) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-study-item';
                previewItem.innerHTML = `
                    <div class="preview-study-title">${study.title || 'Untitled Study'}</div>
                    <div class="preview-study-author">
                        ${Array.isArray(study.author_names) ? study.author_names.join(', ') : 'No Author Listed'}
                    </div>
                `;
                previewStudiesList.appendChild(previewItem);
            }
        });
        
        // Handle form submission
        const form = document.getElementById('compiled-edit-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                
                try {
                    // Create JSON payload instead of FormData
                    const compiledDocumentData = {
                        title: document.getElementById('compiled-edit-title').value,
                        start_year: document.getElementById('compiled-edit-start-year').value || null,
                        end_year: document.getElementById('compiled-edit-end-year').value || null,
                        volume: document.getElementById('compiled-edit-volume').value || null,
                        issued_no: document.getElementById('compiled-edit-issue').value || null
                    };
                    
                    // Get the selected category value
                    const categorySelect = document.getElementById('compiled-edit-category');
                    const selectedCategory = categorySelect.value;
                    if (selectedCategory === 'default') {
                        throw new Error('Please select a valid category');
                    }
                    compiledDocumentData.category = selectedCategory;
                    
                    // Get document IDs from the studies list
                    const studiesContainer = document.getElementById('compiled-studies-list');
                    const documentEntries = studiesContainer.querySelectorAll('.document-entry');
                    const documentIds = Array.from(documentEntries).map(entry => entry.getAttribute('data-id'));
                    compiledDocumentData.document_ids = documentIds;
                    
                    // Show loading state
                    const submitButton = form.querySelector('button[type="submit"]');
                    const originalButtonText = submitButton.innerHTML;
                    submitButton.disabled = true;
                    submitButton.innerHTML = 'Saving...';
                    
                    console.log('Sending compiled document update:', compiledDocumentData);
                    
                    const updateResponse = await fetch(`/api/compiled-documents/${documentId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(compiledDocumentData)
                    });

                    if (!updateResponse.ok) {
                        const errorData = await updateResponse.json();
                        throw new Error(errorData.message || 'Failed to update compilation');
                    }

                    // Show success modal
                    const successModal = document.getElementById('success-modal');
                    if (successModal) {
                        successModal.style.display = 'flex';
                        
                        // Close modals and refresh documents after delay
                        setTimeout(() => {
                            successModal.style.display = 'none';
                            closeCompiledEditModal();
                            loadDocuments(currentPage);
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Error updating compilation:', error);
                    alert('Error updating compilation: ' + error.message);
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
        console.error('Error editing compiled document:', error);
        alert('Error editing compilation: ' + error.message);
        closeCompiledEditModal();
    }
}

// Close single document edit modal
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

// Close compiled document edit modal
function closeCompiledEditModal() {
    const modal = document.getElementById('compiled-edit-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset form
    const form = document.getElementById('compiled-edit-form');
    if (form) {
        form.reset();
    }
    
    // Clear studies list
    const studiesContainer = document.getElementById('compiled-studies-list');
    const previewStudiesList = document.getElementById('compiled-edit-preview-studies-list');
    if (studiesContainer) studiesContainer.innerHTML = '';
    if (previewStudiesList) previewStudiesList.innerHTML = '';
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

// Update the filter indicator to show category filter
function updateFilterIndicator() {
    const filterIndicator = document.getElementById('filter-indicator');
    if (!filterIndicator) return;
    
    if (currentCategoryFilter && currentCategoryFilter !== "All") {
        let filterText = `Category: ${currentCategoryFilter}`;
        
        filterIndicator.innerHTML = `
            <span class="filter-badge">${filterText}</span>
            <button id="clear-filter">Clear Filter</button>
        `;
        
        document.getElementById('clear-filter').addEventListener('click', () => {
            currentCategoryFilter = null;
            document.querySelectorAll('.category').forEach(cat => {
                cat.classList.remove('active');
            });
            loadDocuments(1);
            updateFilterIndicator();
        });
    } else {
        filterIndicator.innerHTML = '';
    }
}

// Initialize the page - consolidate all DOMContentLoaded handlers into a single one
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing document page...');
        
        // Add compiled document styles
        addCompiledDocumentStyles();
        
        // Load sidebar and navbar
        await loadSidebar();
        await loadNavbar();
        
        // Load categories first
        await loadCategories();
        
        // Setup category filters
        setupCategoryFilters();
        
        // Setup volume filter dropdown
        setupVolumeFilterDropdown();
        
        // Setup sort functionality - do this before loading documents
        setupSort();
        
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
        
        // Setup filter indicator
        updateFilterIndicator();
        
        // Setup file input handler for edit form
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
        
        console.log('Page initialized successfully');
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});

// Remove the other DOMContentLoaded event listeners since they're now consolidated

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
        
        // Group compiled documents and format the results
        const documentsMap = new Map();
        const compiledDocumentsMap = new Map();
        const compiledDocuments = Array.from(documents).reduce((acc, doc) => {
            if (doc.volume) {
                acc[doc.volume] = acc[doc.volume] || [];
                acc[doc.volume].push(doc);
            }
            return acc;
        }, {});
        
        // Extract unique volumes from documents
        const volumes = new Set(Object.keys(compiledDocuments));
        
        // Sort volumes numerically
        const sortedVolumes = Array.from(volumes).sort((a, b) => {
            const numA = parseInt(a) || 0;
            const numB = parseInt(b) || 0;
            return numA - numB;
        });
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
        // Set the dropdown to reflect the current sort order state
        sortDropdown.value = currentSortOrder;
        
        sortDropdown.addEventListener('change', (event) => {
            console.log('Sort order changed to:', event.target.value);
            currentSortOrder = event.target.value; // Update the current sort order
            currentPage = 1; // Reset to first page
            loadDocuments(currentPage);
            
            // Store sorting preference in local storage for persistence
            localStorage.setItem('documentSortOrder', currentSortOrder);
        });
        
        // Check if there's a stored preference
        const storedSortOrder = localStorage.getItem('documentSortOrder');
        if (storedSortOrder) {
            currentSortOrder = storedSortOrder;
            sortDropdown.value = currentSortOrder;
        }
    } else {
        console.error('Sort dropdown element not found');
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
    
    // Add click listener with a small delay to avoid immediate trigger
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

// Function to create a card for a regular document
function createDocumentRow(doc) {
    console.debug('Creating card for document:', JSON.stringify(doc, null, 2));
    const card = document.createElement("div");
    card.className = "document-card";
    card.setAttribute('data-id', doc.id);
    
    // Create card icon (using category icon)
    const cardIcon = document.createElement("div");
    cardIcon.className = "card-icon";
    
    // Get the appropriate icon based on category
    const iconImg = document.createElement("img");
    let iconPath = "/admin/Components/icons/Category-icons/default_category_icon.png";
    
    // Set icon based on category name (lowercase for case-insensitive comparison)
    const categoryName = (doc.category_name || "").toLowerCase();
    if (categoryName === "confluence") {
        iconPath = "/admin/Components/icons/Category-icons/confluence.png";
    } else if (categoryName === "dissertation") {
        iconPath = "/admin/Components/icons/Category-icons/dissertation.png";
    } else if (categoryName === "thesis") {
        iconPath = "/admin/Components/icons/Category-icons/thesis.png";
    } else if (categoryName === "synergy") {
        iconPath = "/admin/Components/icons/Category-icons/synergy.png";
    }
    
    iconImg.src = iconPath;
    iconImg.alt = doc.category_name || "Category Icon";
    cardIcon.appendChild(iconImg);
    
    // Create card content
    const cardContent = document.createElement("div");
    cardContent.className = "card-content";
    
    // Create title
    const cardTitle = document.createElement("div");
    cardTitle.className = "card-title";
    cardTitle.textContent = doc.title || "Untitled";
    
    // Create metadata based on the format in the image
    const cardMetadata = document.createElement("div");
    cardMetadata.className = "card-metadata";
    
    // Format components in order: Title | Volume # | Author | Year
    // We'll use doc.title in the card title, not in metadata
    const volumeText = doc.volume ? `Volume ${doc.volume}` : "";
    
    // Handle issue field
    const issueText = doc.issued_no ? `Issue ${doc.issued_no}` : "";
    
    // Ensure author_names is properly handled
    let authorText = "";
    if (Array.isArray(doc.author_names) && doc.author_names.length > 0) {
        // Filter out any empty or null values before joining
        authorText = doc.author_names.filter(author => author).join(", ");
        console.debug(`Using author_names array: ${authorText}`);
    } else if (typeof doc.author_name === 'string' && doc.author_name) {
        authorText = doc.author_name;
        console.debug(`Using author_name string: ${authorText}`);
    } else {
        console.debug(`No author information found!`);
    }
    
    // Format year from publication date
    let yearText = "";
    if (doc.publication_date) {
        // If it's a date string like "2020-01-01", extract just the year
        if (typeof doc.publication_date === 'string' && doc.publication_date.includes('-')) {
            yearText = doc.publication_date.split('-')[0];
            console.debug(`Using publication_date year from string: ${yearText}`);
        } else {
            try {
        yearText = new Date(doc.publication_date).getFullYear().toString();
                console.debug(`Using publication_date year from Date object: ${yearText}`);
            } catch (e) {
                console.error("Error parsing publication date:", e);
                yearText = "";
            }
        }
    } else {
        console.debug(`No year information found!`);
    }
    
    // Combine metadata parts in the specified order, filtering out empty ones
    // Order: Volume | Issue | Author | Year
    const metadataParts = [];
    if (volumeText) metadataParts.push(volumeText);
    if (issueText) metadataParts.push(issueText);
    if (authorText) metadataParts.push(authorText);
    if (yearText) metadataParts.push(yearText);
    
    cardMetadata.textContent = metadataParts.join(' | ');
    
    // Create tags container with only one tag for document type
    const cardTags = document.createElement("div");
    cardTags.className = "card-tags";
    
    // Add document type tag (using category name)
    const docTypeTag = document.createElement("div");
    docTypeTag.className = "tag document-type";
    docTypeTag.textContent = doc.category_name || "Uncategorized";
    
    cardTags.appendChild(docTypeTag);
    
    // Add all content elements to card content
    cardContent.appendChild(cardTitle);
    cardContent.appendChild(cardMetadata);
    cardContent.appendChild(cardTags);
    
    // Create card actions
    const cardActions = document.createElement("div");
    cardActions.className = "card-actions";
    
    // Create action buttons
    const viewButton = document.createElement("button");
    viewButton.className = "action-button view";
    viewButton.textContent = "View";
    viewButton.onclick = (e) => {
        e.stopPropagation();
        console.log('View button clicked for document:', doc);
        openPdfModal(doc);
    };
    
    const editButton = document.createElement("button");
    editButton.className = "action-button edit";
    editButton.textContent = "Edit";
    editButton.onclick = (e) => {
        e.stopPropagation();
        editDocument(doc.id);
    };
    
    const deleteButton = document.createElement("button");
    deleteButton.className = "action-button delete";
    deleteButton.textContent = "Delete";
    deleteButton.onclick = (e) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this document?")) {
            deleteDocument(doc.id);
        }
    };
    
    // Add buttons to actions
    cardActions.appendChild(viewButton);
    cardActions.appendChild(editButton);
    cardActions.appendChild(deleteButton);
    
    // Assemble the card
    card.appendChild(cardIcon);
    card.appendChild(cardContent);
    card.appendChild(cardActions);
    
    return card;
}

// Function to create a card for a compiled document with expandable child documents
function createCompiledDocumentRow(compiledDoc, container) {
    // Create parent card
    const card = document.createElement("div");
    card.className = "document-card compilation";
    card.setAttribute('data-id', compiledDoc.id);
    card.setAttribute('data-is-expanded', 'false');
    
    // Create card icon (using category icon)
    const cardIcon = document.createElement("div");
    cardIcon.className = "card-icon";
    
    // Get the appropriate icon based on category
    const iconImg = document.createElement("img");
    let iconPath = "/admin/Components/icons/Category-icons/default_category_icon.png";
    
    // Set icon based on category name (lowercase for case-insensitive comparison)
    const categoryName = (compiledDoc.category_name || "").toLowerCase();
    if (categoryName === "confluence") {
        iconPath = "/admin/Components/icons/Category-icons/confluence.png";
    } else if (categoryName === "dissertation") {
        iconPath = "/admin/Components/icons/Category-icons/dissertation.png";
    } else if (categoryName === "thesis") {
        iconPath = "/admin/Components/icons/Category-icons/thesis.png";
    } else if (categoryName === "synergy") {
        iconPath = "/admin/Components/icons/Category-icons/synergy.png";
    }
    
    iconImg.src = iconPath;
    iconImg.alt = compiledDoc.category_name || "Category Icon";
    cardIcon.appendChild(iconImg);
    
    // Create card content
    const cardContent = document.createElement("div");
    cardContent.className = "card-content";
    
    // Create title with dropdown icon
    const cardTitle = document.createElement("div");
    cardTitle.className = "card-title";
    cardTitle.innerHTML = `<span class="expand-icon">▶</span> ${compiledDoc.title}`;
    
    // Create metadata based on the format in the image
    const cardMetadata = document.createElement("div");
    cardMetadata.className = "card-metadata";
    
    // Format components in the same order as regular documents
    const volumeText = compiledDoc.volume ? `Volume ${compiledDoc.volume}` : "";
    const issueText = compiledDoc.issued_no ? `Issue ${compiledDoc.issued_no}` : "";
    
    // Get authors from child documents if available
    let authorText = "";
    if (Array.isArray(compiledDoc.author_names) && compiledDoc.author_names.length > 0) {
        // Filter out any empty or null values
        authorText = compiledDoc.author_names.filter(author => author).join(", ");
    } else if (compiledDoc.child_documents && compiledDoc.child_documents.length > 0) {
        const authors = new Set();
        compiledDoc.child_documents.forEach(childDoc => {
            if (childDoc.author_names && Array.isArray(childDoc.author_names)) {
                childDoc.author_names.filter(author => author).forEach(author => authors.add(author));
            } else if (childDoc.author_name) {
                authors.add(childDoc.author_name);
            }
        });
        authorText = Array.from(authors).join(', ');
    }
    
    // Format year from the compilation data
    let yearText = "";
    if (compiledDoc.start_year && compiledDoc.end_year) {
        yearText = `${compiledDoc.start_year}-${compiledDoc.end_year}`;
    } else if (compiledDoc.publication_date) {
        // If it's a date string like "2020-01-01", extract just the year
        if (typeof compiledDoc.publication_date === 'string' && compiledDoc.publication_date.includes('-')) {
            yearText = compiledDoc.publication_date.split('-')[0];
        } else {
            try {
        yearText = new Date(compiledDoc.publication_date).getFullYear().toString();
            } catch (e) {
                console.error("Error parsing publication date:", e);
                yearText = "";
            }
        }
    }
    
    // Combine metadata parts in specified order, filtering out empty ones
    // Order: Volume | Issue | Author | Year
    const metadataParts = [];
    if (volumeText) metadataParts.push(volumeText);
    if (issueText) metadataParts.push(issueText);
    if (authorText) metadataParts.push(authorText);
    if (yearText) metadataParts.push(yearText);
    
    cardMetadata.textContent = metadataParts.join(' | ');
    
    // Create tags container with only one tag for document type
    const cardTags = document.createElement("div");
    cardTags.className = "card-tags";
    
    // Add document type tag (using category name)
    const docTypeTag = document.createElement("div");
    docTypeTag.className = "tag document-type";
    docTypeTag.textContent = compiledDoc.category_name || "Uncategorized";
    cardTags.appendChild(docTypeTag);
    
    // Add content elements to card
    cardContent.appendChild(cardTitle);
    cardContent.appendChild(cardMetadata);
    cardContent.appendChild(cardTags);
    
    // Create actions container for buttons
    const cardActions = document.createElement("div");
    cardActions.className = "card-actions";
    
    // Create dropdown container for child documents
    const childrenContainer = document.createElement("div");
    childrenContainer.className = "children-container";
    childrenContainer.style.display = 'none'; // Initially hidden
    
    // Add each child document to the dropdown
    if (compiledDoc.child_documents && compiledDoc.child_documents.length > 0) {
        // Add a header for the child documents section
        const childHeader = document.createElement("div");
        childHeader.className = "children-header";
        childHeader.textContent = `Included Documents (${compiledDoc.child_documents.length})`;
        childrenContainer.appendChild(childHeader);
        
        // IMPORTANT: Add all child documents, even if this is the last row in pagination
        compiledDoc.child_documents.forEach(childDoc => {
            // Create a simplified child card with only the view button
            const childCard = document.createElement("div");
            childCard.className = "document-card child-document-card";
            childCard.setAttribute('data-id', childDoc.id);
            
            // Create card icon
            const childCardIcon = document.createElement("div");
            childCardIcon.className = "card-icon";
            
            // Get the appropriate icon based on category
            const childIconImg = document.createElement("img");
            let childIconPath = "/admin/Components/icons/Category-icons/default_category_icon.png";
            
            // Set icon based on category name
            const childCategoryName = (childDoc.category_name || "").toLowerCase();
            if (childCategoryName === "confluence") {
                childIconPath = "/admin/Components/icons/Category-icons/confluence.png";
            } else if (childCategoryName === "dissertation") {
                childIconPath = "/admin/Components/icons/Category-icons/dissertation.png";
            } else if (childCategoryName === "thesis") {
                childIconPath = "/admin/Components/icons/Category-icons/thesis.png";
            } else if (childCategoryName === "synergy") {
                childIconPath = "/admin/Components/icons/Category-icons/synergy.png";
            }
            
            childIconImg.src = childIconPath;
            childIconImg.alt = childDoc.category_name || "Category Icon";
            childCardIcon.appendChild(childIconImg);
            
            // Create card content
            const childCardContent = document.createElement("div");
            childCardContent.className = "card-content";
            
            // Create title
            const childCardTitle = document.createElement("div");
            childCardTitle.className = "card-title";
            childCardTitle.textContent = childDoc.title || "Untitled";
            
            // Create metadata
            const childCardMetadata = document.createElement("div");
            childCardMetadata.className = "card-metadata";
            
            // Format metadata parts
            const childVolume = childDoc.volume ? `Volume ${childDoc.volume}` : "";
            const childIssue = childDoc.issued_no ? `Issue ${childDoc.issued_no}` : "";
            
            // Ensure proper author display
            let childAuthor = "";
            if (Array.isArray(childDoc.author_names) && childDoc.author_names.length > 0) {
                childAuthor = childDoc.author_names.filter(author => author).join(", ");
            } else if (typeof childDoc.author_name === 'string' && childDoc.author_name) {
                childAuthor = childDoc.author_name;
            }
            
            // Format year
            let childYear = "";
            if (childDoc.start_year && childDoc.end_year) {
                childYear = `${childDoc.start_year}-${childDoc.end_year}`;
            } else if (childDoc.publication_date) {
                // If it's a date string like "2020-01-01", extract just the year
                if (typeof childDoc.publication_date === 'string' && childDoc.publication_date.includes('-')) {
                    childYear = childDoc.publication_date.split('-')[0];
                } else {
                    try {
                childYear = new Date(childDoc.publication_date).getFullYear().toString();
                    } catch (e) {
                        console.error("Error parsing publication date:", e);
                        childYear = "";
                    }
                }
            }
            
            const childMetadataParts = [];
            if (childVolume) childMetadataParts.push(childVolume);
            if (childIssue) childMetadataParts.push(childIssue);
            if (childAuthor) childMetadataParts.push(childAuthor);
            if (childYear) childMetadataParts.push(childYear);
            
            childCardMetadata.textContent = childMetadataParts.join(' | ');
            
            // Add content elements
            childCardContent.appendChild(childCardTitle);
            childCardContent.appendChild(childCardMetadata);
            
            // Create card actions with only View button
            const childCardActions = document.createElement("div");
            childCardActions.className = "card-actions";
            
            // Create view button
            const childViewButton = document.createElement("button");
            childViewButton.className = "action-button view";
            childViewButton.textContent = "View";
            childViewButton.onclick = (e) => {
                e.stopPropagation();
                openPdfModal(childDoc);
            };
            
            // Add view button to actions
            childCardActions.appendChild(childViewButton);
            
            // Assemble child card
            childCard.appendChild(childCardIcon);
            childCard.appendChild(childCardContent);
            childCard.appendChild(childCardActions);
            
            childrenContainer.appendChild(childCard);
        });
    } else {
        // No child documents
        const noDocsMessage = document.createElement("div");
        noDocsMessage.className = "no-children-message";
        noDocsMessage.textContent = "No documents in this compilation";
        childrenContainer.appendChild(noDocsMessage);
    }
    
    // Create edit button
    const editButton = document.createElement("button");
    editButton.className = "action-button edit";
    editButton.textContent = "Edit";
    editButton.onclick = (e) => {
        e.stopPropagation();
        editDocument(compiledDoc.id);
    };
    
    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.className = "action-button delete";
    deleteButton.textContent = "Delete";
    deleteButton.onclick = (e) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this compilation?")) {
            deleteDocument(compiledDoc.id);
        }
    };
    
    // Add buttons to actions
    cardActions.appendChild(editButton);
    cardActions.appendChild(deleteButton);
    
    // Assemble the card
    card.appendChild(cardIcon);
    card.appendChild(cardContent);
    card.appendChild(cardActions);
    
    // Add click handler to toggle expansion
    card.addEventListener('click', function(e) {
        // Only toggle if clicking on the card itself or title, not child elements
        if (e.target.closest('.action-button') || e.target.closest('.child-document-card')) {
            return;
        }
        
        const isExpanded = card.getAttribute('data-is-expanded') === 'true';
        
        if (isExpanded) {
            // Collapse
            card.setAttribute('data-is-expanded', 'false');
            cardTitle.querySelector('.expand-icon').textContent = '▶';
            childrenContainer.style.display = 'none';
        } else {
            // Expand
            card.setAttribute('data-is-expanded', 'true');
            cardTitle.querySelector('.expand-icon').textContent = '▼';
            childrenContainer.style.display = 'block';
            
            // Make sure all child documents are loaded and visible when expanded
            ensureAllChildDocumentsLoaded(compiledDoc, childrenContainer);
            
            // Make sure the container is fully visible when expanded
            // This ensures it's not cut off by pagination constraints
            childrenContainer.style.maxHeight = 'none';
            childrenContainer.style.overflow = 'visible';
            
            // Ensure this expanded container is properly positioned
            // and doesn't get cut off at the bottom of the page
            const rect = childrenContainer.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            // If the bottom of the container is beyond the viewport bottom
            if (rect.bottom > viewportHeight) {
                // Scroll to show the whole container
                childrenContainer.scrollIntoView({behavior: 'smooth', block: 'start'});
            }
        }
    });
    
    // Create main wrapper that includes both the card and its children
    const wrapper = document.createElement("div");
    wrapper.className = "compilation-wrapper";
    wrapper.appendChild(card);
    wrapper.appendChild(childrenContainer);
    
    // Add the compilation to the container
    container.appendChild(wrapper);
    
    return wrapper;
}

// Function to ensure all child documents in a compilation are loaded
function ensureAllChildDocumentsLoaded(compiledDoc, childrenContainer) {
    // Check if we need to load more child documents
    if (compiledDoc.child_documents && compiledDoc.child_documents.length > 0) {
        // Clear the container first
        const existingChildCards = childrenContainer.querySelectorAll('.child-document-card');
        if (existingChildCards.length < compiledDoc.child_documents.length) {
            console.log(`Loading all ${compiledDoc.child_documents.length} child documents`);
            
            // Show a loading indicator
            const loadingIndicator = document.createElement("div");
            loadingIndicator.className = "loading-indicator";
            loadingIndicator.textContent = "Loading all documents...";
            loadingIndicator.style.textAlign = "center";
            loadingIndicator.style.padding = "10px";
            loadingIndicator.style.color = "#666";
            childrenContainer.appendChild(loadingIndicator);
            
            // Add all child documents with a small delay to ensure DOM updates
            setTimeout(() => {
                // Remove loading indicator
                loadingIndicator.remove();
                
                // Add all child documents
                compiledDoc.child_documents.forEach(childDoc => {
                    // Check if this child document already exists
                    const existingChild = childrenContainer.querySelector(`.child-document-card[data-id="${childDoc.id}"]`);
                    if (!existingChild) {
                        // Create a simplified child card with only the view button
                        const childCard = document.createElement("div");
                        childCard.className = "document-card child-document-card";
                        childCard.setAttribute('data-id', childDoc.id);
                        
                        // Create card icon
                        const childCardIcon = document.createElement("div");
                        childCardIcon.className = "card-icon";
                        
                        // Get the appropriate icon based on category
                        const childIconImg = document.createElement("img");
                        let childIconPath = "/admin/Components/icons/Category-icons/default_category_icon.png";
                        
                        // Set icon based on category name
                        const childCategoryName = (childDoc.category_name || "").toLowerCase();
                        if (childCategoryName === "confluence") {
                            childIconPath = "/admin/Components/icons/Category-icons/confluence.png";
                        } else if (childCategoryName === "dissertation") {
                            childIconPath = "/admin/Components/icons/Category-icons/dissertation.png";
                        } else if (childCategoryName === "thesis") {
                            childIconPath = "/admin/Components/icons/Category-icons/thesis.png";
                        } else if (childCategoryName === "synergy") {
                            childIconPath = "/admin/Components/icons/Category-icons/synergy.png";
                        }
                        
                        childIconImg.src = childIconPath;
                        childIconImg.alt = childDoc.category_name || "Category Icon";
                        childCardIcon.appendChild(childIconImg);
                        
                        // Create card content
                        const childCardContent = document.createElement("div");
                        childCardContent.className = "card-content";
                        
                        // Create title
                        const childCardTitle = document.createElement("div");
                        childCardTitle.className = "card-title";
                        childCardTitle.textContent = childDoc.title || "Untitled";
                        
                        // Create metadata
                        const childCardMetadata = document.createElement("div");
                        childCardMetadata.className = "card-metadata";
                        
                        // Format metadata parts
                        const childVolume = childDoc.volume ? `Volume ${childDoc.volume}` : "";
                        const childIssue = childDoc.issued_no ? `Issue ${childDoc.issued_no}` : "";
                        
                        // Ensure proper author display
                        let childAuthor = "";
                        if (Array.isArray(childDoc.author_names) && childDoc.author_names.length > 0) {
                            childAuthor = childDoc.author_names.filter(author => author).join(", ");
                        } else if (typeof childDoc.author_name === 'string' && childDoc.author_name) {
                            childAuthor = childDoc.author_name;
        }
        
                        // Format year
                        let childYear = "";
                        if (childDoc.start_year && childDoc.end_year) {
                            childYear = `${childDoc.start_year}-${childDoc.end_year}`;
                        } else if (childDoc.publication_date) {
                            // If it's a date string like "2020-01-01", extract just the year
                            if (typeof childDoc.publication_date === 'string' && childDoc.publication_date.includes('-')) {
                                childYear = childDoc.publication_date.split('-')[0];
                            } else {
                                try {
                                    childYear = new Date(childDoc.publication_date).getFullYear().toString();
                                } catch (e) {
                                    console.error("Error parsing publication date:", e);
                                    childYear = "";
        }
                            }
                        }
                        
                        const childMetadataParts = [];
                        if (childVolume) childMetadataParts.push(childVolume);
                        if (childIssue) childMetadataParts.push(childIssue);
                        if (childAuthor) childMetadataParts.push(childAuthor);
                        if (childYear) childMetadataParts.push(childYear);
                        
                        childCardMetadata.textContent = childMetadataParts.join(' | ');
                        
                        // Add content elements
                        childCardContent.appendChild(childCardTitle);
                        childCardContent.appendChild(childCardMetadata);
                        
                        // Create card actions with only View button
                        const childCardActions = document.createElement("div");
                        childCardActions.className = "card-actions";
                        
                        // Create view button
                        const childViewButton = document.createElement("button");
                        childViewButton.className = "action-button view";
                        childViewButton.textContent = "View";
                        childViewButton.onclick = (e) => {
                            e.stopPropagation();
                            openPdfModal(childDoc);
                        };
                        
                        // Add view button to actions
                        childCardActions.appendChild(childViewButton);
                        
                        // Assemble child card
                        childCard.appendChild(childCardIcon);
                        childCard.appendChild(childCardContent);
                        childCard.appendChild(childCardActions);
                        
                        childrenContainer.appendChild(childCard);
                    }
                });
                
                // Make sure the container is properly positioned and visible
                childrenContainer.style.maxHeight = 'none';
                childrenContainer.style.overflow = 'visible';
                
                // Ensure this expanded container is properly positioned
                // and doesn't get cut off at the bottom of the page
                const rect = childrenContainer.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                
                if (rect.bottom > viewportHeight) {
                    // Scroll to show the whole container
                    childrenContainer.scrollIntoView({behavior: 'smooth', block: 'start'});
                }
            }, 100);
        }
    }
}

// Add CSS for compiled documents
function addCompiledDocumentStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Compiled document styles */
        .document-card.compilation {
            cursor: pointer;
            position: relative;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 12px;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .document-children-container {
            padding: 0;
            margin: 0 0 0 20px;
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.5s ease;
        }
        
        .document-card.compilation[data-is-expanded="true"] .document-children-container {
            max-height: 1000px;
            margin-top: 10px;
            margin-bottom: 10px;
        }
        
        .compilation-toggle {
            position: absolute;
            left: 10px;
            top: 20px;
            font-size: 16px;
            color: #555;
            transition: transform 0.3s ease;
        }
        
        .document-card.compilation[data-is-expanded="true"] .compilation-toggle {
            transform: rotate(90deg);
        }
        
        .child-document {
            padding: 10px;
            margin-bottom: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid #1976d2;
            position: relative;
        }
        
        .child-document .document-title {
            font-weight: 500;
            margin: 0 0 4px 0;
        }
        
        .child-document .document-metadata {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
        }
        
        .child-document .document-actions {
            text-align: right;
        }
        
        .view-doc-btn,
        .view-all-btn {
            padding: 4px 8px;
            font-size: 12px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .view-doc-btn:hover,
        .view-all-btn:hover {
            background-color: #45a049;
        }
    `;
    
    document.head.appendChild(style);
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
