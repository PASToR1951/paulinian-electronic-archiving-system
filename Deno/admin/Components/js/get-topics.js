let searchTimeout; // Store timeout globally

topicInput.addEventListener("input", () => {
    clearTimeout(searchTimeout); // Clear previous timeout
    const query = topicInput.value.trim();
    
    if (query.length === 0) {
        topicList.innerHTML = "";
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/topics?q=${query}`);
            const data = await response.json();

            topicList.innerHTML = "";
            if (Array.isArray(data) && data.length > 0) {
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
            } else {
                topicList.innerHTML = `<div class='dropdown-item text-primary'>Create topic: "${query}"</div>`;
            }
        } catch (error) {
            console.error("Error fetching topics:", error);
            topicList.innerHTML = "<div class='dropdown-item text-danger'>Error fetching topics</div>";
        }
    }, 300);
});
topicInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        const topicName = topicInput.value.trim();
        if (!topicName || selectedTopics.has(topicName)) return;

        const createOption = document.querySelector(".text-primary");
        if (createOption) {
            await createTopic(topicName, selectedTopicsContainer, selectedTopics);
        }
    }
});
