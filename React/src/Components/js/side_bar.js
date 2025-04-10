async function loadSidebar() {
    try {
        const response = await fetch("/sidebar");
        if (!response.ok) throw new Error("Failed to load sidebar");

        const sidebarItems = await response.json();
        const sidebarContainer = document.querySelector(".icon-container .middle-group");
        if (!sidebarContainer) return;

        sidebarContainer.innerHTML = ""; // Clear existing links

        sidebarItems.forEach(item => {
            const link = document.createElement("a");
            link.href = item.href;
            link.classList.add("icon-wrapper");
            link.innerHTML = `
                <div class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-${item.icon}">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    </svg>
                </div>
                <span class="icon-text">${item.text}</span>
            `;
            sidebarContainer.appendChild(link);
        });
    } catch (error) {
        console.error("Error loading sidebar:", error);
    }
}

// Load sidebar when the page is ready
document.addEventListener("DOMContentLoaded", loadSidebar);
