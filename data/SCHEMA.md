# Data schema — More than Human Inspire

Each research batch writes one file: `data/raw/<batch>.json`

```json
{
  "batch": "organoid-core",
  "creators": [ Creator, ... ],
  "works":    [ Work, ... ],
  "leads":    [ Lead, ... ]
}
```

## Creator (a person, a lab, a studio or a company)
```json
{
  "id": "lining-yao",                        // kebab-case, unique across all batches
  "name": "Lining Yao",
  "kind": "person",                          // person | lab | studio | company
  "role": "Associate Professor, UC Berkeley; director of the Morphing Matter Lab",
  "based": "Berkeley, US",
  "bio": "1-2 sentences, English.",
  "why": "Why they matter for more-than-human / bio design (1 sentence).",
  "links": { "site": "", "scholar": "", "x": "", "instagram": "", "vimeo": "", "youtube": "", "github": "" },
  "role_zh": "…", "bio_zh": "…", "why_zh": "…", "based_zh": "伯克利，美国",   // REQUIRED Chinese versions
  "connected_to": ["hiroshi-ishii"],         // other creator ids (collaborators, same lab, advisor)
  "discovered_via": "seed"                   // creator id that led to this one, or "seed"
}
```

## Work (one project, paper, artwork, product or prototype)
```json
{
  "id": "lining-yao--biologic",              // <first-creator-id>--<slug>, unique
  "creator_ids": ["lining-yao", "mit-tangible-media"],
  "title": "bioLogic: Natto Cells as Nanoactuators for Shape-Changing Interfaces",
  "year": 2015,
  "field": "bio",                            // primary field: mth | bio | biohybrid | organoid | hni  (data/taxonomy.json)
  "sub": "responsive",                       // one sub-category id of that field
  "also": ["biohybrid"],                     // optional: other fields it clearly belongs to
  "organisms": ["bacteria"],                 // 1-3 from the organism vocabulary
  "kind": "paper",                           // paper | prototype | artwork | product | speculative | publication
  "description": "1-2 sentences, English: what it is and what happens.",
  "description_zh": "中文描述（自然流畅，不逐字翻译）",
  "idea_en": "One-line core idea in English.",
  "idea_zh": "一句话中文：核心想法",
  "method": "One English sentence: how it works (organism, process, technology). Mark guesses with 'likely'.",
  "method_zh": "中文：它是怎么做到的。",
  "keywords": ["Bacillus subtilis natto", "hygromorphic", "wearable"],   // free keywords, proper nouns in original

  "video":  { "url": "https://vimeo.com/…" },          // optional: YouTube | Vimeo | X | direct .mp4
  "images": ["https://…/hero.jpg"],                     // optional: 1-4 direct image URLs (jpg/png/webp/gif)
  "paper":  { "url": "https://dl.acm.org/doi/10.1145/2702123.2702611", "doi": "10.1145/2702123.2702611",
              "arxiv": "", "venue": "CHI 2015", "title": "bioLogic: Natto Cells as Nanoactuators…" },  // title = the paper's own title; REQUIRED when kind = paper
  "source_url": "https://tangible.media.mit.edu/project/biologic/",   // project page / article (recommended)
  "code_url": "",                                       // optional repository
  "collections": ["breed-2026"]                         // optional: collection ids from data/taxonomy.json
}
```

Rules:
- Every work needs **at least one** of `video`, `images`, `paper`. Aim for a visual (video or image) on every work;
  a paper-only work shows a typographic card.
- `paper.doi` is checked against Crossref and `paper.arxiv` against arXiv at build time: use the real DOI, never a guess.
- Images: direct URLs to image files (`og:image` of the project page is usually best). Must return `image/*`.
- Videos: prefer the creator's own upload.

Verify media before writing (all must print `"ok": true`):
```
python3 tools/check_media.py <video-or-image-url> ...
python3 tools/check_media.py --doi 10.1145/2702123.2702611
python3 tools/check_media.py --arxiv 2301.01234
python3 tools/check_media.py --og <project-page-url>      # lists og:image / twitter:image / large <img> candidates
```

## Collections
A collection is a named set of works: the systems analysed in a survey paper, the winners of an award.
Defined in `data/taxonomy.json` → `collections` (`id, type, en, zh, desc_en, desc_zh, url`, optional `work` = the survey paper's work id). `type`: `survey` | `award` | `exhibition` | `venue`.
A work joins by listing the id in its `collections`, or by adding its work id to `data/collections/<collection-id>.json`
(a JSON list of work ids — use this for works that already exist in another batch). Awards are collections, never creators.
New collections: do not edit taxonomy.json concurrently — define them in `data/collections/defs/<your-batch>.json` (a JSON list of collection objects); the build merges them.

## Extra media (`data/media/<name>.json`)
Images or a video found later for existing works, kept out of the research batches so passes never edit each other's files:
`{ "<work-id>": { "images": ["https://…"], "video": { "url": "https://…" } } }` — images are appended (max 4), a video is used only when the work has none.

## Lead (person/lab found but not researched in this batch)
```json
{ "name": "…", "why": "…", "link": "…", "found_via": "creator id", "status": "open" }   // open | no_media | off_topic | duplicate
```

## Language rule
Every user-facing text exists in BOTH languages, never mixed inside one field (proper nouns — titles,
people, labs, species names, products — stay in the original).
English fields: description, idea_en, method, role, bio, why, based.
Chinese fields: description_zh, idea_zh, method_zh, role_zh, bio_zh, why_zh, based_zh.
Run `python3 tools/validate.py data/raw/<file>.json` before building.
