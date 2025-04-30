function displayDocumentPreview(document) {
    // Set preview modal title, author, and abstract
    document.getElementById('previewTitle').textContent = document.title;
    
    // Format authors display
    const authorText = document.authors.map(author => author.full_name).join(', ');
    document.getElementById('previewAuthor').textContent = authorText || 'Unknown Author';
    
    // Format publication date
    const publishDate = document.publication_date ? 
        new Date(document.publication_date).toLocaleDateString() : 'Unknown';
    document.getElementById('previewPublishDate').textContent = publishDate;
    
    // Format topics display as tags
    const topicsContainer = document.getElementById('previewTopics');
    topicsContainer.innerHTML = '';
    
    if (document.topics && document.topics.length > 0) {
        const topicTags = document.topics.map(topic => {
            // Generate a distinct color based on topic name
            const color = generateTopicColor(topic.name);
            return `<span class="topic-tag" style="background-color: ${color}">${topic.name}</span>`;
        }).join('');
        topicsContainer.innerHTML = topicTags;
    } else {
        topicsContainer.textContent = 'None';
    }
    
    // Set page count
    document.getElementById('previewPages').textContent = document.pages || 'Unknown';
    
    // Format added date
    const addedDate = document.created_at ? 
        new Date(document.created_at).toLocaleDateString() : 'Unknown';
    document.getElementById('previewAddedDate').textContent = addedDate;
    
    // Set abstract
    document.getElementById('previewAbstract').textContent = document.abstract || 'No abstract available';
    
    // Store file path for use in Read Document button
    const readButton = document.getElementById('readDocumentBtn');
    readButton.setAttribute('data-filepath', document.file_path);
    
    // Show the preview modal
    const previewModal = document.getElementById('preview-modal');
    previewModal.style.display = 'flex';
} 