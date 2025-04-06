import React, { useState, useEffect } from 'react';
import { fetchAuthors } from '../api.js';

const AuthorList = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAuthors = async () => {
      try {
        setLoading(true);
        const data = await fetchAuthors();
        setAuthors(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load authors:', err);
        setError('Failed to load authors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadAuthors();
  }, []);

  if (loading) {
    return <div className="loading">Loading authors...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="container">
      <h1>Authors</h1>
      <div className="author-list">
        {authors.length > 0 ? (
          authors.map((author) => (
            <div key={author.id} className="author-card">
              <div className="author-name">{author.name}</div>
              <div className="author-info">
                {author.department && <div>Department: {author.department}</div>}
                {author.email && <div>Email: {author.email}</div>}
              </div>
              <div className="author-documents">
                {author.document_count} {author.document_count === 1 ? 'document' : 'documents'}
              </div>
            </div>
          ))
        ) : (
          <div>No authors found.</div>
        )}
      </div>
    </div>
  );
};

export default AuthorList; 