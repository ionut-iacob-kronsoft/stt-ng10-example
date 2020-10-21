import { Directive, ElementRef, EventEmitter, OnInit, Output, Renderer2 } from '@angular/core';

@Directive({
	selector: '[speechToText]',
	host: {
		'[class.speech-microphone-host]': 'true'
	}
})
export class SpeechToTextDirective implements OnInit {

	/**
	 * Binding an Output EventEmitter with the same name as the directive
	 * Will emit transcribed values after every session
	 */
	@Output() public speechToText: EventEmitter<string> = new EventEmitter<string>();

	/*
	 * Will contain the speechRecognition instance returned from the native WebSpeech API (if available)
	 */
	private _speechRecognition;
	
	/**
	 * Maintains the status of the transcribing process (true if in progress, false otherwise) 
	 */
	private _recognizing: boolean = false;

	/**
	 * Hosts the current transcribed value, value which is updated dynamically by the native WebSpeech API callbacks
	 * Value is reset after every session ends and value is emitted
	 */
	private _transcript: string = '';

	/**
	 * Reference to the generated icon elemented that is appended to the DOM
	 */
	private _icon: HTMLElement;

	constructor(private _hostRef: ElementRef, private _renderer: Renderer2) {
		// Injected current element reference and renderer service to be used for DOM manipulation
	}

	ngOnInit(): void {
		// Checks if the speechRecognition feature is available for the current browser
		// The check below will work only for the Google Chrome (and Chrome for Android)
		if ('webkitSpeechRecognition' in window) {
			// Only in case the native functionality is available
			// The directive has any effects
			this._createIconToggle();
			this._initSpeechToTextListeners();
		}
		// If more browser support is added, extra cases can be added
	}

	/**
	 * Creates the new DOM microphone icon element
	 * Appends it to the location of the directive host
	 * Attaches 'click' listener to it in order to toggle the speech recognition process
	 */
	private _createIconToggle() {
		// Generate the element
		this._icon = document.createElement('div');
		// Attach a specific class to the element to add further styling
		this._icon.classList.add('speech-microphone-icon');
		// Append the element
		this._renderer.appendChild(this._hostRef.nativeElement, this._icon);
		// Add click event listener
		this._icon.addEventListener('click', () => {
			// Click acts as a toggle
			// If no transcribing is in process, start the process
			if (!this._recognizing) {
				// Attempt to start the Speech-to-text API recognition process
				// At this step the Browser will ask for permissions
				this._speechRecognition.start();
				// Add the disabled icon to be visible (while the user grants the permissions)
				this._icon.classList.add('disabled');
				// If the startup is succesful, the related 'onstart' callback will be called
			} else {
				// If transcribing is in process, stop the process;
				this._speechRecognition.stop();
			}
		});
	}

	private _initSpeechToTextListeners() {
		// Using the Web Speech API is described more in detail
		// In the following link: https://developers.google.com/web/updates/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API
		this._speechRecognition = new window['webkitSpeechRecognition']();
		this._speechRecognition.continuous = true;
		this._speechRecognition.interimResults = true;
		this._speechRecognition.lang = 'en-US';

		// Initialize callbacks

		// Speech recongition started and has permissions
		this._speechRecognition.onstart = () => {
			// Remove the 'disabled' class because the permissions have been given
			this._icon.classList.remove('disabled');
			// Add the active class to apply related styling
			this._icon.classList.add('active');
			// Reset the current transcript value
			this._transcript = '';
			// Set the status to in progress
			this._recognizing = true;
		};

		// Callback fires on every intermediary result and transcript is updated accordingly
		this._speechRecognition.onresult = (event) => {
			for (let i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
					this._transcript += event.results[i][0].transcript;
				}
			}
		};

		// Error handler, reset the transcript
		this._speechRecognition.onerror = (event) => {
			this._icon.classList.remove('disabled');
			this._transcript = '';
		};

		// Callback fires only on a successful transcription
		this._speechRecognition.onend = () => {
			// Remove status classes
			this._icon.classList.remove('disabled');
			this._icon.classList.remove('active');
			// Set the status to done
			this._recognizing = false;
			// Emit the built transcript
			this.speechToText.emit(`${this._transcript} `);
		};
	}

}
