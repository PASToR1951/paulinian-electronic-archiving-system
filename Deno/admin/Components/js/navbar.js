fetch('side_bar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('side-bar').innerHTML = data;

        // ✅ Run active icon logic after injection
        highlightActiveSidebarLink();
    })
    .catch(error => console.error('Error loading sidebar:', error));

// 👇 Function to highlight the active sidebar link
function highlightActiveSidebarLink() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('#side-bar a.icon-wrapper');

    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;

        if (currentPage === linkPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }   
    });
}
