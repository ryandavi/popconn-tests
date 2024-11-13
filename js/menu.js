class MenuController {
    constructor() {
        // Elements
        this.header = document.querySelector('.navbar');
        this.toggle = document.querySelector('#navbar-toggle');
        this.menu = document.querySelector('.navbar-menu');
        this.anchorLinks = document.querySelectorAll('.navbar-menu a[href^="#"]'); // Only select anchor links
        this.toggleLabel = document.querySelector('.navbar-toggle');

        // State
        this.isAnimating = false;
        this.transitionDuration = 300; // ms

        // Bind methods
        this.handleToggleClick = this.handleToggleClick.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleAnchorClick = this.handleAnchorClick.bind(this);
        // this.handleEscapeKey = this.handleEscapeKey.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleFocusTrap = this.handleFocusTrap.bind(this);

        // Initialize
        this.init();
    }

    init() {
        // Add event listeners
        this.toggle.addEventListener('change', this.handleToggleClick);
        this.toggleLabel.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle.checked = !this.toggle.checked;
                this.handleToggleClick();
            }
        });

        // Only add click handling to anchor links
        this.anchorLinks.forEach(link => {
            link.addEventListener('click', this.handleAnchorClick);
        });

        // Handle resize events with debouncing
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(this.handleResize, 250);
        });

        // Handle escape key
        // document.addEventListener('keydown', this.handleEscapeKey);

        // Handle clicks outside menu
        document.addEventListener('click', this.handleClickOutside);

        // Add ARIA attributes
        this.setupA11y();
    }

    setupA11y() {
        this.toggleLabel.setAttribute('aria-expanded', 'false');
        this.toggleLabel.setAttribute('aria-controls', 'navbar-menu');
        this.menu.setAttribute('role', 'navigation');
        this.menu.setAttribute('aria-label', 'Main menu');
    }

    handleToggleClick() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        const isOpen = this.toggle.checked;

        this.toggleLabel.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        document.body.classList.toggle('menu-open', isOpen);
        
        if (isOpen) {
            this.setupFocusTrap();
        }

        setTimeout(() => {
            this.isAnimating = false;
        }, this.transitionDuration);
    }

    handleResize() {
        if (window.innerWidth > 768 && this.toggle.checked) {
            this.toggle.checked = false;
            this.toggleLabel.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        }
    }

    handleAnchorClick(e) {
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        const target = document.querySelector(href);
        
        // Close menu for anchor links
        this.toggle.checked = false;
        this.toggleLabel.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
            
        // Wait for menu transition, then scroll
        setTimeout(() => {
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                target.focus({ preventScroll: true });
            }
        }, this.transitionDuration);
    }

    handleEscapeKey(e) {
        if (e.key === 'Escape' && this.toggle.checked) {
            this.toggle.checked = false;
            this.toggleLabel.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
            this.toggleLabel.focus();
        }
    }

    handleClickOutside(e) {
        if (this.toggle.checked && 
            !this.header.contains(e.target) && 
            !this.menu.contains(e.target)) {
            this.toggle.checked = false;
            this.toggleLabel.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        }
    }

    setupFocusTrap() {
        const focusableElements = this.menu.querySelectorAll(
            'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        this.menu.addEventListener('keydown', this.handleFocusTrap);
        firstFocusable.focus();
    }

    handleFocusTrap(e) {
        if (e.key !== 'Tab') return;

        const focusableElements = this.menu.querySelectorAll(
            'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }
}