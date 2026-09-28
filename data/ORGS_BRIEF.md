# Organizations & Resources brief (for every orgs research agent)

The gallery at more-than-human.reality.design gets a new category: **Organizations & Resources** — the research
centres, labs, nonprofits, networks, funders, programmes, event series, journals/podcasts/reports, directories/datasets
and companies that make up the more-than-human / bio design / interspecies / nonhuman-minds field. Working dir:
`/Users/amber/Projects/HoloKit/HoloKit2/mth-inspire`.

Read first: `data/SCHEMA.md` → section **Organization**, and `data/taxonomy.json` → `org_types`, `org_themes`, `fields`.

## Goal: exhaustive
- Collect EVERY relevant organization/resource in your scope, not a sample. Snowball: every org's "partners", "network",
  "resources", "links", "friends", "funded by", "members" and "people" pages lead to more orgs. Directories and
  resource lists (e.g. https://sentient-futures.notion.site/aixa, interspecies.io/resources, nonhumanminds.org events,
  awesome-lists on GitHub, Wikipedia categories) are gold — harvest them completely and record `found_via`.
- Only include orgs that are real and currently or historically significant; the `url` must load (check with
  `python3 tools/check_media.py --og <url>`, which also returns image candidates for `image`).
- One record per organization. Big institutions only when a specific unit is in scope (e.g. "MIT Media Lab — Mediated
  Matter", not "MIT").
- Bilingual `description` / `description_zh` (1–2 concrete sentences: what it does, for whom). Plain language, no hype.
- `creator_id`: if the org already exists as a creator in the works data (`grep -i "<name>" data/creators_index.txt`), put its id.
- `image`: prefer the site's og:image (a representative photo) over a tiny logo; skip if none passes check_media.

## Output
- Your file only: `data/orgs/<your-batch>.json` (`{"batch": "...", "orgs": [...]}`); split into -2, -3 if large.
- Before adding an org, grep `data/orgs/*.json` for its name/url — parallel agents write too; do not duplicate.
- Validate: `python3 tools/validate_orgs.py data/orgs/<file>.json` until ✓.
- Search: if the WebSearch tool fails, use curl / WebFetch on directories and org sites, Wikipedia API, GitHub,
  and sparingly `curl -s -A "Mozilla/5.0" "https://html.duckduckgo.com/html/?q=<query>"` (stop if it shows a captcha).
  Notion public pages: try `https://<site>.notion.site/api/v3/loadPageChunk` / `loadCachedPageChunk` (POST JSON
  `{"pageId": "<uuid>", "limit": 100, "cursor": {"stack": []}, "chunkNumber": 0, "verticalColumns": false}`)
  or `https://notion-api.splitbee.io/v1/page/<pageId>` to read the content.
- No Chrome browser tools. Scratch: `temp/orgs-<your-batch>/`.

## Report back (short)
File(s), number of orgs by type and theme, directories harvested, notable gaps, leads.
