export const __DEV__ = !import.meta.env.PROD;

export const CONTACTS_CSV_URL = "https://iase.one/contact_lists/contactsI3C_test.csv";

export const LOCAL_STORAGE_CONTACTS_KEY = "contactsI3C";
export const LOCAL_STORAGE_SENDING_LOG_KEY = "sendingLog";

export const defaultRandomWindow = 1;
export const fullProgressBarDelay = 3;

export const NATIONS_CSV_URL = "https://iase.one/contact_lists/nations.csv";
export const NATIONS_FALLBACK = ["EU", "FR", "GB", "NO"];

// Used to send to just one specified contact per session, i.e. disable the use of the contacts list.
// export const SINGLE_CONTACT_MODE = true;
export const SINGLE_CONTACT_MODE = import.meta.env.VITE_SINGLE_CONTACT_MODE === "1";
