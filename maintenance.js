/**
 * Premium Maintenance Mode for Hive Celeo
 * This script handles the maintenance mode overlay functionality
 */

// Maintenance mode state
let maintenanceActive = false;

// Create and inject the maintenance overlay
function createMaintenanceOverlay() {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'maintenance-overlay';
    overlay.id = 'maintenanceOverlay';
    
    // Create maintenance container
    const container = document.createElement('div');
    container.className = 'maintenance-container';
    
    // Create logo
    const logo = document.createElement('div');
    logo.className = 'maintenance-logo';
    logo.innerHTML = '<i>⚙️</i>';
    
    // Create title
    const title = document.createElement('h2');
    title.className = 'maintenance-title';
    title.textContent = 'Scheduled Maintenance';
    
    // Create message
    const message = document.createElement('p');
    message.className = 'maintenance-message';
    message.innerHTML = 'We are currently performing scheduled maintenance to improve our Hive Celeo services. During this time, some features may be temporarily unavailable. We appreciate your patience as we work to enhance your experience.';
    
    // Create time estimate
    const time = document.createElement('div');
    time.className = 'maintenance-time';
    time.innerHTML = '<span>⏱️</span> Estimated completion: 2 hours';
    
    // Create progress bar
    const progress = document.createElement('div');
    progress.className = 'maintenance-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'maintenance-progress-bar';
    progress.appendChild(progressBar);
    
    // Add progress percentage
    const progressText = document.createElement('div');
    progressText.className = 'progress-percentage';
    progressText.innerHTML = '<span>75%</span> Complete';
    progressText.style.cssText = 'margin-top: 10px; font-size: 0.9rem; color: #bbbbbb; font-weight: 500;';
    
    // Animate progress bar width randomly
    setInterval(() => {
        const randomWidth = 65 + Math.random() * 15; // Between 65% and 80%
        progressBar.style.width = `${randomWidth}%`;
    }, 2000);
    
    // Create contact info
    const contact = document.createElement('div');
    contact.className = 'maintenance-contact';
    contact.innerHTML = 'For urgent inquiries, please contact us at <a href="https://hive.blog/@aftabirshad" target="_blank">@aftabirshad</a>';
    
    // Create close button
    const closeBtn = document.createElement('div');
    closeBtn.className = 'maintenance-close';
    closeBtn.innerHTML = '<span>✕</span>';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent clicks from propagating to the overlay
        
        // Only allow closing if not in true maintenance mode
        if (!maintenanceActive) {
            setMaintenanceMode(false);
        } else {
            // Show message that site is under maintenance
            alert('Sorry, the website is currently under maintenance and cannot be accessed.');
        }
    });
    
    // If in true maintenance mode, hide the close button
    if (maintenanceActive) {
        closeBtn.style.display = 'none';
    }
    
    // Assemble components
    container.appendChild(logo);
    container.appendChild(title);
    container.appendChild(message);
    container.appendChild(time);
    container.appendChild(progress);
    container.appendChild(progressText);
    container.appendChild(contact);
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Handle clicks on overlay to keep it open
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            // Only prevent default behavior, don't close the overlay
            e.preventDefault();
        }
    });
    
    return overlay;
}

// Set maintenance mode state
function setMaintenanceMode(active) {
    maintenanceActive = active;
    
    // Get or create overlay
    let overlay = document.getElementById('maintenanceOverlay');
    if (!overlay) {
        overlay = createMaintenanceOverlay();
    }
    
    // Update class based on state
    if (active) {
        overlay.classList.add('active');
        
        // Disable all interactive elements on the page
        disableWebsiteFunctionality(true);
        
        // Remove close button functionality when in true maintenance mode
        const closeBtn = document.querySelector('.maintenance-close');
        if (closeBtn) {
            closeBtn.style.display = 'none';
        }
    } else {
        overlay.classList.remove('active');
        
        // Re-enable website functionality
        disableWebsiteFunctionality(false);
        
        // Restore close button
        const closeBtn = document.querySelector('.maintenance-close');
        if (closeBtn) {
            closeBtn.style.display = 'flex';
        }
    }
    
    // Return current state for chaining
    return maintenanceActive;
}

// Get maintenance mode state
function getMaintenanceMode() {
    return maintenanceActive;
}

// Initialize after page and loading animation are complete
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS link if not already in the document
    if (!document.querySelector('link[href="maintenance.css"]')) {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = 'maintenance.css';
        document.head.appendChild(linkElement);
    }
    
    // Wait for loading animation to complete fully
    setTimeout(() => {
        // Create the overlay
        createMaintenanceOverlay();
        
        // Activate maintenance mode if it should be active
        if (maintenanceActive) {
            setMaintenanceMode(true);
        }
    }, 5000); // Increased timeout to ensure loading animation completes
});

// Expose maintenance functions globally
window.setMaintenanceMode = setMaintenanceMode;
window.getMaintenanceMode = getMaintenanceMode;

// Function to disable all website functionality
function disableWebsiteFunctionality(disable) {
    // Get all interactive elements
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
    
    if (disable) {
        // Disable all interactive elements
        interactiveElements.forEach(element => {
            // Save original state
            element.dataset.originalTabIndex = element.getAttribute('tabindex');
            element.dataset.originalPointerEvents = element.style.pointerEvents;
            
            // Disable element
            element.setAttribute('tabindex', '-1');
            element.style.pointerEvents = 'none';
            
            if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
                element.dataset.originalDisabled = element.disabled;
                element.disabled = true;
            }
        });
        
        // Prevent scrolling
        document.body.style.overflow = 'hidden';
        
        // Block all click events
        document.addEventListener('click', blockClickEvents, true);
        document.addEventListener('touchstart', blockClickEvents, true);
        document.addEventListener('keydown', blockKeyboardEvents, true);
    } else {
        // Re-enable all interactive elements
        interactiveElements.forEach(element => {
            // Restore original state
            if (element.dataset.originalTabIndex) {
                element.setAttribute('tabindex', element.dataset.originalTabIndex);
            } else {
                element.removeAttribute('tabindex');
            }
            
            if (element.dataset.originalPointerEvents) {
                element.style.pointerEvents = element.dataset.originalPointerEvents;
            } else {
                element.style.pointerEvents = '';
            }
            
            if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
                if (element.dataset.originalDisabled === 'false') {
                    element.disabled = false;
                }
            }
        });
        
        // Re-enable scrolling
        document.body.style.overflow = '';
        
        // Remove event blockers
        document.removeEventListener('click', blockClickEvents, true);
        document.removeEventListener('touchstart', blockClickEvents, true);
        document.removeEventListener('keydown', blockKeyboardEvents, true);
    }
}

// Event handler to block clicks
function blockClickEvents(e) {
    // Allow clicks only on the maintenance overlay elements
    if (!e.target.closest('.maintenance-container')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}

// Event handler to block keyboard events
function blockKeyboardEvents(e) {
    // Block most keyboard events
    if (e.key !== 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
} 