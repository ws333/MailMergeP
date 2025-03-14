import { MouseEventHandler } from "react";

type Props = {
    disabled: boolean;
    onClick: MouseEventHandler;
    emailsSent: number;
    leftToSendCount: number;
};

function ButtonSendEmails({ disabled, onClick, emailsSent, leftToSendCount }: Props) {
    return (
        <button disabled={disabled} onClick={onClick}>
            {emailsSent === 0 || leftToSendCount === 0 ? "Send Emails" : "Continue"}
        </button>
    );
}

export default ButtonSendEmails;
