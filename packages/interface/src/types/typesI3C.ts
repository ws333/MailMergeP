import { emailComponents } from "../constants/emailTemplates";

// Modified version of type ContactI3C from IASES3 extractor project
export type ContactI3C = {
    uid: number; // Artificial Unix timestamp in milliseconds
    na: string; // Contact's nation, not exported
    i: string; // Contact's institution, not exported
    s: string; // Contact's subgroup, not exported
    n: string; // Contact's name, not exported
    e: string; // Contact's email, not exported
    ud: string; // Backend-managed timestamp of last update, not modified here
    cb1: string; // Backend-specific custom field, not exported
    cb2: string; // Backend-specific custom field, not exported
    sd: number; // Unix timestamp of the last email sent
    sc: number; // Total number of emails sent
    dd: number; // 0 for active contacts, timestamp when moved to deleted file
    cf1: string; // Frontend-specific custom field, included in export
    cf2: string; // Frontend-specific custom field, included in export
};

export type Contact = Pick<ContactI3C, "n" | "e">;

export interface ImportData {
    contacts: {
        active: Pick<ContactI3C, "uid" | "sd" | "sc" | "cf1" | "cf2">[];
        deleted: Pick<ContactI3C, "uid" | "sd" | "sc" | "dd" | "cf1" | "cf2">[];
    };
    metadata: [
        {
            key: "exportDate";
            value: number; // Timestamp when this export was created
        },
        {
            key: "lastImportExportDate";
            value: number; // Last import/export date from the exported state, for validation
        },
    ];
}

export type ImportStats = { contactsDeleted: number; contactsProcessed: number; logsProcessed: number };

export type KeyOfEmailComponents = keyof typeof emailComponents;

export type LogMessageOptions = {
    addNewline?: boolean;
};

export type SendingLogEntry = {
    timestamp: number;
    message: string;
};

export type SessionState = {
    emailsSent: number;
    timestamp: number;
};

export type Subjects = Record<KeyOfEmailComponents, string[]>;
