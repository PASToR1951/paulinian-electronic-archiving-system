import React, { useState, useEffect } from 'react';
import { fetchAuthors } from '../../src/api.js';
import '../../src/styles/Layout.css';

interface Author {
    id: string;
    name: string;
    department: string;
    affiliation: string;
    orcid: string;
    biography: string;
    profilePicture: string;
    gender: 'M' | 'F';
    email: string;
    document_count?: number;
}

const AuthorListPage = () => {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAuthorsData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAuthors();
            setAuthors(data);
        } catch (err) {
            console.error('Error fetching authors:', err);
            setError('Failed to load authors. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthorsData();
    }, []);

    const filteredAuthors = authors.filter(author => 
        author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="loading">Loading authors...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="container">
            <div className="author-list-page">
                <h1>Authors</h1>
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search authors..."
                        value={searchTerm}
                        onChange={(e: { target: { value: string } }) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="author-grid">
                    {filteredAuthors.length > 0 ? (
                        filteredAuthors.map((author) => (
                            <div key={author.id} className="author-card">
                                <div className="author-avatar">
                                    {author.profilePicture ? (
                                        <img src={author.profilePicture} alt={author.name} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {author.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="author-info">
                                    <h3>{author.name}</h3>
                                    <p><strong>Department:</strong> {author.department}</p>
                                    <p><strong>Email:</strong> {author.email}</p>
                                    <p><strong>Documents:</strong> {author.document_count || 0}</p>
                                </div>
                                <div className="author-actions">
                                    <button className="edit-button">Edit</button>
                                    <button className="delete-button">Delete</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-results">No authors found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthorListPage;

//cute ko
