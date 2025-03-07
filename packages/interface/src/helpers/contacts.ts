import {
    CONTACTS_CSV_URL,
    LOCAL_STORAGE_CONTACTS_KEY,
    NATIONS_CSV_URL,
    NATIONS_FALLBACK,
} from "../constants/constants";
import { ContactI3C } from "../types/typesI3C";
import { csvParse } from "./csvParse";

export async function fetchOnlineNations(
    signal: AbortSignal
): Promise<string[]> {
    const response = await fetch(NATIONS_CSV_URL, { signal });
    const csvText = await response.text();
    const nations = /^[A-Z,]+$/.exec(csvText)?.toString().split(","); // Only allow uppercase letters and commas
    return nations ?? NATIONS_FALLBACK;
}

export async function fetchOnlineContacts(
    signal: AbortSignal
): Promise<ContactI3C[]> {
    const response = await fetch(CONTACTS_CSV_URL, { signal });
    const csvText = await response.text();
    return csvParse<ContactI3C>(csvText).data;
}

export async function fetchAndMergeContacts(
    signal: AbortSignal
): Promise<ContactI3C[]> {
    const onlineContacts = await fetchOnlineContacts(signal);
    const localContacts = getLocalContacts();
    const merged = onlineContacts.map((oc) => {
        const local = localContacts.find((lc) => lc.uid === oc.uid);
        return local?.sentDate ? { ...oc, sentDate: local.sentDate } : oc;
    });
    return merged;
}

export function saveLocalContacts(contacts: ContactI3C[]) {
    localStorage.setItem(LOCAL_STORAGE_CONTACTS_KEY, JSON.stringify(contacts));
}

export function getLocalContacts(): ContactI3C[] {
    const stored = localStorage.getItem(LOCAL_STORAGE_CONTACTS_KEY);
    return stored ? (JSON.parse(stored) as ContactI3C[]) : [];
}
