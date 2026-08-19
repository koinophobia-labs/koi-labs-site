import assert from "node:assert/strict";
import test from "node:test";
import { metadata as homeMetadata } from "../app/page";
import sitemap from "../app/sitemap";
import nextConfig from "../next.config";
import {
  STUDIO_DESCRIPTION,
  STUDIO_HOME_LAST_MODIFIED,
  STUDIO_SCHEMA,
  STUDIO_TITLE,
  STUDIO_URL,
} from "../lib/seo";

test("homepage search and social metadata tell one consistent story", () => {
  assert.equal(homeMetadata.title, STUDIO_TITLE);
  assert.equal(homeMetadata.description, STUDIO_DESCRIPTION);
  assert.equal(homeMetadata.alternates?.canonical, `${STUDIO_URL}/`);
  assert.equal(homeMetadata.openGraph?.title, STUDIO_TITLE);
  assert.equal(homeMetadata.openGraph?.description, STUDIO_DESCRIPTION);
  assert.equal(homeMetadata.openGraph?.url, `${STUDIO_URL}/`);
  assert.equal(homeMetadata.twitter?.title, STUDIO_TITLE);
  assert.equal(homeMetadata.twitter?.description, STUDIO_DESCRIPTION);
});

test("structured data links the studio, founder, and website as one entity graph", () => {
  const graph = STUDIO_SCHEMA["@graph"];
  const organization = graph.find(
    (entity) => entity["@id"] === `${STUDIO_URL}/#organization`,
  );
  const founder = graph.find(
    (entity) => entity["@id"] === "https://koinophobia.dev/#person",
  );
  const website = graph.find(
    (entity) => entity["@id"] === `${STUDIO_URL}/#website`,
  );

  assert.ok(organization);
  assert.ok(founder);
  assert.ok(website);
  assert.match(JSON.stringify(organization), /github\.com\/koinophobia-labs/);
  assert.match(JSON.stringify(founder), /linkedin\.com\/in\/bt77/);
  assert.match(JSON.stringify(website), /#organization/);
});

test("every studio sitemap entry carries an honest last-modified signal", () => {
  const entries = sitemap();
  assert.ok(entries.length > 0);
  assert.ok(entries.every((entry) => Boolean(entry.lastModified)));

  const homepage = entries.find((entry) => entry.url === STUDIO_URL);
  assert.ok(homepage);
  assert.equal(homepage.lastModified, STUDIO_HOME_LAST_MODIFIED);
});

test("production canonicalization redirects are permanent", async () => {
  const redirects = await nextConfig.redirects!();
  assert.ok(redirects.length > 0);
  assert.ok(
    redirects.every((redirect) => redirect.permanent === true),
    "all production-only internal URL redirects must emit permanent status codes",
  );
});
