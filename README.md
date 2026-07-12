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
