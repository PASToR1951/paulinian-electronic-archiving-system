fetch('side_bar.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('side-bar').innerHTML = data;
            })
            .catch(error => console.error('Error loading header:', error));