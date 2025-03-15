import type { ChangeEvent, FocusEvent, JSX } from "react";

export type EmailComponentProps = {
    name: string;
};

export type TEmailComponent = ({ name }: EmailComponentProps) => JSX.Element;

export type FileContent = number[];

export type ParseRangeReturnType = number[];

export type UpdatePrefEvent = ChangeEvent<HTMLSelectElement> | FocusEvent<HTMLInputElement>;

// An array of arrays of cell values, which can be anything to support custom cell data types, but by default is `string | number | boolean | undefined`.
// See /node_modules/handsontable/common.d.ts // Todo - Package handsontable is removed so related code can also be removed
export type SpreadsheetData = string[][];

export type Strings = Record<string, string>;
