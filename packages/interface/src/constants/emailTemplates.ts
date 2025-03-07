import { KeyOfTemplatesHTML, Subjects } from "../types/typesI3C";

export const subjects: Subjects = {
    English: [
        "The Interstellar Alliance Social Experiment Group",
        "Public Disclosure of UFO/UAP Information",
        "Call for Transparency on UFOs and Extraterrestrial Evidence",
        "End UFO secrets Now, begin public education",
        "Petition for Immediate UFO/UAP Disclosure within One year",
        "A plea for Openness: UFOs Pose No Threat",
        "Time for Truth: Release All UFO/UAP Data",
        "Interstellar Alliance: UFO Secrets Must End Now",
        "Custom Subject",
    ],
    Norwegian: [
        "Åpenhet og offentliggjøring av UAP informasjon",
        "Støtt frigjøringen av UAP-informasjon",
        "Offentliggjøring av informasjon angående UAP",
        "Krav om offentliggjøring av UAP-informasjon",
        "Tilpasset Emne",
    ],
};

export const templatesHTML = {
    English: `<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8" lang="no" />
    <style>
      p {
        font: 14px Arial;
        margin: 0px;
        text-indent: 33px;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div>
      <p style="text-indent: 0px">Dear {{name}}</p>
      <br />
      <br />
      <p>
        <span>
          Despite military, scientific, and political statements to the contrary, we believe that UFOs or UAPs do not
          represent a threat of any kind to national or global security or humanity at large.</span
        >
      </p>
      <br />
      <p>
        <span>
          There is overwhelming and well-researched evidence and thousands of eyewitness accounts that these objects
          have been present throughout Earth's history without detrimental effect on the day-to-day affairs of
          humanity.</span
        >
      </p>
      <br />
      <p>
        <span>
          Without supporting or promoting any related conspiracy theories, we believe that certain organizations are
          withholding knowledge of this phenomenon out of an irrational fear and for self- serving reasons. It's time
          for the secrets to end and a program of transparent public education to begin in service to humanity.</span
        >
      </p>
      <br />
      <p>
        <span>
          Therefore, we respectfully, but strongly request that you, in your official capacity, immediately and publicly
          disclose and release, within one year from your receipt of this letter, any and all information in your
          possession, or that you are aware of being in another person's possession, regarding UFOs, UAPs, and any and
          all indications of extraterrestrial life, activities, and technologies, and that you publicly state your
          support for the complete release of all such information without limitation, editing, redaction, ridicule, or
          falsification.</span
        >
      </p>
      <br />
      <p>
        <span>
          Please be aware the members of this social movement intend to vote for and elect only those leaders and
          representatives who publicly and actively support and promote such disclosure and, with our votes, replace all
          officials who do not. Thank you.</span
        >
      </p>
      <br />
      <br />
      <p style="text-indent: 0px">
        <i>- The Interstellar Alliance Social Experiment Group</i>
      </p>
    </div>
  </body>
</html>`,

    Norwegian: `<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8" lang="no" />
    <style>
      p {
        font: 14px Arial;
        margin: 0px;
        text-indent: 33px;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div>
      <p style="text-indent: 0px">Til {{name}}</p>
      <br />
      <br />
      <p>
        <span>
          Til tross for at det finnes militære, vitenskapelige og politiske uttalelser som påstår det motsatte, er vi av
          den oppfatning at UFOer eller UAPer ikke på noen måte utgjør en trussel mot hverken nasjonal eller global
          sikkerhet, eller mot menneskeheten som sådan.</span
        >
      </p>
      <br />
      <p>
        <span>
          Det foreligger overveldende og godt dokumenterte bevis samt tusenvis av øyenvitneskildringer som viser at
          disse objektene har vært til stede gjennom hele verdenshistorien uten skadelig effekt på menneskelige
          aktiviteter.</span
        >
      </p>
      <br />
      <p>
        <span>
          Uten å støtte eller fremme relaterte konspirasjonsteorier, mener vi at enkelte organisasjoner tilbakeholder
          kunnskap om dette fenomenet på grunn av irrasjonell frykt og egne interesser. Tiden er kommet for å gjøre
          slutt på hemmelighold og starte et program for transparent folkeopplysning til beste for menneskeheten.</span
        >
      </p>
      <br />
      <p>
        <span>
          Vi anmoder derfor respektfullt, men på det sterkeste, at du i egenskap av din stilling umiddelbart
          offentliggjør og gir innsyn i all informasjon du selv er i besittelse av, eller som du vet andre er i
          besittelse av, om UFOer, UAPer og alle indikasjoner på utenomjordisk liv, aktiviteter og teknologier innen ett
          år fra du mottar dette brevet, samt at du offentlig uttrykker din støtte for at alle slike opplysninger skal
          offentliggjøres, uten noen form for begrensning, redigering, sladding, latterliggjøring eller
          forfalskning.</span
        >
      </p>
      <br />
      <p>
        <span>
          Vi ber deg være oppmerksom på at medlemmene av denne sosiale bevegelsen har til hensikt å kun stemme på og
          velge ledere og representanter som offentlig og aktivt støtter og fremmer slik offentliggjøring, og med vår
          stemmegiving erstatte alle myndighetspersoner som ikke gjør det. Takk for din oppmerksomhet.</span
        >
      </p>
      <br />
      <br />
      <p style="text-indent: 0px">
        <i>- The Interstellar Alliance Social Experiment Group</i>
      </p>
    </div>
  </body>
</html>
`,
};

export const emailTemplates: Record<KeyOfTemplatesHTML, string> = templatesHTML;
