import {
  DEFAULT_SETTINGS,
  getOrSetDefaultSettings,
} from "common/scripts/settings.js";

describe("getOrSetDefaultSettings", () => {
  beforeEach(() => {
    chrome.storage.sync.get.mockReset();
    chrome.storage.sync.set.mockReset();
  });

  it("does not rewrite valid falsy settings", async () => {
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        HidePageTranslatorBanner: false,
        fixSetting: false,
      });
    });
    chrome.storage.sync.set.mockImplementation((items, callback) => {
      if (callback) callback();
    });

    const result = await getOrSetDefaultSettings(
      ["HidePageTranslatorBanner", "fixSetting"],
      DEFAULT_SETTINGS,
    );

    expect(result.HidePageTranslatorBanner).toBe(false);
    expect(result.fixSetting).toBe(false);
    expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  });

  it("hydrates missing nested and panel defaults in a single write", async () => {
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        Appearance: { DarkMode: true },
      });
    });
    chrome.storage.sync.set.mockImplementation((items, callback) => {
      if (callback) callback();
    });

    const result = await getOrSetDefaultSettings(
      ["Appearance", "DisplaySetting"],
      DEFAULT_SETTINGS,
    );

    expect(result.Appearance).toEqual({
      DarkMode: true,
      ThemeMode: "auto",
    });
    expect(result.DisplaySetting).toEqual(DEFAULT_SETTINGS.DisplaySetting);
    expect(chrome.storage.sync.set).toHaveBeenCalledTimes(1);
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({
        Appearance: {
          DarkMode: true,
          ThemeMode: "auto",
        },
        DisplaySetting: DEFAULT_SETTINGS.DisplaySetting,
      }),
      expect.any(Function),
    );
  });
});
