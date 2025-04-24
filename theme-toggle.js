/**
 * Theme Toggle Functionality for Hive Celeo
 * Allows switching between light and dark mode with animation
 */

// Initialize theme based on user preference or stored setting
document.addEventListener('DOMContentLoaded', () => {
    // Create the theme toggle button
    createThemeToggle();
    
    // Check for saved theme preference or use device preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        enableDarkMode();
    } else {
        enableLightMode();
    }
});

// Create and add the theme toggle button to the page
function createThemeToggle() {
    // Create container
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'theme-toggle-container';
    
    // Create toggle button
    const toggleButton = document.createElement('div');
    toggleButton.className = 'theme-toggle';
    toggleButton.setAttribute('aria-label', 'Toggle dark mode');
    toggleButton.setAttribute('role', 'button');
    toggleButton.setAttribute('tabindex', '0');
    
    // Create sun icon
    const sunIcon = document.createElement('span');
    sunIcon.className = 'toggle-icon sun';
    sunIcon.innerHTML = '☀️';
    
    // Create moon icon
    const moonIcon = document.createElement('span');
    moonIcon.className = 'toggle-icon moon';
    moonIcon.innerHTML = '🌙';
    
    // Create toggle track (the sliding circle)
    const toggleTrack = document.createElement('span');
    toggleTrack.className = 'toggle-track';
    
    // Assemble toggle components
    toggleButton.appendChild(sunIcon);
    toggleButton.appendChild(moonIcon);
    toggleButton.appendChild(toggleTrack);
    toggleContainer.appendChild(toggleButton);
    
    // Add to document
    document.body.appendChild(toggleContainer);
    
    // Add event listener for click
    toggleButton.addEventListener('click', toggleTheme);
    
    // Add event listener for keyboard accessibility
    toggleButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTheme();
        }
    });
}

// Toggle between light and dark themes
function toggleTheme() {
    const isDarkMode = document.body.classList.contains('dark-theme');
    const toggleButton = document.querySelector('.theme-toggle');
    
    if (isDarkMode) {
        enableLightMode();
    } else {
        enableDarkMode();
    }
    
    // Add animation class
    document.body.classList.add('theme-transition');
    
    // Remove animation class after animation completes
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 500);
}

// Enable dark mode
function enableDarkMode() {
    document.body.classList.add('dark-theme');
    document.querySelector('.theme-toggle').classList.add('dark');
    localStorage.setItem('theme', 'dark');
}

// Enable light mode
function enableLightMode() {
    document.body.classList.remove('dark-theme');
    document.querySelector('.theme-toggle').classList.remove('dark');
    localStorage.setItem('theme', 'light');
} 