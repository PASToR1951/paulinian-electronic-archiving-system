/**
 * Document display styling utilities
 * This file contains utilities to manage document display styles
 */

// Initialize document display styles
(function() {
    // Add necessary CSS classes if not already present
    function addDocumentStyles() {
        // Check if styles are already added
        if (document.getElementById('document-display-styles')) {
            return;
        }
        
        // Create style element
        const style = document.createElement('style');
        style.id = 'document-display-styles';
        
        // Add CSS for document cards and related elements
        style.textContent = `
            /* Document list container */
            .documents-container {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            /* Document card styles */
            .document-card {
                display: flex;
                align-items: center;
                padding: 15px;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
            }
            
            .document-card:hover {
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                transform: translateY(-2px);
            }
            
            /* Child document styling */
            .child-document-card {
                margin-left: 20px;
                border-left: 2px solid #e0e0e0;
                padding-left: 15px;
            }
            
            /* Compiled document specific styles */
            .compiled-document-wrapper {
                margin-bottom: 15px;
            }
            
            .compiled-document-wrapper .children-container {
                margin-left: 20px;
                border-left: 3px solid #3498db;
                padding-left: 10px;
                margin-top: 8px;
            }
            
            /* Category badges */
            .category-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                margin-right: 5px;
            }
            
            .category-badge.thesis {
                background-color: #e3f2fd;
                color: #0d47a1;
            }
            
            .category-badge.dissertation {
                background-color: #e8f5e9;
                color: #1b5e20;
            }
            
            .category-badge.confluence {
                background-color: #fff3e0;
                color: #e65100;
            }
            
            .category-badge.synergy {
                background-color: #f3e5f5;
                color: #4a148c;
            }
        `;
        
        // Add the style element to the document head
        document.head.appendChild(style);
        console.log('Document display styles added');
    }
    
    // Apply document display styles
    addDocumentStyles();
    
    // Make styling functions available globally
    window.documentDisplayStyles = {
        refresh: addDocumentStyles
    };
})();

console.log('Document display styles module loaded'); 