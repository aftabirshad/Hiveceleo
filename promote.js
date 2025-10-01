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
                title: 'Pakistan Zindabad! Let’s build a brighter future together, with unity, faith, and discipline.',
                description: 'Celebrate the spirit of Pakistan! Stand united, work for progress, and keep the green flag flying high every day.',
                imageUrl: 'https://cdn.steemitimages.com/DQmaeoEWSAunoJY7GnYJhb5qrbg6kr4EYsGeRpc5n3YHLeU/ChatGPT%20Image%20Aug%2013,%202025,%2006_24_23%20AM.png',
                buttonText: 'Ae Arz-e-Watan Song',
                buttonLink: 'https://www.youtube.com/watch?v=lB81_u0nQGs&list=RDlB81_u0nQGs&start_radio=1',
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
                title: 'Gaza Relief Mission',
                description: 'The latest updates on the convoy that is going to break the Israeli siege in Gaza are that this convoy is only three days away, and according to Senator Mushtaq Ahmed, Israel has given the task to the Special Bari Commando Task Force to prevent this convoy from entering our borders. Last night the convoy was attacked by 15 drones. Many boats were damaged, but the participants of the convoy are safe and their morale is still high. Senator Mushtaq Ahmed Khan has been posting these videos repeatedly, saying that Pakistanis do not remain silent. Raise your voice for this convoy. Build pressure on the international media. If you remain silent, you will not be able to face the Day of Judgment. There were only four killers of Hazrat Saleh (AS)'s camel, but the entire nation was destroyed. What was the crime of the rest? I will request the Pakistani Social Media Council that if Allah has raised the stature of your voice, then this responsibility falls on us. We have to convince our governments to ensure the safety of this convoy and build pressure on the global media. All people should tag their media contacts in this video, mention them, and go and request them — Allah has given you this honor and such a huge following. If Allah asks what you did to stop innocent children from dying from lack of food, your prayers and worship will count for nothing. When Nimrod threw Hazrat Ibrahim (AS) into the fire, a bird brought water in its beak. It knew that the fire would not be extinguished by it, but it knew that on the Day of Judgment its name would be written among those who extinguished the fire and not among those who ignited it. It is your responsibility to share this video with every influencer you follow. Peace be upon you.',
                imageUrl: 'https://images.hive.blog/DQmbgo1niAUsMBk1BDSofaQjvgj91jJuUdjd2K1CER43GkY/4ab2673b-573f-45a4-a890-c39b5384f92d.png',
                buttonText: 'Read the Latest on Gaza Convoy',
                buttonLink: 'https://apnews.com/article/israel-palestinians-gaza-flotilla-activists-5e7e0e22b2813f00a0b907fae84f9284',
                startDate: new Date('October 1'),
                endDate: new Date('October 3')
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


