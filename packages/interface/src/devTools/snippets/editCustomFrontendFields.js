/**
 
DevTools Snippet to edit customFrontend01 and customFrontend02 for the first contact

- Open your application in Chrome/Firefox/Edge
- Open DevTools (F12 or Right-click > Inspect)
- Go to the "Sources" tab in Chrome DevTools (or equivalent in other browsers)
- Look for "Snippets" in the sidebar (you might need to click on ">>>" to find it)
- Create a new snippet and paste this code
- Run the snippet (right-click > Run or Ctrl+Enter)

*/

(async () => {
    const DB_NAME = "ContactsI3CDatabase";
    const STORE = {
        ACTIVE_CONTACTS: "activeContacts",
    };

    // Helper function to open database
    function openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(new Error(`Failed to open IndexedDB: ${event.target.error}`));
        });
    }

    try {
        // Get all active contacts
        const db = await openDatabase();
        const transaction = db.transaction(STORE.ACTIVE_CONTACTS, "readonly");
        const store = transaction.objectStore(STORE.ACTIVE_CONTACTS);

        // Get all contacts
        const allContacts = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error("Failed to retrieve contacts"));
        });

        // Close read transaction
        transaction.oncomplete = () => db.close();

        // If no contacts found
        if (allContacts.length === 0) {
            console.log("No contacts found in the database");
            return;
        }

        // Get the first contact
        const firstContact = allContacts[0];
        console.log("First contact before update:", firstContact);

        // Set new values for first contact
        const newCustomFrontend01 = "Test value 1";
        const newCustomFrontend02 = "Test value 2";

        // Update the contact
        const dbWrite = await openDatabase();
        const writeTransaction = dbWrite.transaction(STORE.ACTIVE_CONTACTS, "readwrite");
        const writeStore = writeTransaction.objectStore(STORE.ACTIVE_CONTACTS);

        // Update and save
        firstContact.customFrontend01 = newCustomFrontend01;
        firstContact.customFrontend02 = newCustomFrontend02;

        await new Promise((resolve, reject) => {
            const updateRequest = writeStore.put(firstContact);
            updateRequest.onsuccess = () => {
                console.log("First contact updated successfully!");
                console.log("Updated values:", {
                    uid: firstContact.uid,
                    name: firstContact.name,
                    customFrontend01: firstContact.customFrontend01,
                    customFrontend02: firstContact.customFrontend02,
                });
                resolve();
            };
            updateRequest.onerror = () => reject(new Error("Failed to update first contact"));
        });

        writeTransaction.oncomplete = () => dbWrite.close();
    } catch (error) {
        console.error("Error in IndexedDB operation:", error);
    }
})();
