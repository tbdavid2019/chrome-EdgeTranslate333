const THEME_MODE_VALUES = new Set(["auto", "light", "dark"]);
const COLOR_SCHEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

function normalizeThemeMode(themeMode) {
  return THEME_MODE_VALUES.has(themeMode) ? themeMode : null;
}

function resolveStoredThemeMode(appearance) {
  const explicitThemeMode = normalizeThemeMode(appearance?.ThemeMode);
  if (explicitThemeMode) return explicitThemeMode;

  if (typeof appearance?.DarkMode === "boolean") {
    return appearance.DarkMode ? "dark" : "light";
  }

  return "auto";
}

function resolveAppearanceState(appearance, options = {}) {
  const themeMode = resolveStoredThemeMode(appearance);
  const matchMediaImpl = options.matchMedia;
  const isDark =
    themeMode === "dark" ||
    (themeMode === "auto" &&
      typeof matchMediaImpl === "function" &&
      !!matchMediaImpl(COLOR_SCHEME_MEDIA_QUERY).matches);

  return {
    themeMode,
    isDark,
    followsSystem: themeMode === "auto",
  };
}

function buildAppearanceSettings(themeMode) {
  const normalizedThemeMode = normalizeThemeMode(themeMode) || "auto";
  if (normalizedThemeMode === "auto") {
    return { ThemeMode: "auto" };
  }

  return {
    ThemeMode: normalizedThemeMode,
    DarkMode: normalizedThemeMode === "dark",
  };
}

function watchSystemTheme(callback, matchMediaImpl) {
  if (typeof callback !== "function" || typeof matchMediaImpl !== "function") {
    return () => {};
  }

  let mediaQueryList;
  try {
    mediaQueryList = matchMediaImpl(COLOR_SCHEME_MEDIA_QUERY);
  } catch {
    return () => {};
  }

  const listener = (event) => callback(!!event.matches);

  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }

  if (typeof mediaQueryList.addListener === "function") {
    mediaQueryList.addListener(listener);
    return () => mediaQueryList.removeListener(listener);
  }

  return () => {};
}

export {
  buildAppearanceSettings,
  COLOR_SCHEME_MEDIA_QUERY,
  normalizeThemeMode,
  resolveAppearanceState,
  resolveStoredThemeMode,
  watchSystemTheme,
};
