import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("collection uses one HTML parser without virtual DOM dependencies", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ["cheerio"]);

  const newsScript = fs.readFileSync("scripts/fetch-news.js", "utf8");
  assert.doesNotMatch(newsScript, /jsdom|Readability/);
  assert.match(newsScript, /extractArticleText/);
});
