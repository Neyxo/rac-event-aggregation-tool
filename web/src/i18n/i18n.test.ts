import { describe, expect, it } from "vitest";
import { I18N, nEvents, pickLang, t, tx } from ".";
import be from "./be";

describe("pickLang", () => {
  it("prefers ?lang=, then the saved choice, then the device", () => {
    expect(pickLang("?lang=fr", "de", "it-CH")).toBe("fr");
    expect(pickLang("", "de", "it-CH")).toBe("de");
    expect(pickLang("", null, "it-CH")).toBe("it");
    expect(pickLang("", null, undefined)).toBe("en");
  });
  it("ignores unknown languages", () => {
    expect(pickLang("?lang=xx", "es", "pt-BR")).toBe("en");
    expect(pickLang("?lang=xx", 42, "de-DE")).toBe("de");
    expect(pickLang("?lang=toString", "constructor", "en")).toBe("en");
  });
});

describe("t", () => {
  it("fills every {var}", () => {
    expect(t("n_events", { n: 3 })).toBe("3 events");
    expect(nEvents(1)).toBe(t("one_event"));
    expect(nEvents(0)).toBe("0 events");
  });
  it("reads structured values with tx", () => {
    expect(tx("dow")).toHaveLength(7);
    expect(tx("nm").words.every((w) => w.length === 2)).toBe(true);
  });
});

describe("every language", () => {
  const shape = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map((x) => (Array.isArray(x) ? x.length : typeof x));
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)]));
    return typeof v;
  };
  for (const l of ["de", "fr", "it"] as const)
    it(`${l} has the same keys and list shapes as en`, () => {
      expect(Object.keys(I18N[l]).sort()).toEqual(Object.keys(I18N.en).sort());
      for (const k of Object.keys(I18N.en) as (keyof typeof I18N.en)[]) {
        const a = I18N.en[k];
        const b = I18N[l][k];
        if (Array.isArray(a)) expect((b as unknown[]).length, `${l}:${k}`).toBe(a.length);
        else if (typeof a === "object")
          expect(Object.keys(shape(b) as object).sort(), `${l}:${k}`).toEqual(Object.keys(shape(a) as object).sort());
      }
    });
  it("keeps the placeholders of each string", () => {
    for (const l of ["de", "fr", "it"] as const)
      for (const [k, v] of Object.entries(I18N.en)) {
        if (typeof v !== "string") continue;
        const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
        expect(vars(I18N[l][k as keyof typeof I18N.en] as string), `${l}:${k}`).toEqual(vars(v));
      }
  });
  it("Bärndütsch only overrides German: same placeholders and list lengths", () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const [k, v] of Object.entries(be)) {
      const d = I18N.de[k as keyof typeof I18N.de];
      if (typeof v === "string") expect(vars(v), k).toEqual(vars(d as string));
      else expect((v as unknown[]).length, k).toBe((d as unknown[]).length);
    }
  });
  it("writes Swiss German (ss, never ß)", () => {
    expect(JSON.stringify(I18N.de)).not.toContain("ß");
  });
  it("translates the developer keys", () => {
    for (const l of ["de", "fr", "it"] as const)
      for (const k of ["dev_h", "dev_mode", "dev_page", "dev_on"] as const) expect(I18N[l][k]).not.toBe(I18N.en[k]);
  });
});
