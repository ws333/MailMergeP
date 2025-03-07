import Papa from "papaparse";

type Config = Parameters<typeof Papa.parse>[1];

const defaultConfig: Config = {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
};

export function csvParse<T>(data: string, config: Config = defaultConfig) {
    return Papa.parse<T>(data, config);
}
