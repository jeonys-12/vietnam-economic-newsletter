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
- on push to `main`
- every day at 07:00 and 12:00 KST

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
