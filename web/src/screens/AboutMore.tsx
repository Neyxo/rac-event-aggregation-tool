// Rotary, districts & the world: three full-bleed visuals, each with a frosted pane carrying one line, then links.
// The two maps are pictures, not tools: no controls, no dragging.
import { useEffect, useRef } from "react";
import type { ScreenProps } from "../App";
import { t } from "../i18n";
import { isRac, nClubs } from "../lib/data";
import { SWISSTOPO_GREY } from "../lib/geo";
import type { Club, Coords } from "../lib/types";
import { CtaBlock, Footer, HelpLinks, PillarPic, useData, useWash } from "../components";
import { BRAND, DISTRICT_IDS, DISTRICTS, isDistrict } from "../lib/color";

// dots on major cities, illustrating the worldwide network
const CITIES: Coords[] = [[47, 8], [51.5, -0.1], [40.7, -74], [34, -118], [19.4, -99], [-23.5, -46.6], [-34.6, -58.4], [30, 31.2], [-1.3, 36.8], [-26.2, 28], [6.5, 3.4], [28.6, 77.2], [19, 72.8], [1.3, 103.8], [35.7, 139.7], [37.6, 127], [31.2, 121.5], [-33.9, 151.2], [-37.8, 145], [41.9, 12.5], [48.9, 2.3], [52.5, 13.4], [55.8, 37.6], [-12, -77], [4.7, -74.1], [25.3, 55.3], [14.6, 121], [-6.2, 106.8], [13.8, 100.5], [45.4, -75.7]];

/** Leaflet is loaded here on demand, so the other screens never fetch it; returns the cleanup */
function drawMaps(swiss: HTMLElement, world: HTMLElement, clubs: Club[]): () => void {
  let maps: { remove(): void }[] = [];
  let gone = false;
  void Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")]).then(([{ default: L }]) => {
    if (gone) return;
    const opts = { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, touchZoom: false, doubleClickZoom: false, keyboard: false };
    const m1 = L.map(swiss, opts);
    L.tileLayer(SWISSTOPO_GREY, { maxZoom: 18 }).addTo(m1);
    const pts = clubs.filter(c => c.coords && isRac(c));
    for (const c of pts) L.circleMarker(c.coords!, { radius: 7, color: "#fff", weight: 2, fillColor: isDistrict(c.district) ? DISTRICTS[c.district].color : BRAND.cranberry, fillOpacity: 1 }).addTo(m1).bindTooltip(c.name);
    // the pane covers the bottom
    m1.fitBounds(pts.map(c => c.coords!), { paddingTopLeft: [24, 24], paddingBottomRight: [24, 150] });
    const m2 = L.map(world, opts).setView([22, 10], 1);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 5 }).addTo(m2);
    for (const p of CITIES) L.circleMarker(p, { radius: 4, color: "#fff", weight: 1, fillColor: BRAND.cranberry, fillOpacity: .95 }).addTo(m2);
    maps = [m1, m2];
  });
  return () => {
    gone = true;
    maps.forEach(m => m.remove());
  };
}

export default function AboutMore(_props: ScreenProps) {
  const D = useData();
  useWash(BRAND.azure, BRAND.green, BRAND.cranberry);
  const swiss = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  useEffect(() => drawMaps(swiss.current!, world.current!, D.data.clubs), []);

  return (
    <main className="wrap more">
      <h1>{t("ab_more")}</h1>
      <section className="vis">
        {/* a club photo, not a cropped event poster */}
        <PillarPic k="help" className="bg" />
        <div className="pane">
          <img className="wheel" src="rotaract.svg" alt="Rotaract" />
          <b>{t("sp_rotary")}</b>
          <span>{t("sp_rotary_t")}</span>
        </div>
      </section>
      <section className="vis map">
        <div className="bg" ref={swiss} />
        <div className="pane">
          <b>{t("sp_dist", { n: nClubs() })}</b>
          <span>{t("sp_dist_t")}</span>
          <div className="leg">
            {DISTRICT_IDS.map(d => <span key={d} style={{ color: DISTRICTS[d].color }}>{"D" + d}</span>)}
          </div>
        </div>
      </section>
      <section className="vis map">
        <div className="bg" ref={world} />
        <div className="pane">
          <b>{t("sp_world")}</b>
          <span>{t("sp_world_t")}</span>
        </div>
      </section>
      <HelpLinks keys={["intl", "family", "guide"]} />
      <CtaBlock />
      <div id="foot"><Footer /></div>
    </main>
  );
}
