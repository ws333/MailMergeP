import { Template } from "nunjucks";
import { ChangeEvent, FocusEvent } from "react";

export type FileContent = number[];

// Type Template in @types/nunjucks package does not include all possible properties javascript can add to the Template object
// See 'var Template' in node_modules/nunjucks/browser/nunjucks.js if you want to add additional properties.
export interface NunjucksTemplate extends Template {
    tmplStr?: UnknownRecord | string;
    tmplProps?: UnknownRecord;
}

// This type can probably be narrowed down further to number[] if the function parseRange is refactored.
// Used a quick fix to remove type number and added an assertion since the return value is used as a one dimensional array.
export type ParseRangeReturnType = (number | number[])[];

// An array of cell values, which can be anything to support custom cell data types, but by default is `string | number | boolean | undefined`.
// See /node_modules/handsontable/common.d.ts
export type SpreadsheetData = string[][];

export type Strings = Record<string, string>;

export type UnknownRecord = Record<PropertyKey, unknown>;

export type PrefsOrEvent =
    | string
    | ChangeEvent<HTMLSelectElement>
    | FocusEvent<HTMLInputElement>;
