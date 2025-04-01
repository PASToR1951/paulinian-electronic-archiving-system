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

        categories.forEach(category => {
            // Find existing category element using data-category attribute
            const categoryElement = document.querySelector(`.category[data-category="${category.category_name}"]`);

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
        
        // Add direct click handler for confluence category specifically
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
        
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}

// Filter documents by category - making it globally accessible
window.filterByCategory = function(categoryName) {
    console.log(`Filtering by category: ${categoryName}`);
    
    // Set a small delay to ensure we don't have race conditions
    setTimeout(() => {
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
                console.log(`Checking category element: "${catName}" against "${categoryName}"`);
                
                if (catName === categoryName) {
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
    }, 10);
    
    return false; // Prevent default action
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
        // Add category filter to URL if active
        let url = `/api/documents?page=${page}&size=${pageSize}`;
        if (currentCategoryFilter) {
            url += `&category=${encodeURIComponent(currentCategoryFilter)}`;
            console.log(`Loading documents with filter URL: ${url}`);
        } else {
            console.log(`Loading all documents: ${url}`);
        }
        
        // Log the API request
        console.log(`Fetching documents from: ${url}`);
        
        // Ensure the table container has proper width constraints
        // All styling is now in CSS file
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Log the response data
        console.log(`Received ${Array.isArray(data) ? data.length : 0} documents`);
        
        // Debug: Log each document and its category
        if (Array.isArray(data) && data.length > 0) {
            console.log('Documents received:');
            data.forEach(doc => {
                console.log(`Document "${doc.title}" has category: ${doc.category_name}`);
            });
        }
        
        // Make sure we have a proper array of documents
        let documents = Array.isArray(data) ? data : [];
        
        // ALWAYS apply client-side filtering if a category filter is active
        // This ensures consistent behavior across all categories
        if (currentCategoryFilter && documents.length > 0) {
            console.log(`Applying strict client-side filter for "${currentCategoryFilter}"`);
            const unfiltered = documents.length;
            
            // Add debug log of all available documents and their categories
            console.log("Available documents and their categories:");
            documents.forEach(doc => {
                console.log(`- ${doc.title}: "${doc.category_name}"`);
            });
            
            // Filter the documents on the client side with strict category matching only
            documents = documents.filter(doc => {
                // Skip documents without category
                if (!doc.category_name) {
                    console.log(`Document "${doc.title}" has no category, excluding`);
                    return false;
                }
                
                // Normalize category names for comparison - STRICT EXACT MATCH ONLY
                const docCategory = doc.category_name.toLowerCase().trim();
                const filterCategory = currentCategoryFilter.toLowerCase().trim();
                
                // Only use exact matching - no partial matches
                const matches = docCategory === filterCategory;
                
                console.log(`Document "${doc.title}" - category "${docCategory}" - ${matches ? 'MATCHES' : 'does NOT match'} filter "${filterCategory}"`);
                
                return matches;
            });
            
            console.log(`Client-side filtering: ${unfiltered} → ${documents.length} documents`);
        }
        
        // Get the tbody element before using it
        const tbody = document.querySelector("#docs-table tbody");
        tbody.innerHTML = ""; // Clear existing data

        // Update filter indicator if a filter is active
        const filterIndicator = document.querySelector("#filter-indicator") || document.createElement("div");
        filterIndicator.id = "filter-indicator";
        
        if (currentCategoryFilter) {
            filterIndicator.innerHTML = `
                <div class="filter-badge">
                    Filtered by: ${currentCategoryFilter}
                    <button id="clear-filter">✕</button>
                </div>
            `;
            const tableContainer = document.querySelector("#docs-table").parentNode;
            if (!document.querySelector("#filter-indicator")) {
                tableContainer.insertBefore(filterIndicator, document.querySelector("#docs-table"));
            }
            
            // Add event listener to clear filter button
            setTimeout(() => {
                const clearBtn = document.querySelector("#clear-filter");
                if (clearBtn) {
                    clearBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        filterByCategory(currentCategoryFilter); // This will toggle it off
                    });
                }
            }, 0);
        } else {
            filterIndicator.remove();
        }

        if (documents.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-message">No documents available${currentCategoryFilter ? ' for category ' + currentCategoryFilter : ''}</td></tr>`;
            return;
        }

        documents.forEach(doc => {
            const row = document.createElement("tr");
            row.className = "document-card";
            
            // Get the appropriate category icon based on the document's category
            const categoryIcon = getCategoryIcon(doc.category_name);
            
            // Create document info cell
            const iconCell = document.createElement("td");
            iconCell.className = "doc-icon";
            iconCell.innerHTML = `<img src="${categoryIcon}" alt="${doc.category_name} Icon">`;
            
            // Create document info cell
            const infoCell = document.createElement("td");
            infoCell.className = "doc-info";
            
            // Handle different author data formats
            let authorDisplay = '';
            
            // Debug author information
            console.log(`Author info for "${doc.title}":`, doc.author_names);
            
            if (doc.author_names && Array.isArray(doc.author_names) && doc.author_names.length > 0) {
                authorDisplay = doc.author_names.join(', ');
            } else if (doc.author_name) {
                authorDisplay = doc.author_name;
            } else if (doc.author) {
                authorDisplay = doc.author;
            } else if (doc.authors && Array.isArray(doc.authors)) {
                authorDisplay = doc.authors.join(', ');
            } else if (typeof doc.authors === 'string') {
                authorDisplay = doc.authors;
            } else if (doc.contributor) {
                authorDisplay = doc.contributor;
            } else if (doc.contributors && Array.isArray(doc.contributors)) {
                authorDisplay = doc.contributors.join(', ');
            } else if (doc.created_by) {
                authorDisplay = doc.created_by;
            } else {
                // If author_names exists but is empty, add author placeholder
                authorDisplay = 'No Author Listed';
            }
            
            // Prepare the document header with conditional separators
            let headerContent = `<span class="doc-title">${doc.title || 'Untitled'}</span>`;
            
            // Always include author section, with appropriate text
            headerContent += ` | <span class="doc-author">${authorDisplay}</span>`;
            
            if (doc.publication_date) {
                headerContent += ` | <span class="doc-year">${new Date(doc.publication_date).getFullYear()}</span>`;
            }
            
            infoCell.innerHTML = `
                <div class="doc-header">
                    ${headerContent}
                </div>
                <div class="doc-tags">
                    <span class="tag document-type">${doc.category_name || 'Uncategorized'}</span>
                    ${doc.topics && doc.topics.length > 0 ? 
                        ` <span class="tag topic">${doc.topics[0]}</span>` +
                        (doc.topics.length > 1 ? doc.topics.slice(1).map(topic => 
                            `<span class="tag topic">${topic}</span>`).join('') : '')
                        : ''}
                </div>
            `;
            
            // Create actions cell
            const actionsCell = document.createElement("td");
            actionsCell.className = "actions";
            actionsCell.innerHTML = `
                <a href="#" class="edit-icon" title="Edit Document">
                    <i class="fas fa-edit" aria-hidden="true">✏️</i> Edit
                </a>
                <a href="#" class="delete-icon" title="Delete Document">
                    <i class="fas fa-trash-alt" aria-hidden="true">🗑️</i> Delete
                </a>
            `;
            
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
        'Confluence': '/admin/Components/icons/Category-icons/confluence.png',
        'Dissertation': '/admin/Components/icons/Category-icons/dissertation.png',
        'Thesis': '/admin/Components/icons/Category-icons/thesis.png'
    };
    
    // Check if the category exists in our map
    if (iconMap[categoryName]) {
        return iconMap[categoryName];
    }
    
    // Use a more reliable fallback - the Confluence icon as default
    return '/admin/Components/icons/Category-icons/confluence.png';
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
