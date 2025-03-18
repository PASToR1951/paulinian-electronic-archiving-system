// Function to update preview
function updatePreview() {
    const title = document.getElementById('title').value;
    const author = document.getElementById('authorInput').value;  // For simplicity, using the author input directly
    const year = document.getElementById('year').value;
    const topic = document.getElementById('topicInput').value;  // Assuming topic input is text field
    const abstract = document.getElementById('abstract').value;
    const category = document.getElementById('category').value;

    // Update preview
    document.getElementById('preview-title').textContent = title || "Title of Document";
    document.getElementById('preview-author').textContent = `by ${author || "Author Name"}`;
    document.getElementById('preview-year').textContent = `Publishing Date: ${year || "2021"}`;
    document.getElementById('preview-topic').textContent = `Topics: ${topic || "Topic"}`;
    document.getElementById('preview-abstract').textContent = abstract || "This is the default abstract text...";

    // Update category icon based on the selected category
    const categoryIcon = getCategoryIcon(category);
    document.getElementById('category-icon').src = categoryIcon || "default_category_icon.png";
}

// Function to get category icon based on selected category
function getCategoryIcon(category) {
    switch (category) {
        case "confluence":
            return "images/confluence_icon.png";  // Example icon for Confluence
        case "dissertation":
            return "images/dissertation_icon.png";  // Example icon for Dissertation
        case "thesis":
            return "images/thesis_icon.png";  // Example icon for Thesis
        case "synthesis":
            return "images/synthesis_icon.png";  // Example icon for Synthesis
        default:
            return "images/default_icon.png";  
    }
}

// Attach the updatePreview function to form inputs
document.getElementById('title').addEventListener('input', updatePreview);
document.getElementById('authorInput').addEventListener('input', updatePreview);
document.getElementById('year').addEventListener('input', updatePreview);
document.getElementById('topicInput').addEventListener('input', updatePreview);
document.getElementById('abstract').addEventListener('input', updatePreview);
document.getElementById('category').addEventListener('change', updatePreview);

// Initial preview update in case form is pre-filled
updatePreview();
