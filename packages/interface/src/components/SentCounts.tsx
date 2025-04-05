import { VStack } from "@lib/ui/css/stack";
import { ExpandablePanel } from "@lib/ui/panel/ExpandablePanel";
import { Tooltip } from "radzionkit/ui/tooltips/Tooltip";
import { oneDay, oneHour, oneMonth, sevenDays, threeMonths } from "../constants/timeConstants";
import { useStoreState } from "../hooks/storeHooks";
import "./SentCounts.css";

export function SentCounts() {
    const now = Date.now();
    const oneHourAgo = now - oneHour;
    const oneDayAgo = now - oneDay;
    const sevenDaysAgo = now - sevenDays;
    const oneMonthAgo = now - oneMonth;
    const threeMonthsAgo = now - threeMonths;

    const contacts = useStoreState((state) => state.contactList.contacts);
    const deletedContacts = useStoreState((state) => state.contactList.deletedContacts);

    const combinedContacts = contacts.concat(deletedContacts);
    const totalSentCount = combinedContacts.reduce((acc, contact) => acc + contact.sc, 0);
    const totalSentCountLastHour = combinedContacts.reduce(
        (acc, contact) => (contact.sd > oneHourAgo ? acc + 1 : acc),
        0
    );
    const totalSentCount24Hours = combinedContacts.reduce(
        (acc, contact) => (contact.sd > oneDayAgo ? acc + 1 : acc),
        0
    );
    const totalSentCountLast7Days = combinedContacts.reduce(
        (acc, contact) => (contact.sd > sevenDaysAgo ? acc + 1 : acc),
        0
    );
    const totalSentCountLast30Days = combinedContacts.reduce(
        (acc, contact) => (contact.sd > oneMonthAgo ? acc + 1 : acc),
        0
    );
    const totalSentCountLast3Months = combinedContacts.reduce(
        (acc, contact) => (contact.sd > threeMonthsAgo ? acc + 1 : acc),
        0
    );

    return (
        <ExpandablePanel
            className="sent-counts-panel"
            header={
                <Tooltip
                    placement="top"
                    renderOpener={(props) => (
                        <VStack {...props} alignItems="start" fullWidth={true}>
                            <div className="container_header_sent_counts">
                                <div className="column_left_header_sent_counts">
                                    <div>Emails sent last 24 hours</div>
                                </div>
                                <div className="column_right_header_sent_counts">
                                    <div>{totalSentCount24Hours}</div>
                                </div>
                            </div>
                        </VStack>
                    )}
                    content={"Click to see more/less stats"}
                />
            }
            renderContent={() => (
                <div className="container_sent_counts">
                    <div className="column_left_sent_counts">
                        <div>Total sent count</div>
                        <div>Last hour</div>
                        <div>Last 7 days</div>
                        <div>Last 30 days</div>
                        <div>Last 3 months</div>
                    </div>
                    <div className="column_right_sent_counts">
                        <div>{totalSentCount}</div>
                        <div>{totalSentCountLastHour}</div>
                        <div>{totalSentCountLast7Days}</div>
                        <div>{totalSentCountLast30Days}</div>
                        <div>{totalSentCountLast3Months}</div>
                    </div>
                </div>
            )}
        />
    );
}
