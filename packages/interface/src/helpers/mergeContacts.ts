import { ContactI3C, ImportData, ImportStats } from "../types/typesI3C";

export interface ContactState {
    active: ContactI3C[]; // List of currently active contacts (dd = 0)
    deleted: ContactI3C[]; // List of deleted contacts (dd > 0)
    lastImportExportDate: number; // Timestamp of the most recent import/export applied
}

type ImportContactsStats = Pick<ImportStats, "contactsDeleted" | "contactsProcessed">;

// Merges imported contact data into the current state, handling both active and deleted contacts separately
export function mergeContacts(
    current: ContactState,
    importData: ImportData
): [ContactState, ImportContactsStats, Error?] {
    const newActive = [...current.active];
    const newDeleted = [...current.deleted];

    const importContactsStats: ImportContactsStats = {
        contactsDeleted: 0,
        contactsProcessed: 0,
    };

    const exportDate = importData.metadata.find((item) => item.key === "exportDate")?.value;
    if (!exportDate) return [current, importContactsStats, new Error("Invalid import\nNo export date found!")];

    // Merge active contacts from the import
    for (const importContact of importData.contacts.active) {
        const activeIndex = newActive.findIndex((c) => c.uid === importContact.uid);
        const deletedIndex = newDeleted.findIndex((c) => c.uid === importContact.uid);

        if (activeIndex !== -1) {
            const currentContact = newActive[activeIndex];
            importContactsStats.contactsProcessed++;

            if (importContact.sd > currentContact.sd) {
                newActive[activeIndex] = {
                    ...currentContact,
                    sd: importContact.sd,
                    sc: importContact.sc,
                    dd: 0,
                    cf1: importContact.cf1,
                    cf2: importContact.cf2,
                };
            } else if (importContact.sd <= currentContact.sd && exportDate > current.lastImportExportDate) {
                newActive[activeIndex] = {
                    ...currentContact,
                    sc: currentContact.sc + importContact.sc,
                    cf1: importContact.cf1,
                    cf2: importContact.cf2,
                };
            }
        } else if (deletedIndex !== -1) {
            // Skip if already deleted
            continue;
        } else {
            // Contact from import not in active contacts, add to deleted list
            newDeleted.push({
                uid: importContact.uid,
                na: "",
                i: "",
                s: "",
                n: "",
                e: "",
                ud: "",
                cb1: "",
                cb2: "",
                sd: importContact.sd,
                sc: importContact.sc,
                cf1: importContact.cf1,
                cf2: importContact.cf2,
                dd: exportDate,
            });
            importContactsStats.contactsDeleted++;
        }
    }

    // Merge deleted contacts from the import
    for (const importContact of importData.contacts.deleted) {
        const activeIndex = newActive.findIndex((c) => c.uid === importContact.uid);
        const deletedIndex = newDeleted.findIndex((c) => c.uid === importContact.uid);

        if (activeIndex !== -1) {
            const currentContact = newActive[activeIndex];
            newActive.splice(activeIndex, 1);
            newDeleted.push({
                ...currentContact,
                sd: importContact.sd,
                sc: importContact.sc,
                dd: importContact.dd,
                cf1: importContact.cf1,
                cf2: importContact.cf2,
            });
            importContactsStats.contactsDeleted++;
        } else if (deletedIndex !== -1) {
            const deletedContact = newDeleted[deletedIndex];
            if (importContact.sd > deletedContact.sd && exportDate > current.lastImportExportDate) {
                newDeleted[deletedIndex] = {
                    ...deletedContact,
                    sd: importContact.sd,
                    sc: importContact.sc,
                    dd: importContact.dd,
                    cf1: importContact.cf1,
                    cf2: importContact.cf2,
                };
            } else if (
                importContact.sd <= deletedContact.sd &&
                importContact.sd <= deletedContact.dd &&
                exportDate > current.lastImportExportDate
            ) {
                newDeleted[deletedIndex] = {
                    ...deletedContact,
                    sc: deletedContact.sc + importContact.sc,
                    cf1: importContact.cf1,
                    cf2: importContact.cf2,
                };
            }
        } else {
            newDeleted.push({
                uid: importContact.uid,
                na: "",
                i: "",
                s: "",
                n: "",
                e: "",
                ud: "",
                cb1: "",
                cb2: "",
                sd: importContact.sd,
                sc: importContact.sc,
                cf1: importContact.cf1,
                cf2: importContact.cf2,
                dd: importContact.dd,
            });
            importContactsStats.contactsDeleted++;
        }
    }

    const newLastImportExportDate =
        exportDate > current.lastImportExportDate ? exportDate : current.lastImportExportDate;

    return [
        { active: newActive, deleted: newDeleted, lastImportExportDate: newLastImportExportDate },
        importContactsStats,
    ];
}

export function deleteContact(state: ContactState, uid: number, deletionTime: number): ContactState {
    const activeIndex = state.active.findIndex((c) => c.uid === uid);
    if (activeIndex === -1) return state;

    const contact = state.active[activeIndex];
    const newActive = state.active.filter((_, i) => i !== activeIndex);
    const newDeleted: ContactI3C[] = [...state.deleted, { ...contact, dd: deletionTime }];

    return { active: newActive, deleted: newDeleted, lastImportExportDate: state.lastImportExportDate };
}

export function getDeletedSentCount(state: ContactState): number {
    return state.deleted.reduce((sum, c) => sum + c.sc, 0);
}
