## ADDED Requirements

### Requirement: Translation Panel TTS Trigger Update
The Result Panel SHALL trigger direct Google Pronunciation playback when the G icon is clicked, instead of creating a new foreground tab for google.com.

#### Scenario: Result Panel G icon clicked
- **WHEN** the G icon in the translation result panel is clicked
- **THEN** the panel requests audio playback directly without opening an external URL in a tab.
