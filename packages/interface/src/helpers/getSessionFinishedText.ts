import { sessionFinishedText } from "../constants/constants";

export const getSessionFinishedText = (emailsSent: number) =>
    `${sessionFinishedText} ${emailsSent.toString()} emails were sent.`;
