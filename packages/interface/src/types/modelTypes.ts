import { Action, Thunk } from "easy-peasy";
import { Strings, SpreadsheetData, ParseRangeReturnType } from "./types";

type SpreadsheetHasManuallyUpdated = boolean;

export interface MailMergePModel {
    locale: Locale;
    prefs: Prefs;
    data: Data;
    tabs: Tabs;
    initialise: Thunk<MailMergePModel, undefined, any, MailMergePModel>;
    cancel: Thunk<MailMergePModel>;
    parseSpreadsheet: Thunk<MailMergePModel, undefined, any, MailMergePModel>;
    renderEmails: Thunk<
        MailMergePModel,
        ParseRangeReturnType,
        any,
        MailMergePModel
    >;
    sendEmails: Thunk<MailMergePModel, undefined, any, MailMergePModel>;
    sendEmail: Thunk<
        MailMergePModel,
        { email: Email; sendmode: Prefs["sendmode"] }
    >;
    sendDialog: SendDialog;
    updateSendDialog: Action<SendDialog, SendDialog>;
    cancelSendDialog: Thunk<MailMergePModel>;
    openUrl: Thunk<MailMergePModel, string>;
}

// Type based on defaultTemplate from from packages/thunderbird-iframe-service/src/thunderbird-iframe-service.js
export type Email = Partial<{
    from: string;
    to: string;
    cc: string;
    bcc: string;
    replyTo: string;
    attachment: string;
    subject: string;
    body: string;
}>;

export type Emails = Email[];

export interface Locale {
    strings: Strings;
    updateStrings: Action<Locale, Strings>;
}

export interface Data {
    spreadsheetData: SpreadsheetData;
    updateSpreadsheetData: Action<Data, SpreadsheetData>;
    spreadsheetHasManuallyUpdated: SpreadsheetHasManuallyUpdated;
    updateSpreadsheetHasManuallyUpdated: Action<
        Data,
        SpreadsheetHasManuallyUpdated
    >;
    template: Email;
    updateTemplate: Action<Data, Email>;
    fetchTemplate: Thunk<Data>;
    emails: Emails;
    updateEmails: Action<Data, Emails>;
}

export interface Prefs {
    delay?: number;
    sendmode?: "now" | "later";
    range?: string;
    parser?: "nunjucks" | "legacy";
    fileName?: string;
    fileContents?: number[];
    fetchPrefs: Thunk<Prefs>;
    updatePref: Thunk<Prefs, Partial<Prefs>>;
    updatePrefNosync: Action<Prefs, Partial<Prefs>>;
}

export interface SendDialog {
    open?: boolean;
    abort?: boolean;
    progress?: number;
    current?: number;
    time?: string;
    total?: number;
    status?: string;
}

export interface Tabs {
    currTab: number;
    setTab: Action<Tabs, number>;
    prevTab: Action<Tabs>;
    nextTab: Action<Tabs>;
}
