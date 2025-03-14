import { useRef, useState } from "react";
import LetterEnglish from "../components/letters/LetterEnglish";
import { minDelay } from "../constants/constants";
import { emailComponents, subjects } from "../constants/emailTemplates";
import { TEmailComponent } from "../types/types";
import { KeyOfEmailComponents } from "../types/typesI3C";

function useEmailOptions() {
    const [delay, setDelay] = useState<number>(minDelay);
    const [language, _setLanguage] = useState<KeyOfEmailComponents>("English");
    const [subjectOption, setSubjectOption] = useState<string>(subjects[language][0]);
    const [customSubject, setCustomSubject] = useState<string>("");
    const selectedSubject =
        subjectOption === "Custom Subject" || subjectOption === "Tilpasset Emne" ? customSubject : subjectOption;

    const EmailComponentRef = useRef<TEmailComponent>(LetterEnglish);

    const setLanguage = (value: KeyOfEmailComponents) => {
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
