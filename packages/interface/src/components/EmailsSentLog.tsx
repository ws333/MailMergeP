type EmailsSentLogProps = {
  logMessages: string[];
};

function EmailsSentLog({ logMessages }: EmailsSentLogProps) {
  return (
    <section className="emails-sent-log">
      <h2>Email Sending Log</h2>
      <div className="emails-sent-log-container">
        {logMessages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
    </section>
  );
}

export default EmailsSentLog;
