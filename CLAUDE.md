# Claude Code Project Context

Use this repository's project Skill as the source of truth:

`skills/skillrush-town/SKILL.md`

For ingestion changes, also read:

- `skills/skillrush-town/references/source-contract.md`
- `scripts/clawhub_daily.py`
- `tests/test_clawhub_daily.py`

For publishing or GitHub Pages changes, also read:

- `skills/skillrush-town/references/publishing.md`
- `.github/workflows/update.yml`
- `assets/app.js`
- `index.html`
- `README.md`

## Headless-First Rule

Default validation must not require Chrome, Playwright, Puppeteer, Camofox, Selenium, or any browser login state.

Required checks:

```bash
python -m py_compile scripts/clawhub_daily.py
python -m pytest -q
```

Browser/manual page checks are optional release checks, not baseline CI requirements.

## Do Not Drift the Source Contract

The canonical ClawHub ranking source is Convex `skills:listPublicPageV4` via `POST https://wry-manatee-359.convex.cloud/api/query`.

Top100 is built by requesting 4 pages with `numItems=25` and carrying `nextCursor` into the next request as `cursor`.
