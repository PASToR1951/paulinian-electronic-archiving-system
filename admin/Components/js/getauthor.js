document.addEventListener("DOMContentLoaded", () => {
  const authorInput = document.getElementById("authorInput");
  const authorList = document.getElementById("authorList");
  const selectedAuthors = document.getElementById("selectedAuthors");

  // Function to fetch authors from the backend
  async function fetchAuthors(query) {
      try {
          const response = await fetch(`/routes/author?search=${query}`);
          if (response.ok) {
              const authors = await response.json();
              return authors;
          }
          throw new Error("Failed to fetch authors");
      } catch (error) {
          console.error(error);
          return [];
      }
  }

  // Function to display the authors in the dropdown
  async function handleAuthorInput() {
      const query = authorInput.value.trim();
      if (query.length > 0) {
          const authors = await fetchAuthors(query);
          authorList.innerHTML = ""; // Clear previous suggestions
          authors.forEach(author => {
              const listItem = document.createElement("div");
              listItem.textContent = author;
              listItem.classList.add("dropdown-item");
              listItem.addEventListener("click", () => selectAuthor(author));
              authorList.appendChild(listItem);
          });
      } else {
          authorList.innerHTML = ""; // Clear suggestions if input is empty
      }
  }

  // Function to select an author and display it in the selected section
  function selectAuthor(author) {
      const authorElement = document.createElement("span");
      authorElement.textContent = author;
      selectedAuthors.appendChild(authorElement);
      authorInput.value = ""; // Clear the input field
      authorList.innerHTML = ""; // Clear the dropdown list
  }

  // Event listener for input change
  authorInput.addEventListener("input", handleAuthorInput);
});
