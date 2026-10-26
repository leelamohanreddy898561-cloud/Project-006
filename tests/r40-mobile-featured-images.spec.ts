import { test, expect, type Locator, type Page } from "@playwright/test";
import { contrastRatio } from "./helpers/contrast";
import { blockFirestore } from "./helpers/firestore";

/**
 * R40 — Mobile blog reading: the featured image is never cropped.
 * Maps to TC-4001 … TC-4004.
 *
 * The reported defect was geometry: a `height` attribute the CSS never
 * overrode forced a 500px-tall box, and `object-fit: cover` cut ~63% of a
 * 16:9 cover's width on a 360px phone. These cases therefore measure
 * geometry — a cover of a known ratio is routed into the page and the
 * rendered box is compared with the image's own ratio.
 */

const ARTICLE = "/blog/mixture-of-experts";

/** Covers of known ratios, served in place of the seed artwork. */
const WIDE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600"></svg>';
const LANDSCAPE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"></svg>';
const TALL_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200"></svg>';

const COVERS = /\/covers\/[^?]+\.svg$/;

/**
 * Serve `body` for every cover request. The Firestore block is re-applied
 * because `unrouteAll` would otherwise drop it and let live posts in.
 */
async function serveCovers(page: Page, body: string): Promise<void> {
  await page.unrouteAll();
  await blockFirestore(page);
  await page.route(COVERS, (route) =>
    route.fulfill({ contentType: "image/svg+xml", body }),
  );
}

/** Wait until the routed cover has decoded, then read its box. */
async function coverBox(target: Locator) {
  await expect(target).toBeVisible();
  await expect
    .poll(() =>
      target.evaluate((el) => (el as HTMLImageElement).naturalWidth > 0),
    )
    .toBe(true);

  return target.evaluate((el) => {
    const img = el as HTMLImageElement;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      width: rect.width,
      height: rect.height,
      naturalRatio: img.naturalWidth / img.naturalHeight,
      objectFit: style.objectFit,
      maxHeight: style.maxHeight,
    };
  });
}

test.describe("R40 — the featured image is never cropped", () => {
  test("TC-4001: the article cover is shown in full at every width @smoke", async ({
    page,
  }) => {
    await serveCovers(page, WIDE_SVG);

    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(ARTICLE);

      const cover = await coverBox(page.locator(".post-page__cover"));

      // The box follows the image's own ratio: no forced 8/5 box, and no
      // rule that crops the image to whatever box remains.
      expect(cover.objectFit, `object-fit at ${width}px`).not.toBe("cover");
      expect(
        Math.abs(cover.width / cover.height - cover.naturalRatio),
        `box ratio at ${width}px`,
      ).toBeLessThan(0.02);
      expect(cover.maxHeight, `a tall cover is capped at ${width}px`).not.toBe(
        "none",
      );
    }

    // A cover taller than the viewport stays fully visible and undistorted:
    // the box is capped, and `contain` draws the whole image inside it.
    await serveCovers(page, TALL_SVG);
    await page.setViewportSize({ width: 1280, height: 700 });
    await page.goto(ARTICLE);

    const tall = await coverBox(page.locator(".post-page__cover"));
    const uncapped = tall.width / tall.naturalRatio;

    expect(tall.objectFit).toBe("contain");
    expect(tall.height).toBeLessThan(uncapped - 1);
    expect(tall.height).toBeLessThanOrEqual(700 * 0.8 + 1);
    expect(tall.width).toBeGreaterThan(400);

    // R40.7 — tapping a card from a scrolled list opens the article at the
    // top, so the reader sees the whole cover instead of its lower half.
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/blog");
    await page.evaluate(() => window.scrollTo(0, 1200));

    await page.locator(".blog-card__title a").first().click();
    await expect(page).toHaveURL(/\/blog\/[a-z0-9-]+$/);

    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(0);

    const opened = await page.evaluate(() => {
      const rect = document
        .querySelector(".post-page__cover")!
        .getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    });
    expect(opened.top).toBeGreaterThanOrEqual(0);
    expect(opened.bottom).toBeGreaterThan(0);

    // A filter change is the same page: it must not jump to the top.
    await page.goto("/blog?q=prompting");
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.getByRole("searchbox", { name: /search/i }).fill("prompting ");

    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
  });

  test("TC-4002: card thumbnails show the full featured image on mobile", async ({
    page,
  }) => {
    await serveCovers(page, LANDSCAPE_SVG);

    // Mobile: a card is full width, so the whole featured image is visible.
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");

    const mobile = await coverBox(page.locator(".blog-card__media img").first());
    const mediaMobile = await page
      .locator(".blog-card__media")
      .first()
      .evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });

    expect(
      Math.abs(mediaMobile.width / mediaMobile.height - mobile.naturalRatio),
      "mobile card media matches the image's own ratio",
    ).toBeLessThan(0.02);

    // Desktop: the uniform editorial thumbnail crop is retained, and the
    // R19.5 hover zoom still applies to it (TC-1904).
    await page.setViewportSize({ width: 1280, height: 900 });

    const desktop = await page
      .locator(".blog-card__media")
      .first()
      .evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const img = el.querySelector("img")!;
        return {
          ratio: rect.width / rect.height,
          objectFit: getComputedStyle(img).objectFit,
        };
      });

    expect(
      Math.abs(desktop.ratio - 8 / 5),
      "desktop card media keeps the editorial ratio",
    ).toBeLessThan(0.02);
    expect(desktop.objectFit).toBe("cover");
  });

  test("TC-4003: the mobile action rail sticks clear of the wrapped header", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(ARTICLE);

    const rail = page.locator(".share-rail");
    await expect(rail).toBeVisible();
    await expect(rail).toHaveCSS("position", "sticky");

    // Scroll far enough that only the sticky rule can hold the rail up.
    await page.evaluate(() => window.scrollTo(0, 1400));

    const measured = await page.evaluate(() => {
      const header = document.querySelector(".site-header")!.getBoundingClientRect();
      const bar = document.querySelector(".share-rail")!.getBoundingClientRect();
      return {
        headerBottom: header.bottom,
        railTop: bar.top,
        railBottom: bar.bottom,
      };
    });

    // The whole bar sits below the header — none of it hides behind it.
    expect(measured.railTop).toBeGreaterThanOrEqual(measured.headerBottom - 0.5);
    expect(measured.railBottom).toBeGreaterThan(measured.railTop);
  });

  test("TC-4004: the search field is one tap target, and dark subtle text meets AA", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });

    for (const route of ["/", "/blog"]) {
      await page.goto(route);

      const field = page.locator(
        route === "/" ? ".sidebar__search" : ".blog-list__search",
      );
      await expect(field).toBeVisible();

      const box = (await field.boundingBox())!;
      expect(box.height, `${route} search field height`).toBeGreaterThanOrEqual(
        32,
      );

      // A tap on the field's padding — not on the input itself — focuses it.
      await field.click({ position: { x: box.width - 6, y: 4 } });

      const focusedSearch = await page.evaluate(
        () =>
          document.activeElement instanceof HTMLInputElement &&
          document.activeElement.type === "search",
      );
      expect(focusedSearch, `${route} field focuses its input`).toBe(true);
    }

    // R40.6 — dark-mode subtle text, measured against the real backgrounds.
    // The current page is /blog: card meta first.
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
    });

    const cardMeta = await page.evaluate(() => {
      const fgEl = document.querySelector(".blog-card__meta")!;
      const bgEl = document.querySelector(".blog-card")!;
      return {
        fg: getComputedStyle(fgEl).color,
        bg: getComputedStyle(bgEl).backgroundColor,
      };
    });

    const cardRatio = contrastRatio(cardMeta.fg, cardMeta.bg);
    expect(
      cardRatio,
      `dark card meta contrast ${cardRatio.toFixed(2)}`,
    ).toBeGreaterThanOrEqual(4.5);

    // The sidebar count lives on the home page.
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
    });

    const sidebar = await page.evaluate(() => {
      const fgEl = document.querySelector(".sidebar__count")!;
      const bgEl = document.querySelector(".sidebar__panel")!;
      return {
        fg: getComputedStyle(fgEl).color,
        bg: getComputedStyle(bgEl).backgroundColor,
      };
    });

    const sidebarRatio = contrastRatio(sidebar.fg, sidebar.bg);
    expect(
      sidebarRatio,
      `dark sidebar count contrast ${sidebarRatio.toFixed(2)}`,
    ).toBeGreaterThanOrEqual(4.5);

    // The article meta line sits on the page background.
    await page.goto(ARTICLE);
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
    });

    const meta = await page.evaluate(() => {
      const fgEl = document.querySelector(".post-page__meta")!;
      return {
        fg: getComputedStyle(fgEl).color,
        bg: getComputedStyle(document.body).backgroundColor,
      };
    });

    const metaRatio = contrastRatio(meta.fg, meta.bg);
    expect(
      metaRatio,
      `dark article meta contrast ${metaRatio.toFixed(2)}`,
    ).toBeGreaterThanOrEqual(4.5);
  });
});
