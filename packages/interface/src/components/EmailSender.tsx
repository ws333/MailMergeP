import React, { useEffect, useRef, useState } from "react";
import { Email } from "../types/modelTypes";
import { ContactI3C, LogMessageOptions } from "../types/typesI3C";
import {
    SINGLE_CONTACT_MODE,
    defaultRandomWindow,
    fullProgressBarDelay,
    sessionFinishedText,
} from "../constants/constants";
import { useStoreActions, useStoreState } from "../hooks/storeHooks";
import { useContactList } from "../hooks/useContactList";
import { useEmailOptions } from "../hooks/useEmailOptions";
import { useSingleContact } from "../hooks/useSingleContact";
import { storeActiveContacts } from "../helpers/indexedDB";
import { isExtension } from "../helpers/isExtension";
import { renderEmail } from "../helpers/renderEmail";
import { logSendingMessage, readSendingLog } from "../helpers/sendingLog";
import { validateEmail } from "../helpers/validateEmail";
import { waitRandomSeconds } from "../helpers/waitRandomSeconds";
import ButtonCancel from "./ButtonCancel";
import ButtonEndSession from "./ButtonEndSession";
import ButtonSendEmails from "./ButtonSendEmails";
import Dialog from "./Dialog";
import EmailOptions from "./EmailOptions";
import EmailPreview from "./EmailPreview";
import EmailsSentLog from "./EmailsSentLog";
import Header from "./Header";
import SelectNations from "./SelectNations";
import SendingProgress from "./SendingProgress";
import SingleContact from "./SingleContact";
import "./EmailSender.css";

const EmailSender = () => {
    const [message, setMessage] = useState<string>(
        isExtension() ? "Send disabled in extension while developing" : "To begin select contact lists to process above"
    );
    const [endSession, setEndSession] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendingLog, setSendingLog] = useState<string[]>([]);

    const userDialog = useStoreState((state) => state.userDialog);
    const forcedRender = useStoreState((state) => state.contactList.forcedRender);

    const sendEmail = useStoreActions((actions) => actions.sendEmail);
    const controller = useRef(new AbortController());

    const logMessage = (message: string, options?: LogMessageOptions) => {
        logSendingMessage(message, { setFn: setSendingLog, ...options });
    };

    const useCL = useContactList();
    const emailOptions = useEmailOptions();
    const singleContactState = useSingleContact({
        Component: emailOptions.EmailComponent,
    });

    useEffect(() => {
        console.log(`Updating sendingLog after reset on render #${forcedRender}`);
        async function readLog() {
            const storedLog = await readSendingLog();
            setSendingLog(storedLog);
        }
        void readLog();
    }, [forcedRender]);

    const leftToSendCount = useRef(0);
    const remainingCountSession = Math.max(0, useCL.maxCount - useCL.emailsSent);
    leftToSendCount.current = useCL.selectedContactsNotSent.slice(0, remainingCountSession).length;

    const checkInProgress = useRef(false);
    const selectedNationsAtSendTime = useRef<string[]>([]);
    useEffect(() => {
        async function checkIfSessionFinished() {
            const selectedNationsChangedSinceLastSending = selectedNationsAtSendTime.current !== useCL.selectedNations;
            if (
                useCL.emailsSent > 0 &&
                !checkInProgress.current &&
                (endSession || (leftToSendCount.current === 0 && !selectedNationsChangedSinceLastSending))
            ) {
                checkInProgress.current = true;
                await waitRandomSeconds(fullProgressBarDelay, 0); // Let progressbar stay at 100% for a few seconds
                const message = `${sessionFinishedText} ${useCL.emailsSent.toString()} emails were sent.`;
                setMessage(message);
                logMessage(message, { addNewline: true });
                checkInProgress.current = false;
                useCL.setEmailsSent(0);
                setEndSession(false);
                const messageReady = `${message} Ready to start new session!`;
                setMessage(messageReady);
            }
        }
        void checkIfSessionFinished();
    }, [endSession, useCL]);

    async function onClickSendEmail(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();

        if (!emailOptions.selectedSubject) {
            setMessage("Please select or enter a subject");
            return false;
        }

        setIsSending(true);
        selectedNationsAtSendTime.current = useCL.selectedNations;
        const toSendCount = useCL.maxCount - useCL.emailsSent;
        const toSend = SINGLE_CONTACT_MODE
            ? [singleContactState.contact]
            : useCL.selectedContactsNotSent.slice(0, toSendCount);

        for await (const contact of toSend) {
            const logContact = `${contact.name} - ${contact.email}`;

            try {
                if (controller.current.signal.aborted) {
                    controller.current = new AbortController();
                    await waitRandomSeconds(fullProgressBarDelay / 2, 0);
                    break;
                }

                const sentStatus = await prepareAndSendEmail(contact);
                if (!sentStatus) return;

                useCL.setEmailsSent((count) => ++count);
                contact.sentDate = Date.now();
                contact.sentCount++;
                await storeActiveContacts(contact); // Update the contact in indexedDB
                logMessage(`Email sent to ${logContact}`);

                const delay = leftToSendCount.current > 1 ? emailOptions.delay : fullProgressBarDelay;
                const randomWindow = leftToSendCount.current > 1 ? defaultRandomWindow : 0;
                await waitRandomSeconds(delay, randomWindow, { signal: controller.current.signal });
            } catch (error) {
                console.warn("*Debug* -> EmailSender.tsx -> handleSendEmails -> error:", error);
                logMessage(`Failed to send email to ${logContact}`);
            }
        }

        setIsSending(false);
    }

    const prepareAndSendEmail = async (contact: ContactI3C) => {
        setMessage("Sending emails...");

        const emailText = renderEmail(emailOptions.EmailComponent, { name: contact.name });
        const email: Email = {
            to: contact.email,
            subject: emailOptions.selectedSubject,
            body: emailText,
        };

        await sendEmail({ email, sendmode: "now" }); // TODO Implement sendmode?
        return true; // TODO Implement error handling?
    };

    const onClickEndSession = () => {
        setEndSession(true);
        setMessage("Session ended by user...");
    };

    const onClickCancel = () => {
        controller.current.abort();
        setMessage("Sending stopped by user...");
    };

    const sendButtonDisabled =
        isExtension() || // To avoid sending emails from the extension while developing
        isSending ||
        controller.current.signal.aborted ||
        checkInProgress.current ||
        (SINGLE_CONTACT_MODE
            ? !validateEmail(singleContactState.email) || !singleContactState.name
            : !useCL.selectedContactsNotSent.length);

    const cancelButtonDisabled = useCL.emailsSent === 0 || controller.current.signal.aborted || checkInProgress.current;

    return (
        <div className="container_email_sender">
            <Header />
            <br />

            {userDialog.isOpen && (
                <Dialog
                    title={userDialog.title}
                    message={userDialog.message}
                    confirmActionText={userDialog.confirmActionText}
                    isOpen={userDialog.isOpen}
                    onClose={userDialog.onClose}
                    onConfirm={userDialog.onConfirm}
                />
            )}

            <div className="container_options_and_preview">
                <div className="container_options">
                    <div className="column_options_left">
                        {SINGLE_CONTACT_MODE ? (
                            <SingleContact state={singleContactState} />
                        ) : (
                            <SelectNations useCL={useCL} isSending={isSending} />
                        )}
                    </div>
                    <br />

                    <div className="column_options_right">
                        <EmailOptions
                            useCL={useCL}
                            emailOptions={emailOptions}
                            isSending={isSending}
                            singleContactMode={SINGLE_CONTACT_MODE}
                        />
                    </div>
                    <br />
                </div>

                {message && <p>{message}</p>}

                {!isSending && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        {useCL.emailsSent > 0 && !endSession && !checkInProgress.current && (
                            <ButtonEndSession onClick={onClickEndSession} />
                        )}
                        <ButtonSendEmails
                            disabled={sendButtonDisabled}
                            checkInProgress={checkInProgress.current}
                            onClick={onClickSendEmail}
                            useCL={useCL}
                            leftToSendCount={leftToSendCount.current}
                        />
                    </div>
                )}

                {isSending && (
                    <ButtonCancel
                        aborted={controller.current.signal.aborted}
                        checkInProgress={checkInProgress.current}
                        disabled={cancelButtonDisabled}
                        onClick={onClickCancel}
                    />
                )}

                {!SINGLE_CONTACT_MODE && <SendingProgress useCL={useCL} />}

                <div className="container_email_preview">
                    <EmailPreview
                        Component={emailOptions.EmailComponent}
                        name={SINGLE_CONTACT_MODE ? singleContactState.name : useCL.nextContactNotSent.name}
                    />
                </div>
            </div>

            {!SINGLE_CONTACT_MODE && <EmailsSentLog logMessages={sendingLog} />}
        </div>
    );
};

export default EmailSender;
