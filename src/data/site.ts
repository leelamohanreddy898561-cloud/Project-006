/**
 * Site-wide configuration: brand copy, footer navigation, and social profiles.
 *
 * PLACEHOLDER URLs: the X and LinkedIn profile links are stand-ins until the
 * owner confirms the real handles. The GitHub link points at the actual
 * repository. Change them here and the footer, and anything else that reads
 * this file, update together.
 */

export interface FooterLink {
  label: string;
  to: string;
}

export interface SocialLink {
  id: "x" | "github" | "linkedin";
  label: string;
  ariaLabel: string;
  href: string;
}

export const SITE = {
  name: "AI Pulse",
  intro:
    "Clear, practical coverage of the models, research, and tools shaping artificial intelligence — what changed, why it matters, and what to do about it.",
  quickLinks: [
    { label: "Home", to: "/" },
    { label: "Blogs", to: "/blog" },
    { label: "Topics", to: "/topics" },
    { label: "About", to: "/about" },
  ] as FooterLink[],
  socials: [
    {
      id: "x",
      label: "X",
      ariaLabel: "AI Pulse on X (opens in a new tab)",
      href: "https://x.com/aipulse",
    },
    {
      id: "github",
      label: "GitHub",
      ariaLabel: "AI Pulse on GitHub (opens in a new tab)",
      href: "https://github.com/leelamohanreddy898561-cloud/Project-006",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      ariaLabel: "AI Pulse on LinkedIn (opens in a new tab)",
      href: "https://www.linkedin.com/company/aipulse",
    },
  ] as SocialLink[],
  legal: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Use", to: "/terms" },
  ] as FooterLink[],
} as const;
