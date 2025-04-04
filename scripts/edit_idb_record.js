(function () {
    // Modify these two constants then copy/paste into the console to run
    const uid = 0; // e.g. 1735686128300
    const sentDate = Date.now() - 1000 * 60 * 5; // Last digit is minutes ago

    const dbVersion = 2; // Update this if new database version

    let db;
    const request = indexedDB.open("ContactsI3CDatabase", dbVersion);

    request.onsuccess = (event) => {
        db = event.target.result;

        // Start a readwrite transaction
        const transaction = db.transaction(["activeContacts"], "readwrite");
        const store = transaction.objectStore("activeContacts");

        // Fetch the record by its key (as number)
        const getRequest = store.get(uid);

        getRequest.onsuccess = (event) => {
            const record = event.target.result;
            if (record) {
                // Modify the record
                // record.sc = record.sc + 1;
                record.sd = sentDate;

                // Save the updated record back to the store
                const updateRequest = store.put(record);
                updateRequest.onsuccess = () => {
                    console.log("Record updated successfully");
                };
                updateRequest.onerror = (event) => {
                    console.error("Update failed:", event.target.error);
                };
            } else {
                console.log("Record not found");
            }
        };

        transaction.oncomplete = () => {
            db.close();
            console.log("Transaction completed");
        };
    };

    request.onerror = (event) => {
        console.error("Database error:", event.target.error);
    };
})();
