import { useRef, useState } from "react";
import LetterEnglish from "../components/letters/LetterEnglish";
import { emailComponents, subjects } from "../constants/emailTemplates";
import { KeyOfTemplatesHTML } from "../types/typesI3C";

function useEmailOptions() {
    const [delay, setDelay] = useState<number>(1);
    const [language, _setLanguage] = useState<KeyOfTemplatesHTML>("English");
    const [subjectOption, setSubjectOption] = useState<string>(subjects[language][0]);
    const [customSubject, setCustomSubject] = useState<string>("");
    const selectedSubject =
        subjectOption === "Custom Subject" || subjectOption === "Tilpasset Emne" ? customSubject : subjectOption;

    const EmailComponentRef = useRef<typeof LetterEnglish>(LetterEnglish);

    const setLanguage = (value: KeyOfTemplatesHTML) => {
        _setLanguage(value);
        setSubjectOption(subjects[value][0]);
        EmailComponentRef.current = emailComponents[value];
    };

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
        EmailComponent: EmailComponentRef.current,
    };
}
export { useEmailOptions };
