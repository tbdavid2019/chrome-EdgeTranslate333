/** @jsx h */
import { h } from "preact";
import { CircleCheck as SuccessIcon, Info as InfoIcon, TriangleAlert as WarningIcon, CircleAlert as ErrorIcon, X as CloseIcon } from "lucide-preact";

/**
 * @param {{
 *   type: "success" | "info" | "warning" | "error",
 *   title: string,
 *   detail: string?,
 *   closeIcon: boolean,
 *   duration: number,
 * }} props notification content
 * @returns {h.JSX.Element} element
 */
export default function NotifierTemplate(props) {
    return (
        <div
            class={`edge-translate-notifier-item edge-translate-notifier-show-animation edge-translate-notifier-${props.type}`}
        >
            <div class="edge-translate-notifier-icon">
                {props.type === "success" && <SuccessIcon aria-hidden="true" />}
                {props.type === "info" && <InfoIcon aria-hidden="true" />}
                {props.type === "warning" && <WarningIcon aria-hidden="true" />}
                {props.type === "error" && <ErrorIcon aria-hidden="true" />}
            </div>
            <div class="edge-translate-notifier-content">
                <div class="edge-translate-notifier-title">{props.title}</div>
                <div class="edge-translate-notifier-detail">{props.detail}</div>
            </div>
            <button
                type="button"
                class="edge-translate-notifier-close"
                aria-label={chrome.i18n.getMessage("Close")}
            >
                {(props.closeIcon || props.duration <= 0) && <CloseIcon aria-hidden="true" />}
            </button>
        </div>
    );
}
