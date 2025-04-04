/*
 * Provide a messaging api equivalent to what is supplied by Thunderbird when running as an extension
 */
import { iframeService } from "@iases3/iframe-service/src/iframe-service";
import { Email, Prefs } from "../../interface/src/types/modelTypes";
import { getUniqueMessageId } from "../../interface/src/helpers/getUniqueMessageId";

if (typeof iframeService === "undefined") {
    console.warn("iframeService is undefined. It must be loaded first!");
}

try {
    (function () {
        // Let background.js know that we're ready.
        // We must send a message because there is no other way for background.js to know that we're loaded.
        browser.runtime.sendMessage({ status: "loaded" });

        /*
         * Functions to simulate the mailmerge commands
         */
        function getDefaultPreferences() {
            return {
                delay: 0,
                sendmode: "now",
                range: "",
                fileName: "",
                fileContents: [],
            };
        }

        async function getPreferences() {
            let prefs = getDefaultPreferences();
            try {
                const fetched = await browser.storage.local.get("prefs");
                if (fetched.prefs) {
                    prefs = fetched.prefs;
                }
            } catch (error) {
                console.warn("error when loading prefs", error);
            }
            return prefs;
        }

        async function setPreferences(prefs: Prefs) {
            const newPrefs = { ...(await getPreferences()), ...prefs };
            await browser.storage.local.set({ prefs: newPrefs });
        }

        function getLocalizedStrings() {
            const stringNames = [
                "next",
                "previous",
                "cancel",
                "send",
                "data",
                "dataInfo",
                "openAFile",
                "dataHeaderWarning",
                "settings",
                "preview",
                "sendMode",
                "sendModeDesc",
                "sendModeNow",
                "sendModeLater",
                "sendModeDraft",
                "messageDelay",
                "messageDelayDesc",
                "sendMessageRange",
                "sendMessageRangeDesc",
                "previewEmpty",
                "previewPreviewing",
                "about",
                "developers",
                "support",
                "license",
                "donate",
                "euro",
                "dollar",
                "current",
                "total",
                "time",
                "progress",
                "status",
                "sending",
                "waiting",
            ];
            const ret: Record<string, string> = {};
            for (const name of stringNames) {
                ret[name] = browser.i18n.getMessage(name);
            }
            return ret;
        }

        async function sendEmail(email: Email, sendmode: Prefs["sendmode"]) {
            // Sending messages in the background blocked until https://bugzilla.mozilla.org/show_bug.cgi?id=1545930 is resolved.

            // Create the email in a new compose window and then send it.
            const newWin = await browser.compose.beginNew(1, email);

            // There are theoretically more send options, but https://bugzilla.mozilla.org/show_bug.cgi?id=1747456 is the blocker.
            if (newWin.id) {
                const sentStatus = await browser.compose.sendMessage(newWin.id, {
                    mode: sendmode === "now" ? "sendNow" : "sendLater",
                });

                // Broadcast status in case of failure or cancellation
                iframeService.messageChild({
                    type: "SEND_EMAIL_STATUS",
                    id: getUniqueMessageId(),
                    data: { sendEmailStatus: sentStatus },
                });
            }
        }

        function cancel() {
            // If the cancel button was clicked, close the window
            browser.runtime.sendMessage({ action: "close" });
        }

        function openUrl(url: string | URL) {
            window.open(url, "_blank");
        }

        // Attach all our function calls to the iframeService
        // iframeService.log = function () {}; // Comment out if you want to see debug messages // Todo - comment this line out
        Object.assign(iframeService.commands, {
            getDefaultPreferences,
            getPreferences,
            getLocalizedStrings,
            setPreferences,
            sendEmail,
            openUrl,
            cancel,
        });
    })();
} catch (e) {
    console.error(e);
}

window.onload = () => {
    const iframe = window.document.getElementById("content-frame");
    if (iframe) iframeService.init(iframe as HTMLIFrameElement);
};
