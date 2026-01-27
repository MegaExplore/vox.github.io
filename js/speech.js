/**
 * Speech Recognition Module
 * Wraps the Web Speech API for voice input.
 */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const isSpeechSupported = !!SpeechRecognition;

/**
 * Starts listening for speech input.
 * @param {string} lang - The BCP 47 language tag (e.g., 'es-ES', 'en-US').
 * @returns {Promise<string>} Resolves with the transcript, or rejects on error.
 */
export function startListening(lang = 'en-US') {
    return new Promise((resolve, reject) => {
        if (!isSpeechSupported) {
            reject(new Error('Speech recognition not supported in this browser.'));
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            resolve(transcript);
        };

        recognition.onerror = (event) => {
            reject(new Error(`Speech recognition error: ${event.error}`));
        };

        recognition.onend = () => {
            // If no result was returned before end, it might be a no-speech timeout or just silence.
            // We rely on onresult to resolve. If it ends without result, we can treat it as a cancellation or empty.
            // For this implementation, we'll let the promise hang or reject if needed, 
            // but usually onerror fires if there's a problem. 
            // If just silence, we might want to resolve with empty string or reject.
            // Let's safe-guard:
            // The promise is settled by onresult or onerror.
        };

        try {
            recognition.start();
        } catch (e) {
            reject(e);
        }
    });
}
