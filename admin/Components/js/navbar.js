fetch('./components/navbar_header.html') 
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(html => {
        document.getElementById('navbar-container').innerHTML = html;

        const themeToggle = document.querySelector('.theme-toggle');
        const darkModeStyle = document.getElementById('dark-mode-style');

        if (themeToggle && darkModeStyle) {
            themeToggle.addEventListener('click', () => {
                darkModeStyle.disabled = !darkModeStyle.disabled;
                if (darkModeStyle.disabled) {
                    localStorage.setItem('darkMode', 'disabled');
                } else {
                    localStorage.setItem('darkMode', 'enabled');
                }
            });
        }
        document.addEventListener('DOMContentLoaded', () => {
            const savedMode = localStorage.getItem('darkMode');
            if (savedMode === 'enabled') {
                darkModeStyle.disabled = false;
            }
        });
    })
    .catch(error => {
        console.error('Error fetching navbar:', error);
        document.getElementById('navbar-container').innerHTML = "<p>Failed to load navbar.</p>";
    });