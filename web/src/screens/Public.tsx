// About this app: what the app shows, what it can't, your data, questions. Static text, no events needed.
import type { ScreenProps } from "../App";
import { t, tx, type Pair } from "../i18n";
import { vars } from "../lib/color";
import { Footer, HelpLinks, Icon, QaList, useStickyHeads, useWash, type IconName } from "../components";

const COL = ["#d41367", "#0067c8", "#009739"];
const KNOW_IC: IconName[] = ["refresh", "ext", "offline", "belloff"];

/** a tile: icon in the colour p, title, one line */
function Tile({ title, text, ic, p }: { title: string; text: string; ic: IconName; p: string }) {
  return (
    <div className="ft glass" style={vars({ "--p": p })}>
      <div className="ic"><Icon name={ic} /></div>
      <b>{title}</b>
      <span>{text}</span>
    </div>
  );
}

export default function Public(_props: ScreenProps) {
  useWash("#0067c8", "#009739", "#d41367");
  useStickyHeads();
  const qa: Pair[] = [[t("pub_why_h"), t("pub_why")], ...tx("app_qa")];
  return (
    <main className="wrap fam" id="main">
      <h1>{t("app_h")}</h1>
      <p className="lead">{t("app_lead")}</p>
      <h2 className="sh lv1">{t("app_know_h")}</h2>
      <div className="tiles2" id="know">
        {tx("app_know").map(([title, text], i) => <Tile key={i} title={title} text={text} ic={KNOW_IC[i] ?? "info"} p={COL[i % 3]!} />)}
      </div>
      <section className="box tint glass" style={vars({ "--p": "#d41367" })}>
        <div className="bh" id="pubH"><div className="ic"><Icon name="eye" /></div><h2>{t("pub_h")}</h2></div>
        <p>{t("pub_lead")}</p>
        <ul id="no">{tx("pub_no").map((s, i) => <li key={i}>{s}</li>)}</ul>
        <p>{t("pub_do")}</p>
      </section>
      <section className="box tint glass" style={vars({ "--p": "#009739" })}>
        <div className="bh" id="dataH"><div className="ic"><Icon name="shield" /></div><h2>{t("app_data_h")}</h2></div>
        <ul className="yes" id="data">{tx("app_data").map((s, i) => <li key={i}>{s}</li>)}</ul>
      </section>
      <h2 className="sh lv1">{t("faq")}</h2>
      <section className="box glass"><div className="qa" id="qa"><QaList items={qa} /></div></section>
      <div id="more"><HelpLinks keys={["sub"]} /></div>
      <p className="fine"><b>{t("cred_h")}</b>{" · "}<span>{t("cred")}</span></p>
      <p className="fine">
        <b>{t("wrong_h")}</b>{" "}<span>{t("wrong")}</span>{" "}
        <a href="https://github.com/Neyxo/rac-event-aggregation-tool/issues" target="_blank" rel="noopener">{t("report")}</a>
      </p>
      <div id="foot"><Footer source /></div>
    </main>
  );
}
