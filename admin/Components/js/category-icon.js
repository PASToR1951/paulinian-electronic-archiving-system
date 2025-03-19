
    // Get references to the elements
    const categorySelect = document.getElementById('category');
    const categoryIcon = document.getElementById('category-icon');

    // Define an object to map categories to image paths
    const categoryIcons = {
        confluence: '/admin/components/icons/category-icons/confluence.png',
        dissertation: '/admin/components/icons/category-icons/dissertation.png',
        thesis: '/admin/components/icons/category-icons/thesis.png',
        synthesis: '/admin/components/icons/category-icons/synthesis.png',
    };

    // Set up an event listener for when the category changes
    categorySelect.addEventListener('change', function() {
        const selectedCategory = categorySelect.value;

        // Check if a valid category is selected
        if (categoryIcons[selectedCategory]) {
            categoryIcon.src = categoryIcons[selectedCategory]; // Update the image src
        } else {
            categoryIcon.src = 'default_category_icon.png'; // Default icon if no valid category is found
        }
    });

    // Optionally, set the initial icon when the page loads based on the default category
    globalThis.onload = function() {
        const selectedCategory = categorySelect.value;
        if (categoryIcons[selectedCategory]) {
            categoryIcon.src = categoryIcons[selectedCategory]; // Set the initial icon
        }
    };

