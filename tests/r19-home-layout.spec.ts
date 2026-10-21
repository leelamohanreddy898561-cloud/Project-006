import { test, expect } from "@playwright/test";
import { contrastRatio } from "./helpers/contrast";

/**
 * R19 — Home main content layout. Maps to TC-1901 … TC-1912 in test-cases.md.
 */

test.describe("R19 — Home main content layout", () => {
  test("TC-1901: two-column layout with a roughly 70/30 split", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const articles = await page.locator(".home-main__articles").boundingBox();
    const sidebar = await page.locator(".sidebar").boundingBox();
    expect(articles).not.toBeNull();
    expect(sidebar).not.toBeNull();

    // Sidebar sits to the right of the articles column.
    expect(sidebar!.x).toBeGreaterThan(articles!.x + articles!.width - 1);

    const ratio =
      articles!.width / (articles!.width + sidebar!.width);
    expect(ratio, `article column ratio ${ratio.toFixed(2)}`).toBeGreaterThan(0.6);
    expect(ratio).toBeLessThan(0.8);
  });

  test("TC-1902: article grid is two columns and newest-first", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const cards = page.locator(".blog-card");
    await expect(cards).toHaveCount(6);

    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(second!.x).toBeGreaterThan(first!.x);
    expect(Math.abs(second!.y - first!.y)).toBeLessThan(4);

    // Newest first: the Mixture-of-Experts post (2026-10-18) leads.
    await expect(cards.nth(0).locator(".blog-card__title")).toContainText(
      "Mixture-of-Experts",
    );
  });

  test("TC-1903: card shows image, badge, title, read time, author, bookmark", async ({
    page,
  }) => {
    await page.goto("/");
    const card = page.locator(".blog-card").first();

    await expect(card.locator(".blog-card__media img")).toBeVisible();
    await expect(card.locator(".badge")).toBeVisible();
    await expect(card.locator(".blog-card__title")).toBeVisible();
    await expect(card.locator(".blog-card__readtime")).toHaveText(
      /\d+ min read/,
    );
    await expect(card.locator(".author__avatar")).toBeVisible();
    await expect(card.locator(".author__name")).not.toBeEmpty();
    await expect(
      card.getByRole("button", { name: /bookmark/i }),
    ).toBeVisible();

    // The cover image actually loads (not a broken image).
    const loaded = await card
      .locator(".blog-card__media img")
      .evaluate((el) => (el as HTMLImageElement).naturalWidth > 0);
    expect(loaded).toBe(true);
  });

  test("TC-1904: hover lifts the card and zooms the image", async ({ page }) => {
    await page.goto("/");
    const card = page.locator(".blog-card").first();
    const image = card.locator(".blog-card__media img");

    const before = await card.evaluate(
      (el) => getComputedStyle(el).transform,
    );
    await card.hover();
    await expect
      .poll(async () => card.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe(before);

    await expect
      .poll(async () => image.evaluate((el) => getComputedStyle(el).transform))
      .toContain("matrix");
  });

  test("TC-1906: sidebar has trending topics, search, and quick filters", async ({
    page,
  }) => {
    await page.goto("/");
    const sidebar = page.locator(".sidebar");

    await expect(sidebar.getByRole("heading", { name: /trending topics/i })).toBeVisible();
    await expect(sidebar.getByRole("searchbox", { name: /search articles/i })).toBeVisible();
    await expect(sidebar.getByRole("group", { name: /quick filters/i })).toBeVisible();
    await expect(sidebar.locator(".sidebar__topic")).toHaveCount(5);
  });

  test("TC-1907: sidebar search filters the grid", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("searchbox", { name: /search articles/i }).fill("prompt");

    const cards = page.locator(".blog-card");
    await expect(cards).toHaveCount(1);
    await expect(cards.first().locator(".blog-card__title")).toContainText(
      "Prompting Small Language Models",
    );
    await expect(page.locator(".sidebar__count")).toHaveText("1 article");
  });

  test("TC-1908: quick filter changes the grid", async ({ page }) => {
    await page.goto("/");
    const featured = page
      .getByRole("group", { name: /quick filters/i })
      .getByRole("button", { name: "Featured" });

    await featured.click();
    await expect(featured).toHaveAttribute("aria-pressed", "true");

    const cards = page.locator(".blog-card");
    await expect(cards).toHaveCount(2);
  });

  test("TC-1909: bookmark toggles aria-pressed", async ({ page }) => {
    await page.goto("/");
    const bookmark = page.locator(".blog-card").first().locator(".bookmark");

    await expect(bookmark).toHaveAttribute("aria-pressed", "false");
    await bookmark.click();
    await expect(bookmark).toHaveAttribute("aria-pressed", "true");
    await expect(bookmark).toHaveClass(/is-active/);
  });

  test("TC-1910: empty state when nothing matches", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("searchbox", { name: /search articles/i })
      .fill("zzzznotathing");

    await expect(page.locator(".blog-card")).toHaveCount(0);
    await expect(page.locator(".post-grid__empty")).toContainText(
      /no articles match/i,
    );
  });

  test("TC-1911: single column on mobile with no overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");

    const articles = await page.locator(".home-main__articles").boundingBox();
    const sidebar = await page.locator(".sidebar").boundingBox();
    expect(sidebar!.y).toBeGreaterThan(articles!.y + articles!.height - 1);

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("TC-1912: card text contrast in both themes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const theme of ["light", "dark"] as const) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);

      for (const selector of [".blog-card__title a", ".blog-card__excerpt"]) {
        await expect
          .poll(
            async () => {
              const { fg, bg } = await page.evaluate((sel) => {
                const el = document.querySelector(sel)!;
                return {
                  fg: getComputedStyle(el).color,
                  bg: getComputedStyle(
                    document.querySelector(".blog-card")!,
                  ).backgroundColor,
                };
              }, selector);
              return contrastRatio(fg, bg);
            },
            { message: `${theme} ${selector} contrast`, timeout: 3000 },
          )
          .toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

test.describe("R19 — reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("TC-1905: no hover lift under prefers-reduced-motion", async ({
    page,
  }) => {
    await page.goto("/");
    const card = page.locator(".blog-card").first();

    await card.hover();
    const transform = await card.evaluate(
      (el) => getComputedStyle(el).transform,
    );
    // "none" or an identity matrix — no translateY lift.
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(transform);
  });
});
