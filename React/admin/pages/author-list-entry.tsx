import React from 'react';
import { createRoot } from 'react-dom/client';
import AuthorListPage from './author-list.tsx';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("Author list entry point loaded, looking for mount point...");
  
  // Find the mount point with proper error handling
  const rootElement = document.getElementById('react-author-list');
  
  if (rootElement) {
    console.log("Found mount point #react-author-list, initializing React component");
    
    try {
      const root = createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <AuthorListPage />
        </React.StrictMode>
      );
      console.log("Author list React component mounted successfully");
      
      // Add a class to indicate successful mounting
      rootElement.classList.add('react-mounted');
    } catch (error) {
      console.error("Failed to render React component:", error);
      rootElement.innerHTML = `
        <div class="error-container">
          <h2>Error Rendering Component</h2>
          <p>Error details: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  } else {
    console.error("Mount point #react-author-list not found! Cannot mount React component.");
    // Try to find another container to show the error
    const container = document.querySelector('.container') || document.body;
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-container';
    errorElement.innerHTML = `
      <h2>React Mount Error</h2>
      <p>Could not find the element with ID "react-author-list" to mount the React component.</p>
    `;
    
    container.appendChild(errorElement);
  }
}); 