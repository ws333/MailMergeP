import { useState } from "react";
import { TEmailComponent } from "../types/types";
import { ContactI3C } from "../types/typesI3C";
import { renderEmail } from "../helpers/renderEmail";

type UseSingleContactArgs = {
    Component: TEmailComponent;
};

function useSingleContact({ Component }: UseSingleContactArgs) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const contact: ContactI3C = {
        uid: Date.now(),
        n: name,
        e: email,
        na: "",
        i: "",
        s: "",
        sd: 0,
        sc: 0,
        ud: "",
        dd: 0,
        cb1: "",
        cb2: "",
        cf1: "",
        cf2: "",
    };

    const emailText = renderEmail(Component, { name: contact.n });

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
