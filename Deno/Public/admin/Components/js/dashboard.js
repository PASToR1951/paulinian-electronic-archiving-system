// Function to update the works summary section with dynamic counts
async function updateWorksSummary() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const categories = await response.json();
        
        // Calculate total works count
        let totalWorks = 0;
        const categoryCounts = {};
        
        // Process each category
        categories.forEach(category => {
            categoryCounts[category.name] = category.count || 0;
            totalWorks += Number(category.count) || 0;
        });
        
        // Update individual category counts
        const updateCategoryCount = (categoryName, count) => {
            const countElement = document.querySelector(`.work-count:has(.work-type.${categoryName.toLowerCase()}-text) .count`);
            if (countElement) {
                countElement.textContent = count || '0';
            }
        };
        
        // Update each category count
        updateCategoryCount('Confluence', categoryCounts['Confluence']);
        updateCategoryCount('Dissertation', categoryCounts['Dissertation']);
        updateCategoryCount('Thesis', categoryCounts['Thesis']);
        updateCategoryCount('Synergy', categoryCounts['Synergy']);
        
        // Update total works count
        const totalCountElement = document.querySelector('.total-count');
        if (totalCountElement) {
            totalCountElement.textContent = totalWorks;
        }
        
    } catch (error) {
        console.error('Error updating works summary:', error);
    }
}

// Update works summary when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateWorksSummary();
}); 