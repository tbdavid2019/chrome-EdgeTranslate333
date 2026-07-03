/** @jsx h */
import { h, cloneElement } from "preact";
import { forwardRef } from "preact/compat";
import { useState, useRef, useCallback, useEffect } from "preact/hooks";
import styled, { css } from "styled-components";
import ArrowDownIcon from "./icons/arrow-down.svg";

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
    const clickAwayHandler = useCallback((event) => {
        // Chrome has the "path" property and Firefox has the "composedPath" function.
        const path = event.path || (event.composedPath && event.composedPath());
        if (!titleElRef.current.contains(path[0])) {
            setOpen(false);
            window.removeEventListener("click", clickAwayHandler);
        }
    }, []);
    const Items = props.children?.map((child) =>
        cloneElement(child, {
            active: child.props.eventKey === props.activeKey,
            onSelect: (eventKey, event) => {
                if (eventKey !== props.activeKey) props.onSelect && props.onSelect(eventKey, event);
            },
        })
    );
    useEffect(() => {
        return () => window.removeEventListener("click", clickAwayHandler);
    }, [clickAwayHandler]);

    return (
        <StyledSelect className={props.className} ref={ref}>
            <Title
                ref={titleElRef}
                onClick={() => {
                    if (!open) {
                        window.addEventListener("click", clickAwayHandler);
                        props.onOpen && props.onOpen();
                    } else props.onClose && props.onClose();
                    setOpen(!open);
                }}
            >
                {props.title}
                <StyledArrowDownIcon />
            </Title>
            <Menu open={open}>{Items}</Menu>
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
            role="menuitem"
            className={props.className}
            active={props.active}
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
    font-size: 14px;
    text-align: left;
    background-color: ${(props) => (props.theme?.isDark ? "#2a2e45" : "#f7f3d0")};
    color: ${(props) => (props.theme?.isDark ? "#c8d3f5" : "#545464")};
    border: 1px solid ${(props) => (props.theme?.isDark ? "#3b4261" : "#c9c19f")};
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
    color: ${(props) => (props.theme?.isDark ? "#b4c0e8" : "#716e61")};
    background-color: transparent;
    overflow: hidden;
    &:hover {
        color: ${(props) => (props.theme?.isDark ? "#c8d3f5" : "#545464")};
        background: ${(props) => (props.theme?.isDark ? "#2f334d" : "#e9dfb5")};
    }
    &:hover svg {
        fill: ${(props) => (props.theme?.isDark ? "#c8d3f5" : "#545464")};
    }
`;
const StyledArrowDownIcon = styled(ArrowDownIcon)`
    fill: ${(props) => (props.theme?.isDark ? "#828bb8" : "#8a8980")};
    margin-left: 4px;
`;

/* Style of Item */
const ActiveStyle = css`
    color: ${(props) => (props.theme?.isDark ? "#82aaff" : "#4d699b")};
    font-weight: 700;
    background-color: ${(props) =>
        props.theme?.isDark ? "rgba(130, 170, 255, 0.18)" : "rgba(77, 105, 155, 0.12)"};
    &:hover {
        color: ${(props) => (props.theme?.isDark ? "#82aaff" : "#4d699b")};
        background-color: ${(props) =>
            props.theme?.isDark ? "rgba(130, 170, 255, 0.18)" : "rgba(77, 105, 155, 0.12)"};
    }
`;
const InActiveStyle = css`
    color: ${(props) => (props.theme?.isDark ? "#c8d3f5" : "#545464")};
    &:hover {
        color: ${(props) => (props.theme?.isDark ? "#c8d3f5" : "#545464")};
        background-color: ${(props) => (props.theme?.isDark ? "#2f334d" : "#f2ecbc")};
    }
`;
const Item = styled.li`
    display: flex;
    padding: 8px 12px;
    clear: both;
    font-weight: 400;
    line-height: 1.4;
    white-space: nowrap;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
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
