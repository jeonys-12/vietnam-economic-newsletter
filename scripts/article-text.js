const ARTICLE_SELECTORS = [
  '[itemprop="articleBody"]',
  '[class*="article-content"]',
  '[class*="article__body"]',
  '[class*="detail-content"]',
  '[class*="post-content"]',
  '[class*="entry-content"]',
  "article",
  "main"
];

function cleanText(text = "") {
  return String(text).replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function longestText(elements) {
  let longest = "";
  elements.each((index) => {
    const text = cleanText(elements.eq(index).text());
    if (text.length > longest.length) longest = text;
  });
  return longest;
}

export function extractArticleText($, minimumLength = 120) {
  const body = $("body").clone();
  body.find("script,style,noscript,svg,nav,header,footer,aside,form,button").remove();

  for (const selector of ARTICLE_SELECTORS) {
    const text = longestText(body.find(selector));
    if (text.length >= minimumLength) return text;
  }

  return cleanText(body.text());
}
