// The Rotary family: one tile per part of Rotary (logo or icon, name, half a sentence), then the Rotaract clubs per district.
import { Fragment, useState } from "react";
import type { ScreenProps } from "../../App";
import { t, tx } from "../../i18n";
import { isRac } from "../../lib/data";
import { BRAND, clubVars, DISTRICT_IDS, DISTRICTS, vars } from "../../lib/color";
import { href } from "../../lib/route";
import { ClubMark, Footer, Icon, useData, Sh, useWash, type IconName } from "../../components";

// logos in static/img/fam (Rotary and Interact from Wikimedia Commons, RYLA from rotary-ribi.org, Rotex and Inner Wheel from their sites);
// the icon stands in where there is none yet, or when the file fails to load
const MARKS: { icon: IconName; color: string; logo: string }[] = [
  { icon: "wheel", color: BRAND.azure, logo: "img/fam/rotary.svg" },
  { icon: "users", color: BRAND.cranberry, logo: "rotaract.svg" },
  { icon: "book", color: BRAND.green, logo: "img/fam/interact.png" },
  { icon: "plane", color: BRAND.azure, logo: "img/fam/rotex.svg" },
  { icon: "flag", color: BRAND.cranberry, logo: "img/fam/ryla.png" },
  { icon: "rings", color: BRAND.green, logo: "img/fam/innerwheel.png" },
  { icon: "heart", color: BRAND.azure, logo: "" }, // no Rotary Foundation logo yet: the icon (a missing file is a 404 on every visit)
  { icon: "pin", color: BRAND.cranberry, logo: "" },
];

function Mark({ icon, logo }: { icon: IconName; logo: string }) {
  const [failed, setFailed] = useState(false);
  if (!logo || failed)
    return (
      <div className="ic">
        <Icon name={icon} />
      </div>
    );
  return <img className="logo" src={logo} alt="" onError={() => setFailed(true)} />;
}

function Tiles() {
  return (
    <div className="tiles2">
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
  const D = useData();
  return (
    <>
      {DISTRICT_IDS.map((d) => (
        <Fragment key={d}>
          <Sh>{t(DISTRICTS[d].key)}</Sh>
          <div className="tiles">
            {D.data.clubs
              .filter((c) => c.district === d && isRac(c))
              .map((c) => (
                <a key={c.id} className="tile" href={href("club", c.id)} style={clubVars(c.color)}>
                  <ClubMark c={c} />
                  <b>{c.short}</b>
                </a>
              ))}
          </div>
        </Fragment>
      ))}
    </>
  );
}

export default function Family(_props: ScreenProps) {
  useWash(BRAND.azure, BRAND.green, BRAND.cranberry);
  return (
    <main className="wrap fam">
      <h1>{t("fam_h")}</h1>
      <Tiles />
      <Sh lv1>{t("fam_clubs")}</Sh>
      {/* a box of its own: the district headings stop sticking where the clubs end */}
      <div>
        <Districts />
      </div>
      <div id="foot">
        <Footer />
      </div>
    </main>
  );
}
