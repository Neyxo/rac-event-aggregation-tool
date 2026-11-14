// End-to-end tests (web/e2e) against a built app: build first (npx vite build, or into a scratch dir), then "npm run e2e", with
// E2E_DIR=<that dir> when it is not dist/. The webServer only serves files; events.json and status.json come from web/e2e/fixture.
import { defineConfig, devices } from "@playwright/test";

const PORT = 4319;
export default defineConfig({
  testDir: "web/e2e",
  timeout: 30_000,
  outputDir: "node_modules/.cache/e2e-results", // traces of failed tests; inside node_modules so git never sees them
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    timezoneId: "Europe/Zurich",
    locale: "en-GB",
    serviceWorkers: "block",
    permissions: ["geolocation"],
    geolocation: { latitude: 47.05, longitude: 8.3 }, // the device is near Lucerne  // page.route can't see what a service worker answers; the SW tests switch it on
    trace: "retain-on-failure",
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], timezoneId: "Europe/Zurich", locale: "en-GB" } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], timezoneId: "Europe/Zurich", locale: "en-GB" } },
  ],
  webServer: {
    command: "node web/e2e/serve.mjs",
    env: { PORT: String(PORT), E2E_DIR: process.env.E2E_DIR || "dist" },
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: false,
  },
});
