import { useState } from "react";
import { useStoreActions } from "../hooks/storeHooks";

function InputUrl() {
    const [value, setValue] = useState(
        "https://iase.one/contact_lists/EU/max800/EU_max800_contacts_001-800.csv"
    );

    // const prefs = useStoreState((state) => state.prefs);
    const updatePref = useStoreActions((actions) => actions.prefs.updatePref);
    const updateSpreadsheetHasManuallyUpdated = useStoreActions(
        (actions) => actions.data.updateSpreadsheetHasManuallyUpdated
    );

    function onChangeLocal(e: React.ChangeEvent<HTMLInputElement>) {
        setValue(e.target.value);
    }

    function onBlur(e: React.FocusEvent<HTMLInputElement>) {
        if (e && e.target) {
            const url = e.target.value;

            if (!isValidUrl(url)) return;

            // Update global state
            urlChanged(e.target.value);
        }
    }

    async function urlChanged(url: string) {
        // Setting a new filename to trigger useEffect that executes parseSpreadsheet
        // Create an prefs.url later...
        const name = `url_${Date.now()}`;
        const csv = await fetchWebpage(url);
        const dat = new TextEncoder().encode(csv);

        // because this data will be saved as JSON, we have to convert
        // it to a regular array
        let csvAsArray = Array.from(dat);
        updatePref({ fileName: name, fileContents: csvAsArray });
        // If we've loaded a file, we want to forget any manual changes
        // we made to the spreadsheet data
        updateSpreadsheetHasManuallyUpdated(false);
    }

    return (
        <div>
            <input
                placeholder="Type url to contact list..."
                className={"form-control"}
                type="text"
                value={value}
                onChange={onChangeLocal}
                onBlur={onBlur}
            />
        </div>
    );
}

export { InputUrl };

export async function fetchWebpage(url: string) {
    // TODO: Add retry
    const response = await fetch(url, {
        // mode: 'no-cors',
        // redirect: 'follow',
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
    });
    if (!response.ok) {
        console.debug("*Debug* -> fetchWebpage -> response:", response);
        throw new Error(`Failed to fetch the url: ${url}`);
    }
    return response.text();
}

export const isValidUrl = (url: string) => {
    const urlPattern = new RegExp(
        "^(https?:\\/\\/)?" + // validate protocol
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
            "(\\#[-a-z\\d_]*)?$",
        "i"
    ); // validate fragment locator
    return !!urlPattern.test(url);
};
