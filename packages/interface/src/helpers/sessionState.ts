import { SendingLogEntry, SessionState } from "../types/typesI3C";
import { sessionStateKey } from "../constants/constants";
import { getSessionFinishedText } from "./getSessionFinishedText";
import { storeSendingLog } from "./indexedDB";
import { isExtension } from "./isExtension";

/**
 * - The session state is used to update the log if a user close the window during a session
 * - The delay is to make sure the timestamp is later than the async logging in logSendingMessage
 *   happening just before updateSessionState is called
 */
export function updateSessionState(emailsSent: number, delay: number) {
    storeSessionState({ emailsSent, timestamp: Date.now() + delay * 1000 });
}

export function clearSessionState() {
    if (isExtension()) {
        messenger.storage.local.remove(sessionStateKey);
    } else {
        localStorage.removeItem(sessionStateKey);
    }
}

export async function getSessionState() {
    if (isExtension()) {
        const sessionState = (await messenger.storage.local.get(sessionStateKey)) as SessionState | undefined;
        return sessionState;
    } else {
        const sessionState = localStorage.getItem(sessionStateKey);
        return sessionState ? (JSON.parse(sessionState) as SessionState) : undefined;
    }
}
export function storeSessionState(value: SessionState) {
    const valueString = JSON.stringify(value);
    if (isExtension()) {
        messenger.storage.local.set({ [sessionStateKey]: valueString });
    } else {
        localStorage.setItem(sessionStateKey, valueString);
    }
}

export async function checkForDangelingSession() {
    const sessionState = await getSessionState();
    if (sessionState && sessionState.emailsSent > 0) {
        const message = getSessionFinishedText(sessionState.emailsSent);
        const { timestamp } = sessionState;
        const storeValue: SendingLogEntry = { message, timestamp };
        storeSendingLog(storeValue);
        clearSessionState();
    }
}
