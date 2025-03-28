import { Menu, MenuOptionProps, OpenMenuButton } from "radzionkit";
import { DownloadIcon } from "radzionkit/ui/icons/DownloadIcon";
import { TrashBinIcon } from "radzionkit/ui/icons/TrashBinIcon";
import styled from "styled-components";
import { useStoreActions } from "../hooks/storeHooks";
import { exportFromLocalStorage } from "../helpers/exportFromLocalStorage";
import { showDeleteHistoryDialog } from "../helpers/showDeleteHistoryDialog";
import ImportMenuOption from "./ImportMenuOption";
import { MenuOption } from "./customRadzionkit/MenuOption";

const StyledTitle = styled.span`
    font-weight: 600;
    font-size: 16px;
    color: ${({ theme }) => theme.colors.text.toCssValue()};
`;

function SettingsMenu() {
    const setUserDialog = useStoreActions((actions) => actions.userDialog.setUserDialog);
    const initiateForcedRender = useStoreActions((actions) => actions.contactList.initiateForcedRender);

    const importSendingHistory = "Import sending history";

    return (
        <Menu
            title={<StyledTitle>Settings</StyledTitle>}
            renderOpener={({ props: { ref, ...props } }) => <OpenMenuButton ref={ref} {...props} />}
            renderContent={({ view, onClose }) => {
                const options: MenuOptionProps[] = [
                    {
                        text: "Export sending history",
                        onSelect: () => {
                            exportFromLocalStorage();
                            onClose();
                        },
                        icon: <DownloadIcon />,
                    },
                    {
                        // Dummy to position ImportMenuOption in MenuList below
                        text: importSendingHistory,
                        onSelect: () => {},
                    },
                    {
                        text: "Reset all data",
                        kind: "alert",
                        onSelect: () => {
                            showDeleteHistoryDialog({ initiateForcedRender, setUserDialog });
                            onClose();
                        },
                        icon: <TrashBinIcon />,
                    },
                ];

                const MenuList = options.map((props, index) =>
                    props.text === importSendingHistory ? (
                        <ImportMenuOption key={index} view={view} onClose={onClose} />
                    ) : (
                        <MenuOption key={index} view={view} {...props} />
                    )
                );
                return <div style={{ display: "flex", flexDirection: "column" }}>{MenuList}</div>;
            }}
        />
    );
}
export default SettingsMenu;
