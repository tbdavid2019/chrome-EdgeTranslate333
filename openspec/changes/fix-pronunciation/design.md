## Context
The EdgeTranslate extension provides text-to-speech (TTS) via the `speechSynthesis` API for both the source text and the translated text. Currently, the voice selection logic attempts to automatically find the best voice but often falls back to poor-quality voices (e.g., "Donald Duck") on macOS/Edge because users cannot configure their preferred voice. Additionally, the "Google Pronounce" feature (triggered by clicking the 'G' icon) operates by opening a new tab to Google Search (`how to pronounce [word]`). However, due to modern browser media engagement rules, the audio often fails to autoplay on the very first click in the new tab, creating a jarring UX.

## Goals / Non-Goals

**Goals:**
- Provide a UI in the options page for users to select their preferred `speechSynthesis` voice.
- Enhance the default `pieceBestVoice` logic and fix the alternating TTS speed bug.
- Fix the Google TTS feature so that audio reliably plays on the first click without relying on opening a new tab that gets blocked by autoplay policies.

**Non-Goals:**
- Do not implement custom TTS engines (e.g. Azure/AWS direct integration); stick to existing `speechSynthesis` and Google Translate's free TTS endpoint.
- Do not remove the `speechSynthesis` fallback; it is still required for offline or standard pronunciation.

## Decisions

1. **TTS Voice Preference in Storage**:
   Store voice preferences in `chrome.storage.sync` under `TTSVoiceSettings` (a map of language code to voice URI). `Panel.jsx` will read this preference before falling back to `pickBestVoice`.
2. **Direct Audio Playback for Google TTS**:
   Instead of using `open_google_pronounce` to open a tab, we will fetch the audio directly using an `<audio>` element or the native `TTS` if supported. We can use the simple `https://translate.google.com/translate_tts?ie=UTF-8&q={text}&tl={lang}&client=tw-ob` endpoint to play the audio locally within the content script's context. This completely bypasses the new tab autoplay block.

## Risks / Trade-offs

- **[Risk]** Google Translate TTS URL might block requests without a proper referer or if rate limited.
  → **Mitigation**: The `client=tw-ob` parameter historically works well without blocking. If it fails, fallback to `speechSynthesis`.
- **[Risk]** The new tab for Google Pronunciation is intentionally used by some users to see phonetics.
  → **Mitigation**: We can play the audio directly *and* still open the tab, or we can just play the audio (which is usually what users want when clicking a speaker icon). We'll err on the side of just playing the audio for a seamless experience.
