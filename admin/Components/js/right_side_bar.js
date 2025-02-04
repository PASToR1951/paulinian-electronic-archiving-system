// script.js
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggle-btn');

toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});


// Calendar initialization using Flatpickr
flatpickr("#calendar-container", { // Select the calendar container div
  enableTime: false, // Set to true if you need time selection
  dateFormat: "Y-m-d", // Customize the date format
  inline: true, // Display the calendar inline
  // Add other Flatpickr options as needed (e.g., minDate, maxDate, onChange)
});