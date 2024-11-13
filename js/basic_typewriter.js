class Typewriter {
	constructor(options = {}) {
		// Configurable settings with defaults
		this.typeSpeed = options.typeSpeed || 50;         // Speed of typing in milliseconds
		this.startDelay = options.startDelay || 500;      // Delay before starting in milliseconds
		this.elementDelay = options.elementDelay || 500; // Delay between elements in milliseconds
		this.finalCursorHold = options.finalCursorHold || 1500;
		this.cursorClass = options.cursorClass || 'new-cursor';
		this.cursorHTML = options.cursorHTML || '';
		this.activeClass = options.activeClass || 'typing'; // Added for styling purposes

		// Internal properties
		this.elements = [];
		this.currentIndex = 0;
		this.initialized = false;
	}

	init() {
		if (this.initialized) return;
		this.initialized = true;

		// Get all typewriter elements
		const typewriterElements = document.querySelectorAll('.typewriter');

		// Process each element
		typewriterElements.forEach(element => {
			const messageElement = element.querySelector('.message');
			if (!messageElement) return;

			// Store original text and clear it
			const originalText = messageElement.textContent;
			messageElement.textContent = '';
			element.style.display = 'inline-block';

			// Add cursor element (initially hidden)
			const cursor = document.createElement('span');
			cursor.className = this.cursorClass;
			cursor.innerHTML = this.cursorHTML;
			messageElement.appendChild(cursor);

			// Add to elements array
			this.elements.push({
				container: element,
				message: messageElement,
				text: originalText,
				cursor: cursor,
				currentChar: 0
			});
		});

		// Start the animation sequence
		this.typeNextElement(this.startDelay);

	}

	typeNextElement(delay) {

		// Show cursor for current element only
		const element = this.elements[this.currentIndex];
		element.cursor.classList.add('visible');

		setTimeout(() => {
			if (this.currentIndex >= this.elements.length) return;
			element.container.classList.add(this.activeClass);
			this.typeCharacter(element);
		}, delay);
	}

	typeCharacter(element) {
		if (element.currentChar < element.text.length) {
			// Add next character
			element.message.insertBefore(
				document.createTextNode(element.text[element.currentChar]),
				element.cursor
			);
			element.currentChar++;

			// Schedule next character
			setTimeout(() => this.typeCharacter(element), this.typeSpeed);
		} else {
			// Finished typing this element
			element.container.classList.remove(this.activeClass);

            // Move to next element or finish
            this.currentIndex++;
            if (this.currentIndex < this.elements.length) {
                element.cursor.classList.remove('visible');
                this.typeNextElement(this.elementDelay);
            } else {
                // For the last element only, keep cursor visible for 300ms
                setTimeout(() => {
                    element.cursor.classList.remove('visible');
                }, this.finalCursorHold);
            }

			
		}
	}
}