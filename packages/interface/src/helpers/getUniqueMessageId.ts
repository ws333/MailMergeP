let _messageId = 0;

export function getUniqueMessageId() {
    return _messageId++;
}
