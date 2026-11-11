// @vitest-environment node
// static/sw.js, run in a vm with a fake cache and network.
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import SRC from "../static/sw.js?raw";

const BASE = "https://x.test/app/";
type Handler = (e: { request: Request; respondWith?: (p: Promise<Response>) => void; waitUntil?: (p: Promise<unknown>) => void }) => void;

const INDEX = '<script type="module" crossorigin src="./assets/index-abc.js"></script><link rel="modulepreload" crossorigin href="./assets/rt-1.js"><link rel="stylesheet" crossorigin href="./assets/index-abc.css">';
let handlers: Record<string, Handler>, stores: Map<string, Map<string, Response>>, net: Mock<(r: Request | string) => Promise<Response>>, now: number;
function cacheOf(name: string) {
  if (!stores.has(name)) stores.set(name, new Map());
  const m = stores.get(name)!, key = (r: Request | string, o?: { ignoreSearch?: boolean }) => { const u = new URL(typeof r === "string" ? r : r.url, BASE); if (o?.ignoreSearch) u.search = ""; return u.href; };
  return {
    match: async (r: Request | string, o?: { ignoreSearch?: boolean }) => o?.ignoreSearch ? [...m].find(([k]) => key(k, o) === key(r, o))?.[1].clone() : m.get(key(r))?.clone(),
    put: async (r: Request | string, res: Response) => { m.set(key(r), res); },
    addAll: async (rs: (Request | string)[]) => { for (const r of rs) m.set(key(r), new Response(key(r).endsWith("index.html") ? INDEX : "shell")); },
  };
}
beforeEach(() => {
  handlers = {}; stores = new Map(); now = 1e12;
  net = vi.fn(async (r: Request | string) => new Response("net:" + (typeof r === "string" ? r : r.url), { status: 200 }));
  const env: Record<string, unknown> = {
    self: { addEventListener: (k: string, f: Handler) => { handlers[k] = f; }, skipWaiting: () => {}, clients: { claim: async () => {} } },
    caches: { open: async (n: string) => cacheOf(n), keys: async () => [...stores.keys()], delete: async (n: string) => stores.delete(n) },
    fetch: (...a: [Request | string]) => net(...a), location: new URL(BASE + "sw.js"), Date: { now: () => now },
    // relative to the worker's location, as in a browser
    Request: class extends Request { constructor(u: string | Request, o?: RequestInit) { super(typeof u === "string" ? new URL(u, BASE).href : u, o); } }, Response, Headers, URL,
  };
  new Function(...Object.keys(env), SRC)(...Object.values(env));
});
async function get(url: string, mode: RequestMode = "cors"): Promise<Response | undefined> {
  let p: Promise<Response> | undefined;
  const request = { url: new URL(url, BASE).href, method: "GET", mode } as Request;
  handlers.fetch!({ request, respondWith: x => { p = x; } });
  return p;
}

describe("service worker", () => {
  it("answers events.json from the cache for 30 minutes, then asks the network again", async () => {
    expect(await (await get("events.json?x=1"))!.text()).toBe("net:" + BASE + "events.json");
    now += 29 * 60e3;
    expect(await (await get("events.json"))!.text()).toBe("net:" + BASE + "events.json");
    expect(net).toHaveBeenCalledTimes(1);
    now += 2 * 60e3;
    await get("status.json"); await get("events.json");
    expect(net).toHaveBeenCalledTimes(3);
  });
  it("never caches a failed response, and keeps the old copy when the server errs or is offline", async () => {
    net.mockResolvedValueOnce(new Response("err", { status: 500 }));
    expect((await get("events.json"))!.status).toBe(500);
    expect(stores.get("rac-app")?.size ?? 0).toBe(0);
    await get("events.json"); now += 60 * 60e3;
    net.mockResolvedValueOnce(new Response("err", { status: 502 }));
    expect(await (await get("events.json"))!.text()).toBe("net:" + BASE + "events.json");
    net.mockRejectedValueOnce(new TypeError("offline"));
    expect((await get("events.json"))!.status).toBe(200);
    net.mockResolvedValueOnce(new Response("gone", { status: 404 }));
    await get("e/1.html");
    expect([...stores.get("rac-app")!.keys()]).toEqual([BASE + "events.json"]);
  });
  it("leaves other origins and non-GET requests alone", async () => {
    expect(await get("https://api3.geo.admin.ch/x")).toBeUndefined();
    let called = false;
    handlers.fetch!({ request: { url: BASE + "events.json", method: "POST" } as Request, respondWith: () => { called = true; } });
    expect(called).toBe(false);
  });
  it("hashed assets come from the cache; pages go to the network first; offline ?lang= gets the cached app", async () => {
    await get("assets/index-abc.js"); await get("assets/index-abc.js");
    expect(net).toHaveBeenCalledTimes(1);
    await get("./", "navigate");
    net.mockRejectedValue(new TypeError("offline"));
    expect(await (await get("./?lang=de", "navigate"))!.text()).toBe("net:" + BASE);
  });
  it("install also caches what the first page loaded before the worker ran: index.html's assets and the data", async () => {
    let p: Promise<unknown> | undefined;
    handlers.install!({ request: {} as Request, waitUntil: x => { p = x; } });
    await p;
    const keys = [...stores.get("rac-app")!.keys()];
    for (const k of ["index.html", "assets/index-abc.js", "assets/rt-1.js", "assets/index-abc.css", "events.json", "status.json"]) expect(keys).toContain(BASE + k);
    // so a second load within 30 minutes doesn't touch the network for the data
    net.mockClear();
    await get("events.json");
    expect(net).not.toHaveBeenCalled();
  });
});
