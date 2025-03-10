import classNames from "classnames";
import { type ChangeEvent, useState } from "react";
import { useStoreActions, useStoreState } from "../hooks/storeHooks.ts";
import type { Prefs } from "../types/modelTypes.ts";
import type { UpdatePrefEvent } from "../types/types.ts";
import { parseRange } from "../utils/parseRange.ts";
import { ClearableInput } from "./common.tsx";

function SettingsTab() {
    const prefs = useStoreState((state) => state.prefs);
    const strings = useStoreState((state) => state.locale.strings);
    const updatePref = useStoreActions((actions) => actions.prefs.updatePref);
    const generatePrefUpdate = (pref: keyof Prefs) => {
        return (e: UpdatePrefEvent) => {
            if (e.currentTarget) {
                updatePref({ [pref]: e.currentTarget.value });
            }
        };
    };

    // Use local state for delay value to avoid cursor jumping to end of input on changes
    const [delayValue, setDelayValue] = useState(prefs.delay);
    function onChangeDelayInput(e: ChangeEvent<HTMLInputElement>) {
        const value = e.currentTarget.value;
        const numberValue = Number(value);
        setDelayValue(numberValue);
        // To remove any leading zeros in the delay input
        e.currentTarget.value = numberValue.toString();
    }

    // A range is invalid if it is non-empty and parseRange parses it to an empty array
    const rangeValid =
        prefs.range?.trim().length === 0 ||
        parseRange(prefs.range || "").length > 0;

    return (
        <div className="browser-style settings-panel">
            <label htmlFor="pref-sendmode" className="settings-label">
                {strings.sendMode}
            </label>
            <select
                className="browser-style settings-input"
                id="pref-sendmode"
                value={prefs.sendmode}
                onChange={generatePrefUpdate("sendmode")}
                title={strings.sendModeDesc}
            >
                {/*
                // XXX Cannot be used until https://bugzilla.mozilla.org/show_bug.cgi?id=1747456 is fixed
                <option value="draft">{strings.sendModeDraft}</option>
                */}
                <option value="now">{strings.sendModeNow}</option>
                <option value="later">{strings.sendModeLater}</option>
            </select>

            <label htmlFor="pref-delay" className="settings-label">
                {strings.messageDelay}
            </label>
            <input
                id="pref-delay"
                type="number"
                value={delayValue}
                onChange={onChangeDelayInput}
                // Update global state when delay input loses focus
                onBlur={generatePrefUpdate("delay")}
                className="browser-style settings-input"
                title={strings.messageDelayDesc}
            />

            <label htmlFor="pref-range" className="settings-label">
                {strings.sendMessageRange}
            </label>
            <ClearableInput
                value={prefs.range || ""}
                id="pref-range"
                className={classNames({
                    invalid: !rangeValid,
                    "settings-input": true,
                })}
                onChange={generatePrefUpdate("range")}
                placeholder="3,4,9-14,22-"
                title={strings.sendMessageRangeDesc}
            />

            <label htmlFor="pref-parser" className="settings-label">
                {strings.parser}
            </label>
            <select
                className="browser-style settings-input"
                id="pref-parser"
                value={prefs.parser}
                onChange={generatePrefUpdate("parser")}
                title={strings.parserDesc}
            >
                <option value="nunjucks">Nunjucks</option>
                <option value="legacy">{strings.parserLegacy}</option>
            </select>
        </div>
    );
}

export { SettingsTab };
