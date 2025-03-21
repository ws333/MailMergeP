import { FocusEvent, useEffect, useRef, useState } from "react";
import { minDelay } from "../constants/constants";
import { emailComponents, subjects } from "../constants/emailTemplates";
import { objectKeys } from "../helpers/objectHelpers";
import { UseContactListReturnType } from "../hooks/useContactList";
import { useEmailOptions } from "../hooks/useEmailOptions";
import { KeyOfEmailComponents } from "../types/typesI3C";
import "./EmailOptions.css";

export type EmailOptionsProps = {
    useCL: UseContactListReturnType;
    emailOptions: ReturnType<typeof useEmailOptions>;
    isSending: boolean;
    singleContactMode: boolean;
};

function EmailOptions({ useCL, emailOptions, isSending, singleContactMode }: EmailOptionsProps) {
    const customSubjectRef = useRef<HTMLInputElement>(null);
    if (customSubjectRef.current) {
        customSubjectRef.current.value = emailOptions.customSubject;
    }

    const onBlurCustomSubject = (e: FocusEvent<HTMLInputElement>) => {
        if (customSubjectRef.current) {
            customSubjectRef.current.value = e.target.value;
        }
        emailOptions.setCustomSubject(e.target.value);
    };

    const customSubjectVisible =
        emailOptions.subjectOption === "Custom Subject" || emailOptions.subjectOption === "Tilpasset Emne"; // TODO:Use last items in the subjects array for these strings

    useEffect(() => {
        if (customSubjectVisible) {
            const input = document.getElementById("custom_subject_input");
            input?.focus();
        }
    }, [customSubjectVisible]);

    const [localDelay, setLocalDelay] = useState(emailOptions.delay.toString());

    return (
        <div className="email-options">
            {!singleContactMode && (
                <div className="delay-input">
                    <label>
                        Delay in seconds between emails sent
                        <br />
                        <div className="container-delay">
                            <div className="column-delay">
                                <input
                                    id="delay_input"
                                    type="number"
                                    value={localDelay}
                                    disabled={isSending}
                                    min={minDelay.toString()}
                                    onChange={(e) => setLocalDelay(e.target.value)}
                                    onBlur={(e) => {
                                        let value = Number(e.target.value);
                                        if (value < minDelay) value = minDelay;
                                        setLocalDelay(value.toString());
                                        emailOptions.setDelay(value);
                                    }}
                                />
                            </div>
                            <div className="column-delay">
                                <span className="small-print">{minDelay} is the minimum to avoid rate limits</span>
                                <span className="small-print">
                                    Increase if hitting the rate limit for your email provider
                                </span>
                            </div>
                        </div>
                    </label>
                </div>
            )}

            {!singleContactMode && (
                <div className="number-of-emails">
                    <label>
                        Number of emails to send in this session
                        <br />
                        <select
                            value={useCL.maxCount}
                            disabled={isSending}
                            onChange={(e) => useCL.setMaxCount(Number(e.target.value))}
                        >
                            {useCL.maxCountOptions.map((count) => (
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
                    value={emailOptions.language}
                    disabled={isSending}
                    onChange={(e) => emailOptions.setLanguage(e.target.value as KeyOfEmailComponents)}
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
                        value={emailOptions.subjectOption}
                        disabled={isSending}
                        onChange={(e) => emailOptions.setSubjectOption(e.target.value)}
                    >
                        {subjects[emailOptions.language].map((_subject) => (
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
