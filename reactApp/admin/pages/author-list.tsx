import React, { useState, useEffect } from 'react';
import { fetchAuthors } from '../../src/api.js';
import '../../src/styles/Layout.css';
import '../../src/styles/AuthorList.css';

interface Author {
    author_id: string;
    full_name: string;
    department?: string | null;
    affiliation?: string | null;
    orcid_id?: string | null;
    bio?: string | null;
    profile_picture?: string | null;
    email?: string | null;
    document_count?: number;
    year_of_graduation?: number | null;
    linkedin?: string | null;
}

interface EditModalProps {
    author: Author | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (author: Author) => void;
}

const EditModal: React.FC<EditModalProps> = ({ author, isOpen, onClose, onSave }) => {
    const [editedAuthor, setEditedAuthor] = useState<Author | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        setEditedAuthor(author);
        setError('');
    }, [author]);

    if (!isOpen || !editedAuthor) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target as typeof e.target & {
            name: string;
            value: string;
        };
        setEditedAuthor(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editedAuthor) return;

        if (!editedAuthor.full_name?.trim()) {
            setError('Name is required');
            return;
        }

        onSave(editedAuthor);
    };

    return (
        <div key="edit-modal-overlay" className="modal-overlay">
            <div key="edit-modal-content" className="modal-content">
                <h2 key="edit-modal-title">Edit Author</h2>
                {error && <div key="edit-modal-error" className="error-message">{error}</div>}
                <form key="edit-modal-form" onSubmit={handleSubmit}>
                    <div key="form-group-name" className="form-group">
                        <label key="label-name" htmlFor="full_name">Name:</label>
                        <input
                            key="input-name"
                            id="full_name"
                            type="text"
                            name="full_name"
                            value={editedAuthor.full_name || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div key="form-group-department" className="form-group">
                        <label key="label-department" htmlFor="department">Department:</label>
                        <input
                            key="input-department"
                            id="department"
                            type="text"
                            name="department"
                            value={editedAuthor.department || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div key="form-group-email" className="form-group">
                        <label key="label-email" htmlFor="email">Email:</label>
                        <input
                            key="input-email"
                            id="email"
                            type="email"
                            name="email"
                            value={editedAuthor.email || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div key="form-group-affiliation" className="form-group">
                        <label key="label-affiliation" htmlFor="affiliation">Affiliation:</label>
                        <input
                            key="input-affiliation"
                            id="affiliation"
                            type="text"
                            name="affiliation"
                            value={editedAuthor.affiliation || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div key="form-group-orcid" className="form-group">
                        <label key="label-orcid" htmlFor="orcid_id">ORCID:</label>
                        <input
                            key="input-orcid"
                            id="orcid_id"
                            type="text"
                            name="orcid_id"
                            value={editedAuthor.orcid_id || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div key="form-group-bio" className="form-group">
                        <label key="label-bio" htmlFor="bio">Biography:</label>
                        <textarea
                            key="input-bio"
                            id="bio"
                            name="bio"
                            value={editedAuthor.bio || ''}
                            onChange={handleChange}
                            rows={4}
                        />
                    </div>
                    <div key="form-actions" className="modal-actions">
                        <button key="button-save" type="submit" className="save-button">Save</button>
                        <button key="button-cancel" type="button" onClick={onClose} className="cancel-button">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AuthorListPage = () => {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deleteConfirmAuthor, setDeleteConfirmAuthor] = useState<Author | null>(null);

    const fetchAuthorsData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAuthors();
            console.log('Fetched authors:', data);
            // Map the API response to match our Author interface
            const mappedAuthors = data.map((author: any) => ({
                author_id: author.id,
                full_name: author.name,
                department: author.department,
                email: author.email,
                affiliation: author.affiliation,
                orcid_id: author.orcid_id,
                bio: author.bio,
                profile_picture: author.profile_picture,
                document_count: author.document_count,
                year_of_graduation: author.year_of_graduation,
                linkedin: author.linkedin
            }));
            setAuthors(mappedAuthors);
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

    const handleEdit = (author: Author) => {
        setEditingAuthor(author);
        setIsEditModalOpen(true);
    };

    const handleDelete = (author: Author) => {
        setDeleteConfirmAuthor(author);
    };

    const handleSaveEdit = async (updatedAuthor: Author) => {
        try {
            const response = await fetch(`/api/authors/${updatedAuthor.author_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    full_name: updatedAuthor.full_name,
                    department: updatedAuthor.department,
                    email: updatedAuthor.email,
                    affiliation: updatedAuthor.affiliation,
                    orcid_id: updatedAuthor.orcid_id,
                    bio: updatedAuthor.bio
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update author');
            }

            const updatedData = await response.json();
            
            // Update the authors list with the edited author
            setAuthors(prevAuthors =>
                prevAuthors.map(author =>
                    author.author_id === updatedAuthor.author_id ? { 
                        ...author, 
                        full_name: updatedData.full_name,
                        department: updatedData.department,
                        email: updatedData.email,
                        affiliation: updatedData.affiliation,
                        orcid_id: updatedData.orcid_id,
                        bio: updatedData.bio
                    } : author
                )
            );

            setIsEditModalOpen(false);
            setEditingAuthor(null);
        } catch (err) {
            console.error('Error updating author:', err);
            setError('Failed to update author. Please try again.');
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirmAuthor) return;

        try {
            const response = await fetch(`/api/authors/${deleteConfirmAuthor.author_id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete author');
            }

            // Remove the deleted author from the list
            setAuthors(prevAuthors =>
                prevAuthors.filter(author => author.author_id !== deleteConfirmAuthor.author_id)
            );

            setDeleteConfirmAuthor(null);
        } catch (err) {
            console.error('Error deleting author:', err);
            setError('Failed to delete author. Please try again.');
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = (e.target as HTMLInputElement).value;
        setSearchTerm(value);
    };

    const filteredAuthors = authors.filter(author => {
        const searchTermLower = searchTerm.toLowerCase();
        const fullName = (author.full_name || '').toLowerCase();
        const department = (author.department || '').toLowerCase();
        const email = (author.email || '').toLowerCase();
        
        return fullName.includes(searchTermLower) ||
               department.includes(searchTermLower) ||
               email.includes(searchTermLower);
    });

    if (loading) {
        return <div className="loading">Loading authors...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div key="author-list-container" className="container">
            <div key="author-list-page" className="author-list-page">
                <h1 key="author-list-title">Authors</h1>
                <div key="search-container" className="search-container">
                    <input
                        key="search-input"
                        type="text"
                        placeholder="Search authors..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                </div>
                <div key="author-grid" className="author-grid">
                    {filteredAuthors.length > 0 ? (
                        filteredAuthors.map((author) => (
                            <div key={`author-card-${author.author_id}`} className="author-card">
                                <div key={`avatar-container-${author.author_id}`} className="author-avatar">
                                    {author.profile_picture ? (
                                        <img src={author.profile_picture} alt={author.full_name} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {author.full_name ? author.full_name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    )}
                                </div>
                                <div key={`info-${author.author_id}`} className="author-info">
                                    <h3>{author.full_name}</h3>
                                    <p><strong>Department:</strong> {author.department || 'N/A'}</p>
                                    <p><strong>Affiliation:</strong> {author.affiliation || 'N/A'}</p>
                                    <p><strong>Email:</strong> {author.email || 'N/A'}</p>
                                    <p><strong>ORCID:</strong> {author.orcid_id || 'N/A'}</p>
                                    <p><strong>Year of Graduation:</strong> {author.year_of_graduation || 'N/A'}</p>
                                    {author.linkedin && (
                                        <p>
                                            <strong>LinkedIn:</strong>
                                            <a href={author.linkedin} target="_blank" rel="noopener noreferrer" className="linkedin-link">
                                                View Profile
                                            </a>
                                        </p>
                                    )}
                                    <p><strong>Documents:</strong> {author.document_count}</p>
                                    {author.bio && (
                                        <div className="bio-text">
                                            <strong>Biography:</strong>
                                            <p>{author.bio}</p>
                                        </div>
                                    )}
                                </div>
                                <div key={`actions-${author.author_id}`} className="author-actions">
                                    <button 
                                        onClick={() => handleEdit(author)}
                                        className="edit-button"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(author)}
                                        className="delete-button"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-results">No authors found.</div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmAuthor && (
                <div key="delete-modal" className="modal-overlay">
                    <div key="delete-modal-content" className="modal-content delete-confirm">
                        <h2 key="delete-modal-title">Confirm Delete</h2>
                        <p key="delete-modal-text">Are you sure you want to delete {deleteConfirmAuthor.full_name}?</p>
                        {typeof deleteConfirmAuthor.document_count === 'number' && 
                         deleteConfirmAuthor.document_count > 0 && (
                            <p key="delete-modal-warning" className="warning">
                                Warning: This author has {deleteConfirmAuthor.document_count} associated documents.
                            </p>
                        )}
                        <div key="delete-modal-actions" className="modal-actions">
                            <button 
                                key="delete-modal-confirm"
                                onClick={confirmDelete} 
                                className="delete-button"
                            >
                                Delete
                            </button>
                            <button 
                                key="delete-modal-cancel"
                                onClick={() => setDeleteConfirmAuthor(null)} 
                                className="cancel-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <EditModal
                key="edit-modal"
                author={editingAuthor}
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingAuthor(null);
                }}
                onSave={handleSaveEdit}
            />
        </div>
    );
};

export default AuthorListPage;

//cute ko
