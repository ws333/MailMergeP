import { LogMessageOptions, SendingLogEntry } from "../types/typesI3C";
import { sessionFinishedText, zeroWidtSpace } from "../constants/constants";
import { getDateTime } from "./getDateTime";
import { getSendingLog } from "./indexedDB";
import { storeSendingLog } from "./indexedDB";

export async function readSendingLog() {
    const log = await getSendingLog();
    const formattedLog = log.reduce<string[]>((acc, log) => {
        const message = `${getDateTime(log.timestamp)} - ${log.message}`;
        return log.message.includes(sessionFinishedText) ? [zeroWidtSpace, message, ...acc] : [message, ...acc];
    }, []);
    return formattedLog;
}

type LogSendingMessageOptions = LogMessageOptions & {
    setFn: React.Dispatch<React.SetStateAction<string[]>>;
};

export const logSendingMessage = (message: string, options: LogSendingMessageOptions) => {
    const { addNewline, setFn } = options;
    const messageWithTime = `${getDateTime()} - ${message}`;

    setFn((prev) => {
        const newValue = [messageWithTime, ...prev];
        if (addNewline) newValue.unshift(zeroWidtSpace); // Using zero width space to force newline
        const storeValue: SendingLogEntry = { message, timestamp: Date.now() };
        storeSendingLog(storeValue);
        return newValue;
    });
};
