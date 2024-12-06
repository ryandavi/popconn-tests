class AlienTerminal {
	constructor() {
		this.TYPING_SPEED = 25;
		this.FAST_PAUSE_AFTER_PUNCTUATION = 200;
		this.SLOW_PAUSE_AFTER_PUNCTUATION = 400;
		this.SYSTEM_SPEED = 10;
		this.INPUT_DELAY = 100;

		this.INITIAL_DELAY = 500;

		this.ENTER_KEY = 'Enter';
		this.PASSWORD = 'alien123';
		this.PASSWORD_LINK = "/layout.html";

		this.CONSOLE_NAME = 'POPCONN';
		this.USER_NAME = 'USER';
		this.NAME_DELIMITER = '>';

		this.PROGRAM_NAME = "POPCONN TERMINAL",
			this.PROGRAM_VERSION = "0.0.1";

		this.FAST_PUNCTUATION = ',:;';
		this.SLOW_PUNCTUATION = '.?!';

		this.isTyping = false;
		this.isMuted = true;
		this.isComplete = false;

		// SOUND
		this.synth = new Tone.Synth().toDestination();
		this.lastPlayTime = 0;
		this.minTimeBetweenSounds = 0.02;
		this.typeNotes = ["C3", "D3"];

		this.startUpLogo = [
			" ___  ___  ___  ___ ___  _  _ _  _ ",
			"| _ \\/ _ \\| _ \\/ __/ _ \\| \\| | \\| |",
			"|  _/ (_) |  _/ (_| (_) | .` | .` |",
			"|_|  \\___/|_|  \\___\\___/|_|\\_|_|\\_|"
		];

		this.openingDialogue = [
			// "WELCOME TO INFINITE COLLABORATION.",
			// "WE'RE REVOLUTIONIZING THE CREATOR ECONOMY.",
			"ENTER THE SECRET PASSWORD NOW."
		];

		this.commands = [
			{
				command: [
					"hi",
					"hii",
					"hello",
					"hey",
					"heyy",
					"hola",
					"how are you",
					"whats up",
					"how are you doing",
					"whats going on",
					"howdy",
					"hows it going",
					"whats going on",
					"hi popconn",
					"hey popconn"
				],
				// type: "random",
				response: [
					"Hello. How may I assist you?",
					"Type 'help' for available commands."
				]
			},
			{
				command: [
					"no",
					"nope",
					"noo",
					"nooo",
					"nooooo",
					"noooooo",
					"nah",
					"negative",
					"wrong",
					"incorrect"
				],
				response: [
					"Yes."
				]
			},
			{
				command: [
					"my name is <name>",
					"i am <name>",
					"call me <name>",
					"my name's <name>",
					"hi i'm <name>"
				],
				response: [
					"Hi <name>. What can I do for you?"
				]
			},
			{
				command: [
					"yes",
					"yeah",
					"yep",
					"yess",
					"yup",
					"affirmative",
					"absolutely",
					"correct"
				],
				response: [
					"No."
				]
			},
			{
				command: [
					"help",
					"help me",
					"commands",
					"controls",
					"command",
					"control",
					"what can you do",
					"what can i do",
					"options",
					"menu",
					"how to use",
					"how to use this",
					"how do i use this",
					"what do i do",
					"instructions",
					"?"
				],
				response: [
					"Available commands: help, about, quit.",
					"Enter the password at any time."
				]
			},
			{
				command: [
					"about",
					"popconn",
					"what is popconn",
					"what does popconn mean",
					"what is this",
					"what",
					"what is this project",
					"what is the point",
					"what is the point of this project",
					"what is the purpose",
					"what is the purpose of this project",
					"what are you",
					"who are you",
					"where am i",
					"whats going on",
					"im scared",
					"explain",
					"tell me more"
				],
				type: "all",
				response: [
					"WE’RE REVOLUTIONIZING THE CREATOR ECONOMY.",
					"ENTER THE SECRET PASSWORD NOW."
				]
			},
			{
				command: [
					"quit",
					"exit",
					"bye",
					"goodbye",
					"see ya",
					"see you",
					"good night",
					"see you later",
					"see you soon",
					"good night",
					"cya",
					"later",
					"bye bye",
					"adios"
				],
				response: this.endConversation.bind(this)
			},
			{
				command: [
					"time",
					"what time",
					"current time",
					"now",
					"what's the time",
					"what time is it",
					"what is the time",
					"what time is it now",
					"what time is it right now",
				],
				response: () => `The current time is ${new Date().toLocaleTimeString()}.`
			},
			{
				command: [
					"date",
					"today",
					"today's date",
					"current date",
					"what is today's date",
					"what day is it",
					"what date is it today",
					"what is the day today"
				],
				response: () => `Today's date is ${new Date().toLocaleDateString()}.`
			},
			{
				command: [
					"password",
					"the password",
					"access",
					"login",
					"whats the password",
					"what is the password",
					"what is the access code",
					"access code",
					"enter the password",
					"secret password",
					"the secret password",
					"what is the secret password",
					"what's the secret password"
				],
				response: ["The password is a secret. Please enter it at any time."]
			},
			{
				command: ["echo <message>", "repeat <message>", "say <message>"],
				response: this.echoMessage.bind(this)
			},
			{
				command: ["who am i", "my name", "username", "what is my name", "what's my name"],
				response: "You are currently identified as USER."
			},
			{
				command: ["weather", "forecast", "whats the weather"],
				response: "I'm sorry, I don't have access to current weather information."
			},

			{
				command: ["calculate", "calc", "math"],
				response: "I'm sorry, I don't have advanced calculation capabilities. Please use a dedicated calculator for accurate results."
			},
			{
				command: ["source", "code", "github", "repo"],
				response: "The source code for this project is not publicly available at this time."
			},
			{
				command: ["version", "ver", "build"],
				response: this.PROGRAM_NAME + " v" + this.PROGRAM_VERSION
			},
			{
				command: [
					"clear",
					"cls",
					"clrscr",
					"clearscreen",
					"empty"
				],
				response: this.clearScreen.bind(this)
			},
			{
				command: [
					"theme <name>",
					"change theme <name>",
					"set theme <name>",
					"color <name>",
					"change color <name>"
				],
				response: this.changeTheme.bind(this)
			},
			{
				command: ["locate <category> <thing>"],
				response: this.findThing.bind(this)
			},

			{
				command: [
					"roll <number> <faces>",
					"dice <number> <faces>",
					"roll dice <number> <faces>",
					"roll <number>d<faces>",
					"dice <number>d<faces>",
					"roll dice <number>d<faces>"
				],
				response: this.rollDice.bind(this)
			},

			{
				command: [
					"random",
					"randomnumber",
					"random <min> <max>",
					"randomnnumber <min> <max>"
				],
				response: this.getRandomNumber.bind(this)
			},


			{
				command: ["ping"],
				response: ["Pong! 🏓", "Response from host: Time=42ms"]
			},

			{
				command: ["ping <host>"],
				response: ["Pong! 🏓", "Response from <host>: Time=42ms"]
			},

			{
				command: ["whois <name>"],
				response: ["Searching... Found: <name> is an enigma of the universe."]
			},
			{
				command: ["404", "not found", "missing", "where is it"],
				response: ["Error 404: Not Found. Did you try turning it off and on again?"]
			},
			{
				command: ["sudo", "sudo <command>"],
				response: ["You are not authorized to perform this action."]
			},
			{
				command: ["chmod", "chmod 777 <file>", "make it executable"],
				response: ["Permission denied: You're not a root user."]
			},
			{
				command: ["cat <file>", "view <file>"],
				response: ["You can’t see the contents of this file. It's classified."]
			},
			{
				command: ["ls", "list", "dir"],
				response: ["You are not authorized to perform this action."]
			}




			/* {
				command: ["help", "commands", "?"],
				response: this.showHelp.bind(this)
			} */

		];

		this.elements = {
			terminal: document.getElementById('terminal'),
			output: document.getElementById('output'),
			input: document.getElementById('input'),
			terminalInput: document.getElementById('terminal-input'),
			muteButton: document.getElementById('mute-button'),
			username: document.getElementById('username'),
			logo: document.getElementById('logo')
		};

		// HISTORY
		this.commandHistory = [];
		this.historyIndex = -1;

		// THEMES
		this.themes = {
			default: { background: '#000', text: '#FFF' },
			blue: { background: '#001', text: '#0FF' },
			red: { background: '#200', text: '#F00' },
			green: { background: '#000', text: '#0F0' },
			effects: { background: '#000', text: '#0F0' },
		};
		this.currentTheme = 'default';

		this.maskHeight = 165; // Set a larger mask size for clarity

		this.init();
	}

	setTerminalMask() {
		const scrollPercentage = this.elements.terminal.scrollTop / (this.elements.terminal.scrollHeight - this.elements.terminal.clientHeight);

		// Divide maskHeight to create smoother gradient transitions
		const maskPosition_0 = Math.min(scrollPercentage * (this.maskHeight / 5), this.maskHeight / 5);
		const maskPosition_1 = Math.min(scrollPercentage * this.maskHeight, this.maskHeight);

		this.elements.terminal.style.maskImage = `linear-gradient(180deg, transparent ${maskPosition_0}px, rgba(0, 0, 0, 1) ${maskPosition_1}px)`;
	}

	init() {
		this.setupEventListeners();
		this.setupUsername();
		this.loadTheme();
		this.setTerminalMask();

		setTimeout(() => {
			this.runStartupSequence();
		}, this.INITIAL_DELAY);

	}

	focusInput() {
		let input = this.elements.input;
		input.focus();
		this.scrollToEnd();
	}

	handleDocumentKeyDown(e) {
		let input = this.elements.input;

		// Check if input exists and is not focused
		if (!this.isTyping && input && document.activeElement !== input) {
			this.focusInput();

			// Set input value correctly
			// Check if the key is a character and append it if it is
			if (e.key.length === 1) {
				input.value += e.key;
			}

			e.preventDefault();  // Prevent the default key behavior
			return; // Exit after focusing and typing
		}
	}

	setupEventListeners() {
		// user input - any
		document.addEventListener('keydown', this.handleDocumentKeyDown.bind(this));

		this.elements.output.addEventListener('click', this.focusInput.bind(this));



		// user input - input element
		this.elements.input.addEventListener('focus', this.scrollToEnd.bind(this));
		this.elements.input.addEventListener('keydown', this.handleKeyDown.bind(this));
		this.elements.input.addEventListener('keydown', this.handleInput.bind(this));
		this.elements.input.addEventListener('focus', () => {
			this.elements.terminalInput.classList.add('focused');
		});

		this.elements.input.addEventListener('blur', () => {
			this.elements.terminalInput.classList.remove('focused');
		});

		// mute button
		this.elements.muteButton.addEventListener('click', this.toggleMute.bind(this));

		//logo click
		this.elements.logo.addEventListener('click', this.scrollToTop.bind(this));

		// mask
		window.addEventListener('resize', this.setTerminalMask.bind(this));
		this.elements.terminal.addEventListener('scroll', this.setTerminalMask.bind(this));
	}

	async scrollToTop(e) {
		e.preventDefault();
		this.elements.terminal.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	}

	async scrollToEnd() {
		this.elements.terminal.scrollTo({
			top: this.elements.terminal.scrollHeight,
			behavior: 'smooth'
		});
	}


	async handleInput(e) {
		if (e.key === this.ENTER_KEY) {
			e.preventDefault();
			const userInput = this.elements.input.value.trim();

			if (userInput) {
				this.elements.input.value = '';
				this.elements.terminalInput.classList.remove('visible');
				await this.typeText(userInput, this.USER_NAME, true);
				await this.processInput(userInput);
			}
		}
	}

	setupUsername() {
		// setup username format for user input for consistency
		this.elements.username.appendChild(this.makeNameDelimiter(this.USER_NAME));
	}

	toggleMute() {
		this.isMuted = !this.isMuted;
		this.elements.muteButton.textContent = this.isMuted ? 'Unmute' : 'Mute';
		if (!this.isMuted) {
			Tone.start();
		}
	}

	makeNameDelimiter(name) {
		const spanName = document.createElement('span');
		spanName.className = 'name';
		spanName.textContent = name;

		const spanDelimiter = document.createElement('span');
		spanDelimiter.className = 'delimiter';
		spanDelimiter.textContent = this.NAME_DELIMITER;

		const container = document.createDocumentFragment();
		container.appendChild(spanName);
		container.appendChild(spanDelimiter);

		return container;
	}

	async playTypeSound() {
		if (!this.isMuted) {
			const now = Tone.now();
			if (now - this.lastPlayTime >= this.minTimeBetweenSounds) {
				const randomNote = this.typeNotes[Math.floor(Math.random() * this.typeNotes.length)];
				this.synth.triggerAttackRelease(randomNote, "32n", now);
				this.lastPlayTime = now;
			}
		}
	}

	async playNewLineSound() {
		if (!this.isMuted) {
			const now = Tone.now();
			if (now - this.lastPlayTime >= this.minTimeBetweenSounds) {
				this.synth.triggerAttackRelease("G3", "16n", now);
				this.lastPlayTime = now;
			}
		}
	}

	async playSuccessSound() {
		if (!this.isMuted) {
		  const now = Tone.now();
		  if (now - this.lastPlayTime >= this.minTimeBetweenSounds) {
			// Play an ascending major chord with slight delays
			// this.synth.triggerAttackRelease("C4", "8n", now);
			// this.synth.triggerAttackRelease("E4", "8n", now + 0.05);
			// this.synth.triggerAttackRelease("G4", "8n", now + 0.1);
			// this.synth.triggerAttackRelease("C5", "8n", now + 0.15);
			
			this.synth.triggerAttackRelease("G2", "32n", now);
			this.synth.triggerAttackRelease("C3", "32n", now + 0.08);
			this.synth.triggerAttackRelease("E4", "8n", now + 0.16);


			this.lastPlayTime = now;
		  }
		}
	  }

	async playErrorSound() {
		if (!this.isMuted) {
			const now = Tone.now();
			if (now - this.lastPlayTime >= this.minTimeBetweenSounds) {
				this.synth.triggerAttackRelease("C2", "12n", now);
				this.synth.triggerAttackRelease("C2", "32n", now + 0.16);
				this.lastPlayTime = now;
			}
		}
	}



	async typeText(text, who = null, auto = false) {
		const lines = Array.isArray(text) ? text : text.split('\n');

		if (lines.length > 0) {
			this.isTyping = true;

			// hide terminal Input
			this.elements.terminalInput.classList.remove('visible');
			this.elements.input.value = '';
			this.elements.input.disabled = true;

			for (const currentText of lines) {

				const messageWrapper = this.createMessageWrapper(who);
				const message = messageWrapper.querySelector('.message');
				const cursor = messageWrapper.querySelector('.new-cursor');

				this.elements.output.appendChild(messageWrapper);

				this.scrollToEnd();

				// if not user
				if (currentText.trim().length > 0 && who !== this.USER_NAME) {
					this.playNewLineSound();
				}

				// if console
				if (who === this.CONSOLE_NAME) {
					await new Promise(resolve => setTimeout(resolve, this.FAST_PAUSE_AFTER_PUNCTUATION));
				}

				const displayText = who === this.CONSOLE_NAME ? currentText.toUpperCase() : currentText;

				if (auto) {
					message.textContent += displayText;
				} else {
					await this.typeTextCharByChar(message, displayText, who);
				}

				cursor.classList.remove('visible');
				messageWrapper.classList.remove('typing');

				if (who === this.CONSOLE_NAME || who === this.USER_NAME) {
					await new Promise(resolve => setTimeout(resolve, this.INPUT_DELAY));
				}
			}
		}

		this.isTyping = false;




		if (!this.isComplete) {
			this.elements.input.disabled = false;

			await new Promise(resolve => setTimeout(resolve, this.INPUT_DELAY));

			this.elements.terminalInput.classList.add('visible');
			setTimeout(() => {
				this.playNewLineSound();
				this.focusInput();
			}, 0);

			// this.scrollToEnd();
		}

	}

	createMessageWrapper(who) {
		const messageWrapper = document.createElement('div');
		messageWrapper.classList.add('console-message', who?.toLowerCase() || 'system');

		if (who === this.CONSOLE_NAME || who === this.USER_NAME) {
			const commandLabel = document.createElement('span');
			commandLabel.classList.add('command-label', 'console');
			commandLabel.appendChild(this.makeNameDelimiter(who));
			messageWrapper.appendChild(commandLabel);
		}

		const message = document.createElement('span');
		message.classList.add('message');
		messageWrapper.appendChild(message);

		const cursor = document.createElement('span');
		cursor.classList.add('new-cursor', 'visible');
		cursor.innerHTML = '&nbsp;';
		messageWrapper.appendChild(cursor);

		messageWrapper.classList.add('typing');

		return messageWrapper;
	}

	async typeTextCharByChar(messageElement, text, who) {
		for (const char of text) {
			if (!this.isTyping) break;

			messageElement.innerHTML += char;
			this.playTypeSound();

			const delay = this.getTypeDelay(char, who);
			await new Promise(resolve => setTimeout(resolve, delay));


		}
	}

	getTypeDelay(char, who) {
		if (who === "ASCII" || who === "SYSTEM") {
			// system wriets faster
			return this.SYSTEM_SPEED;
		} else if (this.FAST_PUNCTUATION.includes(char)) {
			// comma and colons
			return this.FAST_PAUSE_AFTER_PUNCTUATION;
		} else if (this.SLOW_PUNCTUATION.includes(char)) {
			// periods and other punctuation
			return this.SLOW_PAUSE_AFTER_PUNCTUATION;
		} else {
			// normal speed
			return this.TYPING_SPEED;
		}
	}

	handleKeyDown(e) {
		// Handle other keys
		switch (e.key) {
			case this.ENTER_KEY:
				this.handleEnterKey(e);
				break;
			case 'ArrowUp':
				this.navigateHistory(-1);
				e.preventDefault();
				break;
			case 'ArrowDown':
				this.navigateHistory(1);
				e.preventDefault();
				break;
		}
	}

	async handleEnterKey(e) {
		e.preventDefault();
		const userInput = this.elements.input.value.trim();

		if (userInput) {
			this.commandHistory.push(userInput);
			this.historyIndex = -1;
			this.elements.input.value = '';
			this.elements.terminalInput.classList.remove('visible');
			await this.typeText(userInput, this.USER_NAME, true);
			await this.processInput(userInput);
		} else {
			this.playErrorSound();
		}
	}

	navigateHistory(direction) {
		if (direction === -1 && this.historyIndex < this.commandHistory.length - 1) {
			this.historyIndex++;
		} else if (direction === 1 && this.historyIndex > -1) {
			this.historyIndex--;
		}

		if (this.historyIndex > -1) {
			this.elements.input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
		} else {
			this.elements.input.value = '';
		}
	}

	clearScreen() {
		this.elements.output.innerHTML = '';
		return ''; // Return empty string to prevent default command response
	}

	changeTheme(args) {
		const newTheme = args[0];

		if (this.themes[newTheme]) {
			this.currentTheme = newTheme;
			this.loadTheme();
			return `Theme changed to ${newTheme}`;
		} else {
			return `Invalid theme. Available themes: ${Object.keys(this.themes).join(', ')}`;
		}
	}

	loadTheme() {
		const theme = this.themes[this.currentTheme];

		// remove all theme classes
		document.body.classList.forEach(className => {
			if (className.includes('-theme')) {
				document.body.classList.remove(className);
			}
		});

		// add theme
		document.body.classList.add(this.currentTheme + '-theme');
		localStorage.setItem('terminalTheme', this.currentTheme);
	}

	async processInput(input) {
		const cleanInput = input.trim().toLowerCase();

		// PASSWORD
		if (input.trim() === this.PASSWORD) {
			this.isComplete = true;
			this.elements.input.disabled = true;
			this.elements.terminalInput.classList.remove('visible');


			await this.playSuccessSound();

			// Wait for 1 second before typing
			await new Promise(resolve => setTimeout(resolve, 1000));
			await this.typeText("Access granted. Redirecting...", this.CONSOLE_NAME);

			// redirect
			await new Promise(resolve => setTimeout(resolve, 500));
			window.location.href = this.PASSWORD_LINK;

			return;  // Exit after handling the command
		}

		// COMMANDS
		for (const cmd of this.commands) {
			for (const commandPattern of cmd.command) {
				const pattern = this.createRegexFromCommand(commandPattern);
				const match = cleanInput.match(pattern);

				if (match) {
					const args = match.slice(1);  // Extract captured groups as arguments

					console.log(match);

					if (typeof cmd.response === 'function') {
						// function
						const response = cmd.response(args);
						if (response) await this.typeText(response, this.CONSOLE_NAME);
					} else if (cmd.type === "random") {
						// random text response
						const response = cmd.response[Math.floor(Math.random() * cmd.response.length)];
						await this.typeText(this.replaceArguments(response, commandPattern, args), this.CONSOLE_NAME);
					} else {
						// send all responses
						const response = this.replaceArguments(cmd.response, commandPattern, args);
						if (Array.isArray(response)) {
							// loop through foreach
							for (let i = 0; i < response.length; i++) {
								await this.typeText(response[i], this.CONSOLE_NAME);
							}
						} else {
							await this.typeText(response, this.CONSOLE_NAME);
						}
					}

					return;  // Exit after handling the command
				}
			}
		}

		// If no command matched
		await this.playErrorSound();
		this.elements.input.disabled = true;
		this.elements.terminalInput.classList.remove('visible');
		await new Promise(resolve => setTimeout(resolve, 500));
		await this.typeText("Command not recognized. Type 'help' for available commands.", this.CONSOLE_NAME);
	}

	createRegexFromCommand(command) {
		const escapedCommand = command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const pattern = escapedCommand.replace(/<\w+>/g, '(.+)');
		return new RegExp(`^${pattern}$`);
	}

	replaceArguments(response, commandPattern, args) {
		if (Array.isArray(response)) {
			return response.map(item => this.replaceArgumentsInString(item, commandPattern, args));
		}
		return this.replaceArgumentsInString(response, commandPattern, args);
	}

	replaceArgumentsInString(str, commandPattern, args) {
		if (typeof str !== 'string') {
			console.warn('Response item is not a string:', str);
			return String(str);
		}

		const argNames = commandPattern.match(/<(\w+)>/g);
		if (!argNames) return str;

		return argNames.reduce((acc, argName, index) => {
			const cleanArgName = argName.slice(1, -1);  // Remove < and >
			return acc.replace(new RegExp(`<${cleanArgName}>`, 'g'), args[index] || '');
		}, str);
	}

	changeTheme(args) {
		const [newTheme] = args;
		if (this.themes[newTheme]) {
			this.currentTheme = newTheme;
			this.loadTheme();
			return `Theme changed to ${newTheme}`;
		} else {
			return `Invalid theme. Available themes: ${Object.keys(this.themes).join(', ')}`;
		}
	}

	findThing(args) {
		const [category, thing] = args;
		// Implement the logic to find the thing in the category
		return `Searching for ${thing} in category ${category}...`;
	}

	rollDice(args) {
		let [number, faces] = args;
		number = Number(number) || 1;  // default to 1 die
		faces = Number(faces) || 6;    // default to 6-sided die

		let rolls = [];
		for (let i = 0; i < number; i++) {
			rolls.push(Math.floor(Math.random() * faces) + 1);
		}

		const total = rolls.reduce((acc, curr) => acc + curr, 0);
		return `Rolling ${number}d${faces}... Rolls: [${rolls.join(', ')}], Total: ${total}`;
	}

	getRandomNumber(args) {
		let [min, max] = args;
		min = Number(min) || 1;
		max = Number(max) || 100;
		return `Random number between ${min} and ${max}: ` + (Math.floor(Math.random() * (max - min + 1)) + min);
	}


	echoMessage(args) {
		const [message] = args;
		return message || "You didn't provide anything to echo.";
	}

	showHelp() {
		const commandList = this.commands.map(cmd => cmd.command[0]).join(', ');
		return `Available commands: ${commandList}\nUse '<command> help' for more information on a specific command.`;
	}

	endConversation() {
		this.isComplete = true;
		this.elements.terminal.classList.add('complete');
		return "Goodbye.";
	}

	async startupMessage() {
		await this.typeText(this.PROGRAM_NAME + " [v" + this.PROGRAM_VERSION + "]", "ASCII");
		await this.typeText(this.startUpLogo, "ASCII");
		const currentYear = new Date().getFullYear();
		await this.typeText(`© ${currentYear}. All Rights Reserved.`, "ASCII");
		await this.typeText(" ", "ASCII");
	}

	async startDialogue() {
		await this.typeText(this.openingDialogue, this.CONSOLE_NAME);
	}

	async runStartupSequence() {
		await this.startupMessage();
		await this.startDialogue();
	}
}

// Initialize the AlienTerminal
document.addEventListener('DOMContentLoaded', () => {
	new AlienTerminal();
});