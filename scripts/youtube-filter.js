const BUSINESS_CONTEXT_TERMS = [
  "viet nam", "vietnam", "ho chi minh", "thao dien", "bat dong san", "real estate",
  "tai chinh", "finance", "co phieu", "stock", "trai phieu", "bond", "no", "debt",
  "thanh toan", "payment", "du an", "project", "doanh nghiep", "company", "bcr"
];

export function normalizeYouTubeText(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function includesAll(text, terms) {
  return terms.every((term) => text.includes(term));
}

function hasBusinessContext(text) {
  return BUSINESS_CONTEXT_TERMS.some((term) => text.includes(term));
}

export function isRelevantYouTubeVideo({ query = "", title = "", description = "", channelTitle = "" } = {}) {
  const queryText = normalizeYouTubeText(query);
  const metadata = normalizeYouTubeText(`${title} ${description} ${channelTitle}`);

  if (!metadata) return false;
  if (metadata.includes("king crown village")) return true;
  if (includesAll(metadata, ["king crown", "thao dien"])) return true;
  if (metadata.includes("bcg land") || metadata.includes("bcgland")) return true;
  if (metadata.includes("bamboo capital")) return true;
  if (metadata.includes("sao sang sai gon")) return true;

  if (queryText.includes("king crown")) {
    return metadata.includes("king crown") && hasBusinessContext(metadata);
  }
  if (queryText.includes("bcg land")) {
    return includesAll(metadata, ["bcg", "land"]) && hasBusinessContext(metadata);
  }
  if (queryText.includes("bamboo capital")) {
    return metadata.includes("bcg") && hasBusinessContext(metadata);
  }
  if (queryText.includes("trai phieu bcg")) {
    return metadata.includes("bcg") && (metadata.includes("trai phieu") || metadata.includes("bond"));
  }
  if (queryText.includes("bcg cham thanh toan")) {
    return metadata.includes("bcg") && (metadata.includes("cham thanh toan") || metadata.includes("payment") || metadata.includes("debt"));
  }
  if (queryText.includes("sao sang sai gon") || queryText.includes("sssg")) {
    return metadata.includes("sao sang sai gon") || (metadata.includes("sssg") && hasBusinessContext(metadata));
  }

  return normalizeYouTubeText(query).split(" ").filter((term) => term.length > 2).every((term) => metadata.includes(term));
}
