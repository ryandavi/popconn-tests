// Constants for window management
const WINDOW_CONSTANTS = {
	STARTING_Z_INDEX: 100,
	WINDOW_MARGIN: 20,
	DRAG_THRESHOLD: 5,
	MOBILE_BREAKPOINT: 1024,
	DEFAULT_POSITION: {
		x: '50%',
		y: '50%'
	},
	URL_PARAMS: {
		WINDOW: 'page'
	},

	TITLE: {
		SITE_NAME: 'POPCONN',
		DELIMITER: ' | ',
		DEFAULT: 'Welcome'
	},

	// options
	ALLOW_MULTIPLE_WINDOWS: true,
	ONLY_TOP_WINDOW_IN_URL: true,
	RANDOM_WINDOW_OFFSET: false,
	RANDOM_OFFSET_RANGE: 30,
	REMEMBER_WINDOW_POSITION: false,
	NAV_HEIGHT_OFFSET: 60,
	USE_TRANSFORM_TRANSLATE3D: true, // Enable hardware acceleration

	CLOSE_WINDOWS_BUTTON: true,

    TOUCH_MOMENTUM: false,
    MOMENTUM_REDUCTION: 0.95,
	MAX_WINDOWS: 10
};

class WindowManager {
	constructor() {
		// Initialize state
		this.windows = new Map();
		this.activeWindow = null;
		this.highestZIndex = WINDOW_CONSTANTS.STARTING_Z_INDEX;
		this.isDragging = false;
		this.dragOffset = { x: 0, y: 0 };
		this.windowPositions = new Map(); // Store window positions

		// Cache DOM elements
		this.windowsContainer = document.querySelector('.windows');

        this.momentum = { x: 0, y: 0 };
        this.lastPosition = { x: 0, y: 0 };

		// Bind methods
		this.handleDrag = this.handleDrag.bind(this);
		this.handleDragEnd = this.handleDragEnd.bind(this);
		this.handleMomentum = this.handleMomentum.bind(this);

		this.navElement = document.querySelector('.navbar-menu') || document.querySelector('nav');

		// Initialize
		this.init();
	}

	init() {
		// Set up event listeners for folder clicks
		document.querySelectorAll('.folders a, .navbar-menu a[href^="#"]').forEach(link => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				const windowName = link.getAttribute('href').replace('#', '');
				this.toggleWindow(windowName);
			});
		});

		// Set up close all windows button
		if(WINDOW_CONSTANTS.CLOSE_WINDOWS_BUTTON){
			const closeAllButton = document.querySelector('.close-all-windows');
			if (closeAllButton) {
				closeAllButton.addEventListener('click', () => this.closeAllWindows());
			}
		}

		// Set up URL handling
		this.handleUrlParams();

		// Handle window resize
		window.addEventListener('resize', this.handleResize.bind(this));

		// Set up popstate handler for browser navigation
		window.addEventListener('popstate', () => {
			this.handleUrlParams();
		});

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				this.handleEscapeKey();
			}
		});

	}

    handleMomentum() {
        if (!this.activeWindow) return;

        const applyMomentum = () => {
            const transform = new DOMMatrix(getComputedStyle(this.activeWindow).transform);
            let newX = transform.m41 + this.momentum.x * 16; // 16ms is roughly one frame
            let newY = transform.m42 + this.momentum.y * 16;

            // Apply new position
            this.setTransform(this.activeWindow, newX, newY);

            // Reduce momentum
            this.momentum.x *= WINDOW_CONSTANTS.MOMENTUM_REDUCTION;
            this.momentum.y *= WINDOW_CONSTANTS.MOMENTUM_REDUCTION;

            // Continue animation if momentum is still significant
            if (Math.abs(this.momentum.x) > 0.01 || Math.abs(this.momentum.y) > 0.01) {
                requestAnimationFrame(applyMomentum);
            }
        };

        requestAnimationFrame(applyMomentum);
    }

	handleUrlParams() {
		const params = new URLSearchParams(window.location.search);
		const windowParams = params.getAll(WINDOW_CONSTANTS.URL_PARAMS.WINDOW);

		// Close all windows first
		this.closeAllWindows();

		// Open windows from URL
		if (windowParams.length) {
			windowParams.forEach(windowName => {
				this.openWindow(windowName, false);
			});
		}
	}

	handleEscapeKey() {
		if (this.windows.size === 0) return;

		// Find window with highest z-index
		let topWindow = Array.from(this.windows.values())
			.reduce((highest, current) => {
				return parseInt(current.style.zIndex) > parseInt(highest.style.zIndex) ? current : highest;
			});

		this.closeWindow(topWindow);
	}




	updateFolderClasses() {
		// Remove 'open' class from all folders
		document.querySelectorAll('.folders a, .navbar-menu a').forEach(link => {
			const windowName = link.getAttribute('href').replace('#', '');
			link.classList.remove('open');
		});

		// Add 'open' class to folders of open windows
		this.windows.forEach((_, windowName) => {
			const link = document.querySelector(`a[href="#${windowName}"]`);
			if (link) {
				link.classList.add('open');
			}
		});
	}

	toggleWindow(windowName, updateHistory = true) {
		if (this.windows.has(windowName)) {
			// If window is open, close it
			const windowElement = this.windows.get(windowName);
			this.closeWindow(windowElement);
		} else {
			// If window is closed, open it
			this.openWindow(windowName, updateHistory);
		}
		this.updateFolderClasses();
	}

	updateUrl() {
		const params = new URLSearchParams();

		if (WINDOW_CONSTANTS.ONLY_TOP_WINDOW_IN_URL && this.activeWindow) {
			// Only add the topmost window to URL
			params.append(WINDOW_CONSTANTS.URL_PARAMS.WINDOW, this.activeWindow.dataset.name);
		} else {
			// Add all open windows to URL
			Array.from(this.windows.keys()).forEach(windowName => {
				params.append(WINDOW_CONSTANTS.URL_PARAMS.WINDOW, windowName);
			});
		}

		const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
		history.pushState({}, '', newUrl);
	}

	updateButton(){
		if(WINDOW_CONSTANTS.CLOSE_WINDOWS_BUTTON){
			const closeAllButton = document.querySelector('.close-all-windows');
			if (closeAllButton) {
				if(this.windows.size === 0){
					closeAllButton.classList.remove('visible');
				}else{
					closeAllButton.classList.add('visible');

					if(this.windows.size === 1){
						closeAllButton.textContent = 'Close Window';
					}else if(this.windows.size > 1){
						closeAllButton.textContent = `Close ${this.windows.size} Windows`;
					}
				}
			}
				
		}
	}

	openWindow(windowName, updateHistory = true) {
		
        // Check window limit
        if (this.windows.size >= WINDOW_CONSTANTS.MAX_WINDOWS) {
            console.warn(`Maximum number of windows (${WINDOW_CONSTANTS.MAX_WINDOWS}) reached`);
            return;
        }
		
		const windowElement = document.querySelector(`.window[data-name="${windowName}"]`);
		if (!windowElement) return;

		if (!WINDOW_CONSTANTS.ALLOW_MULTIPLE_WINDOWS) {
			this.closeAllWindows();
		}

		// Show window
		windowElement.classList.add('visible');

		// Position window
		if (WINDOW_CONSTANTS.REMEMBER_WINDOW_POSITION && this.windowPositions.has(windowName)) {
			// Use saved position
			const savedPosition = this.windowPositions.get(windowName);
			// windowElement.style.transform = `translate(${savedPosition.x}px, ${savedPosition.y}px)`;
			this.setTransform(windowElement, savedPosition.x, savedPosition.y);


		} else {
			// Position relative to scroll position
			const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
			const scrollY = window.pageYOffset || document.documentElement.scrollTop;
			const navHeight = 0; //this.navElement ? this.navElement.offsetHeight : WINDOW_CONSTANTS.NAV_HEIGHT_OFFSET;

			let offsetX = 0;
			let offsetY = 0;

			if (WINDOW_CONSTANTS.RANDOM_WINDOW_OFFSET) {
				offsetX = (Math.random() - 0.5) * (WINDOW_CONSTANTS.RANDOM_OFFSET_RANGE * 2);
				offsetY = (Math.random() - 0.5) * (WINDOW_CONSTANTS.RANDOM_OFFSET_RANGE * 2);
			}

			const containerRect = this.windowsContainer.getBoundingClientRect();
			const windowRect = windowElement.getBoundingClientRect();

			const left = scrollX + (containerRect.width - windowRect.width) / 2 + offsetX;
			const top = Math.max(
				scrollY + navHeight,
				scrollY + (containerRect.height - windowRect.height) / 2 + offsetY
			);

			// windowElement.style.transform = `translate(${left}px, ${top}px)`;
			this.setTransform(windowElement, left, top);
		}

		
		this.bringToFront(windowElement);
		this.setupWindowControls(windowElement);
		this.windows.set(windowName, windowElement);
		this.updateButton();

		if (updateHistory) {
			this.updateUrl();
		}
	}

	closeWindow(windowElement) {
		const windowName = windowElement.dataset.name;

		// Save position before closing
		const transform = new DOMMatrix(window.getComputedStyle(windowElement).transform);
		this.windowPositions.set(windowName, {
			x: transform.m41,
			y: transform.m42
		});

        // Remove frontmost class when closing
        windowElement.classList.remove('window-frontmost');
        windowElement.classList.remove('visible');

		this.windows.delete(windowName);

		if (this.activeWindow === windowElement) {
			// Find the next highest z-index window
			let nextActiveWindow = null;
			let highestZ = -1;

			this.windows.forEach((window) => {
				const zIndex = parseInt(window.style.zIndex || 0);
				if (zIndex > highestZ) {
					highestZ = zIndex;
					nextActiveWindow = window;
				}
			});

			this.activeWindow = nextActiveWindow;

            // Add frontmost class to new active window if it exists
            if (nextActiveWindow) {
                nextActiveWindow.classList.add('window-frontmost');
            }

			this.updatePageTitle();  // Add this line
		}

		
		this.updateUrl();
		this.updateFolderClasses();
		this.updateButton();
	}

	closeAllWindows() {
		this.windows.forEach((window) => {
			window.classList.remove('window-frontmost');
			window.classList.remove('visible');
		});

		this.windows.clear();
		this.activeWindow = null;
		this.updatePageTitle();
		this.updateUrl();
		this.updateFolderClasses();
		this.updateButton();
	}

	setupWindowControls(windowElement) {
		const header = windowElement.querySelector('.window-header');
		const closeButton = windowElement.querySelector('.close');

		// Set up dragging
		header.addEventListener('mousedown', (e) => this.handleDragStart(e, windowElement));
		header.addEventListener('touchstart', (e) => this.handleDragStart(e, windowElement), { passive: false });

        // Add ARIA attributes for accessibility
        windowElement.setAttribute('role', 'dialog');
        windowElement.setAttribute('aria-labelledby', `${windowElement.id}-title`);
        
        const titleElement = windowElement.querySelector('.window-title');
        if (titleElement) {
            titleElement.id = `${windowElement.id}-title`;
        }

        closeButton.setAttribute('aria-label', 'Close window');

        // Add keyboard navigation
        windowElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target === windowElement) {
                this.bringToFront(windowElement);
            }
        });

        // Make window focusable
        windowElement.setAttribute('tabindex', '0');


		// Fix mobile close button by adding touchend event
		closeButton.addEventListener('click', (e) => {
			e.preventDefault();
			this.closeWindow(windowElement);
		});
		closeButton.addEventListener('touchend', (e) => {
			e.preventDefault();
			this.closeWindow(windowElement);
		});
	}

	bringToFront(windowElement) {

        // Remove frontmost class from previous active window
        this.windows.forEach((window) => {
            window.classList.remove('window-frontmost');
        });

		this.highestZIndex++;
		windowElement.style.zIndex = this.highestZIndex;
		this.activeWindow = windowElement;

        // Add frontmost class to new active window
        windowElement.classList.add('window-frontmost');

		this.updateButton();
		this.updatePageTitle();
		this.updateUrl();
	}

	handleDragStart(e, windowElement) {
		e.preventDefault();
		if (this.isDragging) return;

		const event = e.touches ? e.touches[0] : e;
		const rect = windowElement.getBoundingClientRect();

		this.isDragging = true;
		this.activeWindow = windowElement;
		this.dragOffset = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};

		// Bring window to front
		this.bringToFront(windowElement);

		// Add event listeners for drag and end
		document.addEventListener('mousemove', this.handleDrag);
		document.addEventListener('touchmove', this.handleDrag, { passive: false });
		document.addEventListener('mouseup', this.handleDragEnd);
		document.addEventListener('touchend', this.handleDragEnd);
	}

	handleDrag(e) {
		if (!this.isDragging || !this.activeWindow) return;

		e.preventDefault();
		const event = e.touches ? e.touches[0] : e;
		const containerRect = this.windowsContainer.getBoundingClientRect();
		const windowRect = this.activeWindow.getBoundingClientRect();

		// Get the navigation height
		const navHeight = 0; //this.navElement ? this.navElement.offsetHeight : WINDOW_CONSTANTS.NAV_HEIGHT_OFFSET;

		// Calculate new position, accounting for scroll
		let newX = event.clientX - this.dragOffset.x + window.scrollX;
		let newY = event.clientY - this.dragOffset.y + window.scrollY;

        // Handle momentum
        if (WINDOW_CONSTANTS.TOUCH_MOMENTUM && e.touches) {
            const currentTime = Date.now();
            const deltaTime = currentTime - this.lastTime;
            
            if (deltaTime > 0) {
                this.momentum.x = (newX - this.lastPosition.x) / deltaTime;
                this.momentum.y = (newY - this.lastPosition.y) / deltaTime;
            }

            this.lastPosition = { x: newX, y: newY };
            this.lastTime = currentTime;
        }

		// Constrain to container bounds, accounting for scroll and nav height
		newX = Math.max(window.scrollX, Math.min(newX, window.scrollX + containerRect.width - windowRect.width));
		newY = Math.max(
			window.scrollY + navHeight, // Add nav height to minimum Y position
			Math.min(newY, window.scrollY + containerRect.height - windowRect.height)
		);

		// Apply new position
		// this.activeWindow.style.transform = `translate(${newX}px, ${newY}px)`;
		this.setTransform(this.activeWindow, newX, newY);
	}

	handleDragEnd() {
		if (!this.isDragging || !this.activeWindow) return;

        // Handle momentum
        if (WINDOW_CONSTANTS.TOUCH_MOMENTUM && (Math.abs(this.momentum.x) > 0.1 || Math.abs(this.momentum.y) > 0.1)) {
            this.handleMomentum();
        }

		// Reset dragging state
		this.isDragging = false;

		// Remove event listeners
		document.removeEventListener('mousemove', this.handleDrag);
		document.removeEventListener('touchmove', this.handleDrag);
		document.removeEventListener('mouseup', this.handleDragEnd);
		document.removeEventListener('touchend', this.handleDragEnd);
	}

	positionWindowInCenter(windowElement) {
		const containerRect = this.windowsContainer.getBoundingClientRect();
		const windowRect = windowElement.getBoundingClientRect();

		const left = (containerRect.width - windowRect.width) / 2;
		const top = (containerRect.height - windowRect.height) / 2;

		// Apply new centered position
		// windowElement.style.transform = `translate(${left}px, ${top}px)`;
		this.setTransform(windowElement, left, top);
	}

	handleResize() {
		// Recenter all windows when page resizes
		this.windows.forEach((windowElement) => {
			const containerRect = this.windowsContainer.getBoundingClientRect();
			const windowRect = windowElement.getBoundingClientRect();
			const navHeight = 0; // this.navElement ? this.navElement.offsetHeight : WINDOW_CONSTANTS.NAV_HEIGHT_OFFSET;

			// Calculate center position
			const left = (containerRect.width - windowRect.width) / 2;
			const top = Math.max(
				navHeight,
				(containerRect.height - windowRect.height) / 2
			);

			// Apply new centered position
			//windowElement.style.transform = `translate(${left}px, ${top}px)`;
			this.setTransform(windowElement, left, top);
		});
	}

	roundPixels(value) {
		return Math.round(value);
	}


	setTransform(element, newX, newY) {
		if (WINDOW_CONSTANTS.USE_TRANSFORM_TRANSLATE3D) {
			element.style.transform = `translate3d(${this.roundPixels(newX)}px, ${this.roundPixels(newY)}px, 0)`;
		}else{
			element.style.transform = `translate(${this.roundPixels(newX)}px, ${this.roundPixels(newY)}px)`;
		}
	}

	// Add this method to WindowManager class
	updatePageTitle() {
		let windowTitle = WINDOW_CONSTANTS.TITLE.DEFAULT;
		if (this.activeWindow) {
			windowTitle = this.activeWindow.querySelector('.window-title')?.textContent ||
				this.activeWindow.dataset.name;
		}

		document.title = `${WINDOW_CONSTANTS.TITLE.SITE_NAME}${WINDOW_CONSTANTS.TITLE.DELIMITER}${windowTitle}`;
	}


}

// Initialize the window manager when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	new WindowManager();
});