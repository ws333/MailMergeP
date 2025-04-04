import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { useStoreActions, useStoreState } from "../hooks/storeHooks";
import EmailSender from "./EmailSender";
import IFO from "./IFO";
import SettingsMenu from "./SettingsMenu";
import { SendDialog } from "./send-dialog";
import "./app.css";

export default function App() {
    const initialise = useStoreActions((actions) => actions.initialise);

    useEffect(() => {
        initialise();
    }, [initialise]);

    const prefs = useStoreState((state) => state.prefs);
    const parseSpreadsheet = useStoreActions((actions) => actions.parseSpreadsheet);
    useEffect(() => {
        parseSpreadsheet();
    }, [prefs.fileName, parseSpreadsheet]);

    return (
        <div className="scrollable-container">
            <header className="panel-section panel-section-header">
                <div className="icon-section-header">
                    <IFO isHovering={false} />
                    <SettingsMenu />
                </div>
            </header>
            <EmailSender />
            <SendDialog />
            <ToastContainer />
        </div>
    );
}
