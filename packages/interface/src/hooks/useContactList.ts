import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { maxCountOptions } from "../constants/constants";
import { fetchAndMergeContacts, fetchOnlineNations } from "../helpers/fetchAndMergeContacts";
import { getDeletedContacts } from "../helpers/indexedDB";
import { isExtension } from "../helpers/isExtension";
import { useStoreActions, useStoreState } from "./storeHooks";

const oneHour = 1000 * 60 * 60;
const oneDay = oneHour * 24;
const sevenDays = oneDay * 7;
const oneMonth = sevenDays * 30;
const threeMonths = oneMonth * 3;

function useContactList() {
    const contacts = useStoreState((state) => state.contactList.contacts);
    const setContacts = useStoreActions((actions) => actions.contactList.setContacts);
    const selectedContacts = useStoreState((state) => state.contactList.selectedContacts);

    const deletedContacts = useStoreState((state) => state.contactList.deletedContacts);
    const setDeletedContacts = useStoreActions((actions) => actions.contactList.setDeletedContacts);

    const endSession = useStoreState((state) => state.contactList.endSession);
    const setEndSession = useStoreActions((actions) => actions.contactList.setEndSession);

    const emailsSent = useStoreState((state) => state.contactList.emailsSent);
    const setEmailsSent = useStoreActions((actions) => actions.contactList.setEmailsSent);

    const forcedRender = useStoreState((state) => state.contactList.forcedRender);

    const maxCount = useStoreState((state) => state.contactList.maxCount);
    const setMaxCount = useStoreActions((actions) => actions.contactList.setMaxCount);

    const nationOptions = useStoreState((state) => state.contactList.nationOptions);
    const setNationOptions = useStoreActions((actions) => actions.contactList.setNationOptions);

    const setNationOptionsFetched = useStoreActions((actions) => actions.contactList.setNationOptionsFetched);

    const selectedNations = useStoreState((state) => state.contactList.selectedNations);
    const setSelectedNations = useStoreActions((actions) => actions.contactList.setSelectedNations);

    const isSelectedAllNations = useStoreState((state) => state.contactList.isSelectedAllNations);
    const setIsSelectedAllNations = useStoreActions((actions) => actions.contactList.setIsSelectedAllNations);
    const toggleIsSelectedAllNations = useStoreActions((actions) => actions.contactList.toggleIsSelectedAllNations);

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

    const now = Date.now();
    const oneHourAgo = now - oneHour;
    const oneDayAgo = now - oneDay;
    const sevenDaysAgo = now - sevenDays;
    const oneMonthAgo = now - oneMonth;
    const threeMonthsAgo = now - threeMonths;

    const selectedContactsNotSent = selectedContacts.filter((contact) => contact.sd < threeMonthsAgo);
    const maxSelectedContactsNotSent = Math.min(selectedContactsNotSent.length, maxCount);
    const nextContactNotSent = selectedContactsNotSent[0] || {
        n: "",
        e: "",
    };

    // Calculate emails sent counts using both active and deleted contacts
    const combinedContacts = contacts.concat(deletedContacts);
    const totalSentCount = combinedContacts.reduce((acc, contact) => acc + contact.sc, 0);
    const totalSentCountLastHour = combinedContacts.reduce(
        (acc, contact) => (contact.sd > oneHourAgo ? acc + 1 : acc),
        0
    );
    const totalSentCount24Hours = combinedContacts.reduce(
        (acc, contact) => (contact.sd > oneDayAgo ? acc + 1 : acc),
        0
    );
    const totalSentCountLast7Days = combinedContacts.reduce(
        (acc, contact) => (contact.sd > sevenDaysAgo ? acc + 1 : acc),
        0
    );
    const totalSentCountLast30Days = combinedContacts.reduce(
        (acc, contact) => (contact.sd > oneMonthAgo ? acc + 1 : acc),
        0
    );
    const totalSentCountLast3Months = combinedContacts.reduce(
        (acc, contact) => (contact.sd > threeMonthsAgo ? acc + 1 : acc),
        0
    );

    return {
        contacts,
        setContacts,
        endSession,
        setEndSession,
        emailsSent,
        setEmailsSent,
        maxCount,
        maxCountOptions,
        maxSelectedContactsNotSent,
        selectedContacts,
        selectedContactsNotSent,
        nextContactNotSent,
        setMaxCount,
        nationOptions,
        setNationOptions,
        selectedNations,
        setSelectedNations,
        isSelectedAllNations,
        setIsSelectedAllNations,
        toggleIsSelectedAllNations,
        totalSentCount,
        totalSentCountLastHour,
        totalSentCount24Hours,
        totalSentCountLast7Days,
        totalSentCountLast30Days,
        totalSentCountLast3Months,
    };
}

export { useContactList };
export type UseContactListReturnType = ReturnType<typeof useContactList>;
