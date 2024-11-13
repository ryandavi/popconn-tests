// Constants for window management
const WINDOW_CONSTANTS = {
	STARTING_Z_INDEX: 100,
	WINDOW_MARGIN: 20,
	ALLOW_MULTIPLE_WINDOWS: true,
	DRAG_THRESHOLD: 5,
	MOBILE_BREAKPOINT: 1024,
	DEFAULT_POSITION: {
		x: '50%',
		y: '50%'
	},
	URL_PARAMS: {
		WINDOW: 'window'
	}
};

class WindowManager {
	constructor() {
		// Initialize state
		this.windows = new Map();
		this.activeWindow = null;
		this.highestZIndex = WINDOW_CONSTANTS.STARTING_Z_INDEX;
		this.isDragging = false;
		this.dragOffset = { x: 0, y: 0 };

		// Cache DOM elements
		this.windowsContainer = document.querySelector('.windows');

		// Bind methods
		this.handleDrag = this.handleDrag.bind(this);
		this.handleDragEnd = this.handleDragEnd.bind(this);

		// Initialize
		this.init();
	}

	init() {
		// Set up event listeners for folder clicks
		document.querySelectorAll('.folders a, .navbar-menu a').forEach(link => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				const windowName = link.getAttribute('href').replace('#', '');
				this.toggleWindow(windowName);  // Changed from openWindow to toggleWindow
			});
		});

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

	handleEscapeKey() {
		if (this.windows.size === 0) return;

		// Find window with highest z-index
		let topWindow = Array.from(this.windows.values())
			.reduce((highest, current) => {
				return parseInt(current.style.zIndex) > parseInt(highest.style.zIndex) ? current : highest;
			});

		this.closeWindow(topWindow);
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

	updateUrl() {
		const openWindows = Array.from(this.windows.keys());
		const params = new URLSearchParams();

		openWindows.forEach(windowName => {
			params.append(WINDOW_CONSTANTS.URL_PARAMS.WINDOW, windowName);
		});

		const newUrl = `${window.location.pathname}${openWindows.length ? '?' + params.toString() : ''}`;
		history.pushState({}, '', newUrl);
	}

	openWindow(windowName, updateHistory = true) {
		const windowElement = document.querySelector(`.window[data-name="${windowName}"]`);
		if (!windowElement) return;

		// Check if we allow multiple windows
		if (!WINDOW_CONSTANTS.ALLOW_MULTIPLE_WINDOWS) {
			this.closeAllWindows();
		}

		// Show and position window
		windowElement.style.display = 'block';
		this.positionWindowInCenter(windowElement);
		this.bringToFront(windowElement);

		// Set up window controls
		this.setupWindowControls(windowElement);

		// Add to tracked windows
		this.windows.set(windowName, windowElement);

		// Update URL if needed
		if (updateHistory) {
			this.updateUrl();
		}
	}

	closeWindow(windowElement) {
		const windowName = windowElement.dataset.name;
		windowElement.style.display = 'none';
		this.windows.delete(windowName);

		if (this.activeWindow === windowElement) {
			this.activeWindow = null;
		}

		this.updateUrl();
	}

	closeAllWindows() {
		this.windows.forEach((window) => {
			window.style.display = 'none';
		});
		this.windows.clear();
		this.activeWindow = null;
	}

	setupWindowControls(windowElement) {
		const header = windowElement.querySelector('.window-header');
		const closeButton = windowElement.querySelector('.close');

		// Set up dragging
		header.addEventListener('mousedown', (e) => this.handleDragStart(e, windowElement));
		header.addEventListener('touchstart', (e) => this.handleDragStart(e, windowElement), { passive: false });

		// Set up close button
		closeButton.addEventListener('click', () => {
			this.closeWindow(windowElement);
		});
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

		// Calculate new position, accounting for scroll
		let newX = event.clientX - this.dragOffset.x + window.scrollX;
		let newY = event.clientY - this.dragOffset.y + window.scrollY;

		// Constrain to container bounds, accounting for scroll
		newX = Math.max(window.scrollX, Math.min(newX, window.scrollX + containerRect.width - windowRect.width));
		newY = Math.max(window.scrollY, Math.min(newY, window.scrollY + containerRect.height - windowRect.height));

		// Apply new position
		this.activeWindow.style.transform = `translate(${newX}px, ${newY}px)`;
	}

	handleDragEnd() {
		if (!this.isDragging || !this.activeWindow) return;

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

		windowElement.style.transform = `translate(${left}px, ${top}px)`;
	}

	bringToFront(windowElement) {
		this.highestZIndex++;
		windowElement.style.zIndex = this.highestZIndex;
		this.activeWindow = windowElement;
	}

	handleResize() {
		// Ensure windows stay within bounds after resize
		this.windows.forEach((windowElement) => {
			const containerRect = this.windowsContainer.getBoundingClientRect();
			const windowRect = windowElement.getBoundingClientRect();

			// Get current transform
			const transform = new DOMMatrix(window.getComputedStyle(windowElement).transform);
			let x = transform.m41;
			let y = transform.m42;

			// Constrain to new bounds
			x = Math.max(0, Math.min(x, containerRect.width - windowRect.width));
			y = Math.max(0, Math.min(y, containerRect.height - windowRect.height));

			windowElement.style.transform = `translate(${x}px, ${y}px)`;
		});
	}
}

// Initialize the window manager when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	new WindowManager();
});