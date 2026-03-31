## 1. Settings Model and Compatibility

- [x] 1.1 Add `Appearance.ThemeMode` with `auto` as the default while keeping legacy `Appearance.DarkMode` compatibility in shared settings logic
- [x] 1.2 Implement a shared helper that resolves the effective dark/light state from `ThemeMode`, legacy `DarkMode`, and OS `prefers-color-scheme`
- [x] 1.3 Add targeted reset logic that clears `TTSVoiceSettings` and appearance preference keys without deleting unrelated settings

## 2. Options and Popup Controls

- [x] 2.1 Replace the current boolean dark-mode control in the options UI with an `auto` / `light` / `dark` selector
- [x] 2.2 Add a reset button in the options UI for clearing TTS voice and appearance preferences, including user-facing copy/i18n labels
- [x] 2.3 Update the popup UI to consume the resolved theme state and handle the new appearance model without regressing existing controls

## 3. In-Page Theme Application

- [x] 3.1 Update `Panel.jsx` to use the shared theme-resolution helper and react to storage or OS theme changes while `auto` mode is active
- [x] 3.2 Update `Result.jsx` to use the shared theme-resolution helper and react to storage or OS theme changes while `auto` mode is active

## 4. Verification

- [x] 4.1 Verify fresh-install behavior uses the current OS theme by default
- [x] 4.2 Verify legacy installs with stored `Appearance.DarkMode` keep their explicit theme until changed or reset
- [x] 4.3 Verify the reset action clears stale TTS voice preferences and returns appearance to automatic mode without wiping unrelated settings
