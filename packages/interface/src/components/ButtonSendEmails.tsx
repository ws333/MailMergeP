import { Button } from "radzionkit";
import { MouseEventHandler } from "react";
import { UseContactListReturnType } from "../hooks/useContactList";

type Props = {
    checkInProgress: boolean;
    disabled: boolean | string;
    endSession: boolean;
    leftToSendCount: number;
    onClick: MouseEventHandler;
    useCL: UseContactListReturnType;
};

function ButtonSendEmails({ checkInProgress, disabled, endSession, leftToSendCount, onClick, useCL }: Props) {
    const buttonText =
        checkInProgress || endSession || useCL.isLoading
            ? "Please wait..."
            : !useCL.selectedNations.length
              ? "No contacts selected"
              : !leftToSendCount
                ? "Selected contacts already processed"
                : !useCL.emailsSent
                  ? "Send Emails"
                  : "Continue";
    return (
        <Button kind="primary" isDisabled={disabled} onClick={onClick} style={{ marginLeft: "0.5rem" }}>
            {buttonText}
        </Button>
    );
}

export default ButtonSendEmails;
