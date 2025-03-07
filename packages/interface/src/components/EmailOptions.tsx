import { FocusEvent, useRef } from "react";
import { emailTemplates, subjects } from "../constants/emailTemplates";
import { objectKeys } from "../helpers/objectHelpers";
import { UseContactListReturnType } from "../hooks/useContactList";
import { useEmailOptions } from "../hooks/useEmailOptions";
import { KeyOfTemplatesHTML } from "../types/typesI3C";
import "./EmailOptions.css";

export type EmailOptionsProps = {
    useCL: UseContactListReturnType;
    emailOptions: ReturnType<typeof useEmailOptions>;
    singleContactMode: boolean;
};

function EmailOptions({
    useCL,
    emailOptions,
    singleContactMode,
}: EmailOptionsProps) {
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
        emailOptions.subjectOption === "Custom Subject" ||
        emailOptions.subjectOption === "Tilpasset Emne"; // Todo:Use last items in the subjects array for these strings

    return (
        <div className="email-options">
            <br />
            {!singleContactMode && (
                <div className="delay-input">
                    <label>
                        Delay between emails sent{" "}
                        <input
                            type="number"
                            value={emailOptions.delay.toString()}
                            min="1"
                            onChange={(e) => {
                                let value = e.target.value; // Todo:Allow empty field when modifying the value, us local useState for onChange
                                console.log(
                                    "*Debug* -> EmailOptions.tsx -> value:",
                                    value
                                );
                                if (e.target.value === "") {
                                    emailOptions.setDelay(1);
                                    // emailOptions.setDelay(0);
                                    // }
                                } else {
                                    emailOptions.setDelay(Number(value));
                                }
                            }}
                            onBlur={(e) => {
                                let value = Number(e.target.value);
                                if (e.target.value !== "") {
                                    if (value < 1) {
                                        value = 1;
                                        // emailOptions.setDelay(value);
                                    }
                                    // emailOptions.setDelay(value);
                                }
                            }}
                        />
                    </label>
                </div>
            )}

            {!singleContactMode && (
                <div className="number-of-emails">
                    <label>
                        Number of emails{" "}
                        <select
                            value={useCL.maxCount}
                            onChange={(e) =>
                                useCL.setMaxCount(Number(e.target.value))
                            }
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
                Email language{" "}
                <select
                    value={emailOptions.language}
                    onChange={(e) =>
                        emailOptions.setLanguage(
                            e.target.value as KeyOfTemplatesHTML
                        )
                    }
                >
                    {objectKeys(emailTemplates).map((_language) => (
                        <option key={_language} value={_language}>
                            {_language}
                        </option>
                    ))}
                </select>
            </label>

            <div className="subject-input">
                <label>
                    Subject{" "}
                    <select
                        value={emailOptions.subjectOption}
                        onChange={(e) =>
                            emailOptions.setSubjectOption(e.target.value)
                        }
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
                    type="text"
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
