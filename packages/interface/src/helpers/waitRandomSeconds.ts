type Options = {
    signal?: AbortSignal;
    rejectOnAbort?: boolean;
};

type RejectArgs = { message?: string };
type ResolveArgs = RejectArgs & { timeout?: number };

/**
 * - Wait for a random time with the duration of a minimum time plus a random time within a time window.
 * - Both are specified in seconds, and the default values are set to 1 second.
 * - All arguments are converted to absolute numbers.
 * - The options are `signal: AbortSignal` and `rejectOnAbort: boolean`
 */
export function waitRandomSeconds(minSeconds = 1, randomWindow = 1, options?: Options) {
    const { signal, rejectOnAbort = false } = options ?? {};

    return new Promise((resolve, reject) => {
        function usingResolve({ message, timeout }: ResolveArgs) {
            const _message = message ?? `Timer done in ${timeout} seconds!`;
            resolve(_message);
            cleanup();
        }

        function usingReject({ message }: RejectArgs) {
            const _message = message ?? `Timer cancelled!`;
            reject(_message);
            cleanup();
        }

        function cleanup() {
            clearTimeout(handle);
            signal?.removeEventListener("abort", abort);
        }

        function abort() {
            const message = "Timer cancelled!";
            if (rejectOnAbort) {
                usingReject({ message });
            } else {
                usingResolve({ message });
            }
        }

        const min = Math.abs(minSeconds);
        const max = min + Math.abs(randomWindow);
        const timeout = Math.floor(Math.random() * 1000 * Math.abs(max - min) + 1000 * min);
        const handle = setTimeout(() => usingResolve({ timeout }), timeout);
        signal?.addEventListener("abort", abort);
    });
}
