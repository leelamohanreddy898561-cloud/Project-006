import { test, expect } from "@playwright/test";
import { contrastRatio } from "./helpers/contrast";

/**
 * R1 — Home hero. Maps to TC-101 … TC-106 in test-cases.md.
 * Sections below the hero (featured / latest / topics) are later increments.
 */

/** Cheap fingerprint of the canvas pixels, sampled in-page. */
async function canvasFingerprint(
  page: import("@playwright/test").Page,
): Promise<number> {
  return page.locator("canvas.network-bg").evaluate((el) => {
    const canvas = el as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return -1;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0;
    for (let i = 0; i < data.length; i += 41) {
      sum = (sum + data[i] * (i + 1)) % 2147483647;
    }
    return sum;
  });
}

test.describe("R1 — Home hero", () => {
  test("TC-101: headline, description, and Start Reading button", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /explore the future of ai/i,
    );
    await expect(page.locator(".hero__lead")).toBeVisible();

    const cta = page.getByRole("link", { name: /start reading/i });
    await expect(cta).toHaveAttribute("href", "/blog");

    await page.screenshot({ path: "evidence/screenshots/r1-hero.png" });
  });

  test("TC-102: the AI network canvas animates", async ({ page }) => {
    await page.goto("/");

    const canvas = page.locator("canvas.network-bg");
    await expect(canvas).toBeAttached();

    const size = await canvas.evaluate((el) => ({
      width: (el as HTMLCanvasElement).width,
      height: (el as HTMLCanvasElement).height,
    }));
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);

    const first = await canvasFingerprint(page);
    await page.waitForTimeout(400);
    const second = await canvasFingerprint(page);

    expect(second).not.toBe(first);
  });

  test("TC-103: floating topic card with rotation", async ({ page }) => {
    await page.goto("/");

    const card = page.locator(".topic-card");
    await expect(card).toBeVisible();

    const animation = await card.evaluate((el) => ({
      name: getComputedStyle(el).animationName,
      duration: getComputedStyle(el).animationDuration,
    }));
    expect(animation.name).not.toBe("none");
    expect(parseFloat(animation.duration)).toBeGreaterThan(0);

    const firstName = (await page.locator(".topic-card__name").textContent()) ?? "";
    await expect(page.locator(".topic-card__name")).not.toHaveText(firstName, {
      timeout: 10_000,
    });
  });

  test("TC-105: hero stacks on mobile with no overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");

    const text = await page.locator(".hero__text").boundingBox();
    const card = await page.locator(".topic-card").boundingBox();
    expect(text).not.toBeNull();
    expect(card).not.toBeNull();
    expect(card!.y).toBeGreaterThan(text!.y + text!.height - 1);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("TC-106: hero text contrast in both themes", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const theme of ["light", "dark"] as const) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);

      await expect
        .poll(
          async () => {
            const { fg, bg } = await page.evaluate(() => ({
              fg: getComputedStyle(document.querySelector(".hero__lead")!).color,
              bg: getComputedStyle(document.body).backgroundColor,
            }));
            return contrastRatio(fg, bg);
          },
          { message: `${theme} hero contrast`, timeout: 3000 },
        )
        .toBeGreaterThanOrEqual(4.5);
    }
  });
});

test.describe("R1 — Home hero (reduced motion)", () => {
  test.use({ reducedMotion: "reduce" });

  test("TC-104: no motion under prefers-reduced-motion", async ({ page }) => {
    await page.goto("/");

    const first = await canvasFingerprint(page);
    await page.waitForTimeout(400);
    const second = await canvasFingerprint(page);
    expect(second).toBe(first);

    const duration = await page
      .locator(".topic-card")
      .evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.05);
  });
});
