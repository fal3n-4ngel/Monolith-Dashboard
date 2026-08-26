// Single source of truth for site identity — metadata, JSON-LD, the OpenAPI
// spec, and the OG/Twitter image generators all read from here so the
// production URL and author info never drift out of sync.
export const SITE_URL = "https://continuum-home.vercel.app";
export const SITE_NAME = "Monolith";
export const SITE_TAGLINE = "Run your whole day from one screen.";
export const SITE_DESCRIPTION =
  "A private, self-hostable personal dashboard that brings money, media watchlist, calendar, and tasks into one screen — embedding Continuum's expense and watchlist data alongside GitHub activity and an AI-generated daily briefing.";

export const AUTHOR = {
  name: "Adithya Krishnan",
  url: "https://www.adithyakrishnan.com",
  email: "hello@adithyakrishnan.com",
  github: "https://github.com/fal3n-4ngel",
  githubHandle: "fal3n-4ngel",
  sponsorUrl: "https://github.com/sponsors/fal3n-4ngel",
  coffeeUrl: "https://buymeacoffee.com/fal3n4ngel",
};
