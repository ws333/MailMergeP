import { Button } from "radzionkit";
import { MouseEventHandler } from "react";

type Props = {
    aborted?: boolean;
    checkInProgress?: boolean;
    disabled?: boolean | string;
    onClick: MouseEventHandler;
    toSendCount: number;
};

function ButtonCancel({ aborted, checkInProgress, disabled, onClick, toSendCount }: Props) {
    const buttonText = aborted || checkInProgress || !toSendCount ? "Please wait..." : "Cancel";
    return (
        <Button isDisabled={disabled} onClick={onClick}>
            {buttonText}
        </Button>
    );
}

export default ButtonCancel;
