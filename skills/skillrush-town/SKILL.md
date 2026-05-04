---
name: skillrush-town
description: "Use when building, maintaining, forking, or publishing Skillrush Town / 淘金小镇 Skill; tracking ClawHub Top100 downloads snapshots; generating daily Skill reports; evaluating ClawHub source changes; or packaging a public GitHub Pages skill radar."
---

# Skillrush Town

## First Reads

When this skill triggers inside the repo, read:

- `README.md` for product positioning and user paths.
- `scripts/clawhub_daily.py` before changing data generation.
- `data/dates.json` and the latest `data/snapshots/*.json` before changing the UI.
- `assets/app.js`, `assets/styles.css`, and `index.html` before changing the page.
- `references/source-contract.md` before changing ClawHub request semantics.
- `references/publishing.md` before changing GitHub Pages or Actions.

## Product Direction

Maintain two surfaces:

- **Public town board**: a phone-friendly GitHub Pages site where anyone can
  read the latest ClawHub Top100, growth lists, potential Skills, and history.
- **Forkable Skill generator**: a repo plus Skill that lets users generate their
  own Skill radar without copying private tokens or personal notes.

Keep the default story simple: "每天从 ClawHub 榜单里淘出增长最快的 AI Skill."

## Source Rules

- The canonical ranking source is Convex `api/query`, path
  `skills:listPublicPageV4`.
- Request args must keep `sort=downloads`, `dir=desc`,
  `nonSuspiciousOnly=true`, `highlightedOnly=false`, `numItems=25`.
- Build Top100 by following `nextCursor` for 4 pages.
- Do not use `GET /api/v1/skills` as the primary ranking basis.
- If API fields, path, or pagination change, write the limitation into both
  snapshot and report.

## Daily Report Rules

Every run must produce:

- `data/snapshots/YYYY-MM-DD.json`
- `data/reports/YYYY-MM-DD.md`
- `data/latest.json`
- `data/dates.json`

Reports must include new entries, dropped entries, Top10 changes, downloads
growth Top10, stars growth Top10, and potential Skills. If there is no potential
Skill, explicitly write `今日无新增潜力skill`.

Never describe the first run, migration run, or missing-history comparison as a
strict daily delta.

## Potential Skill Criteria

Include at most 10. A Skill qualifies if any condition is true:

- new Top100 entry
- download delta Top20 and star delta Top30
- rank rises by at least 8 places

Each potential Skill needs name, rank change, download/star delta, and one short
recommendation.

## Writing Style

For public README and release text, keep the town/gold-rush metaphor but avoid
AI-marketing boilerplate. Prefer concrete use cases over abstract claims. Do not
say "empower", "ecosystem flywheel", "comprehensive platform", or similar filler.

## Validate

Run:

```bash
python -m py_compile scripts/clawhub_daily.py
python -m pytest -q
python "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" skills/skillrush-town
```

For a local page check:

```bash
python -m http.server 8093
```

Open `http://127.0.0.1:8093/?date=2026-05-04` and verify the date selector,
Top10, limitation panel, potential Skill section, search, and Top100 table.

