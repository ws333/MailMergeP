import { toast } from "react-toastify";
import { ContactI3C } from "../types/typesI3C";
import { CONTACTS_CSV_URL, NATIONS_CSV_URL, NATIONS_FALLBACK } from "../constants/constants";
import { checkNoOverlapActiveDeletedContacts } from "./checkNoOverlapActiveDeleted";
import { csvParse } from "./csvParse";
import {
    getActiveContacts,
    initializeStorage,
    removeActiveContactByUid,
    storeActiveContacts,
    storeDeletedContacts,
} from "./indexedDB";

export async function fetchOnlineNations(signal: AbortSignal): Promise<string[]> {
    const response = await fetch(NATIONS_CSV_URL, { signal });
    const csvText = await response.text();
    const nations = /^[A-Z,]+$/.exec(csvText)?.toString().split(","); // Only allow uppercase letters and commas
    return nations ?? NATIONS_FALLBACK;
}

async function fetchOnlineContacts(signal: AbortSignal): Promise<ContactI3C[]> {
    const response = await fetch(CONTACTS_CSV_URL, { signal });
    const csvText = await response.text();
    return csvParse<ContactI3C>(csvText).data;
}

export async function fetchAndMergeContacts(signal: AbortSignal, fetchFn = fetchOnlineContacts): Promise<ContactI3C[]> {
    const onlineContacts = await fetchFn(signal);
    await initializeStorage(onlineContacts); // Initialize indexedDB storage
    const localContacts = await getActiveContacts();

    // Create a Set of online UIDs for O(1) lookups
    const onlineContactUids = new Set(onlineContacts.map((contact) => contact.uid));

    // Find local contacts that are not in onlineContacts - O(n) operation
    const deletedContacts = localContacts.filter(
        (localContact) => !onlineContactUids.has(localContact.uid) && localContact.sentCount > 0
    );

    // Set deletionDate
    const now = Date.now();
    deletedContacts.forEach((contact) => {
        contact.deletionDate = now;
    });
    if (deletedContacts.length) console.table(deletedContacts);

    // Update indexedDB store deletedContacts
    await storeDeletedContacts(deletedContacts);

    // Remove deleted contacts from indexedDB store activeContacts
    for await (const contact of deletedContacts) {
        await removeActiveContactByUid(contact.uid);
    }

    // Check for no overlap between active and deleted contacts in indexedDB
    const isOverlap = await checkNoOverlapActiveDeletedContacts();
    if (isOverlap) toast.error("Overlap between active and deleted contacts in indexedDB!", { autoClose: false });

    // Create a Map for local contacts using UID as key for O(1) lookups
    const localContactsMap = new Map(localContacts.map((contact) => [contact.uid, contact]));

    // Merge the online contacts with the local contacts - O(n) operation
    const merged = onlineContacts.map((oc): ContactI3C => {
        const local = localContactsMap.get(oc.uid);
        return local?.sentDate
            ? {
                  ...oc,
                  sentDate: local.sentDate,
                  sentCount: local.sentCount,
                  customFrontend01: local.customFrontend01,
                  customFrontend02: local.customFrontend02,
              }
            : oc;
    });
    // Delete all local contacts or just the ones that are not in onlineContacts
    await storeActiveContacts(merged); // Will this update

    return merged;
}
