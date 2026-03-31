## ADDED Requirements

### Requirement: Targeted TTS and Appearance Reset
The system SHALL provide a settings control that clears persisted preferences related to TTS voice selection and appearance without removing unrelated extension settings.

#### Scenario: User resets stale TTS and appearance preferences
- **WHEN** the user activates the reset control from the extension settings UI
- **THEN** the system removes persisted TTS voice-selection preferences and appearance preferences that can override the current defaults
- **THEN** the system preserves unrelated translator, layout, and language settings

### Requirement: Reset Restores Automatic Defaults
After the reset control completes, the system SHALL behave as if no explicit TTS voice or appearance override is configured.

#### Scenario: User resets and reopens settings
- **WHEN** the user reopens the extension UI after completing the reset
- **THEN** TTS voice selection SHALL fall back to automatic voice resolution
- **THEN** appearance SHALL resolve from the automatic theme mode instead of a stored explicit dark-mode override
