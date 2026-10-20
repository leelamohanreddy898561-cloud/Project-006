import { test, expect } from "@playwright/test";

/**
 * R16 — Firebase integration. Maps to TC-1606 in test-cases.md.
 *
 * Verifies that importing the Firebase module does not break the site when
 * credentials are absent or incomplete (AC16.4). Credential-dependent cases
 * (TC-1607, TC-1608) are manual and recorded in evidence.md.
 */
test.describe("R16 — Firebase integration", () => {
  test("TC-1606: site renders with the Firebase module imported", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("header.site-header")).toBeVisible();
    expect(
      pageErrors,
      `uncaught page errors: ${pageErrors.join("; ")}`,
    ).toEqual([]);

    await page.screenshot({
      path: "evidence/screenshots/r16-firebase-integrated.png",
    });
  });
});
