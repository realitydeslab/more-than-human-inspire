# More than Human Inspire

**https://more-than-human.reality.design**

Design with more than humans. A bilingual (English / 中文) gallery of **More-than-Human Design**, **Bio Design**, **Human × Biocomputing**, **Organoid Computing Design**, **Animal–Computer Interaction** and **Human–Nature Interaction**: papers, research prototypes, artworks, products and speculative projects. Every work has its core idea, how it works, and links to its paper, video and images. Built by [Reality Design Lab](https://reality.design) as idea material for designers, researchers and students; a sibling of [Reality Design Inspire](https://inspire.reality.design).

## What's inside

- **Atlas**: the four fields and their sub-categories at a glance, plus collections.
- **Six field views**, each grouped by sub-category:
  - More-than-Human Design: multispecies design, animal–computer interaction, ecological sensing & care, speculation & decentering, interspecies art, theory & methods.
  - Bio Design: mycelium, microbial fabrication, algae, grown objects, bio-textiles, bio-responsive materials, living architecture, bioprinting & biofabrication, genetic & synthetic biology design, bio art.
  - Human × Biocomputing: living interfaces, plant interfaces & cyborg botany, fungal & slime-mould computing, microbial sensors & wearables, biohybrid robots, DNA & molecular computing, body & biosignals.
  - Organoid Computing Design: organoid intelligence, neurons that learn & play, wetware platforms, interfaces for organoids, neural culture art, ethics & futures.
  - Animal–Computer Interaction: pets & companion animals, play & robots, working animals, zoo enrichment, interspecies communication, wildlife & farm, theory & ethics.
  - Human–Nature Interaction: nature connection, outdoor technology, citizen science, gardening, sensing other worlds, eco-feedback, digital nature, theory.
- **All works**: filter by field, organism (fungi, slime mould, bacteria, algae, plants, animals, insects, cells, neurons, DNA, ecosystems, human body), type (paper, prototype, artwork, product, speculative, book), collection and era; full-text search.
- **Papers**: every work with a paper, with venue and DOI (checked against Crossref / arXiv).
- **Collections**: sets of works that belong together — the systems analysed in a survey paper (e.g. Breed et al. 2026, Ikeya et al. CHI 2025) or the winners of an award (BAD Award).
- **Creators**: people, labs, studios and companies, with bios and all their works.
- **Starred**: star works in your browser, export them as `SKILL.md`, `README.md` or a reading list with DOIs.

## For AI assistants

- [`llms.txt`](llms.txt): index
- [`catalog.md`](catalog.md) / [`catalog.zh.md`](catalog.zh.md): full catalog in English / Chinese
- [`data/entries.json`](data/entries.json): raw data

## Maintain it with AI

Open this folder in [Claude Code](https://claude.com/claude-code) and run:

```text
/add-work Neri Oxman
/add-work https://doi.org/10.1145/3706598.3713343
/add-work https://arxiv.org/abs/2601.15804
```

`/add-work` (in [`.claude/commands/`](.claude/commands/)) researches the creator, paper or project, adds every relevant work in both languages with verified paper / video / image links, rebuilds and publishes. The research rules are in [`data/RESEARCH_BRIEF.md`](data/RESEARCH_BRIEF.md) and the data format in [`data/SCHEMA.md`](data/SCHEMA.md).

| Script | Purpose |
|---|---|
| `python3 tools/check_media.py <url>…` / `--doi` / `--arxiv` / `--og <page>` | Check videos, images, DOIs and arXiv ids; list image candidates on a page |
| `python3 tools/validate.py data/raw/<file>.json` (or `--all`) | Check a batch: required bilingual fields, taxonomy ids, duplicates |
| `python3 tools/build_data.py [--recheck]` | Merge batches, verify every link, write `data/entries.*`, catalogs and `llms.txt`; warns about works removed since the last build |
| `python3 tools/audit_titles.py` | List same-title works across batches (possible duplicates) |
| `tools/publish.sh "<message>"` | Validate all, rebuild, refuse on errors or unexpected removals, commit and push |

## Run locally

```bash
./serve.sh   # rebuilds data/ and serves http://localhost:8932
```

## Data layout

| Path | Contents |
|---|---|
| `data/taxonomy.json` | Fields and sub-categories, organisms, work types, collections |
| `data/raw/*.json` | Research batches: creators, works, leads |
| `data/collections/*.json` | Extra members of a collection (lists of work ids) |
| `data/overrides.json` | Optional manual curation: merge creators, drop or patch works |
| `data/entries.json`, `data/entries.js` | Built dataset used by the site |
| `data/media_cache.json` | Link-check results |
| `data/dropped.json` | Dead links and DOI/title mismatches found at build |
| `data/leads.json` | People and labs found but not yet researched |

## Credits

Images and videos are linked from the creators, labs, museums and publishers and remain theirs. To suggest a correction or an addition, please open an issue.

---

# More than Human Inspire（中文）

**https://more-than-human.reality.design**

与万物一起设计。这是一个中英双语的作品库，收录**超越人类的设计**、**生物设计**、**人类 × 生物计算**、**类器官计算设计**、**动物-计算机交互**与**人与自然交互**六个领域的论文、研究原型、艺术作品、产品和思辨设计项目。每件作品都写明核心想法和实现方式，并附上论文、视频和图片链接。由 [Reality Design Lab](https://reality.design) 整理，是 [Reality Design Inspire](https://inspire.reality.design) 的姊妹站。

- **总览**：四个领域及其子类，以及各个合集。
- **六个领域页**：按子类分组浏览。
- **全部作品**：按领域、生物、类型、合集和年代筛选，支持全文搜索。
- **论文**：所有附带论文的作品，列出发表处与 DOI（已经过 Crossref / arXiv 核对）。
- **合集**：一篇综述论文分析过的系统（如 Breed 等 2026、Ikeya 等 CHI 2025），或一个奖项的获奖作品（BAD Award）。
- **创作者**、**收藏**（可导出 `SKILL.md`、`README.md` 或附 DOI 的阅读清单）。

在 Claude Code 中打开本仓库，输入 `/add-work <名字、DOI 或链接>` 即可让 AI 调研并添加新作品。本地运行：`./serve.sh`。

图片与视频版权归原作者、实验室、博物馆和出版方所有。如需更正或补充，欢迎提交 issue。
