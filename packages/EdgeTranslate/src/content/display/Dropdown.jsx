/** @jsx h */
import { h, cloneElement } from "preact";
import { forwardRef } from "preact/compat";
import { useState, useRef, useCallback, useEffect } from "preact/hooks";
import styled, { css } from "styled-components";
import { ChevronDown as ArrowDownIcon } from "lucide-preact";
import { translationColors as colors } from "common/scripts/uiTheme.js";

/**
 *
 * @param {{
 *   className?: string;
 *   title: string; // Menu defaults to display content.
 *   activeKey?: any; // Similar to the value property of select element.
 *   onSelect?: (eventKey: any, event: MouseEvent) => void; // Selected callback function.
 *   onOpen?: ()=>void; // Menu Pop-up callback function
 *   onClose?: ()=>void; // The callback function that the menu closes.
 *   children?: h.JSX.Element;
 * }} props
 * @returns {h.JSX.Element} element
 */
const Dropdown = forwardRef((props, ref) => {
    const [open, setOpen] = useState(false);
    const titleElRef = useRef();
    const menuElRef = useRef();
    const clickAwayHandlerRef = useRef();
    const onCloseRef = useRef(props.onClose);
    onCloseRef.current = props.onClose;
    const setMenuOpen = useCallback((next, returnFocus = false) => {
        setOpen(next);
        if (!next) {
            window.removeEventListener("click", clickAwayHandlerRef.current);
            onCloseRef.current && onCloseRef.current();
            if (returnFocus) titleElRef.current?.focus();
        }
    }, []);
    const clickAwayHandler = useCallback((event) => {
        const path = event.composedPath?.() || event.path || [];
        if (!path.includes(titleElRef.current) && !path.includes(menuElRef.current)) setMenuOpen(false);
    }, [setMenuOpen]);
    clickAwayHandlerRef.current = clickAwayHandler;
    const focusItem = (index) => {
        const items = menuElRef.current?.querySelectorAll("[role=menuitemradio]");
        if (!items?.length) return;
        const next = (index + items.length) % items.length;
        items.forEach((item, i) => item.tabIndex = i === next ? 0 : -1);
        items[next].focus();
    };
    const handleTitleKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
            event.preventDefault();
            if (!open) {
                setOpen(true);
                window.addEventListener("click", clickAwayHandler);
                props.onOpen && props.onOpen();
                requestAnimationFrame(() => focusItem(0));
            } else if (event.key === "ArrowDown") focusItem(0);
        } else if (event.key === "Escape" && open) setMenuOpen(false, true);
    };
    const handleItemKeyDown = (event) => {
        const items = [...(menuElRef.current?.querySelectorAll("[role=menuitemradio]") || [])];
        const index = items.indexOf(event.currentTarget);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault(); focusItem(index + (event.key === "ArrowDown" ? 1 : -1));
        } else if (event.key === "Home") { event.preventDefault(); focusItem(0); }
        else if (event.key === "End") { event.preventDefault(); focusItem(items.length - 1); }
        else if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false, true); }
        else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.click(); }
    };
    const Items = props.children?.map((child) =>
        cloneElement(child, {
            active: child.props.eventKey === props.activeKey,
            onSelect: (eventKey, event) => {
                if (eventKey !== props.activeKey) props.onSelect && props.onSelect(eventKey, event);
                setMenuOpen(false, true);
            },
            onKeyDown: handleItemKeyDown,
        })
    );
    useEffect(() => {
        return () => window.removeEventListener("click", clickAwayHandlerRef.current);
    }, []);

    return (
        <StyledSelect className={props.className} ref={ref}>
            <Title
                as="button"
                ref={titleElRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={props["aria-label"] || props.title}
                onClick={() => {
                    if (!open) {
                        window.addEventListener("click", clickAwayHandler);
                        props.onOpen && props.onOpen();
                        setOpen(true);
                    } else setMenuOpen(false);
                }}
                onKeyDown={handleTitleKeyDown}
            >
                {props.title}
                <StyledArrowDownIcon open={open} aria-hidden="true" />
            </Title>
            <Menu ref={menuElRef} role="menu" open={open}>{Items}</Menu>
        </StyledSelect>
    );
});
Dropdown.displayName = "Dropdown";

/**
 *
 * @param {{
 *   className?: string;
 *   eventKey: any; // The value of the current option.
 *   active: boolean; // Active the current option.
 *   onSelect: (eventKey: any, event: MouseEvent) => void; // Select the callback function for the current option.
 *   children?: h.JSX.Element;
 * }} props
 * @returns {h.JSX.Element} element
 */
Dropdown.Item = function DropdownItem(props) {
    return (
        <Item
            role="menuitemradio"
            className={props.className}
            active={props.active}
            tabIndex={props.active ? 0 : -1}
            aria-checked={Boolean(props.active)}
            onKeyDown={props.onKeyDown}
            onClick={(event) => {
                props.onSelect && props.onSelect(props.eventKey, event);
            }}
        >
            {props.children}
        </Item>
    );
};
export default Dropdown;

/**
 * STYLE FOR THE COMPONENT START
 */
const StyledSelect = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    font-size: 0;
`;
const Menu = styled.ul`
    display: ${(props) => (props.open ? "block" : "none")};
    min-width: 100px;
    margin: 0;
    list-style: none;
    font-size: 16px;
    text-align: left;
    background-color: ${(props) => (props.theme?.isDark ? colors.darkNavy : colors.cream)};
    color: ${(props) => (props.theme?.isDark ? colors.darkText : colors.ink)};
    border: 1px solid ${(props) => (props.theme?.isDark ? colors.darkMuted : colors.inputBorder)};
    border-radius: 6px;
    padding: 6px 0;
    position: absolute;
    left: 0;
    top: 100%;
    z-index: 6;
    float: left;
    box-shadow: ${(props) =>
        props.theme?.isDark
            ? "0 12px 30px rgba(0, 0, 0, 0.35)"
            : "0 12px 28px rgba(84, 84, 100, 0.12)"};
`;
const Title = styled.a`
    display: flex;
    align-items: center;
    margin-bottom: 0;
    font-weight: 400;
    text-align: center;
    cursor: pointer;
    outline: 0;
    white-space: nowrap;
    border: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    padding: 2px 8px;
    font-size: 14px;
    line-height: 1.5;
    border-radius: 6px;
    transition: color 0.2s linear, background-color 0.3s linear;
    color: ${(props) => (props.theme?.isDark ? colors.darkMuted : colors.muted)};
    background-color: transparent;
    overflow: hidden;
    min-height: 32px;
    font-family: inherit;
    cursor: pointer;
    &:focus-visible { outline: 2px solid ${(props) => props.theme?.isDark ? colors.saffron : colors.deepBlue}; outline-offset: 2px; }
    &:hover {
    color: ${(props) => (props.theme?.isDark ? colors.darkText : colors.ink)};
    background: ${(props) => (props.theme?.isDark ? colors.darkSurface : colors.canvas)};
    }
    &:hover svg {
        color: ${(props) => (props.theme?.isDark ? colors.darkText : colors.ink)};
    }
`;
const StyledArrowDownIcon = styled(ArrowDownIcon)`
    color: ${(props) => (props.theme?.isDark ? colors.darkMuted : colors.muted)};
    width: 18px;
    height: 18px;
    margin-left: 4px;
    transition: transform 180ms ease;
    transform: rotate(${(props) => (props.open ? "180deg" : "0deg")});
    @media (prefers-reduced-motion: reduce) { transition: none; }
`;

/* Style of Item */
const ActiveStyle = css`
    color: ${(props) => (props.theme?.isDark ? colors.saffron : colors.clay)};
    font-weight: 700;
    background-color: ${(props) =>
        props.theme?.isDark ? "rgba(255, 176, 16, 0.18)" : "rgba(169, 71, 29, 0.12)"};
    &:hover {
        color: ${(props) => (props.theme?.isDark ? colors.saffron : colors.clay)};
        background-color: ${(props) =>
        props.theme?.isDark ? "rgba(255, 176, 16, 0.18)" : "rgba(169, 71, 29, 0.12)"};
    }
`;
const InActiveStyle = css`
    color: ${(props) => (props.theme?.isDark ? colors.darkText : colors.ink)};
    &:hover {
        color: ${(props) => (props.theme?.isDark ? colors.darkText : colors.ink)};
        background-color: ${(props) => (props.theme?.isDark ? colors.darkSurface : colors.canvas)};
    }
`;
const Item = styled.li`
    display: flex;
    min-height: 32px;
    box-sizing: border-box;
    align-items: center;
    padding: 6px 12px;
    clear: both;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.4;
    white-space: nowrap;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    &:focus-visible { outline: 2px solid ${(props) => props.theme?.isDark ? colors.saffron : colors.deepBlue}; outline-offset: -2px; }
    -webkit-transition: color 0.3s linear, background-color 0.3s linear;
    transition: color 0.3s linear, background-color 0.3s linear;
    transition: color 0.3s linear, background-color 0.3s linear;
    transition-property: color, background-color;
    transition-duration: 0.3s, 0.3s;
    transition-timing-function: linear, linear;
    transition-delay: 0s, 0s;
    ${(props) => (props.active ? ActiveStyle : InActiveStyle)}
`;
/**
 * STYLE FOR THE COMPONENT END
 */
