## ADDED Requirements

### Requirement: Automatic Theme Mode
The system SHALL support an appearance theme mode with the values `auto`, `light`, and `dark`, and SHALL default to `auto` when no explicit appearance preference has been stored.

#### Scenario: Fresh install uses system appearance
- **WHEN** the extension initializes without a stored appearance preference
- **THEN** the effective theme SHALL follow the current OS or browser `prefers-color-scheme` setting

### Requirement: Explicit Theme Override
The system SHALL allow the user to choose an explicit `light` or `dark` appearance mode that overrides automatic system detection until changed or reset.

#### Scenario: User selects dark mode explicitly
- **WHEN** the user chooses the `dark` appearance mode in the extension settings
- **THEN** popup, options, and translation UIs SHALL render in dark mode regardless of the current OS theme

### Requirement: Legacy Appearance Compatibility
The system SHALL continue honoring legacy stored dark-mode booleans for existing installations until an explicit theme mode is selected or the user resets appearance preferences.

#### Scenario: Existing install has legacy dark-mode value
- **WHEN** the extension loads in an environment that has `Appearance.DarkMode` stored but no `Appearance.ThemeMode`
- **THEN** the extension SHALL use the legacy stored value as the effective appearance override

### Requirement: Automatic Mode Reacts to System Changes
While the appearance mode is `auto`, the system SHALL update the effective theme when the OS or browser color-scheme preference changes.

#### Scenario: OS theme changes while extension UI is open
- **WHEN** the system color-scheme preference changes and the current appearance mode is `auto`
- **THEN** the open extension UI SHALL update to the new effective theme without requiring a manual settings change
