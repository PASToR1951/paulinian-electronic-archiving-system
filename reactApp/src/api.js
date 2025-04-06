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
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorData.details || 'No details available'}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.length} authors`);
    return data;
  } catch (error) {
    console.error('Error fetching authors:', error);
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
    return data;
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