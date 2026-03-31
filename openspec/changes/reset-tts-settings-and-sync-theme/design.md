## Context

The extension currently persists appearance and TTS voice preferences in browser-managed storage, but the behavior is inconsistent across surfaces. `Appearance.DarkMode` is a boolean defaulted to `true`, so new installs immediately render dark UI even when the operating system prefers light mode. Separately, the recent TTS voice-selection work stores per-language choices in `TTSVoiceSettings`, which means older installations can continue to reuse stale voice overrides until a user manually edits settings or clears storage outside the product.

This change touches shared settings defaults, the options page, the popup, and the in-page translation surfaces. That makes it a cross-cutting change with a small migration concern: older persisted booleans must continue to work while the product moves to an auto-resolved theme model.

## Goals / Non-Goals

**Goals:**
- Add a user-visible reset control that clears persisted TTS voice preferences and appearance preferences without requiring manual storage inspection.
- Replace the current dark-mode default with an appearance mode that can resolve to the current OS/browser color scheme.
- Keep existing installs stable by honoring legacy explicit dark-mode values until the user chooses a new theme mode or performs a reset.
- Make popup, options, and translation panel UIs react consistently to the effective theme.

**Non-Goals:**
- Do not introduce a full settings import/export workflow.
- Do not wipe unrelated translator, layout, or language preferences when the user resets TTS/theme preferences.
- Do not redesign the visual appearance of the popup or options page beyond the controls needed for reset and theme-mode selection.

## Decisions

1. **Represent appearance as a mode, not a boolean**
   Add `Appearance.ThemeMode` with allowed values `auto`, `light`, and `dark`. New installs default to `auto`.

   Rationale:
   A boolean cannot represent "follow the system" after initial load. A mode value can express both the new default (`auto`) and explicit user overrides.

   Alternatives considered:
   - Keep `DarkMode` and only change its default initialization. Rejected because the UI would stop following later OS theme changes.
   - Derive theme from `matchMedia` only when storage is empty and immediately persist the resolved boolean. Rejected because it turns a system preference into a stale snapshot.

2. **Treat legacy `Appearance.DarkMode` as a compatibility fallback**
   Theme resolution logic will use this precedence:
   - `Appearance.ThemeMode` if present
   - otherwise legacy `Appearance.DarkMode` boolean as an explicit override
   - otherwise `auto`

   Rationale:
   This avoids surprising existing users whose installations already store an intentional dark/light choice, while still moving new and reset users onto the better model.

3. **Implement a targeted reset instead of clearing all extension data**
   The reset control will remove only the persisted keys that affect the reported issues: `TTSVoiceSettings` and appearance-related preferences (`Appearance.ThemeMode`, legacy `Appearance.DarkMode`, and any extension-owned local theme keys if they are managed from the same UI surface).

   Rationale:
   The user's complaint is about stale TTS voice and theme behavior, not every preference in the extension. Targeted reset reduces collateral damage and user surprise.

   Alternatives considered:
   - Clear all `chrome.storage.sync`. Rejected because it would discard unrelated translator and layout settings.
   - Add only a TTS reset. Rejected because the same request also asks to restore a sane theme default.

4. **Centralize effective-theme resolution**
   Introduce a shared helper that resolves the effective dark/light boolean from storage plus `window.matchMedia('(prefers-color-scheme: dark)')`. Popup, options, `Panel.jsx`, and `Result.jsx` should all consume the same rule.

   Rationale:
   Theme state is currently computed ad hoc in each surface. Shared resolution prevents drift and makes the legacy-to-new migration logic testable in one place.

## Risks / Trade-offs

- **[Risk]** Existing users may interpret reset as a full factory reset.
  → **Mitigation**: Label the control clearly as resetting TTS and appearance preferences only, and keep the implementation scoped to those keys.

- **[Risk]** Surfaces that only read storage once will not react when the OS theme changes while `auto` mode is active.
  → **Mitigation**: Register a `matchMedia('(prefers-color-scheme: dark)')` listener anywhere a live UI stays mounted and recompute the effective theme when it fires.

- **[Risk]** Legacy installs may hold `Appearance.DarkMode` indefinitely and never move to `auto`.
  → **Mitigation**: This is intentional for compatibility. Users can migrate through the new theme selector or the reset control.

## Migration Plan

1. Add `Appearance.ThemeMode: "auto"` to defaults without deleting legacy `Appearance.DarkMode`.
2. Update all theme consumers to resolve effective appearance with compatibility fallback logic.
3. Replace the single dark-mode switch in settings surfaces with controls that can express `auto`, `light`, and `dark`.
4. Add a reset action on the options page that clears TTS voice and appearance preference keys.
5. Verify three cases:
   - fresh install resolves to OS theme
   - old install with stored `DarkMode` preserves current behavior
   - reset clears the stale preference and returns behavior to `auto`

Rollback is straightforward: ignore `ThemeMode`, continue reading `DarkMode`, and remove the reset UI. The added key is backwards-safe because legacy code will simply not read it.

## Open Questions

- Whether the popup also needs a visible `auto/light/dark` selector immediately, or whether it can continue to mirror the effective theme while the full selector lives only on the options page.
- Whether any extension-owned `localStorage` theme keys outside the standard options/popup flow should be included in the targeted reset now, or handled in a follow-up if users report those surfaces separately.
