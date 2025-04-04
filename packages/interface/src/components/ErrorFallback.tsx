import { Button, Text } from "radzionkit";
import { CSSProperties } from "react";
import { FallbackProps } from "react-error-boundary";
import HeaderWithIFO from "./HeaderWithIFO";

const divStyles: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    width: "100%",
};

const textStyles: CSSProperties = {
    color: "orange",
    fontFamily: "courier",
    margin: "1rem",
    marginBottom: "2rem",
};

function ErrorFallback({ error }: FallbackProps) {
    function onClick() {
        window.location.reload();
    }
    return (
        <div role="alert" style={divStyles}>
            <HeaderWithIFO />
            <Text size={16} style={textStyles}>
                {error.message}
            </Text>
            <Button onClick={onClick}>Try again</Button>
        </div>
    );
}

export default ErrorFallback;
