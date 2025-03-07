/**
 * - Wait for a random time with the duration of a minimum time plus a random time within a time window.
 * - Both are specified in seconds, and the default values are set to 1 second.
 * - All arguments are converted to absolute numbers.
 */
export function waitRandomSeconds(minSeconds = 1, randomWindow = 1) {
    console.log(
        "*Debug* -> waitRandomSeconds -> minSeconds, randomWindow:",
        minSeconds,
        randomWindow
    );
    return new Promise((resolve) => {
        const min = Math.abs(minSeconds);
        const max = min + Math.abs(randomWindow);
        const timeout = Math.floor(
            Math.random() * 1000 * Math.abs(max - min) + 1000 * min
        );
        setTimeout(() => {
            console.log(
                "*Debug* -> waitRandomSeconds -> time waited in ms:",
                timeout
            );
            resolve(timeout);
        }, timeout);
    });
}
