import "./boot";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import App from "./App";
import { LoadFailed } from "./lib/data";

// a failed events.json is an expected state (offline on a first visit), shown by the DataBoundary: not logged as an error
createRoot(document.getElementById("root")!, {
  onCaughtError: (error, info) => { if (!(error instanceof LoadFailed)) console.error(error, info.componentStack); },
}).render(<StrictMode><App /></StrictMode>);

// network first with a cache fallback, events.json from the cache for 30 minutes (static/sw.js); not in the dev server
if (import.meta.env.PROD && "serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
