export const __DEV__ = import.meta.env.DEV;

export const STORAGE_KEY = {
    CONTACTS: "contactsI3C",
    CONTACTS_DELETED: "contactsI3C_deleted",
    SENDING_LOG: "contactsI3C_sendingLog",
    LAST_IMPORT_EXPORT_DATE: "contactsI3C_lastImportExportDate",
    EXPORT_DATE: "contactsI3C_exportDate",
} as const;

export type StorageKey = keyof typeof STORAGE_KEY;

export const minDelay = 3; // Minimum delay between emails being sent in seconds
export const defaultRandomWindow = 1;
export const fullProgressBarDelay = 2;

export const maxCountOptions = [5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];

export const NATIONS_CSV_URL = "https://iase.one/contact_lists/nations.csv";
export const NATIONS_FALLBACK = ["EU", "FR", "GB", "NO"];

export const sessionFinishedText = "Session finished!";

// Used to send to just one specified contact per session, i.e. disable the use of the contacts list.
// export const SINGLE_CONTACT_MODE = true;
export const SINGLE_CONTACT_MODE = import.meta.env.VITE_SINGLE_CONTACT_MODE === "1";

export const zeroWidtSpace = "\u200b";
