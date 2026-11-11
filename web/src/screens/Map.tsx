// The map: every event with coordinates as a club-coloured dot on the swisstopo map, filling the screen between the bars.
// Leaflet owns div#map; React only renders the option label under it and tells Leaflet what to draw.
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ScreenProps } from "../App";
import { nEvents, t } from "../i18n";
import { onColor } from "../lib/color";
import { club } from "../lib/data";
import { fmt, isPast } from "../lib/dates";
import { href } from "../lib/route";
import type { Event } from "../lib/types";
import { LoadError, useData } from "../components";

// the grey national map, so the markers carry the colour (free, no key)
const SWISSTOPO = "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/{z}/{x}/{y}.jpeg";

/** the dot: an HTML string, because Leaflet's divIcon takes markup */
function dotHtml(e: Event): string {
  const c = club(e.clubs[0] ?? "");
  const color = c.color || "#d41367";
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

export default function MapScreen(_props: ScreenProps) {
  const { ready, error, D } = useData();
  // kept in the history entry, so back/forward brings it back as a browser restores a form field
  const [past, setPast] = useState(() => !!(history.state as { past?: boolean } | null)?.past);
  const [count, setCount] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  // the map is up (and its tiles loading) before the events arrive
  useEffect(() => {
    if (error) return;
    // Switzerland & Liechtenstein, no zooming out to space
    const map = L.map(box.current!, { minZoom: 7, maxBounds: [[45, 4.5], [48.6, 12]], maxBoundsViscosity: 1 }).setView([46.9, 8.2], 8);
    L.tileLayer(SWISSTOPO, { maxZoom: 18, attribution: "© swisstopo" }).addTo(map);
    layer.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      layer.current = null;
    };
  }, [error]);

  useEffect(() => {
    const group = layer.current;
    if (!ready || !group) return;
    group.clearLayers();
    let n = 0;
    for (const e of D.data.events) {
      if (!e.coords || (!past && isPast(e))) continue;
      n++;
      const icon = L.divIcon({ className: "mapdot", iconSize: [32, 32], popupAnchor: [0, -14], html: dotHtml(e) });
      L.marker(e.coords, { title: e.title, icon }).bindPopup(popupLink(e)).addTo(group);
    }
    setCount(n);
  }, [ready, past]);

  // events.json failed: the offline note in place of the screen, map included
  if (error) return <main className="mapwrap"><LoadError /></main>;
  return (
    <main className="mapwrap">
      <div id="map" ref={box} />
      <label className="icon-btn mapopt">
        <input type="checkbox" checked={past} onChange={ev => { setPast(ev.target.checked); history.replaceState({ ...(history.state as object | null), past: ev.target.checked }, ""); }} />
        {" "}
        <span>{t("v_past")}</span>
        {" · "}
        <span>{count === null ? "" : nEvents(count)}</span>
      </label>
    </main>
  );
}
