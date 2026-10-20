import { test, expect } from "@playwright/test";

/**
 * Template for requirement specs.
 *
 * Copy this file when a new area is implemented, name it after the requirement
 * (e.g. `tests/r2-search.spec.ts`), and map every test back to a TC- id in
 * test-cases.md. Record the outcome in evidence.md.
 *
 * Run: npx playwright test tests/<file>.spec.ts
 */

test.describe("Template", () => {
  // Remove this skip once the application exists (see requirements.md R1).
  test.skip();

  test("example: home page shows a level-1 heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
