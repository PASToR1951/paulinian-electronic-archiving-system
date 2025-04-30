/**
 * Utility functions for document management
 */

// Format a date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Show success message
function showSuccess(message, callback) {
    const modal = document.getElementById('success-modal');
    if (!modal) return;
    
    const messageElement = modal.querySelector('p');
    if (messageElement) {
        messageElement.textContent = message;
    }
    
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.style.display = 'none';
        if (typeof callback === 'function') {
            callback();
        }
    }, 2000);
}

// Show error message
function showError(message) {
    alert(message); // Simple alert for now, can be enhanced with a modal
}

// Convert file to base64
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Validate form inputs
function validateForm(formData, requiredFields) {
    for (const field of requiredFields) {
        if (!formData.get(field)) {
            return { valid: false, message: `${field.replace('_', ' ')} is required.` };
        }
    }
    return { valid: true };
}

// Get category icon based on category name
function getCategoryIcon(categoryName) {
    const categoryIcons = {
        'Thesis': 'icons/Category-icons/thesis.png',
        'Dissertation': 'icons/Category-icons/dissertation.png',
        'Confluence': 'icons/Category-icons/confluence.png',
        'Synergy': 'icons/Category-icons/synergy.png'
    };
    
    const defaultIcon = 'icons/Category-icons/default_category_icon.png';
    return categoryIcons[categoryName] || defaultIcon;
}

// Format topics list for display
function getTopicsHtml(topics) {
    if (!topics || topics.length === 0) return 'N/A';
    return topics.map(topic => `<span class="topic-tag">${topic.name || topic}</span>`).join(' ');
}

// Export functions for use in other modules
window.docUtils = {
    formatDate,
    showSuccess,
    showError,
    fileToBase64,
    validateForm,
    getCategoryIcon,
    getTopicsHtml
}; 