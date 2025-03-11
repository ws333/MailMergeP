import { useEffect } from "react";
import { useStoreActions, useStoreState } from "../hooks/storeHooks";
import { SendDialog } from "./send-dialog";
import icon from "../../../thunderbird-extension/public/skin/icon64.png";
import EmailSender from "./EmailSender";
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
                    <img
                        className="mailmergeiase-icon"
                        src={icon}
                        alt="Interstellar Alliance Social Experiment Step 3 icon"
                    />
                </div>
            </header>
            <EmailSender />
            <SendDialog />
        </div>
    );
}
