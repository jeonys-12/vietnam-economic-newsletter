import assert from "node:assert/strict";
import test from "node:test";
import * as cheerio from "cheerio";
import { extractArticleText } from "./article-text.js";

test("extracts the article body without navigation and footer noise", () => {
  const $ = cheerio.load(`
    <body>
      <nav>menu menu menu</nav>
      <article><h1>BCG Land disclosure</h1><p>${"Material disclosure facts. ".repeat(8)}</p></article>
      <footer>copyright and unrelated links</footer>
    </body>
  `);
  const text = extractArticleText($);
  assert.match(text, /BCG Land disclosure/);
  assert.doesNotMatch(text, /menu|copyright/);
});

test("prefers articleBody metadata and falls back to cleaned body text", () => {
  const preferred = cheerio.load(`<body><main>${"wrapper noise ".repeat(20)}<div itemprop="articleBody">${"Official facts ".repeat(12)}</div></main></body>`);
  assert.equal(extractArticleText(preferred).startsWith("Official facts"), true);

  const fallback = cheerio.load(`<body><script>secret()</script><p>Short but useful disclosure text.</p></body>`);
  assert.equal(extractArticleText(fallback), "Short but useful disclosure text.");
});
