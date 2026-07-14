export const GENERAL_KEYWORDS = [
  "economy", "economic", "policy", "policies", "prime minister", "resolution",
  "tax", "vat", "finance", "budget", "bond", "bonds", "securities", "stock",
  "market", "interest rate", "exchange rate", "bank", "credit", "inflation",
  "real estate", "construction", "investment", "fdi", "disclosure", "violation",
  "sanction", "trading suspension", "suspended", "upcom", "hose", "hnx",
  "kinh tế", "chính sách", "thuế", "tài chính", "trái phiếu", "chứng khoán",
  "bất động sản", "ngân hàng", "lãi suất", "tỷ giá", "đầu tư", "công bố thông tin"
];

export const BCG_KEYWORDS = [
  "BCG", "Bamboo Capital", "BCG Land", "BCG Energy", "Tracodi", "TCD",
  "AAA Insurance", "Bảo hiểm AAA", "Nam A Bank", "NamABank", "Nguyen Ho Nam",
  "Nguyễn Hồ Nam", "Tan Bo Quan", "Andy Tan", "Sao Sang Sai Gon", "SSSG",
  "King Crown", "King Crown Thao Dien", "BCR12101"
];

export const RISK_KEYWORDS = [
  "trading suspension", "suspension", "suspended", "delisting", "special monitoring",
  "warning", "control", "information disclosure violation", "late disclosure",
  "late financial statements", "audited financial statements", "qualified opinion",
  "adverse opinion", "disclaimer opinion", "interest payment delay", "bond coupon",
  "principal repayment", "debt restructuring", "asset disposal", "board resignation",
  "resignation", "legal proceedings", "investigation", "ministry of public security",
  "police", "collateral", "pledge", "mortgage", "receivables", "bankruptcy",
  "insolvency", "tạm ngừng giao dịch", "đình chỉ giao dịch", "hủy niêm yết",
  "kiểm soát", "cảnh báo", "vi phạm công bố thông tin", "chậm công bố",
  "báo cáo tài chính", "trái phiếu", "lãi trái phiếu", "thanh toán gốc",
  "tái cơ cấu nợ", "tài sản bảo đảm", "cầm cố", "thế chấp", "khởi tố",
  "điều tra", "Bộ Công an", "phá sản"
];

const BCG_OFFICIAL_BASE = "https://bamboocap.com.vn";
const BCGLAND_OFFICIAL_BASE = "https://bcgland.com.vn";

function officialSectionSource({ id, name, section, baseUrl, startUrl, dateFormat, maxLinks = 30 }) {
  return {
    id,
    name,
    sourceSection: section,
    sourceType: "COMPANY_IR",
    category: "BCG_GROUP_WATCH",
    reliability: 90,
    baseUrl,
    startUrls: [startUrl],
    allowedPathPrefixes: [new URL(startUrl).pathname],
    keywordMode: "official_section_all",
    dateFormat,
    maxLinks
  };
}

export const SOURCES = [
  {
    id: "gov-vgp",
    name: "Vietnam Government Portal / Government News",
    sourceType: "GOVERNMENT",
    category: "GOVERNMENT_POLICY",
    reliability: 100,
    baseUrl: "https://en.baochinhphu.vn",
    startUrls: [
      "https://en.baochinhphu.vn/",
      "https://en.baochinhphu.vn/policies.htm",
      "https://en.baochinhphu.vn/economy.htm"
    ],
    keywordMode: "general",
    maxLinks: 25
  },
  {
    id: "gov-mof",
    name: "Ministry of Finance of Vietnam",
    sourceType: "GOVERNMENT",
    category: "GOVERNMENT_POLICY",
    reliability: 100,
    baseUrl: "https://mof.gov.vn",
    startUrls: ["https://mof.gov.vn/webcenter/portal/btcen/pages_r/l/news"],
    keywordMode: "general",
    maxLinks: 20
  },
  {
    id: "gov-sbv",
    name: "State Bank of Vietnam",
    sourceType: "GOVERNMENT",
    category: "FINANCIAL_MARKET",
    reliability: 100,
    baseUrl: "https://www.sbv.gov.vn",
    startUrls: [
      "https://www.sbv.gov.vn/webcenter/portal/en/home/sbv/news",
      "https://www.sbv.gov.vn/webcenter/portal/en/home/sbv/rm/er"
    ],
    keywordMode: "general",
    maxLinks: 20
  },
  {
    id: "gov-ssc",
    name: "State Securities Commission of Vietnam",
    sourceType: "REGULATOR",
    category: "SECURITIES_BONDS",
    reliability: 100,
    baseUrl: "https://ssc.gov.vn",
    startUrls: ["https://ssc.gov.vn/"],
    keywordMode: "general",
    maxLinks: 20
  },
  {
    id: "exchange-hnx",
    name: "Hanoi Stock Exchange",
    sourceType: "STOCK_EXCHANGE",
    category: "SECURITIES_BONDS",
    reliability: 95,
    baseUrl: "https://www.hnx.vn",
    startUrls: [
      "https://www.hnx.vn/en-gb/home.html",
      "https://www.hnx.vn/en-gb/thong-tin-cong-bo-up-hnx.html"
    ],
    keywordMode: "general",
    maxLinks: 25
  },
  {
    id: "exchange-hose",
    name: "Ho Chi Minh Stock Exchange",
    sourceType: "STOCK_EXCHANGE",
    category: "SECURITIES_BONDS",
    reliability: 95,
    baseUrl: "https://www.hsx.vn",
    startUrls: [
      "https://www.hsx.vn/en/",
      "https://www.hsx.vn/en/Modules/Listed/Web/SymbolView"
    ],
    keywordMode: "general",
    maxLinks: 25
  },
  {
    id: "media-vietstock",
    name: "Vietstock",
    sourceType: "ECONOMIC_MEDIA",
    category: "VIETNAM_ECONOMIC_NEWS",
    reliability: 80,
    baseUrl: "https://en.vietstock.vn",
    startUrls: ["https://en.vietstock.vn/"],
    keywordMode: "general_or_bcg",
    maxLinks: 35
  },
  {
    id: "media-cafef",
    name: "CafeF",
    sourceType: "ECONOMIC_MEDIA",
    category: "VIETNAM_ECONOMIC_NEWS",
    reliability: 80,
    baseUrl: "https://cafef.vn",
    startUrls: ["https://cafef.vn/", "https://cafef.vn/thi-truong-chung-khoan.chn"],
    keywordMode: "general_or_bcg",
    maxLinks: 35
  },
  {
    id: "media-vir",
    name: "Vietnam Investment Review",
    sourceType: "ECONOMIC_MEDIA_EN",
    category: "VIETNAM_ECONOMIC_NEWS",
    reliability: 75,
    baseUrl: "https://vir.com.vn",
    startUrls: ["https://vir.com.vn/", "https://vir.com.vn/economy"],
    keywordMode: "general_or_bcg",
    maxLinks: 35
  },
  {
    id: "media-theinvestor",
    name: "The Investor Vietnam",
    sourceType: "ECONOMIC_MEDIA_EN",
    category: "VIETNAM_ECONOMIC_NEWS",
    reliability: 75,
    baseUrl: "https://theinvestor.vn",
    startUrls: ["https://theinvestor.vn/", "https://theinvestor.vn/finance"],
    keywordMode: "general_or_bcg",
    maxLinks: 35
  },
  {
    id: "media-ndh",
    name: "NDH / Người Đồng Hành",
    sourceType: "ECONOMIC_MEDIA",
    category: "VIETNAM_ECONOMIC_NEWS",
    reliability: 60,
    baseUrl: "https://nguoidonghanh.vn",
    startUrls: ["https://nguoidonghanh.vn/"],
    keywordMode: "general_or_bcg",
    maxLinks: 25
  },

  // BCG official homepage monitoring. Only Investor Relations and Media News are monitored.
  // BCG date format on these pages: MM/DD/YYYY, e.g. 07/10/2026 = July 10, 2026.
  officialSectionSource({
    id: "bcg-ir-investor-relations",
    name: "Bamboo Capital Official IR",
    section: "BCG IR / Investor Relations",
    baseUrl: BCG_OFFICIAL_BASE,
    startUrl: "https://bamboocap.com.vn/en-US/investor-relations",
    dateFormat: "MM_DD_YYYY",
    maxLinks: 20
  }),
  officialSectionSource({
    id: "bcg-ir-disclosure",
    name: "Bamboo Capital Official IR",
    section: "BCG IR / Disclosure",
    baseUrl: BCG_OFFICIAL_BASE,
    startUrl: "https://bamboocap.com.vn/en-US/investor-relations/disclosure",
    dateFormat: "MM_DD_YYYY",
    maxLinks: 35
  }),
  officialSectionSource({
    id: "bcg-ir-financial-statements",
    name: "Bamboo Capital Official IR",
    section: "BCG IR / Financial Statements",
    baseUrl: BCG_OFFICIAL_BASE,
    startUrl: "https://bamboocap.com.vn/en-US/investor-relations/financial-statements",
    dateFormat: "MM_DD_YYYY",
    maxLinks: 30
  }),
  officialSectionSource({
    id: "bcg-ir-agm",
    name: "Bamboo Capital Official IR",
    section: "BCG IR / Annual General Meetings",
    baseUrl: BCG_OFFICIAL_BASE,
    startUrl: "https://bamboocap.com.vn/en-US/investor-relations/annual-general-meetings",
    dateFormat: "MM_DD_YYYY",
    maxLinks: 30
  }),
  officialSectionSource({
    id: "bcg-ir-governance-reports",
    name: "Bamboo Capital Official IR",
    section: "BCG IR / Corporate Governance - Reports",
    baseUrl: BCG_OFFICIAL_BASE,
    startUrl: "https://bamboocap.com.vn/en-US/investor-relations/corporate-governance/governance-reports",
    dateFormat: "MM_DD_YYYY",
    maxLinks: 25
  }),
  officialSectionSource({
    id: "bcg-ir-governance-policies",
    name: "Bamboo Capital Official IR",
    section: "BCG IR / Corporate Governance - Policies",
    baseUrl: BCG_OFFICIAL_BASE,
    startUrl: "https://bamboocap.com.vn/en-US/investor-relations/corporate-governance/policies",
    dateFormat: "MM_DD_YYYY",
    maxLinks: 25
  }),
  officialSectionSource({
    id: "bcg-media-news",
    name: "Bamboo Capital Media News",
    section: "BCG Media News",
    baseUrl: BCG_OFFICIAL_BASE,
    startUrl: "https://bamboocap.com.vn/en-US/media/news",
    dateFormat: "MM_DD_YYYY",
    maxLinks: 35
  }),

  // BCG Land official homepage monitoring. Only Investor Relations and News are monitored.
  // BCG Land IR date format: DD MM - YYYY, e.g. 08 07 - 2026 = July 8, 2026.
  // BCG Land News date format: DD/MM/YYYY, e.g. 27/02/2025 = February 27, 2025.
  officialSectionSource({
    id: "bcgland-ir-investor-relations",
    name: "BCG Land Official IR",
    section: "BCG Land IR / Investor Relations",
    baseUrl: BCGLAND_OFFICIAL_BASE,
    startUrl: "https://bcgland.com.vn/en/investor-relation",
    dateFormat: "DD_MM_DASH_YYYY",
    maxLinks: 20
  }),
  officialSectionSource({
    id: "bcgland-ir-disclosure",
    name: "BCG Land Official IR",
    section: "BCG Land IR / Disclosure",
    baseUrl: BCGLAND_OFFICIAL_BASE,
    startUrl: "https://bcgland.com.vn/en/investor-relation/cong-bo-thong-tin-1",
    dateFormat: "DD_MM_DASH_YYYY",
    maxLinks: 35
  }),
  officialSectionSource({
    id: "bcgland-ir-investor-affairs",
    name: "BCG Land Official IR",
    section: "BCG Land IR / Investor Affairs",
    baseUrl: BCGLAND_OFFICIAL_BASE,
    startUrl: "https://bcgland.com.vn/en/investor-relation/hoat-dong-nha-dau-tu-1",
    dateFormat: "DD_MM_DASH_YYYY",
    maxLinks: 30
  }),
  officialSectionSource({
    id: "bcgland-ir-financial-statements",
    name: "BCG Land Official IR",
    section: "BCG Land IR / Financial Statements",
    baseUrl: BCGLAND_OFFICIAL_BASE,
    startUrl: "https://bcgland.com.vn/en/investor-relation/bao-cao-tai-chinh-1",
    dateFormat: "DD_MM_DASH_YYYY",
    maxLinks: 30
  }),
  officialSectionSource({
    id: "bcgland-ir-shareholders-meeting",
    name: "BCG Land Official IR",
    section: "BCG Land IR / Shareholders' Meeting",
    baseUrl: BCGLAND_OFFICIAL_BASE,
    startUrl: "https://bcgland.com.vn/en/investor-relation/shareholders-meeting",
    dateFormat: "DD_MM_DASH_YYYY",
    maxLinks: 30
  }),
  officialSectionSource({
    id: "bcgland-ir-corporate-governance",
    name: "BCG Land Official IR",
    section: "BCG Land IR / Corporate Governance",
    baseUrl: BCGLAND_OFFICIAL_BASE,
    startUrl: "https://bcgland.com.vn/en/investor-relation/quan-tri-cong-ty-1",
    dateFormat: "DD_MM_DASH_YYYY",
    maxLinks: 30
  }),
  officialSectionSource({
    id: "bcgland-news",
    name: "BCG Land News",
    section: "BCG Land News",
    baseUrl: BCGLAND_OFFICIAL_BASE,
    startUrl: "https://bcgland.com.vn/en/news",
    dateFormat: "DD_MM_YYYY",
    maxLinks: 35
  }),

  // Other BCG-related official sources are retained for group-level risk monitoring.
  {
    id: "tracodi-official",
    name: "TRACODI Official IR",
    sourceSection: "TRACODI IR",
    sourceType: "COMPANY_IR",
    category: "BCG_GROUP_WATCH",
    reliability: 90,
    baseUrl: "https://tracodi.com.vn",
    startUrls: ["https://tracodi.com.vn/en/investor-relations"],
    keywordMode: "bcg_or_all_ir",
    maxLinks: 30
  },
  {
    id: "bcgenergy-official",
    name: "BCG Energy Official",
    sourceSection: "BCG Energy Official",
    sourceType: "COMPANY_IR",
    category: "BCG_GROUP_WATCH",
    reliability: 90,
    baseUrl: "https://bcgenergy.vn",
    startUrls: ["https://bcgenergy.vn/en"],
    keywordMode: "bcg_or_all_ir",
    maxLinks: 30
  },
  {
    id: "aaa-official",
    name: "AAA Insurance Official",
    sourceSection: "AAA Insurance Official",
    sourceType: "COMPANY_IR",
    category: "BCG_GROUP_WATCH",
    reliability: 85,
    baseUrl: "https://www.aaa.com.vn",
    startUrls: ["https://www.aaa.com.vn/"],
    keywordMode: "bcg_or_all_ir",
    maxLinks: 20
  },
  {
    id: "namabank-official",
    name: "Nam A Bank Official",
    sourceSection: "Nam A Bank Official",
    sourceType: "COMPANY_IR",
    category: "BCG_GROUP_WATCH",
    reliability: 85,
    baseUrl: "https://www.namabank.com.vn",
    startUrls: ["https://www.namabank.com.vn/"],
    keywordMode: "bcg_or_all_ir",
    maxLinks: 20
  }
];
