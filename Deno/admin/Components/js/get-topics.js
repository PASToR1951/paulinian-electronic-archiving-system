const selectedTopics = new Set(); // Store selected topics
const topicColors = new Map(); // Store assigned colors for topics
const pendingTopics = new Set(); // Store pending topics that haven't been submitted yet

document.addEventListener("DOMContentLoaded", () => {
    const topicInput = document.getElementById("topicInput");
    const topicList = document.getElementById("topicList");
    const selectedTopicsContainer = document.getElementById("selectedTopics");
    let searchTimeout;

    if (!topicInput || !topicList) {
        console.error('Topic input or list elements not found');
        return;
    }

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
            topicList.innerHTML = "";
            topicList.style.display = "none";
            return;
        }

        topicList.innerHTML = "<div class='dropdown-item'>Searching...</div>";
        topicList.style.display = "block";

        try {
            const response = await fetch(`/api/topics?q=${encodeURIComponent(query)}`, {
                credentials: 'include'
            });
            const data = await response.json();

            topicList.innerHTML = ""; // Clear previous list

            if (!Array.isArray(data)) {
                console.error("Unexpected API response:", data);
                topicList.innerHTML = "<div class='dropdown-item text-danger'>Unexpected response</div>";
                return;
            }

            if (data.length === 0) {
                // If no topics found, show option to create new topic
                const addItem = document.createElement("div");
                addItem.classList.add("dropdown-item", "create-topic");
                addItem.innerHTML = `<span class="create-topic-text">Add: "${query}"</span>`;
                addItem.addEventListener("click", () => createNewTopic(query));
                topicList.appendChild(addItem);
            } else {
                // Display found topics
                data.forEach(topic => {
                    const topicItem = document.createElement("div");
                    topicItem.textContent = topic.topic_name;
                    topicItem.classList.add("dropdown-item");
                    topicItem.addEventListener("click", () => selectTopic(topic.topic_name));
                    topicList.appendChild(topicItem);
                });
                
                // Always add option to create new topic as the last item
                const createNewTopicItem = document.createElement("div");
                createNewTopicItem.classList.add("dropdown-item", "create-topic");
                createNewTopicItem.innerHTML = `<span class="create-topic-text">Add: "${query}"</span>`;
                createNewTopicItem.addEventListener("click", () => createNewTopic(query));
                topicList.appendChild(createNewTopicItem);
            }
        } catch (error) {
            console.error("Error fetching topics:", error);
            topicList.innerHTML = "<div class='dropdown-item text-danger'>Error fetching topics</div>";
        }
    };

    // Create debounced search function (400ms delay)
    const debouncedSearch = debounce(performSearch, 400);

    // Add input event listener with debounced search
    topicInput.addEventListener("input", function() {
        const query = this.value.trim();
        debouncedSearch(query);
    });

    // Close topic list when clicking outside
    document.addEventListener('click', function(e) {
        if (!topicInput.contains(e.target) && !topicList.contains(e.target)) {
            topicList.innerHTML = "";
            topicList.style.display = "none";
        }
    });

    // Make functions available globally
    window.selectTopic = function(topic) {
        if (!selectedTopics.has(topic)) {
            selectedTopics.add(topic);

            // Assign a random color if not already assigned
            if (!topicColors.has(topic)) {
                topicColors.set(topic, getRandomColor());
            }

            updateSelectedTopics();
        }
        topicInput.value = ""; // Clear input after selection
        topicList.innerHTML = ""; // Hide dropdown list
        topicList.style.display = "none";
    };

    window.createNewTopic = function(topicName) {
        if (!selectedTopics.has(topicName)) {
            selectedTopics.add(topicName);
            pendingTopics.add(topicName);
            topicColors.set(topicName, '#4CAF50'); // Green color for pending topics
            updateSelectedTopics();
        }
        topicInput.value = ""; // Clear input after selection
        topicList.innerHTML = ""; // Hide dropdown list
        topicList.style.display = "none";
    };

    function updateSelectedTopics() {
        selectedTopicsContainer.innerHTML = ""; // Clear previous selections

        selectedTopics.forEach(name => {
            const topicDiv = document.createElement("div");
            topicDiv.classList.add("selected-topic");
            if (pendingTopics.has(name)) {
                topicDiv.classList.add("pending-topic");
            }
            topicDiv.textContent = name;
            topicDiv.style.backgroundColor = topicColors.get(name); // Apply color

            // Add remove button
            const removeBtn = document.createElement("span");
            removeBtn.textContent = " ×";
            removeBtn.classList.add("remove-topic");
            removeBtn.addEventListener("click", () => {
                selectedTopics.delete(name);
                pendingTopics.delete(name);
                topicColors.delete(name);
                updateSelectedTopics();
            });

            topicDiv.appendChild(removeBtn);
            selectedTopicsContainer.appendChild(topicDiv);
            
            // Add hidden input for form submission
            const hiddenInput = document.createElement("input");
            hiddenInput.type = "hidden";
            hiddenInput.name = "topics[]";
            hiddenInput.value = name;
            selectedTopicsContainer.appendChild(hiddenInput);
        });
        
        // Also add a single JSON input for compatibility with backend
        const jsonInput = document.createElement("input");
        jsonInput.type = "hidden";
        jsonInput.name = "topics";
        jsonInput.value = JSON.stringify(Array.from(selectedTopics));
        selectedTopicsContainer.appendChild(jsonInput);
    }

    // Function to generate random pastel colors
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360); // Random hue
        return `hsl(${hue}, 70%, 80%)`; // Light pastel shades
    }
});
