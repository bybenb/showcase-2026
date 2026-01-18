// This file contains custom JavaScript functionality for the Songfy application.

// Event listener for DOMContentLoaded to ensure the script runs after the document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            // Logic to handle navigation can be added here
            console.log(`Navigating to ${this.textContent}`);
        });
    });

    // Example function to load song data from JSON
    function loadSongData() {
        fetch('../assets/data.json')
            .then(response => response.json())
            .then(data => {
                console.log(data);
                // Logic to display song data can be added here
            })
            .catch(error => console.error('Error loading song data:', error));
    }

    // Call the function to load song data
    loadSongData();

    // Example player control functionality
    const playButton = document.getElementById('play-button');
    if (playButton) {
        playButton.addEventListener('click', function() {
            // Logic to play the song can be added here
            console.log('Play button clicked');
        });
    }
});