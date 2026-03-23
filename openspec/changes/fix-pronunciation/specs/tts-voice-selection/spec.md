## ADDED Requirements

### Requirement: User TTS Voice Selection
The system SHALL allow users to select a specific Text-To-Speech (TTS) voice for a given language via the extension options page.

#### Scenario: User selects a voice
- **WHEN** user navigates to the Settings and selects a preferred voice for a language
- **THEN** the system saves `TTSVoiceSettings` mapping the language code to the selected voice URI

### Requirement: TTS Voice Fallback
The system SHALL use the user-selected voice if available, and fallback to the `pickBestVoice` algorithm if not configured or unavailable.

#### Scenario: User has no configured voice
- **WHEN** the extension TTS is triggered but no user preference exists for the target language
- **THEN** the system falls back to the default algorithmic selection, preferring high-quality natural voices.
