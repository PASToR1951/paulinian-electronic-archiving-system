document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("upload-form");
    const fileInput = document.getElementById("file");
    const publicationDateInput = document.getElementById("publication-date");
    console.log(publicationDateInput.value); // Check the value before appending to formData

    const topicInput = document.getElementById("topicInput");
    const authorInput = document.getElementById("authorInput");
    const topicList = document.getElementById("topicList");
    const authorList = document.getElementById("authorList");
    const selectedTopicsContainer = document.getElementById("selectedTopics");
    const selectedAuthorsContainer = document.getElementById("selectedAuthors");
    const readButton = document.getElementById("read-document");

    let pdfURL = "";
    let selectedAuthors = new Set(); // Store selected authors
    let selectedTopics = new Set();  // Store selected topics

    // Fetch Authors
    authorInput.addEventListener("input", async function () {
        const searchQuery = authorInput.value.trim().toLowerCase();
        authorList.innerHTML = ""; // Clear previous suggestions

        if (!searchQuery) {
            authorList.style.display = "none";
            return;
        }

        try {
            const response = await fetch(`/api/authors?q=${searchQuery}`);
            const authors = await response.json();

            if (Array.isArray(authors) && authors.length > 0) {
                authors.forEach(author => {
                    const authorOption = document.createElement("div");
                    authorOption.classList.add("dropdown-item");
                    authorOption.textContent = author.author_name;
                    authorOption.addEventListener("click", () => {
                        addAuthor(author.author_name);
                        authorInput.value = ""; // Clear input after selection
                        authorList.innerHTML = ""; // Hide dropdown after selection
                    });
                    authorList.appendChild(authorOption);
                });

                authorList.style.display = "block"; // Show dropdown if authors found
            } else {
                authorList.style.display = "none"; // Hide dropdown if no authors
            }
        } catch (error) {
            console.error("Error fetching authors:", error);
        }
    });

    function addAuthor(authorName) {
        if (selectedAuthors.has(authorName)) return;

        selectedAuthors.add(authorName);

        const authorSpan = document.createElement("span");
        authorSpan.classList.add("selected-author");
        authorSpan.textContent = authorName;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✖";
        removeBtn.classList.add("remove-author");
        removeBtn.onclick = () => {
            selectedAuthors.delete(authorName);
            authorSpan.remove();
        };

        authorSpan.appendChild(removeBtn);
        selectedAuthorsContainer.appendChild(authorSpan);
    }

    // Fetch Topics
    topicInput.addEventListener("input", async function () {
        const searchQuery = topicInput.value.trim().toLowerCase();
        topicList.innerHTML = ""; // Clear previous suggestions

        if (!searchQuery) {
            topicList.style.display = "none";
            return;
        }

        try {
            const response = await fetch(`/api/topics?q=${searchQuery}`);
            const topics = await response.json();

            if (Array.isArray(topics) && topics.length > 0) {
                topics.forEach(topic => {
                    const topicOption = document.createElement("div");
                    topicOption.classList.add("dropdown-item");
                    topicOption.textContent = topic.topic_name;
                    topicOption.addEventListener("click", () => {
                        addTopic(topic.topic_name);
                        topicInput.value = ""; // Clear input after selection
                        topicList.innerHTML = ""; // Hide dropdown after selection
                    });
                    topicList.appendChild(topicOption);
                });

                topicList.style.display = "block"; // Show dropdown if topics found
            } else {
                topicList.style.display = "none"; // Hide dropdown if no topics
            }
        } catch (error) {
            console.error("Error fetching topics:", error);
        }
    });

    function addTopic(topicName) {
        if (selectedTopics.has(topicName)) return;

        selectedTopics.add(topicName);

        const topicSpan = document.createElement("span");
        topicSpan.classList.add("selected-topic");
        topicSpan.textContent = topicName;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✖";
        removeBtn.classList.add("remove-topic");
        removeBtn.onclick = () => {
            selectedTopics.delete(topicName);
            topicSpan.remove();
        };

        topicSpan.appendChild(removeBtn);
        selectedTopicsContainer.appendChild(topicSpan);
    }

    // Submit Form
    if (form) {
        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            const formData = new FormData();
            formData.append("title", document.getElementById("title")?.value.trim() || "");
            formData.append("publication_date", publicationDateInput?.value.trim() || "");
            formData.append("volume-no", document.getElementById("volume-no")?.value.trim() || "");
            formData.append("department", document.getElementById("department")?.value.trim() || "");
            formData.append("category", document.getElementById("category")?.value.trim() || "");
            formData.append("abstract", document.getElementById("abstract")?.value.trim() || "");
            // Debugging authors & topics
            console.log("Selected Authors:", [...selectedAuthors]);
            console.log("Selected Topics:", [...selectedTopics]);

            formData.append("authors", JSON.stringify([...selectedAuthors]));
            formData.append("topics", JSON.stringify([...selectedTopics]));

            const file = fileInput.files[0];
            if (!file || file.type !== "application/pdf") {
                alert("Please attach a valid PDF file before submitting.");
                return;
            }
            formData.append("file", file);

            console.log("Form Data Before Sending:", Object.fromEntries(formData.entries()));

            try {
                const response = await fetch("http://localhost:8000/submit-document", {
                    method: "POST",
                    body: formData,
                });

                const result = await response.json();
                console.log("Server response:", result);

                if (response.ok) {
                    alert(result.message);
                    form.reset();
                    selectedTopics.clear();
                    selectedAuthors.clear();
                    selectedTopicsContainer.innerHTML = ""; // Clear selected topics
                    selectedAuthorsContainer.innerHTML = ""; // Clear selected authors
                } else {
                    alert("Failed to submit document: " + result.message);
                }
            } catch (error) {
                console.error("Error submitting document:", error);
                alert("An error occurred while submitting.");
            }
        });
    }

    // Handle File Upload
    fileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];

        if (file && file.type === "application/pdf") {
            pdfURL = URL.createObjectURL(file);
            readButton.disabled = false;
            readButton.classList.remove("disabled-button");
            readButton.classList.add("active-button");
        } else {
            pdfURL = "";
            readButton.disabled = true;
            readButton.classList.remove("active-button");
            readButton.classList.add("disabled-button");
        }
    });

    readButton.addEventListener("click", () => {
        if (pdfURL) {
            window.open(pdfURL, "_blank");
        }
    });
});
