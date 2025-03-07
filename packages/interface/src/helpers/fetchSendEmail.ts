import { ContactI3C } from "../types/typesI3C";

export async function fetchSendEmail(
    url: string,
    accessToken: string,
    contact: ContactI3C,
    emailText: string,
    selectedSubject: string
) {
    return await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            accessToken,
            to: contact.email,
            subject: selectedSubject,
            text: emailText,
            nation: contact.nation,
            uid: contact.uid,
        }),
    });
}
