import { useEffect } from "react";
import { defaultMaxCount, defaultSendingDelay } from "../constants/constants";
import { KeyOfEmailComponents, defaultLanguage, subjects } from "../constants/emailTemplates";
import { OPTIONS_KEY, getOptions } from "../helpers/indexedDB";
import { useStoreActions, useStoreState } from "./storeHooks";

function useEmailOptions() {
    const delay = useStoreState((state) => state.emailOptions.delay);
    const setDelay = useStoreActions((actions) => actions.emailOptions.setDelay);

    const language = useStoreState((state) => state.emailOptions.language);
    const setLanguage = useStoreActions((actions) => actions.emailOptions.setLanguage);

    const subjectOption = useStoreState((state) => state.emailOptions.subjectPerLanguage);

    const customSubject = useStoreState((state) => state.emailOptions.customSubject);
    const setCustomSubject = useStoreActions((actions) => actions.emailOptions.setCustomSubject);

    const EmailComponent = useStoreState((state) => state.emailOptions.EmailComponent);

    const selectedSubject =
        subjectOption[language] === "Custom Subject" || subjectOption[language] === "Tilpasset Emne"
            ? customSubject
            : subjectOption[language];

    const setMaxCount = useStoreActions((actions) => actions.contactList.setMaxCount);

    useEffect(() => {
        const hydrateOptions = async () => {
            const options = await getOptions();
            if (options) {
                const delay = (options.find((item) => item.key === OPTIONS_KEY.DELAY)?.value ??
                    defaultSendingDelay) as number;
                setDelay(delay);

                const _maxCount = (options.find((item) => item.key === OPTIONS_KEY.MAX_COUNT)?.value ??
                    defaultMaxCount) as number;
                setMaxCount(_maxCount);

                const customSubject = (options.find((item) => item.key === OPTIONS_KEY.CUSTOM_SUBJECT)?.value ??
                    "") as string;
                setCustomSubject(customSubject);

                const language = (options.find((item) => item.key === OPTIONS_KEY.LANGUAGE)?.value ??
                    defaultLanguage) as KeyOfEmailComponents;
                const storedSubjectPerLanguage = options.find((item) => item.key === OPTIONS_KEY.SUBJECT)
                    ?.value as string;
                const subjectPerLanguage = storedSubjectPerLanguage
                    ? JSON.parse(storedSubjectPerLanguage)
                    : { [language]: subjects[language][0] };
                setLanguage({ language, subjectPerLanguage: subjectPerLanguage });
            }
        };
        void hydrateOptions();
    }, [setCustomSubject, setDelay, setLanguage, setMaxCount]);

    return {
        delay,
        selectedSubject,
        EmailComponent,
    };
}
export { useEmailOptions };
