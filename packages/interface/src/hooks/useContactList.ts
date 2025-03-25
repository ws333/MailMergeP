import { useEffect } from "react";
import { maxCountOptions } from "../constants/constants";
import { fetchAndMergeContacts, fetchOnlineNations } from "../helpers/fetchAndMergeContacts";
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

    const emailsSent = useStoreState((state) => state.contactList.emailsSent);
    const setEmailsSent = useStoreActions((actions) => actions.contactList.setEmailsSent);

    const forcedRender = useStoreState((state) => state.contactList.forcedRender);

    const isLoading = useStoreState((state) => state.contactList.isLoading);
    const setIsLoading = useStoreActions((actions) => actions.contactList.setIsLoading);

    const fetchError = useStoreState((state) => state.contactList.fetchError);
    const setFetchError = useStoreActions((actions) => actions.contactList.setFetchError);

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

    // Fetch nations and contacts on first render
    useEffect(() => {
        console.log(`Fetching contacts and nations on render #${forcedRender}`); // Don't remove, forcedRender is used to force rerender and thus refetch
        const controller = new AbortController();
        const loadContacts = async () => {
            try {
                const _nations = await fetchOnlineNations(controller.signal);
                setNationOptionsFetched(_nations);
                if (!isExtension()) setIsSelectedAllNations(true);

                const merged = await fetchAndMergeContacts(controller.signal);
                setContacts(merged);
                setIsLoading(false);
            } catch (error) {
                if (error instanceof Error) {
                    console.warn("*Debug* -> EmailSender.tsx -> useEffect fetch error:", error.message);
                    const message = "Failed to download contact lists! Please make sure you are online and try again.";
                    setFetchError(message);
                }
            }
        };
        void loadContacts();

        return () => {
            controller.abort();
        };
    }, [forcedRender, setContacts, setFetchError, setIsLoading, setIsSelectedAllNations, setNationOptionsFetched]);

    const now = Date.now();
    const oneHourAgo = now - oneHour;
    const oneDayAgo = now - oneDay;
    const sevenDaysAgo = now - sevenDays;
    const oneMonthAgo = now - oneMonth;
    const threeMonthsAgo = now - threeMonths;

    const selectedContactsNotSent = selectedContacts.filter((contact) => contact.sentDate < threeMonthsAgo);

    const totalSentCount = contacts.reduce((acc, contact) => acc + contact.sentCount, 0);
    const totalSentCountLastHour = contacts.reduce(
        (acc, contact) => (contact.sentDate > oneHourAgo ? acc + 1 : acc),
        0
    );
    const totalSentCount24Hours = contacts.reduce((acc, contact) => (contact.sentDate > oneDayAgo ? acc + 1 : acc), 0);
    const totalSentCountLast7Days = contacts.reduce(
        (acc, contact) => (contact.sentDate > sevenDaysAgo ? acc + 1 : acc),
        0
    );
    const totalSentCountLast30Days = contacts.reduce(
        (acc, contact) => (contact.sentDate > oneMonthAgo ? acc + 1 : acc),
        0
    );
    const totalSentCountLast3Months = contacts.reduce(
        (acc, contact) => (contact.sentDate > threeMonthsAgo ? acc + 1 : acc),
        0
    );

    const maxSelectedContactsNotSent = Math.min(selectedContactsNotSent.length, maxCount);

    const nextContactNotSent = selectedContactsNotSent[0] || {
        name: "",
        email: "",
    };

    return {
        contacts,
        setContacts,
        emailsSent,
        isLoading,
        fetchError,
        setFetchError,
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
