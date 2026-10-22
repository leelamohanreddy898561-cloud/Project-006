import { test, expect } from "@playwright/test";

/**
 * R21 — Repository and workflow hygiene.
 *
 * Only TC-2106 is a browser case. TC-2101, TC-2102, TC-2103, TC-2105 and
 * TC-2107 are CLI checks (git index, spec deletion, skip count, dependency
 * pin, build/lint/tests) and are executed as commands, then recorded verbatim
 * in evidence.md.
 */

test.describe("R21 — Repository and workflow hygiene", () => {
  test("TC-2106: header and footer home links have distinct accessible names", async ({
    page,
  }) => {
    await page.goto("/");

    // Two brand links exist, one in each landmark.
    const brandLinks = page.locator(
      ".site-header__brand, .site-footer__brand-link",
    );
    await expect(brandLinks).toHaveCount(2);

    // Each is reachable by its *own* accessible name — and only that name.
    await expect(
      page
        .locator(".site-header")
        .getByRole("link", { name: "AI Pulse — home" }),
    ).toHaveCount(1);

    await expect(
      page
        .locator(".site-footer")
        .getByRole("link", { name: "AI Pulse", exact: true }),
    ).toHaveCount(1);

    // The old duplicated name must no longer match twice.
    await expect(
      page.getByRole("link", { name: "AI Pulse — home" }),
    ).toHaveCount(1);

    // Both still point home.
    await expect(page.locator(".site-header__brand")).toHaveAttribute(
      "href",
      "/",
    );
    await expect(page.locator(".site-footer__brand-link")).toHaveAttribute(
      "href",
      "/",
    );
  });
});
