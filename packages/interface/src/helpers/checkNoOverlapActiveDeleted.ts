import { getActiveContacts, getDeletedContacts } from "./indexedDB";

export async function checkNoOverlapActiveDeletedContacts() {
    const activeContacts = await getActiveContacts();
    const deletedContactsFromIndexedDB = await getDeletedContacts();
    const activeContactUids = new Set(activeContacts.map((contact) => contact.uid));
    const deletedContactUids = new Set(deletedContactsFromIndexedDB.map((contact) => contact.uid));
    const intersectionActiveDeleted = new Set([...activeContactUids].filter((uid) => deletedContactUids.has(uid)));
    if (intersectionActiveDeleted.size > 0) console.table(intersectionActiveDeleted);
    return intersectionActiveDeleted.size > 0;
}
