import fs from "node:fs";
import { validateBcgLandMonitoring, validateNewsData } from "./output-validation.js";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const mode = process.argv[2] || "all";
const newsFile = process.env.NEWS_DATA_FILE || "data/news.json";
const fetchLogFile = process.env.FETCH_LOG_FILE || "data/fetch-log.json";
const data = readJson(newsFile);
const errors = [];

if (mode === "all" || mode === "news") errors.push(...validateNewsData(data));
if (mode === "all" || mode === "bcgland") {
  errors.push(...validateBcgLandMonitoring(data, readJson(fetchLogFile)));
}
if (!new Set(["all", "news", "bcgland"]).has(mode)) {
  errors.push(`Unknown validation mode: ${mode}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

const bcgLandCount = data.items.filter((item) => item.source_id === "bcgland-ir-disclosure").length;
console.log(`Output validation passed: ${data.items.length} news items, ${bcgLandCount} BCG Land disclosures.`);
