import { __DEV__ } from "../constants/constants";
import { objectEntries } from "../helpers/objectHelpers";
import { UseContactListReturnType } from "../hooks/useContactList";
import "./SelectNations.css";

type SelectNationsProps = {
    useCL: UseContactListReturnType;
    isSending: boolean;
};

function SelectNations({ useCL, isSending }: SelectNationsProps) {
    const onChangeSelectAll = () => {
        const newState = !useCL.selectAll;
        useCL.setSelectAll(newState);
        useCL.setSelectedNations(newState ? [...useCL.nationOptions] : []);
    };

    const onChangeNation = (nation: string, checked: boolean) => {
        if (checked) {
            useCL.setSelectedNations((prev) => [...prev, nation]);
        } else {
            useCL.setSelectedNations((prev) => prev.filter((n) => n !== nation));
        }
    };

    return (
        <div className="select-nations">
            {!useCL.isLoading && (
                <div className="nation-options">
                    <div className="title-container">
                        <label className="title">Available contacts</label>
                    </div>
                    <div className={`nation-list ${isSending ? "disabled" : ""}`}>
                        <label className="nation-item">
                            <input
                                type="checkbox"
                                disabled={isSending}
                                checked={useCL.selectAll}
                                onChange={onChangeSelectAll}
                            />
                            Select All
                        </label>
                    </div>
                    <div className={`nation-list ${isSending ? "disabled" : ""}`}>
                        {useCL.nationOptions.map((nation) => (
                            <label key={nation} className="nation-item">
                                <input
                                    type="checkbox"
                                    disabled={isSending}
                                    onChange={(e) => onChangeNation(nation, e.target.checked)}
                                    checked={useCL.selectedNations.includes(nation)}
                                />
                                {nation}
                            </label>
                        ))}
                    </div>
                </div>
            )}
            <div className="selected-info">
                <div>Selected contacts {useCL.selectedContacts.length}</div>
                <div>Selected not sent {useCL.selectedContactsNotSent.length}</div>
                {__DEV__ && <div>mostRecentUidsSentPerNation: {objectEntries(useCL.mostRecentUidsSentPerNation)}</div>}
            </div>
        </div>
    );
}

export default SelectNations;
