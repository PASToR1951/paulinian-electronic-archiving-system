// Function to check if user is a guest
function isGuestUser() {
    // Check if user is logged in by looking for auth token or user data
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    return !authToken && !userData;
}

// Function to check if user has access to a document
async function checkDocumentAccess(documentId) {
    try {
        // If user is a guest, show request form immediately
        if (isGuestUser()) {
            console.log('Guest user detected, showing request form');
            showRequestForm(documentId);
            return false;
        }

        // For logged-in users, check their access
        const response = await fetch(`/api/documents/${documentId}/access`);
        const data = await response.json();
        
        if (data.hasAccess) {
            return true;
        } else {
            // Show request form for non-guest users without access
            console.log('User does not have access, showing request form');
            showRequestForm(documentId);
            return false;
        }
    } catch (error) {
        console.error('Error checking document access:', error);
        // Show request form on error for guest users
        if (isGuestUser()) {
            console.log('Error occurred for guest user, showing request form');
            showRequestForm(documentId);
        }
        return false;
    }
}

// Ensure document-request.css is loaded
function ensureStylesLoaded() {
    if (!document.getElementById('document-request-styles')) {
        const link = document.createElement('link');
        link.id = 'document-request-styles';
        link.rel = 'stylesheet';
        link.href = '/css/document-request.css';
        document.head.appendChild(link);
        console.log('Document request styles loaded');
    }
}

// Function to show the request form
function showRequestForm(documentId) {
    console.log('Showing request form for document:', documentId);
    
    // Ensure styles are loaded
    ensureStylesLoaded();
    
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Create modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
        <h2>Request Document Access</h2>
        <button type="button" class="modal-close-btn">&times;</button>
    `;
    
    // Create modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    // Create form HTML
    modalBody.innerHTML = `
        <form id="documentRequestForm">
            <div class="form-group">
                <label for="fullName">Full Name *</label>
                <input type="text" id="fullName" name="fullName" required placeholder="Enter your full name">
                <div class="error-message" id="fullNameError"></div>
            </div>

            <div class="form-group">
                <label for="email">Email *</label>
                <input type="email" id="email" name="email" required placeholder="Enter your email address">
                <div class="error-message" id="emailError"></div>
            </div>

            <div class="form-group">
                <label for="affiliation">Affiliation *</label>
                <input type="text" id="affiliation" name="affiliation" required placeholder="Enter your institution/organization">
                <div class="error-message" id="affiliationError"></div>
            </div>

            <div class="form-group">
                <label for="reason">Reason(s) for Access *</label>
                <select id="reason" name="reason" required>
                    <option value="">Select a reason</option>
                    <option value="research">Research</option>
                    <option value="academic">Academic Study</option>
                    <option value="personal">Personal Interest</option>
                    <option value="other">Other</option>
                </select>
                <div class="error-message" id="reasonError"></div>
            </div>

            <div class="form-group">
                <label for="reasonDetails">Reason Details *</label>
                <textarea id="reasonDetails" name="reasonDetails" required placeholder="Please provide more details about your request"></textarea>
                <div class="error-message" id="reasonDetailsError"></div>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Submit Request</button>
            </div>

            <div class="success-message" id="successMessage">
                Your request has been submitted successfully. We will review it and get back to you soon.
            </div>
        </form>
    `;
    
    // Assemble the modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalOverlay.appendChild(modalContent);
    
    // Add modal to document body
    document.body.appendChild(modalOverlay);
    
    // Store the document ID
    modalOverlay.dataset.documentId = documentId;
    
    // Initialize form handlers
    initializeRequestForm(modalOverlay);
}

// Function to initialize the request form handlers
function initializeRequestForm(modalElement) {
    const form = modalElement.querySelector('#documentRequestForm');
    const closeBtn = modalElement.querySelector('.btn-secondary');
    const modalCloseBtn = modalElement.querySelector('.modal-close-btn');
    
    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            document_id: modalElement.dataset.documentId,
            full_name: form.querySelector('#fullName').value,
            email: form.querySelector('#email').value,
            affiliation: form.querySelector('#affiliation').value,
            reason: form.querySelector('#reason').value,
            reason_details: form.querySelector('#reasonDetails').value
        };
        
        console.log('Submitting form data:', formData);
        
        try {
            // Send request to server
            const response = await fetch('/api/document-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                // Show success message
                const successMessage = form.querySelector('#successMessage');
                successMessage.classList.add('visible');
                
                // Reset form fields
                form.reset();
                
                // Hide form elements
                const formGroups = form.querySelectorAll('.form-group, .form-actions');
                formGroups.forEach(group => {
                    group.style.display = 'none';
                });
                
                // Close form after 3 seconds
                setTimeout(() => {
                    modalElement.remove();
                }, 3000);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to submit request');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Error submitting request. Please try again.');
        }
    });
    
    // Handle close button
    closeBtn.addEventListener('click', () => {
        modalElement.remove();
    });
    
    // Handle modal close button
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            modalElement.remove();
        });
    }
    
    // Close modal when clicking outside
    modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement) {
            modalElement.remove();
        }
    });
}

// Export functions for use in other files
window.documentAccess = {
    checkDocumentAccess,
    showRequestForm
}; 