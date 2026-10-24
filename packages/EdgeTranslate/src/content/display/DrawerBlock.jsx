/** @jsx h */
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useMeasure } from "react-use";
import styled from "styled-components";
import { ChevronDown as ArrowDownIcon } from "lucide-preact";
import { translationColors as colors } from "common/scripts/uiTheme.js";

/**
 *
 * @param {{
 *   DrawerHeight: number;
 *   DisableDrawer?: boolean; // disable the function of drawer
 *   children?: h.JSX.Element;
 * }} props
 * @returns {h.JSX.Element} element
 */
export default function DrawerBlock(props) {
    // Indicate whether the drawer should work or not.
    const [useDrawer, setUseDrawer] = useState(false);
    // Indicate whether the drawer is folded or not.
    const [fold, setFold] = useState(true);

    // Measure the size mutation of the content element.
    const [contentElRef, { height: originalHeight }] = useMeasure();

    useEffect(() => {
        if (props.DisableDrawer || props.DrawerHeight === undefined) {
            setUseDrawer(false);
            return;
        }
        if (originalHeight < props.DrawerHeight) {
            setUseDrawer(false);
        } else {
            setUseDrawer(true);
        }
    }, [props, originalHeight]);

    return (
        <Drawer
            className={props.className}
            height={(() => {
                if (useDrawer) {
                    if (fold) return props.DrawerHeight;
                    return originalHeight + HandleExpandHeight;
                }
            })()}
        >
            <Content ref={contentElRef}>{props.children}</Content>
            {useDrawer && (
                <Handle
                    type="button"
                    fold={fold}
                    aria-expanded={!fold}
                    aria-label={chrome.i18n.getMessage(fold ? "ClickToExpand" : "ClickToFold")}
                    onClick={() => setFold(!fold)}
                >
                    {fold ? (
                        <StyledArrowDownIcon title={chrome.i18n.getMessage("ClickToExpand")} aria-hidden="true" />
                    ) : (
                        <StyledArrowDownIcon class="drawer-chevron-open" title={chrome.i18n.getMessage("ClickToFold")} aria-hidden="true" />
                    )}
                </Handle>
            )}
        </Drawer>
    );
}

/**
 * STYLE FOR THE COMPONENT START
 */
const HandleFoldHeight = 40; // Height of the drawer handle when the drawer is folded.
const HandleExpandHeight = 32; // Height of the drawer handler when the drawer is expanded.
const Drawer = styled.div`
    overflow: hidden;
    position: relative;
    transition: height 0.4s;
    ${(props) => (props.height ? `height: ${props.height}px` : "")}
    @media (prefers-reduced-motion: reduce) { transition: none; }
`;
const Content = styled.div``;
/**
 * @param {{
 *   fold: boolean; // Whether the drawer is folded.
 * }} props
 */
const Handle = styled.button`
    width: 100%;
    min-height: 32px;
    height: ${(props) => (props.fold ? HandleFoldHeight : HandleExpandHeight)}px;
    padding: 0;
    border: 0;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    cursor: pointer;
    background: linear-gradient(transparent 0%, ${(props) => props.theme?.isDark ? "rgba(11, 26, 41, 0.45)" : "rgba(255, 240, 204, 0.55)"} 35%, ${(props) => props.theme?.isDark ? colors.darkNavy : colors.canvas} 100%);
    ${(props) => (props.fold ? "position: absolute; bottom: 0;" : "")}
    &:focus-visible { outline: 2px solid ${(props) => props.theme?.isDark ? colors.saffron : colors.deepBlue}; outline-offset: -2px; }

    &:hover {
        background: linear-gradient(
            transparent 0%,
            ${(props) => props.theme?.isDark ? "rgba(23, 50, 77, 0.75)" : "rgba(255, 240, 204, 0.8)"} 35%,
            ${(props) => props.theme?.isDark ? colors.darkSurface : colors.canvas} 100%
        );
    }

    &:hover svg {
        color: ${(props) => props.theme?.isDark ? colors.darkText : colors.ink};
    }
`;
const StyledArrowDownIcon = styled(ArrowDownIcon)`
    width: 20px; height: 20px; color: ${(props) => props.theme?.isDark ? colors.darkMuted : colors.muted};
    transform: rotate(0deg); transition: transform 180ms ease;
    &.drawer-chevron-open { transform: rotate(180deg); }
    @media (prefers-reduced-motion: reduce) { transition: none; }
`;
/**
 * STYLE FOR THE COMPONENT END
 */
