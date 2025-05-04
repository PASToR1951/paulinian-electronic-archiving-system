// Function to update the works summary section with dynamic counts
async function updateWorksSummary() {
    try {
        console.log('Fetching categories data...');
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const categories = await response.json();
        console.log('Categories data received:', categories);
        
        // Calculate total works count
        let totalWorks = 0;
        
        // Map API document_type to display names and CSS classes
        const categoryTypeMap = {
            'THESIS': 'thesis',
            'DISSERTATION': 'dissertation',
            'CONFLUENCE': 'confluence',
            'SYNERGY': 'synergy'
        };
        
        // Initialize with zeros in case some categories are missing
        const categoryCounts = {
            'thesis': 0,
            'dissertation': 0, 
            'confluence': 0,
            'synergy': 0
        };
        
        // Process each category
        categories.forEach(category => {
            const count = Number(category.count) || 0;
            const name = category.name || '';
            const displayKey = categoryTypeMap[name] || name.toLowerCase();
            
            if (categoryCounts.hasOwnProperty(displayKey)) {
                categoryCounts[displayKey] = count;
            }
            
            totalWorks += count;
        });
        
        console.log('Processed category counts:', categoryCounts);
        
        // Update individual category counts - use a more compatible approach
        document.querySelectorAll('.work-count').forEach(workCountEl => {
            // Find which category this element represents
            let categoryFound = false;
            Object.keys(categoryCounts).forEach(category => {
                if (workCountEl.querySelector(`.work-icon.${category}`)) {
                    const countEl = workCountEl.querySelector('.count');
                    if (countEl) {
                        countEl.textContent = categoryCounts[category];
                        categoryFound = true;
                    }
                }
            });
            
            if (!categoryFound) {
                // Try finding by text content as a fallback
                Object.keys(categoryCounts).forEach(category => {
                    const typeEl = workCountEl.querySelector(`.work-type.${category}-text`);
                    if (typeEl) {
                        const countEl = workCountEl.querySelector('.count');
                        if (countEl) {
                            countEl.textContent = categoryCounts[category];
                        }
                    }
                });
            }
        });
        
        // Update total works count
        const totalCountElement = document.querySelector('.total-count');
        if (totalCountElement) {
            totalCountElement.textContent = totalWorks;
        } else {
            console.warn('Could not find total count element');
        }
        
    } catch (error) {
        console.error('Error updating works summary:', error);
        // Display error in the UI
        document.querySelectorAll('.work-count .count').forEach(el => {
            el.textContent = 'Error';
        });
        const totalCountElement = document.querySelector('.total-count');
        if (totalCountElement) {
            totalCountElement.textContent = 'Error';
        }
    }
}

// Update works summary when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing dashboard...');
    setTimeout(() => {
        updateWorksSummary();
    }, 100); // Small delay to ensure all HTML is loaded
}); 