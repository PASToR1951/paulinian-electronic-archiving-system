document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.querySelector('.title'); // Get the title element

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            const tabTitle = tab.getAttribute('data-title'); // Get the title from data attribute

            // Deactivate all tabs and tab contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Activate the clicked tab and its content
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Update the title
            pageTitle.textContent = tabTitle;
        });
    });
});