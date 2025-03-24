import { BlobReader, Entry, TextWriter, ZipReader } from "@zip.js/zip.js";
import { ImportStats } from "../types/typesI3C";
import { ImportData, SendingLogEntry } from "../types/typesI3C";
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

export async function importToLocalStorage(file: File): Promise<ImportStats> {
    const importData: ImportData = {
        contacts: { active: [], deleted: [] },
        metadata: { exportDate: 0, lastImportExportDate: 0 },
    };

    // Create a zip reader
    const zipReader = new ZipReader(new BlobReader(file));

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

    const [newContactState, importContactsStats] = mergeContacts(currentContactState, importData);
    await storeActiveContacts(newContactState.active);
    await storeDeletedContacts(newContactState.deleted);
    await storeMetadataKey(importData.metadata.exportDate, METADATA_KEY.LAST_IMPORT_EXPORT_DATE);

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
