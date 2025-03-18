// Placeholder for backend data - replace with actual data fetching
async function getAuthors() {
    // Simulate fetching data from a backend
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          "Author 1", "Author 2", "Author 3", "Author 4", "Author 5", 
          "Jane Austen", "Charles Dickens", "Leo Tolstoy", "Virginia Woolf", 
          "Ernest Hemingway", "Agatha Christie", "Stephen King", "J.R.R. Tolkien"
        ]);
      }, 200); // Simulate a 200ms delay
    });
  }
  
  let authors = []; // Will hold the fetched authors
  let selectedAuthors = [];
  
  const selectedAuthorsDiv = document.getElementById("selectedAuthors");
  const authorInput = document.getElementById("authorInput");
  const authorList = document.getElementById("authorList");
  
  
  async function initializeAuthors() {
    authors = await getAuthors();
    updateAuthorList();
  }
  
  function updateSelectedAuthors() {
    selectedAuthorsDiv.innerHTML = "";
    selectedAuthors.forEach(author => {
      const authorDiv = document.createElement("div");
      authorDiv.classList.add("author");
      authorDiv.textContent = author;
      authorDiv.addEventListener("click", () => {
        selectedAuthors = selectedAuthors.filter(a => a !== author);
        updateSelectedAuthors();
      });
      selectedAuthorsDiv.appendChild(authorDiv);
    });
  }
  
  function updateAuthorList(searchTerm = "") {
    authorList.innerHTML = "";
    const filteredAuthors = authors.filter(author => 
      author.toLowerCase().includes(searchTerm.toLowerCase()) && 
      !selectedAuthors.includes(author)
    );
    filteredAuthors.forEach(author => {
      const authorItem = document.createElement("div");
      authorItem.classList.add("dropdown-item");
      authorItem.textContent = author;
      authorItem.addEventListener("click", () => {
        selectedAuthors.push(author);
        updateSelectedAuthors();
        authorInput.value = "";
        updateAuthorList();
        authorInput.focus();
      });
      authorList.appendChild(authorItem);
    });
  }
  
  authorInput.addEventListener("input", () => {
    updateAuthorList(authorInput.value);
  });
  
  dropdownToggle.addEventListener("click", () => {
    authorList.classList.toggle("show");
    authorInput.focus();
  });
  
  initializeAuthors(); // Fetch and display authors on load
  
  // Close dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".select-container")) {
      authorList.classList.remove("show");
    }
  });