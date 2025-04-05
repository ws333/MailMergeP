import { Tooltip } from "radzionkit/ui/tooltips/Tooltip";
import { FocusEvent, useEffect, useRef, useState } from "react";
import { maxCountOptions, minSendingDelay } from "../constants/constants";
import { KeyOfEmailComponents, emailComponents, subjects } from "../constants/emailTemplates";
import { useStoreActions, useStoreState } from "../hooks/storeHooks";
import { storeOptionsKey } from "../helpers/indexedDB";
import { objectKeys } from "../helpers/objectHelpers";
import "./EmailOptions.css";

export type EmailOptionsProps = {
    isSending: boolean;
    singleContactMode: boolean;
};

function EmailOptions({ isSending, singleContactMode }: EmailOptionsProps) {
    const delay = useStoreState((state) => state.emailOptions.delay);
    const setDelay = useStoreActions((actions) => actions.emailOptions.setDelay);

    const language = useStoreState((state) => state.emailOptions.language);
    const setLanguage = useStoreActions((actions) => actions.emailOptions.setLanguage);

    const subject = useStoreState((state) => state.emailOptions.subject);
    const setSubjectOption = useStoreActions((actions) => actions.emailOptions.setSubjectPerLanguage);

    const customSubject = useStoreState((state) => state.emailOptions.customSubject);
    const setCustomSubject = useStoreActions((actions) => actions.emailOptions.setCustomSubject);

    const maxCount = useStoreState((state) => state.contactList.maxCount);
    const setMaxCount = useStoreActions((actions) => actions.contactList.setMaxCount);

    const customSubjectRef = useRef<HTMLInputElement>(null);
    if (customSubjectRef.current) {
        customSubjectRef.current.value = customSubject;
    }
    const customSubjectVisible = useStoreState((state) => state.emailOptions.customSubjectVisible);

    const onBlurCustomSubject = (e: FocusEvent<HTMLInputElement>) => {
        if (customSubjectRef.current) {
            customSubjectRef.current.value = e.target.value;
        }
        setCustomSubject(e.target.value);
    };

    useEffect(() => {
        if (customSubjectVisible) {
            const input = document.getElementById("custom_subject_input");
            input?.focus();
        }
    }, [customSubjectVisible]);

    // Update local delay after hydration
    useEffect(() => {
        setLocalDelay(delay.toString());
    }, [delay]);

    // Using local state to allow empty input
    const [localDelay, setLocalDelay] = useState(delay.toString());

    function processDelayInput(value: string) {
        const delay = Number(value);
        return delay > minSendingDelay ? delay : minSendingDelay;
    }

    return (
        <div className="email-options">
            {!singleContactMode && (
                <div className="delay-input">
                    <Tooltip
                        placement="top"
                        renderOpener={(props) => (
                            <label {...props}>
                                Delay in seconds between emails sent
                                <br />
                                <div className="container-delay">
                                    <div>
                                        <input
                                            id="delay_input"
                                            type="number"
                                            value={localDelay}
                                            disabled={isSending}
                                            min={minSendingDelay.toString()}
                                            onChange={(e) => {
                                                const { value } = e.target;
                                                setLocalDelay(value.toString());
                                                storeOptionsKey(processDelayInput(value), "delay");
                                            }}
                                            onBlur={(e) => {
                                                const delay = processDelayInput(e.target.value);
                                                setLocalDelay(delay.toString());
                                                setDelay(delay);
                                            }}
                                        />
                                    </div>
                                </div>
                            </label>
                        )}
                        content={
                            <span className="tooltip-min-sending-delay">
                                {minSendingDelay} is the minimum to avoid rate limits, increase if hitting the rate
                                limit for your email provider.
                            </span>
                        }
                    />
                </div>
            )}

            {!singleContactMode && (
                <div className="number-of-emails">
                    <label>
                        Number of emails to send in this session
                        <br />
                        <select
                            value={maxCount}
                            disabled={isSending}
                            onChange={(e) => setMaxCount(Number(e.target.value))}
                        >
                            {maxCountOptions.map((count) => (
                                <option key={count} value={count}>
                                    {count}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}

            <label>
                Email language
                <br />
                <select
                    value={language}
                    disabled={isSending}
                    onChange={(e) => setLanguage({ language: e.target.value as KeyOfEmailComponents })}
                >
                    {objectKeys(emailComponents).map((_language) => (
                        <option key={_language} value={_language}>
                            {_language}
                        </option>
                    ))}
                </select>
            </label>

            <div className="subject-input">
                <label>
                    Subject
                    <br />
                    <select
                        value={subject}
                        disabled={isSending}
                        onChange={(e) => setSubjectOption({ [language]: e.target.value })}
                    >
                        {subjects[language].map((_subject) => (
                            <option key={_subject} value={_subject}>
                                {_subject}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <label
                className="custom-subject"
                style={{
                    display: customSubjectVisible ? "inline-block" : "none",
                }}
            >
                Custom Subject <br />
                <input
                    id="custom_subject_input"
                    type="text"
                    disabled={isSending}
                    ref={customSubjectRef}
                    onChange={() => null}
                    onBlur={onBlurCustomSubject}
                    required
                />
            </label>
        </div>
    );
}

export default EmailOptions;
