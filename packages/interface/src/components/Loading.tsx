import { Text } from "radzionkit";
import { Spinner } from "radzionkit/ui/loaders/Spinner";
import { CSSProperties } from "react";
import HeaderWithIFO from "./HeaderWithIFO";

const divStyles: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    width: "100%",
};

function Loading() {
    return (
        <>
            <div style={divStyles}>
                <HeaderWithIFO />
                <br />
                <Text size={42}>
                    <Spinner />
                </Text>
            </div>
        </>
    );
}

export default Loading;
