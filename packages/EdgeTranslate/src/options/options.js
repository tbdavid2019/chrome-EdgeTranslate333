import Channel from "common/scripts/channel.js";
import { i18nHTML } from "common/scripts/common.js";
import {
  DEFAULT_SETTINGS,
  getOrSetDefaultSettings,
} from "common/scripts/settings.js";

/**
 * Communication channel.
 */
const channel = new Channel();

/**
 * 初始化设置列表
 */
window.onload = () => {
  i18nHTML();

  const setDarkModeClass = (enabled) => {
    document.documentElement.classList.toggle("dark", !!enabled);
  };

  // 设置不同语言的隐私政策链接（요소가 있으면 설정）
  const PrivacyPolicyLink = document.getElementById("PrivacyPolicyLink");
  if (PrivacyPolicyLink) {
    PrivacyPolicyLink.setAttribute(
      "href",
      chrome.i18n.getMessage("PrivacyPolicyLink"),
    );
  }

  /**
   * Set up hybrid translate config.
   */
  getOrSetDefaultSettings(
    ["languageSetting", "HybridTranslatorConfig"],
    DEFAULT_SETTINGS,
  ).then(async (result) => {
    let config = result.HybridTranslatorConfig;
    let languageSetting = result.languageSetting;
    let availableTranslators = await channel.request(
      "get_available_translators",
      {
        from: languageSetting.sl,
        to: languageSetting.tl,
      },
    );
    setUpTranslateConfig(
      config,
      // Remove the hybrid translator at the beginning of the availableTranslators array.
      availableTranslators.slice(1),
    );
  });

  /**
   * Update translator config options on translator config update.
   */
  channel.on("hybrid_translator_config_updated", (detail) =>
    setUpTranslateConfig(detail.config, detail.availableTranslators),
  );

  /**
   * Initialize custom Voice Settings
   */
  getOrSetDefaultSettings(["languageSetting", "TTSVoiceSettings"], DEFAULT_SETTINGS).then((result) => {
    initVoiceSettings(result.TTSVoiceSettings, result.languageSetting);
  });

  /**
   * initiate and update settings
   * attribute "setting-type": indicate the setting type of one option
   * attribute "setting-path": indicate the nested setting path. used to locate the path of one setting item in chrome storage
   */
  getOrSetDefaultSettings(undefined, DEFAULT_SETTINGS).then((result) => {
    setDarkModeClass(result.Appearance?.DarkMode);
    let inputElements = document.getElementsByTagName("input");
    const selectTranslatePositionElement = document.getElementById(
      "select-translate-position",
    );
    for (let element of [...inputElements, selectTranslatePositionElement]) {
      let settingItemPath = element.getAttribute("setting-path").split(/\s/g);
      let settingItemValue = getSetting(result, settingItemPath);

      switch (element.getAttribute("setting-type")) {
        case "checkbox":
          element.checked = settingItemValue.indexOf(element.value) !== -1;
          // update setting value
          element.onchange = (event) => {
            const target = event.target;
            const settingItemPath = target
              .getAttribute("setting-path")
              .split(/\s/g);
            const settingItemValue = getSetting(result, settingItemPath);

            // if user checked this option, add value to setting array
            if (target.checked) settingItemValue.push(target.value);
            // if user unchecked this option, delete value from setting array
            else
              settingItemValue.splice(
                settingItemValue.indexOf(target.value),
                1,
              );
            saveOption(result, settingItemPath, settingItemValue);
          };
          break;
        case "radio":
          element.checked = settingItemValue === element.value;
          // update setting value
          element.onchange = (event) => {
            const target = event.target;
            const settingItemPath = target
              .getAttribute("setting-path")
              .split(/\s/g);
            if (target.checked) {
              saveOption(result, settingItemPath, target.value);
            }
          };
          break;
        case "switch":
          element.checked = settingItemValue;
          // update setting value
          element.onchange = (event) => {
            const settingItemPath = event.target
              .getAttribute("setting-path")
              .split(/\s/g);
            saveOption(result, settingItemPath, event.target.checked);
            if (event.target.id === "dark-mode") {
              setDarkModeClass(event.target.checked);
            }
          };
          if (element.id === "dark-mode") {
            setDarkModeClass(settingItemValue);
          }
          break;
        case "select":
          element.value = settingItemValue;
          // update setting value
          element.onchange = (event) => {
            const target = event.target;
            const settingItemPath = target
              .getAttribute("setting-path")
              .split(/\s/g);
            saveOption(
              result,
              settingItemPath,
              target.options[target.selectedIndex].value,
            );
          };
          break;
        default:
          break;
      }
    }
  });
};

/**
 * Initialize Voice Settings
 */
function initVoiceSettings(ttsSettings, langSetting) {
  const langSelect = document.getElementById("voice-language-select");
  const voiceSelect = document.getElementById("voice-select");
  const previewBtn = document.getElementById("preview-voice-btn");
  if (!langSelect || !voiceSelect) return;

  // Populate languages
  const langs = ["Auto", "English", "Chinese", "Japanese", "Korean", "French", "Spanish", "German", "Russian"];
  const langCodes = ["auto", "en", "zh", "ja", "ko", "fr", "es", "de", "ru"];
  
  langCodes.forEach((code, i) => {
    langSelect.options.add(new Option(langs[i], code));
  });

  let voices = [];
  let currentLang = "en"; // Default testing lang
  if (langSetting && langSetting.tl) {
      const base = langSetting.tl.split('-')[0].toLowerCase();
      if (langCodes.includes(base)) {
          currentLang = base;
      }
  }
  langSelect.value = currentLang;

  const populateVoices = () => {
    voiceSelect.innerHTML = "";
    const filteredVoices = currentLang === "auto" ? voices : voices.filter(v => v.lang.toLowerCase().startsWith(currentLang));
    
    // Add default option
    voiceSelect.options.add(new Option(chrome.i18n.getMessage("Default") || "Default (Auto)", "default"));
    
    filteredVoices.forEach(v => {
      voiceSelect.options.add(new Option(`${v.name} (${v.lang})`, v.voiceURI));
    });

    const savedURI = ttsSettings[currentLang];
    if (savedURI) {
      voiceSelect.value = savedURI;
    } else {
      voiceSelect.value = "default";
    }
  };

  const loadVoices = () => {
    voices = speechSynthesis.getVoices();
    if (voices.length > 0) populateVoices();
  };

  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  langSelect.onchange = (e) => {
    currentLang = e.target.value;
    populateVoices();
  };

  voiceSelect.onchange = (e) => {
    const uri = e.target.value;
    if (uri === "default") {
      delete ttsSettings[currentLang];
    } else {
      ttsSettings[currentLang] = uri;
    }
    chrome.storage.sync.set({ TTSVoiceSettings: ttsSettings });
  };

  if (previewBtn) {
    previewBtn.onclick = () => {
      const textMap = {
        en: "Hello, this is a test.",
        zh: "你好，這是一個測試。",
        ja: "こんにちは、これはテストです。",
        ko: "안녕하세요, 이것은 테스트입니다.",
        es: "Hola, esto es una prueba.",
        fr: "Bonjour, ceci est un test.",
        de: "Hallo, dies ist ein Test.",
        ru: "Здравствуйте, это тест."
      };
      
      const utter = new SpeechSynthesisUtterance(textMap[currentLang] || "Test");
      const uri = voiceSelect.value;
      if (uri && uri !== "default") {
        const selectedVoice = voices.find(v => v.voiceURI === uri);
        if (selectedVoice) utter.voice = selectedVoice;
      }
      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
    };
  }
}

/**
 * Set up hybrid translate config.
 *
 * @param {Object} config translator config
 * @param {Array<String>} availableTranslators available translators for current language setting
 *
 * @returns {void} nothing
 */
function setUpTranslateConfig(config, availableTranslators) {
  let translatorConfigEles =
    document.getElementsByClassName("translator-config");

  for (let ele of translatorConfigEles) {
    // Remove existed options.
    for (let i = ele.options.length; i > 0; i--) {
      ele.options.remove(i - 1);
    }

    // data-affected indicates items affected by this element in config.selections, they always have the same value.
    let affected = ele.getAttribute("data-affected").split(/\s/g);
    let selected = config.selections[affected[0]];
    for (let translator of availableTranslators) {
      if (translator === selected) {
        ele.options.add(
          new Option(
            chrome.i18n.getMessage(translator),
            translator,
            true,
            true,
          ),
        );
      } else {
        ele.options.add(
          new Option(chrome.i18n.getMessage(translator), translator),
        );
      }
    }

    ele.onchange = () => {
      let value = ele.options[ele.selectedIndex].value;
      // Update every affected item.
      for (let item of affected) {
        config.selections[item] = value;
      }

      // Get the new selected translator set.
      let translators = new Set();
      config.translators = [];
      for (let item in config.selections) {
        let translator = config.selections[item];
        if (!translators.has(translator)) {
          config.translators.push(translator);
          translators.add(translator);
        }
      }

      chrome.storage.sync.set({ HybridTranslatorConfig: config });
    };
  }
}

/**
 *
 * get setting value according to path of setting item
 *
 * @param {Object} localSettings setting object stored in local
 * @param {Array} settingItemPath path of the setting item
 * @returns {*} setting value
 */
function getSetting(localSettings, settingItemPath) {
  let result = localSettings;
  settingItemPath.forEach((key) => {
    result = result[key];
  });
  return result;
}

/**
 * 保存一条设置项
 *
 * @param {Object} localSettings  本地存储的设置项
 * @param {Array} settingItemPath 设置项的层级路径
 * @param {*} value 设置项的值
 */
function saveOption(localSettings, settingItemPath, value) {
  // update local settings
  let pointer = localSettings; // point to children of local setting or itself

  // point to the leaf item recursively
  for (let i = 0; i < settingItemPath.length - 1; i++) {
    pointer = pointer[settingItemPath[i]];
  }
  // update the setting leaf value
  pointer[settingItemPath[settingItemPath.length - 1]] = value;

  let result = {};
  result[settingItemPath[0]] = localSettings[settingItemPath[0]];
  chrome.storage.sync.set(result);
}
