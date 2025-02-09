export {};

declare global {
    interface Window {
        iframeService: Record<string, any>;
        childFrame: HTMLIFrameElement;
    }
}
