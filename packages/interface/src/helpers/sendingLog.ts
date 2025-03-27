import { LogMessageOptions, SendingLogEntry } from "../types/typesI3C";
import { zeroWidtSpace } from "../constants/constants";
import { getDateTime } from "./getDateTime";
import { getSendingLog, storeSendingLog } from "./indexedDB";

export async function getLogsToDisplay() {
    const storedLog = await readSendingLog();
    const logsToDisplay = storedLog.reverse().slice(0, 1000);

    // Remove last session if not all logs are included
    while (logsToDisplay.length && logsToDisplay[logsToDisplay.length - 1] !== zeroWidtSpace) {
        logsToDisplay.pop();
    }

    // Remove last zeroWidthSpace
    logsToDisplay.pop();

    return logsToDisplay;
}

export async function readSendingLog() {
    const log = await getSendingLog();

    const formattedLog = log.map((log) => {
        const message = log.message === zeroWidtSpace ? log.message : `${getDateTime(log.timestamp)} - ${log.message}`;
        return message;
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
        const timestamp = Date.now();
        const newValue = [messageWithTime, ...prev];
        const storeValue: SendingLogEntry[] = [{ message, timestamp }];

        // Using zero width space to force newline
        if (addNewline) {
            newValue.unshift(zeroWidtSpace);
            // The timestamp needes to be unique. Displayed in descending order.
            storeValue.push({ message: zeroWidtSpace, timestamp: timestamp + 1 });
        }

        storeSendingLog(storeValue);
        return newValue;
    });
};
