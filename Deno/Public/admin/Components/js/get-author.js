let searchTimeout;
const selectedAuthors = new Set(); // Store selected authors
const authorColors = new Map(); // Store assigned colors

document.addEventListener("DOMContentLoaded", () => {
    const authorInput = document.getElementById("authorInput");
    const authorList = document.getElementById("authorList");
    const selectedAuthorsContainer = document.getElementById("selectedAuthors");

    if (!authorInput || !authorList) return;

    // Debounce function for search
    const debounce = (func, delay) => {
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    };

    // Actual search function
    const performSearch = async (query) => {
        if (query.length === 0) {
            authorList.innerHTML = "";
            authorList.style.display = "none";
            return;
        }

        authorList.innerHTML = "<div class='dropdown-item'>Searching...</div>";
        authorList.style.display = "block";

        try {
            const response = await fetch(`/api/authors?q=${encodeURIComponent(query)}`, {
                credentials: 'include'
            });
            
            // Log the raw response for debugging
            console.log("Author search raw response status:", response.status);
            
            const data = await response.json();
            console.log("Author search response data:", data);
            
            displaySingleAuthorResults(data);
        } catch (error) {
            console.error("Error fetching authors:", error);
            authorList.innerHTML = "<div class='dropdown-item text-danger'>Error fetching authors</div>";
        }
    };

    // Create debounced search function (400ms delay)
    const debouncedSearch = debounce(performSearch, 400);

    // Add input event listener with debounced search
    authorInput.addEventListener("input", function() {
        const query = this.value.trim();
        debouncedSearch(query);
    });

    // Close author list when clicking outside (single document)
    document.addEventListener('click', function(e) {
        if (!authorInput.contains(e.target) && !authorList.contains(e.target)) {
            authorList.innerHTML = "";
            authorList.style.display = "none";
        }
    });

    function displaySingleAuthorResults(data) {
        authorList.innerHTML = ""; // Clear previous list
        authorList.style.display = "block"; // Make sure dropdown is visible
        
        console.log("Displaying author results, data is array?", Array.isArray(data));
        
        if (!Array.isArray(data)) {
            console.error("Unexpected API response:", data);
            authorList.innerHTML = "<div class='dropdown-item text-danger'>Unexpected response</div>";
            return;
        }
        
        console.log("Number of authors found:", data.length);
        
        if (data.length === 0) {
            // If no authors found, show option to create new author
            const addItem = document.createElement("div");
            addItem.classList.add("dropdown-item", "create-author");
            addItem.innerHTML = `<span class="create-author-text">Add: "${authorInput.value.trim()}"</span>`;
            addItem.addEventListener("click", () => {
                addSingleAuthor(authorInput.value.trim());
            });
            authorList.appendChild(addItem);
        } else {
            // Display found authors
            data.forEach((author, index) => {
                console.log(`Author ${index}:`, author);
                
                // Check if the author has the necessary properties
                if (!author || typeof author !== 'object') {
                    console.error(`Invalid author data at index ${index}:`, author);
                    return;
                }
                
                const authorName = author.full_name || author.name || author.author_name || "Unknown Author";
                console.log(`Author ${index} name:`, authorName);
                
                const authorItem = document.createElement("div");
                authorItem.textContent = authorName;
                authorItem.classList.add("dropdown-item");
                // Add some styling to make sure it's visible
                authorItem.style.padding = "8px 12px";
                authorItem.style.cursor = "pointer";
                authorItem.style.backgroundColor = "#fff";
                authorItem.style.color = "#333";
                
                authorItem.addEventListener("click", () => {
                    addSingleAuthor(authorName);
                });
                authorList.appendChild(authorItem);
            });
            
            // Log the first author to help debug
            if (data.length > 0) {
                console.log("First author full object:", data[0]);
                console.log("First author fields:", Object.keys(data[0]));
            }
            
            // Always add option to create new author as the last item
            const createNewAuthorItem = document.createElement("div");
            createNewAuthorItem.classList.add("dropdown-item", "create-author");
            createNewAuthorItem.innerHTML = `<span class="create-author-text">Add: "${authorInput.value.trim()}"</span>`;
            createNewAuthorItem.addEventListener("click", () => {
                addSingleAuthor(authorInput.value.trim());
            });
            authorList.appendChild(createNewAuthorItem);
        }
    }

    function addSingleAuthor(authorName) {
        if (!selectedAuthorsContainer) return;
        
        // Get existing authors
        const selectedAuthors = [];
        selectedAuthorsContainer.querySelectorAll('.selected-author').forEach(el => {
            selectedAuthors.push(el.textContent.replace(' ×', ''));
        });
        
        // Only add if not already selected
        if (!selectedAuthors.includes(authorName)) {
            const authorDiv = document.createElement("div");
            authorDiv.classList.add("selected-author");
            authorDiv.textContent = authorName;
            
            // Add remove button
            const removeBtn = document.createElement("span");
            removeBtn.textContent = " ×";
            removeBtn.classList.add("remove-author");
            removeBtn.addEventListener("click", () => {
                authorDiv.remove();
                
                // Find and remove hidden input
                const inputs = document.querySelectorAll('input[type="hidden"][name="author"]');
                if (inputs.length > 0) {
                    // Get current JSON, remove author, update input
                    try {
                        const inputValue = inputs[0].value;
                        let authors = JSON.parse(inputValue);
                        authors = authors.filter(a => a !== authorName);
                        inputs[0].value = JSON.stringify(authors);
                    } catch (e) {
                        console.error('Error updating authors:', e);
                    }
                }
            });
            
            authorDiv.appendChild(removeBtn);
            selectedAuthorsContainer.appendChild(authorDiv);
            
            // Handle the hidden input field
            // The single document form expects a JSON string in a single input field
            const existingInput = document.querySelector('input[type="hidden"][name="author"]');
            if (existingInput) {
                try {
                    const currentValue = existingInput.value;
                    let authors = currentValue ? JSON.parse(currentValue) : [];
                    authors.push(authorName);
                    existingInput.value = JSON.stringify(authors);
                } catch (e) {
                    console.error('Error updating authors input:', e);
                    existingInput.value = JSON.stringify([authorName]);
                }
            } else {
                // Create new input if it doesn't exist
                const hiddenInput = document.createElement("input");
                hiddenInput.type = "hidden";
                hiddenInput.name = "author";
                hiddenInput.value = JSON.stringify([authorName]);
                selectedAuthorsContainer.appendChild(hiddenInput);
            }
        }
        
        // Clear input and dropdown
        if (authorInput) {
            authorInput.value = "";
            authorList.innerHTML = "";
            authorList.style.display = "none";
        }
    }

    // Function to generate random pastel colors
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360); // Random hue
        return `hsl(${hue}, 70%, 80%)`; // Light pastel shades
    }
});
