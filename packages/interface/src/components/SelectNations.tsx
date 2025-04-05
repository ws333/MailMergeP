import { ContactI3C } from "../types/typesI3C";
import { useStoreActions, useStoreState } from "../hooks/storeHooks";
import { SentCounts } from "./SentCounts";
import "./SelectNations.css";

type Props = {
    selectedContactsNotSent: ContactI3C[];
    isSending: boolean;
};

function SelectNations({ selectedContactsNotSent, isSending }: Props) {
    const nationOptions = useStoreState((state) => state.contactList.nationOptions);
    const selectedContacts = useStoreState((state) => state.contactList.selectedContacts);
    const selectedNations = useStoreState((state) => state.contactList.selectedNations);
    const setSelectedNations = useStoreActions((actions) => actions.contactList.setSelectedNations);
    const toggleIsSelectedAllNations = useStoreActions((actions) => actions.contactList.toggleIsSelectedAllNations);
    const isSelectedAllNations = useStoreState((state) => state.contactList.isSelectedAllNations);

    const onChangeSelectAll = () => {
        toggleIsSelectedAllNations();
    };

    const onChangeNation = (checked: boolean, nation: string) => {
        setSelectedNations({ checked, nation });
    };

    return (
        <div className="select-nations">
            <div>
                <div className="title-container">
                    <label className="title">Available contacts</label>
                </div>
                <>
                    <div className={`nation-list ${isSending ? "disabled" : ""}`}>
                        <label className="nation-item">
                            <input
                                type="checkbox"
                                disabled={isSending}
                                checked={isSelectedAllNations}
                                onChange={onChangeSelectAll}
                            />
                            Select All
                        </label>
                    </div>
                    <div className={`nation-list ${isSending ? "disabled" : ""}`}>
                        {nationOptions.map((nation) => (
                            <label key={nation} className="nation-item">
                                <input
                                    type="checkbox"
                                    disabled={isSending}
                                    onChange={(e) => onChangeNation(e.target.checked, nation)}
                                    checked={selectedNations.includes(nation)}
                                />
                                {nation}
                            </label>
                        ))}
                    </div>
                    <div className="selected-info">
                        <div>
                            <div>Selected contacts</div>
                            <div>Not sent to last 3 months</div>
                        </div>
                        <div>
                            <div>{selectedContacts.length}</div>
                            <div>{selectedContactsNotSent.length}</div>
                        </div>
                    </div>
                    <SentCounts />
                </>
            </div>
        </div>
    );
}

export default SelectNations;
