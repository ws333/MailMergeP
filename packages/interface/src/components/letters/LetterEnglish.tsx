import { LetterProps } from "../../types/types";
import { styles } from "./lettersStyles";

const LetterEnglish = ({ name }: LetterProps) => {
    return (
        <div style={styles}>
            <meta httpEquiv="content-type" content="text/html; charset=UTF-8" lang="en" />
            <div>
                <p style={{ textIndent: 0 }}>Dear {name}</p>
                <br />
                <p>
                    <span>
                        Despite military, scientific, and political statements to the contrary, we believe that UFOs or
                        UAPs do not represent a threat of any kind to national or global security or humanity at large.
                    </span>
                </p>
                <p>
                    <span>
                        There is overwhelming and well-researched evidence and thousands of eyewitness accounts that
                        these objects have been present throughout Earth's history without detrimental effect on the
                        day-to-day affairs of humanity.
                    </span>
                </p>
                <p>
                    <span>
                        Without supporting or promoting any related conspiracy theories, we believe that certain
                        organizations are withholding knowledge of this phenomenon out of an irrational fear and for
                        self- serving reasons. It's time for the secrets to end and a program of transparent public
                        education to begin in service to humanity.
                    </span>
                </p>
                <p>
                    <span>
                        Therefore, we respectfully, but strongly request that you, in your official capacity,
                        immediately and publicly disclose and release, within one year from your receipt of this letter,
                        any and all information in your possession, or that you are aware of being in another person's
                        possession, regarding UFOs, UAPs, and any and all indications of extraterrestrial life,
                        activities, and technologies, and that you publicly state your support for the complete release
                        of all such information without limitation, editing, redaction, ridicule, or falsification.
                    </span>
                </p>
                <p>
                    <span>
                        Please be aware the members of this social movement intend to vote for and elect only those
                        leaders and representatives who publicly and actively support and promote such disclosure and,
                        with our votes, replace all officials who do not. Thank you.
                    </span>
                </p>
                <br />
                <p style={{ textIndent: 0 }}>
                    <i>- The Interstellar Alliance Social Experiment Group</i>
                </p>
            </div>
        </div>
    );
};

export default LetterEnglish;
