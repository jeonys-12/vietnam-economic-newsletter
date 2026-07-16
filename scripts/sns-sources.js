export const SNS_QUERIES = [
  "King Crown Thảo Điền",
  "King Crown Village",
  "BCG Land",
  "Bamboo Capital",
  "trái phiếu BCG",
  "BCG chậm thanh toán",
  "Sao Sáng Sài Gòn SSSG"
];

// False-positive channels confirmed from the dashboard review (2026-07-17).
// Their videos use "king crown" or "bamboo" in the ordinary story/place sense,
// not for Vietnam's King Crown / BCG business-risk monitoring.
export const YOUTUBE_EXCLUDED_CHANNELS = [
  "Frank Folktales",
  "Franz_Dub's",
  "Ramón Castejón Garcia",
  "Global African tales Global African tales",
  "RealmTales",
  "Kaleem pathan",
  "Annapurna moral story",
  "Melissa Quade, Realtor",
  "Hidden Crown Stories",
  "manisha tyagi"
];

// pageId is intentionally blank until Meta grants access and the exact Page ID is confirmed.
// Add approved Page IDs through the FACEBOOK_PAGES_JSON GitHub secret instead of committing tokens.
export const FACEBOOK_PAGES = [
  {
    name: "King Crown Thảo Điền",
    url: "https://www.facebook.com/kingcrownthaodien/",
    pageId: ""
  },
  {
    name: "Bamboo Capital / BCG",
    url: "https://www.facebook.com/search/pages/?q=Bamboo%20Capital%20BCG",
    pageId: ""
  },
  {
    name: "BCG Land",
    url: "https://www.facebook.com/search/pages/?q=BCG%20Land",
    pageId: ""
  }
];

export const RISK_TERMS = [
  "chậm thanh toán", "trái phiếu", "nợ", "điều tra", "khởi tố", "hủy niêm yết",
  "đình chỉ", "tạm ngừng", "phá sản", "thế chấp", "tài sản bảo đảm", "khiếu nại",
  "sổ hồng", "chậm tiến độ", "payment delay", "bond", "debt", "investigation",
  "delisting", "suspension", "bankruptcy", "collateral", "complaint"
];
