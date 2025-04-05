let searchTimeout;
const selectedAuthors = new Set(); // Store selected authors
const authorColors = new Map(); // Store assigned colors

document.addEventListener("DOMContentLoaded", () => {
    const authorInput = document.getElementById("authorInput");
    const authorList = document.getElementById("authorList");
    const selectedAuthorsContainer = document.getElementById("selectedAuthors");

    authorInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);

        const query = authorInput.value.trim();
        if (query.length === 0) {
            authorList.innerHTML = "";
            return;
        }

        authorList.innerHTML = "<div class='dropdown-item'>Searching...</div>";

        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/authors?q=${query}`);
                const data = await response.json();

                authorList.innerHTML = ""; // Clear previous list

                if (!Array.isArray(data)) {
                    console.error("Unexpected API response:", data);
                    authorList.innerHTML = "<div class='dropdown-item text-danger'>Unexpected response</div>";
                    return;
                }

                if (data.length === 0) {
                    // Show "Create Author" option when no author is found
                    const createAuthorItem = document.createElement("div");
                    createAuthorItem.classList.add("dropdown-item", "create-author");
                    createAuthorItem.innerHTML = `<span class="create-author-text">Create Author: "${query}"</span>`;
                    createAuthorItem.addEventListener("click", () => selectAuthor(query));
                    authorList.appendChild(createAuthorItem);
                } else {
                    data.forEach(author => {
                        const authorItem = document.createElement("div");
                        authorItem.textContent = author.full_name;
                        authorItem.classList.add("dropdown-item");
                        authorItem.addEventListener("click", () => selectAuthor(author.full_name));
                        authorList.appendChild(authorItem);
                    });
                }
            } catch (error) {
                console.error("Error fetching authors:", error);
                authorList.innerHTML = "<div class='dropdown-item text-danger'>Error fetching authors</div>";
            }
        }, 300);
    });

    function selectAuthor(name) {
        if (!selectedAuthors.has(name)) {
            selectedAuthors.add(name);

            // Assign a random color if not already assigned
            if (!authorColors.has(name)) {
                authorColors.set(name, getRandomColor());
            }

            updateSelectedAuthors();
        }
        authorInput.value = ""; // Clear input after selection
        authorList.innerHTML = ""; // Hide dropdown list
    }

    function updateSelectedAuthors() {
        selectedAuthorsContainer.innerHTML = ""; // Clear previous selections

        selectedAuthors.forEach(name => {
            const authorDiv = document.createElement("div");
            authorDiv.classList.add("selected-author");
            authorDiv.textContent = name;
            authorDiv.style.backgroundColor = authorColors.get(name); // Apply color

            // Add remove button
            const removeBtn = document.createElement("span");
            removeBtn.textContent = " ×";
            removeBtn.classList.add("remove-author");
            removeBtn.addEventListener("click", () => {
                selectedAuthors.delete(name);
                authorColors.delete(name);
                updateSelectedAuthors();
            });

            authorDiv.appendChild(removeBtn);
            selectedAuthorsContainer.appendChild(authorDiv);
        });
    }

    // Function to generate random pastel colors
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360); // Random hue
        return `hsl(${hue}, 70%, 80%)`; // Light pastel shades
    }
});
