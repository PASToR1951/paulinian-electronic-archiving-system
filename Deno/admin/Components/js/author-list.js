/**
 * Author List JavaScript
 * Handles loading and displaying authors
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Author list script loaded');
  
  // Get the container element
  const container = document.getElementById('react-author-list');
  if (!container) {
    console.error('Author list container not found');
    return;
  }
  
  // Update the container with loading message
  container.innerHTML = `
    <div class="author-list-container">
      <h2>Author List</h2>
      <p>Loading authors...</p>
      <div id="authors-list"></div>
    </div>
  `;
  
  // Load authors from API
  loadAuthors();
});

/**
 * Load authors from API
 */
function loadAuthors() {
  fetch('/api/authors')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Authors loaded:', data);
      displayAuthors(data);
    })
    .catch(error => {
      console.error('Error loading authors:', error);
      const container = document.getElementById('authors-list');
      if (container) {
        container.innerHTML = `
          <div class="error">
            <p>Error loading authors: ${error.message}</p>
          </div>
        `;
      }
    });
}

/**
 * Display authors in the container
 */
function displayAuthors(data) {
  const container = document.getElementById('authors-list');
  if (!container) {
    console.error('Authors list container not found');
    return;
  }
  
  // Check if authors data exists
  if (!data || !data.authors || !Array.isArray(data.authors) || data.authors.length === 0) {
    container.innerHTML = '<p>No authors found</p>';
    return;
  }
  
  // Build HTML for authors
  let html = '<div class="authors-grid">';
  
  data.authors.forEach(author => {
    html += `
      <div class="author-card">
        <h3>${author.name || 'Unknown'}</h3>
        <p>${author.email || 'No email'}</p>
        <div class="actions">
          <button class="btn btn-edit" data-id="${author.id}">Edit</button>
          <button class="btn btn-delete" data-id="${author.id}">Delete</button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
  
  // Add event listeners to buttons
  addEventListeners();
}

/**
 * Add event listeners to buttons
 */
function addEventListeners() {
  // Edit buttons
  document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', (event) => {
      const authorId = event.target.getAttribute('data-id');
      console.log('Edit author:', authorId);
      // TODO: Implement edit functionality
      alert('Edit author functionality not implemented yet');
    });
  });
  
  // Delete buttons
  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', (event) => {
      const authorId = event.target.getAttribute('data-id');
      console.log('Delete author:', authorId);
      if (confirm('Are you sure you want to delete this author?')) {
        deleteAuthor(authorId);
      }
    });
  });
}

/**
 * Delete an author
 */
function deleteAuthor(authorId) {
  fetch(`/api/authors/${authorId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Author deleted:', data);
      // Reload authors
      loadAuthors();
    })
    .catch(error => {
      console.error('Error deleting author:', error);
      alert(`Error deleting author: ${error.message}`);
    });
}
