import LetterEnglish from "../components/letters/LetterEnglish";
import LetterNorwegian from "../components/letters/LetterNorwegian";

export const subjects: Subjects = {
    English: [
        "The Interstellar Alliance Social Experiment Group",
        "Public Disclosure of UFO/UAP Information",
        "Call for Transparency on UFO/UAP and Extraterrestrial presence",
        "End UFO secrets now, begin public education",
        "Petition for UFO/UAP Disclosure within One year",
        "Custom Subject",
    ],
    Norwegian: [
        "Åpenhet og offentliggjøring av UAP informasjon",
        "Støtt frigjøringen av UAP-informasjon",
        "Offentliggjøring av informasjon angående UAP",
        "Krav om offentliggjøring av UAP-informasjon",
        "Tilpasset Emne",
    ],
};

export const emailComponents = {
    English: LetterEnglish,
    Norwegian: LetterNorwegian,
};

export const defaultLanguage: KeyOfEmailComponents = "English";

export type KeyOfEmailComponents = keyof typeof emailComponents;
export type Subjects = Record<KeyOfEmailComponents, string[]>;
export type SubjectPerLanguage = { [K in KeyOfEmailComponents]?: string };
