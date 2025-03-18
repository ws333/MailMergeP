import { EditIcon, Menu, MenuOption, MenuOptionProps, MoonIcon, OpenMenuButton, TrashBinIcon } from "radzion-ui";
import { cleanupLocalStorage } from "../helpers/cleanupLocalStorage";

function SettingsMenu() {
    return (
        <Menu
            title="Settings"
            renderOpener={({ props: { ref, ...props } }) => <OpenMenuButton ref={ref} {...props} />}
            renderContent={({ view, onClose }) => {
                const options: MenuOptionProps[] = [
                    {
                        text: "View stats",
                        onSelect: () => {
                            onClose();
                        },
                        icon: <EditIcon />,
                    },
                    {
                        text: "Reset stats",
                        onSelect: () => {
                            onClose();
                        },
                        icon: <MoonIcon />,
                    },
                    {
                        text: "Reset all data",
                        kind: "alert",
                        onSelect: () => {
                            cleanupLocalStorage();
                            console.log("Sending data has been reset!");
                            onClose();
                        },
                        icon: <TrashBinIcon />,
                    },
                ];

                return options.map((props, index) => <MenuOption view={view} key={index} {...props} />);
            }}
        />
    );
}
export default SettingsMenu;
