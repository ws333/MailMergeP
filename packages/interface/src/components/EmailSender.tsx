import React, { useState } from "react";
import { __DEV__, SINGLE_CONTACT_MODE } from "../constants/constants";
import { emailTemplates } from "../constants/emailTemplates";
import { saveLocalContacts } from "../helpers/contacts";
import { removeLocalStorageItem } from "../helpers/localStorageHelpers";
import { mergeTemplate } from "../helpers/mergeTemplate";
import { validateEmail } from "../helpers/validateEmail";
import { waitRandomSeconds } from "../helpers/waitRandomSeconds";
import { useContactList } from "../hooks/useContactList";
import { useEmailOptions } from "../hooks/useEmailOptions";
import { useSingleContact } from "../hooks/useSingleContact";
import { ContactI3C } from "../types/typesI3C";
import EmailOptions from "./EmailOptions";
import EmailPreview from "./EmailPreview";
import "./EmailSender.css";
import EmailsSentLog from "./EmailsSentLog";
import Header from "./Header";
import SelectNations from "./SelectNations";
import SendingProgress from "./SendingProgress";
import SingleContact from "./SingleContact";

const EmailSender = () => {
    const [logMessages, setLogMessages] = useState<string[]>([]);
    const [message, setMessage] = useState<string>("");
    const [sending, setSending] = useState<boolean>(false);

    const useCL = useContactList({ setMessage });
    const emailOptions = useEmailOptions({ useCL });
    const singleContactState = useSingleContact({
        language: emailOptions.language,
    });

    const onClickSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!emailOptions.selectedSubject) {
            setMessage("Please select or enter a subject");
            return false;
        }

        setSending(true);
        useCL.setEmailsSent(0);
        useCL.updateMaxSelectedContactsNotSent();
        let count = 0;
        const toSend = SINGLE_CONTACT_MODE
            ? [singleContactState.contact]
            : useCL.selectedContactsNotSent.slice(0, useCL.maxCount);
        for (const contact of toSend) {
            try {
                const sentStatus = await sendEmail(contact);
                if (!sentStatus) return;
                contact.sentDate = new Date().toISOString();
                setLogMessages((prev) => [
                    ...prev,
                    `Email sent to ${contact.email}`,
                ]);
                await waitRandomSeconds(emailOptions.delay);
            } catch (error) {
                console.log(
                    "*Debug* -> EmailSender.tsx -> handleSendEmails -> error:",
                    error
                );
                setLogMessages((prev) => [
                    ...prev,
                    `Failed to send email to ${contact.email}`,
                ]);
            }
            count++;
            useCL.setEmailsSent(count);
            saveLocalContacts([...useCL.contacts, ...toSend]); // Save updated contacts for each email sent
            await new Promise((res) =>
                setTimeout(res, emailOptions.delay * 1000)
            );
        }
        useCL.setContacts([...useCL.contacts, ...toSend]); // Update local state when done
        setSending(false);
    };

    const sendEmail = async (contact: ContactI3C) => {
        setMessage("Sending email, please wait...");

        const emailText = mergeTemplate(
            emailTemplates[emailOptions.language],
            contact
        );

        console.log(
            "*Debug* -> EmailSender.tsx -> sendEmail -> emailText:",
            emailText
        );
        return true;
    };

    const sendButtonDisabled =
        sending ||
        (SINGLE_CONTACT_MODE
            ? !validateEmail(singleContactState.email)
            : !useCL.selectedContactsNotSent.length);

    return (
        <div className="email-sender-container">
            <Header />

            <br />

            <form onSubmit={onClickSubmit} className="email-form">
                <div className="container">
                    <div className="column">
                        {SINGLE_CONTACT_MODE ? (
                            <SingleContact state={singleContactState} />
                        ) : (
                            <SelectNations useCL={useCL} sending={sending} />
                        )}
                    </div>
                    <br />

                    <div className="columnRight">
                        <EmailOptions
                            useCL={useCL}
                            emailOptions={emailOptions}
                            singleContactMode={SINGLE_CONTACT_MODE}
                        />
                    </div>
                    <br />
                </div>

                <button disabled={sendButtonDisabled} type="submit">
                    Send Email
                </button>
                {message && <p>{message}</p>}

                <div className="email-preview-container">
                    <EmailPreview
                        emailText={
                            SINGLE_CONTACT_MODE
                                ? singleContactState.emailText
                                : emailOptions.emailPreviewText
                        }
                    />
                </div>
            </form>

            {__DEV__ ? (
                <button onClick={() => removeLocalStorageItem("contactsI3C")}>
                    Empty local storage
                </button>
            ) : null}
            <br />
            {!SINGLE_CONTACT_MODE && <SendingProgress useCL={useCL} />}
            <br />
            {!SINGLE_CONTACT_MODE && (
                <EmailsSentLog logMessages={logMessages} />
            )}
        </div>
    );
};

export default EmailSender;
