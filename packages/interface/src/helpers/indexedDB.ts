import { ContactI3C, SendingLogEntry } from "../types/typesI3C";
import { zeroWidtSpace } from "../constants/constants";
import { SubjectPerLanguage } from "../constants/emailTemplates";

const DB_NAME = "ContactsI3CDatabase";
const DB_VERSION = 2;

export const STORE = {
    ACTIVE_CONTACTS: "activeContacts",
    DELETED_CONTACTS: "deletedContacts",
    SENDING_LOG: "sendingLog",
    METADATA: "metadata",
    OPTIONS: "options",
} as const;
export type StoreKey = (typeof STORE)[keyof typeof STORE];

export const METADATA_KEY = {
    LAST_IMPORT_EXPORT_DATE: "lastImportExportDate",
    EXPORT_DATE: "exportDate",
} as const;
export type MetadataKey = (typeof METADATA_KEY)[keyof typeof METADATA_KEY];

export const OPTIONS_KEY = {
    DELAY: "delay",
    MAX_COUNT: "maxCount",
    LANGUAGE: "language",
    SUBJECT: "subject",
    CUSTOM_SUBJECT: "customSubject",
} as const;
export type OptionsKey = (typeof OPTIONS_KEY)[keyof typeof OPTIONS_KEY];

// First run initialization
export async function initializeStorage(contacts: ContactI3C[]): Promise<void> {
    try {
        const existingContacts = await getActiveContacts();
        if (existingContacts.length === 0) {
            await storeActiveContactsBatch(contacts);
            console.log("Initial contacts stored successfully");
        }
        const existingSendingLog = await getSendingLog();
        if (existingSendingLog.length === 0) {
            // An initial zeroWidtSpace is needed to ensure the first session is displayed since getLogsToDisplay()
            // removes the last session if not all logs are included based on the presence of a zeroWidtSpace
            const initialLogs: SendingLogEntry = { timestamp: 0, message: zeroWidtSpace };
            await storeSendingLog(initialLogs);
            console.log("Initial sendingLog stored successfully");
        }
    } catch (error) {
        console.error("Failed to initialize storage:", error);
    }
}

// Opens the database and sets up object stores
function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE.ACTIVE_CONTACTS)) {
                db.createObjectStore(STORE.ACTIVE_CONTACTS, { keyPath: "uid" });
            }
            if (!db.objectStoreNames.contains(STORE.DELETED_CONTACTS)) {
                db.createObjectStore(STORE.DELETED_CONTACTS, { keyPath: "uid" });
            }
            if (!db.objectStoreNames.contains(STORE.SENDING_LOG)) {
                db.createObjectStore(STORE.SENDING_LOG, { keyPath: "timestamp" });
            }
            if (!db.objectStoreNames.contains(STORE.METADATA)) {
                db.createObjectStore(STORE.METADATA);
            }
            if (!db.objectStoreNames.contains(STORE.OPTIONS)) {
                db.createObjectStore(STORE.OPTIONS);
            }
        };

        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
        request.onerror = (event) =>
            reject(new Error(`Failed to open IndexedDB: ${(event.target as IDBOpenDBRequest).error}`));
    });
}

// Stores multiple active contacts in one transaction (batch insert)
export async function storeActiveContactsBatch(contacts: ContactI3C[]): Promise<void> {
    const db = await openDatabase();
    try {
        const transaction = db.transaction(STORE.ACTIVE_CONTACTS, "readwrite");
        const store = transaction.objectStore(STORE.ACTIVE_CONTACTS);
        await Promise.all(
            contacts.map(
                (contact) =>
                    new Promise<void>((resolve, reject) => {
                        const request = store.put(contact);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(new Error(`Failed to store contact with uid ${contact.uid}`));
                    })
            )
        );
    } catch (error) {
        console.error("Error storing active contacts batch:", error);
    } finally {
        db.close();
    }
}

// Stores or updates active contacts (individual or array)
export async function storeActiveContacts(contacts: ContactI3C | ContactI3C[]): Promise<void> {
    const contactsArray = Array.isArray(contacts) ? contacts : [contacts];
    await storeActiveContactsBatch(contactsArray);
}

// Removes a contact from activeContacts by uid
export async function removeActiveContactByUid(uid: number): Promise<void> {
    const db = await openDatabase();
    try {
        const transaction = db.transaction(STORE.ACTIVE_CONTACTS, "readwrite");
        const store = transaction.objectStore(STORE.ACTIVE_CONTACTS);
        await new Promise<void>((resolve, reject) => {
            const request = store.delete(uid);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error(`Failed to remove contact with uid ${uid}`));
        });
    } catch (error) {
        console.error(`Error removing contact with uid ${uid}:`, error);
    } finally {
        db.close();
    }
}

// Stores or updates deleted contacts (individual or array)
export async function storeDeletedContacts(contacts: ContactI3C | ContactI3C[]): Promise<void> {
    const contactsArray = Array.isArray(contacts) ? contacts : [contacts];
    const db = await openDatabase();
    try {
        const transaction = db.transaction(STORE.DELETED_CONTACTS, "readwrite");
        const store = transaction.objectStore(STORE.DELETED_CONTACTS);
        await Promise.all(
            contactsArray.map(
                (contact) =>
                    new Promise<void>((resolve, reject) => {
                        const request = store.put(contact);
                        request.onsuccess = () => resolve();
                        request.onerror = () =>
                            reject(new Error(`Failed to store deleted contact with uid ${contact.uid}`));
                    })
            )
        );
    } catch (error) {
        console.error("Error storing deleted contacts:", error);
    } finally {
        db.close();
    }
}

// Stores sending log entries (individual or array) using timestamp as the unique key
export async function storeSendingLog(entries: SendingLogEntry | SendingLogEntry[]): Promise<void> {
    const entriesArray = Array.isArray(entries) ? entries : [entries];
    const db = await openDatabase();
    try {
        const transaction = db.transaction(STORE.SENDING_LOG, "readwrite");
        const store = transaction.objectStore(STORE.SENDING_LOG);
        await Promise.all(
            entriesArray.map(
                (entry) =>
                    new Promise<void>((resolve, reject) => {
                        const request = store.put({ timestamp: entry.timestamp, message: entry.message });
                        request.onsuccess = () => resolve();
                        request.onerror = () =>
                            reject(new Error(`Failed to store sending log entry with timestamp ${entry.timestamp}`));
                    })
            )
        );
    } catch (error) {
        console.error("Error storing sending log:", error);
    } finally {
        db.close();
    }
}

export async function storeMetadataKey(timestamp: number, key: MetadataKey): Promise<void> {
    const db = await openDatabase();
    try {
        const transaction = db.transaction(STORE.METADATA, "readwrite");
        const store = transaction.objectStore(STORE.METADATA);
        await new Promise<void>((resolve, reject) => {
            const request = store.put(timestamp, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error(`Failed to store key: ${key}`));
        });
    } catch (error) {
        console.error(`Error storing key: ${key}`, error);
    } finally {
        db.close();
    }
}

export async function storeOptionsKey(value: number | string | SubjectPerLanguage, key: OptionsKey): Promise<void> {
    const db = await openDatabase();
    try {
        const transaction = db.transaction(STORE.OPTIONS, "readwrite");
        const store = transaction.objectStore(STORE.OPTIONS);
        const _value = key === "subject" ? JSON.stringify(value) : value;
        await new Promise<void>((resolve, reject) => {
            const request = store.put(_value, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error(`Failed to store key: ${key}`));
        });
    } catch (error) {
        console.error(`Error storing key: ${key}`, error);
    } finally {
        db.close();
    }
}

export async function getActiveContacts(): Promise<ContactI3C[]> {
    const db = await openDatabase();
    try {
        const transaction = db.transaction(STORE.ACTIVE_CONTACTS, "readonly");
        const store = transaction.objectStore(STORE.ACTIVE_CONTACTS);
        const request: IDBRequest<ContactI3C[]> = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error("Failed to retrieve active contacts"));
        });
    } catch (error) {
        console.error("Error retrieving active contacts:", error);
        return [];
    } finally {
        db.close();
    }
}

export async function getDeletedContacts(): Promise<ContactI3C[]> {
    const db = await openDatabase();
    try {
        const transaction = db.transaction(STORE.DELETED_CONTACTS, "readonly");
        const store = transaction.objectStore(STORE.DELETED_CONTACTS);
        const request: IDBRequest<ContactI3C[]> = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error("Failed to retrieve deleted contacts"));
        });
    } catch (error) {
        console.error("Error retrieving deleted contacts:", error);
        return [];
    } finally {
        db.close();
    }
}

export async function getSendingLog(): Promise<SendingLogEntry[]> {
    const db = await openDatabase();
    try {
        const transaction = db.transaction(STORE.SENDING_LOG, "readonly");
        const store = transaction.objectStore(STORE.SENDING_LOG);
        const request: IDBRequest<SendingLogEntry[]> = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error("Failed to retrieve sending log"));
        });
    } catch (error) {
        console.error("Error retrieving sending log:", error);
        return [];
    } finally {
        db.close();
    }
}

// Gets all key-value pairs from the METADATA store
export async function getMetadata(): Promise<{ key: string; value: number }[]> {
    const db = await openDatabase();
    try {
        const transaction = db.transaction(STORE.METADATA, "readonly");
        const store = transaction.objectStore(STORE.METADATA);
        const keysRequest: IDBRequest<IDBValidKey[]> = store.getAllKeys();
        const valuesRequest: IDBRequest<number[]> = store.getAll();

        const [keys, values] = await Promise.all([
            new Promise<string[]>((resolve, reject) => {
                keysRequest.onsuccess = () => resolve(keysRequest.result as string[]);
                keysRequest.onerror = () => reject(new Error("Failed to retrieve metadata keys"));
            }),
            new Promise<number[]>((resolve, reject) => {
                valuesRequest.onsuccess = () => resolve(valuesRequest.result);
                valuesRequest.onerror = () => reject(new Error("Failed to retrieve metadata values"));
            }),
        ]);

        return keys.map((key, index) => ({ key, value: values[index] }));
    } catch (error) {
        console.error("Error retrieving metadata:", error);
        return [];
    } finally {
        db.close();
    }
}

// Gets all key-value pairs from the OPTIONS store
export async function getOptions(): Promise<{ key: string; value: number | string }[]> {
    const db = await openDatabase();
    try {
        const transaction = db.transaction(STORE.OPTIONS, "readonly");
        const store = transaction.objectStore(STORE.OPTIONS);
        const keysRequest: IDBRequest<IDBValidKey[]> = store.getAllKeys();
        const valuesRequest: IDBRequest<(number | string)[]> = store.getAll();

        const [keys, values] = await Promise.all([
            new Promise<string[]>((resolve, reject) => {
                keysRequest.onsuccess = () => resolve(keysRequest.result as string[]);
                keysRequest.onerror = () => reject(new Error("Failed to retrieve options keys"));
            }),
            new Promise<(number | string)[]>((resolve, reject) => {
                valuesRequest.onsuccess = () => resolve(valuesRequest.result);
                valuesRequest.onerror = () => reject(new Error("Failed to retrieve options values"));
            }),
        ]);

        return keys.map((key, index) => ({ key, value: values[index] }));
    } catch (error) {
        console.error("Error retrieving options:", error);
        return [];
    } finally {
        db.close();
    }
}

export async function getLastImportExportDate(): Promise<number> {
    const db = await openDatabase();
    try {
        const transaction = db.transaction(STORE.METADATA, "readonly");
        const store = transaction.objectStore(STORE.METADATA);
        const request: IDBRequest<number | undefined> = store.get(METADATA_KEY.LAST_IMPORT_EXPORT_DATE);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || 0);
            request.onerror = () => reject(new Error("Failed to retrieve last import export date"));
        });
    } catch (error) {
        console.error(error);
        return -1;
    } finally {
        db.close();
    }
}

// Clears specified store or a key from the metadata store
export async function removeStorageItem(
    key:
        | typeof STORE.ACTIVE_CONTACTS
        | typeof STORE.DELETED_CONTACTS
        | typeof STORE.SENDING_LOG
        | typeof METADATA_KEY.EXPORT_DATE
        | typeof METADATA_KEY.LAST_IMPORT_EXPORT_DATE
): Promise<void> {
    const db = await openDatabase();
    try {
        let storeName: string;
        let keyValue: string | undefined;

        switch (key) {
            case STORE.ACTIVE_CONTACTS:
                storeName = STORE.ACTIVE_CONTACTS;
                break;
            case STORE.DELETED_CONTACTS:
                storeName = STORE.DELETED_CONTACTS;
                break;
            case STORE.SENDING_LOG:
                storeName = STORE.SENDING_LOG;
                break;
            case METADATA_KEY.EXPORT_DATE:
                storeName = STORE.METADATA;
                keyValue = METADATA_KEY.EXPORT_DATE;
                break;
            case METADATA_KEY.LAST_IMPORT_EXPORT_DATE:
                storeName = STORE.METADATA;
                keyValue = METADATA_KEY.LAST_IMPORT_EXPORT_DATE;
                break;
            default:
                throw new Error(`Unknown storage key: ${key}`);
        }

        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        await new Promise<void>((resolve, reject) => {
            const request = keyValue ? store.delete(keyValue) : store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error(`Failed to remove ${key} from ${storeName}`));
        });
    } catch (error) {
        console.error(`Error removing ${key}:`, error);
    } finally {
        db.close();
    }
}

// Resets all stores (clears all data)
export async function resetStorage(): Promise<boolean> {
    const db = await openDatabase();
    try {
        const stores = [STORE.ACTIVE_CONTACTS, STORE.DELETED_CONTACTS, STORE.SENDING_LOG, STORE.METADATA];
        await Promise.all(
            stores.map(
                (storeName) =>
                    new Promise<void>((resolve, reject) => {
                        const transaction = db.transaction(storeName, "readwrite");
                        const store = transaction.objectStore(storeName);
                        const request = store.clear();
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
                    })
            )
        );
        return true;
    } catch (error) {
        console.error("Error resetting IndexedDB:", error);
        return false;
    } finally {
        db.close();
    }
}

// Safely delete the database
export async function deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        // Close any open connections first
        const closeRequest = indexedDB.open(DB_NAME);
        closeRequest.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            db.close();

            // Now delete the database
            const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

            deleteRequest.onsuccess = () => {
                console.log(`${DB_NAME} database deleted successfully`);
                resolve();
            };

            deleteRequest.onerror = (event) => {
                const error = `Error deleting database: ${(event.target as IDBOpenDBRequest).error}`;
                console.error(error);
                reject(new Error(error));
            };

            deleteRequest.onblocked = () => {
                const message = `Database deletion blocked. Ensure all connections are closed.`;
                console.warn(message);
                reject(new Error(message));
            };
        };

        closeRequest.onerror = (event) => {
            const error = `Error closing database connections: ${(event.target as IDBOpenDBRequest).error}`;
            console.error(error);
            reject(new Error(error));
        };
    });
}

// Estimates storage usage // Todo: Check if this works in add-on, requires https://
export async function getStorageSize(): Promise<StorageEstimate> {
    if (navigator.storage?.estimate) {
        return await navigator.storage.estimate();
    }
    console.warn("Storage estimation not supported in this environment");
    return { quota: 0, usage: 0 };
}
