/**
 * module: content
 * part: display.notifier
 * function:  a notifier to notify users of messages including(info, success, warning, error)
 */
/** @jsx h */
import { h } from "preact";
import render from "preact-render-to-string";
import NotifierTemplate from "./notifier.jsx";
import { delayPromise } from "common/scripts/promise.js";

// prefix for CSS selector name
const SELECTOR_PREFIX = "edge-translate-notifier-";
const STYLE_PATH = "content/display/library/notifier/notification.css";
// the animation duration in CSS file
const ANIMATION_DURATION = 400;

export default class Notifier {
    /**
     * @param {string} position enum{"center", "left", "right"} locate the position on screen to display all notification
     */
    constructor(position = "center") {
        this.position = position;
        this.notificationCount = 0;
        this.destroyingNotifications = new WeakSet();
        this.notificationTimeouts = new WeakMap();
    }

    createContainer() {
        /* create a shadow dom container */
        this.notifierContainer = document.createElement("div");
        this.notifierContainer.classList.add(
            `${SELECTOR_PREFIX}${this.position}`,
            `${SELECTOR_PREFIX}container`
        );
        // store a shadow dom which is used to attach notifier container
        this.shadowDom = this.notifierContainer.attachShadow({ mode: "open" });

        /* append style element */
        let styleElement = document.createElement("link");
        styleElement.rel = "stylesheet";
        styleElement.type = "text/css";
        styleElement.href = chrome.runtime.getURL(STYLE_PATH);
        this.shadowDom.appendChild(styleElement);

        document.documentElement.appendChild(this.notifierContainer);

        // listen to click event for closeIcon
        this.shadowDom.addEventListener("click", (event) => {
            const path = typeof event.composedPath === "function"
                ? event.composedPath()
                : event.path || this.getEventPath(event.target);
            let closeButton = false;
            for (const target of path) {
                if (target === this.shadowDom) return;
                if (!target || !target.classList) continue;
                if (target.classList.contains(`${SELECTOR_PREFIX}close`)) {
                    closeButton = true;
                } else if (
                    closeButton &&
                    target.classList.contains(`${SELECTOR_PREFIX}item`)
                ) {
                    this.destroyNotification(target);
                    return;
                }
            }
        });
    }

    getEventPath(target) {
        const path = [];
        while (target) {
            path.push(target);
            if (target === this.shadowDom) break;
            target = target.parentNode;
        }
        return path;
    }

    destroyContainer() {
        if (document.documentElement.contains(this.notifierContainer)) {
            document.documentElement.removeChild(this.notifierContainer);
            this.notifierContainer = null;
            this.shadowDom = null;
        }
    }

    /**
     * notify users of messages on the screen
     * @param {object} notificationOption definition is same as the default option below
     */
    notify(notificationOption) {
        // definition of default option
        const option = {
            // type = enum{"info", "success", "warning", "error"}
            type: "info",
            element: null,
            // title of the notification
            title: null,
            // detail of the notification
            detail: null,
            // can't be smaller than ${ANIMATION_DURATION}
            duration: 3000,
            timeoutId: -1,
            /**
             * whether to show the close icon
             * if duration <= 0, we will ignore this option and show the close icon
             */
            closeIcon: false,
        };
        Object.assign(option, notificationOption);
        if (!option.title) return;
        if (option.duration < ANIMATION_DURATION) option.duration = 0;

        if (!this.notifierContainer) this.createContainer();

        let notificationElement = document.createElement("div");
        notificationElement.innerHTML = render(<NotifierTemplate {...option} />);
        notificationElement = notificationElement.firstChild;
        option.element = notificationElement;
        this.shadowDom.insertBefore(notificationElement, this.shadowDom.firstChild);

        const setDestroyTimeout = () => {
            if (option.duration) {
                clearTimeout(option.timeoutId);
                option.timeoutId = setTimeout(() => {
                    this.destroyNotification(option.element);
                }, option.duration);
                this.notificationTimeouts.set(option.element, option.timeoutId);
            }
        };
        setDestroyTimeout();

        // if the mouse move into the notification element, the notification won't disappear.
        // to make sure the user has enough time to read the notification
        notificationElement.addEventListener("mouseenter", () => {
            if (option.timeoutId !== -1) {
                clearTimeout(option.timeoutId);
                option.timeoutId = -1;
            }
        });
        // resume timeout after user's mouse leave the notification element
        notificationElement.addEventListener("mouseleave", () => setDestroyTimeout());
        this.notificationCount++;
    }

    /**
     * private function
     * disappear the notification on screen
     * @param {Element} notificationElement the notification element to be removed
     */
    async destroyNotification(notificationElement) {
        const shadowDom = this.shadowDom;
        if (
            !(notificationElement instanceof Element) ||
            !shadowDom ||
            !shadowDom.contains(notificationElement) ||
            this.destroyingNotifications.has(notificationElement)
        ) return;

        this.destroyingNotifications.add(notificationElement);
        clearTimeout(this.notificationTimeouts.get(notificationElement));
        notificationElement.classList.add(`${SELECTOR_PREFIX}disappear-animation`);
        await delayPromise(ANIMATION_DURATION);
        if (!shadowDom.contains(notificationElement)) return;
        shadowDom.removeChild(notificationElement);
        this.notificationCount = Math.max(0, this.notificationCount - 1);
        if (this.notificationCount === 0 && shadowDom === this.shadowDom) this.destroyContainer();
    }
}
