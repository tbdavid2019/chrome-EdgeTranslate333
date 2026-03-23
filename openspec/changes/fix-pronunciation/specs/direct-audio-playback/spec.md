## ADDED Requirements

### Requirement: Direct Audio Playback for Google Pronunciation
The system SHALL use an internal audio element to play the Google TTS audio directly within the extension's context instead of opening a Google Search tab.

#### Scenario: User triggers Google Pronunciation
- **WHEN** the user clicks the Google Pronunciation ("G") icon
- **THEN** the extension fetches the corresponding Google TTS audio stream and plays it directly, bypassing browser autoplay tab limitations.
