// Update WINDOW_CONSTANTS
const WINDOW_CONSTANTS = {
    // ... existing constants ...
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
    ALLOW_MULTIPLE_WINDOWS: true,
    ONLY_TOP_WINDOW_IN_URL: true,
    RANDOM_WINDOW_OFFSET: false,
    RANDOM_OFFSET_RANGE: 50,
    REMEMBER_WINDOW_POSITION: false,
    NAV_HEIGHT_OFFSET: 60,
    USE_TRANSFORM_TRANSLATE3D: true,

    // New constants
    SNAP_TO_EDGES: true,
    SNAP_THRESHOLD: 20,
    MINIMIZE_TO_TASKBAR: true,
    TOUCH_MOMENTUM: true,
    MOMENTUM_REDUCTION: 0.95,
    MAX_WINDOWS: 10,
    TRANSITION_DURATION: 150,
    SHORTCUTS: {
        CLOSE: 'Escape',
        NEXT_WINDOW: 'Tab',
        MINIMIZE: 'm',
        MAXIMIZE: 'f'
    },
    STATES: {
        NORMAL: 'normal',
        MINIMIZED: 'minimized',
        MAXIMIZED: 'maximized'
    }
};

class WindowManager {
    constructor() {
        // Existing initialization
        this.windows = new Map();
        this.activeWindow = null;
        this.highestZIndex = WINDOW_CONSTANTS.STARTING_Z_INDEX;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.windowPositions = new Map();
        this.windowsContainer = document.querySelector('.windows');

        // New state properties
        this.windowStates = new Map();
        this.momentum = { x: 0, y: 0 };
        this.lastPosition = { x: 0, y: 0 };
        this.lastTime = 0;
        this.taskbar = this.createTaskbar();

        // Bind methods
        this.handleDrag = this.handleDrag.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleKeyboard = this.handleKeyboard.bind(this);
        this.handleMomentum = this.handleMomentum.bind(this);

        this.navElement = document.querySelector('.navbar-menu') || document.querySelector('nav');

        this.init();
    }

    createTaskbar() {
        const taskbar = document.createElement('div');
        taskbar.className = 'window-taskbar';
        taskbar.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: #f0f0f0;
            border-top: 1px solid #ccc;
            display: flex;
            align-items: center;
            padding: 0 10px;
            z-index: ${WINDOW_CONSTANTS.STARTING_Z_INDEX - 1};
        `;
        document.body.appendChild(taskbar);
        return taskbar;
    }

    init() {
        // Existing initialization
        document.querySelectorAll('.folders a, .navbar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const windowName = link.getAttribute('href').replace('#', '');
                this.toggleWindow(windowName);
            });
        });

        const closeAllButton = document.querySelector('.close-all-windows');
        if (closeAllButton) {
            closeAllButton.addEventListener('click', () => this.closeAllWindows());
        }

        // New initialization
        document.addEventListener('keydown', this.handleKeyboard);
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('popstate', () => this.handleUrlParams());

        this.handleUrlParams();
    }

	handleResize() {
		// Recenter all windows when page resizes
		this.windows.forEach((windowElement) => {
			const containerRect = this.windowsContainer.getBoundingClientRect();
			const windowRect = windowElement.getBoundingClientRect();
			const navHeight = this.navElement ? this.navElement.offsetHeight : WINDOW_CONSTANTS.NAV_HEIGHT_OFFSET;

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

    handleKeyboard(e) {
        if (!this.activeWindow) return;

        const { SHORTCUTS } = WINDOW_CONSTANTS;
        
        switch (e.key.toLowerCase()) {
            case SHORTCUTS.CLOSE:
                this.closeWindow(this.activeWindow);
                break;
            case SHORTCUTS.NEXT_WINDOW:
                if (e.altKey) {
                    e.preventDefault();
                    this.cycleWindows();
                }
                break;
            case SHORTCUTS.MINIMIZE:
                if (e.altKey) {
                    e.preventDefault();
                    this.minimizeWindow(this.activeWindow);
                }
                break;
            case SHORTCUTS.MAXIMIZE:
                if (e.altKey) {
                    e.preventDefault();
                    this.toggleMaximize(this.activeWindow);
                }
                break;
        }
    }

    cycleWindows() {
        if (this.windows.size <= 1) return;

        const windowArray = Array.from(this.windows.values());
        const currentIndex = windowArray.indexOf(this.activeWindow);
        const nextIndex = (currentIndex + 1) % windowArray.length;
        this.bringToFront(windowArray[nextIndex]);
    }

    minimizeWindow(windowElement) {
        const windowName = windowElement.dataset.name;
        const state = this.windowStates.get(windowName) || WINDOW_CONSTANTS.STATES.NORMAL;

        if (state === WINDOW_CONSTANTS.STATES.MINIMIZED) {
            // Restore window
            windowElement.style.display = 'block';
            this.windowStates.set(windowName, WINDOW_CONSTANTS.STATES.NORMAL);
            this.updateTaskbarButton(windowName, false);
        } else {
            // Minimize window
            windowElement.style.display = 'none';
            this.windowStates.set(windowName, WINDOW_CONSTANTS.STATES.MINIMIZED);
            this.updateTaskbarButton(windowName, true);
        }
    }

    updateTaskbarButton(windowName, isMinimized) {
        let button = this.taskbar.querySelector(`[data-window="${windowName}"]`);
        
        if (!button) {
            button = document.createElement('button');
            button.dataset.window = windowName;
            button.className = 'taskbar-button';
            button.style.cssText = `
                padding: 5px 10px;
                margin: 0 5px;
                border: 1px solid #ccc;
                border-radius: 3px;
                background: ${isMinimized ? '#ddd' : '#fff'};
            `;
            button.textContent = windowName;
            button.addEventListener('click', () => this.minimizeWindow(this.windows.get(windowName)));
            this.taskbar.appendChild(button);
        }

        button.style.background = isMinimized ? '#ddd' : '#fff';
    }

    toggleMaximize(windowElement) {
        const windowName = windowElement.dataset.name;
        const state = this.windowStates.get(windowName) || WINDOW_CONSTANTS.STATES.NORMAL;

        if (state === WINDOW_CONSTANTS.STATES.MAXIMIZED) {
            // Restore window
            const savedPosition = this.windowPositions.get(windowName);
            this.setTransform(windowElement, savedPosition.x, savedPosition.y);
            windowElement.style.width = '';
            windowElement.style.height = '';
            this.windowStates.set(windowName, WINDOW_CONSTANTS.STATES.NORMAL);
        } else {
            // Maximize window
            this.windowPositions.set(windowName, {
                x: parseInt(windowElement.style.transform.split('(')[1]),
                y: parseInt(windowElement.style.transform.split(',')[1])
            });
            this.setTransform(windowElement, 0, this.navElement.offsetHeight);
            windowElement.style.width = '100%';
            windowElement.style.height = `calc(100vh - ${this.navElement.offsetHeight}px)`;
            this.windowStates.set(windowName, WINDOW_CONSTANTS.STATES.MAXIMIZED);
        }
    }

    handleDrag(e) {
        if (!this.isDragging || !this.activeWindow) return;

        e.preventDefault();
        const event = e.touches ? e.touches[0] : e;
        const containerRect = this.windowsContainer.getBoundingClientRect();
        const windowRect = this.activeWindow.getBoundingClientRect();
        const navHeight = this.navElement ? this.navElement.offsetHeight : WINDOW_CONSTANTS.NAV_HEIGHT_OFFSET;

        // Calculate new position
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

        // Handle edge snapping
        if (WINDOW_CONSTANTS.SNAP_TO_EDGES) {
            const { SNAP_THRESHOLD } = WINDOW_CONSTANTS;
            
            // Snap to left edge
            if (newX < SNAP_THRESHOLD) newX = 0;
            // Snap to right edge
            if (newX + windowRect.width > containerRect.width - SNAP_THRESHOLD) {
                newX = containerRect.width - windowRect.width;
            }
            // Snap to top edge
            if (newY - window.scrollY < navHeight + SNAP_THRESHOLD) {
                newY = window.scrollY + navHeight;
            }
            // Snap to bottom edge
            if (newY + windowRect.height > containerRect.height - SNAP_THRESHOLD) {
                newY = containerRect.height - windowRect.height;
            }
        }

        // Apply new position with transition
        this.activeWindow.style.transition = `transform ${WINDOW_CONSTANTS.TRANSITION_DURATION}ms ease-out`;
        this.setTransform(this.activeWindow, newX, newY);
    }

    handleDragEnd() {
        if (!this.isDragging || !this.activeWindow) return;

        // Handle momentum
        if (WINDOW_CONSTANTS.TOUCH_MOMENTUM && (Math.abs(this.momentum.x) > 0.1 || Math.abs(this.momentum.y) > 0.1)) {
            this.handleMomentum();
        }

        this.isDragging = false;
        this.activeWindow.style.transition = '';
        
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('touchmove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);
        document.removeEventListener('touchend', this.handleDragEnd);
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


	positionWindowInCenter(windowElement) {
		const containerRect = this.windowsContainer.getBoundingClientRect();
		const windowRect = windowElement.getBoundingClientRect();

		const left = (containerRect.width - windowRect.width) / 2;
		const top = (containerRect.height - windowRect.height) / 2;

		// Apply new centered position
		// windowElement.style.transform = `translate(${left}px, ${top}px)`;
		this.setTransform(windowElement, left, top);
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

        // Initialize window state
        this.windowStates.set(windowName, WINDOW_CONSTANTS.STATES.NORMAL);

        // Show window with transition
        windowElement.style.transition = `transform ${WINDOW_CONSTANTS.TRANSITION_DURATION}ms ease-out`;
        windowElement.style.display = 'block';

        // Position window and update UI
        if (WINDOW_CONSTANTS.REMEMBER_WINDOW_POSITION && this.windowPositions.has(windowName)) {
            const savedPosition = this.windowPositions.get(windowName);
            this.setTransform(windowElement, savedPosition.x, savedPosition.y);
        } else {
            this.positionWindowInCenter(windowElement);
        }

        this.bringToFront(windowElement);
        this.setupWindowControls(windowElement);
        this.windows.set(windowName, windowElement);

        // Add to taskbar if minimizable
        if (WINDOW_CONSTANTS.MINIMIZE_TO_TASKBAR) {
            this.updateTaskbarButton(windowName, false);
        }

        if (updateHistory) {
            this.updateUrl();
        }

        // Reset transition after animation
        setTimeout(() => {
            windowElement.style.transition = '';
        }, WINDOW_CONSTANTS.TRANSITION_DURATION);
    }


	closeWindow(windowElement) {
		const windowName = windowElement.dataset.name;

		// Save position before closing
		const transform = new DOMMatrix(window.getComputedStyle(windowElement).transform);
		this.windowPositions.set(windowName, {
			x: transform.m41,
			y: transform.m42
		});

		windowElement.style.display = 'none';
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
			this.updatePageTitle();  // Add this line
		}

		this.updateUrl();
		this.updateFolderClasses();
	}

	closeAllWindows() {
		this.windows.forEach((window) => {
			window.style.display = 'none';
		});
		this.windows.clear();
		this.activeWindow = null;
		this.updatePageTitle();  // Add this line
		this.updateUrl();
		this.updateFolderClasses();
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
		this.highestZIndex++;
		windowElement.style.zIndex = this.highestZIndex;
		this.activeWindow = windowElement;
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