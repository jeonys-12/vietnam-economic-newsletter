function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidDate(value) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

export function validateNewsData(data) {
  const errors = [];
  if (!isObject(data)) return ["data/news.json must contain a JSON object"];
  if (!Array.isArray(data.items)) return ["data/news.json items must be an array"];

  if (data.item_count !== data.items.length) {
    errors.push(`item_count (${data.item_count}) does not match items.length (${data.items.length})`);
  }
  if (!isValidDate(data.updated_at)) errors.push("updated_at is missing or invalid");
  if (!Number.isFinite(data.max_items) || data.max_items < data.items.length) {
    errors.push("max_items is invalid or smaller than items.length");
  }

  const ids = new Set();
  const urls = new Set();
  data.items.forEach((item, index) => {
    const label = `items[${index}]`;
    for (const field of ["id", "source_id", "source_type", "title_original", "published_at", "url"]) {
      if (typeof item?.[field] !== "string" || !item[field].trim()) errors.push(`${label}.${field} is missing`);
    }
    if (item?.id) {
      if (ids.has(item.id)) errors.push(`${label}.id is duplicated: ${item.id}`);
      ids.add(item.id);
    }
    if (item?.url) {
      if (!isHttpUrl(item.url)) errors.push(`${label}.url is not HTTP(S): ${item.url}`);
      if (urls.has(item.url)) errors.push(`${label}.url is duplicated: ${item.url}`);
      urls.add(item.url);
    }
    if (item?.published_at && !isValidDate(item.published_at)) {
      errors.push(`${label}.published_at is invalid: ${item.published_at}`);
    }
  });

  return errors;
}

export function validateBcgLandMonitoring(data, fetchLog) {
  const errors = [];
  if (!Array.isArray(fetchLog?.logs)) return ["data/fetch-log.json logs must be an array"];

  const source = fetchLog.logs.find((entry) => entry.source_id === "bcgland-ir-disclosure");
  if (!source) return ["BCG Land disclosure source log is missing"];
  if (!Number.isFinite(source.links) || source.links <= 0) {
    errors.push("BCG Land disclosure collector found no source links");
  }

  const collectedCount = Number(source.items || 0);
  const publishedItems = Array.isArray(data?.items)
    ? data.items.filter((item) => item.source_id === "bcgland-ir-disclosure")
    : [];
  if (collectedCount > 0 && publishedItems.length === 0) {
    errors.push(`BCG Land collector found ${collectedCount} recent items, but none reached data/news.json`);
  }

  return errors;
}
