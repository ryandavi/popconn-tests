class EnhancedTypewriter {
    constructor(options = {}) {
        // Core settings
        this.typeSpeed = options.typeSpeed || 50;
        this.startDelay = options.startDelay || 500;
        this.elementDelay = options.elementDelay || 500;
        this.finalCursorHold = options.finalCursorHold || 500;
        this.cursorClass = options.cursorClass || 'new-cursor';
        this.cursorHTML = options.cursorHTML || '';
        this.activeClass = options.activeClass || 'typing';
        
        // New features
        this.preserveLayout = options.preserveLayout !== false; // Default true
        this.enableAnimations = options.enableAnimations !== false; // Default true
        this.animationType = options.animationType || 'fade'; // fade, slide, bounce
        this.onComplete = options.onComplete || null;
        this.isMobile = this.checkIfMobile();
        
        // Special classes
        this.instantClass = 'typewriter-instant';

        // Internal properties
        this.elements = [];
        this.currentIndex = 0;
        this.initialized = false;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.processElement = this.processElement.bind(this);
        this.typeNextElement = this.typeNextElement.bind(this);
        this.typeCharacter = this.typeCharacter.bind(this);
        
        // Mobile optimization
        if (this.isMobile) {
            this.typeSpeed = Math.max(this.typeSpeed * 0.8, 20);
            this.elementDelay = Math.max(this.elementDelay * 0.8, 300);
        }
    }

    checkIfMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    createWrapper(typewriter) {
        const wrapper = document.createElement('div');
        wrapper.className = 'typewriter-wrapper';
        typewriter.parentNode.insertBefore(wrapper, typewriter);
        wrapper.appendChild(typewriter);
        return wrapper;
    }

    createTypewriterClone(typewriter) {
        const clone = typewriter.cloneNode(true);
        clone.classList.add('clone');
        clone.setAttribute('aria-hidden', 'true');
        return clone;
    }

    processHTMLContent(element) {
        const typewriter = element.closest('.typewriter');
        
        // Create wrapper if it doesn't exist
        const wrapper = typewriter.parentElement.classList.contains('typewriter-wrapper') 
            ? typewriter.parentElement 
            : this.createWrapper(typewriter);
        
        // Create hidden clone of entire typewriter if layout preservation is enabled
        if (this.preserveLayout) {
            const typewriterClone = this.createTypewriterClone(typewriter);
            wrapper.appendChild(typewriterClone);
        }

        // Process and prepare content for typing
        const processNode = (node, result = []) => {
            // Handle elements marked for instant
            if (node.nodeType === Node.ELEMENT_NODE && 
                node.classList.contains(this.instantClass)) {
                result.push({
                    type: 'visible',
                    content: node.cloneNode(true)
                });
                return result;
            }

            // Process child nodes
            if (node.childNodes.length) {
                Array.from(node.childNodes).forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE) {
                        // Split text into individual characters
                        const text = child.textContent;
                        const chars = Array.from(text);
                        chars.forEach(char => {
                            result.push({
                                type: 'char',
                                content: char,
                                parentElement: node.nodeType === Node.ELEMENT_NODE ? node : child.parentElement
                            });
                        });
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        processNode(child, result);
                    }
                });
            }else{
                // nodes like img or br that dont have content
                result.push({
                    type: 'element',
                    content: node.cloneNode(true)
                });
            }

            return result;
        };

        const content = processNode(element);
        element.textContent = ''; // Clear original content
        return content;
    }

    // Rest of the methods remain the same
    applyAnimation(element, type) {
        if (!this.enableAnimations) return;
        
        const animations = {
            fade: {
                keyframes: [
                    { opacity: 0, transform: 'translateY(10px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ],
                options: { duration: 500, easing: 'ease-out' }
            },
            slide: {
                keyframes: [
                    { transform: 'translateX(-20px)', opacity: 0 },
                    { transform: 'translateX(0)', opacity: 1 }
                ],
                options: { duration: 400, easing: 'ease-out' }
            },
            bounce: {
                keyframes: [
                    { transform: 'scale(0.3)', opacity: 0 },
                    { transform: 'scale(1.1)', opacity: 0.7 },
                    { transform: 'scale(1)', opacity: 1 }
                ],
                options: { duration: 600, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }
            }
        };

        const animation = animations[type] || animations.fade;
        element.animate(animation.keyframes, animation.options);
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;

        const typewriterElements = document.querySelectorAll('.typewriter');
        typewriterElements.forEach(this.processElement.bind(this));
        
        // Start the animation sequence
        this.typeNextElement(this.startDelay);
    }

    processElement(container) {
        const messageElement = container.querySelector('.message');
        if (!messageElement) return;


        
        messageElement.innerHTML = messageElement.innerHTML.trim().replace(/^\s+|\s+$/g, '').replace(/\t+/g, '');

        // Store original content and process it
        const processedContent = this.processHTMLContent(messageElement);
        
        // Create cursor element
        const cursor = document.createElement('span');
        cursor.className = this.cursorClass;

        messageElement.appendChild(cursor);

        this.elements.push({
            container,
            message: messageElement,
            content: processedContent,
            cursor,
            currentIndex: 0,
            currentChar: 0,
            currentElement: null
        });
    }

    typeNextElement(delay) {


        const element = this.elements[this.currentIndex];
        element.cursor.classList.add('visible');
        element.container.classList.add(this.activeClass);

        setTimeout(() => {
            this.typeCharacter(element);
        }, delay);
    }

    typeCharacter(element) {
        const content = element.content[element.currentIndex];
        
        if (!content) {
            this.finishElement(element);
            return;
        }

        switch (content.type) {
            case 'instant':
            case 'visible': {
                const node = content.content;
                element.message.insertBefore(node, element.cursor);
                if (content.type === 'instant') {
                    this.applyAnimation(node, this.animationType);
                }
                element.currentIndex++;
                setTimeout(() => this.typeCharacter(element), this.typeSpeed / 2);
                break;
            }
            
            case 'element': {
                const node = content.content;
                element.message.insertBefore(node, element.cursor);
                element.currentIndex++;
                this.typeCharacter(element);
                break;
            }


            case 'char': {
                let container;
                const char = document.createTextNode(content.content);

                if (content.parentElement && content.parentElement !== element.message) {
                    const prevContent = element.currentIndex > 0 ? 
                        element.content[element.currentIndex - 1] : null;
                    
                    if (prevContent && 
                        prevContent.type === 'char' && 
                        prevContent.parentElement === content.parentElement && 
                        element.currentElement) {
                        container = element.currentElement;
                    } else {
                        container = content.parentElement.cloneNode(false);
                        element.message.insertBefore(container, element.cursor);
                        element.currentElement = container;
                    }


                    container.appendChild(char);
                } else {
                    element.message.insertBefore(char, element.cursor);
                    element.currentElement = null;
                }

                element.currentIndex++;
                setTimeout(() => this.typeCharacter(element), this.typeSpeed);
                break;
            }
        }
    }

    finishElement(element) {
        element.container.classList.remove(this.activeClass);
        this.currentIndex++;
        
        if (this.currentIndex < this.elements.length) {
            element.cursor.classList.remove('visible');
            this.typeNextElement(this.elementDelay);
        } else {
            setTimeout(() => {
                element.cursor.classList.remove('visible');
                if(this.onComplete) this.onComplete();
            }, this.finalCursorHold);
        }
    }
}