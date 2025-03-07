import { useState } from "react";
import { emailTemplates, subjects } from "../constants/emailTemplates";
import { mergeTemplate } from "../helpers/mergeTemplate";
import { KeyOfTemplatesHTML } from "../types/typesI3C";
import { UseContactListReturnType } from "./useContactList";

type UseEmailOptionsArgs = {
    useCL: UseContactListReturnType;
};

function useEmailOptions({ useCL }: UseEmailOptionsArgs) {
    const [delay, setDelay] = useState<number>(1);
    const [language, _setLanguage] = useState<KeyOfTemplatesHTML>("English");
    const [subjectOption, setSubjectOption] = useState<string>(
        subjects[language][0]
    );
    const [customSubject, setCustomSubject] = useState<string>("");
    const selectedSubject =
        subjectOption === "Custom Subject" || subjectOption === "Tilpasset Emne"
            ? customSubject
            : subjectOption;

    const setLanguage = (value: KeyOfTemplatesHTML) => {
        _setLanguage(value);
        setSubjectOption(subjects[language][0]);
    };

    const emailPreviewText = mergeTemplate(
        emailTemplates[language],
        useCL.nextContactNotSent
    );

    return {
        delay,
        setDelay,
        language,
        setLanguage,
        subjectOption,
        setSubjectOption,
        customSubject,
        setCustomSubject,
        selectedSubject,
        emailPreviewText,
    };
}
export { useEmailOptions };
