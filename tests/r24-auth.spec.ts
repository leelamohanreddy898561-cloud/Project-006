import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { composite, contrastRatio, parseRgb } from "./helpers/contrast";

/**
 * R24 — Sign in / sign up pages. Maps to TC-2401 … TC-2417.
 * TC-2418 (build/lint/suite/budget) is a CLI check recorded in evidence.md.
 */

const PAGES = [
  {
    url: "/signin",
    title: "Sign in — AI Pulse",
    submit: "Sign in",
    autocomplete: "current-password",
    switchText: "Create an account",
    switchUrl: /\/signup$/,
  },
  {
    url: "/signup",
    title: "Create your account — AI Pulse",
    submit: "Create account",
    autocomplete: "new-password",
    switchText: "Sign in",
    switchUrl: /\/signin$/,
  },
] as const;

const emailField = (page: import("@playwright/test").Page) =>
  page.getByLabel("Email", { exact: true });

const passwordField = (page: import("@playwright/test").Page) =>
  page.getByLabel("Password", { exact: true });

test.describe("R24 — Sign in and sign up pages", () => {
  test("TC-2401: both routes render a real auth card", async ({ page }) => {
    for (const target of PAGES) {
      await page.goto(target.url);

      await expect(page.locator(".auth-card")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText("Coming soon")).toHaveCount(0);
      await expect(page.locator(".placeholder")).toHaveCount(0);
    }
  });

  test("TC-2402: email, password, Google and submit are present", async ({
    page,
  }) => {
    for (const target of PAGES) {
      await page.goto(target.url);

      await expect(emailField(page)).toBeVisible();
      await expect(passwordField(page)).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Sign in with Google" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: target.submit, exact: true }),
      ).toBeVisible();
    }
  });

  test("TC-2403: each page sets its own title and restores it", async ({
    page,
  }) => {
    for (const target of PAGES) {
      await page.goto(target.url);
      await expect(page).toHaveTitle(target.title);

      await page.goto("/");
      await expect(page).not.toHaveTitle(target.title);
    }
  });

  test("TC-2404: the card is glassmorphic", async ({ page }) => {
    await page.goto("/signin");

    const styles = await page.locator(".auth-card").evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        background: style.backgroundColor,
        backdrop: style.backdropFilter,
        borderColor: style.borderTopColor,
        shadow: style.boxShadow,
      };
    });

    const alpha = parseRgb(styles.background).alpha;
    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(1);
    expect(styles.backdrop).toContain("blur");
    expect(parseRgb(styles.borderColor).alpha).toBeGreaterThan(0);
    expect(styles.shadow).not.toBe("none");
  });

  test("TC-2405: gradient glows are decorative and non-interactive", async ({
    page,
  }) => {
    await page.goto("/signin");

    const glows = page.locator(".auth__glow");
    expect(await glows.count()).toBe(3);

    for (let index = 0; index < 3; index += 1) {
      const glow = glows.nth(index);
      await expect(glow).toHaveAttribute("aria-hidden", "true");
      expect(
        await glow.evaluate((el) => getComputedStyle(el).pointerEvents),
      ).toBe("none");
      // Each layer really carries a gradient.
      expect(
        await glow.evaluate((el) => getComputedStyle(el).backgroundImage),
      ).toContain("gradient");
    }
  });

  test("TC-2406: an empty form shows both errors and submits nothing @smoke", async ({
    page,
  }) => {
    await page.goto("/signin");

    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.locator(".auth-field__error")).toHaveCount(2);
    await expect(page.locator(".auth-card__status")).toHaveText("");
  });

  test("TC-2407: a malformed email and short password are rejected", async ({
    page,
  }) => {
    await page.goto("/signin");

    await emailField(page).fill("not-an-email");
    await passwordField(page).fill("short");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    const errors = page.locator(".auth-field__error");
    await expect(errors).toHaveCount(2);
    await expect(errors.nth(0)).toContainText(/valid email address/i);
    await expect(errors.nth(1)).toContainText(/at least 8 characters/i);
    await expect(page.locator(".auth-card__status")).toHaveText("");
  });

  test("TC-2408: errors are associated with their fields", async ({
    page,
  }) => {
    await page.goto("/signup");

    await page.getByRole("button", { name: "Create account", exact: true }).click();

    const email = emailField(page);
    await expect(email).toHaveAttribute("aria-invalid", "true");

    const describedBy = await email.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();

    const errorText = page.locator(`[id="${describedBy}"]`);
    await expect(errorText).toHaveAttribute("role", "alert");
    await expect(errorText).toContainText(/enter your email address/i);
  });

  test("TC-2409: editing a field clears only that field's error", async ({
    page,
  }) => {
    await page.goto("/signin");

    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator(".auth-field__error")).toHaveCount(2);

    await emailField(page).fill("ada@example.com");

    await expect(page.locator(".auth-field__error")).toHaveCount(1);
    await expect(page.locator(".auth-field__error")).toContainText(
      /enter your password/i,
    );
    await expect(emailField(page)).not.toHaveAttribute("aria-invalid", "true");
  });

  test("TC-2410: password autocomplete differs by page", async ({ page }) => {
    for (const target of PAGES) {
      await page.goto(target.url);

      await expect(passwordField(page)).toHaveAttribute(
        "autocomplete",
        target.autocomplete,
      );
      await expect(emailField(page)).toHaveAttribute("autocomplete", "email");
      await expect(emailField(page)).toHaveAttribute("inputmode", "email");
    }
  });

  test("TC-2411: a valid submission reports the not-connected outcome @smoke", async ({
    page,
  }) => {
    await page.goto("/signin");

    await emailField(page).fill("ada@example.com");
    await passwordField(page).fill("correct horse battery");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    const status = page.locator(".auth-card__status");
    await expect(status).toHaveAttribute("role", "status");
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toContainText(/not connected/i);
    // Never claims success.
    await expect(status).not.toContainText(/^signed in\.$/i);
  });

  test("TC-2412: the Google button reports its outcome", async ({ page }) => {
    await page.goto("/signup");

    await page.getByRole("button", { name: "Sign in with Google" }).click();

    const status = page.locator(".auth-card__status");
    await expect(status).toContainText(/not connected/i);
    await expect(status).not.toContainText(/signed in with google/i);
  });

  test("TC-2413: the password can be revealed and hidden", async ({ page }) => {
    await page.goto("/signin");

    const password = passwordField(page);
    // Stable locator: the toggle's accessible name flips with its state.
    const toggle = page.locator(".auth-field__toggle");

    await expect(password).toHaveAttribute("type", "password");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toHaveAccessibleName("Show password");

    await toggle.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toHaveAccessibleName("Hide password");

    await toggle.click();
    await expect(password).toHaveAttribute("type", "password");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  test("TC-2414: each page links to the other", async ({ page }) => {
    for (const target of PAGES) {
      await page.goto(target.url);

      const link = page.locator(".auth-card__switch a");
      await expect(link).toHaveText(target.switchText);

      await link.click();
      await expect(page).toHaveURL(target.switchUrl);
    }
  });

  test("TC-2415: auth calls come only from the single seam", async () => {
    const source = readFileSync(
      path.resolve("src/pages/AuthPage.tsx"),
      "utf8",
    );

    const authImports = [...source.matchAll(/from\s+"([^"]*auth[^"]*)"/g)].map(
      (match) => match[1],
    );
    expect(authImports).toEqual(["../lib/auth"]);

    // No Firebase SDK leaking into the page itself.
    expect(source).not.toMatch(/firebase/i);
    expect(source).toMatch(/from "\.\.\/lib\/auth"/);
  });

  test("TC-2416: no horizontal overflow at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });

    for (const target of PAGES) {
      await page.goto(target.url);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `${target.url} overflow`).toBeLessThanOrEqual(0);

      const card = await page.locator(".auth-card").boundingBox();
      expect(card).not.toBeNull();
      expect(card!.width).toBeLessThanOrEqual(360);
      expect(card!.x).toBeGreaterThanOrEqual(0);
      await expect(page.locator(".auth-card__title")).toBeVisible();
    }
  });

  test("TC-2417: text meets AA against the composited glass", async ({
    page,
  }) => {
    for (const theme of ["light", "dark"] as const) {
      for (const target of PAGES) {
        await page.goto(target.url);

        // base.css animates link and button colours. Freeze transitions before
        // switching theme, otherwise the sample lands mid-fade and measures a
        // colour the user never settles on.
        await page.addStyleTag({
          content:
            "*, *::before, *::after { transition: none !important; animation: none !important; }",
        });

        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);

        const colours = await page.evaluate(() => {
          const styleOf = (selector: string) =>
            getComputedStyle(document.querySelector(selector)!);
          const page_ = styleOf(".auth");
          const card = styleOf(".auth-card");
          const field = styleOf(".auth-field__control");

          return {
            pageBg: page_.backgroundColor,
            cardBg: card.backgroundColor,
            fieldBg: field.backgroundColor,
            title: styleOf(".auth-card__title").color,
            subtitle: styleOf(".auth-card__subtitle").color,
            label: styleOf(".auth-field__label").color,
            divider: styleOf(".auth-card__divider").color,
            link: styleOf(".auth-card__switch a").color,
            google: styleOf(".auth-card__google").color,
          };
        });

        const cardOnPage = composite(colours.cardBg, colours.pageBg);
        const fieldOnCard = composite(colours.fieldBg, cardOnPage);

        const checks: Array<[string, string, string]> = [
          ["title", colours.title, cardOnPage],
          ["subtitle", colours.subtitle, cardOnPage],
          ["field label", colours.label, cardOnPage],
          ["divider", colours.divider, cardOnPage],
          ["switch link", colours.link, cardOnPage],
          ["google label", colours.google, fieldOnCard],
        ];

        for (const [name, foreground, background] of checks) {
          const ratio = contrastRatio(foreground, background);
          expect(
            ratio,
            `${theme} ${target.url} ${name} = ${ratio.toFixed(2)}:1`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});
