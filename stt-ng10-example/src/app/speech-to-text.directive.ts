import { Directive, ElementRef, EventEmitter, OnInit, Output, Renderer2 } from '@angular/core';

@Directive({
	selector: '[speechToText]',
	host: {
		'[class.speech-microphone-host]': 'true'
	}
})
export class SpeechToTextDirective implements OnInit {

	@Output() public speechToText: EventEmitter<string> = new EventEmitter<string>();

	private _speechRecognition;
	private _recognizing: boolean = false;
	private _transcript: string = '';
	private _icon: HTMLElement;

	constructor(private _hostRef: ElementRef, private _renderer: Renderer2) { }

	ngOnInit(): void {
		if ('webkitSpeechRecognition' in window) {
			this._createToggle();
			this._initListeners();
		}
	}

	private _createToggle() {
		this._icon = document.createElement('div');
		this._icon.classList.add('speech-microphone-icon');
		this._renderer.appendChild(this._hostRef.nativeElement, this._icon);
		this._icon.addEventListener('click', () => {
			if (!this._recognizing) {
				this._speechRecognition.start();
				this._icon.classList.add('disabled');
			} else {
				this._speechRecognition.stop();
			}
		});
	}

	private _initListeners() {
		this._speechRecognition = new window['webkitSpeechRecognition']();
		this._speechRecognition.continuous = true;
		this._speechRecognition.interimResults = true;
		this._speechRecognition.lang = 'en-US';

		this._speechRecognition.onstart = () => {
			this._icon.classList.remove('disabled');
			this._icon.classList.add('active');
			this._transcript = '';
			this._recognizing = true;
		};
		this._speechRecognition.onresult = (event) => {
			for (let i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
					this._transcript += event.results[i][0].transcript;
				}
			}
		};
		this._speechRecognition.onerror = (event) => {
			this._icon.classList.remove('disabled');
			this.speechToText.emit('');
		};
		this._speechRecognition.onend = () => {
			this._icon.classList.remove('disabled');
			this._icon.classList.remove('active');
			this._recognizing = false;
			this.speechToText.emit(`${this._transcript} `);
		};
	}

}
