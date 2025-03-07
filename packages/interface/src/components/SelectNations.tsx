import { __DEV__ } from "../constants/constants";
import { objectEntries } from "../helpers/objectHelpers";
import { UseContactListReturnType } from "../hooks/useContactList";
import "./SelectNations.css";

type SelectNationsProps = {
    useCL: UseContactListReturnType;
    sending: boolean;
};

function SelectNations({ useCL, sending }: SelectNationsProps) {
    const onChangeSelectAll = () => {
        const newState = !useCL.selectAll;
        useCL.setSelectAll(newState);
        useCL.setSelectedNations(newState ? [...useCL.nationOptions] : []);
    };

    const onChangeNation = (nation: string, checked: boolean) => {
        if (checked) {
            useCL.setSelectedNations((prev) => [...prev, nation]);
        } else {
            useCL.setSelectedNations((prev) =>
                prev.filter((n) => n !== nation)
            );
        }
    };

    return (
        <div className="select-nations">
            {!useCL.isLoading && (
                <div className="nation-options">
                    <label className="title">Available contacts</label>
                    <div className="select-all">
                        <label>
                            <input
                                disabled={sending}
                                type="checkbox"
                                checked={useCL.selectAll}
                                onChange={onChangeSelectAll}
                            />
                            Select All
                        </label>
                    </div>
                    <div className="nation-list">
                        {useCL.nationOptions.map((nation) => (
                            <label key={nation} className="nation-item">
                                <input
                                    disabled={sending}
                                    type="checkbox"
                                    onChange={(e) =>
                                        onChangeNation(nation, e.target.checked)
                                    }
                                    checked={useCL.selectedNations.includes(
                                        nation
                                    )}
                                />
                                {nation}
                            </label>
                        ))}
                    </div>
                </div>
            )}
            <div className="selected-info">
                <div>Selected contacts {useCL.selectedContacts.length}</div>
                <div>
                    Selected not sent {useCL.selectedContactsNotSent.length}
                </div>
                {__DEV__ && (
                    <div>
                        mostRecentUidsSentPerNation:{" "}
                        {objectEntries(useCL.mostRecentUidsSentPerNation)}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SelectNations;
