import { test, expect } from "@playwright/test";
import { contrastRatio, parseRgb } from "./helpers/contrast";

/**
 * R18 — Glassmorphism header (supersedes R15).
 * Maps to TC-1801 … TC-1812 in test-cases.md.
 */

/* ---------- tests ---------- */

test.describe("R18 — Glassmorphism header", () => {
  test("TC-1801: header uses a translucent, blurred glass treatment", async ({
    page,
  }) => {
    await page.goto("/");

    const styles = await page
      .locator("header.site-header")
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          backdrop: s.backdropFilter,
          background: s.backgroundColor,
          borderWidth: s.borderBottomWidth,
        };
      });

    expect(styles.backdrop).toContain("blur");
    expect(parseRgb(styles.background).alpha).toBeLessThan(1);
    expect(parseRgb(styles.background).alpha).toBeGreaterThan(0);
    expect(styles.borderWidth).not.toBe("0px");
  });

  test("TC-1802: glowing logo and AI Pulse brand link home", async ({ page }) => {
    await page.goto("/");

    const brand = page.locator(".site-header__brand");
    await expect(brand).toContainText("AI Pulse");
    await expect(brand).toHaveAttribute("href", "/");
    await expect(brand.locator(".logo")).toBeVisible();

    const animation = await brand.locator(".logo").evaluate((el) => {
      const s = getComputedStyle(el);
      return { name: s.animationName, duration: s.animationDuration };
    });
    expect(animation.name).not.toBe("none");
    expect(animation.duration).not.toBe("0s");

    await page.screenshot({ path: "evidence/screenshots/r18-header-light.png" });
  });

  test("TC-1803: navigation links use a gradient hover effect", async ({
    page,
  }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    await expect(nav.getByRole("link", { name: "Topics" })).toHaveAttribute(
      "href",
      "/topics",
    );
    await expect(nav.getByRole("link", { name: "Blogs" })).toHaveAttribute(
      "href",
      "/blog",
    );
    await expect(nav.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );

    // A :hover rule that applies a gradient to nav links must exist.
    const hasGradientHover = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        for (const rule of Array.from(rules)) {
          if (
            rule instanceof CSSStyleRule &&
            /site-nav__link/.test(rule.selectorText) &&
            rule.selectorText.includes(":hover") &&
            /gradient/.test(rule.cssText)
          ) {
            return true;
          }
        }
      }
      return false;
    });
    expect(hasGradientHover).toBe(true);
  });

  test("TC-1804: search icon links to the blog", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Search posts" }),
    ).toHaveAttribute("href", "/blog");
  });

  test("TC-1805: theme toggle flips the theme and persists it", async ({
    page,
  }) => {
    await page.goto("/");

    const themeBefore = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    const bgBefore = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );

    await page
      .getByRole("button", { name: /switch to (dark|light) theme/i })
      .click();

    const themeAfter = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    const bgAfter = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );

    expect(themeAfter).not.toBe(themeBefore);
    expect(bgAfter).not.toBe(bgBefore);

    await page.reload();
    const persisted = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(persisted).toBe(themeAfter);

    await page.screenshot({
      path: "evidence/screenshots/r18-header-dark.png",
    });
  });

  test("TC-1807: Sign In and Sign Up link to their routes", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Sign In" }),
    ).toHaveAttribute("href", "/signin");
    await expect(
      page.getByRole("link", { name: "Sign Up" }),
    ).toHaveAttribute("href", "/signup");
  });

  test("TC-1808: every header destination renders a real page", async ({
    page,
  }) => {
    const routes: Array<[string, string]> = [
      ["/", "Explore the Future of AI"],
      ["/topics", "Topics"],
      ["/blog", "Blogs"],
      ["/about", "About"],
      ["/signin", "Sign In"],
      ["/signup", "Sign Up"],
      ["/this-route-does-not-exist", "Page not found"],
    ];

    for (const [route, heading] of routes) {
      await page.goto(route);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1, `route ${route} must render a heading`).toBeVisible();
      await expect(h1).toContainText(heading);
    }
  });

  test("TC-1809: nav text meets WCAG AA contrast in both themes", async ({
    page,
  }) => {
    await page.goto("/");
    // Colour transitions would otherwise be mid-flight when measured.
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const theme of ["light", "dark"] as const) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);

      await expect
        .poll(
          async () => {
            const { fg, bg } = await page.evaluate(() => {
              const link = document.querySelector(
                ".site-nav__link:not(.is-active)",
              )!;
              return {
                fg: getComputedStyle(link).color,
                bg: getComputedStyle(document.body).backgroundColor,
              };
            });
            return contrastRatio(fg, bg);
          },
          { message: `${theme} theme nav contrast`, timeout: 3000 },
        )
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  test("TC-1810: the current route's nav link is marked active", async ({
    page,
  }) => {
    await page.goto("/");
    const active = page.locator(".site-nav__link.is-active");
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText("Home");
  });

  test("TC-1811: logo glow is disabled under prefers-reduced-motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const animationName = await page
      .locator(".site-header__brand .logo")
      .evaluate((el) => getComputedStyle(el).animationName);

    expect(animationName).toBe("none");
  });
});

test.describe("R18 — system color scheme", () => {
  test.use({ colorScheme: "dark" });

  test("TC-1806: first visit respects the system dark preference", async ({
    page,
  }) => {
    await page.goto("/");

    // No theme was stored before this visit; the app adopts the system
    // preference (dark) and persists that choice.
    const applied = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(applied).toBe("dark");
  });
});
