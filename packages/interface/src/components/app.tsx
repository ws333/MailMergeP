import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { useStoreActions, useStoreState } from "../hooks/storeHooks";
import EmailSender from "./EmailSender";
import IFO from "./IFO";
import SettingsMenu from "./SettingsMenu";
import "./App.css";

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
        <div className="scrollable">
            <header className="header">
                <div className="IFO-and-settings">
                    <IFO isHovering={false} />
                    <SettingsMenu />
                </div>
            </header>
            <EmailSender />
            <ToastContainer />
        </div>
    );
}
