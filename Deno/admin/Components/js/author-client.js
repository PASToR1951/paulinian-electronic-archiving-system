// Author search functionality
let authorSearchTimeout;

async function searchAuthors(query) {
    try {
        const response = await fetch(`/api/authors?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error searching authors:', error);
        throw error;
    }
}

function setupAuthorSearch() {
    const authorInput = document.getElementById('authorInput');
    const authorList = document.getElementById('authorList');
    const selectedAuthors = document.getElementById('selectedAuthors');

    if (!authorInput || !authorList || !selectedAuthors) {
        console.error('Required elements not found');
        return;
    }

    authorInput.addEventListener('input', function() {
        clearTimeout(authorSearchTimeout);
        const query = this.value.trim();
        
        if (query === '') {
            authorList.innerHTML = '';
            return;
        }
        
        authorList.innerHTML = '<div class="dropdown-item">Searching...</div>';
        
        authorSearchTimeout = setTimeout(async () => {
            try {
                const authors = await searchAuthors(query);
                
                authorList.innerHTML = '';
                
                if (!Array.isArray(authors)) {
                    console.error('Invalid authors response:', authors);
                    authorList.innerHTML = '<div class="dropdown-item">Error: Invalid response format</div>';
                    return;
                }
                
                if (authors.length === 0) {
                    // Add "Create New Author" option when no authors are found
                    const createOption = document.createElement('div');
                    createOption.className = 'dropdown-item create-author';
                    createOption.innerHTML = `
                        <div class="create-author-text">
                            <span>Create new author: </span>
                            <strong>${query}</strong>
                        </div>
                    `;
                    createOption.addEventListener('click', () => {
                        createNewAuthor(query);
                        authorInput.value = '';
                        authorList.innerHTML = '';
                    });
                    authorList.appendChild(createOption);
                    return;
                }
                
                authors.forEach(author => {
                    const item = document.createElement('div');
                    item.className = 'dropdown-item';
                    item.textContent = author.full_name;
                    item.addEventListener('click', () => {
                        addSelectedAuthor(author);
                        authorInput.value = '';
                        authorList.innerHTML = '';
                    });
                    authorList.appendChild(item);
                });
            } catch (error) {
                console.error('Error searching authors:', error);
                authorList.innerHTML = '<div class="dropdown-item">Error searching authors</div>';
            }
        }, 300);
    });
}

async function createNewAuthor(name) {
    try {
        const response = await fetch('/api/authors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                full_name: name,
                department: '',
                email: '',
                affiliation: '',
                year_of_graduation: null,
                linkedin: '',
                biography: '',
                orcid_id: '',
                profile_picture: '',
                gender: 'M'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newAuthor = await response.json();
        addSelectedAuthor(newAuthor);
    } catch (error) {
        console.error('Error creating new author:', error);
        alert('Failed to create new author. Please try again.');
    }
}

function addSelectedAuthor(author) {
    const authorTag = document.createElement('div');
    authorTag.className = 'selected-author';
    authorTag.innerHTML = `
        ${author.full_name}
        <span class="remove-author" data-id="${author.author_id}">&times;</span>
    `;
    
    authorTag.querySelector('.remove-author').addEventListener('click', () => {
        authorTag.remove();
    });
    
    selectedAuthors.appendChild(authorTag);
    authorInput.value = '';
}

// Initialize author search when the DOM is loaded
document.addEventListener('DOMContentLoaded', setupAuthorSearch); 