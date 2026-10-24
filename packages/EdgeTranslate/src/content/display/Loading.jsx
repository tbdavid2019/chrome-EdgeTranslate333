/** @jsx h */
import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import styled from "styled-components";
import { LoaderCircle } from "lucide-preact";
import { ContentWrapperCenterClassName } from "./Panel.jsx";
import { translationColors as colors } from "common/scripts/uiTheme.js";

export default function Loading() {
    const loadingElRef = useRef();
    useEffect(() => {
        const wrapperElement = loadingElRef.current.parentElement.parentElement;
        wrapperElement.classList.add(ContentWrapperCenterClassName);
        return () => wrapperElement.classList.remove(ContentWrapperCenterClassName);
    }, []);
    return (
        <LoadingEffect ref={loadingElRef} role="status" aria-live="polite" aria-label={chrome.i18n.getMessage("Loading") || "Loading translation"} data-testid="translation-loading-icon">
            <LoaderCircle className="translation-loading-glyph" aria-hidden="true" />
        </LoadingEffect>
    );
}

const LoadingEffect = styled.div`
    width: 100%;
    min-height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme?.isDark ? colors.saffron : colors.deepBlue};
    .translation-loading-glyph {
        width: 32px;
        height: 32px;
        stroke-width: 2;
        transform-box: fill-box;
        transform-origin: center;
        animation: translation-loader-spin 1s linear infinite;
    }
    @keyframes translation-loader-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .translation-loading-glyph { animation: none; } }
`;
