document.addEventListener("DOMContentLoaded", () => {
    setupTopicSelection();
});

function setupTopicSelection() {
    const topicInput = document.getElementById("topicInput");
    const topicList = document.getElementById("topicList");
    const selectedTopicsContainer = document.getElementById("selectedTopics");
    let searchTimeout;
    let selectedTopics = new Set();

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
                const response = await fetch(`/api/topics?q=${query}`);
                const data = await response.json();

                topicList.innerHTML = "";
                if (!Array.isArray(data)) {
                    console.error("Unexpected API response for topics:", data);
                    topicList.innerHTML = "<div class='dropdown-item text-danger'>Unexpected response</div>";
                    return;
                }

                if (data.length === 0) {
                    topicList.innerHTML = "<div class='dropdown-item'>No topic found</div>";
                } else {
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
}

function addSelectedTopic(name, container, selectedTopics) {
    if (selectedTopics.has(name)) return;

    selectedTopics.add(name);

    const topicDiv = document.createElement("div");
    topicDiv.classList.add("selected-item");
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

function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`; // Pastel colors
}
