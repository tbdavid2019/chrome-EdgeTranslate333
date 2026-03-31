## Why

Older installations can keep stale locally persisted preferences that continue to force an undesirable TTS voice on macOS even after the newer voice-selection fix ships. The extension also defaults to dark mode today, which is a poor default for users whose browser or operating system is configured for light mode.

## What Changes

- Add a settings reset control that clears persisted local preference state related to TTS voice selection and appearance so older environments can recover without manual storage cleanup.
- Introduce an appearance theme mode that supports `auto`, `light`, and `dark`, with `auto` as the default for new installs and for users who reset appearance preferences.
- Update popup, options, and in-page translation UIs to resolve their effective dark/light styling from the new theme mode, including following OS `prefers-color-scheme` changes while `auto` is active.
- Preserve backward compatibility for existing stored boolean `Appearance.DarkMode` values by treating them as explicit legacy overrides until the user resets or changes appearance settings.

## Capabilities

### New Capabilities
- `settings-reset-controls`: Provide an in-product way to clear persisted local preference state that can interfere with TTS voice behavior and appearance defaults.
- `appearance-theme-mode`: Support automatic theme resolution from the operating system, with explicit light and dark overrides when the user chooses them.

### Modified Capabilities

## Impact

- `packages/EdgeTranslate/src/common/scripts/settings.js`: default settings and compatibility handling for migrated appearance preferences.
- `packages/EdgeTranslate/src/options/options.html`
- `packages/EdgeTranslate/src/options/options.js`
- `packages/EdgeTranslate/src/popup/popup.html`
- `packages/EdgeTranslate/src/popup/popup.js`
- `packages/EdgeTranslate/src/content/display/Panel.jsx`
- `packages/EdgeTranslate/src/content/display/Result.jsx`
- Any shared theme-resolution helpers or i18n strings needed for the reset control and theme mode labels.
