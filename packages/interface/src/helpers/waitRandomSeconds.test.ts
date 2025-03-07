import { expect, test } from "vitest";
import { waitRandomSeconds } from "../helpers/waitRandomSeconds.ts";

const numberOfIterations = 5;

for (let i = 0; i < numberOfIterations; i++) {
    test("expect wait to keep within time window, negative minSeconds", async () => {
        const minSeconds = -0.3;
        const randomWindow = 0.2;
        const ms = await waitRandomSeconds(minSeconds, randomWindow);
        const expectMinSeconds = Math.abs(minSeconds) * 1000;
        const expectMaxSeconds =
            Math.abs(minSeconds) * 1000 + Math.abs(randomWindow) * 1000;
        console.log("*Debug* -> test -> ms:", ms);
        console.log("*Debug* -> test -> expectMinSeconds:", expectMinSeconds);
        console.log("*Debug* -> test -> expectMaxSeconds:", expectMaxSeconds);
        expect(ms).toBeGreaterThanOrEqual(expectMinSeconds);
        expect(ms).toBeLessThanOrEqual(expectMaxSeconds);
    });
}

for (let i = 0; i < numberOfIterations; i++) {
    test("expect wait to keep within time window, negative randomWindow", async () => {
        const minSeconds = 0.3;
        const randomWindow = -0.2;
        const ms = await waitRandomSeconds(minSeconds, randomWindow);
        const expectMinSeconds = Math.abs(minSeconds) * 1000;
        const expectMaxSeconds =
            Math.abs(minSeconds) * 1000 + Math.abs(randomWindow) * 1000;
        console.log("*Debug* -> test -> ms:", ms);
        console.log("*Debug* -> test -> expectMinSeconds:", expectMinSeconds);
        console.log("*Debug* -> test -> expectMaxSeconds:", expectMaxSeconds);
        expect(ms).toBeGreaterThanOrEqual(expectMinSeconds);
        expect(ms).toBeLessThanOrEqual(expectMaxSeconds);
    });
}

for (let i = 0; i < numberOfIterations; i++) {
    test("expect wait to keep within time window, negative minSeconds and negative randomWindow", async () => {
        const minSeconds = -0.3;
        const randomWindow = -0.2;
        const ms = await waitRandomSeconds(minSeconds, randomWindow);
        const expectMinSeconds = Math.abs(minSeconds) * 1000;
        const expectMaxSeconds =
            Math.abs(minSeconds) * 1000 + Math.abs(randomWindow) * 1000;
        console.log("*Debug* -> test -> ms:", ms);
        console.log("*Debug* -> test -> expectMinSeconds:", expectMinSeconds);
        console.log("*Debug* -> test -> expectMaxSeconds:", expectMaxSeconds);
        expect(ms).toBeGreaterThanOrEqual(expectMinSeconds);
        expect(ms).toBeLessThanOrEqual(expectMaxSeconds);
    });
}

for (let i = 0; i < numberOfIterations; i++) {
    test("expect wait to keep within time window, minSeconds 0", async () => {
        const minSeconds = 0;
        const randomWindow = 0.4;
        const ms = await waitRandomSeconds(minSeconds, randomWindow);
        const expectMinSeconds = Math.abs(minSeconds) * 1000;
        const expectMaxSeconds =
            Math.abs(minSeconds) * 1000 + Math.abs(randomWindow) * 1000;
        console.log("*Debug* -> test -> ms:", ms);
        console.log("*Debug* -> test -> expectMinSeconds:", expectMinSeconds);
        console.log("*Debug* -> test -> expectMaxSeconds:", expectMaxSeconds);
        expect(ms).toBeGreaterThanOrEqual(expectMinSeconds);
        expect(ms).toBeLessThanOrEqual(expectMaxSeconds);
    });
}

for (let i = 0; i < numberOfIterations; i++) {
    test("expect wait to keep within time window, randomWindow 0", async () => {
        const minSeconds = 0.3;
        const randomWindow = 0;
        const ms = await waitRandomSeconds(minSeconds, randomWindow);
        const expectMinSeconds = Math.abs(minSeconds) * 1000;
        const expectMaxSeconds =
            Math.abs(minSeconds) * 1000 + Math.abs(randomWindow) * 1000;
        console.log("*Debug* -> test -> ms:", ms);
        console.log("*Debug* -> test -> expectMinSeconds:", expectMinSeconds);
        console.log("*Debug* -> test -> expectMaxSeconds:", expectMaxSeconds);
        expect(ms).toBeGreaterThanOrEqual(expectMinSeconds);
        expect(ms).toBeLessThanOrEqual(expectMaxSeconds);
    });
}
