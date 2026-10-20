import { test, expect } from "@playwright/test";

/**
 * R1 — Home page (partial: hero and call-to-action button).
 * Maps to TC-101 in test-cases.md. Featured/latest/category sections are
 * later increments.
 */
test.describe("R1 — Home page (partial)", () => {
  test("TC-101: hero shows the site name, description, and CTA to /blog", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator(".hero__eyebrow")).toHaveText(
      /signal & noise/i,
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".hero__lead")).toBeVisible();

    const cta = page.getByRole("link", { name: /read ai updates/i });
    await expect(cta).toHaveAttribute("href", "/blog");

    // Evidence artifact for this run.
    await page.screenshot({ path: "evidence/screenshots/r1-home-hero.png" });
  });
});
