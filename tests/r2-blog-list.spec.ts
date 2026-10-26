import { test, expect } from "@playwright/test";
import { blockFirestore } from "./helpers/firestore";

/**
 * R2 — blog index with search and filters. Maps to TC-201 … TC-210 in
 * test-cases.md. Search, topic and tag all live in the URL (AC2.4).
 */

test.beforeEach(async ({ page }) => {
  await blockFirestore(page);
});

const CARDS = ".blog-list .blog-card";

function searchParam(page: import("@playwright/test").Page, key: string) {
  return page.evaluate(
    (name) => new URL(window.location.href).searchParams.get(name),
    key,
  );
}

test.describe("R2 — blog list", () => {
  test("TC-201: lists every post newest-first with all required fields @smoke", async ({
    page,
  }) => {
    await page.goto("/blog");

    const cards = page.locator(CARDS);
    await expect(cards).toHaveCount(6);

    // Newest first.
    const dates = await page
      .locator(`${CARDS} time.blog-card__date`)
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("datetime") ?? ""),
      );
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
    await expect(cards.first().locator(".blog-card__title")).toContainText(
      "Mixture-of-Experts",
    );

    // Every card carries title, excerpt, date, read time, category, tags.
    for (let index = 0; index < (await cards.count()); index += 1) {
      const card = cards.nth(index);
      await expect(card.locator(".blog-card__title a")).not.toBeEmpty();
      await expect(card.locator(".blog-card__excerpt")).not.toBeEmpty();
      await expect(card.locator("time.blog-card__date")).toHaveAttribute(
        "datetime",
        /^\d{4}-\d{2}-\d{2}$/,
      );
      await expect(card.locator(".blog-card__readtime")).toHaveText(
        /\d+ min read/,
      );
      await expect(card.locator(".badge")).not.toBeEmpty();
      expect(await card.locator(".blog-card__tags a").count()).toBeGreaterThan(
        0,
      );
    }
  });

  test("TC-202: search is case-insensitive and reflected in ?q=", async ({
    page,
  }) => {
    await page.goto("/blog");
    await page.getByRole("searchbox", { name: /search blogs/i }).fill("PROMPTING");

    await expect(page.locator(CARDS)).toHaveCount(1);
    await expect(page.locator(CARDS).first().locator(".blog-card__title")).toContainText(
      "Prompting Small Language Models",
    );
    expect(await searchParam(page, "q")).toBe("PROMPTING");
  });

  test("TC-203: search matches excerpt text too", async ({ page }) => {
    await page.goto("/blog");
    await page.getByRole("searchbox", { name: /search blogs/i }).fill("routing");

    await expect(page.locator(CARDS)).toHaveCount(1);
    await expect(page.locator(CARDS).first().locator(".blog-card__title")).toContainText(
      "Mixture-of-Experts",
    );
  });

  test("TC-204: topic chip filters and is reflected in ?topic=", async ({
    page,
  }) => {
    await page.goto("/blog");
    const news = page
      .getByRole("group", { name: /filter by topic/i })
      .getByRole("button", { name: "News" });

    await news.click();

    await expect(news).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(CARDS)).toHaveCount(2);
    expect(await page.locator(`${CARDS} .badge`).allInnerTexts()).toEqual([
      "News",
      "News",
    ]);
    expect(await searchParam(page, "topic")).toBe("news");
  });

  test("TC-205: clicking All clears the topic filter", async ({ page }) => {
    await page.goto("/blog");
    const topics = page.getByRole("group", { name: /filter by topic/i });

    await topics.getByRole("button", { name: "News" }).click();
    await topics.getByRole("button", { name: "All" }).click();

    await expect(page.locator(CARDS)).toHaveCount(6);
    await expect(
      topics.getByRole("button", { name: "All" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(await searchParam(page, "topic")).toBeNull();
  });

  test("TC-206: nonsense search shows the empty state", async ({ page }) => {
    await page.goto("/blog");
    await page.getByRole("searchbox", { name: /search blogs/i }).fill("zzzz");

    await expect(page.locator(CARDS)).toHaveCount(0);
    await expect(page.locator(".blog-list__empty")).toContainText(
      /no posts match/i,
    );
  });

  test("TC-207: the result count matches the rendered cards", async ({
    page,
  }) => {
    await page.goto("/blog");
    await page
      .getByRole("group", { name: /filter by topic/i })
      .getByRole("button", { name: "News" })
      .click();

    await expect(page.locator(CARDS)).toHaveCount(2);

    const rendered = await page.locator(CARDS).count();
    await expect(page.locator(".blog-list__count")).toHaveText(
      `${rendered} posts`,
    );
    expect(rendered).toBe(2);
  });

  test("TC-208: a filtered URL opens pre-filtered", async ({ page }) => {
    await page.goto("/blog?topic=news");

    await expect(page.locator(CARDS)).toHaveCount(2);
    await expect(
      page
        .getByRole("group", { name: /filter by topic/i })
        .getByRole("button", { name: "News" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("TC-209: tag chip filters, persists in ?tag=, and survives a reload", async ({
    page,
  }) => {
    await page.goto("/blog");
    const models = page
      .getByRole("group", { name: /filter by tag/i })
      .getByRole("button", { name: "#models" });

    await models.click();

    await expect(models).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(CARDS)).toHaveCount(3);
    expect(await searchParam(page, "tag")).toBe("models");

    await page.reload();
    await expect(page.locator(CARDS)).toHaveCount(3);
    await expect(
      page
        .getByRole("group", { name: /filter by tag/i })
        .getByRole("button", { name: "#models" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("TC-210: query, topic and tag combine, and every term must match", async ({
    page,
  }) => {
    await page.goto("/blog?q=small%20local&topic=guides&tag=prompting");

    await expect(page.locator(CARDS)).toHaveCount(1);
    await expect(page.locator(CARDS).first().locator(".blog-card__title")).toContainText(
      "Prompting Small Language Models",
    );
    expect(await searchParam(page, "q")).toBe("small local");
    expect(await searchParam(page, "topic")).toBe("guides");
    expect(await searchParam(page, "tag")).toBe("prompting");

    // AND, not OR: the second term appears in a different post, so together
    // they match nothing.
    await page
      .getByRole("searchbox", { name: /search blogs/i })
      .fill("small vision");
    await expect(page.locator(CARDS)).toHaveCount(0);
    await expect(page.locator(".blog-list__empty")).toBeVisible();
  });
});
