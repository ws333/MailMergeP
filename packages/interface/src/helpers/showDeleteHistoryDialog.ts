import { ActionCreator } from "easy-peasy";
import { toast } from "react-toastify";
import { UserDialog } from "../types/modelTypes";
import TextDeletingData from "../components/dialogTexts/TextDeletingData";
import { toastOptions } from "../styles/styles";
import { resetStorage } from "./indexedDB";

type Args = {
    initiateForcedRender: ActionCreator<void>;
    setUserDialog: ActionCreator<Partial<UserDialog>>;
};

export function showDeleteHistoryDialog({ initiateForcedRender, setUserDialog }: Args) {
    setUserDialog({
        title: "Deletion warning!",
        message: TextDeletingData,
        confirmActionText: "Confirm deletion",
        onConfirm: async () => {
            const resetOk = await resetStorage();
            if (resetOk) {
                const message = "Sending history has been deleted!";
                toast(message, toastOptions);
                console.log(message);
                initiateForcedRender();
            } else {
                const message = "Failed to delete history!";
                toast(message, {
                    ...toastOptions,
                    type: "error",
                });
            }
        },
    });
}
