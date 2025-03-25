import { UseContactListReturnType } from "../hooks/useContactList";
import LoadingContacts from "./LoadingContacts";
import { SentCounts } from "./SentCounts";
import "./SelectNations.css";

type Props = {
    useCL: UseContactListReturnType;
    isSending: boolean;
};

function SelectNations({ useCL, isSending }: Props) {
    const onChangeSelectAll = () => {
        useCL.toggleIsSelectedAllNations();
    };

    const onChangeNation = (checked: boolean, nation: string) => {
        useCL.setSelectedNations({ checked, nation });
    };

    return (
        <div className="select-nations">
            <div className="nation-options">
                <div className="title-container">
                    <label className="title">Available contacts</label>
                </div>
                {useCL.isLoading ? (
                    <div className={"nation-list"}>
                        <LoadingContacts fetchError={useCL.fetchError} />
                    </div>
                ) : (
                    <>
                        <div className={`nation-list ${isSending ? "disabled" : ""}`}>
                            <label className="nation-item">
                                <input
                                    type="checkbox"
                                    disabled={isSending}
                                    checked={useCL.isSelectedAllNations}
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
                                        onChange={(e) => onChangeNation(e.target.checked, nation)}
                                        checked={useCL.selectedNations.includes(nation)}
                                    />
                                    {nation}
                                </label>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="selected-info">
                <div>Selected contacts {useCL.selectedContacts.length}</div>
                <div>Selected not sent {useCL.selectedContactsNotSent.length}</div>
            </div>
            <SentCounts useCL={useCL} />
        </div>
    );
}

export default SelectNations;
