"""Markdown catalog of the gallery for AI assistants (llms.txt convention).

catalog_md(data, lang) -> every field and sub-category with its works, then every creator.
llms_txt(data)         -> short index pointing to the full files.
"""
SITE = "https://more-than-human.reality.design"

T = {
    "en": {
        "title": "More than Human Inspire — catalog",
        "intro": ("A catalog of More-than-Human Design, Animal–Computer Interaction, Human–Nature Interaction, Bio Design, "
                  "Biocomputing, Organoid Computing, Eco Art, Speculation & Politics and AI × Nonhuman: "
                  "papers, prototypes, artworks and products, compiled by Reality Design Lab as idea material for designers and researchers. "
                  "Each work lists its core idea, how it works, and links to its paper, video and images."),
        "how": "How an AI assistant should use this file",
        "how_items": [
            "Ground ideas in the specific works below and name the work and creator you draw on.",
            "Cite papers with the DOI / URL given here; do not invent references.",
            "Combine organisms, methods and fields across works to propose new directions.",
            "Do not invent details that are not stated here; the links are the reference.",
        ],
        "creators": "Creators", "orgs": "Organizations & resources", "idea": "Idea", "what": "What it is", "method": "How it works",
        "paper": "Paper", "video": "Video", "images": "Images", "page": "Project page", "code": "Code",
        "organisms": "Organisms", "kind": "Type",
    },
    "zh": {
        "title": "More than Human Inspire — 作品目录",
        "intro": ("超越人类的设计、生物设计、人类 × 生物计算、类器官计算设计、动物-计算机交互与人与自然交互的作品目录：论文、研究原型、艺术作品和产品，"
                  "由 Reality Design Lab 整理，作为设计师和研究者的灵感库。每件作品都列出核心想法、实现方式，以及论文、视频和图片链接。"),
        "how": "AI 助手应如何使用这个文件",
        "how_items": [
            "提出想法时，以下面的具体作品为依据，并说明借鉴的是哪件作品、哪位创作者。",
            "引用论文时使用这里给出的 DOI 或链接，不要编造参考文献。",
            "把不同作品的生物、方法和领域组合起来，提出新的方向。",
            "不要编造这里没有写到的细节，以链接为准。",
        ],
        "creators": "创作者", "orgs": "组织与资源", "idea": "核心想法", "what": "作品内容", "method": "实现方式",
        "paper": "论文", "video": "视频", "images": "图片", "page": "项目主页", "code": "代码",
        "organisms": "生物", "kind": "类型",
    },
}


def _label(pairs: list, key: str, zh: bool) -> str:
    row = next((p for p in pairs if p[0] == key), None)
    return (row[2] if zh else row[1]) if row else key


def _work(w: dict, lang: str, names: dict, tax: dict) -> str:
    s, zh = T[lang], lang == "zh"
    who = ", ".join(names.get(c, c) for c in w["creator_ids"])
    p = w.get("paper") or {}
    lines = [
        f"#### {w['title']} — {who}" + (f" ({w['year']})" if w.get("year") else ""),
        f"- {s['kind']}: {_label(tax['kinds'], w.get('kind', ''), zh)} · {s['organisms']}: "
        + ", ".join(_label(tax["organisms"], o, zh) for o in w.get("organisms", [])),
        f"- {s['idea']}: {w.get('idea_zh' if zh else 'idea_en', '')}",
        f"- {s['what']}: {w.get('description_zh' if zh else 'description', '')}",
        f"- {s['method']}: {w.get('method_zh' if zh else 'method', '')}",
        f"- {s['paper']}: {p['url']}" + (f" ({p['venue']})" if p.get("venue") else "") if p.get("url") else "",
        f"- {s['video']}: {w['video']['url']}" if w.get("video") else "",
        f"- {s['images']}: {' '.join(w['images'])}" if w.get("images") else "",
        f"- {s['page']}: {w['source_url']}" if w.get("source_url") else "",
        f"- {s['code']}: {w['code_url']}" if w.get("code_url") else "",
    ]
    return "\n".join(x for x in lines if x)


def catalog_md(data: dict, lang: str) -> str:
    s, zh = T[lang], lang == "zh"
    tax = data["taxonomy"]
    names = {c["id"]: c["name"] for c in data["creators"]}
    counts = (f"{len(data['creators'])} 位创作者 · {len(data['works'])} 件作品" if zh
              else f"{len(data['creators'])} creators · {len(data['works'])} works")
    out = [f"# {s['title']}", "", s["intro"], "", f"{SITE} · {data['generated']} · {counts}", "", f"## {s['how']}", ""]
    out += [f"- {x}" for x in s["how_items"]] + [""]
    for f in tax["fields"]:
        fw = [w for w in data["works"] if w["field"] == f["id"]]
        if not fw:
            continue
        out += [f"## {f['zh'] if zh else f['en']}", "", f["desc_zh" if zh else "desc_en"], ""]
        for sub in f["subs"]:
            sw = [w for w in fw if w.get("sub") == sub["id"]]
            if not sw:
                continue
            out += [f"### {sub['zh'] if zh else sub['en']}", "", sub["desc_zh" if zh else "desc_en"], ""]
            out += ["\n\n".join(_work(w, lang, names, tax) for w in sw), ""]
    orgs = data.get("orgs") or []
    if orgs:
        out += [f"## {s['orgs']}", ""]
        for ot in tax.get("org_types", []):
            group = [o for o in orgs if o.get("type") == ot[0]]
            if not group:
                continue
            out += [f"### {ot[2] if zh else ot[1]}", ""]
            for o in group:
                desc = o.get("description_zh" if zh else "description", "")
                based = o.get("based_zh" if zh else "based", "")
                out.append(f"- **{o['name']}**" + (f" ({based})" if based else "") + f" — {desc} {o['url']}")
            out.append("")
    out += [f"## {s['creators']}", ""]
    for c in sorted(data["creators"], key=lambda c: (-c.get("work_count", 0), c["name"])):
        role = c.get("role_zh" if zh else "role", "")
        bio = c.get("bio_zh" if zh else "bio", "")
        site = (c.get("links") or {}).get("site", "")
        out.append(f"- **{c['name']}** ({c.get('work_count', 0)}) — {role}. {bio}" + (f" {site}" if site else ""))
    return "\n".join(out).rstrip() + "\n"


def llms_txt(data: dict) -> str:
    fields = ", ".join(f"{f['en']} ({sum(w['field'] == f['id'] for w in data['works'])})" for f in data["taxonomy"]["fields"])
    return "\n".join([
        "# More than Human Inspire",
        "",
        f"> {T['en']['intro']}",
        "",
        f"{len(data['creators'])} creators, {len(data['works'])} works ({fields}), "
        f"{sum(bool(w.get('paper')) for w in data['works'])} with papers, {len(data.get('orgs') or [])} organizations & resources, updated {data['generated']}. "
        "Bilingual (English / Simplified Chinese).",
        "",
        "## Full catalog",
        "",
        f"- [English catalog]({SITE}/catalog.md): every field and sub-category with all works, then all creators",
        f"- [Chinese catalog]({SITE}/catalog.zh.md): 中文版完整目录",
        f"- [Raw data (JSON)]({SITE}/data/entries.json)",
        "",
        "## Website",
        "",
        f"- [{SITE}]({SITE}): images and videos, paper links, filters by field, organism and type, starring and SKILL.md export",
        "",
    ])
