import { LetterProps } from "../types/types";

type EmailPreviewProps = {
    Component: ({ name }: LetterProps) => JSX.Element;
    name: string;
};

function EmailPreview({ name, Component }: EmailPreviewProps) {
    return (
        <div>
            <div className="email-preview-content">
                <Component name={name} />
            </div>
        </div>
    );
}

export default EmailPreview;
