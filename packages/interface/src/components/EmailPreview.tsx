type EmailOptionsProps = {
    emailText: string;
};

function EmailPreview({ emailText }: EmailOptionsProps) {
    return (
        <div>
            <div
                className="email-preview-content"
                dangerouslySetInnerHTML={{
                    __html: emailText,
                }}
            />
        </div>
    );
}

export default EmailPreview;
