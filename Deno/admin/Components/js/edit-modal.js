let currentDocumentId = null;

// Function to open edit modal
function openEditModal(documentId) {
    currentDocumentId = documentId;
    document.getElementById('edit-modal').style.display = 'flex';
    fetchDocumentData(documentId);
}

// Function to close edit modal
function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    currentDocumentId = null;
    // Clear form
    document.getElementById('edit-form').reset();
    document.getElementById('edit-selectedAuthors').innerHTML = '';
    document.getElementById('edit-selectedTopics').innerHTML = '';
}

// Fetch document data and populate form
async function fetchDocumentData(documentId) {
    try {
        const response = await fetch(`/api/documents/${documentId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch document data');
        }
        const document = await response.json();
        
        // Populate form fields
        document.getElementById('edit-title').value = document.title;
        document.getElementById('edit-publication_date').value = document.publication_date;
        document.getElementById('edit-volume').value = document.volume || '';
        document.getElementById('edit-category').value = document.category;
        
        // Populate authors
        const authors = document.author.split(', ');
        const selectedAuthors = document.getElementById('edit-selectedAuthors');
        authors.forEach(author => {
            const authorBadge = document.createElement('div');
            authorBadge.className = 'author-badge';
            authorBadge.textContent = author;
            selectedAuthors.appendChild(authorBadge);
        });
        
        // Populate topics
        const selectedTopics = document.getElementById('edit-selectedTopics');
        document.topics.forEach(topic => {
            const topicBadge = document.createElement('div');
            topicBadge.className = 'topic-badge';
            topicBadge.textContent = topic;
            selectedTopics.appendChild(topicBadge);
        });
    } catch (error) {
        console.error('Error fetching document:', error);
        alert('Failed to load document data');
    }
}

// Handle form submission
document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('edit-title').value);
    formData.append('publication_date', document.getElementById('edit-publication_date').value);
    formData.append('volume', document.getElementById('edit-volume').value);
    formData.append('category', document.getElementById('edit-category').value);
    
    // Get selected authors
    const authorBadges = document.querySelectorAll('#edit-selectedAuthors .author-badge');
    const authors = Array.from(authorBadges).map(badge => badge.textContent);
    formData.append('author', authors.join(', '));
    
    // Get selected topics
    const topicBadges = document.querySelectorAll('#edit-selectedTopics .topic-badge');
    const topics = Array.from(topicBadges).map(badge => badge.textContent);
    formData.append('topics', JSON.stringify(topics));
    
    // Add file if selected
    const fileInput = document.getElementById('edit-file');
    if (fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
    }
    
    try {
        const response = await fetch(`/api/documents/${currentDocumentId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to update document');
        }
        
        // Close edit modal
        closeEditModal();
        
        // Show success modal
        document.getElementById('edit-success-modal').style.display = 'flex';
        
        // Hide success modal and refresh page after 2 seconds
        setTimeout(() => {
            document.getElementById('edit-success-modal').style.display = 'none';
            window.location.reload();
        }, 2000);
    } catch (error) {
        console.error('Error updating document:', error);
        alert('Failed to update document');
    }
});

// Handle file selection
document.getElementById('edit-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            // Update page count
            document.getElementById('page-count').textContent = pdf.numPages;
            
            // Extract first page for preview
            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();
            const text = textContent.items.map(item => item.str).join(' ');
            
            // Update abstract preview with first page text
            document.getElementById('preview-abstract').textContent = text.substring(0, 500) + '...';
        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Error processing PDF file');
        }
    }
});

// Close modal when clicking outside
document.getElementById('edit-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('edit-modal')) {
        closeEditModal();
    }
});

// Close modal when clicking close button
document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);

// Close modal when clicking cancel button
document.getElementById('cancel-edit').addEventListener('click', closeEditModal);

// Export the openEditModal function
window.openEditModal = openEditModal; 