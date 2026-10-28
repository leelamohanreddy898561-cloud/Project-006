import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
  deleteTestAccount,
  deleteTestProfile,
  readProject,
  uniqueEmail,
} from "./helpers/auth-account";
import { blockFirestore } from "./helpers/firestore";

/**
 * R49 — the way in is visible on a phone.
 *
 * The defect was presentational: R18's header hid every `.btn--sm` in the
 * header actions below 900px, which removed Sign In, Sign Up and Sign out on
 * every phone. TC-4901 measures the signed-out header at real phone widths on
 * the platform home and a tenant site; TC-4902 signs a throwaway account in at
 * 390px and measures the signed-in header down to 320px. TC-4903 reads the CSS
 * and markup back so the hiding rule cannot return unnoticed.
 */

const project = readProject();
const PASSWORD = "Pulse-Mobile-2026!";

const read = (relative: string) =>
  readFileSync(path.resolve(relative), "utf8");

/** The R43 dev-only workspace fixtures: a tenant site and the default site. */
const WORKSPACES = [
  {
    id: "ws-alpha",
    name: "Alpha Co",
    slug: "alpha",
    ownerUid: "owner-alpha",
    branding: { title: "Alpha Co", tagline: "Notes from Alpha's team." },
  },
  {
    id: "signal-and-noise",
    name: "Signal & Noise",
    slug: "signal-and-noise",
    ownerUid: "owner-default",
    branding: { title: "Signal & Noise", tagline: "" },
  },
];

async function seed(page: Page) {
  await blockFirestore(page);
  await page.addInitScript(
    (payload) => {
      const target = window as unknown as {
        __workspaceDocs?: unknown;
        __workspaceFixtures?: unknown;
      };

      target.__workspaceDocs = payload.workspaces;
      target.__workspaceFixtures = payload.fixtures;
    },
    {
      workspaces: WORKSPACES,
      fixtures: { "ws-alpha": [], "signal-and-noise": [] },
    },
  );
}

/** A link that is really on screen: displayed, non-zero and inside the page. */
async function expectOnScreen(link: import("@playwright/test").Locator) {
  await expect(link).toBeVisible();

  const box = await link.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      display: style.display,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      viewport: window.innerWidth,
    };
  });

  expect(box.display).not.toBe("none");
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);
  expect(box.left).toBeGreaterThanOrEqual(0);
  expect(box.right).toBeLessThanOrEqual(box.viewport);
}

/** The header is two rows and never wider than the phone. */
async function expectTwoRowHeader(page: Page) {
  const measured = await page.evaluate(() => {
    const header = document.querySelector("header.site-header")!;
    const nav = document.querySelector(".site-header__nav")!;
    const actions = document.querySelector(".site-header__actions")!;
    return {
      headerHeight: header.getBoundingClientRect().height,
      navTop: nav.getBoundingClientRect().top,
      actionsTop: actions.getBoundingClientRect().top,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    };
  });

  expect(measured.headerHeight).toBeLessThanOrEqual(100);
  expect(
    measured.navTop,
    "the navigation sits on the row below the brand and controls",
  ).toBeGreaterThan(measured.actionsTop);
  expect(measured.scrollWidth).toBe(measured.innerWidth);
}

test.describe("R49 — the signed-out header on a phone", () => {
  test("TC-4901: Sign In and Sign Up are visible on the platform and tenant sites", async ({
    page,
  }) => {
    await seed(page);
    test.setTimeout(90_000);

    for (const width of [320, 360, 390, 560, 768, 900]) {
      await page.setViewportSize({ width, height: 844 });

      for (const route of ["/", "/w/alpha", "/w/signal-and-noise"]) {
        await page.goto(route);

        const header = page.locator("header.site-header");
        const signIn = header.getByRole("link", { name: "Sign In" });
        const signUp = header.getByRole("link", { name: "Sign Up" });

        await expectOnScreen(signIn);
        await expectOnScreen(signUp);
        await expect(signIn).toHaveAttribute("href", "/signin");
        await expect(signUp).toHaveAttribute("href", "/signup");
      }
    }

    // The links are not only visible: they open the pages they name.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/w/alpha");

    await page
      .locator("header.site-header")
      .getByRole("link", { name: "Sign In" })
      .click();
    await expect(page).toHaveURL(/\/signin$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeVisible();

    await page
      .locator("header.site-header")
      .getByRole("link", { name: "Sign Up" })
      .click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Create your account" }),
    ).toBeVisible();
  });
});

test.describe("R49 — the signed-in header on a phone", () => {
  test.skip(!project, "Firebase is not configured in .env");

  const email = uniqueEmail().replace("r29-test", "r49-test");
  let created = false;

  test.afterAll(async () => {
    if (created && project) {
      await deleteTestProfile(project, email, PASSWORD);
      await deleteTestAccount(project, email, PASSWORD);
    }
  });

  test("TC-4902: Sign out and the account destinations stay at 320px", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/signup");

    const form = page.locator(".auth-form");
    await form.getByLabel("Email", { exact: true }).fill(email);
    await form.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    created = true;

    await expect(page).toHaveURL(/\/$/, { timeout: 45_000 });

    const header = page.locator("header.site-header");
    const signOut = header.getByRole("button", { name: "Sign out" });
    const mySites = header.getByRole("link", { name: "My sites" });

    await expect(signOut).toBeVisible({ timeout: 30_000 });
    await expect(mySites).toBeVisible();

    for (const width of [900, 768, 560, 390, 360, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await expectOnScreen(signOut);
      await expectOnScreen(mySites);

      // R49.3 — the phone widths keep the two-row header and the 100px
      // offset; the tablet/desktop widths stay on the single R18 row.
      if (width <= 560) {
        await expectTwoRowHeader(page);
      } else {
        const rows = await page.evaluate(() => {
          const nav = document.querySelector(".site-header__nav")!;
          const actions = document.querySelector(".site-header__actions")!;
          return {
            navTop: nav.getBoundingClientRect().top,
            actionsTop: actions.getBoundingClientRect().top,
          };
        });

        expect(Math.abs(rows.navTop - rows.actionsTop)).toBeLessThan(2);
      }
    }

    // The narrowest header still signs the account out, and signing out puts
    // the way in back where it was.
    await signOut.click();
    await expect(signOut).toHaveCount(0, { timeout: 30_000 });
    await expectOnScreen(header.getByRole("link", { name: "Sign In" }));
    await expectOnScreen(header.getByRole("link", { name: "Sign Up" }));
  });
});

test.describe("R49 — the header cannot hide its way in again", () => {
  test("TC-4903: the CSS keeps the auth controls and only drops the avatar and search", () => {
    const headerCss = read("src/components/Header.css");
    const accountCss = read("src/components/AccountMenu.css");
    const header = read("src/components/Header.tsx");

    // No rule for the header actions may hide the controls it contains. This
    // is the exact shape of the R49 defect and the reason for the requirement.
    expect(
      headerCss,
      "no .site-header__actions rule may set display: none",
    ).not.toMatch(/\.site-header__actions[^{]*\{[^}]*display:\s*none/);

    // The compact rules that replaced the hiding rule are present.
    expect(headerCss).toMatch(/@media \(max-width: 900px\)[\s\S]*?\.site-header__actions \.btn--sm \{\s*padding:/);
    expect(headerCss).toMatch(/@media \(max-width: 560px\)[\s\S]*?\.site-header__actions \.btn--sm \{\s*padding:/);

    // Only the two deliberate drops remain, each at its own breakpoint.
    expect(accountCss).toMatch(
      /@media \(max-width: 375px\) \{\s*\.account__identity \{\s*display: none;/,
    );
    expect(headerCss).toMatch(
      /@media \(max-width: 330px\) \{\s*\.site-header__search \{\s*display: none;/,
    );

    // Markup/wiring: both routes, the hook the narrow rule targets, and the
    // account menu that carries Sign out, Admin and My site(s).
    expect(header).toContain('to="/signin"');
    expect(header).toContain('to="/signup"');
    expect(header).toContain("site-header__search");
    expect(header).toContain("<AccountMenu");
  });
});
