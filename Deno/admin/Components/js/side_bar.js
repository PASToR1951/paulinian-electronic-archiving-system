fetch('side_bar.html')
.then(response => response.text())
.then(data => {
    document.getElementById('side-bar').innerHTML = data;
    highlightActiveSidebarLink(); // Call the function after sidebar is injected
})
.catch(error => console.error('Error loading sidebar:', error));

// Highlight active sidebar link
function highlightActiveSidebarLink() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('#side-bar a.icon-wrapper');
    
    console.log("Current page:", currentPage); // Check the current page URL
    console.log("Sidebar links:", navLinks); // Check the selected links

    navLinks.forEach(link => {
        const href = new URL(link.href).pathname;
        console.log("Link href:", href); // Check the href attribute of each link

        if (href === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}