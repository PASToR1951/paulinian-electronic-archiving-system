const selectedTopics = new Set(); // Store selected topics
const topicColors = new Map(); // Store assigned colors for topics

document.addEventListener("DOMContentLoaded", () => {
    const topicInput = document.getElementById("topicInput");
    const topicList = document.getElementById("topicList");
    const selectedTopicsContainer = document.getElementById("selectedTopics");
    let searchTimeout;

    if (!topicInput || !topicList) {
        console.error('Topic input or list elements not found');
        return;
    }

    topicInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);

        const query = topicInput.value.trim();
        if (query.length === 0) {
            topicList.innerHTML = "";
            return;
        }

        topicList.innerHTML = "<div class='dropdown-item'>Searching...</div>";

        searchTimeout = setTimeout(async () => {
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
                    topicList.innerHTML = `
                        <div class='dropdown-item' onclick="createNewTopic('${query}')">
                            Create new topic: "${query}"
                        </div>`;
                } else {
                    data.forEach(topic => {
                        const topicItem = document.createElement("div");
                        topicItem.textContent = topic.topic_name;
                        topicItem.classList.add("dropdown-item");
                        topicItem.addEventListener("click", () => selectTopic(topic.topic_name));
                        topicList.appendChild(topicItem);
                    });
                }
            } catch (error) {
                console.error("Error fetching topics:", error);
                topicList.innerHTML = "<div class='dropdown-item text-danger'>Error fetching topics</div>";
            }
        }, 300);
    });

    // Close topic list when clicking outside
    document.addEventListener('click', function(e) {
        if (!topicInput.contains(e.target) && !topicList.contains(e.target)) {
            topicList.innerHTML = "";
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
    };

    window.createNewTopic = async function(topicName) {
        try {
            const response = await fetch('/api/topics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic_name: topicName }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to create topic');
            }

            const newTopic = await response.json();
            selectTopic(newTopic.topic_name);
        } catch (error) {
            console.error('Error creating topic:', error);
            topicList.innerHTML = "<div class='dropdown-item text-danger'>Error creating topic</div>";
        }
    };

    function updateSelectedTopics() {
        selectedTopicsContainer.innerHTML = ""; // Clear previous selections

        selectedTopics.forEach(name => {
            const topicDiv = document.createElement("div");
            topicDiv.classList.add("selected-topic");
            topicDiv.textContent = name;
            topicDiv.style.backgroundColor = topicColors.get(name); // Apply color

            // Add remove button
            const removeBtn = document.createElement("span");
            removeBtn.textContent = " ×";
            removeBtn.classList.add("remove-topic");
            removeBtn.addEventListener("click", () => {
                selectedTopics.delete(name);
                topicColors.delete(name);
                updateSelectedTopics();
            });

            topicDiv.appendChild(removeBtn);
            selectedTopicsContainer.appendChild(topicDiv);
        });
    }

    // Function to generate random pastel colors
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360); // Random hue
        return `hsl(${hue}, 70%, 80%)`; // Light pastel shades
    }
});
