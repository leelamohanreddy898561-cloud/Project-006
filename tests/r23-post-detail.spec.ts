import { test, expect } from "@playwright/test";
import { contrastRatio } from "./helpers/contrast";
import { blockFirestore } from "./helpers/firestore";

/**
 * R23 — Blog detail page. Maps to TC-2301 … TC-2319.
 * TC-2320 (build/lint/suite/budget) is a CLI check recorded in evidence.md.
 */

const SLUG = "mixture-of-experts";
const ARTICLE = `/blog/${SLUG}`;

test.beforeEach(async ({ page }) => {
  await blockFirestore(page);
});

test.describe("R23 — Blog detail page", () => {
  test("TC-2301: clicking a card opens its article @smoke", async ({ page }) => {
    await page.goto("/");

    const card = page.locator(".blog-card").first();
    const title = (await card.locator(".blog-card__title").innerText()).trim();

    await card.locator(".blog-card__title a").click();

    await expect(page).toHaveURL(/\/blog\/[a-z0-9-]+$/);
    await expect(page.locator(".post-page__title")).toHaveText(title);
  });

  test("TC-2302: an unknown slug shows a not-found state @smoke", async ({ page }) => {
    await page.goto("/blog/does-not-exist");

    await expect(
      page.getByRole("heading", { name: "Article not found" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".post-page__title")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /back home/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /browse all articles/i }),
    ).toBeVisible();
  });

  test("TC-2303: the document title is set to the article title", async ({
    page,
  }) => {
    await page.goto(ARTICLE);
    await expect(page).toHaveTitle(/Mixture-of-Experts/);

    // Navigating away restores the previous title.
    await page.goto("/");
    await expect(page).not.toHaveTitle(/Mixture-of-Experts/);
  });

  test("TC-2304: the header image sits above the body", async ({ page }) => {
    await page.goto(ARTICLE);

    const cover = page.locator(".post-page__cover");
    await expect(cover).toBeVisible();

    const coverBox = await cover.boundingBox();
    const proseBox = await page.locator(".prose").boundingBox();
    expect(coverBox).not.toBeNull();
    expect(proseBox).not.toBeNull();
    expect(coverBox!.y).toBeLessThan(proseBox!.y);

    // The image really loaded.
    const loaded = await cover.evaluate(
      (el) => (el as HTMLImageElement).naturalWidth > 0,
    );
    expect(loaded).toBe(true);
  });

  test("TC-2305: markdown renders as real HTML elements @smoke", async ({ page }) => {
    await page.goto(ARTICLE);
    const prose = page.locator(".prose");

    expect(await prose.locator("h2").count()).toBeGreaterThan(0);
    expect(await prose.locator("p").count()).toBeGreaterThan(3);
    expect(await prose.locator("ul li").count()).toBeGreaterThan(0);
    expect(await prose.locator("blockquote").count()).toBeGreaterThan(0);

    await expect(prose.locator("h2").first()).toBeVisible();
  });

  test("TC-2306: the prose column is a readable measure", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ARTICLE);

    const prose = page.locator(".prose");
    const box = await prose.boundingBox();
    expect(box).not.toBeNull();
    // Comfortable column: not a full-width sweep, not a narrow strip.
    expect(box!.width).toBeGreaterThan(480);
    expect(box!.width).toBeLessThan(880);

    const metrics = await prose.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        fontSize: parseFloat(style.fontSize),
        lineHeight: parseFloat(style.lineHeight),
      };
    });
    expect(metrics.fontSize).toBeGreaterThanOrEqual(16);
    expect(metrics.lineHeight / metrics.fontSize).toBeGreaterThanOrEqual(1.6);
  });

  test("TC-2307: the rail becomes a horizontal bar on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(ARTICLE);

    const rail = page.locator(".share-rail");
    await expect(rail).toBeVisible();
    expect(await rail.evaluate((el) => getComputedStyle(el).flexDirection)).toBe(
      "row",
    );

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("TC-2308: the rail offers Like, Share and Bookmark", async ({ page }) => {
    await page.goto(ARTICLE);

    const rail = page.locator("aside.share-rail");
    await expect(rail).toHaveAttribute("aria-label", "Article actions");

    await expect(
      page.getByRole("button", { name: "Like this article" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Share this article" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Bookmark this article" }),
    ).toBeVisible();
  });

  test("TC-2309: the rail stays in view while the body scrolls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ARTICLE);

    const rail = page.locator(".share-rail");
    expect(await rail.evaluate((el) => getComputedStyle(el).position)).toBe(
      "sticky",
    );

    await page.evaluate(() => window.scrollTo(0, 900));

    await expect
      .poll(async () => {
        const box = await rail.boundingBox();
        return box ? box.y : Number.POSITIVE_INFINITY;
      })
      .toBeLessThan(220);

    const box = await rail.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
  });

  test("TC-2310: like toggles aria-pressed and the count", async ({ page }) => {
    await page.goto(ARTICLE);

    // Stable locator: the button's accessible name changes with its state.
    const like = page.locator(".share-rail__btn").first();
    const count = page.locator(".share-rail__count");

    await expect(like).toHaveAccessibleName("Like this article");
    await expect(like).toHaveAttribute("aria-pressed", "false");
    const before = Number(await count.innerText());

    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", "true");
    await expect(like).toHaveAccessibleName("Remove your like");
    const after = Number(await count.innerText());
    expect(after).toBe(before + 1);

    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", "false");
    await expect(like).toHaveAccessibleName("Like this article");
    expect(Number(await count.innerText())).toBe(before);
  });

  test("TC-2311: share reports the outcome in a live region", async ({
    page,
  }) => {
    await page.goto(ARTICLE);

    const status = page.locator(".share-rail__status");
    await expect(status).toHaveAttribute("role", "status");
    await expect(status).toHaveAttribute("aria-live", "polite");

    await page.getByRole("button", { name: "Share this article" }).click();

    // Either the link was copied, or the clipboard was blocked and the URL is
    // shown for manual copying.
    await expect(status).toHaveText(/copied|copy this link/i, {
      timeout: 5000,
    });
    await expect(status).toHaveText(new RegExp(SLUG));
  });

  test("TC-2312: bookmark toggles aria-pressed", async ({ page }) => {
    await page.goto(ARTICLE);

    const bookmark = page.getByRole("button", {
      name: "Bookmark this article",
    });
    await expect(bookmark).toHaveAttribute("aria-pressed", "false");

    await bookmark.click();
    const active = page.getByRole("button", { name: "Remove bookmark" });
    await expect(active).toHaveAttribute("aria-pressed", "true");
  });

  test("TC-2313: every rail action has an accessible name", async ({
    page,
  }) => {
    await page.goto(ARTICLE);

    const buttons = page.locator(".share-rail__btn");
    const count = await buttons.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i += 1) {
      const name = await buttons
        .nth(i)
        .evaluate((el) => el.getAttribute("aria-label") ?? el.textContent ?? "");
      expect(name.trim().length).toBeGreaterThan(0);
    }
  });

  test("TC-2314: a submitted comment is added and announced", async ({
    page,
  }) => {
    await page.goto(ARTICLE);

    const comments = page.locator(".comment");
    const initial = await comments.count();

    await page.getByRole("textbox", { name: "Your name" }).fill("Ada Lovelace");
    await page
      .getByRole("textbox", { name: "Comment", exact: true })
      .fill("Clear explanation of the trade-off.");
    await page.getByRole("button", { name: /post comment/i }).click();

    await expect(comments).toHaveCount(initial + 1);
    await expect(comments.first()).toContainText("Ada Lovelace");
    await expect(comments.first()).toContainText(
      "Clear explanation of the trade-off.",
    );

    await expect(
      page.locator(".comments [role='status']"),
    ).toHaveText(/comment posted by ada lovelace/i);
  });

  test("TC-2315: an empty submission is rejected", async ({ page }) => {
    await page.goto(ARTICLE);

    const comments = page.locator(".comment");
    const initial = await comments.count();

    await page.getByRole("button", { name: /post comment/i }).click();

    await expect(page.locator(".comments__error")).toBeVisible();
    await expect(page.locator(".comments__error")).toContainText(
      /add your name and a comment/i,
    );
    await expect(comments).toHaveCount(initial);
  });

  test("TC-2316: the non-persistence notice is visible", async ({ page }) => {
    await page.goto(ARTICLE);

    const notice = page.locator(".comments__notice");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(/browser session only/i);
  });

  test("TC-2317: related articles exclude the current one", async ({ page }) => {
    await page.goto(ARTICLE);

    const current = (await page
      .locator(".post-page__title")
      .innerText()).trim();

    const cards = page.locator(".post-page__related .blog-card");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(3);

    const titles = await cards.locator(".blog-card__title").allInnerTexts();
    expect(titles.map((t) => t.trim())).not.toContain(current);

    for (let i = 0; i < count; i += 1) {
      await expect(cards.nth(i).locator(".blog-card__title a")).toHaveAttribute(
        "href",
        /^\/blog\/[a-z0-9-]+$/,
      );
    }
  });

  test("TC-2318: a related card opens its own article", async ({ page }) => {
    await page.goto(ARTICLE);

    const first = page.locator(".post-page__related .blog-card").first();
    const title = (await first.locator(".blog-card__title").innerText()).trim();
    const href = await first
      .locator(".blog-card__title a")
      .getAttribute("href");

    await first.locator(".blog-card__title a").click();

    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator(".post-page__title")).toHaveText(title);
  });

  test("TC-2319: article and comment text meets AA contrast", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ARTICLE);

    const pairs = [
      { name: "prose paragraph", fg: ".prose p", bg: "body" },
      { name: "comment text", fg: ".comment__text", bg: ".comment" },
    ];

    for (const theme of ["light", "dark"] as const) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);

      for (const pair of pairs) {
        const { fg, bg } = await page.evaluate((target) => {
          const fgEl = document.querySelector(target.fg)!;
          const bgEl =
            target.bg === "body"
              ? document.body
              : document.querySelector(target.bg)!;
          return {
            fg: getComputedStyle(fgEl).color,
            bg: getComputedStyle(bgEl).backgroundColor,
          };
        }, pair);

        const ratio = contrastRatio(fg, bg);
        expect(
          ratio,
          `${theme} ${pair.name} contrast ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
