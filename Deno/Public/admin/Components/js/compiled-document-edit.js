/**
 * Compiled Document Edit functionality
 * Handles editing of existing compiled documents
 */

console.log('Compiled document edit module loaded');

// Compiled Document edit module
window.compiledDocumentEdit = {
    // Function to show the edit modal for a compiled document - delegates to documentEdit
    showCompiledEditModal: function(documentId) {
        console.log(`Showing edit modal for compiled document ID: ${documentId}`);
        
        // Check if document edit module is available and use its implementation
        if (window.documentEdit && typeof window.documentEdit.showCompiledEditModal === 'function') {
            window.documentEdit.showCompiledEditModal(documentId);
        } else {
            alert(`Edit functionality for compiled document ${documentId} is coming soon.`);
        }
    },
    
    // Function to save compiled document changes - delegates to documentEdit
    saveCompiledDocument: function(documentData) {
        // Use document edit implementation if available
        if (window.documentEdit && typeof window.documentEdit.saveCompiledDocument === 'function') {
            return window.documentEdit.saveCompiledDocument(documentData);
        }
        
        console.log('Saving compiled document:', documentData);
        // This would call the compiled document update API endpoint
        return Promise.resolve({ success: true });
    },
    
    // Function to confirm deletion of a compiled document
    confirmDeleteCompiledDocument: function(documentId) {
        console.log(`Confirming deletion of compiled document ${documentId}`);
        // Check if archiveDocument function exists in the documentArchive namespace
        if (window.documentArchive && typeof window.documentArchive.archiveDocument === 'function') {
            // Use the existing archiveDocument function which already handles compiled documents
            window.documentArchive.archiveDocument(documentId);
        } else {
            // Fallback to a basic confirmation if archiveDocument is not available
            if (confirm(`Are you sure you want to delete this compiled document and all its children?`)) {
                alert(`Unable to delete. Archive functionality is not available.`);
            }
        }
    }
};

// Initialize compiled document edit components when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing compiled document edit functionality');
    
    // Set up global functions for use in other scripts
    window.showCompiledEditModal = window.compiledDocumentEdit.showCompiledEditModal;
    window.confirmDeleteCompiledDocument = window.compiledDocumentEdit.confirmDeleteCompiledDocument;
}); 