# Vietnam Economic Policy & BCG Recovery Risk Dashboard

A GitHub Pages dashboard for monitoring Vietnam government announcements, economic news, and BCG Group recovery-risk signals.

## Design update

This version uses a Hanwha E&C-inspired corporate layout:

- dark hero section
- orange accent blocks
- wide navigation header
- large metric cards
- source reliability section
- BCG Group Watch risk band
- clean card-based news list

No official images or logo files are embedded.

## GitHub Actions

The workflow runs:

- manually via `workflow_dispatch`
- every day at 07:00 KST

The workflow intentionally ignores `package-lock.json` during dependency installation to avoid a known bad registry-lock issue.

## Local preview

```powershell
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

## Required GitHub Pages setting

Repository → Settings → Pages → Build and deployment → Source → GitHub Actions

## Optional OpenAI summary

Repository → Settings → Secrets and variables → Actions → New repository secret

```text
Name: OPENAI_API_KEY
Value: your OpenAI API key
```


## 운영 설정 변경 사항

- GitHub Actions 자동 실행: 매일 07:00 KST 1회
- 대시보드 표시/저장 항목 수: 최대 100개 (`DASHBOARD_MAX_ITEMS=100`)
- 수동 실행은 `workflow_dispatch`로 유지

## 2026 Update: 일간/주간 베스트 분리

- 대시보드에 `일간 베스트(24시간 이내)`와 `주간 베스트(일주일 이내)` 전환 버튼을 추가했습니다.
- 각 기간 안에서 카테고리 버튼을 통해 `정부정책`, `금융시장`, `베트남 경제뉴스`, `BCG 그룹 모니터링` 등으로 다시 분류해 볼 수 있습니다.
- GitHub Actions 수집 범위는 주간 베스트 표시를 위해 `LOOKBACK_HOURS=168`로 변경했습니다.
- 전체 표시·저장 항목은 기존 요청대로 최대 100개로 유지됩니다.

## 2026 Update: Nam A Bank 프로모션성 보도자료 제외

- Nam A Bank의 카드 할인, 호텔·식음료·외식 제휴, 쇼핑몰·휴대폰 매장 할인 등 소비자 마케팅성 보도자료는 대시보드 수집 대상에서 제외합니다.
- 예: Costamigo/Phan Thiet 호텔·식음료 할인, Cellphone S JCB 카드 5% 할인, Golden Gate 외식 제휴 프로모션 등.
- 단, Nam A Bank의 재무제표, 공시, 감독기관 제재, 주주·이사회, 채권, 자본확충, 유동성, 부실채권, 감사의견 등 투자·리스크 판단에 필요한 항목은 제외하지 않습니다.
- 제외된 항목 수와 사유는 `data/fetch-log.json`의 `excluded` 및 `excluded_reasons`에서 확인할 수 있습니다.

## 2026 Update: BCG / BCG Land 공식 홈페이지 모니터링 명확화

### BCG 공식 홈페이지

BCG 공식 홈페이지는 아래 영역만 모니터링합니다.

- Investor Relations: `https://bamboocap.com.vn/en-US/investor-relations`
- Disclosure: `https://bamboocap.com.vn/en-US/investor-relations/disclosure`
- Financial Statements: `https://bamboocap.com.vn/en-US/investor-relations/financial-statements`
- Annual General Meetings: `https://bamboocap.com.vn/en-US/investor-relations/annual-general-meetings`
- Corporate Governance - Reports: `https://bamboocap.com.vn/en-US/investor-relations/corporate-governance/governance-reports`
- Corporate Governance - Policies: `https://bamboocap.com.vn/en-US/investor-relations/corporate-governance/policies`
- Media News: `https://bamboocap.com.vn/en-US/media/news`

BCG 공식 홈페이지 날짜는 `MM/DD/YYYY`로 처리합니다. 예: `07/10/2026` = 2026년 7월 10일.

### BCG Land 공식 홈페이지

BCG Land 공식 홈페이지는 아래 영역만 모니터링합니다.

- Investor Relations: `https://bcgland.com.vn/en/investor-relation`
- Disclosure: `https://bcgland.com.vn/en/investor-relation/cong-bo-thong-tin-1`
- Investor Affairs: `https://bcgland.com.vn/en/investor-relation/hoat-dong-nha-dau-tu-1`
- Financial Statements: `https://bcgland.com.vn/en/investor-relation/bao-cao-tai-chinh-1`
- Shareholders' Meeting: `https://bcgland.com.vn/en/investor-relation/shareholders-meeting`
- Corporate Governance: `https://bcgland.com.vn/en/investor-relation/quan-tri-cong-ty-1`
- News: `https://bcgland.com.vn/en/news`

BCG Land IR 날짜는 `DD MM - YYYY`로 처리합니다. 예: `08 07 - 2026` = 2026년 7월 8일.  
BCG Land News 날짜는 `DD/MM/YYYY`로 처리합니다. 예: `27/02/2025` = 2025년 2월 27일.

### 화면 표시

대시보드 기사 카드에 `source_section`을 표시하여 BCG 공식공시, BCG Media News, BCG Land Disclosure, BCG Land Financial Statements 등 세부 출처가 명확히 보이도록 수정했습니다.


## 2026-07 date filter fix

- Daily Best uses only `published_at` within 24 hours.
- Weekly Best uses only `published_at` within 168 hours.
- `collected_at` is no longer used for Daily/Weekly Best filtering because it is only the GitHub Actions run time.
- BCG / BCG Land official items with no actual publication/disclosure date are excluded from the dashboard data file and logged in `data/fetch-log.json`.
- Static BCG / BCG Land section links such as `ANNUAL REPORTS`, `CORPORATE GOVERNANCE`, `DISCLOSURE`, and `FINANCIAL STATEMENTS` are treated as navigation/category pages and excluded unless they resolve to individual dated disclosures.

## 2026-07 BCG Disclosure current-year list fix

- Bamboo Capital의 일부 IR 목록 페이지는 브라우저에서는 보이는 것처럼 보여도 GitHub Actions에서 기본 URL(`/disclosure`)을 직접 요청하면 목록을 안정적으로 가져오지 못할 수 있습니다.
- 이를 보정하기 위해 BCG IR 공식 섹션은 현재 연도와 전년도 목록 URL을 자동으로 추가 수집합니다.
  - 예: `https://bamboocap.com.vn/en-US/investor-relations/disclosure/2026-1`
- BCG 날짜 형식은 계속 `MM/DD/YYYY`로 해석합니다.
  - 예: `07/10/2026` = 2026년 7월 10일
- 단순 메뉴 링크는 계속 제외하되, `Letter to Shareholders on BCG Stock Update`, `Information Disclosure on the Receipt of HOSE's Decision on the Delisting of BCG Shares`, `Notice about the bond interest rate payment for BCG122006`처럼 실제 날짜가 있는 Disclosure 항목은 일간/주간 베스트 대상에 포함됩니다.

## BCG Land weekly disclosure correction

BCG Land Investor Relations pages can display disclosure items with a date block separated from the title, for example `08 07 - 2026`, which means 8 July 2026. The crawler now parses these list-page records directly, instead of relying only on the nearest hyperlink text. This prevents current BCG Land disclosures from being excluded when the date is not inside the same `<a>` tag as the title.

The crawler also fetches both `bcgland.com.vn` and `www.bcgland.com.vn` variants for BCG Land official pages, because the current English IR pages may expose newer disclosure records more consistently on the `www` host.
