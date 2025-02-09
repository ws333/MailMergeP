import jsCharDet from "jschardet";
import nunjucks from "nunjucks";
import * as XLSX from "xlsx";
import { objectEntries } from "./helpers/objectHelpers";
import { emptySpreadsheetData } from "./model";
import { Email } from "./types/modelTypes";
import { FileContent, NunjucksTemplate, SpreadsheetData } from "./types/types";

function zip<T, U>(a: Array<T | undefined>, b: Array<U>) {
    // If `a` has a blank slot (e.g. a == [1,,2]), then
    // `.map` will skip it over. We don't want that, so detect
    // a blank slot and create a dense array.
    // https://stackoverflow.com/questions/36622064/check-the-array-has-empty-element-or-not/36622150
    if (a.includes(undefined)) {
        a = Array.from(a);
    }
    return a.map(function (_, i) {
        return [a[i], b[i]];
    });
}

// parse an array containing raw bytes from a spreadsheet of some
// format. XLSX will auto-detect the format
function parseSpreadsheet(data: FileContent): SpreadsheetData {
    if (data.length === 0) {
        return emptySpreadsheetData;
    }

    try {
        // use xlsx.js to parse the spreadsheet data
        let parsed = XLSX.read(data.slice(), {
            type: "array",
            // Todo: According to the docs dateNF should be a string, e.g. 'dd/mm/yyyy' See https://github.com/SheetJS/sheetjs/issues/718
            //       But changing to date format string caused issues with non-english charaters. Keeping it as boolean for now.
            // @ts-ignore
            dateNF: true, 
            cellDates: true,
        });
        let sheet = parsed.Sheets[parsed.SheetNames[0]];
        let sheetArray = XLSX.utils.sheet_to_json<string[]>(sheet, {
            header: 1,
        });

        return sheetArray;
    } catch (e) {
        console.warn("Error when parsing spreading; using fallback", e);
    }
    // CSV parsing may fail for different file encodings.
    // Use jsCharDet to attempt to detect the encoding and try to parse the data again.
    try {
        const dataArray = new Uint8Array(data);
        const rawString = String.fromCharCode.apply(
            null,
            Array.from(dataArray)
        );
        const detected = jsCharDet.detect(rawString);
        const targetEncoding =
            (detected.confidence > 0.9 && detected.encoding) || "utf-8";
        console.log(
            "Detected encoding",
            detected,
            "Trying encoding",
            targetEncoding
        );

        let parsedStr = new TextDecoder(targetEncoding).decode(dataArray);
        let parsed = XLSX.read(parsedStr, { type: "string" });
        let sheet = parsed.Sheets[parsed.SheetNames[0]];
        let sheetArray = XLSX.utils.sheet_to_json<string[]>(sheet, {
            header: 1,
        });

        return sheetArray;
    } catch (e) {
        console.warn("Error when parsing spreading as unicode", e);
    }

    // CSV parsing may fail when trying to process date cells, so we fall
    // back to not processing the date cells.
    try {
        let parsed = XLSX.read(data, {
            type: "array",
        });
        let sheet = parsed.Sheets[parsed.SheetNames[0]];
        let sheetArray = XLSX.utils.sheet_to_json<string[]>(sheet, {
            header: 1,
        });

        return sheetArray;
    } catch (e) {
        console.warn("Error when parsing spreading; no fallback available", e);
    }

    // Todo:
    // Test how this error msg works by throwing and replace it with another solution that don't add an inconvenient return type.
    // Does not seem to execute ever, I opened a png file renamed to xls and it was parsed and the HotTable filled with gibberish.
    // But got the following in the console:
    //
    // Error when parsing spreading; using fallback Error: PNG Image File is not a spreadsheet
    // at kf (xlsx.mjs:27263:72)
    // at k8e (utils.ts:35:22)
    // at Object.fn (model.ts:116:34)
    // at Object.thunkHandler (index.js:771:16)
    // at index.js:802:18
    // at index.js:16:18
    // at Object.dispatch (index.js:922:22)
    // at Object.dispatch (page.bundle.js:6:7424)
    // at r (index.js:801:21)
    // at app.tsx:35:26

    // return [
    //     ["!! Error parsing spreadsheet !!"],
    //     [
    //         "Try saving your spreadsheet in a different format (e.g. .xlsx or .ods)",
    //     ],
    // ];
    return emptySpreadsheetData;
}

type Subs = Record<string, string>;
// Fill every item in template with data from spreadsheet
function fillTemplate(
    template: Email,
    spreadsheet: SpreadsheetData,
    method = "nunjucks"
) {
    // create an array of substitutions
    let [header, ...rows] = spreadsheet;
    let subsArray = rows
        .filter((row) => {
            // no blank rows
            return !row.every((x) => !x);
        })
        .map((row) => {
            let subs: Subs = {};
            for (let [key, val] of zip<string, any>(header, row)) {
                // skip over non-string (likely null) headers
                if (typeof key !== "string") {
                    continue;
                }
                if (typeof val === "number") {
                    val = String(val);
                }
                if (val instanceof Date) {
                    // Todo: Will this ever be true? Row is defined as string now in TS, but not sure what happens during runtime.
                    val = val.toLocaleDateString();
                }
                // assume non-string values are just ""
                if (typeof val !== "string") {
                    val = "";
                }

                key = key.trim();
                val = val.trim();
                if (!key) {
                    continue;
                }
                subs[key] = val;
            }
            return subs;
        });

    switch (method) {
        case "legacy":
            return fillTemplateLegacy(template, subsArray);
        case "nunjucks":
        default:
            return fillTemplateNunjucks(template, subsArray);
    }
}

function fillTemplateNunjucks(template: Email, subsArray: Subs[]) {
    let ret: Email[] = [];
    let compiled: Partial<Record<keyof Email, NunjucksTemplate>> = {};
    // If auto-escaping is turned on, then emails with `<...>` will become `&lt;...&gt;`
    const env = nunjucks.configure({ autoescape: false });

    // pre-compile the template for efficiency
    objectEntries(template).forEach(([key, val]) => {
        try {
            compiled[key] = nunjucks.compile(val, env);
        } catch (e) {
            console.warn("Failed to compile template", { [key]: val }, e);
        }
    });

    // populate template for each row
    for (let subs of subsArray) {
        let subbed: Email = {};
        objectEntries(compiled).forEach(([key, val]) => {
            try {
                subbed[key] = val.render(subs);
            } catch (e) {
                console.warn(
                    "Failed to render template '",
                    val.tmplStr,
                    "' with substitutions",
                    subs
                );
                subbed[key] = val.tmplStr || "";
            }
        }),
            ret.push(subbed);
    }

    return ret;
}

function fillTemplateLegacy(template: Email, subsArray: Subs[]) {
    let ret = [];

    // recursively apply substitutions
    function substitute(string: string, object: Record<string, string>) {
        //var objPattern = new RegExp("(?:[{][{]([^|{}]*)[}][}])", "g");
        //var objPattern = new RegExp("(?:[{][{]([^|{}]*)[}][}]|[{][{]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[}][}])", "g");
        //var objPattern = new RegExp("(?:[{][{]([^|{}]*)[}][}]|[{][{]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[}][}]|[{][{]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[}][}])", "g");
        //var objPattern = new RegExp("(?:[{][{]([^|{}]*)[}][}]|[{][{]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[}][}]|[{][{]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[}][}]|[{][{]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[}][}])", "g");
        var objPattern = new RegExp(
            "(?:[{][{]([^|{}]*)[}][}]|[{][{]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[}][}]|[{][{]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[}][}]|[{][{]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[|]([^|{}]*)[}][}]|[{][{]([^{}]*)[}][}])",
            "g"
        );

        var arrMatches = objPattern.exec(string);
        if (!arrMatches) {
            return string;
        }

        /* workaround start */
        for (var i = 1; i < arrMatches.length; i++) {
            if (!arrMatches[i]) {
                continue;
            }
            arrMatches[i] = arrMatches[i].replace(
                new RegExp("\n(  )*", "g"),
                " "
            );
        }
        /* workaround end */

        if (object) {
            if (arrMatches[1]) {
                /* {{name}} */
                string = string.replace(
                    arrMatches[0],
                    object[arrMatches[1]] || ""
                );
                return substitute(string, object);
            }

            if (arrMatches[2]) {
                /* {{name|if|then}} */
                string =
                    (object[arrMatches[2]] || "") === arrMatches[3]
                        ? string.replace(arrMatches[0], arrMatches[4])
                        : string.replace(arrMatches[0], "");
                return substitute(string, object);
            }

            if (arrMatches[5]) {
                /* {{name|if|then|else}} */
                string =
                    (object[arrMatches[5]] || "") === arrMatches[6]
                        ? string.replace(arrMatches[0], arrMatches[7])
                        : string.replace(arrMatches[0], arrMatches[8]);
                return substitute(string, object);
            }

            if (arrMatches[9]) {
                if (arrMatches[10] === "*") {
                    /* {{name|*|if|then|else}} */
                    string = (object[arrMatches[9]] || "").match(arrMatches[11])
                        ? string.replace(arrMatches[0], arrMatches[12])
                        : string.replace(arrMatches[0], arrMatches[13]);
                    return substitute(string, object);
                }

                if (arrMatches[10] === "^") {
                    /* {{name|^|if|then|else}} */
                    string = (object[arrMatches[9]] || "").match(
                        "^" + arrMatches[11]
                    )
                        ? string.replace(arrMatches[0], arrMatches[12])
                        : string.replace(arrMatches[0], arrMatches[13]);
                    return substitute(string, object);
                }

                if (arrMatches[10] === "$") {
                    /* {{name|$|if|then|else}} */
                    string = (object[arrMatches[9]] || "").match(
                        arrMatches[11] + "$"
                    )
                        ? string.replace(arrMatches[0], arrMatches[12])
                        : string.replace(arrMatches[0], arrMatches[13]);
                    return substitute(string, object);
                }
            }

            if (arrMatches[9]) {
                if (arrMatches[10] === "==") {
                    /* {{name|==|if|then|else}} */
                    string =
                        parseFloat(
                            (object[arrMatches[9]] || "").replace(",", ".")
                        ) === parseFloat(arrMatches[11].replace(",", "."))
                            ? string.replace(arrMatches[0], arrMatches[12])
                            : string.replace(arrMatches[0], arrMatches[13]);
                    return substitute(string, object);
                }

                if (arrMatches[10] === ">" || arrMatches[10] === "&gt;") {
                    /* {{name|>|if|then|else}} */
                    string =
                        parseFloat(
                            (object[arrMatches[9]] || "").replace(",", ".")
                        ) > parseFloat(arrMatches[11].replace(",", "."))
                            ? string.replace(arrMatches[0], arrMatches[12])
                            : string.replace(arrMatches[0], arrMatches[13]);
                    return substitute(string, object);
                }

                if (arrMatches[10] === ">=" || arrMatches[10] === "&gt;=") {
                    /* {{name|>=|if|then|else}} */
                    string =
                        parseFloat(
                            (object[arrMatches[9]] || "").replace(",", ".")
                        ) >= parseFloat(arrMatches[11].replace(",", "."))
                            ? string.replace(arrMatches[0], arrMatches[12])
                            : string.replace(arrMatches[0], arrMatches[13]);
                    return substitute(string, object);
                }

                if (arrMatches[10] === "<" || arrMatches[10] === "&lt;") {
                    /* {{name|<|if|then|else}} */
                    string =
                        parseFloat(
                            (object[arrMatches[9]] || "").replace(",", ".")
                        ) < parseFloat(arrMatches[11].replace(",", "."))
                            ? string.replace(arrMatches[0], arrMatches[12])
                            : string.replace(arrMatches[0], arrMatches[13]);
                    return substitute(string, object);
                }

                if (arrMatches[10] === "<=" || arrMatches[10] === "&lt;=") {
                    /* {{name|<=|if|then|else}} */
                    string =
                        parseFloat(
                            (object[arrMatches[9]] || "").replace(",", ".")
                        ) <= parseFloat(arrMatches[11].replace(",", "."))
                            ? string.replace(arrMatches[0], arrMatches[12])
                            : string.replace(arrMatches[0], arrMatches[13]);
                    return substitute(string, object);
                }
            }
        }

        string = string.replace(arrMatches[0], "");
        return substitute(string, object);
    }

    // populate template for each row
    for (let subs of subsArray) {
        let subbed: Email = {};
        objectEntries(template).forEach(([key, val]) => {
            try {
                subbed[key] = substitute(val, subs);
            } catch (e) {
                console.warn(
                    "Failed to render template",
                    val,
                    "with substitutions",
                    subs
                );
                subbed[key] = val;
            }
        });

        ret.push(subbed);
    }

    return ret;
}

/*
 * Parse a string range. Return an array containing
 * all parsed values. E.g. "3,4,6-9" will return [3,4,6,7,8,9].
 *
 * An incomplete range will assume `minVal` and `maxVal` are to
 * be used. E.g., "3-" == "3-<maxVal>".
 *
 * Based off of https://github.com/euank/node-parse-numeric-range
 */
function parseRange(range: string, minVal = 0, maxVal = 100) {
    function parsePart(part: string) {
        // just a number
        if (/^-?\d+$/.test(part)) {
            return parseInt(part, 10);
        }
        var m;
        // 1-5 or 1..5 (equivilant) or 1...5 (doesn't include 5)
        if (
            (m = part.match(/^(-?\d*)(-|\.\.\.?|\u2025|\u2026|\u22EF)(-?\d*)$/))
        ) {
            var lhs = m[1] || minVal;
            var sep = m[2];
            var rhs = m[3] || maxVal;
            if (lhs && rhs) {
                lhs = parseInt(lhs.toString());
                rhs = parseInt(rhs.toString());
                var res = [];
                var incr = lhs < rhs ? 1 : -1;

                // Make it inclusive by moving the right 'stop-point' away by one.
                if (sep === "-" || sep === ".." || sep === "\u2025") {
                    rhs += incr;
                }

                for (var i = lhs; i !== rhs; i += incr) {
                    res.push(i);
                }
                return res;
            }
        }
        return [];
    }
    var parts = range.split(",");

    var toFlatten = parts.map(function (el) {
        return parsePart(el.trim());
    });

    // reduce can't handle single element arrays
    if (toFlatten.length === 0) return [];
    if (toFlatten.length === 1) {
        if (Array.isArray(toFlatten[0])) return toFlatten[0];
        return toFlatten;
    }

    const flattened = toFlatten.reduce(function (lhs, rhs) {
        if (!Array.isArray(lhs)) lhs = [lhs];
        if (!Array.isArray(rhs)) rhs = [rhs];
        return lhs.concat(rhs);
    });

    // Added to avoid returning just a number since using array functions on the return value.
    // Todo:
    // A better solution would be to modify the logic to fix the original return type which was number | (number | number[])[]
    // It seems like the return type can be narrowed down to number[] based on the outputs when testing dfferent ranges.
    if (Array.isArray(flattened)) {
        return flattened;
    } else {
        return [flattened];
    }
}

/**
 * Returns a promise that delays for number of milliseconds
 *
 * @param {number} duration
 * @param {function} abortFunction - called repeatedly to test if the promise should be aborted
 * @returns {Promise}
 */
function delay(duration: number, abortFunction = () => false) {
    // ms to poll before testing if we should abort
    const POLLING_DURATION = 100;

    return new Promise<void>((resolve) => {
        const startTime = Date.now();
        const intervalHandle = window.setInterval(function () {
            if (Date.now() - startTime >= duration || abortFunction()) {
                resolve();
                window.clearTimeout(intervalHandle);
            }
        }, POLLING_DURATION);
    });
}

/**
 * Returns an "HH:mm:ss" formatted string
 *
 * @param {number} time
 * @returns {string} - formatted as "HH:mm:ss"
 */
function formatTime(time: number) {
    function pad(x: number) {
        return ("" + x).padStart(2, "0");
    }

    let seconds = Math.floor(time / 1000) % 60;
    let minutes = Math.floor(time / (60 * 1000)) % 60;
    let hours = Math.floor(time / (60 * 60 * 1000));

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export { delay, fillTemplate, formatTime, parseRange, parseSpreadsheet };
