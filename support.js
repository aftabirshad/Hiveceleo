/**
 * Premium Support & Donation System for Hive Celeo
 * Shows a premium donation popup after 30 seconds
 */

// Control flag - set to false to disable the donation popup
let SHOW_SUPPORT_POPUP = true;

// Timer for showing the popup (30 seconds)
const SUPPORT_POPUP_DELAY = 30000;

// Initialize the support system
function initSupportSystem() {
    if (!SHOW_SUPPORT_POPUP) return;
    
    // Create and inject the CSS if needed
    if (!document.getElementById('support-styles')) {
        const head = document.head || document.getElementsByTagName('head')[0];
        const link = document.createElement('link');
        link.id = 'support-styles';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'support.css';
        link.media = 'all';
        head.appendChild(link);
    }
    
    // Set timer to show the support popup
    setTimeout(() => {
        showSupportPopup();
    }, SUPPORT_POPUP_DELAY);
}

// Create and show the support popup
function showSupportPopup() {
    // Check if popup already exists
    if (document.getElementById('support-popup')) return;
    
    // Create the popup container
    const popupContainer = document.createElement('div');
    popupContainer.id = 'support-popup-container';
    
    // Create the popup content
    const popup = document.createElement('div');
    popup.id = 'support-popup';
    popup.className = 'support-popup';
    
    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.className = 'support-close-btn';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = hideSupportPopup;
    
    // Create the header
    const header = document.createElement('div');
    header.className = 'support-header';
    
    const title = document.createElement('h2');
    title.textContent = 'Support Hive Celeo';
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Help us improve and add more premium features';
    
    header.appendChild(title);
    header.appendChild(subtitle);
    
    // Create the support options
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'support-options';
    
    // Hive donation option
    const hiveOption = createSupportOption(
        'Donate HIVE',
        'Enter amount to donate HIVE',
        'hiveOption',
        'hive'
    );
    
    // HBD donation option
    const hbdOption = createSupportOption(
        'Donate HBD',
        'Enter amount to donate HBD',
        'hbdOption',
        'hbd'
    );
    
    // Feature request option
    const featureOption = createSupportOption(
        '💡 Request Feature',
        'Let us know what premium features you\'d like to see',
        'featureOption',
        'feature'
    );
    
    // Add options to container
    optionsContainer.appendChild(hiveOption);
    optionsContainer.appendChild(hbdOption);
    optionsContainer.appendChild(featureOption);
    
    // Add premium badge
    const premiumBadge = document.createElement('div');
    premiumBadge.className = 'premium-badge';
    premiumBadge.innerHTML = '✨ Celeo Support';
    popup.appendChild(premiumBadge);
    
    // Add footer text
    const footer = document.createElement('div');
    footer.className = 'support-footer';
    footer.innerHTML = 'Thank you for using Hive Celeo! Your support helps us add more premium features.';
    
    // Assemble the popup
    popup.appendChild(closeButton);
    popup.appendChild(header);
    popup.appendChild(optionsContainer);
    popup.appendChild(footer);
    
    // Add the popup to the container
    popupContainer.appendChild(popup);
    
    // Add the container to the body
    document.body.appendChild(popupContainer);
    
    // Add animation class after a small delay to trigger animation
    setTimeout(() => {
        popupContainer.classList.add('active');
    }, 10);
    
    // Save in local storage that we've shown the popup
    localStorage.setItem('support_popup_shown', Date.now().toString());
}

// Create a support option element
function createSupportOption(title, description, id, type) {
    const option = document.createElement('div');
    option.className = 'support-option';
    option.id = id;

    // Add Hive/HBD token logo
    if (type === 'hive' || type === 'hbd') {
        const logoImg = document.createElement('img');
        logoImg.src = type === 'hive'
            ? 'https://images.hive.blog/DQmXeAd97RwVVEwWYkf5nSneAN4g7f5fpbZiFWHSQNgBo23/download%20(5).png'
            : 'https://images.hive.blog/DQmYTgPWsWsuDQBnzPW8iTo4fWFyxE9hjZ49rEHGVGcE5vD/download%20(6).png';
        logoImg.alt = type.toUpperCase() + ' Logo';
        logoImg.className = 'token-logo';
        option.appendChild(logoImg);
    }

    const optionTitle = document.createElement('h3');
    optionTitle.textContent = title;
    
    const optionDesc = document.createElement('p');
    optionDesc.textContent = description;
    
    const amountInput = document.createElement('input');
    amountInput.type = 'text';
    amountInput.className = 'amount-input';
    amountInput.placeholder = 'Enter amount';
    amountInput.style.display = 'none';
    
    // Make input field interactive
    amountInput.setAttribute('inputmode', 'decimal');
    amountInput.addEventListener('focus', function() {
        this.select();
    });
    
    // Clear error state on input
    amountInput.addEventListener('input', function() {
        this.classList.remove('error');
    });
    
    const optionButton = document.createElement('button');
    
    // Set different behavior for feature request option
    if (type === 'feature') {
        optionButton.textContent = 'Comment on Latest Post';
        optionButton.onclick = () => {
            window.open('https://hive.blog/@aftabirshad', '_blank');
            hideSupportPopup();
        };
        // Don't add the amount input for feature request
        option.appendChild(optionTitle);
        option.appendChild(optionDesc);
        option.appendChild(optionButton);
    } else {
        optionButton.textContent = 'Select';
        optionButton.onclick = () => {
            if (amountInput.style.display === 'none') {
                amountInput.style.display = 'block';
                optionButton.textContent = 'Donate';
                
                // Focus on the input field after displaying it
                setTimeout(() => {
                    amountInput.focus();
                }, 50);
            } else {
                const amount = amountInput.value.trim();
                if (amount) {
                    // Validate amount as a proper number and format it
                    const parsedAmount = parseFloat(amount);
                    if (isNaN(parsedAmount) || parsedAmount <= 0) {
                        amountInput.classList.add('error');
                        amountInput.value = '';
                        amountInput.placeholder = 'Please enter a valid amount';
                        return;
                    }
                    
                    // Format amount to 3 decimal places
                    const formattedAmount = parsedAmount.toFixed(3);
                    
                    const memo = 'Support for Hive Celeo';
                    let url;
                    if (type === 'hive') {
                        url = `https://hivesigner.com/sign/transfer?to=aftabirshad&amount=${formattedAmount}%20HIVE&memo=${encodeURIComponent(memo)}`;
                    } else if (type === 'hbd') {
                        url = `https://hivesigner.com/sign/transfer?to=aftabirshad&amount=${formattedAmount}%20HBD&memo=${encodeURIComponent(memo)}`;
                    }
                    window.open(url, '_blank');
                    hideSupportPopup();
                }
            }
        };
        
        option.appendChild(optionTitle);
        option.appendChild(optionDesc);
        option.appendChild(amountInput);
        option.appendChild(optionButton);
    }
    
    return option;
}

// Hide the support popup
function hideSupportPopup() {
    const popupContainer = document.getElementById('support-popup-container');
    if (popupContainer) {
        popupContainer.classList.remove('active');
        popupContainer.classList.add('closing');
        
        // Remove the popup after animation completes
        setTimeout(() => {
            if (popupContainer.parentNode) {
                popupContainer.parentNode.removeChild(popupContainer);
            }
        }, 500);
    }
}

// Check if we should show the popup
function shouldShowPopup() {
    return SHOW_SUPPORT_POPUP;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Always show popup 30 seconds after page load
    setTimeout(() => {
        if (SHOW_SUPPORT_POPUP) {
            initSupportSystem();
        }
    }, SUPPORT_POPUP_DELAY);
}); 