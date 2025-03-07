import { useState } from "react";
import { emailTemplates } from "../constants/emailTemplates";
import { mergeTemplate } from "../helpers/mergeTemplate";
import { ContactI3C, KeyOfTemplatesHTML } from "../types/typesI3C";

type UseSingleContactArgs = {
    language: KeyOfTemplatesHTML;
};

function useSingleContact({ language }: UseSingleContactArgs) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const contact: ContactI3C = {
        uid: Date.now(),
        name,
        email,
        nation: "",
        institution: "",
        sentDate: "",
        updatedDate: "",
    };
    const emailText = mergeTemplate(emailTemplates[language], contact);

    return {
        name,
        setName,
        email,
        setEmail,
        emailText,
        contact,
    };
}

export { useSingleContact };
