import { MenuView } from "radzionkit";
import { RefreshIcon } from "radzionkit/ui/icons/RefreshIcon";
import { ChangeEvent, useRef } from "react";
import { ToastContent, toast } from "react-toastify";
import { ImportStats } from "../types/typesI3C";
import { useStoreActions } from "../hooks/storeHooks";
import { importToLocalStorage } from "../helpers/importToLocalStorage";
import { MenuOption } from "./customRadzionkit/MenuOption";

type Props = {
    view: MenuView;
    onClose: () => void;
};

const ImportMenuOption = ({ view, onClose }: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initiateForcedRender = useStoreActions((actions) => actions.contactList.initiateForcedRender);

    const ImportStatsComponent: ToastContent<ImportStats> = ({ closeToast, data }) => {
        return (
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    if (closeToast) closeToast();
                }}
                style={{
                    marginRight: "0.5rem",
                    marginLeft: "24px",
                    backgroundColor: "#333",
                    padding: "0.8rem",
                    border: "1px solid #fff1",
                    borderRadius: "5px",
                }}
            >
                <p style={{ marginTop: "0" }}>Import complete!</p>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.25rem" }}>
                    <li>Contacts processed: {data?.contactsProcessed}</li>
                    <li>Contacts deleted: {data?.contactsDeleted}</li>
                    <li>Log entries processed: {data?.logsProcessed}</li>
                </ul>
            </div>
        );
    };

    const onClickDocumentBody = () => {
        toast.dismiss();
    };

    const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const importStats = await importToLocalStorage(file);

            // Add event listener with setTimeout to avoid immediate triggering
            setTimeout(() => {
                document.body.addEventListener("click", onClickDocumentBody);
            }, 300);

            initiateForcedRender();
            toast.dark(ImportStatsComponent as ToastContent, {
                data: importStats,
                autoClose: false,
            });
        } catch (error) {
            console.error(error);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            document.body.removeEventListener("click", onClickDocumentBody);
            onClose();
        }
    };

    const onSelectMenuOption = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <input type="file" ref={fileInputRef} accept=".zip" onChange={handleImport} style={{ display: "none" }} />
            <div>
                <MenuOption
                    view={view}
                    text={"Import sending history"}
                    onSelect={onSelectMenuOption}
                    icon={<RefreshIcon />}
                />
            </div>
        </div>
    );
};

export default ImportMenuOption;
