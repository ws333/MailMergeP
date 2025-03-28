import { BlobReader, Entry, TextWriter, ZipReader } from "@zip.js/zip.js";
import { ImportStats } from "../types/typesI3C";
import { ImportData, SendingLogEntry } from "../types/typesI3C";
import { zipPassword } from "../constants/constants";
import {
    METADATA_KEY,
    STORE,
    getActiveContacts,
    getDeletedContacts,
    getLastImportExportDate,
    storeActiveContacts,
    storeDeletedContacts,
    storeMetadataKey,
    storeSendingLog,
} from "./indexedDB";
import { ContactState, mergeContacts } from "./mergeContacts";

export async function importToLocalStorage(file: File): Promise<ImportStats | Error> {
    const importData: ImportData = {
        contacts: { active: [], deleted: [] },
        metadata: [
            { key: "exportDate", value: 0 },
            { key: "lastImportExportDate", value: 0 },
        ],
    };

    // Create a zip reader with password protection
    const zipReader = new ZipReader(new BlobReader(file), { password: zipPassword });

    // Get entries from the zip file
    const entries: Entry[] = await zipReader.getEntries();

    // Track results
    let logsProcessed = 0;

    // Process each entry in the zip
    for (const entry of entries) {
        const fileName = entry.filename;
        const content = await entry.getData?.(new TextWriter());

        if (!content) continue;

        if (fileName === `${STORE.ACTIVE_CONTACTS}.json`) {
            importData.contacts.active = JSON.parse(content);
            continue;
        }

        if (fileName === `${STORE.DELETED_CONTACTS}.json`) {
            importData.contacts.deleted = JSON.parse(content);
            continue;
        }

        if (fileName === `${STORE.SENDING_LOG}.json`) {
            logsProcessed = (await mergeSendingLogs(content)) || 0;
            continue;
        }

        if (fileName === `${STORE.METADATA}.json`) {
            importData.metadata = JSON.parse(content);
            continue;
        }

        console.warn("importToLocalStorage -> entry in zip file not handled:", fileName);
    }

    await zipReader.close();

    const currentContactState: ContactState = {
        active: await getActiveContacts(),
        deleted: await getDeletedContacts(),
        lastImportExportDate: await getLastImportExportDate(),
    };

    const [newContactState, importContactsStats, error] = mergeContacts(currentContactState, importData);
    if (error) return error;

    await storeActiveContacts(newContactState.active);
    await storeDeletedContacts(newContactState.deleted);
    const newlIED = importData.metadata.find((item) => item.key === "exportDate")?.value || -1;
    if (newlIED === -1) console.warn("importToLocalStorage -> exportDate not found in importData.metadata");
    await storeMetadataKey(newlIED, METADATA_KEY.LAST_IMPORT_EXPORT_DATE);

    return { ...importContactsStats, logsProcessed };
}

async function mergeSendingLogs(importedData: string) {
    try {
        // Parse imported logs
        const importedLogs: SendingLogEntry[] = JSON.parse(importedData);

        // Merge with existing logs, timestamp is key so no duplicates are created
        await storeSendingLog(importedLogs);

        return importedLogs.length;
    } catch (error) {
        console.error("importToLocalStorage -> failed to merge sending logs:", error);
    }
}
