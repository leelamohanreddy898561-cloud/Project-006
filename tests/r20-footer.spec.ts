import { test, expect } from "@playwright/test";
import { contrastRatio } from "./helpers/contrast";

/**
 * R20 — Footer and newsletter subscription. Maps to TC-2001 … TC-2012.
 */

test.describe("R20 — Footer and newsletter", () => {
  test("TC-2001: newsletter box renders directly above the footer", async ({
    page,
  }) => {
    await page.goto("/");

    const newsletter = page.locator(".newsletter");
    const footer = page.locator(".site-footer");

    await expect(newsletter).toBeVisible();
    await expect(footer).toBeVisible();

    const box = await newsletter.boundingBox();
    const foot = await footer.boundingBox();
    expect(box).not.toBeNull();
    expect(foot).not.toBeNull();
    // The newsletter sits entirely above the footer element.
    expect(box!.y + box!.height).toBeLessThanOrEqual(foot!.y + 1);

    await expect(
      newsletter.getByRole("textbox", { name: /email address/i }),
    ).toBeVisible();
    await expect(
      newsletter.getByRole("button", { name: /subscribe/i }),
    ).toBeVisible();
  });

  test("TC-2002: invalid email shows an inline error, not success", async ({
    page,
  }) => {
    await page.goto("/");
    const newsletter = page.locator(".newsletter");
    const input = newsletter.getByRole("textbox", { name: /email address/i });

    await input.fill("not-an-email");
    await newsletter.getByRole("button", { name: /subscribe/i }).click();

    await expect(newsletter.locator(".newsletter__message")).toHaveClass(
      /is-error/,
    );
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(newsletter.locator(".newsletter__message")).toContainText(
      /valid email address/i,
    );
    await expect(newsletter.locator(".newsletter__message")).not.toHaveClass(
      /is-success/,
    );
  });

  test("TC-2003: valid email shows success in a live region and clears the field", async ({
    page,
  }) => {
    await page.goto("/");
    const newsletter = page.locator(".newsletter");
    const input = newsletter.getByRole("textbox", { name: /email address/i });

    await input.fill("reader@example.com");
    await newsletter.getByRole("button", { name: /subscribe/i }).click();

    const message = newsletter.locator(".newsletter__message");
    await expect(message).toHaveClass(/is-success/);
    await expect(message).toContainText("reader@example.com");
    await expect(message).toHaveAttribute("role", "status");
    await expect(message).toHaveAttribute("aria-live", "polite");
    await expect(input).toHaveValue("");
  });

  test("TC-2004: field is labelled and messages are wired via aria-describedby", async ({
    page,
  }) => {
    await page.goto("/");
    const newsletter = page.locator(".newsletter");
    const input = newsletter.getByRole("textbox", { name: /email address/i });

    // A real <label for> association resolves by role + name.
    await expect(input).toHaveAttribute("id", /.+/);

    await input.fill("bad");
    await newsletter.getByRole("button", { name: /subscribe/i }).click();

    const describedBy = await input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const target = page.locator(`#${describedBy}`);
    await expect(target).toHaveClass(/newsletter__message/);
    await expect(target).toContainText(/valid email address/i);
  });

  test("TC-2005: footer has exactly four columns", async ({ page }) => {
    await page.goto("/");

    const columns = page.locator(".site-footer__col");
    await expect(columns).toHaveCount(4);

    const footer = page.locator(".site-footer");
    await expect(
      footer.getByRole("link", { name: "AI Pulse — home" }),
    ).toBeVisible();
    await expect(
      footer.getByRole("heading", { name: "Quick links" }),
    ).toBeVisible();
    await expect(
      footer.getByRole("heading", { name: "AI categories" }),
    ).toBeVisible();
    await expect(
      footer.getByRole("heading", { name: "Social" }),
    ).toBeVisible();
  });

  test("TC-2006: quick links navigate client-side", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__spaMarker = "kept";
    });

    const quickLinks = page.locator(".site-footer__list").first();
    await expect(quickLinks.getByRole("link")).toHaveText([
      "Home",
      "Blogs",
      "Topics",
      "About",
    ]);

    for (const [label, path] of [
      ["Blogs", "/blog"],
      ["Topics", "/topics"],
      ["About", "/about"],
      ["Home", "/"],
    ] as const) {
      await quickLinks.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
      const marker = await page.evaluate(
        () => (window as unknown as Record<string, unknown>).__spaMarker,
      );
      expect(marker, `full reload during "${label}"`).toBe("kept");
    }
  });

  test("TC-2007: AI categories link to topic routes", async ({ page }) => {
    await page.goto("/");

    const categoryLinks = page.locator(".site-footer__col").nth(2).locator("a");
    const count = await categoryLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i += 1) {
      await expect(categoryLinks.nth(i)).toHaveAttribute(
        "href",
        /^\/topics\/[a-z0-9-]+$/,
      );
    }
  });

  test("TC-2008: social links are accessible, new-tab, and safe", async ({
    page,
  }) => {
    await page.goto("/");

    for (const label of [/on X/i, /on GitHub/i, /on LinkedIn/i]) {
      const link = page.locator(".site-footer__social").getByRole("link", {
        name: label,
      });
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
      await expect(link).toHaveAttribute("href", /^https:\/\//);
    }
  });

  test("TC-2009: bottom bar shows the current year and privacy link", async ({
    page,
  }) => {
    await page.goto("/");

    const year = new Date().getFullYear();
    await expect(page.locator(".site-footer__copy")).toContainText(
      String(year),
    );
    await expect(page.locator(".site-footer__copy")).toContainText(
      /all rights reserved/i,
    );
    await expect(
      page.locator(".site-footer__legal").getByRole("link", {
        name: "Privacy Policy",
      }),
    ).toBeVisible();
  });

  test("TC-2010: the Privacy Policy link is a real route", async ({ page }) => {
    await page.goto("/");

    const privacy = page.locator(".site-footer__legal").getByRole("link", {
      name: "Privacy Policy",
    });
    await expect(privacy).toHaveAttribute("href", "/privacy");

    await privacy.click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" }),
    ).toBeVisible();
  });

  test("TC-2011: footer stacks to one column on mobile without overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");

    const columns = page.locator(".site-footer__col");
    const first = await columns.nth(0).boundingBox();
    const second = await columns.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    // Stacked: same left edge, second below the first.
    expect(Math.abs(second!.x - first!.x)).toBeLessThan(2);
    expect(second!.y).toBeGreaterThan(first!.y + 10);

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("TC-2012: footer text meets AA contrast in both themes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    for (const theme of ["light", "dark"] as const) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);

      for (const selector of [".site-footer__intro", ".site-footer__copy"]) {
        await expect
          .poll(
            async () => {
              const { fg, bg } = await page.evaluate((sel) => {
                const el = document.querySelector(sel)!;
                return {
                  fg: getComputedStyle(el).color,
                  bg: getComputedStyle(
                    document.querySelector(".site-footer")!,
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
