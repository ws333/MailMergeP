import { IASE_URL } from "../constants/constants";
import icon from "../../../thunderbird-extension/public/skin/icon64.png";
import "./IFO.css";

type Props = {
    isHovering?: boolean;
};

function IFO({ isHovering = true }: Props) {
    return (
        <a href={IASE_URL} target="_blank" rel="noopener noreferrer">
            <img
                className={`ifo ${isHovering ? "hovering-ifo" : ""}`}
                src={icon}
                alt="Interstellar Alliance Social Experiment Step 3 icon"
            />
        </a>
    );
}
export default IFO;
