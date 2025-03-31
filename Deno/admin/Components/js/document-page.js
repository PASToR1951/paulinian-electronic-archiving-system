async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();

        categories.forEach(category => {
            // Find existing category element using data-category attribute
            const categoryElement = document.querySelector(`.category[data-category="${category.category}"]`);

            if (categoryElement) {
                // Update only the file count
                const fileCountElement = categoryElement.querySelector(".category-file-count");
                fileCountElement.textContent = `${category.file_count} files`;
            }
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}

// Load categories and documents on page load
document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    loadDocuments(currentPage);
});


let currentPage = 1;
const pageSize = 10;
let totalEntries = 0;

async function loadDocuments(page = 1) {
    try {
        const response = await fetch(`/api/documents?page=${page}&size=${pageSize}`);
        const data = await response.json();

        const tbody = document.querySelector("#docs-table tbody");
        tbody.innerHTML = ""; // Clear existing data

        if (data.documents.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-message">No documents available</td></tr>`;
            return;
        }

        data.documents.forEach(doc => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><img src="${doc.cover_path}" alt="Cover" width="50" height="70"></td>
                <td>${doc.title}</td>
                <td>${doc.authors}</td>
                <td>${doc.year}</td>
                <td class="actions">
                    <a href="#" class="edit-icon"><i class="fas fa-edit"></i></a>
                    <a href="#" class="delete-icon"><i class="fas fa-trash-alt"></i></a>
                </td>
            `;
            tbody.appendChild(row);
        });

        totalEntries = data.total;
        updatePagination();
    } catch (error) {
        console.error("Error fetching documents:", error);
    }
}

function updatePagination() {
    const totalPages = Math.ceil(totalEntries / pageSize);
    const entriesInfo = document.getElementById("entries-info");
    const pageLinks = document.getElementById("page-links");

    entriesInfo.textContent = `Showing ${Math.min((currentPage - 1) * pageSize + 1, totalEntries)} to ${Math.min(currentPage * pageSize, totalEntries)} of ${totalEntries} entries`;

    // Clear pagination before adding new buttons
    pageLinks.innerHTML = "";

    // Previous button
    const prevButton = document.createElement("button");
    prevButton.textContent = "< prev";
    prevButton.classList.add("prev-button");
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadDocuments(currentPage);
        }
    });
    pageLinks.appendChild(prevButton);

    // Page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.classList.add("page-number");
        if (i === currentPage) button.classList.add("active");
        button.addEventListener("click", () => {
            currentPage = i;
            loadDocuments(currentPage);
        });
        pageLinks.appendChild(button);
    }

    // Next button
    const nextButton = document.createElement("button");
    nextButton.textContent = "next >";
    nextButton.classList.add("next-button");
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadDocuments(currentPage);
        }
    });
    pageLinks.appendChild(nextButton);
}

// Load categories and first page of documents on page load
document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    loadDocuments(currentPage);
});
