import { test, expect } from "@playwright/test";

/**
 * R15 — Site header. Maps to TC-1501 … TC-1504 in test-cases.md.
 */
test.describe("R15 — Site header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("TC-1501: header landmark is visible and the brand links home", async ({
    page,
  }) => {
    const header = page.locator("header.site-header");
    await expect(header).toBeVisible();
    await expect(
      header.getByRole("link", { name: /signal & noise/i }),
    ).toHaveAttribute("href", "/");
  });

  test("TC-1502: navigation links to the main routes", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    await expect(
      nav.getByRole("link", { name: "AI Updates" }),
    ).toHaveAttribute("href", "/blog");
    await expect(
      nav.getByRole("link", { name: "Categories" }),
    ).toHaveAttribute("href", "/categories");
    await expect(nav.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
  });

  test("TC-1503: the current route's nav link is marked active", async ({
    page,
  }) => {
    const active = page.locator(".site-nav__link.is-active");
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText("Home");
  });

  test("TC-1504: exactly one header landmark exists", async ({ page }) => {
    await expect(page.locator("header")).toHaveCount(1);
  });
});
