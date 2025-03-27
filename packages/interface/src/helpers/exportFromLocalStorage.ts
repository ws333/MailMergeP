import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import { ContactI3C } from "../types/typesI3C";
import { zipPassword } from "../constants/constants";
import {
    METADATA_KEY,
    STORE,
    getActiveContacts,
    getDeletedContacts,
    getMetadata,
    getSendingLog,
    storeMetadataKey,
} from "./indexedDB";

export async function exportFromLocalStorage() {
    // Export date is used at import to avoid duplications
    storeMetadataKey(Date.now(), METADATA_KEY.EXPORT_DATE);

    // Create a zip file with encryption options if password is provided
    const blobWriter = new BlobWriter("application/zip");
    const zipWriter = new ZipWriter(blobWriter, {
        // Add encryption options when password is provided
        password: zipPassword,
        // Use AES encryption when a password is provided
        encryptionStrength: 3, // 3 is for AES-256
    });

    // Add each localStorage item to the zip
    for (const property in STORE) {
        const key = STORE[property as keyof typeof STORE];
        const data =
            key === "activeContacts"
                ? await getActiveContacts()
                : key === "deletedContacts"
                  ? await getDeletedContacts()
                  : key === "sendingLog"
                    ? await getSendingLog()
                    : key === "metadata"
                      ? await getMetadata()
                      : "";

        if (data) {
            // Parse data and extract fields to be exported
            const dataToExport =
                key === "activeContacts"
                    ? JSON.stringify(
                          (data as ContactI3C[]).map(
                              (d): Partial<ContactI3C> => ({
                                  uid: d.uid,
                                  sentDate: d.sentDate,
                                  sentCount: d.sentCount,
                                  customFrontend01: d.customFrontend01,
                                  customFrontend02: d.customFrontend02,
                              })
                          )
                      )
                    : key === "deletedContacts"
                      ? JSON.stringify(
                            (data as ContactI3C[]).map(
                                (d): Partial<ContactI3C> => ({
                                    uid: d.uid,
                                    sentDate: d.sentDate,
                                    sentCount: d.sentCount,
                                    deletionDate: d.deletionDate,
                                    customFrontend01: d.customFrontend01,
                                    customFrontend02: d.customFrontend02,
                                })
                            )
                        )
                      : key === "sendingLog" || key === "metadata"
                        ? JSON.stringify(data)
                        : `Error: Missing check for key: ${key}`;

            await zipWriter.add(`${key}.json`, new TextReader(dataToExport));
        }
    }

    // Close the zip and get the final blob
    const blob = await zipWriter.close();

    // Create and trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "iases3_export.zip";
    a.click();
    URL.revokeObjectURL(url);
}
