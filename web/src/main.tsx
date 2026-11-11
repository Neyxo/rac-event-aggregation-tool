import "./boot";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);

// network first with a cache fallback, events.json from the cache for 30 minutes (static/sw.js); not in the dev server
if (import.meta.env.PROD && "serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
