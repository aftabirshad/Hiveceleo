/**
 * Promotion Manager for Hive Celeo
 * Displays 3D promotional content for holidays, national days, and special events
 */

// Global flag to enable/disable all promotions
const SHOW_PROMOTIONS = true; // Set to true to turn on all promotions

// Load the CSS file if not already present
function loadPromotionCSS() {
    if (!document.getElementById('promotion-styles')) {
        const head = document.head || document.getElementsByTagName('head')[0];
        const link = document.createElement('link');
        link.id = 'promotion-styles';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'promote.css';
        link.media = 'all';
        head.appendChild(link);
    }
}

class PromotionManager {
    constructor() {
        // Container reference
        this.container = null;
        this.currentPromotion = null;
        this.isVisible = false;
        this.isInitialized = false;
        
        // Define promotions with dates, content, and type
        this.promotions = [
            {
                id: 'hive-power',
                type: 'festival',
                title: 'Boost Your Hive Power',
                description: 'Increase your influence on the blockchain! Power up your HIVE to earn more curation rewards and voting impact.',
                imageUrl: 'https://images.hive.blog/DQmaDpzxnHHQqZs1WKhF9hqZXFATgheoFEgjqQGGa7g3f77/0a939254-2cdc-433f-8f65-d2a63142c418.png',
                buttonText: 'Power Up Now',
                buttonLink: 'https://wallet.hive.blog/',
                // Current date range to ensure it shows up immediately
                startDate: new Date(new Date().setDate(new Date().getDate() - 2)),
                endDate: new Date(new Date().setDate(new Date().getDate() + 5))
            },
            {
                id: 'holiday-christmas',
                type: 'holiday',
                title: 'Merry Christmas',
                description: 'Wishing you a joyful holiday season full of peace and prosperity. Check your Hive wallet for special rewards!',
                imageUrl: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf',
                buttonText: 'Check Rewards',
                buttonLink: '#',
                startDate: new Date('December 20'),
                endDate: new Date('December 26')
            },
            {
                id: 'national-independence',
                type: 'national',
                title: 'Independence Day',
                description: 'Celebrate freedom and democracy with special Hive blockchain events. Join the conversation and earn rewards!',
                imageUrl: 'https://images.unsplash.com/photo-1556804335-2fa563e93aae',
                buttonText: 'Join Event',
                buttonLink: '#',
                startDate: new Date('July 2'),
                endDate: new Date('July 5')
            },
            {
                id: 'festival-newyear',
                type: 'festival',
                title: 'Happy New Year',
                description: 'Welcome to a new year of opportunities on Hive. Set your blockchain goals and track your stats with our tools.',
                imageUrl: 'https://images.unsplash.com/photo-1546271876-af6caec5fae4',
                buttonText: 'Set Goals',
                buttonLink: '#',
                startDate: new Date('December 29'),
                endDate: new Date('January 5')
            },
            {
                id: 'special-hivebirthday',
                type: 'festival',
                title: 'Hive Birthday',
                description: 'Celebrating another year of Hive blockchain. Check your account growth and see how far you\'ve come!',
                imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176',
                buttonText: 'View Stats',
                buttonLink: '#',
                startDate: new Date('March 18'),
                endDate: new Date('March 22')
            }
        ];
    }

    // Initialize promotion system
    initialize() {
        if (this.isInitialized) return;
        
        // Exit early if promotions are disabled globally
        if (!SHOW_PROMOTIONS) return;
        
        // Load CSS first
        loadPromotionCSS();
        
        // Check for active promotions
        this.checkActivePromotion();
        
        // Set up listeners for form submission - hide promotion when search happens
        const searchForm = document.querySelector('.search-container form');
        if (searchForm) {
            searchForm.addEventListener('submit', () => {
                this.hidePromotion();
            });
        }
        
        // Add listener for window resize to adjust 3D effects
        window.addEventListener('resize', () => {
            this.adjustForScreenSize();
        });
        
        this.isInitialized = true;
    }

    // Check if there's an active promotion based on the current date
    checkActivePromotion() {
        const today = new Date();
        
        // Set month and day to match current year for comparison
        this.promotions.forEach(promo => {
            promo.startDate.setFullYear(today.getFullYear());
            promo.endDate.setFullYear(today.getFullYear());
            
            // Handle year crossover (Dec to Jan)
            if (promo.startDate > promo.endDate) {
                if (today.getMonth() < 6) { // First half of year
                    promo.startDate.setFullYear(today.getFullYear() - 1);
                } else {
                    promo.endDate.setFullYear(today.getFullYear() + 1);
                }
            }
        });
        
        // Find active promotion
        const activePromotion = this.promotions.find(promo => 
            today >= promo.startDate && today <= promo.endDate
        );
        
        if (activePromotion) {
            this.currentPromotion = activePromotion;
            this.showPromotion(activePromotion);
            return true;
        }
        
        // If no active promotion based on date, always show the first one anyway
        // This ensures a promotion is always visible below the search
        if (this.promotions.length > 0) {
            this.currentPromotion = this.promotions[0];
            this.showPromotion(this.promotions[0]);
            return true;
        }
        
        return false;
    }

    // Create and display the promotion
    showPromotion(promotion) {
        if (this.isVisible) return;
        
        // Create container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'promotion-container';
            
            // Insert after search container
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer) {
                searchContainer.parentNode.insertBefore(this.container, searchContainer.nextSibling);
            } else {
                document.body.appendChild(this.container);
            }
        }
        
        // Create promotion card
        const card = document.createElement('div');
        card.className = `promotion-card ${promotion.type}`;
        
        // Image section
        const imageSection = document.createElement('div');
        imageSection.className = 'promotion-image';
        const image = document.createElement('img');
        image.src = promotion.imageUrl;
        image.alt = promotion.title;
        imageSection.appendChild(image);
        
        // Content section
        const contentSection = document.createElement('div');
        contentSection.className = 'promotion-content';
        
        const title = document.createElement('h3');
        title.className = 'promotion-title';
        title.textContent = promotion.title;
        
        const description = document.createElement('p');
        description.className = 'promotion-description';
        description.textContent = promotion.description;
        
        const button = document.createElement('a');
        button.className = 'promotion-button';
        button.textContent = promotion.buttonText;
        button.href = promotion.buttonLink;
        
        contentSection.appendChild(title);
        contentSection.appendChild(description);
        contentSection.appendChild(button);
        
        // Assemble card
        card.appendChild(imageSection);
        card.appendChild(contentSection);
        
        // Add 3D effect on mouse move
        card.addEventListener('mousemove', (e) => {
            if (window.innerWidth <= 768) return; // Disable on mobile
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateY = ((x - centerX) / centerX) * 5;
            const rotateX = ((y - centerY) / centerY) * -5;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        // Reset transform on mouse leave
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px)';
        });
        
        // Clear existing content and add the new card
        this.container.innerHTML = '';
        this.container.appendChild(card);
        
        // Show with animation
        setTimeout(() => {
            this.container.classList.add('active');
        }, 10);
        
        this.isVisible = true;
    }

    // Hide the promotion with animation
    hidePromotion() {
        if (!this.isVisible || !this.container) return;
        
        this.container.classList.remove('active');
        this.container.classList.add('hidden');
        
        setTimeout(() => {
            this.container.classList.remove('hidden');
            this.container.innerHTML = '';
            this.isVisible = false;
        }, 500);
    }

    // Adjust for screen size
    adjustForScreenSize() {
        if (!this.isVisible || !this.container) return;
        
        const cards = this.container.querySelectorAll('.promotion-card');
        
        cards.forEach(card => {
            if (window.innerWidth <= 768) {
                card.style.transform = 'none';
            } else {
                card.style.transform = 'perspective(1000px)';
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const promotionManager = new PromotionManager();
    promotionManager.initialize();
}); 