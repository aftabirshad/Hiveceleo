/**
 * Left-to-Right Text Reveal Animation with Shining Effect for Hive Celeo
 */

// Create and inject the text reveal animation
function createTextRevealAnimation() {
    // Create loading container
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-container';
    
    // Create profile image container
    const profileImageContainer = document.createElement('div');
    profileImageContainer.className = 'profile-image';
    
    // Create profile image
    const profileImage = document.createElement('img');
    profileImage.src = 'https://images.hive.blog/DQmequWDrGNVj9M38baSZEUB7dr7QQU5Z6DQj2bWfvTebGH/MeControlXXLUserTile%20(1).jpeg';
    profileImage.alt = 'Profile Image';
    
    // Create text reveal container
    const textReveal = document.createElement('div');
    textReveal.className = 'text-reveal';
    textReveal.style.maxWidth = '90%'; // Ensure text container doesn't overflow on mobile
    
    // Create logo text
    const logoText = document.createElement('h1');
    logoText.textContent = 'HIVE CELEO';
    logoText.style.whiteSpace = 'nowrap'; // Prevent text from wrapping to two lines
    
    // Assemble animation
    profileImageContainer.appendChild(profileImage);
    textReveal.appendChild(logoText);
    loadingContainer.appendChild(profileImageContainer);
    loadingContainer.appendChild(textReveal);
    
    // Add to document
    document.body.appendChild(loadingContainer);
    
    return loadingContainer;
}

// Show text reveal animation
function showTextReveal() {
    if (!document.querySelector('.loading-container')) {
        createTextRevealAnimation();
    }
}

// Hide text reveal animation
function hideTextReveal() {
    document.body.classList.add('loaded');
    
    // Remove the loading container after animation completes
    setTimeout(() => {
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.remove();
        }
        
        // Remove the 'loaded' class after removal
        document.body.classList.remove('loaded');
    }, 1000); // Time to complete fade-out
}

// Initialize animation on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS link if not already in the document
    if (!document.querySelector('link[href="loading.css"]')) {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = 'loading.css';
        document.head.appendChild(linkElement);
    }
    
    // Show text reveal animation immediately
    showTextReveal();
    
    // Auto-hide after animation completes
    setTimeout(hideTextReveal, 6500); // Give enough time for the slower animation to complete
});

// Expose functions for external use
window.showTextReveal = showTextReveal;
window.hideTextReveal = hideTextReveal; 