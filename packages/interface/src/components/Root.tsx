import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StoreProvider, createStore } from "easy-peasy";
import { DarkLightThemeProvider, GlobalStyle, ThemePreference } from "radzionkit";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { model } from "../model";
import { PersistentStateKey, usePersistentState } from "../state/persistentState";
import App from "./App";
import ErrorFallback from "./ErrorFallback";
import Loading from "./Loading";

const store = createStore(model, { disableImmer: true });

const queryClient = new QueryClient();

export function Root() {
    const [theme, setTheme] = usePersistentState<ThemePreference>(PersistentStateKey.ThemePreference, "system");
    return (
        <StoreProvider store={store}>
            <DarkLightThemeProvider value={theme} onChange={setTheme}>
                <GlobalStyle fontFamily={"Tahoma, sans-serif"} />
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <Suspense fallback={<Loading />}>
                        <QueryClientProvider client={queryClient}>
                            <App />
                        </QueryClientProvider>
                    </Suspense>
                </ErrorBoundary>
            </DarkLightThemeProvider>
        </StoreProvider>
    );
}
