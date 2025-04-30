/**
 * Enhanced Author Search JavaScript - Provides autocomplete functionality for author fields
 * with improved styling, loading indicators, and error handling
 */

// Expose the initialization function globally to be used by multiple forms
window.initAuthorSearchInput = function(inputElement) {
    initAuthorSearch(inputElement);
};

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Test function to check if the author API is working
async function testAuthorApi() {
    try {
        console.log("Testing author API...");
        const response = await fetch("/api/authors/test");
        console.log("Test API status:", response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log("Test API response:", data);
            return true;
        } else {
            console.error("Test API failed with status:", response.status);
            return false;
        }
    } catch (error) {
        console.error("Error testing author API:", error);
        return false;
    }
}

// Initialize author search functionality for a specific input field
function initAuthorSearch(inputElement, options = {}) {
    if (!inputElement) return;
    
    // Run the API test when initializing
    testAuthorApi().then(isApiWorking => {
        console.log("Author API working:", isApiWorking);
    });
    
    const {
        minChars = 2,
        debounceTime = 300,
        maxSuggestions = 5,
        onSelect = () => {}
    } = options;
    
    // Create and append CSS styles for the suggestions
    if (!document.getElementById('author-search-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'author-search-styles';
        styleElement.textContent = `
            .author-suggestions {
                position: absolute;
                z-index: 1000;
                background-color: white;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                width: 100%;
                max-height: 250px;
                overflow-y: auto;
                margin-top: 2px;
            }
            .author-suggestion-item {
                padding: 10px 16px;
                cursor: pointer;
                transition: background-color 0.2s;
                border-bottom: 1px solid #f0f0f0;
            }
            .author-suggestion-item:last-child {
                border-bottom: none;
            }
            .author-suggestion-item:hover {
                background-color: #f7fafc;
            }
            .author-suggestion-item.active {
                background-color: #edf2f7;
            }
            .author-suggestion-item.loading {
                display: flex;
                align-items: center;
                color: #718096;
                font-style: italic;
            }
            .author-suggestion-item.error {
                color: #e53e3e;
            }
            .author-suggestion-item.no-results {
                color: #718096;
                font-style: italic;
            }
            .spinner {
                border: 2px solid #f3f3f3;
                border-top: 2px solid #10B981;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                animation: spin 1s linear infinite;
                margin-right: 10px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .author-suggestion-item .name {
                font-weight: 500;
            }
            .author-suggestion-item .affiliation {
                font-size: 0.85em;
                color: #718096;
                margin-top: 2px;
            }
            .author-highlight {
                position: relative;
            }
            .author-highlight::after {
                content: '';
                position: absolute;
                right: 12px;
                top: 12px;
                width: 24px;
                height: 24px;
                background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2310B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
                background-repeat: no-repeat;
                opacity: 0;
                transition: opacity 0.2s;
            }
            .author-suggestion-item:hover .author-highlight::after {
                opacity: 1;
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    // Create suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'author-suggestions';
    suggestionsContainer.style.display = 'none';
    
    // Insert suggestions container after input
    inputElement.parentNode.style.position = 'relative';
    inputElement.parentNode.insertBefore(suggestionsContainer, inputElement.nextSibling);
    
    // Track search state
    let searchActive = false;
    
    // Search for authors as user types
    const searchAuthors = debounce(async (query) => {
        // Skip search if query is too short
        if (query.length < minChars) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        // Set search as active
        searchActive = true;
        
        // Show loading indicator
        suggestionsContainer.innerHTML = '';
        const loadingItem = document.createElement('div');
        loadingItem.className = 'author-suggestion-item loading';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        
        loadingItem.appendChild(spinner);
        loadingItem.appendChild(document.createTextNode('Searching...'));
        suggestionsContainer.appendChild(loadingItem);
        suggestionsContainer.style.display = 'block';
        
        try {
            console.log("Searching for authors with query:", query);
            
            // Updated to handle potential errors and ensure the UI reflects the current state
            const response = await fetch(`/authors/search?q=${encodeURIComponent(query)}`);
            
            console.log("Author search response status:", response.status);
            
            // Check if search is still relevant (user hasn't started a new search)
            if (!searchActive) return;
            
            if (!response.ok) {
                throw new Error(`Author search failed with status: ${response.status}`);
            }
            
            // Parse JSON response from database
            const responseText = await response.text();
            console.log("Raw response:", responseText);
            
            let authors = [];
            try {
                authors = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Error parsing JSON response:", parseError);
                throw new Error("Invalid response format from server");
            }
            
            console.log("Authors found:", authors.length);
            
            // Clear previous suggestions
            suggestionsContainer.innerHTML = '';
            
            if (authors.length === 0) {
                const noResultsItem = document.createElement('div');
                noResultsItem.className = 'author-suggestion-item no-results';
                
                // Create container for the message and create button
                const messageContainer = document.createElement('div');
                messageContainer.style.display = 'flex';
                messageContainer.style.justifyContent = 'space-between';
                messageContainer.style.alignItems = 'center';
                
                const messageText = document.createElement('span');
                messageText.textContent = 'No authors found';
                messageContainer.appendChild(messageText);
                
                // Add a "Create Author" button
                const createBtn = document.createElement('button');
                createBtn.textContent = 'Create New';
                createBtn.style.padding = '4px 8px';
                createBtn.style.backgroundColor = '#10B981';
                createBtn.style.color = 'white';
                createBtn.style.border = 'none';
                createBtn.style.borderRadius = '4px';
                createBtn.style.cursor = 'pointer';
                
                createBtn.addEventListener('click', () => {
                    createNewAuthor(query.trim());
                });
                
                messageContainer.appendChild(createBtn);
                noResultsItem.appendChild(messageContainer);
                
                suggestionsContainer.appendChild(noResultsItem);
                return;
            }
            
            // Display suggestions
            authors.slice(0, maxSuggestions).forEach(author => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'author-suggestion-item';
                
                const highlightContainer = document.createElement('div');
                highlightContainer.className = 'author-highlight';
                
                const nameElement = document.createElement('div');
                nameElement.className = 'name';
                nameElement.textContent = author.full_name;
                highlightContainer.appendChild(nameElement);
                
                if (author.affiliation || author.department) {
                    const affiliationElement = document.createElement('div');
                    affiliationElement.className = 'affiliation';
                    affiliationElement.textContent = [
                        author.affiliation || '',
                        author.department || ''
                    ].filter(Boolean).join(' | ');
                    highlightContainer.appendChild(affiliationElement);
                }
                
                suggestionItem.appendChild(highlightContainer);
                
                // Add event listeners
                suggestionItem.addEventListener('mouseover', () => {
                    clearActiveItems();
                    suggestionItem.classList.add('active');
                });
                
                suggestionItem.addEventListener('click', () => {
                    selectAuthor(author);
                });
                
                suggestionsContainer.appendChild(suggestionItem);
            });
            
        } catch (error) {
            console.error('Error searching authors:', error);
            
            // Check if search is still relevant before updating UI
            if (!searchActive) return;
            
            // Show error message
            suggestionsContainer.innerHTML = '';
            const errorItem = document.createElement('div');
            errorItem.className = 'author-suggestion-item error';
            errorItem.textContent = 'Error connecting to database. Please try again later.';
            suggestionsContainer.appendChild(errorItem);
        } finally {
            searchActive = false;
        }
    }, debounceTime);
    
    // Helper function to clear active items
    function clearActiveItems() {
        const items = suggestionsContainer.querySelectorAll('.author-suggestion-item');
        items.forEach(item => item.classList.remove('active'));
    }
    
    // Helper function to select an author
    function selectAuthor(author) {
        // Get existing authors
        const currentVal = inputElement.value;
        const authors = currentVal.split(';').map(a => a.trim()).filter(a => a !== '');
        
        // Remove the last incomplete entry if any
        if (authors.length > 0 && !currentVal.trim().endsWith(';')) {
            authors.pop();
        }
        
        // Add the selected author
        authors.push(author.full_name);
        
        // Update input value
        inputElement.value = authors.join('; ') + '; ';
        
        // Hide suggestions
        suggestionsContainer.style.display = 'none';
        
        // Focus input and move cursor to end
        inputElement.focus();
        
        // Call onSelect callback
        onSelect(author);
    }
    
    // Add input event listener
    inputElement.addEventListener('input', (e) => {
        const value = e.target.value;
        
        // Reset search active flag when input changes
        searchActive = false;
        
        // Find the last partial author name (after the last semicolon)
        const lastAuthorName = value.split(';').pop().trim();
        
        // Search for authors if the last part is not empty
        if (lastAuthorName) {
            searchAuthors(lastAuthorName);
        } else {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Add focus event to show suggestions again if there's a query
    inputElement.addEventListener('focus', () => {
        const value = inputElement.value;
        const lastAuthorName = value.split(';').pop().trim();
        
        if (lastAuthorName && lastAuthorName.length >= minChars) {
            searchAuthors(lastAuthorName);
        }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!inputElement.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Handle keyboard navigation
    inputElement.addEventListener('keydown', (e) => {
        if (suggestionsContainer.style.display === 'none') return;
        
        const items = Array.from(suggestionsContainer.querySelectorAll('.author-suggestion-item:not(.loading):not(.error):not(.no-results)'));
        if (items.length === 0) return;
        
        const activeItem = suggestionsContainer.querySelector('.author-suggestion-item.active');
        let activeIndex = -1;
        
        if (activeItem) {
            activeIndex = items.indexOf(activeItem);
        }
        
        // Down arrow
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            clearActiveItems();
            
            if (activeIndex < items.length - 1) {
                items[activeIndex + 1].classList.add('active');
                ensureVisible(items[activeIndex + 1], suggestionsContainer);
            } else {
                // Wrap to first item
                items[0].classList.add('active');
                ensureVisible(items[0], suggestionsContainer);
            }
        }
        
        // Up arrow
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            clearActiveItems();
            
            if (activeIndex > 0) {
                items[activeIndex - 1].classList.add('active');
                ensureVisible(items[activeIndex - 1], suggestionsContainer);
            } else {
                // Wrap to last item
                items[items.length - 1].classList.add('active');
                ensureVisible(items[items.length - 1], suggestionsContainer);
            }
        }
        
        // Enter key
        else if (e.key === 'Enter') {
            e.preventDefault();
            const currentActive = suggestionsContainer.querySelector('.author-suggestion-item.active');
            if (currentActive) {
                currentActive.click();
            }
        }
        
        // Escape key
        else if (e.key === 'Escape') {
            e.preventDefault();
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Helper function to ensure an element is visible in scrollable container
    function ensureVisible(element, container) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        
        const elementTop = element.offsetTop;
        const elementBottom = elementTop + element.clientHeight;
        
        if (elementTop < containerTop) {
            container.scrollTop = elementTop;
        } else if (elementBottom > containerBottom) {
            container.scrollTop = elementBottom - container.clientHeight;
        }
    }
    
    // Add function to create a new author
    async function createNewAuthor(name) {
        try {
            // Show loading indicator
            suggestionsContainer.innerHTML = '';
            const loadingItem = document.createElement('div');
            loadingItem.className = 'author-suggestion-item loading';
            
            const spinner = document.createElement('div');
            spinner.className = 'spinner';
            
            loadingItem.appendChild(spinner);
            loadingItem.appendChild(document.createTextNode('Creating author...'));
            suggestionsContainer.appendChild(loadingItem);
            
            // Call API to create new author
            const response = await fetch('/authors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    full_name: name
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to create author: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Author created:', data);
            
            // Select the newly created author
            if (data.author) {
                selectAuthor(data.author);
            } else {
                // Show error
                suggestionsContainer.innerHTML = '';
                const errorItem = document.createElement('div');
                errorItem.className = 'author-suggestion-item error';
                errorItem.textContent = 'Error creating author';
                suggestionsContainer.appendChild(errorItem);
            }
        } catch (error) {
            console.error('Error creating author:', error);
            
            // Show error message
            suggestionsContainer.innerHTML = '';
            const errorItem = document.createElement('div');
            errorItem.className = 'author-suggestion-item error';
            errorItem.textContent = 'Error creating author. Please try again later.';
            suggestionsContainer.appendChild(errorItem);
        }
    }
    
    return {
        destroy: () => {
            inputElement.removeEventListener('input', searchAuthors);
            inputElement.removeEventListener('focus', searchAuthors);
            suggestionsContainer.remove();
        }
    };
}

// Export functions
window.authorSearch = {
    init: initAuthorSearch
};

// Initialize all author search inputs when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing author search inputs...');
    
    // Initialize for single document form
    const singleAuthorInput = document.getElementById('single-author');
    if (singleAuthorInput) {
        initAuthorSearch(singleAuthorInput);
    }
    
    // Initialize for all research section author inputs
    document.querySelectorAll('.author-search-input').forEach(input => {
        initAuthorSearch(input);
    });
    
    console.log('Author search initialization complete.');
}); 