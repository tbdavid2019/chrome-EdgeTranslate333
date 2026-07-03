# Changelog

## 3.4.1 - 2026-07-03

- Fixed extension process memory leaks and browser crash conditions in development mode by optimizing the hot-reload scanner: replaced resource-heavy `e.file()` API calls with lightweight `e.getMetadata()` and excluded large static folders (`web`, `google`, `icon`) from recursive scanning.

## 3.4.0 - 2026-06-02

- Reverted the recent runtime optimization experiments that caused regressions in the in-page display panel and translation flow, restoring the extension runtime to the previous baseline behavior before continuing leak investigation.
- Refreshed the extension icon set for the current release.
- Documented an unresolved known issue: Chrome resource exhaustion and browser crash conditions are still under investigation and are not considered fixed in this release.

## 3.3.9 - 2026-05-27

- Fixed runaway `chrome.storage.sync` writes that could trigger `MAX_WRITE_OPERATIONS_PER_MINUTE`, flood DevTools with errors, and eventually cause high memory usage or OOM conditions.
- Added missing default settings for display state and tightened settings hydration so valid falsy values are preserved instead of being rewritten repeatedly.
- Updated the extension theme palette: dark mode now follows Tokyo Night Moon, and light mode now follows Kanagawa Lotus across popup, options, and in-page translation panels.

## 3.3.8 - 2026-05-21

- Fixed Chrome freeze/crash issue triggered by rapid or concurrent translation SpeechSynthesis requests by sequentializing cancellation and queuing speak events with timestamp matching.
- Protected message channel parser with type guards and try-catch handling to ignore invalid or non-JSON payloads safely.

## 3.3.7 - 2026-03-31

- Added a reset control in settings to clear persisted TTS voice preferences and theme overrides from older installs.
- Changed the default appearance behavior to follow the OS theme via `auto` mode instead of forcing dark mode on new or reset installs.
- Updated popup, options, and in-page translation UIs to resolve light/dark appearance from the shared theme mode with legacy compatibility for older `DarkMode` settings.
