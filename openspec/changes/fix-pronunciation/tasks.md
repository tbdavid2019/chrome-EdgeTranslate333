## 1. Extension Settings (Voice Selection UI)

- [x] 1.1 Add `TTSVoiceSettings` to `DEFAULT_SETTINGS` in `common/scripts/settings.js`
- [x] 1.2 Build UI components in the Options page (`options.html` / `options.js`) to allow selecting a preferred TTS voice for specific languages
- [x] 1.3 Populate the voice dropdown using `speechSynthesis.getVoices()`

## 2. TTS Default Voice and Speed Logic

- [x] 2.1 Update `pickBestVoice` algorithm in `packages/EdgeTranslate/src/content/display/Panel.jsx` to respect the user's mapped voice from `TTSVoiceSettings`
- [x] 2.2 Fix the `speed` undefined toggle bug in `packages/EdgeTranslate/src/background/library/translate.js` (inside `pronounce` method) so the first click uses the default speed correctly

## 3. Direct Audio Playback for Google TTS

- [x] 3.1 Modify `openGooglePronounce` in `packages/EdgeTranslate/src/content/display/Result.jsx` to emit a direct playback request (`play_google_tts`) instead of opening a new tab
- [x] 3.2 Add `play_google_tts` handler in `packages/EdgeTranslate/src/background/background.js` to construct the Google TTS audio URL (`https://translate.google.com/translate_tts?ie=UTF-8&q={text}&tl={lang}&client=tw-ob`)
- [x] 3.3 Send the audio URL back to the content script or play it within an offscreen document / background context and integrate with the existing loading/playing UI states
