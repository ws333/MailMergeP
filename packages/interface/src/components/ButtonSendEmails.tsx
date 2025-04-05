import { Button } from "radzionkit";
import { MouseEventHandler } from "react";
import { useStoreState } from "../hooks/storeHooks";

type Props = {
    checkInProgress: boolean;
    disabled: boolean | string;
    endSession: boolean;
    leftToSendCount: number;
    onClick: MouseEventHandler;
};

function ButtonSendEmails({ checkInProgress, disabled, endSession, leftToSendCount, onClick }: Props) {
    const emailsSent = useStoreState((state) => state.contactList.emailsSent);
    const selectedNations = useStoreState((state) => state.contactList.selectedNations);

    const buttonText =
        checkInProgress || endSession
            ? "Please wait..."
            : !selectedNations.length
              ? "No contacts selected"
              : !leftToSendCount
                ? "Selected contacts already processed"
                : !emailsSent
                  ? "Send Emails"
                  : "Continue";
    return (
        <Button className="session_buttons" isDisabled={disabled} onClick={onClick}>
            {buttonText}
        </Button>
    );
}

export default ButtonSendEmails;
