# Research brief (for every research agent)

Project: **More than Human Inspire** — a bilingual (English / Simplified Chinese) gallery at morethanhuman.reality.design
of More-than-Human Design, Bio Design, Human × Biocomputing and Organoid Computing Design works, made by
Reality Design Lab as idea material for designers, researchers and students. Working dir:
`/Users/amber/Projects/HoloKit/HoloKit2/mth-inspire`.

Read first: `data/SCHEMA.md` (JSON format, language rule) and `data/taxonomy.json` (field / sub / organisms / kind ids).

## What to collect
- The most important and most inventive works in your scope: landmark papers, research prototypes, artworks,
  products, speculative projects. Breadth first, then depth: for each key creator, collect **all** their relevant works.
- Every work: bilingual text, a correct classification, and as many of these as exist:
  **paper** (DOI / arXiv / publisher URL, with venue), **video** (YouTube / Vimeo / X / mp4), **images** (1–3 direct image URLs).
- Aim for a visual on every work. Good image sources: the project page's `og:image` (`python3 tools/check_media.py --og <page>`),
  lab / studio project pages, arXiv HTML figures, museum pages. Avoid Instagram / Pinterest CDN links (they expire).
- Verify everything with `python3 tools/check_media.py` before writing it: videos and images (`<url>`), DOIs (`--doi`), arXiv ids (`--arxiv`).
  Keep only `"ok": true`. Check that a DOI's returned title really is the work — never guess a DOI.
- Year = year of the paper / first public showing.

## Writing
- `description`: 1–2 sentences, concrete: what it is and what happens. `idea_en`: the one-line core idea a designer should take away.
  `method`: how it works (organism, process, tech), one sentence. Chinese versions natural, not word-for-word.
- Plain, precise language. No hype ("groundbreaking", "revolutionary").

## Output
- One file `data/raw/<your-batch>.json` (`"batch": "<your-batch>"`), creators + works + leads. You may split into
  several files if large (`<your-batch>-2.json`).
- Before creating a creator, `grep -ril "<surname>" data/raw/` to see if another agent already created them; if so, reuse that id
  (you may still add the works that belong to your scope). Creator ids: kebab-case of the name (`lining-yao`, `cortical-labs`).
- Work id: `<first-creator-id>--<short-slug>`.
- Run `python3 tools/validate.py data/raw/<file>.json` until it prints ✓.
- `leads`: people / labs you found but did not research (for the next round).
- Do NOT use the Chrome browser tools (shared with other agents). Use web search / fetch and `curl`.
- Do NOT touch files outside `data/raw/` and `temp/`.

## Report back (short)
File(s) written, number of creators and works, how many have video / images / paper, notable gaps, top leads.
