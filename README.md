# How to Run

To run the application locally, you must serve the files using a local web server. Opening `index.html` directly in the browser may cause issues with module loading and filefetching.

## Browser Notes

- Chrome / Edge recommended for full Web Speech API support
- Microphone access requires HTTPS or localhost
- Safari voice support may be limited

## Session Persistence
The app automatically resumes the last session using localStorage.
Stored state includes:
- targetLanguage
- translationLanguage
- current level / section / stage
- exercise index
- unlocked languages

## Authoring Exercises
- Exercises are delivered in pre-randomized order from JSON
- Use "___" in Tap-Fill questions to define blanks
- Voice exercises may optionally define `voiceLang`
- Translation is optional and lazy-loaded
