// The Rotary family: one tile per part of Rotary (logo or icon, name, half a sentence), then the Rotaract clubs per district.
import { Fragment, useState } from "react";
import type { ScreenProps } from "../App";
import { t, tx } from "../i18n";
import { isRac } from "../lib/data";
import { clubVars, vars } from "../lib/color";
import { href } from "../lib/route";
import { ClubMark, Footer, Icon, LoadError, useData, useStickyHeads, useWash, type IconName } from "../components";

// logos in static/img/fam (Rotary and RYLA from Wikimedia Commons, Interact from Commons, Rotex and Inner Wheel from their sites);
// the icon stands in where there is none yet, or when the file fails to load
const MARKS: { icon: IconName; color: string; logo: string }[] = [
  { icon: "wheel", color: "#0067c8", logo: "img/fam/rotary.svg" },
  { icon: "users", color: "#d41367", logo: "rotaract.svg" },
  { icon: "book", color: "#009739", logo: "img/fam/interact.png" },
  { icon: "plane", color: "#0067c8", logo: "img/fam/rotex.svg" },
  { icon: "flag", color: "#d41367", logo: "img/fam/ryla.png" },
  { icon: "rings", color: "#009739", logo: "img/fam/innerwheel.png" },
  { icon: "heart", color: "#0067c8", logo: "" },  // no Rotary Foundation logo yet: the icon (a missing file is a 404 on every visit)
  { icon: "pin", color: "#d41367", logo: "" },
];
const DISTRICTS = ["1980", "1990", "2000"] as const;
const DISTRICT_KEY = { "1980": "d1980", "1990": "d1990", "2000": "d2000" } as const;

function Mark({ icon, logo }: { icon: IconName; logo: string }) {
  const [failed, setFailed] = useState(false);
  if (!logo || failed) return <div className="ic"><Icon name={icon} /></div>;
  return <img className="logo" src={logo} alt="" onError={() => setFailed(true)} />;
}

function Tiles() {
  return (
    <div className="tiles2" id="tiles">
      {tx("fam").map(([name, text], i) => (
        <div key={i} className="ft glass" style={vars({ "--p": MARKS[i]!.color })}>
          <Mark icon={MARKS[i]!.icon} logo={MARKS[i]!.logo} />
          <b>{name}</b>
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}

function Districts() {
  const { D } = useData();
  return (
    <>
      {DISTRICTS.map(d => (
        <Fragment key={d}>
          <h3 className="sh">{t(DISTRICT_KEY[d])}</h3>
          <div className="tiles">
            {D.data.clubs.filter(c => c.district === d && isRac(c)).map(c => (
              <a key={c.id} className="tile" href={href("club", c.id)} style={clubVars(c.color)}><ClubMark c={c} /><b>{c.short}</b></a>
            ))}
          </div>
        </Fragment>
      ))}
    </>
  );
}

export default function Family(_props: ScreenProps) {
  const { ready, error } = useData();
  useWash("#0067c8", "#009739", "#d41367");
  useStickyHeads();
  if (error) return <main className="wrap fam" id="main"><LoadError /></main>;
  return (
    <main className="wrap fam" id="main">
      <h1>{t("fam_h")}</h1>
      <p className="lead">{t("fam_lead")}</p>
      <Tiles />
      <h2 className="sh lv1">{t("fam_clubs")}</h2>
      <div id="dist">{ready && <Districts />}</div>
      <div id="foot">{ready && <Footer />}</div>
    </main>
  );
}
