
export class VoiceTypingHelper {
    private recognition: any = null;
    private isSupported: boolean = false;

    // Map ISO 639-1 codes to BCP 47 language tags
    private languageMap: Record<string, string> = {
        'ar': 'ar-SA',
        'en': 'en-US',
        'fr': 'fr-FR',
        'es': 'es-ES',
        'de': 'de-DE',
        'ru': 'ru-RU',
        'tr': 'tr-TR',
        'fa': 'fa-IR',
        'ur': 'ur-PK',
        'hi': 'hi-IN',
        'AR': 'ar-SA', // Legacy support for settings.language
        'EN': 'en-US'  // Legacy support for settings.language
    };

    constructor() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false; // Stop after one sentence/phrase, native mobile behavior
            this.recognition.interimResults = true; // Enable partial results for real-time feedback
            this.isSupported = true;
        }
    }

    startListening(
        language: string, 
        onResult: (text: string, isFinal: boolean) => void, 
        onStart: () => void, 
        onEnd: () => void, 
        onError: (e: any) => void
    ) {
        if (!this.isSupported || !this.recognition) {
            onError("Speech recognition not supported in this browser");
            return;
        }

        // Determine correct locale
        // If exact match found in map, use it. Otherwise default to en-US.
        // For 'auto', we default to English or the browser's language if possible, but en-US is safer.
        const langCode = this.languageMap[language] || 'en-US';
        this.recognition.lang = langCode;

        this.recognition.onstart = () => {
            onStart();
        };

        this.recognition.onend = () => {
            onEnd();
        };

        this.recognition.onerror = (event: any) => {
            // Ignore "no-speech" errors which just mean the user didn't say anything
            if (event.error !== 'no-speech') {
                onError(event);
            }
        };

        this.recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                onResult(finalTranscript, true);
            } else if (interimTranscript) {
                onResult(interimTranscript, false);
            }
        };

        try {
            this.recognition.start();
        } catch (e) {
            console.warn("Speech recognition already active", e);
        }
    }

    stopListening() {
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                // Ignore errors if already stopped
            }
        }
    }
}

// Export singleton instance for easy use across components
export const voiceHelper = new VoiceTypingHelper();
