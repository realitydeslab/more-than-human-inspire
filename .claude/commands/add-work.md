---
description: Research one or more creators, labs or works for More than Human Inspire, add them (bilingual, classified, with paper / video / images), rebuild the site and catalogs, and publish.
argument-hint: <name, lab, paper DOI/URL or project URL> [, another …] [--no-push]
---

# Add to More than Human Inspire

Input: `$ARGUMENTS` — one or more people, labs, studios, companies, papers (DOI / arXiv / URL) or project pages, comma-separated. `--no-push` = build and preview locally, do not commit or publish.

The gallery collects More-than-Human Design, Bio Design, Human × Biocomputing and Organoid Computing Design works.
Read `data/SCHEMA.md`, `data/taxonomy.json` and `data/RESEARCH_BRIEF.md` first.

## Steps

1. **Sync.** `git pull --ff-only`.
2. **Identify.** Resolve each input to a creator. `grep -i "<name>" data/creators_index.txt` — if they exist, reuse the id and add only missing works. For a single paper or project, add it under its first author / studio.
   Several inputs → one subagent each, in parallel, each writing its own file.
3. **Research all relevant works** (site, Google Scholar, ACM DL, YouTube / Vimeo, press). For each: paper (DOI, venue, the paper's own title), video, 1–3 images.
   Verify with `python3 tools/check_media.py <url>…`, `--doi <doi>`, `--arxiv <id>`, `--og <page>` (image candidates). Keep only `"ok": true`; check that a DOI's title is the right paper.
4. **Write** `data/raw/add-<creator-id>.json` with creators, works (field / sub / organisms / kind from the taxonomy, English + Chinese text), leads.
5. **Validate.** `python3 tools/validate.py data/raw/add-<creator-id>.json` until ✓.
6. **Build.** `python3 tools/build_data.py`. Check `data/dropped.json` (dead media, DOI title mismatches) and fix what is yours.
7. **Preview** (optional): `./serve.sh`, open `http://localhost:8932/#view=works&q=<name>`.
8. **Publish** (skip with `--no-push`):
   `git add data index.html catalog.md catalog.zh.md llms.txt && git commit -m "feat(data): add <name> (<n> works)" && git push`.
   GitHub Pages redeploys https://morethanhuman.reality.design in about a minute.
9. **Report**: what was added (counts per field), notable works, what was left out and why, new leads, live URL.
