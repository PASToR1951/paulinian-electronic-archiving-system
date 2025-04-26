/**
 * Author List React Component
 * Handles loading and displaying authors
 */

// Make sure this executes immediately when the script is loaded
console.log('Author list script starting to execute');

// Simple helper to check if we're in the browser environment
const isBrowser = typeof window !== 'undefined';

// React component for Author List
const { useState, useEffect, useCallback } = React;

// Define the AuthorList component that will be mounted in the HTML
function AuthorList() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to load authors from API
  const loadAuthors = useCallback(() => {
    setLoading(true);
    setError(null);
    
    fetch('/api/authors')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Authors loaded:', data);
        
        // Check the data structure and extract authors properly
        if (Array.isArray(data)) {
          console.log('API returned an array directly, using it');
          setAuthors(data);
        } else if (data && Array.isArray(data.authors)) {
          console.log('API returned {authors: [...]} structure');
          setAuthors(data.authors);
        } else if (data && typeof data === 'object') {
          console.log('API returned a single author object, wrapping in array');
          setAuthors([data]);
        } else {
          console.warn('Unexpected data format, using empty array');
          setAuthors([]);
        }
        
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading authors:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Load authors on component mount
  useEffect(() => {
    console.log('Author list component mounted');
    loadAuthors();
  }, [loadAuthors]);

  // Handle edit button click
  const handleEdit = (authorId) => {
    console.log('Edit author:', authorId);
    // TODO: Implement edit functionality
    alert('Edit author functionality not implemented yet');
  };

  // Handle delete button click
  const handleDelete = (authorId) => {
    console.log('Delete author:', authorId);
    if (window.confirm('Are you sure you want to delete this author?')) {
      deleteAuthor(authorId);
    }
  };

  // Function to delete an author
  const deleteAuthor = (authorId) => {
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
  };

  // If loading, show loading message
  if (loading) {
    return (
      <div className="author-list-container">
        <h2>Author List</h2>
        <p>Loading authors...</p>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="author-list-container">
        <h2>Author List</h2>
        <div className="error">
          <p>Error loading authors: {error}</p>
        </div>
      </div>
    );
  }

  // If no authors, show message with debug info
  if (!authors || authors.length === 0) {
    console.warn('No authors to display:', authors);
    return (
      <div className="author-list-container" style={{border: '1px solid #ddd', padding: '20px', margin: '20px', backgroundColor: 'white'}}>
        <h2>Author List</h2>
        <p>No authors found</p>
        <div style={{backgroundColor: '#f0f0f0', padding: '10px', marginTop: '15px', borderRadius: '4px'}}>
          <p><strong>Debug Info:</strong> The authors array is empty. Check the browser console for more details.</p>
        </div>
      </div>
    );
  }

  // Log current state before rendering
  console.log('About to render authors:', authors);

  // Render authors grid with inline styles for better visibility
  return (
    <div className="author-list-container" style={{border: '1px solid #ddd', padding: '20px', margin: '20px', backgroundColor: 'white'}}>
      <h2 style={{borderBottom: '1px solid #eee', paddingBottom: '10px'}}>Author List</h2>
      
      {/* Number of authors found */}
      <p>Found {authors.length} authors</p>
      
      {/* Debug panel with raw data */}
      <div style={{backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '15px', borderRadius: '4px'}}>
        <p><strong>Debug Data:</strong></p>
        <pre style={{backgroundColor: '#333', color: 'white', padding: '10px', overflow: 'auto'}}>
          {JSON.stringify(authors, null, 2)}
        </pre>
      </div>
      
      <div className="authors-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px'}}>
        {authors.map((author, index) => {
          console.log('Rendering author:', author);
          return (
            <div 
              className="author-card" 
              key={author.id || author.author_id || index}
              style={{border: '1px solid #ddd', borderRadius: '4px', padding: '15px', backgroundColor: '#f9f9f9', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}
            >
              <h3 style={{marginTop: '0', color: '#444'}}>{author.name || 'Unknown'}</h3>
              <p style={{color: '#666'}}>ID: {author.id || author.author_id || 'No ID'}</p>
              <p style={{color: '#666'}}>{author.email || 'No email'}</p>
              <p style={{color: '#666'}}>Department: {author.department || 'No department'}</p>
              <div className="actions" style={{display: 'flex', justifyContent: 'space-between', marginTop: '10px'}}>
                <button 
                  className="btn btn-edit" 
                  style={{backgroundColor: '#4caf50', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  onClick={() => handleEdit(author.id || author.author_id)}>
                  Edit
                </button>
                <button 
                  className="btn btn-delete" 
                  style={{backgroundColor: '#f44336', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  onClick={() => handleDelete(author.id || author.author_id)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// When this file is loaded via script tag, we'll export the AuthorList component
// so it can be mounted by our initialization script in the HTML file
console.log('AuthorList component ready for mounting');

// Nothing else needed here - we'll mount the component from the HTML file
