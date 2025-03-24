import { emailComponents } from "../constants/emailTemplates";

// Modified version of type ContactI3C from IASES3 extractor project
export type ContactI3C = {
    uid: number; // Artificial Unix timestamp in milliseconds
    nation: string; // Contact's nation, not exported
    institution: string; // Contact's institution, not exported
    subGroup: string; // Contact's subgroup, not exported
    name: string; // Contact's name, not exported
    email: string; // Contact's email, not exported
    updatedDate: string; // Backend-managed timestamp of last update, not modified here
    sentDate: number; // Unix timestamp of the last email sent
    sentCount: number; // Total number of emails sent
    deletionDate: number; // 0 for active contacts, timestamp when moved to deleted file
    customBackend01: string; // Backend-specific custom field, not exported
    customBackend02: string; // Backend-specific custom field, not exported
    customFrontend01: string; // Frontend-specific custom field, included in export
    customFrontend02: string; // Frontend-specific custom field, included in export
};

export type Contact = Pick<ContactI3C, "name" | "email">;

export interface ImportData {
    contacts: {
        active: Pick<ContactI3C, "uid" | "sentDate" | "sentCount" | "customFrontend01" | "customFrontend02">[];
        deleted: Pick<
            ContactI3C,
            "uid" | "sentDate" | "sentCount" | "deletionDate" | "customFrontend01" | "customFrontend02"
        >[];
    };
    metadata: {
        exportDate: number; // Timestamp when this export was created
        lastImportExportDate: number; // Last import/export date from the exported state, for validation
    };
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

export type Subjects = Record<KeyOfEmailComponents, string[]>;
