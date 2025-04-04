import { MenuView, Text } from "radzionkit";
import { RefreshIcon } from "radzionkit/ui/icons/RefreshIcon";
import { ChangeEvent, useRef } from "react";
import { ToastContentProps, toast } from "react-toastify";
import { CSSProperties } from "styled-components";
import { ImportStats } from "../types/typesI3C";
import { useStoreActions } from "../hooks/storeHooks";
import { importToLocalStorage } from "../helpers/importToLocalStorage";
import { toastOptions } from "../css/styles";
import { MenuOption } from "./customRadzionkit/MenuOption";

type Props = {
    view: MenuView;
    onClose: () => void;
};

const MenuOptionImport = ({ view, onClose }: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initiateForcedRender = useStoreActions((actions) => actions.contactList.initiateForcedRender);

    const ImportStatsComponent = ({ closeToast, data }: ToastContentProps<ImportStats | Error>) => {
        if (data instanceof Error) {
            const messages = data.message.split("\n");

            return (
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {messages.map((message, index) => (
                        <Text key={index} style={{ margin: "0.5rem" }} weight="bold">
                            {message}
                        </Text>
                    ))}
                </div>
            );
        }

        const liStyles: CSSProperties = {
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
        };

        return (
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    if (closeToast) closeToast();
                }}
                style={{
                    marginRight: "1rem",
                    marginLeft: "1rem",
                    padding: "1rem",
                    width: "auto",
                }}
            >
                <Text size={20} style={{ marginTop: "0", marginBottom: "1.5rem" }}>
                    Import completed!
                </Text>
                <ul>
                    <li style={liStyles}>
                        <span>Contacts processed:</span>
                        <pre>{"  "}</pre>
                        <span>{data?.contactsProcessed}</span>
                    </li>
                    <li style={liStyles}>
                        <span>Log entries processed:</span>
                        <pre>{"  "}</pre>
                        <span>{data?.logsProcessed}</span>
                    </li>
                    <li style={liStyles}>
                        <span>Moved to deleted:</span>
                        <pre>{"  "}</pre>
                        <span>{data?.contactsDeleted}</span>
                    </li>
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
            const importStatsOrError = await importToLocalStorage(file);

            // Add event listener with setTimeout to avoid immediate triggering
            setTimeout(() => {
                document.body.addEventListener("click", onClickDocumentBody);
            }, 300);

            if (importStatsOrError instanceof Error) {
                toast(ImportStatsComponent, {
                    ...toastOptions,
                    data: importStatsOrError,
                    type: "error",
                });
                throw importStatsOrError;
            }

            initiateForcedRender();
            toast(ImportStatsComponent, {
                ...toastOptions,
                data: importStatsOrError,
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
        onClose();
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

export default MenuOptionImport;
