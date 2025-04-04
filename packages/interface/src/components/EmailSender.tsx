import { MessagePayload } from "@iases3/iframe-service/src/iframe-service";
import React, { useEffect, useRef, useState } from "react";
import { Email } from "../types/modelTypes";
import { ContactI3C, LogMessageOptions } from "../types/typesI3C";
import { SINGLE_CONTACT_MODE, defaultRandomWindow, fullProgressBarDelay, zeroWidtSpace } from "../constants/constants";
import { useStoreActions, useStoreState } from "../hooks/storeHooks";
import { useContactList } from "../hooks/useContactList";
import { useEmailOptions } from "../hooks/useEmailOptions";
import { useSingleContact } from "../hooks/useSingleContact";
import { useUpdateSendingStats } from "../hooks/useUpdateSendingStats";
import { getSessionFinishedText } from "../helpers/getSessionFinishedText";
import { storeActiveContacts } from "../helpers/indexedDB";
import { renderEmail } from "../helpers/renderEmail";
import { getLogsToDisplay, logSendingMessage } from "../helpers/sendingLog";
import { checkForDangelingSession, clearSessionState, updateSessionState } from "../helpers/sessionState";
import { validateEmail } from "../helpers/validateEmail";
import { waitRandomSeconds } from "../helpers/waitRandomSeconds";
import ButtonCancel from "./ButtonCancel";
import ButtonEndSession from "./ButtonEndSession";
import ButtonSendEmails from "./ButtonSendEmails";
import Dialog from "./Dialog";
import EmailOptions from "./EmailOptions";
import EmailPreview from "./EmailPreview";
import Header from "./Header";
import SelectNations from "./SelectNations";
import SendingLog from "./SendingLog";
import SendingProgress from "./SendingProgress";
import SingleContact from "./SingleContact";
import "./EmailSender.css";

const EmailSender = () => {
    const [message, setMessage] = useState<string>(zeroWidtSpace); // zeroWidtSpace used to keep styling consistent
    const [isSending, setIsSending] = useState(false);
    const [sendingLog, setSendingLog] = useState<string[]>([]);

    const userDialog = useStoreState((state) => state.userDialog);
    const forcedRender = useStoreState((state) => state.contactList.forcedRender);

    const sendEmail = useStoreActions((actions) => actions.sendEmail);
    const controller = useRef(new AbortController());

    const logMessage = (message: string, options?: LogMessageOptions) => {
        logSendingMessage(message, { setFn: setSendingLog, ...options });
    };

    useUpdateSendingStats(isSending);
    const useCL = useContactList();
    const emailOptions = useEmailOptions();
    const singleContactState = useSingleContact({
        Component: emailOptions.EmailComponent,
    });
    const toSendCount = SINGLE_CONTACT_MODE
        ? [singleContactState.contact]
        : useCL.selectedContactsNotSent.slice(0, useCL.maxCount - useCL.emailsSent);

    useEffect(() => {
        console.log(`Updating sendingLog after reset on render #${forcedRender}`);
        async function readLog() {
            await checkForDangelingSession();
            const logsToDisplay = await getLogsToDisplay();
            setSendingLog(logsToDisplay);
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
                (useCL.endSession || (leftToSendCount.current === 0 && !selectedNationsChangedSinceLastSending))
            ) {
                checkInProgress.current = true;
                await waitRandomSeconds(fullProgressBarDelay, 0); // Let progressbar stay at 100% for a few seconds
                const message = getSessionFinishedText(useCL.emailsSent);
                setMessage(message);
                logMessage(message, { addNewline: true });
                clearSessionState();
                checkInProgress.current = false;
                useCL.setEmailsSent(0);
                useCL.setEndSession(false);
                const messageReady = `${message} Ready to start new session!`;
                setMessage(messageReady);
            }
        }
        void checkIfSessionFinished();
    }, [useCL]);

    useEffect(() => {
        const handleEmailStatus = (e: MessageEvent<MessagePayload>) => {
            const message = e.data || {};

            // sendEmailStatus.headerMessageId is null when sending failed or was cancelled
            if (message.type === "SEND_EMAIL_STATUS" && message.data?.sendEmailStatus?.headerMessageId === null) {
                controller.current.abort();
                setMessage(
                    "Sending of the last email failed or was cancelled by user, if it failed please make sure you are online."
                );
            }
        };

        window.addEventListener("message", handleEmailStatus);

        return () => {
            window.removeEventListener("message", handleEmailStatus);
        };
    }, []);

    async function onClickSendEmail(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();

        if (!emailOptions.selectedSubject) {
            setMessage("Please select or enter a subject");
            return false;
        }

        setIsSending(true);
        setMessage("Sending emails...");

        selectedNationsAtSendTime.current = useCL.selectedNations;

        for await (const contact of toSendCount) {
            const logContact = `${contact.n} - ${contact.e}`;

            try {
                if (controller.current.signal.aborted) {
                    controller.current = new AbortController();
                    await waitRandomSeconds(fullProgressBarDelay / 2, 0);
                    break;
                }

                await prepareAndSendEmail(contact);

                contact.sd = Date.now();
                contact.sc++;
                await storeActiveContacts(contact); // Update the contact in indexedDB
                logMessage(`Email sent to ${logContact}`);

                const delay = leftToSendCount.current > 1 ? emailOptions.delay : fullProgressBarDelay;
                const randomWindow = leftToSendCount.current > 1 ? defaultRandomWindow : 0;

                // Important to update session state before the the wait
                useCL.setEmailsSent((count) => {
                    const newCount = ++count;
                    updateSessionState(newCount, delay);
                    return newCount;
                });

                await waitRandomSeconds(delay, randomWindow, { signal: controller.current.signal });
            } catch (error) {
                console.warn("*Debug* -> EmailSender.tsx -> handleSendEmails -> error:", error);
                logMessage(`Failed to send email to ${logContact}`);
            }
        }

        setIsSending(false);
    }

    const prepareAndSendEmail = async (contact: ContactI3C) => {
        const emailText = renderEmail(emailOptions.EmailComponent, { name: contact.n });
        const email: Email = {
            to: contact.e,
            subject: emailOptions.selectedSubject,
            body: emailText,
        };

        await sendEmail({ email, sendmode: "now" });
    };

    const onClickEndSession = () => {
        useCL.setEndSession(true);
        setMessage("Session ended by user...");
    };

    const onClickCancel = () => {
        controller.current.abort();
        setMessage("Sending stopped by user...");
    };

    const sendButtonDisabled =
        isSending ||
        useCL.endSession === true ||
        controller.current.signal.aborted ||
        checkInProgress.current ||
        (SINGLE_CONTACT_MODE
            ? !validateEmail(singleContactState.email) || !singleContactState.name
            : !useCL.selectedContactsNotSent.length);

    const cancelButtonDisabled =
        leftToSendCount.current === 0 ||
        useCL.emailsSent === 0 ||
        controller.current.signal.aborted ||
        checkInProgress.current;

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
                    showConfirmationModal={userDialog.showConfirmationModal}
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

                <div className="container_buttons">
                    {!isSending && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            {useCL.emailsSent > 0 && !useCL.endSession && !checkInProgress.current && (
                                <ButtonEndSession onClick={onClickEndSession} />
                            )}
                            <ButtonSendEmails
                                checkInProgress={checkInProgress.current}
                                disabled={sendButtonDisabled}
                                endSession={useCL.endSession}
                                leftToSendCount={leftToSendCount.current}
                                onClick={onClickSendEmail}
                                useCL={useCL}
                            />
                        </div>
                    )}

                    {isSending && (
                        <ButtonCancel
                            aborted={controller.current.signal.aborted}
                            checkInProgress={checkInProgress.current}
                            disabled={cancelButtonDisabled}
                            onClick={onClickCancel}
                            toSendCount={leftToSendCount.current}
                        />
                    )}
                </div>

                {!SINGLE_CONTACT_MODE && <SendingProgress useCL={useCL} />}

                <div className="container_email_preview">
                    <EmailPreview
                        Component={emailOptions.EmailComponent}
                        name={SINGLE_CONTACT_MODE ? singleContactState.name : useCL.nextContactNotSent.n}
                    />
                </div>
            </div>

            {!SINGLE_CONTACT_MODE && <SendingLog logMessages={sendingLog} />}
        </div>
    );
};

export default EmailSender;
