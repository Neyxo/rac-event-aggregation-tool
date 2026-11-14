// The map: every event with coordinates as a club-coloured dot on the swisstopo map, filling the screen between the bars.
// Leaflet owns div#map; React only renders the option label under it and tells Leaflet what to draw.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ScreenProps } from "../../App";
import { nEvents, t } from "../../i18n";
import { BRAND, onColor } from "../../lib/color";
import { club } from "../../lib/data";
import { fmt, isPast } from "../../lib/dates";
import { SWISSTOPO_GREY } from "../../lib/geo";
import { href } from "../../lib/route";
import type { Event } from "../../lib/types";
import { EventCard, Popup, useData } from "../../components";

/** Easter egg: the bunker's archive holds the past events, newest first; the popup shows the latest FILES of them */
export const archive = (events: Event[]): Event[] =>
  events.filter(isPast).sort((a, b) => +new Date(b.start) - +new Date(a.start));
const FILES = 30;

/** the dot: an HTML string, because Leaflet's divIcon takes markup */
function dotHtml(e: Event): string {
  const c = club(e.clubs[0] ?? "");
  const color = c.color || BRAND.cranberry;
  const logo = c.logo ? `<img src="${c.logo}" alt="">` : "";
  return `<span style="--c:${color};--on-c:${onColor(color)}">${logo}</span>`;
}

/** the popup: a DOM node, so the title needs no escaping */
function popupLink(e: Event): HTMLElement {
  const a = document.createElement("a");
  a.className = "mappop";
  a.href = href("event", e.id);
  const b = document.createElement("b");
  b.textContent = e.title;
  const s = document.createElement("span");
  s.textContent = `${fmt.dm.format(new Date(e.start))} · ${club(e.clubs[0] ?? "").short}`;
  a.append(b, s);
  return a;
}

export default function MapScreen({ route }: ScreenProps) {
  const D = useData();
  // kept in the history entry, so back/forward brings it back as a browser restores a form field
  const [past, setPast] = useState(() => !!(history.state as { past?: boolean } | null)?.past);
  const [count, setCount] = useState<number | null>(null);
  // #/map?bunker (the developer screen's link) starts at the bunker with its archive open
  const [bunker, setBunker] = useState(() => route.query.has("bunker"));
  const box = useRef<HTMLDivElement>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Switzerland & Liechtenstein, no zooming out to space
    const map = L.map(box.current!, {
      minZoom: 7,
      maxBounds: [
        [45, 4.5],
        [48.6, 12],
      ],
      maxBoundsViscosity: 1,
    }).setView([46.9, 8.2], 8);
    // the grey national map, so the markers carry the colour
    L.tileLayer(SWISSTOPO_GREY, { maxZoom: 18, attribution: "© swisstopo" }).addTo(map);
    layer.current = L.layerGroup().addTo(map);
    // Easter egg: the Röstigraben, a faint dashed line once you zoom in. Roughly the language border from Biel/Bienne to Sierre/Siders.
    // Two lines: the one you see, and an invisible wide one under it so a finger can hit it.
    const pts: L.LatLngTuple[] = [
      [47.14, 7.25],
      [47.05, 7.09],
      [46.93, 7.12],
      [46.81, 7.16],
      [46.7, 7.14],
      [46.61, 7.24],
      [46.48, 7.2],
      [46.36, 7.22],
      [46.29, 7.53],
    ];
    const graben = L.featureGroup([
      L.polyline(pts, { weight: 24, opacity: 0 }),
      L.polyline(pts, { color: BRAND.cranberry, weight: 3, opacity: 0.45, dashArray: "2 9", interactive: false }),
    ]).bindPopup("Röstigraben 🥔");
    // Easter egg: a small bunker door in the Gotthard, where the fortress museum Sasso San Gottardo is. It opens the classified archive (below).
    const door = L.marker([46.556, 8.565], {
      title: t("bunker"),
      icon: L.divIcon({
        className: "mapbunker",
        iconSize: [38, 38],
        html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 21 9 6l4 6 2-3 8 12z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/></svg>',
      }),
    }).on("click", () => setBunker(true));
    const eggs = L.layerGroup([graben, door]);
    map.on("zoomend", () => {
      if (map.getZoom() >= 10) eggs.addTo(map);
      else eggs.remove();
    });
    if (bunker) map.setView(door.getLatLng(), 11, { animate: false });
    return () => {
      map.remove();
      layer.current = null;
    };
  }, []);

  useEffect(() => {
    const group = layer.current;
    if (!group) return;
    group.clearLayers();
    let n = 0;
    for (const e of D.data.events) {
      if (!e.coords || (!past && isPast(e))) continue;
      n++;
      const icon = L.divIcon({ className: "mapdot", iconSize: [32, 32], popupAnchor: [0, -14], html: dotHtml(e) });
      L.marker(e.coords, { title: e.title, icon }).bindPopup(popupLink(e)).addTo(group);
    }
    setCount(n);
  }, [past]);

  return (
    <main className="mapwrap">
      <div id="map" ref={box} />
      <label className="icon-btn mapopt">
        <input
          type="checkbox"
          checked={past}
          onChange={(ev) => {
            setPast(ev.target.checked);
            history.replaceState({ ...(history.state as object | null), past: ev.target.checked }, "");
          }}
        />{" "}
        <span>{t("v_past")}</span>
        {" · "}
        <span>{count === null ? "" : nEvents(count)}</span>
      </label>
      {bunker && <Bunker events={archive(D.data.events)} onClose={() => setBunker(false)} />}
    </main>
  );
}

/** the classified archive: the past events as the usual event cards, in the bunker's skin (app.css .bunker: typewriter type, army green,
 *  a file number and a stamp on each). The stamps are decoration. */
function Bunker({ events, onClose }: { events: Event[]; onClose: () => void }) {
  return (
    <Popup title={t("bunker_title")} onClose={onClose} className="ob full bunker">
      <p>
        <i className="stamp" aria-hidden="true">
          {t("bunker_stamp")}
        </i>
        {t("bunker_n", { n: events.length })}
        {events.length > FILES ? " " + t("bunker_cap", { m: FILES }) : ""}
      </p>
      <div className="files" style={{ "--stamp": JSON.stringify(t("bunker_stamp")) } as CSSProperties}>
        {events.slice(0, FILES).map((e) => (
          <EventCard key={e.id} e={e} />
        ))}
      </div>
    </Popup>
  );
}
