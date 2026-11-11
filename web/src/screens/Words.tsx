// Rotaract words: the glossary, sorted for the language, with a letter before each new initial, filtered as you type.
import { useState } from "react";
import type { ScreenProps } from "../App";
import { LOCALE, t, tx } from "../i18n";
import { fold } from "../lib/filters";
import { Footer, HelpLinks, useStickyHeads, useTitle, useWash } from "../components";

/** the letter heading of a word: accents folded away ("Ö" files under O) */
const initial = (w: string) => fold(w[0]).toUpperCase();

export default function Words(_props: ScreenProps) {
  const nm = tx("nm");
  const [q, setQ] = useState("");
  useWash("#009739", "#0067c8", "#d41367");
  useStickyHeads();
  useTitle(nm.words_h);
  const rows = nm.words.slice().sort((a, b) => a[0].localeCompare(b[0], LOCALE));
  const needle = fold(q.trim());
  // the old page matched against the row's textContent: word and meaning run together
  const shown = rows.map(([w, d]) => fold(w + d).includes(needle));
  const n = shown.filter(Boolean).length;
  return (
    <main className="wrap fam" id="main">
      <h1 id="h">{nm.words_h}</h1>
      <p className="lead" id="lead">{nm.words_sub}</p>
      {/* uncontrolled, as before: no value attribute in the DOM */}
      <input className="wsearch" type="search" id="q" autoComplete="off" placeholder={nm.words_ph} aria-label={nm.words_ph} onChange={ev => setQ(ev.target.value)} />
      <dl className="gloss glass" id="gloss" hidden={!n}>
        {rows.map(([w, d], i) => {
          const prev = rows[i - 1];
          const letter = !prev || initial(w) !== initial(prev[0]);
          return (
            <Row key={w} w={w} d={d} hidden={!shown[i]} letter={letter ? initial(w) : null} letterHidden={!!needle} />
          );
        })}
      </dl>
      <p className="fine" id="none" hidden={!!n}>{nm.words_none}</p>
      <h2 className="sh lv1" data-t="read_on">{t("read_on")}</h2>
      <div id="more"><HelpLinks keys={["guide", "family"]} /></div>
      <div id="foot"><Footer /></div>
    </main>
  );
}

/** one word, preceded by its letter when it starts a new one; the letters go while searching */
function Row({ w, d, hidden, letter, letterHidden }: { w: string; d: string; hidden: boolean; letter: string | null; letterHidden: boolean }) {
  return (
    <>
      {letter ? <div className="ltr" aria-hidden="true" hidden={letterHidden}>{letter}</div> : null}
      <div hidden={hidden}><dt>{w}</dt><dd>{d}</dd></div>
    </>
  );
}
