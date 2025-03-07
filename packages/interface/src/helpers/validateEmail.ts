export const validateEmail = (email: string): boolean => {
    // Best choice for email validation according to Grok 3 beta and ChatGPT-4o
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};
