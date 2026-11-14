import "./boot";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import App from "./App";
import { LoadFailed } from "./lib/data";

// a failed events.json is an expected state (offline on a first visit), shown by the DataBoundary: not logged as an error
createRoot(document.getElementById("root")!, {
  onCaughtError: (error, info) => {
    if (!(error instanceof LoadFailed)) console.error(error, info.componentStack);
  },
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// a hello for whoever opens the console: the Rotaract wheel and where the code lives. Not under vitest.
if (import.meta.env.MODE !== "test")
  console.log(
    String.raw`%c
     _.-^-^-^-._
   <'   \   /   '>
  <   ---(o)---   >
   <.   /   \   .>
     '-.v.v.v.-'
%cRotaract Events: hello, curious one! The code is open, come and look:
${__REPO__}`,
    "color:#d41367;font-weight:bold",
    "",
  );

// network first with a cache fallback, events.json from the cache for 30 minutes (static/sw.js); not in the dev server
if (import.meta.env.PROD && "serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
