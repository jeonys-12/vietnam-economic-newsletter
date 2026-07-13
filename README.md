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
