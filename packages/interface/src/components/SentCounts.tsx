import { VStack } from "@lib/ui/css/stack";
import { ExpandablePanel } from "@lib/ui/panel/ExpandablePanel";
import { UseContactListReturnType } from "../hooks/useContactList";
import "./SentCounts.css";

// Add this import for custom styles

type Props = {
    useCL: UseContactListReturnType;
};

export function SentCounts({ useCL }: Props) {
    return (
        <ExpandablePanel
            className="sent-counts-panel"
            header={
                <VStack alignItems="start" fullWidth={true}>
                    <div className="container_header_sent_counts">
                        <div className="column_left_header_sent_counts">
                            <div>Emails sent last 24 hours</div>
                        </div>
                        <div className="column_right_header_sent_counts">
                            <div>{useCL.totalSentCount24Hours}</div>
                        </div>
                    </div>
                </VStack>
            }
            renderContent={() => (
                <div className="container_sent_counts">
                    <div className="column_left_sent_counts">
                        <div>Total sent count</div>
                        <div>Last hour</div>
                        <div>7 days</div>
                        <div>30 days</div>
                        <div>3 months</div>
                    </div>
                    <div className="column_right_sent_counts">
                        <div>{useCL.totalSentCount}</div>
                        <div>{useCL.totalSentCountLastHour}</div>
                        <div>{useCL.totalSentCountLast7Days}</div>
                        <div>{useCL.totalSentCountLast30Days}</div>
                        <div>{useCL.totalSentCountLast3Months}</div>
                    </div>
                </div>
            )}
        />
    );
}
