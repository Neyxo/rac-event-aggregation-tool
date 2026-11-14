// About this app: the calendar first, then what the app shows, what it can't, your data, questions. Static text, no events needed.
import type { ScreenProps } from "../App";
import { t, tx, type Pair } from "../i18n";
import { BRAND, BRAND3, vars } from "../lib/color";
import { Footer, HelpLinks, Icon, QaList, Sh, useWash, type IconName } from "../components";

const KNOW_IC: IconName[] = ["refresh", "ext", "offline", "belloff"];

export default function Public(_props: ScreenProps) {
  useWash(BRAND.azure, BRAND.green, BRAND.cranberry);
  const qa: Pair[] = [[t("pub_why_h"), t("pub_why")], ...tx("app_qa")];
  return (
    <main className="wrap fam">
      <h1>{t("app_h")}</h1>
      <p className="lead">{t("app_lead")}</p>
      <HelpLinks keys={["sub"]} />
      <Sh lv1>{t("app_know_h")}</Sh>
      <div className="tiles2" id="know">
        {/* titles only: nobody read the lines under them */}
        {tx("app_know").map((title, i) => <div key={i} className="ft slim glass" style={vars({ "--p": BRAND3[i % 3]! })}><div className="ic"><Icon name={KNOW_IC[i] ?? "info"} /></div><b>{title}</b></div>)}
      </div>
      <section className="box tint glass" style={vars({ "--p": BRAND.cranberry })}>
        <div className="bh"><div className="ic"><Icon name="eye" /></div><h2>{t("pub_h")}</h2></div>
        <ul>{tx("pub_no").map((s, i) => <li key={i}>{s}</li>)}</ul>
      </section>
      <section className="box tint glass" style={vars({ "--p": BRAND.green })}>
        <div className="bh"><div className="ic"><Icon name="shield" /></div><h2>{t("app_data_h")}</h2></div>
        <ul className="yes">{tx("app_data").map((s, i) => <li key={i}>{s}</li>)}</ul>
      </section>
      <Sh lv1>{t("faq")}</Sh>
      <section className="box glass"><div className="qa"><QaList items={qa} /></div></section>
      <p className="fine"><b>{t("cred_h")}</b>{" · "}<span>{t("cred")}</span></p>
      <p className="fine">
        <b>{t("wrong_h")}</b>{" "}<span>{t("wrong")}</span>{" "}
        <a href={__REPO__ + "/issues"} target="_blank" rel="noopener">{t("report")}</a>
      </p>
      <div id="foot"><Footer source /></div>
    </main>
  );
}
