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
    startUrls: [
      "https://mof.gov.vn/webcenter/portal/btcen/pages_r/l/news"
    ],
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
    startUrls: [
      "https://ssc.gov.vn/"
    ],
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
  {
    id: "bcg-official",
    name: "Bamboo Capital Official IR",
    sourceType: "COMPANY_IR",
    category: "BCG_GROUP_WATCH",
    reliability: 90,
    baseUrl: "https://bamboocap.com.vn",
    startUrls: [
      "https://bamboocap.com.vn/en-US/investor-relations/disclosure",
      "https://bamboocap.com.vn/en-US/investor-relations/financial-statements",
      "https://bamboocap.com.vn/en-US/investor-relations/annual-reports"
    ],
    keywordMode: "bcg_or_all_ir",
    maxLinks: 40
  },
  {
    id: "bcgland-official",
    name: "BCG Land Official IR",
    sourceType: "COMPANY_IR",
    category: "BCG_GROUP_WATCH",
    reliability: 90,
    baseUrl: "https://bcgland.com.vn",
    startUrls: ["https://bcgland.com.vn/en/investor-relation"],
    keywordMode: "bcg_or_all_ir",
    maxLinks: 40
  },
  {
    id: "tracodi-official",
    name: "TRACODI Official IR",
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
    sourceType: "COMPANY_IR",
    category: "BCG_GROUP_WATCH",
    reliability: 85,
    baseUrl: "https://www.namabank.com.vn",
    startUrls: ["https://www.namabank.com.vn/"],
    keywordMode: "bcg_or_all_ir",
    maxLinks: 20
  }
];
