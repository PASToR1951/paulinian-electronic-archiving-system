import React, { useEffect, useState } from 'react';
import { fetchAuthors } from '../api.js';
import Layout from '../Components/Layout.tsx';
import '../styles/Layout.css';

interface Author {
  id: number;
  name: string;
  department: string;
  email: string;
  documentCount: number;
}

const AuthorListPage: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAuthors = async () => {
      try {
        setLoading(true);
        const data = await fetchAuthors();
        setAuthors(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching authors:', err);
        setError('Failed to load authors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadAuthors();
  }, []);

  return (
    <Layout>
      <div className="container">
        <div className="author-list-page">
          <h1>Authors</h1>
          {error && <div className="error">{error}</div>}
          {loading ? (
            <div className="loading">Loading authors...</div>
          ) : (
            <div className="author-grid">
              {authors.map((author) => (
                <div key={author.id} className="author-card">
                  <h3>{author.name}</h3>
                  <p><strong>Department:</strong> {author.department}</p>
                  <p><strong>Email:</strong> {author.email}</p>
                  <p className="document-count">Documents: {author.documentCount}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AuthorListPage; 