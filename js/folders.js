class FolderAnimator {
	constructor(options = {}) {
		this.options = {
			threshold: 0.2,
			staggerDelay: 50,
			initialDelay: 0,
			...options
		};

		this.folders = Array.from(document.querySelectorAll('.folder'));
		this.observer = this.createObserver();
		this.init();
	}

	createObserver() {
		return new IntersectionObserver((entries) => {
			entries.forEach((entry, index) => {
				if (entry.isIntersecting) {
					// Add delay based on the folder's position in the DOM
					const delay = this.folders.indexOf(entry.target) * this.options.staggerDelay;
					setTimeout(() => {
						entry.target.classList.add('visible');
					}, delay);

					// Unobserve after animation is triggered
					this.observer.unobserve(entry.target);
				}
			});
		}, this.options);
	}

	init() {

		setTimeout(() => {
			this.folders.forEach(folder => {
				this.observer.observe(folder);
			});
		}, this.options.initialDelay);
	}
}


