## Why
The current pronunciation system has two critical issues that degrade the user experience:
1. The native TTS (Edge/Web Speech API) often defaults to a poor-quality, fast-paced voice (often described as "Donald Duck"), and users have no way to configure their preferred voice.
2. The Google pronunciation feature (which opens a Google Search tab for phonetics) fails to autoplay the audio on the first click due to modern browser autoplay policies, creating a confusing "broken first, works second time" experience.

## What Changes
- Add a new "TTS Engine/Voice Selection" component to the extension settings, allowing users to explicitly choose their preferred voice per language.
- Improve the default voice selection algorithm (`pickBestVoice`) to avoid novelty/robotic voices if no perfect match is found, and fix the initial TTS default speed in `translate.js`.
- Modify the behavior of the Google pronunciation button (`G` icon) to fetch and play the Google Translate TTS audio directly in the extension's background context (or content script via `<audio>`), completely eliminating the new-tab autoplay policy block.

## Capabilities

### New Capabilities
- `tts-voice-selection`: A new settings preference allowing users to select and preview their preferred TTS voices.
- `direct-audio-playback`: Mechanism to play remote TTS audio URLs directly within the extension context rather than relying on external tab autoplay.

### Modified Capabilities
- `translation-panel`: The `Result.jsx` UI and TTS triggering mechanism will be updated to respect the user's voice preferences and trigger direct audio playback.

## Impact
- `packages/EdgeTranslate/src/content/display/Panel.jsx`: Voice selection logic and TTS speed defaults.
- `packages/EdgeTranslate/src/content/display/Result.jsx`: Update Google TTS trigger behavior.
- `packages/EdgeTranslate/src/background/background.js`: Modify the `open_google_pronounce` handler to fetch and play audio.
- Settings UI (`options`): Add dropdowns for voice selection.
- Storage: Add `TTSVoiceSettings` or similar key to sync storage.
