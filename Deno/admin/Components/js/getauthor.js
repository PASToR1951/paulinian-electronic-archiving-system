document.addEventListener("DOMContentLoaded", () => {
    const authorInput = document.getElementById("authorInput");
    const authorList = document.getElementById("authorList");
    const selectedAuthors = document.getElementById("selectedAuthors");

    // Function to fetch authors from the backend
    async function fetchAuthors(query) {
        try {
            const response = await fetch(`http://localhost:8000/controllers/authors?search=${query}`);
            if (!response.ok) throw new Error("Failed to fetch authors");

            const authors = await response.json();
            console.log("Authors received:", authors); // Debugging log
            return authors;
        } catch (error) {
            console.error("Error fetching authors:", error);
            return [];
        }
    }

    // Function to display the authors in the dropdown
    async function handleAuthorInput() {
        const query = authorInput.value.trim();
        if (query.length === 0) {
            authorList.innerHTML = ""; // Clear suggestions if input is empty
            return;
        }

        const authors = await fetchAuthors(query);
        authorList.innerHTML = ""; // Clear previous suggestions

        if (authors.length === 0) {
            const noResultItem = document.createElement("div");
            noResultItem.textContent = "No authors found";
            noResultItem.classList.add("dropdown-item", "no-result");
            authorList.appendChild(noResultItem);
            return;
        }

        authors.forEach(author => {
            const fullName = `${author.firstName} ${author.middleName ? author.middleName + " " : ""}${author.lastName}`;
            const listItem = document.createElement("div");
            listItem.textContent = fullName;
            listItem.classList.add("dropdown-item");
            listItem.addEventListener("click", () => selectAuthor(fullName));
            authorList.appendChild(listItem);
        });
    }

    // Function to select an author and display it in the selected section
    function selectAuthor(authorName) {
        // Prevent duplicate selection
        if ([...selectedAuthors.children].some(el => el.textContent === authorName)) return;

        const authorElement = document.createElement("span");
        authorElement.classList.add("selected-author");
        authorElement.textContent = authorName;

        // Add remove functionality
        const removeButton = document.createElement("button");
        removeButton.textContent = "x";
        removeButton.classList.add("remove-author");
        removeButton.addEventListener("click", () => authorElement.remove());

        authorElement.appendChild(removeButton);
        selectedAuthors.appendChild(authorElement);

        // Clear input field and dropdown
        authorInput.value = "";
        authorList.innerHTML = "";
    }

    // Event listener for input change
    authorInput.addEventListener("input", handleAuthorInput);
});
