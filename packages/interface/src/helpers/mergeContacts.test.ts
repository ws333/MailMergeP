import { describe, expect, it } from "vitest";
import { ContactI3C, ImportData } from "../types/typesI3C";
import { ContactState, deleteContact, mergeContacts } from "./mergeContacts";

describe("mergeContacts", () => {
    const emptyState: ContactState = { active: [], deleted: [], lastImportExportDate: 0 };

    const createImport = (
        activeContacts: Partial<ImportData["contacts"]["active"][0]>[],
        deletedContacts: Partial<ImportData["contacts"]["deleted"][0]>[],
        exportDate: number,
        lastImportExportDate: number = exportDate - 1000
    ): ImportData => ({
        contacts: {
            active: activeContacts.map((c) => ({
                uid: c.uid!,
                sentDate: c.sentDate!,
                sentCount: c.sentCount!,
                customFrontend01: c.customFrontend01 || "",
                customFrontend02: c.customFrontend02 || "",
            })),
            deleted: deletedContacts.map((c) => ({
                uid: c.uid!,
                sentDate: c.sentDate!,
                sentCount: c.sentCount!,
                deletionDate: c.deletionDate!,
                customFrontend01: c.customFrontend01 || "",
                customFrontend02: c.customFrontend02 || "",
            })),
        },
        metadata: {
            exportDate,
            lastImportExportDate,
        },
    });

    const expectContactMatch = (actual: ContactI3C, expected: Partial<ContactI3C>) => {
        expect({
            ...actual,
            nation: undefined,
            institution: undefined,
            subGroup: undefined,
            name: undefined,
            email: undefined,
            updatedDate: undefined,
            customBackend01: undefined,
            customBackend02: undefined,
        }).toMatchObject({
            ...expected,
            nation: undefined,
            institution: undefined,
            subGroup: undefined,
            name: undefined,
            email: undefined,
            updatedDate: undefined,
            customBackend01: undefined,
            customBackend02: undefined,
        });
    };

    it("handles clean import (new contact added to deleted)", () => {
        const importData = createImport(
            [
                {
                    uid: 1672531200000,
                    sentCount: 3,
                    sentDate: 1677600000000,
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            [],
            1677590000000
        );
        const [result, stats] = mergeContacts(emptyState, importData);
        expect(result.active).toEqual([]);
        expect(result.deleted.length).toBe(1);
        expectContactMatch(result.deleted[0], {
            uid: 1672531200000,
            sentCount: 3,
            sentDate: 1677600000000,
            customFrontend01: "CF1",
            customFrontend02: "CF2",
            deletionDate: 1677590000000,
        });
        expect(result.lastImportExportDate).toBe(1677590000000);
        expect(stats).toEqual({ contactsDeleted: 1, contactsProcessed: 0 });
    });

    it("handles send after export", () => {
        const initialState: ContactState = {
            active: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 4,
                    sentDate: 1677686400000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            deleted: [],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport(
            [
                {
                    uid: 1672531200000,
                    sentCount: 3,
                    sentDate: 1677600000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            [],
            1677590000000 // Fixed from 167759ilih0000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expectContactMatch(result.active[0], {
            sentCount: 4,
            sentDate: 1677686400000,
            customFrontend01: "CF1",
            customFrontend02: "CF2",
            deletionDate: 0,
        });
        expect(result.lastImportExportDate).toBe(1677590000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 1 });
    });

    it("handles send before import", () => {
        const initialState: ContactState = {
            active: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 2,
                    sentDate: 1677686400000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            deleted: [],
            lastImportExportDate: 1677580000000,
        };
        const importData = createImport(
            [
                {
                    uid: 1672531200000,
                    sentCount: 3,
                    sentDate: 1677600000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            [],
            1677590000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expectContactMatch(result.active[0], {
            sentCount: 5,
            sentDate: 1677686400000,
            customFrontend01: "CF1-updated",
            customFrontend02: "CF2-updated",
            deletionDate: 0,
        });
        expect(result.lastImportExportDate).toBe(1677590000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 1 });
    });

    it("handles multiple imports", () => {
        const initialState: ContactState = {
            active: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 3,
                    sentDate: 1677600000000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            deleted: [],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport(
            [
                {
                    uid: 1672531200000,
                    sentCount: 3,
                    sentDate: 1677600000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            [],
            1677590000000
        );
        const [result1, stats1] = mergeContacts(initialState, importData);
        const [result2, stats2] = mergeContacts(result1, importData);
        expectContactMatch(result2.active[0], {
            sentCount: 3,
            sentDate: 1677600000000,
            customFrontend01: "CF1",
            customFrontend02: "CF2",
            deletionDate: 0,
        });
        expect(result2.lastImportExportDate).toBe(1677590000000);
        expect(stats1).toEqual({ contactsDeleted: 0, contactsProcessed: 1 });
        expect(stats2).toEqual({ contactsDeleted: 0, contactsProcessed: 1 });
    });

    it("handles deleted contact with no new sends", () => {
        const initialState = deleteContact(
            {
                active: [
                    {
                        uid: 1672531200000,
                        nation: "US",
                        institution: "TestInst",
                        subGroup: "TestGroup",
                        name: "Test",
                        email: "test@example.com",
                        sentCount: 3,
                        sentDate: 1677600000000,
                        updatedDate: "2023-01-01T00:00:00Z",
                        deletionDate: 0,
                        customBackend01: "CB1",
                        customBackend02: "CB2",
                        customFrontend01: "CF1",
                        customFrontend02: "CF2",
                    },
                ],
                deleted: [],
                lastImportExportDate: 1677590000000,
            },
            1672531200000,
            1677610000000
        );
        const importData = createImport(
            [],
            [
                {
                    uid: 1672531200000,
                    sentCount: 3,
                    sentDate: 1677600000000,
                    deletionDate: 1677610000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            1677590000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expect(result.active).toEqual([]);
        expectContactMatch(result.deleted[0], {
            sentCount: 3,
            sentDate: 1677600000000,
            deletionDate: 1677610000000,
            customFrontend01: "CF1",
            customFrontend02: "CF2",
        });
        expect(result.lastImportExportDate).toBe(1677590000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 0 });
    });

    it("handles new sends for deleted contact", () => {
        const initialState = deleteContact(
            {
                active: [
                    {
                        uid: 1672531200000,
                        nation: "US",
                        institution: "TestInst",
                        subGroup: "TestGroup",
                        name: "Test",
                        email: "test@example.com",
                        sentCount: 3,
                        sentDate: 1677600000000,
                        updatedDate: "2023-01-01T00:00:00Z",
                        deletionDate: 0,
                        customBackend01: "CB1",
                        customBackend02: "CB2",
                        customFrontend01: "CF1",
                        customFrontend02: "CF2",
                    },
                ],
                deleted: [],
                lastImportExportDate: 1677590000000,
            },
            1672531200000,
            1677610000000
        );
        const importData = createImport(
            [],
            [
                {
                    uid: 1672531200000,
                    sentCount: 5,
                    sentDate: 1677686400000,
                    deletionDate: 1677610000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            1677670000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expect(result.active).toEqual([]);
        expectContactMatch(result.deleted[0], {
            sentCount: 5,
            sentDate: 1677686400000,
            deletionDate: 1677610000000,
            customFrontend01: "CF1-updated",
            customFrontend02: "CF2-updated",
        });
        expect(result.lastImportExportDate).toBe(1677670000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 0 });
    });

    it("handles sends and deletions after export", () => {
        const initialState: ContactState = {
            active: [],
            deleted: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 4,
                    sentDate: 1677686400000,
                    deletionDate: 1677610000000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport(
            [],
            [
                {
                    uid: 1672531200000,
                    sentCount: 3,
                    sentDate: 1677600000000,
                    deletionDate: 1677610000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            1677590000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expect(result.active).toEqual([]);
        expectContactMatch(result.deleted[0], {
            sentCount: 4,
            sentDate: 1677686400000,
            deletionDate: 1677610000000,
            customFrontend01: "CF1",
            customFrontend02: "CF2",
        });
        expect(result.lastImportExportDate).toBe(1677590000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 0 });
    });

    it("handles older import for active contact (no change)", () => {
        const initialState: ContactState = {
            active: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 4,
                    sentDate: 1677686400000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            deleted: [],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport(
            [
                {
                    uid: 1672531200000,
                    sentCount: 3,
                    sentDate: 1677600000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            [],
            1677580000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expectContactMatch(result.active[0], {
            sentCount: 4,
            sentDate: 1677686400000,
            customFrontend01: "CF1",
            customFrontend02: "CF2",
            deletionDate: 0,
        });
        expect(result.lastImportExportDate).toBe(1677590000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 1 });
    });

    it("handles older import for deleted contact (no change)", () => {
        const initialState: ContactState = {
            active: [],
            deleted: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 4,
                    sentDate: 1677686400000,
                    deletionDate: 1677610000000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport(
            [],
            [
                {
                    uid: 1672531200000,
                    sentCount: 3,
                    sentDate: 1677600000000,
                    deletionDate: 1677610000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            1677580000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expectContactMatch(result.deleted[0], {
            sentCount: 4,
            sentDate: 1677686400000,
            deletionDate: 1677610000000,
            customFrontend01: "CF1",
            customFrontend02: "CF2",
        });
        expect(result.lastImportExportDate).toBe(1677590000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 0 });
    });

    it("handles import with sentDate after deletion (no increment)", () => {
        const initialState: ContactState = {
            active: [],
            deleted: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 3,
                    sentDate: 1677600000000,
                    deletionDate: 1677610000000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport(
            [],
            [
                {
                    uid: 1672531200000,
                    sentCount: 2,
                    sentDate: 1677620000000,
                    deletionDate: 1677610000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            1677670000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expectContactMatch(result.deleted[0], {
            sentCount: 2,
            sentDate: 1677620000000,
            deletionDate: 1677610000000,
            customFrontend01: "CF1-updated",
            customFrontend02: "CF2-updated",
        });
        expect(result.lastImportExportDate).toBe(1677670000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 0 });
    });

    it("handles multiple contacts in single import", () => {
        const initialState: ContactState = {
            active: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test1",
                    email: "test1@example.com",
                    sentCount: 2,
                    sentDate: 1677686400000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            deleted: [
                {
                    uid: 1672531200001,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test2",
                    email: "test2@example.com",
                    sentCount: 3,
                    sentDate: 1677600000000,
                    deletionDate: 1677610000000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            lastImportExportDate: 1677580000000,
        };
        const importData = createImport(
            [
                {
                    uid: 1672531200000,
                    sentCount: 3,
                    sentDate: 1677600000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            [
                {
                    uid: 1672531200001,
                    sentCount: 5,
                    sentDate: 1677686400000,
                    deletionDate: 1677610000000,
                    customFrontend01: "CF1-new",
                    customFrontend02: "CF2-new",
                },
            ],
            1677590000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expectContactMatch(result.active[0], {
            uid: 1672531200000,
            sentCount: 5,
            sentDate: 1677686400000,
            customFrontend01: "CF1-updated",
            customFrontend02: "CF2-updated",
            deletionDate: 0,
        });
        expectContactMatch(result.deleted[0], {
            uid: 1672531200001,
            sentCount: 5,
            sentDate: 1677686400000,
            customFrontend01: "CF1-new",
            customFrontend02: "CF2-new",
            deletionDate: 1677610000000,
        });
        expect(result.lastImportExportDate).toBe(1677590000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 1 });
    });

    it("handles empty import (no change)", () => {
        const initialState: ContactState = {
            active: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 3,
                    sentDate: 1677600000000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            deleted: [],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport([], [], 1677600000000);
        const [result, stats] = mergeContacts(initialState, importData);
        expectContactMatch(result.active[0], {
            sentCount: 3,
            sentDate: 1677600000000,
            customFrontend01: "CF1",
            customFrontend02: "CF2",
            deletionDate: 0,
        });
        expect(result.deleted).toEqual([]);
        expect(result.lastImportExportDate).toBe(1677600000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 0 });
    });

    it("handles import with missing contact (new deleted entry)", () => {
        const initialState: ContactState = {
            active: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 3,
                    sentDate: 1677600000000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            deleted: [],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport(
            [
                {
                    uid: 1672531200001,
                    sentCount: 2,
                    sentDate: 1677620000000,
                    customFrontend01: "CF1-new",
                    customFrontend02: "CF2-new",
                },
            ],
            [],
            1677600000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expectContactMatch(result.active[0], {
            uid: 1672531200000,
            sentCount: 3,
            sentDate: 1677600000000,
            customFrontend01: "CF1",
            customFrontend02: "CF2",
            deletionDate: 0,
        });
        expectContactMatch(result.deleted[0], {
            uid: 1672531200001,
            sentCount: 2,
            sentDate: 1677620000000,
            customFrontend01: "CF1-new",
            customFrontend02: "CF2-new",
            deletionDate: 1677600000000,
        });
        expect(result.lastImportExportDate).toBe(1677600000000);
        expect(stats).toEqual({ contactsDeleted: 1, contactsProcessed: 0 });
    });

    it("handles simultaneous active and deleted updates", () => {
        const initialState: ContactState = {
            active: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test1",
                    email: "test1@example.com",
                    sentCount: 2,
                    sentDate: 1677600000000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            deleted: [
                {
                    uid: 1672531200001,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test2",
                    email: "test2@example.com",
                    sentCount: 3,
                    sentDate: 1677600000000,
                    deletionDate: 1677610000000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport(
            [
                {
                    uid: 1672531200000,
                    sentCount: 4,
                    sentDate: 1677620000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            [
                {
                    uid: 1672531200001,
                    sentCount: 5,
                    sentDate: 1677620000000,
                    deletionDate: 1677610000000,
                    customFrontend01: "CF1-new",
                    customFrontend02: "CF2-new",
                },
            ],
            1677600000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expectContactMatch(result.active[0], {
            uid: 1672531200000,
            sentCount: 4,
            sentDate: 1677620000000,
            customFrontend01: "CF1-updated",
            customFrontend02: "CF2-updated",
            deletionDate: 0,
        });
        expectContactMatch(result.deleted[0], {
            uid: 1672531200001,
            sentCount: 5,
            sentDate: 1677620000000,
            customFrontend01: "CF1-new",
            customFrontend02: "CF2-new",
            deletionDate: 1677610000000,
        });
        expect(result.lastImportExportDate).toBe(1677600000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 1 });
    });

    it("handles import with zero sentCount", () => {
        const initialState: ContactState = {
            active: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 3,
                    sentDate: 1677600000000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            deleted: [],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport(
            [
                {
                    uid: 1672531200000,
                    sentCount: 0,
                    sentDate: 1677620000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            [],
            1677600000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expectContactMatch(result.active[0], {
            sentCount: 0,
            sentDate: 1677620000000,
            customFrontend01: "CF1-updated",
            customFrontend02: "CF2-updated",
            deletionDate: 0,
        });
        expect(result.lastImportExportDate).toBe(1677600000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 1 });
    });

    it("handles import with same sentDate but different sentCount", () => {
        const initialState: ContactState = {
            active: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 3,
                    sentDate: 1677600000000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            deleted: [],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport(
            [
                {
                    uid: 1672531200000,
                    sentCount: 5,
                    sentDate: 1677600000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            [],
            1677590000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expectContactMatch(result.active[0], {
            sentCount: 3,
            sentDate: 1677600000000,
            customFrontend01: "CF1",
            customFrontend02: "CF2",
            deletionDate: 0,
        });
        expect(result.lastImportExportDate).toBe(1677590000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 1 });
    });

    it("handles import with future exportDate but old sentDate", () => {
        const initialState: ContactState = {
            active: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 4,
                    sentDate: 1677686400000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            deleted: [],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport(
            [
                {
                    uid: 1672531200000,
                    sentCount: 3,
                    sentDate: 1677600000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            [],
            1677700000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expectContactMatch(result.active[0], {
            sentCount: 7,
            sentDate: 1677686400000,
            customFrontend01: "CF1-updated",
            customFrontend02: "CF2-updated",
            deletionDate: 0,
        });
        expect(result.lastImportExportDate).toBe(1677700000000);
        expect(stats).toEqual({ contactsDeleted: 0, contactsProcessed: 1 });
    });

    it("handles moving active contact to deleted", () => {
        const initialState: ContactState = {
            active: [
                {
                    uid: 1672531200000,
                    nation: "US",
                    institution: "TestInst",
                    subGroup: "TestGroup",
                    name: "Test",
                    email: "test@example.com",
                    sentCount: 3,
                    sentDate: 1677600000000,
                    updatedDate: "2023-01-01T00:00:00Z",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "CF1",
                    customFrontend02: "CF2",
                },
            ],
            deleted: [],
            lastImportExportDate: 1677590000000,
        };
        const importData = createImport(
            [],
            [
                {
                    uid: 1672531200000,
                    sentCount: 4,
                    sentDate: 1677620000000,
                    deletionDate: 1677610000000,
                    customFrontend01: "CF1-updated",
                    customFrontend02: "CF2-updated",
                },
            ],
            1677600000000
        );
        const [result, stats] = mergeContacts(initialState, importData);
        expect(result.active).toEqual([]);
        expectContactMatch(result.deleted[0], {
            sentCount: 4,
            sentDate: 1677620000000,
            deletionDate: 1677610000000,
            customFrontend01: "CF1-updated",
            customFrontend02: "CF2-updated",
        });
        expect(result.lastImportExportDate).toBe(1677600000000);
        expect(stats).toEqual({ contactsDeleted: 1, contactsProcessed: 0 });
    });
});
