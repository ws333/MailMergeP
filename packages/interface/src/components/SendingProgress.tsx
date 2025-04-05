import { ContactI3C } from "../types/typesI3C";
import { useStoreState } from "../hooks/storeHooks";

type Props = {
    maxSelectedContactsNotSent: number;
    selectedContactsNotSent: ContactI3C[];
};

function SendingProgress({ maxSelectedContactsNotSent, selectedContactsNotSent }: Props) {
    const emailsSent = useStoreState((state) => state.contactList.emailsSent);
    const maxCount = useStoreState((state) => state.contactList.maxCount);

    const max =
        maxSelectedContactsNotSent === 0
            ? emailsSent
            : emailsSent === 0
              ? maxSelectedContactsNotSent
              : maxSelectedContactsNotSent < maxCount
                ? selectedContactsNotSent.length + emailsSent
                : maxCount;

    return (
        <section className="section_sending_progress">
            <h2>Progress</h2>
            <progress className="progress_bar" value={emailsSent} max={max}></progress>
            <p>
                {emailsSent} / {max}
            </p>
        </section>
    );
}

export default SendingProgress;
