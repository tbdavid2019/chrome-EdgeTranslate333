import { BROWSER_LANGUAGES_MAP } from "common/scripts/languages.js";

/**
 * default settings for this extension
 */
const DEFAULT_SETTINGS = {
  blacklist: {
    urls: {},
    domains: { "chrome.google.com": true, extensions: true },
  },
  // Resize: determine whether the web page will resize when showing translation result
  // RTL: determine whether the text in translation block should display from right to left
  // FoldLongContent: determine whether to fold long translation content
  // SelectTranslatePosition: the position of select translate button.
  LayoutSettings: {
    Resize: false,
    RTL: false,
    FoldLongContent: true,
    SelectTranslatePosition: "TopRight",
  },
  Appearance: {
    ThemeMode: "auto",
  },
  // Default settings of source language and target language
  languageSetting: {
    sl: "auto",
    tl: BROWSER_LANGUAGES_MAP[chrome.i18n.getUILanguage()],
  },
  OtherSettings: {
    MutualTranslate: false,
    SelectTranslate: true,
    TranslateAfterDblClick: false,
    TranslateAfterSelect: false,
    CancelTextSelection: false,
    UseGoogleAnalytics: false,
  },
  DefaultTranslator: "GoogleTranslate",
  DefaultPageTranslator: "GooglePageTranslate",
  HybridTranslatorConfig: {
    // The translators used in current hybrid translate.
    translators: ["BingTranslate", "GoogleTranslate"],

    // The translators for each item.
    selections: {
      // ATTENTION: The following four items MUST HAVE THE SAME TRANSLATOR!
      originalText: "GoogleTranslate",
      mainMeaning: "GoogleTranslate",
      tPronunciation: "GoogleTranslate",
      sPronunciation: "GoogleTranslate",

      // For the following three items, any translator combination is OK.
      detailedMeanings: "BingTranslate",
      definitions: "GoogleTranslate",
      examples: "GoogleTranslate",
    },
  },
  // Defines which contents in the translating result should be displayed.
  TranslateResultFilter: {
    mainMeaning: true,
    originalText: true,
    tPronunciation: true,
    sPronunciation: true,
    tPronunciationIcon: true,
    sPronunciationIcon: true,
    detailedMeanings: true,
    definitions: true,
    examples: true,
  },
  // Defines the order of displaying contents.
  ContentDisplayOrder: [
    "mainMeaning",
    "originalText",
    "detailedMeanings",
    "definitions",
    "examples",
  ],
  HidePageTranslatorBanner: false,
  TTSVoiceSettings: {},
  fixSetting: false,
  DisplaySetting: {
    type: "floating",
    fixedData: {
      width: 0.28,
      position: "right",
    },
    floatingData: {
      width: 0.24,
      height: 0.6,
    },
  },
};

const TTS_AND_APPEARANCE_LOCAL_STORAGE_KEYS = [
  "et_viewer_theme",
  "et_page_theme",
];

/**
 * assign default value to settings which are undefined in recursive way
 * @param {*} result setting result stored in chrome.storage
 * @param {*} settings default settings
 */
function cloneSettingValue(value) {
  if (value instanceof Array) {
    return value.map((item) => cloneSettingValue(item));
  }

  if (value && typeof value === "object") {
    const cloned = {};
    for (let key in value) {
      cloned[key] = cloneSettingValue(value[key]);
    }
    return cloned;
  }

  return value;
}

function setDefaultSettings(result, settings) {
  let updated = false;

  for (let i in settings) {
    const hasSetting = Object.prototype.hasOwnProperty.call(result, i);
    const settingValue = settings[i];

    // settings[i] contains key-value settings
    if (
      settingValue &&
      typeof settingValue === "object" &&
      !(settingValue instanceof Array) &&
      Object.keys(settingValue).length > 0
    ) {
      if (
        hasSetting &&
        result[i] &&
        typeof result[i] === "object" &&
        !(result[i] instanceof Array)
      ) {
        updated = setDefaultSettings(result[i], settingValue) || updated;
      } else {
        // settings[i] contains several setting items but these have not been set before
        result[i] = cloneSettingValue(settingValue);
        updated = true;
      }
    } else if (!hasSetting || result[i] === undefined) {
      // settings[i] is a single setting item and it has not been set before
      result[i] = cloneSettingValue(settingValue);
      updated = true;
    }
  }

  return updated;
}

/**
 * Get settings from storage. If some of the settings have not been initialized,
 * initialize them with the given default values.
 *
 * @param {String | Array<String>} settings setting name to get
 * @param {Object | Function} defaults default values or function to generate default values
 * @returns {Promise<Any>} settings
 */
function getOrSetDefaultSettings(settings, defaults) {
  return new Promise((resolve) => {
    // If there is only one setting to get, warp it up.
    if (typeof settings === "string") {
      settings = [settings];
    } else if (settings === undefined) {
      // If settings is undefined, collect all setting keys in defaults.
      settings = [];
      for (let key in defaults) {
        settings.push(key);
      }
    }

    chrome.storage.sync.get(settings, (result) => {
      let updated = false;
      const resolvedDefaults =
        typeof defaults === "function" ? defaults(settings) : defaults;

      for (let setting of settings) {
        const hasSetting = Object.prototype.hasOwnProperty.call(result, setting);
        const defaultValue = resolvedDefaults[setting];

        if (!hasSetting || result[setting] === undefined) {
          if (defaultValue === undefined) continue;
          result[setting] = cloneSettingValue(defaultValue);
          updated = true;
        } else if (
          defaultValue &&
          typeof defaultValue === "object" &&
          !(defaultValue instanceof Array) &&
          result[setting] &&
          typeof result[setting] === "object" &&
          !(result[setting] instanceof Array)
        ) {
          updated = setDefaultSettings(result[setting], defaultValue) || updated;
        }
      }

      if (updated) {
        chrome.storage.sync.set(result, () => resolve(result));
      } else {
        resolve(result);
      }
    });
  });
}

function resetTTSAndAppearancePreferences() {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(["TTSVoiceSettings"], () => {
      chrome.storage.sync.set({ Appearance: DEFAULT_SETTINGS.Appearance }, () => {
        try {
          TTS_AND_APPEARANCE_LOCAL_STORAGE_KEYS.forEach((key) => {
            localStorage.removeItem(key);
          });
        } catch {}

        resolve();
      });
    });
  });
}

export {
  DEFAULT_SETTINGS,
  getOrSetDefaultSettings,
  resetTTSAndAppearancePreferences,
  setDefaultSettings,
};
