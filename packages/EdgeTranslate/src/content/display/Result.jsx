/** @jsx h */
import { h, Fragment } from "preact";
import { useCallback, useMemo, useEffect, useRef, useReducer, useState } from "preact/hooks";
import styled, { ThemeProvider } from "styled-components";
import {
  resolveAppearanceState,
  watchSystemTheme,
} from "common/scripts/appearance.js";
import Channel from "common/scripts/channel.js";
import {
  DEFAULT_SETTINGS,
  getOrSetDefaultSettings,
} from "common/scripts/settings.js";
import { checkTimestamp } from "./utils.js";
import Notifier from "./library/notifier/notifier.js";
import DOMPurify from "dompurify";
import DrawerBlock from "./DrawerBlock.jsx";
import { Pencil as EditIcon, Check as EditDoneIcon, Volume2 as PronounceIcon, AudioLines as GooglePronounceIcon, LoaderCircle as PronounceLoadingIcon, Copy as CopyIcon } from "lucide-preact";
import { translationColors as colors, translationType as type } from "common/scripts/uiTheme.js";

// TTS speeds and consecutive click tracking
let sourceTTSSpeed = "fast",
  targetTTSSpeed = "fast";
let lastClickedButton = null; // "source" or "target"
let lastClickTime = 0;
// Communication channel.
const channel = new Channel();
const notifier = new Notifier("center");

const openGooglePronounce = async (text, language) => {
  const queryText = typeof text === "string" ? text.trim() : "";
  if (!queryText) return;

  try {
    const response = await channel.request("play_google_tts", {
      text: queryText,
      language: language || "en"
    });
    if (response && response.url) {
      const audio = new Audio(response.url);
      audio.play().catch(e => console.error("Audio play failed", e));
    }
  } catch (e) {
    // 실패 시 조용히 처리
  }
};

const isChineseLanguage = (language) =>
  typeof language === "string" && language.toLowerCase().startsWith("zh");

const hasCjkCharacters = (text) =>
  /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(text);

const shouldShowGooglePronounce = (text, language) => {
  const value = typeof text === "string" ? text.trim() : "";
  if (!value) return false;
  if (isChineseLanguage(language)) return false;
  if (hasCjkCharacters(value)) return false;
  if (/\s/.test(value)) return false;
  if (value.length > 40) return false;

  return true;
};

const shouldShowPronunciationText = (text, language, pronunciation) => {
  const value = typeof text === "string" ? text.trim() : "";
  const reading = typeof pronunciation === "string" ? pronunciation.trim() : "";
  if (!value || !reading) return false;
  if (isChineseLanguage(language)) return false;
  if (hasCjkCharacters(value)) return false;

  return true;
};

/**
 * @param {{
 *   mainMeaning: string;
 *   originalText: string;
 *   tPronunciation?: string;
 *   sPronunciation?: string;
 *   detailedMeanings?: Array<{
 *     pos: string;
 *     meaning: string;
 *     synonyms?: Array<string>;
 *   }>;
 *   definitions?: Array<{
 *     pos: string;
 *     meaning: string;
 *     synonyms?: Array<string>;
 *     example?: string;
 *   }>;
 *   examples?: Array<{
 *     source?: string;
 *     target?: string;
 *   }>;
 * }} props translate result
 *
 * @returns {h.JSX.Element} element
 */
export default function Result(props) {
  /**
   * The order state of displaying contents.
   */
  const [contentDisplayOrder, setContentDisplayOrder] = useState([]);

  /**
   * The visible state of contents.
   */
  const [displayTPronunciation, setDisplayTPronunciation] = useState(false);
  const [displaySPronunciation, setDisplaySPronunciation] = useState(false);
  const [displayTPronunciationIcon, setDisplayTPronunciationIcon] =
    useState(false);
  const [displaySPronunciationIcon, setDisplaySPronunciationIcon] =
    useState(false);
  const [contentFilter, setContentFilter] = useState({});

  /**
   * Text direction state.
   */
  const [textDirection, setTextDirection] = useState("ltr");

  const [isDark, setIsDark] = useState(false);
  const appearanceRef = useRef(DEFAULT_SETTINGS.Appearance);
  // Keep effect dependencies stable across renders. A new bound function here
  // restarts initialization, whose async state updates trigger another render.
  const matchMediaFn = useMemo(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia.bind(window)
      : undefined,
    [],
  );

  /**
   * Whether to fold too long translation content.
   */
  const [foldLongContent, setFoldLongContent] = useState(true);

  /**
   * The pronounce status
   */
  const [sourcePronouncing, setSourcePronounce] = useReducer(
      sourcePronounce,
      false,
    ),
    [targetPronouncing, setTargetPronounce] = useReducer(
      targetPronounce,
      false,
    );

  /**
   * TTS stopping state to prevent multiple stop requests
   */
  const [stopping, setStopping] = useState(false);

  // Indicate whether user can edit and copy the translation result
  const [copyResult, setCopyResult] = useReducer(copyContent, false);
  const translateResultElRef = useRef();

  // Indicate whether user is editing the original text
  const [editing, setEditing] = useReducer(_setEditing, false);
  const originalTextElRef = useRef();
  const applyAppearance = useCallback((appearance) => {
    appearanceRef.current = appearance || {};
    setIsDark(
      resolveAppearanceState(appearanceRef.current, {
        matchMedia: matchMediaFn,
      }).isDark,
    );
  }, [matchMediaFn]);

  const TargetContent = (
    <Fragment key={"mainMeaning"}>
      {props.mainMeaning?.length > 0 && (
        <Target>
          <SectionLabel accent>
            {chrome.i18n.getMessage("Translate")}
          </SectionLabel>
          <TextLine>
            <PrimaryText
              dir={textDirection}
              contenteditable={copyResult}
              onBlur={() => setCopyResult({ copy: false })}
              ref={translateResultElRef}
            >
              {props.mainMeaning}
            </PrimaryText>
            <StyledCopyIcon
              role="button"
              tabIndex={0}
              aria-label={chrome.i18n.getMessage("CopyResult")}
              onKeyDown={activateOnKeyboard}
              onClick={() =>
                setCopyResult({
                  copy: true,
                  element: translateResultElRef.current,
                })
              }
              title={chrome.i18n.getMessage("CopyResult")}
            />
          </TextLine>
          {(displayTPronunciationIcon || displayTPronunciation) && (
            <PronounceLine>
              {displayTPronunciationIcon &&
                (targetPronouncing ? (
                  <StyledPronounceLoadingIcon
                          role="button"
                    tabIndex={0}
                    aria-label={chrome.i18n.getMessage("PronounceTranslated")}
                    onKeyDown={activateOnKeyboard}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (stopping) return;

                      console.log("Target TTS stop clicked");
                      setStopping(true);
                      // frame_closed 이벤트 직접 발송 (번역창 닫을 때와 동일한 방식)
                      const emitPromise = channel.emit("frame_closed");
                      if (
                        emitPromise &&
                        typeof emitPromise.catch === "function"
                      ) {
                        emitPromise
                          .catch(() => {
                            // 실패 시 조용히 처리
                          })
                          .finally(() => {
                            setStopping(false);
                          });
                      } else {
                        // If emit doesn't return a promise, just call finally callback
                        setStopping(false);
                      }
                    }}
                    title={chrome.i18n.getMessage("PronounceTranslated")}
                  />
                ) : (
                  <StyledPronounceIcon
                          role="button"
                    tabIndex={0}
                    aria-label={chrome.i18n.getMessage("PronounceTranslated")}
                    title={chrome.i18n.getMessage("PronounceTranslated")}
                    onKeyDown={activateOnKeyboard}
                    onClick={() => setTargetPronounce(true)}
                  />
                ))}
              {displayTPronunciationIcon &&
                shouldShowGooglePronounce(
                  props.mainMeaning,
                  window.translateResult?.targetLanguage,
                ) && (
                  <StyledGooglePronounceIcon
                    role="button"
                    tabIndex={0}
                    aria-label={chrome.i18n.getMessage("OpenGooglePronounce")}
                    onKeyDown={activateOnKeyboard}
                    onClick={() => openGooglePronounce(props.mainMeaning)}
                    title={chrome.i18n.getMessage("OpenGooglePronounce")}
                  />
                )}
              {displayTPronunciation && (
                shouldShowPronunciationText(
                  props.mainMeaning,
                  window.translateResult?.targetLanguage,
                  props.tPronunciation,
                ) && (
                  <PronounceText
                    dir={textDirection}
                    DrawerHeight={TextContentDrawerHeight}
                    DisableDrawer={!foldLongContent}
                  >
                    {props.tPronunciation}
                  </PronounceText>
                )
              )}
            </PronounceLine>
          )}
        </Target>
      )}
    </Fragment>
  );

  const SourceContent = (
    <Fragment key={"originalText"}>
      {props.originalText?.length > 0 && (
        <Source>
          <SectionLabel>{chrome.i18n.getMessage("OriginalText")}</SectionLabel>
          <TextLine>
            <SecondaryText
              dir={textDirection}
              contenteditable={editing}
              ref={originalTextElRef}
            >
              {props.originalText}
            </SecondaryText>
            {editing ? (
              <StyledEditDoneIcon
                role="button"
                tabIndex={0}
                aria-label={chrome.i18n.getMessage("Retranslate")}
                onKeyDown={activateOnKeyboard}
                title={chrome.i18n.getMessage("Retranslate")}
                onClick={() =>
                  setEditing({
                    edit: false,
                    element: originalTextElRef.current,
                  })
                }
              />
            ) : (
              <StyledEditIcon
                role="button"
                tabIndex={0}
                aria-label={chrome.i18n.getMessage("EditText")}
                onKeyDown={activateOnKeyboard}
                title={chrome.i18n.getMessage("EditText")}
                onClick={() =>
                  setEditing({
                    edit: true,
                    element: originalTextElRef.current,
                  })
                }
              />
            )}
          </TextLine>
          {(displaySPronunciationIcon || displaySPronunciation) && (
            <PronounceLine>
              {displaySPronunciationIcon &&
                (sourcePronouncing ? (
                  <StyledPronounceLoadingIcon
                          role="button"
                    tabIndex={0}
                    aria-label={chrome.i18n.getMessage("PronounceOriginal")}
                    onKeyDown={activateOnKeyboard}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (stopping) return;

                      console.log("Source TTS stop clicked");
                      setStopping(true);
                      // frame_closed 이벤트 직접 발송 (번역창 닫을 때와 동일한 방식)
                      const emitPromise = channel.emit("frame_closed");
                      if (
                        emitPromise &&
                        typeof emitPromise.catch === "function"
                      ) {
                        emitPromise
                          .catch(() => {
                            // 실패 시 조용히 처리
                          })
                          .finally(() => {
                            setStopping(false);
                          });
                      } else {
                        // If emit doesn't return a promise, just call finally callback
                        setStopping(false);
                      }
                    }}
                    title={chrome.i18n.getMessage("PronounceOriginal")}
                  />
                ) : (
                  <StyledPronounceIcon
                          role="button"
                    tabIndex={0}
                    aria-label={chrome.i18n.getMessage("PronounceOriginal")}
                    title={chrome.i18n.getMessage("PronounceOriginal")}
                    onKeyDown={activateOnKeyboard}
                    onClick={() => setSourcePronounce(true)}
                  />
                ))}
              {displaySPronunciationIcon &&
                shouldShowGooglePronounce(
                  props.originalText,
                  window.translateResult?.sourceLanguage,
                ) && (
                  <StyledGooglePronounceIcon
                    role="button"
                    tabIndex={0}
                    aria-label={chrome.i18n.getMessage("OpenGooglePronounce")}
                    onKeyDown={activateOnKeyboard}
                    onClick={() => openGooglePronounce(props.originalText)}
                    title={chrome.i18n.getMessage("OpenGooglePronounce")}
                  />
                )}
              {displaySPronunciation && (
                shouldShowPronunciationText(
                  props.originalText,
                  window.translateResult?.sourceLanguage,
                  props.sPronunciation,
                ) && (
                  <PronounceText
                    dir={textDirection}
                    DrawerHeight={TextContentDrawerHeight}
                    DisableDrawer={!foldLongContent}
                  >
                    {props.sPronunciation}
                  </PronounceText>
                )
              )}
            </PronounceLine>
          )}
        </Source>
      )}
    </Fragment>
  );

  const DetailContent = (
    <Fragment key={"detailedMeanings"}>
      {props.detailedMeanings?.length > 0 && (
        <Detail>
          <BlockHead>
            <DetailHeadSpot />
            <BlockHeadTitle>
              {chrome.i18n.getMessage("DetailedMeanings")}
            </BlockHeadTitle>
            <BlockSplitLine />
          </BlockHead>
          <BlockContent
            DrawerHeight={BlockContentDrawerHeight}
            DisableDrawer={!foldLongContent}
          >
            {props.detailedMeanings.map((detail, detailIndex) => (
              <Fragment key={`detail-${detailIndex}`}>
                <Position dir={textDirection}>{detail.pos}</Position>
                <DetailMeaning dir={textDirection}>
                  {detail.meaning}
                </DetailMeaning>
                {detail.synonyms?.length > 0 && (
                  <Fragment>
                    <SynonymTitle dir={textDirection}>
                      {chrome.i18n.getMessage("Synonyms")}
                    </SynonymTitle>
                    <SynonymLine>
                      {detail.synonyms.map((word, synonymIndex) => (
                        <SynonymWord
                          key={`detail-synonym-${synonymIndex}`}
                          dir={textDirection}
                        >
                          {word}
                        </SynonymWord>
                      ))}
                    </SynonymLine>
                  </Fragment>
                )}
              </Fragment>
            ))}
          </BlockContent>
        </Detail>
      )}
    </Fragment>
  );

  const DefinitionContent = (
    <Fragment key={"definitions"}>
      {props.definitions?.length > 0 && (
        <Definition>
          <BlockHead>
            <DefinitionHeadSpot />
            <BlockHeadTitle>
              {chrome.i18n.getMessage("Definitions")}
            </BlockHeadTitle>
            <BlockSplitLine />
          </BlockHead>
          <BlockContent
            DrawerHeight={BlockContentDrawerHeight}
            DisableDrawer={!foldLongContent}
          >
            {props.definitions.map((definition, definitionIndex) => (
              <Fragment key={`definition-${definitionIndex}`}>
                <Position dir={textDirection}>{definition.pos}</Position>
                <DetailMeaning dir={textDirection}>
                  {definition.meaning}
                </DetailMeaning>
                {definition.example && (
                  <DefinitionExample
                    dir={textDirection}
                  >{`"${definition.example}"`}</DefinitionExample>
                )}
                {definition.synonyms?.length > 0 && (
                  <Fragment>
                    <SynonymTitle dir={textDirection}>
                      {chrome.i18n.getMessage("Synonyms")}
                    </SynonymTitle>
                    <SynonymLine>
                      {definition.synonyms.map((word, synonymIndex) => (
                        <SynonymWord
                          key={`definition-synonym-${synonymIndex}`}
                          dir={textDirection}
                        >
                          {word}
                        </SynonymWord>
                      ))}
                    </SynonymLine>
                  </Fragment>
                )}
              </Fragment>
            ))}
          </BlockContent>
        </Definition>
      )}
    </Fragment>
  );

  const ExampleContent = (
    <Fragment key={"examples"}>
      {props.examples?.length > 0 && (
        <Example>
          <BlockHead>
            <ExampleHeadSpot />
            <BlockHeadTitle>
              {chrome.i18n.getMessage("Examples")}
            </BlockHeadTitle>
            <BlockSplitLine />
          </BlockHead>
          <BlockContent
            DrawerHeight={BlockContentDrawerHeight}
            DisableDrawer={!foldLongContent}
          >
            <ExampleList dir={textDirection}>
              {props.examples.map((example, index) => (
                <ExampleItem key={`example-${index}`}>
                  {example.source && (
                    <ExampleSource
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(example.source, {
                          ALLOWED_TAGS: ["b"],
                        }),
                      }}
                    />
                  )}
                  {example.target && (
                    <ExampleTarget
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(example.target, {
                          ALLOWED_TAGS: ["b"],
                        }),
                      }}
                    />
                  )}
                </ExampleItem>
              ))}
            </ExampleList>
          </BlockContent>
        </Example>
      )}
    </Fragment>
  );

  /**
   * Content maps.
   */
  const CONTENTS = {
    mainMeaning: TargetContent,
    originalText: SourceContent,
    detailedMeanings: DetailContent,
    definitions: DefinitionContent,
    examples: ExampleContent,
  };

  useEffect(() => {
    sourceTTSSpeed = "fast";
    targetTTSSpeed = "fast";
    lastClickedButton = null;
    lastClickTime = 0;

    /*
     * COMMUNICATE WITH BACKGROUND MODULE
     */
    const cancelers = [];
    cancelers.push(
      channel.on("pronouncing_finished", (detail) => {
        if (checkTimestamp(detail.timestamp)) {
          if (detail.pronouncing === "source") {
            setSourcePronounce(false);
          } else if (detail.pronouncing === "target") {
            setTargetPronounce(false);
          } else if (detail.pronouncing === "both") {
            setSourcePronounce(false);
            setTargetPronounce(false);
          }
          setStopping(false);
        }
      }),
    );

    cancelers.push(
      channel.on("pronouncing_error", (detail) => {
        if (checkTimestamp(detail.timestamp)) {
          if (detail.pronouncing === "source") setSourcePronounce(false);
          else if (detail.pronouncing === "target") setTargetPronounce(false);
          notifier.notify({
            type: "error",
            title: chrome.i18n.getMessage("AppName"),
            detail: chrome.i18n.getMessage("PRONOUN_ERR"),
          });
        }
      }),
    );

    cancelers.push(
      channel.on("command", (detail) => {
        switch (detail.command) {
          case "pronounce_original":
            setSourcePronounce(true);
            break;
          case "pronounce_translated":
            setTargetPronounce(true);
            break;
          case "copy_result":
            if (
              window.translateResult.mainMeaning &&
              translateResultElRef.current
            ) {
              setCopyResult({
                copy: true,
                element: translateResultElRef.current,
              });
            }
            break;
          default:
            break;
        }
      }),
    );

    /**
     * Update displaying contents based on user's setting.
     */
    getOrSetDefaultSettings(
      [
        "LayoutSettings",
        "TranslateResultFilter",
        "ContentDisplayOrder",
        "Appearance",
      ],
      DEFAULT_SETTINGS,
    ).then((result) => {
      setContentDisplayOrder(result.ContentDisplayOrder);
      setDisplaySPronunciation(result.TranslateResultFilter["sPronunciation"]);
      setDisplayTPronunciation(result.TranslateResultFilter["tPronunciation"]);
      setDisplaySPronunciationIcon(
        result.TranslateResultFilter["sPronunciationIcon"],
      );
      setDisplayTPronunciationIcon(
        result.TranslateResultFilter["tPronunciationIcon"],
      );
      setContentFilter(result.TranslateResultFilter);
      setTextDirection(result.LayoutSettings.RTL ? "rtl" : "ltr");
      setFoldLongContent(result.LayoutSettings.FoldLongContent);
      applyAppearance(result.Appearance);
    });
    const onStorageChange = (changes, area) => {
      if (area !== "sync") return;

      if (changes.ContentDisplayOrder) {
        setContentDisplayOrder(changes.ContentDisplayOrder.newValue);
      }

      if (changes.TranslateResultFilter) {
        setDisplaySPronunciation(
          changes.TranslateResultFilter.newValue["sPronunciation"],
        );
        setDisplayTPronunciation(
          changes.TranslateResultFilter.newValue["tPronunciation"],
        );
        setDisplaySPronunciationIcon(
          changes.TranslateResultFilter.newValue["sPronunciationIcon"],
        );
        setDisplayTPronunciationIcon(
          changes.TranslateResultFilter.newValue["tPronunciationIcon"],
        );
        setContentFilter(changes.TranslateResultFilter.newValue);
      }

      if (changes.LayoutSettings) {
        setTextDirection(changes.LayoutSettings.newValue.RTL ? "rtl" : "ltr");
        setFoldLongContent(changes.LayoutSettings.newValue.FoldLongContent);
      }

      if (changes.Appearance) {
        applyAppearance(changes.Appearance.newValue);
      }
    };
    chrome.storage.onChanged.addListener(onStorageChange);
    const stopWatchingTheme = watchSystemTheme(() => {
      if (resolveAppearanceState(appearanceRef.current).themeMode === "auto") {
        applyAppearance(appearanceRef.current);
      }
    }, matchMediaFn);

    return () => {
      // remove all of event listeners before destroying the component
      cancelers.forEach((canceler) => canceler());
      chrome.storage.onChanged.removeListener(onStorageChange);
      stopWatchingTheme();
    };
  }, [applyAppearance, matchMediaFn]);

  return (
    <Fragment>
      <ThemeProvider theme={(props) => ({ ...props, textDirection, isDark })}>
        {contentDisplayOrder
          .filter((content) => contentFilter[content])
          .map((content) => CONTENTS[content])}
      </ThemeProvider>
    </Fragment>
  );
}

/**
 * STYLE FOR THE COMPONENT START
 */

const BlockPadding = "10px";
const BlockMargin = "8px";
const LightPrimary = colors.saffron;
const LightPrimarySoft = colors.clay;
const Gray = colors.muted;
const BgLight = colors.cream;
const BorderLight = colors.inputBorder;
const TextLight = colors.ink;
const MutedLight = colors.muted;
const BgDark = colors.darkSurface;
const TextDark = colors.darkText;
const GrayDark = colors.darkMuted;
const BorderDark = colors.darkMuted;
const BlockContentDrawerHeight = 150; // drawer height for blocks
const TextContentDrawerHeight = 50; // drawer height for texts

function activateOnKeyboard(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
}

/**
 * basic style for a block used to display content
 */
export const Block = styled.div`
  width: calc(100% - 2 * ${BlockMargin});
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: ${BlockPadding};
  margin: ${BlockMargin};
  margin-top: 0;
  background-color: ${(props) =>
    props.theme.isDark ? BgDark : BgLight};
  color: ${(props) => (props.theme.isDark ? TextDark : TextLight)};
  border-radius: 14px;
  border: 1px solid ${(props) => (props.theme.isDark ? BorderDark : BorderLight)};
  box-shadow: ${(props) =>
    props.theme.isDark
      ? "0 10px 24px rgba(0, 0, 0, 0.16)"
      : "0 10px 24px rgba(84, 84, 100, 0.06)"};
  line-height: 1.6;
  letter-spacing: 0.01em;
`;

const Source = styled(Block)`
  font-weight: normal;
  white-space: pre-wrap;
  background-color: ${(props) => (props.theme.isDark ? colors.darkNavy : colors.canvas)};
`;

const Target = styled(Block)`
  font-weight: normal;
  white-space: pre-wrap;
  background-color: ${(props) => (props.theme.isDark ? colors.darkSurface : colors.cream)};
`;

const Detail = styled(Block)`
  font-weight: normal;
`;

const TextLine = styled.div`
  width: 100%;
  display: flex;
  margin: 2px 0 0;
  flex-direction: ${(props) =>
    props.theme.textDirection === "ltr" ? "row" : "row-reverse"};
  justify-content: space-between;
  align-items: flex-start;
`;

const SectionLabel = styled.div`
  width: 100%;
  margin-bottom: 10px;
  color: ${(props) =>
    props.accent
      ? props.theme.isDark
        ? colors.saffron
        : colors.clay
      : props.theme.isDark
        ? colors.darkMuted
        : colors.muted};
  font-size: ${type.metadata};
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const PrimaryText = styled.div`
  flex: 1 1 auto;
  padding-left: 3px;
  font-size: ${type.body};
  line-height: 1.6;
  font-weight: 600;
  color: ${(props) => (props.theme.isDark ? colors.darkText : colors.ink)};
`;

const SecondaryText = styled.div`
  flex: 1 1 auto;
  padding-left: 3px;
  font-size: ${type.body};
  line-height: 1.6;
  font-weight: 400;
  color: ${(props) => (props.theme.isDark ? colors.darkText : colors.ink)};
`;

const StyledEditIcon = styled(EditIcon)`
  width: 32px;
  height: 32px;
  padding: 7px;
  box-sizing: border-box;
  cursor: pointer;
  color: ${(props) => (props.theme.isDark ? GrayDark : Gray)};
  flex-shrink: 0;
  margin-left: 10px;
  margin-top: 2px;
  transition: color 0.2s linear;
  &:focus-visible { outline: 2px solid ${(props) => props.theme.isDark ? colors.saffron : colors.deepBlue}; outline-offset: 1px; border-radius: 4px; }
  &:hover {
    color: ${(props) => (props.theme.isDark ? TextDark : TextLight)};
  }
`;

const StyledEditDoneIcon = styled(EditDoneIcon)`
  width: 32px;
  height: 32px;
  padding: 7px;
  box-sizing: border-box;
  cursor: pointer;
  color: ${(props) => (props.theme.isDark ? GrayDark : Gray)};
  flex-shrink: 0;
  margin-left: 10px;
  margin-top: 2px;
  transition: color 0.2s linear;
  &:focus-visible { outline: 2px solid ${(props) => props.theme.isDark ? colors.saffron : colors.deepBlue}; outline-offset: 1px; border-radius: 4px; }
  &:hover {
    color: ${(props) => (props.theme.isDark ? TextDark : TextLight)};
  }
`;

const PronounceLine = styled.div`
  width: 100%;
  margin: 5px 0;
  display: flex;
  flex-direction: ${(props) =>
    props.theme.textDirection === "ltr" ? "row" : "row-reverse"};
  justify-content: flex-start;
  align-items: center;
`;

const PronounceText = styled(DrawerBlock)`
  color: ${(props) => (props.theme.isDark ? GrayDark : Gray)};
`;

const StyledCopyIcon = styled(CopyIcon)`
  width: 32px;
  height: 32px;
  padding: 6px;
  box-sizing: border-box;
  cursor: pointer;
  color: ${(props) => (props.theme.isDark ? GrayDark : Gray)};
  flex-shrink: 0;
  margin-left: 10px;
  margin-top: 2px;
  transition: color 0.2s linear;
  &:focus-visible { outline: 2px solid ${(props) => props.theme.isDark ? colors.saffron : colors.deepBlue}; outline-offset: 1px; border-radius: 4px; }
  &:hover {
    color: ${(props) => (props.theme.isDark ? TextDark : TextLight)};
  }
`;

const StyledPronounceIcon = styled(PronounceIcon)`
  width: 32px;
  height: 32px;
  padding: 6px;
  box-sizing: border-box;
  cursor: pointer;
  margin-right: 10px;
  color: ${(props) => (props.theme.isDark ? LightPrimary : LightPrimarySoft)};
  flex-shrink: 0;
  transition: color 0.2s linear;
  &:focus-visible { outline: 2px solid ${(props) => props.theme.isDark ? colors.saffron : colors.deepBlue}; outline-offset: 1px; border-radius: 4px; }
  ${(props) =>
    props.theme.textDirection === "ltr"
      ? `
                margin-right: 10px;
            `
      : `
                margin-left: 10px;
                transform: rotate(180deg);
            `}

  &:hover {
    color: ${(props) => (props.theme.isDark ? "#ffc777" : "#cc6d00")} !important;
  }
`;

const StyledPronounceLoadingIcon = styled(PronounceLoadingIcon).attrs({ className: "translation-loading-icon" })`
  width: 32px; height: 32px; padding: 5px; box-sizing: border-box;
  margin-right: 10px; color: ${(props) => (props.theme.isDark ? LightPrimary : LightPrimarySoft)};
  flex-shrink: 0; cursor: pointer; transform-origin: center; transform-box: fill-box;
  animation: lucide-spin 1s linear infinite;
  @keyframes lucide-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { animation: none; }
  &:focus-visible { outline: 2px solid ${(props) => props.theme.isDark ? colors.saffron : colors.deepBlue}; outline-offset: 1px; border-radius: 4px; }
  &:hover { color: ${(props) => (props.theme.isDark ? "#ffc777" : "#cc6d00")} !important; }
`;

const StyledGooglePronounceIcon = styled(GooglePronounceIcon)`
  width: 32px;
  height: 32px;
  padding: 6px;
  box-sizing: border-box;
  cursor: pointer;
  margin-right: 10px;
  color: ${(props) => (props.theme.isDark ? LightPrimary : LightPrimarySoft)};
  flex-shrink: 0;
  transition: color 0.2s linear;
  &:focus-visible { outline: 2px solid ${(props) => props.theme.isDark ? colors.saffron : colors.deepBlue}; outline-offset: 1px; border-radius: 4px; }
  ${(props) =>
    props.theme.textDirection === "ltr"
      ? `
                margin-right: 10px;
            `
      : `
                margin-left: 10px;
            `}

  &:hover {
    color: ${(props) => (props.theme.isDark ? "#ffc777" : "#cc6d00")} !important;
  }
`;

const BlockHead = styled.div`
  width: 100%;
  display: flex;
  flex-direction: ${(props) =>
    props.theme.textDirection === "ltr" ? "row" : "row-reverse"};
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
`;

const BlockHeadTitle = styled.span`
  font-size: ${type.section};
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${(props) => (props.theme.isDark ? colors.darkMuted : colors.muted)};
  ${(props) =>
    `${props.theme.textDirection === "ltr" ? "margin-left" : "margin-right"}:${BlockPadding}`}
`;

/**
 * common style for the spot of block head
 */
const BlockHeadSpot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
`;

const BlockSplitLine = styled.div`
  width: 100%;
  height: 1px;
  margin: 5px 0;
  flex-shrink: 0;
  border: none;
  background: ${(props) =>
    props.theme.isDark ? "rgba(180, 192, 232, 0.16)" : "rgba(84, 84, 100, 0.18)"};
`;

const BlockContent = styled(DrawerBlock)`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: ${(props) =>
    props.theme.textDirection === "ltr" ? "flex-start" : "flex-end"};
  flex-shrink: 0;
`;

const DetailHeadSpot = styled(BlockHeadSpot)`
  background-color: ${(props) => (props.theme.isDark ? "#86e1fc" : "#597b75")};
`;

const Position = styled.div`
  color: ${(props) => (props.theme.isDark ? GrayDark : Gray)};
  font-size: ${type.metadata};
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const DetailMeaning = styled.div`
  padding: 5px 0;
  ${(props) =>
    props.theme.textDirection === "ltr" ? "margin-left" : "margin-right"}: 10px;
`;

const SynonymTitle = styled.div`
  color: ${(props) => (props.theme.isDark ? GrayDark : Gray)};
  font-size: ${type.metadata};
  ${(props) =>
    props.theme.textDirection === "ltr" ? "margin-left" : "margin-right"}: 10px;
`;

const SynonymLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 5px 0;
  ${(props) =>
    props.theme.textDirection === "ltr"
      ? `
                margin-left: 10px;
                flex-direction: row;
            `
      : `
                margin-right: 10px;       
                flex-direction: row-reverse;
            `};
`;

const SynonymWord = styled.span`
  padding: 2px 10px;
  margin: 0 2px 3px;
  border: 1px solid
    ${(props) =>
      props.theme.isDark ? "rgba(180, 192, 232, 0.18)" : "rgba(84, 84, 100, 0.14)"};
  border-radius: 32px;
  cursor: pointer;
  font-size: ${type.metadata};
`;

const Definition = styled(Block)``;

const DefinitionHeadSpot = styled(BlockHeadSpot)`
  background-color: ${(props) => (props.theme.isDark ? "#ff757f" : "#c84053")};
`;

const DefinitionExample = styled(DetailMeaning)`
  color: ${(props) => (props.theme.isDark ? GrayDark : MutedLight)};
`;

const Example = styled(Block)``;

const ExampleHeadSpot = styled(BlockHeadSpot)`
  background-color: ${(props) => (props.theme.isDark ? "#82aaff" : "#4d699b")};
`;

const ExampleList = styled.ol`
  list-style-type: decimal;
  ${(props) =>
    props.theme.textDirection === "ltr"
      ? "padding-left"
      : "padding-right"}: 24px;
  margin: 0;
`;

const ExampleItem = styled.li`
  padding: 5px 0;
  font-size: ${type.metadata};
`;

const ExampleSource = styled.div`
  font-size: ${type.body};
  line-height: 1.45;
`;

const ExampleTarget = styled.div`
  padding-top: 5px;
  font-size: ${type.body};
  line-height: 1.45;
`;

/**
 * STYLE FOR THE COMPONENT END
 */

/**
 * A reducer for source pronouncing state
 * Send message to background to pronounce the translating text.
 */
function sourcePronounce(_, startPronounce) {
  if (startPronounce) {
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - lastClickTime;

    // Only toggle speed if same button clicked consecutively within 3 seconds
    if (lastClickedButton === "source" && timeSinceLastClick < 3000) {
      sourceTTSSpeed = sourceTTSSpeed === "fast" ? "slow" : "fast";
    } else {
      // Reset to fast speed for first click or after switching buttons
      sourceTTSSpeed = "fast";
    }

    lastClickedButton = "source";
    lastClickTime = currentTime;

    const requestPromise = channel.request("pronounce", {
      pronouncing: "source",
      text: window.translateResult.originalText,
      language: window.translateResult.sourceLanguage,
      speed: sourceTTSSpeed,
    });
    if (requestPromise && typeof requestPromise.catch === "function") {
      requestPromise.catch(() => {
        // TTS 실패 처리는 조용히
      });
    }
  }
  return startPronounce;
}

/**
 * A reducer for target pronouncing state
 */
function targetPronounce(_, startPronounce) {
  if (startPronounce) {
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - lastClickTime;

    // Only toggle speed if same button clicked consecutively within 3 seconds
    if (lastClickedButton === "target" && timeSinceLastClick < 3000) {
      targetTTSSpeed = targetTTSSpeed === "fast" ? "slow" : "fast";
    } else {
      // Reset to fast speed for first click or after switching buttons
      targetTTSSpeed = "fast";
    }

    lastClickedButton = "target";
    lastClickTime = currentTime;

    const requestPromise = channel.request("pronounce", {
      pronouncing: "target",
      text: window.translateResult.mainMeaning,
      language: window.translateResult.targetLanguage,
      speed: targetTTSSpeed,
    });
    if (requestPromise && typeof requestPromise.catch === "function") {
      requestPromise.catch(() => {
        // TTS 실패 처리는 조용히
      });
    }
  }
  return startPronounce;
}

/**
 * A reducer for copying state of translation result
 * @param {*} _
 * @param {
 *     copy: boolean;  // new state
 *     element: HTMLElement; // the element for displaying translation results
 * } action
 */
function copyContent(_, action) {
  if (action.copy && action.element) {
    /**
     * This line is to make sure the div element is editable before the focus action.
     * Because of the react mechanism, contenteditable={copyResult} will work after this function is executed.
     */
    action.element.setAttribute("contenteditable", "true");

    action.element.focus();

    // select all content automatically
    let range = document.createRange();
    range.selectNodeContents(action.element);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    document.execCommand("copy");
  } else if (!action.copy) window.getSelection().removeAllRanges();
  return action.copy;
}

/**
 * The following 4 functions are intended to prevent input events from being caught by other elements.
 */

/**
 * Prevent keydown event from propagation.
 *
 * @param {Event} event keydown event.
 */
function onKeyDownInTextEditor(event) {
  event.stopPropagation();
}

/**
 * Prevent keyup event from propagation.
 *
 * @param {Event} event keyup event.
 */
function onKeyUpInTextEditor(event) {
  event.stopPropagation();
}

/**
 * When the input box gets focused, prevent input events from propagation.
 *
 * @param {Event} event focus event.
 */
function onTextEditorFocused(event) {
  event.target.addEventListener("keydown", onKeyDownInTextEditor);
  event.target.addEventListener("keyup", onKeyUpInTextEditor);
}

/**
 * When the input box gets blurred, allow input events propagation.
 *
 * @param {Event} event blur event.
 */
function onTextEditorBlurred(event) {
  event.target.removeEventListener("keydown", onKeyDownInTextEditor);
  event.target.removeEventListener("keyup", onKeyUpInTextEditor);
}

/**
 * Edit original text.
 *
 * @param {HTMLElement} originalTextEle original text element
 */
function editOriginalText(originalTextEle) {
  // Prevent input events from propagation.
  originalTextEle.addEventListener("focus", onTextEditorFocused);
  originalTextEle.addEventListener("blur", onTextEditorBlurred);

  /**
   * Make the editable element automatically focus.
   * Use setTimeout because of https://stackoverflow.com/a/37162116.
   */
  setTimeout(() => originalTextEle.focus());
}

/**
 * Submit and translate edited text.
 *
 * @param {HTMLElement} originalTextEle original text element
 */
function submitEditedText(originalTextEle) {
  // Allow input events propagation.
  originalTextEle.removeEventListener("focus", onTextEditorFocused);
  originalTextEle.removeEventListener("blur", onTextEditorBlurred);

  let text = originalTextEle.textContent.trim();
  if (text.length > 0) {
    // to make sure the new text is different from the original text
    if (text.valueOf() !== window.translateResult.originalText.valueOf()) {
      // Do translating.
      channel.request("translate", { text });
    }
  } else {
    // Restore original text.
    originalTextEle.textContent = window.translateResult.originalText;
  }
}

/**
 * A reducer for updating editing state of original text.
 *
 * @param {any} _ nothing
 * @param {{edit: boolean; element: HTMLElement;}} state new state information
 * @returns new state
 */
function _setEditing(_, state) {
  if (state.element) {
    if (state.edit) {
      editOriginalText(state.element);
    } else {
      submitEditedText(state.element);
    }
  }
  return state.edit;
}
