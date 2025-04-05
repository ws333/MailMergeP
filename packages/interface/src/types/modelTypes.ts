import { Action, ActionOn, Computed, Thunk, ThunkOn } from "easy-peasy";
import { JSX } from "react";
import { KeyOfEmailComponents, SubjectPerLanguage } from "../constants/emailTemplates.ts";
import type { SpreadsheetData, Strings, TEmailComponent } from "./types.ts";
import { ContactI3C } from "./typesI3C.ts";

export interface Model {
    locale: Locale;
    prefs: Prefs;
    data: Data;
    initialise: Thunk<Model, undefined, never, Model>;
    cancel: Thunk<Model>;
    parseSpreadsheet: Thunk<Model, undefined, never, Model>;
    sendEmails: Thunk<Model, undefined, never, Model>;
    sendEmail: Thunk<Model, { email: Email; sendmode: Prefs["sendmode"] }>;
    sendDialog: SendDialog;
    openUrl: Thunk<Model, string>;
    userDialog: UserDialog;
    contactList: ContactList;
    emailOptions: EmailOptions;
}

interface Locale {
    strings: Strings;
    updateStrings: Action<Locale, Strings>;
}

export interface Prefs {
    delay: number;
    sendmode: "now" | "later";
    range: string;
    fileName: string;
    fileContents: number[];
    fetchPrefs: Thunk<Prefs>;
    updatePref: Thunk<Prefs, Partial<Prefs>>;
    updatePrefNosync: Action<Prefs, Partial<Prefs>>;
}

interface Data {
    spreadsheetData: SpreadsheetData;
    updateSpreadsheetData: Action<Data, SpreadsheetData>;
    emails: Email[];
}

interface SendDialog {
    open: boolean;
    abort: boolean;
    progress: number;
    current: number;
    time: string;
    total: number;
    status: string;
    update: Action<SendDialog, Partial<SendDialog>>;
    cancel: Thunk<SendDialog>;
}

interface ContactList {
    contacts: ContactI3C[];
    setContacts: Action<ContactList, ContactI3C[]>;
    selectedContacts: Computed<ContactList, ContactI3C[]>;

    deletedContacts: ContactI3C[];
    setDeletedContacts: Action<ContactList, ContactI3C[]>;

    emailsSent: number;
    setEmailsSent: Action<ContactList, number | ((prev: number) => number)>;

    endSession: boolean;
    setEndSession: Action<ContactList, boolean>;

    forcedRender: number;
    initiateForcedRender: Action<ContactList>;

    maxCount: number;
    _setMaxCount: Action<ContactList, number>; // Internal use only
    setMaxCount: Thunk<ContactList, number, undefined, Model>;

    nationOptions: string[];
    setNationOptions: Action<ContactList, string[]>;
    nationOptionsFetched: string[];
    setNationOptionsFetched: Action<ContactList, string[]>;
    updateNationOptions: ActionOn<ContactList>;
    updateSelectedNations: ActionOn<ContactList>;

    selectedNations: string[];
    setSelectedNations: Action<ContactList, { nation: string; checked: boolean }>;

    isSelectedAllNations: boolean;
    setIsSelectedAllNations: Action<ContactList, boolean>;
    toggleIsSelectedAllNations: Thunk<ContactList>;
}

interface EmailOptions {
    delay: number;
    setDelay: Action<EmailOptions, number>;
    storeDelay: ThunkOn<EmailOptions, number>;

    language: KeyOfEmailComponents;
    setLanguage: Action<EmailOptions, { language: KeyOfEmailComponents; subjectPerLanguage?: SubjectPerLanguage }>;
    storeLanguage: ThunkOn<EmailOptions, KeyOfEmailComponents, Model>;

    subject: Computed<EmailOptions, string>;
    subjectPerLanguage: SubjectPerLanguage;
    setSubjectPerLanguage: Action<EmailOptions, SubjectPerLanguage>;
    storeSubjectPerLanguage: ThunkOn<EmailOptions, SubjectPerLanguage>;

    customSubject: string;
    setCustomSubject: Action<EmailOptions, string>;
    storeCustomSubject: ThunkOn<EmailOptions, string>;
    customSubjectVisible: Computed<EmailOptions, boolean>;

    EmailComponent: Computed<EmailOptions, TEmailComponent>;
}

export interface UserDialog {
    title?: string;
    message: string | JSX.Element;
    confirmActionText?: string;
    isOpen?: boolean;
    onClose?: () => void;
    onConfirm?: () => void;
    closeDialog: Thunk<UserDialog>;
    setUserDialog: Action<UserDialog, Partial<UserDialog>>;
    showConfirmationModal?: boolean;
}

// Type based on defaultTemplate in packages/thunderbird-iframe-service/src/thunderbird-iframe-service.js
export type Email = {
    from?: string;
    to?: string;
    cc?: string;
    bcc?: string;
    replyTo?: string;
    attachment?: string;
    subject?: string;
    body?: string;
};
