import { UseContactListReturnType } from "../hooks/useContactList";

type SendingProgressProps = {
    useCL: UseContactListReturnType;
};

function SendingProgress({ useCL }: SendingProgressProps) {
    return (
        <section className="sending-progress">
            <h2>Progress</h2>
            <progress
                value={useCL.emailsSent}
                max={Math.min(useCL.selectedContacts.length, useCL.maxCount)}
                className="progress-bar"
            ></progress>
            <p>
                {useCL.emailsSent} / {useCL.maxSelectedContactsNotSent.current}
            </p>
        </section>
    );
}

export default SendingProgress;
