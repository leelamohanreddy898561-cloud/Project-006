import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration.
 *
 * By default the suite runs against a locally started dev server. To verify a
 * deployed artifact instead, set PLAYWRIGHT_BASE_URL — for example:
 *
 *   $env:PLAYWRIGHT_BASE_URL="https://project-006-e6ae1.web.app"; npx playwright test
 *
 * When PLAYWRIGHT_BASE_URL is set, no local server is started.
 */

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5173";
const useLocalServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  ...(useLocalServer
    ? {
        webServer: {
          command: "npm run dev",
          url: "http://127.0.0.1:5173",
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }
    : {}),
});
