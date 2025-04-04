/*
 * A model for a Redux store (using easy-peasy) for all mailmerge code.
 * All persistent state is stored via this model.
 */
import { action, actionOn, computed, thunk } from "easy-peasy";
import type { Model } from "./types/modelTypes";
import { defaultMaxCount } from "./constants/constants";
import TextEndingSession from "./components/dialogTexts/TextEndingSession";
import { storeOptionsKey } from "./helpers/indexedDB";
import { messageParent } from "./service";
import { delay as delayPromise, formatTime, parseSpreadsheet } from "./utils";

export const model: Model = {
    locale: {
        strings: {},
        updateStrings: action((state, payload) => {
            return { ...state, strings: { ...payload } };
        }),
    },
    prefs: {
        delay: 0,
        sendmode: "now",
        range: "",
        fileName: "",
        fileContents: [],
        updatePref: thunk(async (actions, payload, { getState }) => {
            const newPrefs = { ...getState(), ...payload };

            // First send an update to the host window, then update the state.
            await messageParent({
                type: "SET_PREFERENCES",
                data: {
                    prefs: newPrefs,
                },
            });

            actions.updatePrefNosync(newPrefs);
        }),
        updatePrefNosync: action((state, payload) => {
            return { ...state, ...payload };
        }),
        fetchPrefs: thunk(async (actions) => {
            // Send a signal to get the preferences
            const data = await messageParent({ type: "GET_PREFERENCES" });
            if (data?.prefs) {
                actions.updatePrefNosync(data.prefs);
            }
        }),
    },
    data: {
        spreadsheetData: [[]],
        updateSpreadsheetData: action((state, payload) => {
            return { ...state, spreadsheetData: [...payload] };
        }),
        emails: [],
    },
    initialise: thunk(async (_actions, _payload, { dispatch }) => {
        await dispatch.prefs.fetchPrefs();
        const data = await messageParent({
            type: "GET_LOCALIZED_STRINGS",
        });
        if (data?.strings) {
            dispatch.locale.updateStrings(data.strings);
        }
    }),
    cancel: thunk(async () => {
        await messageParent({ type: "CANCEL" });
    }),
    parseSpreadsheet: thunk(async (_actions, _payload, { dispatch, getState }) => {
        // Presuming raw data has been loaded into .prefs, parse with XLSX.js
        const state = getState();
        const { fileContents } = state.prefs;

        const sheetArray = parseSpreadsheet(fileContents || []);
        dispatch.data.updateSpreadsheetData(sheetArray);
    }),
    sendEmails: thunk(async (actions, _payload, { getState }) => {
        const {
            data,
            prefs: { delay, sendmode },
            locale: { strings },
        } = getState();

        // Start a timer that updates the time throughout the whole process
        const startTime = Date.now();
        const intervalHandle = window.setInterval(
            () =>
                actions.sendDialog.update({
                    time: formatTime(Date.now() - startTime),
                }),
            500
        );

        let current = 0;
        // Set the initial dialog properties
        actions.sendDialog.update({
            open: true,
            abort: false,
            progress: 0,
            current,
            total: data.emails.length,
            time: "",
        });

        try {
            function shouldAbort() {
                const {
                    sendDialog: { abort },
                } = getState();
                return abort || false;
            }
            for (const email of data.emails) {
                // Check for the abort state before we send an email
                if (shouldAbort()) {
                    break;
                }
                current += 1;
                actions.sendDialog.update({
                    current,
                    progress: current / (data.emails.length + 1),
                    status: strings.sending,
                });
                await actions.sendEmail({ email, sendmode });
                actions.sendDialog.update({
                    status: strings.waiting,
                });

                // Compute how long to wait before sending the next email
                const waitTime = delay ? 1000 * delay * current - (Date.now() - startTime) : 0;
                await delayPromise(waitTime, shouldAbort);
            }
        } catch (e) {
            console.error(e);
        }

        // Cleanup
        clearTimeout(intervalHandle);
        actions.sendDialog.update({
            open: false,
        });
    }),
    sendEmail: thunk(async (_actions, payload) => {
        await messageParent({ type: "SEND_EMAIL", data: { ...payload } });
    }),
    // Everything associated with an email being sent
    sendDialog: {
        open: false,
        abort: false,
        progress: 0,
        current: 1,
        time: "",
        total: 0,
        status: "",
        update: action((state, payload) => ({
            ...state,
            ...payload,
        })),
        cancel: thunk((actions) => {
            actions.update({ abort: true });
        }),
    },
    openUrl: thunk(async (_actions, payload) => {
        await messageParent({ type: "OPEN_URL", data: { url: payload } });
    }),
    userDialog: {
        title: "",
        message: "",
        isOpen: false,
        closeDialog: thunk((actions) => {
            actions.setUserDialog({ ...model.userDialog });
        }),
        setUserDialog: action((state, payload) => ({ ...state, isOpen: true, ...payload })),
        showConfirmationModal: true,
    },
    contactList: {
        contacts: [],
        setContacts: action((state, payload) => ({ ...state, contacts: [...payload] })),
        selectedContacts: computed((state) =>
            state.contacts.filter((contact) => state.selectedNations.includes(contact.na))
        ),

        deletedContacts: [],
        setDeletedContacts: action((state, payload) => ({ ...state, deletedContacts: [...payload] })),

        endSession: false,
        setEndSession: action((state, payload) => ({ ...state, endSession: payload })),

        emailsSent: 0,
        setEmailsSent: action((state, payload) => ({
            ...state,
            emailsSent: typeof payload === "number" ? payload : payload(state.emailsSent),
        })),

        forcedRender: 1,
        initiateForcedRender: action((state) => ({ ...state, forcedRender: state.forcedRender + 1 })),

        maxCount: defaultMaxCount,
        _setMaxCount: action((state, payload) => ({ ...state, maxCount: payload })), // Internal use only
        setMaxCount: thunk((_, payload, { getStoreState, getStoreActions }) => {
            const storeState = getStoreState();
            const storeActions = getStoreActions();
            if (payload <= storeState.contactList.emailsSent) {
                storeActions.userDialog.setUserDialog({
                    title: "Ending session!",
                    message: TextEndingSession,
                    onConfirm: () => {
                        storeActions.contactList._setMaxCount(payload);
                        storeActions.contactList.setEndSession(true);
                    },
                });
                return;
            }
            storeActions.contactList._setMaxCount(payload);
            storeOptionsKey(payload, "maxCount");
            return { ...storeState, maxCount: payload };
        }),

        nationOptions: [],
        setNationOptions: action((state, payload) => ({ ...state, nationOptions: [...payload] })),

        nationOptionsFetched: [],
        setNationOptionsFetched: action((state, payload) => ({ ...state, nationOptionsFetched: [...payload] })),
        // Update nationOptions when nationOptionsFetched change
        updateNationOptions: actionOn(
            (actions) => actions.setNationOptionsFetched,
            (state, target) => ({ ...state, nationOptions: [...target.payload] })
        ),
        // Update selectedNations when nationOptions change
        updateSelectedNations: actionOn(
            (actions) => actions.setNationOptions,
            (state, target) => ({
                ...state,
                selectedNations: [...state.selectedNations.filter((nation) => target.payload.includes(nation))],
            })
        ),

        selectedNations: [],
        setSelectedNations: action((state, payload) => {
            const { checked, nation } = payload;
            const updatedSN = checked
                ? [...state.selectedNations, nation]
                : state.selectedNations.filter((n) => n !== nation);
            return {
                ...state,
                selectedNations: updatedSN,
            };
        }),

        isSelectedAllNations: false,
        setIsSelectedAllNations: action((state, payload) => ({
            ...state,
            isSelectedAllNations: payload,
            selectedNations: payload ? [...state.nationOptions] : [],
        })),
        toggleIsSelectedAllNations: thunk((actions, _, { getState }) => {
            const state = getState();
            actions.setIsSelectedAllNations(!state.isSelectedAllNations);
        }),
    },
};
