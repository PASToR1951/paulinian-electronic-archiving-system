document.addEventListener("DOMContentLoaded", () => {
    setupTopicSelection();
});

function setupTopicSelection() {
    const topicInput = document.getElementById("topicInput");
    const topicList = document.getElementById("topicList");
    const selectedTopicsContainer = document.getElementById("selectedTopics");
    let searchTimeout;
    let selectedTopics = new Set();
    let lastQuery = "";

    topicInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        const query = topicInput.value.trim();

        if (query.length === 0) {
            topicList.innerHTML = "";
            return;
        }

        // Prevent unnecessary searches for the same query
        if (query === lastQuery) return;
        lastQuery = query;

        topicList.innerHTML = "<div class='dropdown-item'>Searching...</div>";

        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/topics?q=${query}`);
                const data = await response.json();

                topicList.innerHTML = "";
                if (!Array.isArray(data)) {
                    console.error("Unexpected API response for topics:", data);
                    topicList.innerHTML = "<div class='dropdown-item text-danger'>Unexpected response</div>";
                    return;
                }

                if (data.length === 0) {
                    // Show an option to create the new topic, but do not create it yet
                    const createOption = document.createElement("div");
                    createOption.textContent = `Create topic: "${query}"`;
                    createOption.classList.add("dropdown-item", "text-primary");
                    createOption.addEventListener("click", async () => {
                        await createTopic(query, selectedTopicsContainer, selectedTopics);
                    });
                    topicList.appendChild(createOption);
                } else {
                    // Show existing topics
                    data.forEach(topic => {
                        const topicDiv = document.createElement("div");
                        topicDiv.textContent = topic.topic_name;
                        topicDiv.classList.add("dropdown-item");
                        topicDiv.addEventListener("click", () => {
                            addSelectedTopic(topic.topic_name, selectedTopicsContainer, selectedTopics);
                            topicInput.value = "";
                            topicList.innerHTML = "";
                        });
                        topicList.appendChild(topicDiv);
                    });
                }
            } catch (error) {
                console.error("Error fetching topics:", error);
                topicList.innerHTML = "<div class='dropdown-item text-danger'>Error fetching topics</div>";
            }
        }, 300);
    });

    // Handle topic creation only when user presses Enter
    topicInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const topicName = topicInput.value.trim();
            if (!topicName) return;

            // Check if the create option exists (meaning the topic is new)
            const createOption = document.querySelector(".text-primary");
            if (createOption) {
                await createTopic(topicName, selectedTopicsContainer, selectedTopics);
            }
        }
    });
}

// Function to create a topic (only when clicked or Enter is pressed)
async function createTopic(topicName, container, selectedTopics) {
    try {
        const response = await fetch("/api/topics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic_name: topicName }),
        });

        if (response.ok) {
            const newTopic = await response.json();
            console.log("Topic created:", newTopic);

            // Add topic to the selected list
            addSelectedTopic(newTopic.topic_name, container, selectedTopics);

            // Clear input field
            document.getElementById("topicInput").value = "";
            document.getElementById("topicList").innerHTML = "";
        } else {
            console.error("Failed to create topic.");
        }
    } catch (error) {
        console.error("Error creating topic:", error);
    }
}

// Function to add selected topic to the UI
function addSelectedTopic(name, container, selectedTopics) {
    if (selectedTopics.has(name)) return;

    selectedTopics.add(name);

    const topicDiv = document.createElement("div");
    topicDiv.classList.add("selected-topics");
    topicDiv.style.backgroundColor = getRandomColor();
    topicDiv.textContent = name;

    const removeBtn = document.createElement("span");
    removeBtn.textContent = " ×";
    removeBtn.classList.add("remove-item");
    removeBtn.addEventListener("click", () => {
        selectedTopics.delete(name);
        topicDiv.remove();
    });

    topicDiv.appendChild(removeBtn);
    container.appendChild(topicDiv);
}

// Function to generate random colors for selected topics
function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`; // Pastel colors
}
