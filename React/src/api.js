// API functions for communicating with the Deno backend

/**
 * Fetch all authors from the backend
 * @returns {Promise<Array>} Array of author objects
 */
export const fetchAuthors = async () => {
  try {
    console.log('Fetching authors from API...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    const response = await fetch('/api/authors', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorData
      });
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorData.details || 'No details available'}`);
    }
    
    const data = await response.json();
    console.log('Raw API Response:', data);
    
    // Map the data to match the expected format in the frontend
    const mappedData = data.map(author => {
      console.log('Mapping author:', author);
      return {
        id: author.author_id?.toString() || author.id?.toString(),
        name: author.full_name || author.name,
        department: author.department || '',
        email: author.email || '',
        affiliation: author.affiliation || '',
        documentCount: author.document_count || 0,
        orcid: author.orcid_id || '',
        biography: author.bio || '',
        profilePicture: author.profile_picture || '',
        yearOfGraduation: author.year_of_graduation || '',
        linkedin: author.linkedin || '',
        gender: author.gender || 'M'
      };
    });
    
    console.log('Mapped authors:', mappedData);
    return mappedData;
  } catch (error) {
    console.error('Error fetching authors:', error);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 25 seconds');
    }
    throw error;
  }
};

/**
 * Fetch a single author by ID
 * @param {number} id - The author ID
 * @returns {Promise<Object>} Author object
 */
export const fetchAuthorById = async (id) => {
  try {
    const response = await fetch(`/api/authors/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      id: data.author_id,
      name: data.full_name || data.name,
      department: data.department,
      email: data.email,
      affiliation: data.affiliation,
      documentCount: data.document_count || 0,
      orcid: data.orcid_id,
      biography: data.bio,
      profilePicture: data.profile_picture,
      yearOfGraduation: data.year_of_graduation,
      linkedin: data.linkedin
    };
  } catch (error) {
    console.error(`Error fetching author with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch documents by author ID
 * @param {number} authorId - The author ID
 * @returns {Promise<Array>} Array of document objects
 */
export const fetchDocumentsByAuthor = async (authorId) => {
  try {
    const response = await fetch(`/api/authors/${authorId}/documents`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching documents for author ${authorId}:`, error);
    throw error;
  }
};

/**
 * Update an author in the database
 * @param {string} id - The author's ID
 * @param {Object} authorData - The updated author data
 * @returns {Promise<Object>} Updated author object
 */
export const updateAuthor = async (id, authorData) => {
  try {
    console.log('Updating author in database:', { id, authorData });
    
    // Convert year_of_graduation to number or null if empty
    const yearOfGraduation = authorData.yearOfGraduation 
      ? parseInt(authorData.yearOfGraduation, 10) || null 
      : null;
    
    const response = await fetch(`/api/authors/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        full_name: authorData.name,
        department: authorData.department || null,
        email: authorData.email || null,
        affiliation: authorData.affiliation || null,
        orcid_id: authorData.orcid || null,
        bio: authorData.biography || null,
        profile_picture: authorData.profilePicture || null,
        gender: authorData.gender || null,
        year_of_graduation: yearOfGraduation,
        linkedin: authorData.linkedin || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorData
      });
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorData.details || 'No details available'}`);
    }

    const data = await response.json();
    console.log('Author updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating author:', error);
    throw error;
  }
}; 