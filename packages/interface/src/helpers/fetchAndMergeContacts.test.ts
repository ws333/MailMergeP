import { toast } from "react-toastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContactI3C } from "../types/typesI3C";

// Define mocks at the top
const mockCsvParse = vi.fn();
const mockFetch = vi.fn();
const mockInitializeStorage = vi.fn();
const mockGetActiveContacts = vi.fn();
const mockStoreActiveContacts = vi.fn();
const mockStoreDeletedContacts = vi.fn();
const mockRemoveActiveContactByUid = vi.fn();
const mockGetDeletedContacts = vi.fn();

// Mock toast
vi.mock("react-toastify", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
        info: vi.fn(),
    },
}));

// Mock csvParse
vi.mock("./csvParse", () => ({
    csvParse: mockCsvParse,
}));

// Mock './indexedDB'
vi.mock("./indexedDB", () => ({
    initializeStorage: mockInitializeStorage,
    getActiveContacts: mockGetActiveContacts,
    getDeletedContacts: mockGetDeletedContacts,
    storeActiveContacts: mockStoreActiveContacts,
    storeDeletedContacts: mockStoreDeletedContacts,
    removeActiveContactByUid: mockRemoveActiveContactByUid,
}));

describe("fetchAndMergeContacts", () => {
    const mockDateNow = 1677600000000; // Feb 28, 2023, 08:40:00 UTC
    let abortController: AbortController;
    let fetchAndMergeContacts: typeof import("./fetchAndMergeContacts").fetchAndMergeContacts;
    let checkNoOverlapActiveDeletedContacts: typeof import("./checkNoOverlapActiveDeleted").checkNoOverlapActiveDeletedContacts;

    const mockFetchFn = vi.fn(async (signal: AbortSignal): Promise<ContactI3C[]> => {
        const response = await mockFetch("some-url", { signal });
        const csvText = await response.text();
        return mockCsvParse(csvText).data;
    });

    beforeEach(async () => {
        // Dynamically import the modules after mocks are set up
        ({ fetchAndMergeContacts } = await import("./fetchAndMergeContacts"));
        ({ checkNoOverlapActiveDeletedContacts } = await import("./checkNoOverlapActiveDeleted"));

        vi.useFakeTimers();
        vi.setSystemTime(mockDateNow);
        vi.clearAllMocks();
        console.table = vi.fn();
        abortController = new AbortController();

        mockFetch.mockReset();
        mockCsvParse.mockReset();
        mockInitializeStorage.mockReset();
        mockGetActiveContacts.mockReset();
        mockGetDeletedContacts.mockReset();
        mockStoreActiveContacts.mockReset();
        mockStoreDeletedContacts.mockReset();
        mockRemoveActiveContactByUid.mockReset();

        // Default setup to avoid overlap
        mockGetDeletedContacts.mockResolvedValue([]);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("handles empty online and local contacts", async () => {
        mockFetch.mockResolvedValue({ text: async () => "" });
        mockCsvParse.mockReturnValue({ data: [] });
        mockGetActiveContacts.mockResolvedValue([]);

        const result = await fetchAndMergeContacts(abortController.signal, mockFetchFn);

        expect(result).toEqual([]);
        expect(mockInitializeStorage).toHaveBeenCalledWith([]);
        expect(mockStoreDeletedContacts).toHaveBeenCalledWith([]);
        expect(mockStoreActiveContacts).toHaveBeenCalledWith([]);
    });

    it("handles empty online contacts with local contacts (all deleted)", async () => {
        mockFetch.mockResolvedValue({ text: async () => "" });
        mockCsvParse.mockReturnValue({ data: [] });
        mockGetActiveContacts.mockResolvedValue([
            {
                uid: 1,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test",
                email: "test@example.com",
                sentDate: 1677580000000,
                sentCount: 2,
                updatedDate: "2023-01-01",
                deletionDate: 0,
                customBackend01: "CB1",
                customBackend02: "CB2",
                customFrontend01: "CF1",
                customFrontend02: "CF2",
            },
        ]);

        const result = await fetchAndMergeContacts(abortController.signal, mockFetchFn);

        expect(result).toEqual([]);
        expect(mockStoreDeletedContacts).toHaveBeenCalledWith([
            {
                uid: 1,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test",
                email: "test@example.com",
                sentDate: 1677580000000,
                sentCount: 2,
                updatedDate: "2023-01-01",
                deletionDate: mockDateNow,
                customBackend01: "CB1",
                customBackend02: "CB2",
                customFrontend01: "CF1",
                customFrontend02: "CF2",
            },
        ]);
        expect(mockRemoveActiveContactByUid).toHaveBeenCalledWith(1);
        expect(mockStoreActiveContacts).toHaveBeenCalledWith([]);
    });

    it("handles online contacts with empty local contacts", async () => {
        mockFetch.mockResolvedValue({
            text: async () =>
                "uid,nation,institution,subGroup,name,email,sentDate,sentCount,updatedDate,deletionDate,customBackend01,customBackend02,customFrontend01,customFrontend02\n" +
                "1,US,Inst,Group,Test,test@example.com,1677580000000,1,2023-01-01,0,CB1,CB2,,",
        });
        mockCsvParse.mockReturnValue({
            data: [
                {
                    uid: 1,
                    nation: "US",
                    institution: "Inst",
                    subGroup: "Group",
                    name: "Test",
                    email: "test@example.com",
                    sentDate: 1677580000000,
                    sentCount: 1,
                    updatedDate: "2023-01-01",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "",
                    customFrontend02: "",
                },
            ],
        });
        mockGetActiveContacts.mockResolvedValue([]);

        const result = await fetchAndMergeContacts(abortController.signal, mockFetchFn);

        expect(result).toEqual([
            {
                uid: 1,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test",
                email: "test@example.com",
                sentDate: 1677580000000,
                sentCount: 1,
                updatedDate: "2023-01-01",
                deletionDate: 0,
                customBackend01: "CB1",
                customBackend02: "CB2",
                customFrontend01: "",
                customFrontend02: "",
            },
        ]);
        expect(mockStoreDeletedContacts).toHaveBeenCalledWith([]);
        expect(mockStoreActiveContacts).toHaveBeenCalledWith([
            {
                uid: 1,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test",
                email: "test@example.com",
                sentDate: 1677580000000,
                sentCount: 1,
                updatedDate: "2023-01-01",
                deletionDate: 0,
                customBackend01: "CB1",
                customBackend02: "CB2",
                customFrontend01: "",
                customFrontend02: "",
            },
        ]);
    });

    it("merges overlapping contacts with local data preserved", async () => {
        mockFetch.mockResolvedValue({
            text: async () =>
                "uid,nation,institution,subGroup,name,email,sentDate,sentCount,updatedDate,deletionDate,customBackend01,customBackend02,customFrontend01,customFrontend02\n" +
                "1,US,Inst,Group,Test,test@example.com,1677570000000,1,2023-01-01,0,CB1,CB2,,",
        });
        mockCsvParse.mockReturnValue({
            data: [
                {
                    uid: 1,
                    nation: "US",
                    institution: "Inst",
                    subGroup: "Group",
                    name: "Test",
                    email: "test@example.com",
                    sentDate: 1677570000000,
                    sentCount: 1,
                    updatedDate: "2023-01-01",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "",
                    customFrontend02: "",
                },
            ],
        });
        mockGetActiveContacts.mockResolvedValue([
            {
                uid: 1,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test",
                email: "test@example.com",
                sentDate: 1677580000000,
                sentCount: 2,
                updatedDate: "2023-01-01",
                deletionDate: 0,
                customBackend01: "CB1-old",
                customBackend02: "CB2-old",
                customFrontend01: "CF1",
                customFrontend02: "CF2",
            },
        ]);

        const result = await fetchAndMergeContacts(abortController.signal, mockFetchFn);

        expect(result).toEqual([
            {
                uid: 1,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test",
                email: "test@example.com",
                sentDate: 1677580000000,
                sentCount: 2,
                updatedDate: "2023-01-01",
                deletionDate: 0,
                customBackend01: "CB1",
                customBackend02: "CB2",
                customFrontend01: "CF1",
                customFrontend02: "CF2",
            },
        ]);
        expect(mockStoreDeletedContacts).toHaveBeenCalledWith([]);
        expect(mockStoreActiveContacts).toHaveBeenCalledWith([
            {
                uid: 1,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test",
                email: "test@example.com",
                sentDate: 1677580000000,
                sentCount: 2,
                updatedDate: "2023-01-01",
                deletionDate: 0,
                customBackend01: "CB1",
                customBackend02: "CB2",
                customFrontend01: "CF1",
                customFrontend02: "CF2",
            },
        ]);
    });

    it("handles local contact not in online (deleted)", async () => {
        mockFetch.mockResolvedValue({
            text: async () =>
                "uid,nation,institution,subGroup,name,email,sentDate,sentCount,updatedDate,deletionDate,customBackend01,customBackend02,customFrontend01,customFrontend02\n" +
                "1,US,Inst,Group,Test1,test1@example.com,1677580000000,1,2023-01-01,0,CB1,CB2,,",
        });
        mockCsvParse.mockReturnValue({
            data: [
                {
                    uid: 1,
                    nation: "US",
                    institution: "Inst",
                    subGroup: "Group",
                    name: "Test1",
                    email: "test1@example.com",
                    sentDate: 1677580000000,
                    sentCount: 1,
                    updatedDate: "2023-01-01",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "",
                    customFrontend02: "",
                },
            ],
        });
        mockGetActiveContacts.mockResolvedValue([
            {
                uid: 2,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test2",
                email: "test2@example.com",
                sentDate: 1677580000000,
                sentCount: 2,
                updatedDate: "2023-01-01",
                deletionDate: 0,
                customBackend01: "CB1",
                customBackend02: "CB2",
                customFrontend01: "CF1",
                customFrontend02: "CF2",
            },
        ]);

        const result = await fetchAndMergeContacts(abortController.signal, mockFetchFn);

        expect(result).toEqual([
            {
                uid: 1,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test1",
                email: "test1@example.com",
                sentDate: 1677580000000,
                sentCount: 1,
                updatedDate: "2023-01-01",
                deletionDate: 0,
                customBackend01: "CB1",
                customBackend02: "CB2",
                customFrontend01: "",
                customFrontend02: "",
            },
        ]);
        expect(mockStoreDeletedContacts).toHaveBeenCalledWith([
            {
                uid: 2,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test2",
                email: "test2@example.com",
                sentDate: 1677580000000,
                sentCount: 2,
                updatedDate: "2023-01-01",
                deletionDate: mockDateNow,
                customBackend01: "CB1",
                customBackend02: "CB2",
                customFrontend01: "CF1",
                customFrontend02: "CF2",
            },
        ]);
        expect(mockRemoveActiveContactByUid).toHaveBeenCalledWith(2);
    });

    it("handles abort signal", async () => {
        mockFetch.mockRejectedValue(new DOMException("Aborted", "AbortError"));
        mockGetActiveContacts.mockResolvedValue([]);

        const abortingController = new AbortController();
        abortingController.abort();
        await expect(fetchAndMergeContacts(abortingController.signal, mockFetchFn)).rejects.toThrow("Aborted");
        expect(mockStoreDeletedContacts).not.toHaveBeenCalled();
    });

    it("detects overlap between active and deleted contacts", async () => {
        mockFetch.mockResolvedValue({ text: async () => "" });
        mockCsvParse.mockReturnValue({ data: [] });

        // Setup overlap between active and deleted contacts
        const activeContacts = [
            {
                uid: 1,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test",
                email: "test@example.com",
                sentDate: 1677580000000,
                sentCount: 2,
                updatedDate: "2023-01-01",
                deletionDate: 0,
                customBackend01: "CB1",
                customBackend02: "CB2",
                customFrontend01: "CF1",
                customFrontend02: "CF2",
            },
        ];

        const deletedContacts = [
            {
                uid: 1, // Same UID as in active contacts
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test",
                email: "test@example.com",
                sentDate: 1677580000000,
                sentCount: 2,
                updatedDate: "2023-01-01",
                deletionDate: mockDateNow,
                customBackend01: "CB1",
                customBackend02: "CB2",
                customFrontend01: "CF1",
                customFrontend02: "CF2",
            },
        ];

        mockGetActiveContacts.mockResolvedValue(activeContacts);
        mockGetDeletedContacts.mockResolvedValue(deletedContacts);

        await fetchAndMergeContacts(abortController.signal, mockFetchFn);
        expect(toast.error).toHaveBeenCalledWith("Overlap between active and deleted contacts in indexedDB!", {
            autoClose: false,
        });
    });

    it("handles local contact with missing fields", async () => {
        mockFetch.mockResolvedValue({
            text: async () =>
                "uid,nation,institution,subGroup,name,email,sentDate,sentCount,updatedDate,deletionDate,customBackend01,customBackend02,customFrontend01,customFrontend02\n" +
                "1,US,Inst,Group,Test,test@example.com,1677570000000,1,2023-01-01,0,CB1,CB2,,",
        });
        mockCsvParse.mockReturnValue({
            data: [
                {
                    uid: 1,
                    nation: "US",
                    institution: "Inst",
                    subGroup: "Group",
                    name: "Test",
                    email: "test@example.com",
                    sentDate: 1677570000000,
                    sentCount: 1,
                    updatedDate: "2023-01-01",
                    deletionDate: 0,
                    customBackend01: "CB1",
                    customBackend02: "CB2",
                    customFrontend01: "",
                    customFrontend02: "",
                },
            ],
        });
        mockGetActiveContacts.mockResolvedValue([
            {
                uid: 1,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test",
                email: "test@example.com",
                sentDate: 0,
                sentCount: 0,
                updatedDate: "2023-01-01",
                deletionDate: 0,
                customBackend01: "CB1-old",
                customBackend02: "CB2-old",
                customFrontend01: "",
                customFrontend02: "",
            },
        ]);

        const result = await fetchAndMergeContacts(abortController.signal, mockFetchFn);

        expect(result).toEqual([
            {
                uid: 1,
                nation: "US",
                institution: "Inst",
                subGroup: "Group",
                name: "Test",
                email: "test@example.com",
                sentDate: 1677570000000,
                sentCount: 1,
                updatedDate: "2023-01-01",
                deletionDate: 0,
                customBackend01: "CB1",
                customBackend02: "CB2",
                customFrontend01: "",
                customFrontend02: "",
            },
        ]);
        expect(mockStoreDeletedContacts).toHaveBeenCalledWith([]);
    });

    // Test for the checkNoOverlapActiveDeletedContacts function
    it("checkNoOverlapActiveDeletedContacts detects overlap correctly", async () => {
        // Setup overlap between active and deleted contacts
        const activeContacts = [
            { uid: 1, nation: "US", email: "test1@example.com" },
            { uid: 2, nation: "UK", email: "test2@example.com" },
        ] as ContactI3C[];

        const deletedContacts = [
            { uid: 1, nation: "US", email: "test1@example.com" }, // Overlapping UID
            { uid: 3, nation: "CA", email: "test3@example.com" },
        ] as ContactI3C[];

        mockGetActiveContacts.mockResolvedValue(activeContacts);
        mockGetDeletedContacts.mockResolvedValue(deletedContacts);

        const result = await checkNoOverlapActiveDeletedContacts();

        expect(result).toBe(true); // Should detect overlap
        expect(console.table).toHaveBeenCalled();
    });

    it("checkNoOverlapActiveDeletedContacts reports no overlap when none exists", async () => {
        // Setup non-overlapping contacts
        const activeContacts = [
            { uid: 1, nation: "US", email: "test1@example.com" },
            { uid: 2, nation: "UK", email: "test2@example.com" },
        ] as ContactI3C[];

        const deletedContacts = [
            { uid: 3, nation: "CA", email: "test3@example.com" },
            { uid: 4, nation: "DE", email: "test4@example.com" },
        ] as ContactI3C[];

        mockGetActiveContacts.mockResolvedValue(activeContacts);
        mockGetDeletedContacts.mockResolvedValue(deletedContacts);

        const result = await checkNoOverlapActiveDeletedContacts();

        expect(result).toBe(false); // Should not detect overlap
        expect(console.table).not.toHaveBeenCalled();
    });
});
