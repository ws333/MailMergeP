import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { threeMonths } from "../constants/timeConstants";
import { fetchAndMergeContacts, fetchOnlineNations } from "../helpers/fetchAndMergeContacts";
import { getDeletedContacts } from "../helpers/indexedDB";
import { isExtension } from "../helpers/isExtension";
import { useStoreActions, useStoreState } from "./storeHooks";

function useContactList() {
    const contacts = useStoreState((state) => state.contactList.contacts);
    const setContacts = useStoreActions((actions) => actions.contactList.setContacts);
    const selectedContacts = useStoreState((state) => state.contactList.selectedContacts);

    const setDeletedContacts = useStoreActions((actions) => actions.contactList.setDeletedContacts);

    const endSession = useStoreState((state) => state.contactList.endSession);
    const setEndSession = useStoreActions((actions) => actions.contactList.setEndSession);

    const emailsSent = useStoreState((state) => state.contactList.emailsSent);
    const setEmailsSent = useStoreActions((actions) => actions.contactList.setEmailsSent);

    const forcedRender = useStoreState((state) => state.contactList.forcedRender);

    const maxCount = useStoreState((state) => state.contactList.maxCount);

    const nationOptions = useStoreState((state) => state.contactList.nationOptions);

    const setNationOptionsFetched = useStoreActions((actions) => actions.contactList.setNationOptionsFetched);

    const selectedNations = useStoreState((state) => state.contactList.selectedNations);

    const setIsSelectedAllNations = useStoreActions((actions) => actions.contactList.setIsSelectedAllNations);

    const { data: _nations } = useSuspenseQuery({
        queryKey: ["nations", forcedRender, { shouldFetch: !nationOptions.length }],
        queryFn: async () => fetchOnlineNations(),
    });

    const { data: _contacts } = useSuspenseQuery({
        queryKey: ["contacts", forcedRender, { shouldFetch: !contacts.length }],
        queryFn: async () => fetchAndMergeContacts(),
    });

    const { data: _deletedContacts } = useSuspenseQuery({
        queryKey: ["deletedContacts", forcedRender],
        queryFn: async () => await getDeletedContacts(),
    });

    useEffect(() => {
        if (!isExtension()) setIsSelectedAllNations(true);

        setNationOptionsFetched(_nations);
        setContacts(_contacts);
        setDeletedContacts(_deletedContacts);
    }, [
        _contacts,
        _deletedContacts,
        _nations,
        setContacts,
        setDeletedContacts,
        setIsSelectedAllNations,
        setNationOptionsFetched,
    ]);

    const threeMonthsAgo = Date.now() - threeMonths;
    const selectedContactsNotSent = selectedContacts.filter((contact) => contact.sd < threeMonthsAgo);
    const maxSelectedContactsNotSent = Math.min(selectedContactsNotSent.length, maxCount);
    const nextContactNotSent = selectedContactsNotSent[0] || {
        n: "",
        e: "",
    };

    return {
        endSession,
        setEndSession,
        emailsSent,
        setEmailsSent,
        maxCount,
        maxSelectedContactsNotSent,
        selectedContactsNotSent,
        nextContactNotSent,
        selectedNations,
    };
}

export { useContactList };
export type UseContactListReturnType = ReturnType<typeof useContactList>;
