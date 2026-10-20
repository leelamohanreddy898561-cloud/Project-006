import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration.
 *
 * The `webServer` block below is intentionally commented out: it requires a
 * `dev` script in package.json (added with the app scaffold, R0). Once that
 * exists, uncomment it so `npx playwright test` starts and stops the dev
 * server automatically.
 */
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
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // webServer: {
  //   command: "npm run dev",
  //   url: "http://127.0.0.1:5173",
  //   reuseExistingServer: !process.env.CI,
  // },
});
