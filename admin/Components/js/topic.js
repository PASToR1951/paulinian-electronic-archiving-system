// topic.js

// Topic Select Functionality
async function getTopics() {
    // Placeholder for backend data - replace with actual data fetching
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                "Nursing", "Medicine", "History", "Computer Science", "Literature",
                "Psychology", "Sociology", "Mathematics", "Physics", "Chemistry"
            ]);
        }, 200);
    });
}

let topics = [];
let selectedTopics = [];

const selectedTopicsDiv = document.getElementById("selectedTopics");
const topicInput = document.getElementById("topicInput");
const topicList = document.getElementById("topicList");

async function initializeTopics() {
    topics = await getTopics();
    updateTopicList();
}

function updateSelectedTopics() {
    selectedTopicsDiv.innerHTML = "";
    selectedTopics.forEach(topic => {
        const topicDiv = document.createElement("div");
        topicDiv.classList.add("topic");
        topicDiv.textContent = topic;
        topicDiv.addEventListener("click", () => {
            selectedTopics = selectedTopics.filter(t => t !== topic);
            updateSelectedTopics();
        });
        selectedTopicsDiv.appendChild(topicDiv);
    });
}

function updateTopicList(searchTerm = "") {
    topicList.innerHTML = "";
    const filteredTopics = topics.filter(topic =>
        topic.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedTopics.includes(topic)
    );
    filteredTopics.forEach(topic => {
        const topicItem = document.createElement("div");
        topicItem.classList.add("dropdown-item");
        topicItem.textContent = topic;
        topicItem.addEventListener("click", () => {
            selectedTopics.push(topic);
            updateSelectedTopics();
            topicInput.value = "";
            updateTopicList();
            topicInput.focus();
        });
        topicList.appendChild(topicItem);
    });
}

topicInput.addEventListener("input", () => {
    updateTopicList(topicInput.value);
});

topicInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const newTopic = topicInput.value.trim();
        if (newTopic && !selectedTopics.includes(newTopic)) {
            selectedTopics.push(newTopic);
            updateSelectedTopics();
            topicInput.value = "";
            updateTopicList();
        }
        event.preventDefault(); // Prevent form submission
    }
});

initializeTopics(); // Fetch and display topics on load

// Close dropdown when clicking outside
document.addEventListener("click", (event) => {
    if (!event.target.closest(".select-container")) {
        topicList.classList.remove("show");
    }
});