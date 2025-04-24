/**
 * Welcome Popup for Hive Celeo
 * This popup will only appear the first time a user visits the website
 * and will show after the loading animation completes
 */

// For debugging purposes - set to false to only show on first visit
const FORCE_SHOW_POPUP = false;

// Check if this is the user's first visit
function checkFirstVisit() {
    // Check if the user has visited before using localStorage
    const hasVisitedBefore = localStorage.getItem('hive_celeo_visited');
    
    // If this is their first visit, set up to show the popup after exactly 6 seconds
    if (!hasVisitedBefore || FORCE_SHOW_POPUP) {
        // Show popup after exactly 6 seconds (after loading animation)
        setTimeout(showWelcomePopup, 6000);
    }
}

// Create and show the welcome popup
function showWelcomePopup() {
    // Create container
    const welcomeContainer = document.createElement('div');
    welcomeContainer.className = 'welcome-container';
    
    // Create popup content
    const popup = document.createElement('div');
    popup.className = 'welcome-popup';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'welcome-header';
    
    // Add logo
    const logo = document.createElement('div');
    logo.className = 'welcome-logo';
    const logoImg = document.createElement('img');
    logoImg.src = 'https://images.hive.blog/DQmequWDrGNVj9M38baSZEUB7dr7QQU5Z6DQj2bWfvTebGH/MeControlXXLUserTile%20(1).jpeg';
    logoImg.alt = 'Hive Celeo Logo';
    logo.appendChild(logoImg);
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Welcome to Hive Celeo';
    
    // Add subtitle
    const subtitle = document.createElement('div');
    subtitle.className = 'welcome-subtitle';
    subtitle.textContent = 'Your premium Hive blockchain statistics dashboard';
    
    // Assemble header
    header.appendChild(logo);
    header.appendChild(title);
    header.appendChild(subtitle);
    
    // Create message
    const message = document.createElement('p');
    message.textContent = 'Thank you for visiting Hive Celeo! Explore comprehensive blockchain analytics, track your account performance, and discover trending content all in one place.';
    
    // Create features section
    const featuresSection = document.createElement('div');
    featuresSection.className = 'welcome-features';
    
    // Feature items
    const features = [
        { icon: '📊', text: 'Real-time statistics' },
        { icon: '🔍', text: 'Account analytics' },
        { icon: '📈', text: 'Engagement metrics' },
        { icon: '🏆', text: 'Performance rankings' }
    ];
    
    features.forEach(feature => {
        const featureItem = document.createElement('div');
        featureItem.className = 'feature-item';
        
        const featureIcon = document.createElement('div');
        featureIcon.className = 'feature-icon';
        featureIcon.textContent = feature.icon;
        
        const featureText = document.createElement('div');
        featureText.className = 'feature-text';
        featureText.textContent = feature.text;
        
        featureItem.appendChild(featureIcon);
        featureItem.appendChild(featureText);
        featuresSection.appendChild(featureItem);
    });
    
    // Create get started button
    const startBtn = document.createElement('button');
    startBtn.className = 'welcome-btn';
    startBtn.textContent = 'Get Started';
    startBtn.addEventListener('click', () => {
        hideWelcomePopup();
        // Mark that the user has visited
        localStorage.setItem('hive_celeo_visited', 'true');
    });
    
    // Assemble popup
    popup.appendChild(header);
    popup.appendChild(message);
    popup.appendChild(featuresSection);
    popup.appendChild(startBtn);
    
    welcomeContainer.appendChild(popup);
    document.body.appendChild(welcomeContainer);
    
    // Add CSS if not already in document
    if (!document.querySelector('link[href="welcome.css"]')) {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = 'welcome.css';
        document.head.appendChild(linkElement);
    }
    
    // Make the popup visible after a short delay
    setTimeout(() => {
        welcomeContainer.classList.add('visible');
    }, 100);
}

// Hide the welcome popup
function hideWelcomePopup() {
    const welcomeContainer = document.querySelector('.welcome-container');
    if (welcomeContainer) {
        welcomeContainer.classList.remove('visible');
        
        // Remove after fade-out animation completes
        setTimeout(() => {
            welcomeContainer.remove();
        }, 500);
    }
}

// Run the check when the page loads
document.addEventListener('DOMContentLoaded', checkFirstVisit);

// Expose functions for external use
window.showWelcomePopup = showWelcomePopup;
window.hideWelcomePopup = hideWelcomePopup; 