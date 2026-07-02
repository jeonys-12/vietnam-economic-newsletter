# Vietnam Economic Policy & BCG Recovery Risk Dashboard

This repository collects Vietnam government announcements, economic news, and BCG Group-related public information, removes duplicates, summarizes items in Korean through the OpenAI API, and publishes the result to GitHub Pages.

## Main flow

1. GitHub Actions runs at 07:00 and 12:00 Asia/Seoul.
2. `scripts/fetch-news.js` collects links from official agencies, exchanges, economic media, and BCG-related IR pages.
3. Items are deduplicated by canonical URL and title similarity.
4. If `OPENAI_API_KEY` exists, Korean summaries are generated through the OpenAI API. If not, fallback keyword summaries are used.
5. `data/news.json` is updated and the dashboard is deployed to GitHub Pages.

## Required GitHub setting

Repository → Settings → Pages → Build and deployment → Source → GitHub Actions

## Optional secret

Repository → Settings → Secrets and variables → Actions → New repository secret

- Name: `OPENAI_API_KEY`
- Value: your OpenAI API key

## Local test

```bash
npm install
npm run fetch
npm run serve
```

Open `http://localhost:8000`.

## Notes

- Some official Vietnamese sources use dynamic pages and may block simple crawlers. Failed sources are recorded in `data/fetch-log.json`.
- Media articles are for early warning and should be verified against official agency, exchange, or company disclosures before reporting.
- This dashboard is a monitoring tool, not legal, investment, or financial advice.
