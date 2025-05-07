/**
 * Basic Webflow compatibility script
 * Handles Webflow animations and transitions
 */

// Basic Webflow namespace setup
window.Webflow = window.Webflow || {};

// Prevent errors from missing Webflow functionality
window.Webflow.push = function() {};
window.Webflow.require = function() { return null; };

// Initialize any components that need setup
document.addEventListener('DOMContentLoaded', function() {
  console.log('Webflow script initialized');
}); 