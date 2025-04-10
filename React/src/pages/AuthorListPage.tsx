import React, { useEffect, useState } from 'react';
import { fetchAuthors } from '../api.js';
import Layout from '../Components/Layout.tsx';
import '../styles/Layout.css';

interface Author {
  id: string;
  name: string;
  department: string;
  email: string;
  documentCount: number;
  affiliation?: string;
  orcid?: string;
  biography?: string;
  profilePicture?: string;
  yearOfGraduation?: number;
  linkedin?: string;
}

const AuthorListPage = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterAffiliation, setFilterAffiliation] = useState('');

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

  // Get unique departments and affiliations for filters
  const departments = [...new Set(authors.map((author: Author) => author.department).filter(Boolean))];
  const affiliations = [...new Set(authors.map((author: Author) => author.affiliation).filter(Boolean))];

  // Filter authors based on search term and filters
  const filteredAuthors = authors.filter((author: Author) => {
    const matchesSearch = author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (author.email && author.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = !filterDepartment || author.department === filterDepartment;
    const matchesAffiliation = !filterAffiliation || author.affiliation === filterAffiliation;

    return matchesSearch && matchesDepartment && matchesAffiliation;
  });

  return (
    <Layout>
      <div className="container">
        <div className="author-list-page">
          <h1>Authors</h1>
          
          {/* Search and filter controls */}
          <div className="search-filters">
            <input
              type="text"
              placeholder="Search authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="filter-select"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            <select
              value={filterAffiliation}
              onChange={(e) => setFilterAffiliation(e.target.value)}
              className="filter-select"
            >
              <option value="">All Affiliations</option>
              {affiliations.map(aff => (
                <option key={aff} value={aff}>{aff}</option>
              ))}
            </select>
          </div>
          
          {error && <div className="error">{error}</div>}
          
          {loading ? (
            <div className="loading">Loading authors...</div>
          ) : (
            <div className="author-grid">
              {filteredAuthors.length > 0 ? (
                filteredAuthors.map((author) => (
                  <div key={author.id} className="author-card">
                    <div className="author-header">
                      {author.profilePicture ? (
                        <img 
                          src={author.profilePicture} 
                          alt={author.name} 
                          className="author-avatar"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random`;
                          }}
                        />
                      ) : (
                        <div className="author-avatar-placeholder">
                          {author.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <h3>{author.name}</h3>
                    </div>
                    
                    <div className="author-details">
                      <p><strong>Department:</strong> {author.department}</p>
                      {author.affiliation && <p><strong>Affiliation:</strong> {author.affiliation}</p>}
                      {author.email && <p><strong>Email:</strong> {author.email}</p>}
                      {author.yearOfGraduation && <p><strong>Year:</strong> {author.yearOfGraduation}</p>}
                      <p className="document-count">Documents: {author.documentCount}</p>
                    </div>
                    
                    <div className="author-links">
                      {author.orcid && (
                        <a 
                          href={`https://orcid.org/${author.orcid}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="author-link"
                        >
                          ORCID
                        </a>
                      )}
                      {author.linkedin && (
                        <a 
                          href={author.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="author-link"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">No authors found matching your criteria.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AuthorListPage; 