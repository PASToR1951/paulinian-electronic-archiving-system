let searchTimeout;
const selectedTopics = new Set(); // Store selected topics
const topicColors = new Map(); // Store assigned colors for topics
const pendingTopics = new Set(); // Store pending topics that haven't been submitted yet

document.addEventListener("DOMContentLoaded", () => {
    const topicInput = document.getElementById("topicInput");
    const topicList = document.getElementById("topicList");
    const selectedTopicsContainer = document.getElementById("selectedTopics");
    
    // Initialize main research agenda search if elements exist
    if (topicInput && topicList && selectedTopicsContainer) {
        initializeResearchAgendaSearch(topicInput, topicList, selectedTopicsContainer);
    }
    
    // Also initialize for research agenda inputs in compiled document form
    const researchAgendaInputs = document.querySelectorAll('.research-agenda-input');
    researchAgendaInputs.forEach(input => {
        const parentDiv = input.closest('.relative');
        if (parentDiv) {
            const suggestions = parentDiv.querySelector('.topic-suggestions');
            const selectedContainer = parentDiv.querySelector('.selected-topics');
            
            if (suggestions && selectedContainer) {
                initializeResearchAgendaSearch(input, suggestions, selectedContainer);
            }
        }
    });
    
    // Add handler for adding new research sections
    const addSectionBtn = document.getElementById('add-research-section-btn');
    if (addSectionBtn) {
        addSectionBtn.addEventListener('click', () => {
            // Need setTimeout to wait for DOM to update after new section is added
            setTimeout(() => {
                const newInputs = document.querySelectorAll('.research-agenda-input:not(.initialized)');
                newInputs.forEach(input => {
                    const parentDiv = input.closest('.relative');
                    if (parentDiv) {
                        const suggestions = parentDiv.querySelector('.topic-suggestions');
                        const selectedContainer = parentDiv.querySelector('.selected-topics');
                        
                        if (suggestions && selectedContainer) {
                            initializeResearchAgendaSearch(input, suggestions, selectedContainer);
                            input.classList.add('initialized');
    }
                    }
                });
            }, 100);
        });
    }
    
    // Make addSingleTopic available globally
    window.addSingleTopic = addSingleTopic;
});

// Function to initialize research agenda search for a specific input
function initializeResearchAgendaSearch(inputElement, suggestionsElement, selectedContainer) {
    // Mark as initialized
    inputElement.classList.add('initialized');

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
            suggestionsElement.innerHTML = "";
            suggestionsElement.style.display = "none";
            return;
        }

        suggestionsElement.innerHTML = "<div class='topic-suggestion-item'>Searching...</div>";
        suggestionsElement.style.display = "block";

        try {
            // Use the keywords items search endpoint
            const response = await fetch(`/research-agenda-items/search?q=${encodeURIComponent(query)}`, {
                credentials: 'include'
            });
            
            // Log the raw response for debugging
            console.log("Keywords search raw response status:", response.status);
            
            const data = await response.json();
            console.log("Keywords search response data:", data);
            
            displayResearchAgendaResults(data, inputElement, suggestionsElement, selectedContainer);
        } catch (error) {
            console.error("Error fetching keywords:", error);
            suggestionsElement.innerHTML = "<div class='topic-suggestion-item text-danger'>Error fetching keywords</div>";
        }
    };

    // Create debounced search function (400ms delay)
    const debouncedSearch = debounce(performSearch, 400);

    // Add input event listener with debounced search
    inputElement.addEventListener("input", function() {
        const query = this.value.trim();
        debouncedSearch(query);
    });

    // Close topic list when clicking outside
    document.addEventListener('click', function(e) {
        if (!inputElement.contains(e.target) && !suggestionsElement.contains(e.target)) {
            suggestionsElement.innerHTML = "";
            suggestionsElement.style.display = "none";
        }
    });
}

// Display research agenda search results
function displayResearchAgendaResults(data, inputElement, suggestionsElement, selectedContainer) {
    suggestionsElement.innerHTML = ""; // Clear previous list
    suggestionsElement.style.display = "block"; // Make sure dropdown is visible
    
    console.log("Displaying research agenda results, data is array?", Array.isArray(data));
    
    if (!Array.isArray(data)) {
        console.error("Unexpected API response:", data);
        suggestionsElement.innerHTML = "<div class='topic-suggestion-item text-danger'>Unexpected response</div>";
        return;
    }
    
    console.log("Number of research agenda items found:", data.length);
    
    if (data.length === 0) {
        // If no items found, show option to create new one
        const addItem = document.createElement("div");
        addItem.classList.add("topic-suggestion-item", "create-topic");
        addItem.innerHTML = `<span class="create-topic-text">Add: "${inputElement.value.trim()}"</span>`;
        addItem.addEventListener("click", () => {
            addSingleTopic(inputElement.value.trim(), selectedContainer);
        });
        suggestionsElement.appendChild(addItem);
    } else {
        // Display found topics
        data.forEach((topic, index) => {
            console.log(`Topic ${index}:`, topic);
            
            // Check if the topic has the necessary properties
            if (!topic || typeof topic !== 'object') {
                console.error(`Invalid topic data at index ${index}:`, topic);
                return;
            }
            
            const topicName = topic.name || "Unknown Topic";
            console.log(`Topic ${index} name:`, topicName);
            
            const topicItem = document.createElement("div");
            topicItem.textContent = topicName;
            topicItem.classList.add("topic-suggestion-item");
            // Add some styling to make sure it's visible
            topicItem.style.padding = "8px 12px";
            topicItem.style.cursor = "pointer";
            topicItem.style.backgroundColor = "#fff";
            topicItem.style.color = "#333";
            
            topicItem.addEventListener("click", () => {
                addSingleTopic(topicName, selectedContainer);
                inputElement.value = "";
                suggestionsElement.innerHTML = "";
                suggestionsElement.style.display = "none";
            });
            suggestionsElement.appendChild(topicItem);
        });
        
        // Log the first topic to help debug
        if (data.length > 0) {
            console.log("First topic full object:", data[0]);
            console.log("First topic fields:", Object.keys(data[0]));
        }
        
        // Always add option to create new topic as the last item
        const createNewTopicItem = document.createElement("div");
        createNewTopicItem.classList.add("topic-suggestion-item", "create-topic");
        createNewTopicItem.innerHTML = `<span class="create-topic-text">Add: "${inputElement.value.trim()}"</span>`;
        createNewTopicItem.addEventListener("click", () => {
            addSingleTopic(inputElement.value.trim(), selectedContainer);
            inputElement.value = "";
            suggestionsElement.innerHTML = "";
            suggestionsElement.style.display = "none";
        });
        suggestionsElement.appendChild(createNewTopicItem);
    }
}

// Function to add a single topic
async function addSingleTopic(topicName, selectedContainer) {
    if (!selectedContainer) return;
    
    try {
        // First create the topic via API if it's new
        const response = await fetch('/research-agenda-items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: topicName,
                description: '' // Optional description
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            console.error('Error creating research agenda item:', result);
            // If there was an error but it's because the item already exists,
            // we can still add it to the selected topics
            if (!result.error || !result.error.includes("already exists")) {
                return;
            }
        }
        
        console.log('Topic creation result:', result);
        
        // Only add if not already selected in this container
        const topicsInContainer = new Set();
        selectedContainer.querySelectorAll('.selected-topic').forEach(topic => {
            topicsInContainer.add(topic.textContent.replace(' ×', ''));
        });
        
        if (!topicsInContainer.has(topicName)) {
            // Create the topic element
            const topicDiv = document.createElement("div");
            topicDiv.classList.add("selected-topic");
            topicDiv.textContent = topicName;
            topicDiv.style.backgroundColor = getRandomColor();

            // Add remove button
            const removeBtn = document.createElement("span");
            removeBtn.textContent = " ×";
            removeBtn.classList.add("remove-topic");
            removeBtn.addEventListener("click", () => {
                topicDiv.remove();
                
                // Update hidden input if it exists
                const hiddenInput = selectedContainer.querySelector('input[type="hidden"][name="topics"]');
                if (hiddenInput) {
                    const topics = Array.from(selectedContainer.querySelectorAll('.selected-topic'))
                        .map(topic => topic.textContent.replace(' ×', ''));
                    hiddenInput.value = JSON.stringify(topics);
                }
            });

            topicDiv.appendChild(removeBtn);
            selectedContainer.appendChild(topicDiv);
            
            // Create or update hidden input for form submission
            let hiddenInput = selectedContainer.querySelector('input[type="hidden"][name="topics"]');
            if (!hiddenInput) {
                hiddenInput = document.createElement("input");
            hiddenInput.type = "hidden";
                hiddenInput.name = "topics";
                selectedContainer.appendChild(hiddenInput);
            }
            
            const topics = Array.from(selectedContainer.querySelectorAll('.selected-topic'))
                .map(topic => topic.textContent.replace(' ×', ''));
            hiddenInput.value = JSON.stringify(topics);
        }
        
        // Find and clear the input field
        const parentDiv = selectedContainer.closest('.relative');
        if (parentDiv) {
            const inputField = parentDiv.querySelector('input[type="text"]');
            if (inputField) {
                inputField.value = '';
                
                // Also hide the suggestions dropdown
                const suggestionsDiv = parentDiv.querySelector('.topic-suggestions');
                if (suggestionsDiv) {
                    suggestionsDiv.innerHTML = '';
                    suggestionsDiv.style.display = 'none';
                }
            }
        }
        
    } catch (error) {
        console.error('Error creating topic:', error);
    }
    }

    // Function to generate random pastel colors
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360); // Random hue
        return `hsl(${hue}, 70%, 80%)`; // Light pastel shades
    }

// Function to create multiple research agenda items at once
window.createMultipleTopics = async function(topicNames, container) {
    if (!Array.isArray(topicNames) || topicNames.length === 0) {
        console.error('No topics to create');
        return { created: [], errors: [] };
    }
    
    try {
        // Prepare data for batch creation
        const topicsToCreate = topicNames.map(name => ({
            name: name.trim(),
            description: '' // Optional description
        }));
        
        console.log(`Attempting to create ${topicsToCreate.length} research agenda items in batch`);
        
        // Call the batch creation API
        const response = await fetch('/research-agenda-items/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(topicsToCreate)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('Batch creation result:', result);
            
            // Add successfully created topics to the selected container
            if (result.created && Array.isArray(result.created) && container) {
                result.created.forEach(topic => {
                    if (topic.name) {
                        addSingleTopic(topic.name, container);
                    }
                });
            }
            
            return result;
        } else {
            console.error('Error in batch creation:', result);
            return { created: [], errors: result.error ? [{ error: result.error }] : [] };
        }
    } catch (error) {
        console.error('Error creating multiple research agenda items:', error);
        return { 
            created: [], 
            errors: [{ error: error.message || 'Unknown error during batch creation' }] 
        };
    }
};
