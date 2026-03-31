import {
  buildAppearanceSettings,
  resolveAppearanceState,
} from "common/scripts/appearance.js";
import {
  DEFAULT_SETTINGS,
  resetTTSAndAppearancePreferences,
} from "common/scripts/settings.js";

describe("appearance theme resolution", () => {
  const matchMediaDark = jest.fn(() => ({ matches: true }));
  const matchMediaLight = jest.fn(() => ({ matches: false }));

  it("uses auto mode on fresh installs", () => {
    const state = resolveAppearanceState(DEFAULT_SETTINGS.Appearance, {
      matchMedia: matchMediaDark,
    });

    expect(state.themeMode).toBe("auto");
    expect(state.isDark).toBe(true);
    expect(state.followsSystem).toBe(true);
  });

  it("keeps legacy dark mode overrides for older installs", () => {
    const darkState = resolveAppearanceState(
      { DarkMode: true },
      { matchMedia: matchMediaLight },
    );
    const lightState = resolveAppearanceState(
      { DarkMode: false },
      { matchMedia: matchMediaDark },
    );

    expect(darkState.themeMode).toBe("dark");
    expect(darkState.isDark).toBe(true);
    expect(lightState.themeMode).toBe("light");
    expect(lightState.isDark).toBe(false);
  });
});

describe("resetTTSAndAppearancePreferences", () => {
  beforeEach(() => {
    chrome.storage.sync.remove.mockImplementation((keys, callback) => {
      if (callback) callback();
    });
    chrome.storage.sync.set.mockImplementation((items, callback) => {
      if (callback) callback();
    });
    localStorage.clear();
    localStorage.setItem("et_viewer_theme", "dark");
    localStorage.setItem("et_page_theme", "dark");
  });

  it("clears stale TTS and appearance preferences without touching other settings", async () => {
    await resetTTSAndAppearancePreferences();

    expect(chrome.storage.sync.remove).toHaveBeenCalledWith(
      ["TTSVoiceSettings"],
      expect.any(Function),
    );
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      { Appearance: buildAppearanceSettings("auto") },
      expect.any(Function),
    );
    expect(localStorage.getItem("et_viewer_theme")).toBeNull();
    expect(localStorage.getItem("et_page_theme")).toBeNull();
  });
});
