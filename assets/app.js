/* More than Human Inspire — gallery app. Data: data/entries.js (window.MTH). Strings: assets/i18n.js. */
(() => {
  "use strict";

  const DATA = window.MTH || { creators: [], works: [], taxonomy: { fields: [], organisms: [], kinds: [] }, generated: "" };
  const I18N = window.MTH_I18N;
  const TX = window.MthText;
  const TAX = DATA.taxonomy;
  const FIELDS = TAX.fields;
  const GROUPS = TAX.field_groups || [{ id: "all", en: "", zh: "", fields: FIELDS.map((f) => f.id) }];
  const ALIAS = Object.fromEntries((TAX.aliases || []).map((a) => [a.from.join("/"), a.to]));
  const COLS = TAX.collections || [];
  const APPS = TAX.approaches || [];
  const DISCS = TAX.disciplines || [];
  const ERAS = [["1999", 0, 1999, "≤1999"], ["2000", 2000, 2009, "2000–09"], ["2010", 2010, 2014, "2010–14"], ["2015", 2015, 2019, "2015–19"], ["2020", 2020, 2030, "2020–26"]];
  let ORGS = DATA.orgs || [];
  const OTYPES = TAX.org_types || [];
  const OTHEMES = TAX.org_themes || [];
  const VIEWS = ["atlas", ...FIELDS.map((f) => f.id), "collections", "orgs", "works", "papers", "creators", "starred"];
  const FILTERED = ["works", "papers", "creators"];

  const creatorsById = Object.fromEntries(DATA.creators.map((c) => [c.id, c]));
  const worksById = Object.fromEntries(DATA.works.map((w) => [w.id, w]));
  const fieldById = Object.fromEntries(FIELDS.map((f) => [f.id, f]));
  const worksByCreator = {};
  DATA.works.forEach((w) => w.creator_ids.forEach((c) => (worksByCreator[c] = worksByCreator[c] || []).push(w)));
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- per-viewer storage (never required for the page to work) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  let lang = store.get("mth-lang", (navigator.language || "").startsWith("zh") ? "zh" : "en");
  let stars = new Set(store.get("mth-stars", []).filter((id) => worksById[id]));
  const S = () => I18N[lang];
  const zh = () => lang === "zh";
  const nm = (o) => (zh() ? o.zh : o.en);
  const pair = (list, k) => { const r = list.find((x) => x[0] === k); return r ? (zh() ? r[2] : r[1]) : k; };
  const orgName = (k) => pair(TAX.organisms, k);
  const kindName = (k) => pair(TAX.kinds, k);
  const appName = (k) => pair(APPS, k);
  const discName = (k) => pair(DISCS, k);
  const subOf = (w) => (fieldById[w.field]?.subs || []).find((s) => s.id === w.sub);
  const src = (p) => S().sources[p] || p;

  const state = { view: "atlas", oq: "", otype: "", otheme: "", q: "", apps: new Set(), discs: new Set(), cols: new Set(), fields: new Set(), orgs: new Set(), kinds: new Set(), era: "", sort: "new", creator: "", video: false, paper: false, sub: "" };
  let currentList = [];
  let openIndex = -1;
  let mediaIndex = 0;

  /* ---------- state <-> URL hash ---------- */
  const set = (p, k) => new Set((p.get(k) || "").split(",").filter(Boolean));
  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    const moved = ALIAS[`${p.get("view")}/${p.get("sub")}`];  // old category links → where they moved
    if (moved) { p.set("view", moved[0]); p.set("sub", moved[1]); }
    state.view = VIEWS.includes(p.get("view")) ? p.get("view") : "atlas";
    Object.assign(state, { q: p.get("q") || "", apps: set(p, "a"), discs: set(p, "d"), cols: set(p, "col"), fields: set(p, "f"), orgs: set(p, "o"), kinds: set(p, "k"), era: p.get("era") || "",
      sort: p.get("sort") || "new", creator: p.get("c") || "", video: p.get("v") === "1", paper: p.get("p") === "1", sub: p.get("sub") || "" });
    Object.assign(state, { otype: p.get("ot") || "", otheme: p.get("oth") || "", oq: p.get("oq") || "" });
    return { work: p.get("w") };
  }
  function writeHash(workId) {
    const p = new URLSearchParams();
    if (state.view !== "atlas") p.set("view", state.view);
    if (fieldById[state.view] && state.sub) p.set("sub", state.sub);
    if (FILTERED.includes(state.view)) {
      if (state.q) p.set("q", state.q);
      if (state.cols.size) p.set("col", [...state.cols].join(","));
      if (state.apps.size) p.set("a", [...state.apps].join(","));
      if (state.discs.size) p.set("d", [...state.discs].join(","));
      if (state.fields.size) p.set("f", [...state.fields].join(","));
      if (state.orgs.size) p.set("o", [...state.orgs].join(","));
      if (state.kinds.size) p.set("k", [...state.kinds].join(","));
      if (state.era) p.set("era", state.era);
      if (state.sort !== "new") p.set("sort", state.sort);
      if (state.creator) p.set("c", state.creator);
      if (state.video) p.set("v", "1");
      if (state.paper) p.set("p", "1");
    }
    if (state.view === "orgs") {
      if (state.otype) p.set("ot", state.otype);
      if (state.otheme) p.set("oth", state.otheme);
      if (state.oq) p.set("oq", state.oq);
    }
    if (workId) p.set("w", workId);
    history.replaceState(null, "", "#" + p.toString());
  }

  /* ---------- filtering ---------- */
  const creatorNames = (w) => w.creator_ids.map((id) => creatorsById[id]?.name || id);
  const inField = (w, f) => w.field === f || (w.also || []).includes(f);
  function haystack(w) {
    if (w._h) return w._h;
    return (w._h = [w.title, w.description, w.description_zh, w.idea_en, w.idea_zh, w.method, w.method_zh, w.paper?.venue, ...(w.keywords || []),
      ...(w.organisms || []).map((o) => pair(TAX.organisms, o)), ...creatorNames(w), w.year].join(" ").toLowerCase());
  }
  let qLower = "";
  function matches(w, skip = "") {
    if (state.creator && !w.creator_ids.includes(state.creator)) return false;
    if (state.video && !w.video?.url) return false;
    if (state.paper && !w.paper?.url) return false;
    if (skip !== "a" && state.apps.size && !(w.approaches || []).some((x) => state.apps.has(x))) return false;
    if (skip !== "d" && state.discs.size && !(w.disciplines || []).some((x) => state.discs.has(x))) return false;
    if (skip !== "c" && state.cols.size && !(w.collections || []).some((c) => state.cols.has(c))) return false;
    if (skip !== "f" && state.fields.size && ![...state.fields].some((f) => inField(w, f))) return false;
    if (skip !== "o" && state.orgs.size && !(w.organisms || []).some((o) => state.orgs.has(o))) return false;
    if (skip !== "k" && state.kinds.size && !state.kinds.has(w.kind)) return false;
    if (state.era) {
      const e = ERAS.find((x) => x[0] === state.era);
      if (!w.year || w.year < e[1] || w.year > e[2]) return false;
    }
    if (state.q && !haystack(w).includes(qLower)) return false;
    return true;
  }
  function sorted(list) {
    const arr = [...list];
    if (state.sort === "old") arr.sort((a, b) => (a.year || 9999) - (b.year || 9999));
    else if (state.sort === "creator") arr.sort((a, b) => creatorNames(a)[0].localeCompare(creatorNames(b)[0]) || (a.year || 0) - (b.year || 0));
    else arr.sort((a, b) => (b.year || 0) - (a.year || 0));
    return arr;
  }

  /* ---------- cards ---------- */
  const poster = (w) => w.video?.thumbnail || (w.images || [])[0] || "";
  /* Card-sized variants of hotlinked images (much lighter on phones); the original is the fallback. */
  /* Pick an image size that is sharp where it is shown: slot width (CSS px) × pixel density (capped at 2),
     rounded up to a size the host offers. The original URL is always the fallback. */
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const need = (cssW) => Math.round(cssW * DPR);
  const CARD_W = () => Math.min(innerWidth - 32, 420);   // grid cards, strips, org cards
  const sizeUp = (px, sizes) => sizes.find((s) => s >= px) || null;
  function small(u, px = need(CARD_W())) {
    if (!u) return u;
    if (u.includes("i.ytimg.com/vi/")) return px <= 320 ? u.replace(/\/(maxresdefault|hqdefault|sddefault)\.jpg/, "/mqdefault.jpg") : u;
    if (u.includes("i.vimeocdn.com/")) { const w = sizeUp(px, [640, 960, 1280]); return w ? u.replace(/-d_\d+(x\d+)?/, `-d_${w}`).replace(/([?&]mw=)\d+/, `$1${w}`) : u; }
    if (u.includes("images.squarespace-cdn.com/") && !/[?&]format=/.test(u)) { const w = sizeUp(px, [500, 750, 1000, 1500, 2500]); return w ? u + (u.includes("?") ? "&" : "?") + `format=${w}w` : u; }
    const wk = sizeUp(px, [640, 960, 1280]);
    if (wk && u.includes("upload.wikimedia.org/wikipedia/commons/thumb/")) return u.replace(/\/\d+px-([^/]+)$/, `/${wk}px-$1`);
    if (wk && /upload\.wikimedia\.org\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/[^/]+\.(jpe?g|png)$/i.test(u)) {
      const m = u.match(/commons\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/);
      return `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${m[3]}/${wk}px-${m[3]}`;
    }
    if (u.includes("covers.openlibrary.org/") && px <= 180) return u.replace(/-L\.jpg/, "-M.jpg");
    return u;
  }
  const imgTag = (u, fallbackHtml, px) => { const s2 = small(u, px); return `<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${esc(s2)}"${s2 !== u ? ` data-o="${esc(u)}"` : ""} alt="" onerror="if(this.dataset.o&&this.src!==this.dataset.o){this.src=this.dataset.o}else{this.outerHTML=this.dataset.ph||''}" data-ph="${esc(fallbackHtml)}">`; };
  const paperPh = (w) => `<div class="ph ph--paper"><span class="ph__venue mono">${esc(w.paper?.venue || S().paper_card)}</span><span class="ph__title">${esc(w.title)}</span></div>`;
  function thumb(w, px) {
    const p = poster(w);
    if (p) return imgTag(p, paperPh(w), px);
    if (w.video?.platform === "mp4") return `<video muted playsinline preload="none" data-src="${esc(w.video.url)}#t=0.8"></video>`;
    return paperPh(w);
  }
  const starBtn = (id, cls = "star") => `<button class="${cls}" type="button" data-star="${esc(id)}" aria-pressed="${stars.has(id)}" aria-label="${esc(S().star_aria)}">${stars.has(id) ? "★" : "☆"}</button>`;
  function card(w) {
    const who = creatorNames(w).join(", ");
    const tags = (w.organisms || []).map((o) => `<span class="tag">${esc(orgName(o))}</span>`).join("");
    const marks = `${w.video?.url ? "▶" : ""}${w.paper?.url ? " ¶" : ""}`.trim();
    return `<div class="cardwrap">
      <button class="card" data-id="${esc(w.id)}" aria-label="${esc(w.title)} — ${esc(who)}">
        <div class="card__media">${thumb(w)}
          <span class="br br--tl"></span><span class="br br--tr"></span><span class="br br--bl"></span><span class="br br--br"></span>
          <span class="card__src">${esc(kindName(w.kind))}${marks ? ` · ${marks}` : ""}</span>
          ${w.year ? `<span class="card__year">${w.year}</span>` : ""}
        </div>
        <div class="card__field mono">${esc(nm(fieldById[w.field] || {}))}${subOf(w) ? ` / ${esc(nm(subOf(w)))}` : ""}</div>
        <div class="card__title">${esc(w.title)}</div>
        <div class="card__meta">${esc(who)}</div>
        <div class="card__idea">${esc(TX.work(w, lang).idea || "")}</div>
        <div class="tags">${tags}</div>
      </button>${starBtn(w.id)}
    </div>`;
  }

  /* ---------- progressive rendering: render the first items, append more as the end scrolls into view ---------- */
  const lazyLists = new Map();
  let lazySeq = 0;
  const lazyIO = "IntersectionObserver" in window ? new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) more(e.target); }), { rootMargin: "1200px 0px" }) : null;
  function fill(el, list, fn, first = 24, step = 36) {
    if (!el) return;
    if (!lazyIO || list.length <= first) { el.innerHTML = list.map(fn).join(""); return; }
    const id = String(++lazySeq);
    el.innerHTML = list.slice(0, first).map(fn).join("");
    lazyLists.set(id, { list, fn, i: first, step });
    const sentinel = document.createElement(el.tagName === "TBODY" ? "tr" : "div");
    sentinel.className = "lazy-sentinel";
    sentinel.dataset.lazy = id;
    if (el.tagName === "TBODY") sentinel.innerHTML = "<td colspan='9'></td>";
    el.append(sentinel);
    lazyIO.observe(sentinel);
  }
  function more(sentinel) {
    const job = lazyLists.get(sentinel.dataset.lazy);
    if (!job) { lazyIO.unobserve(sentinel); sentinel.remove(); return; }
    const next = job.list.slice(job.i, job.i + job.step);
    job.i += next.length;
    sentinel.insertAdjacentHTML("beforebegin", next.map(job.fn).join(""));
    if (job.i >= job.list.length) { lazyIO.unobserve(sentinel); sentinel.remove(); lazyLists.delete(sentinel.dataset.lazy); }
    lazyVideos();
    // the observer only fires on changes; if the end is still near after this batch, keep going
    requestAnimationFrame(() => { if (sentinel.isConnected && near(sentinel)) more(sentinel); });
  }
  const near = (el) => el.getBoundingClientRect().top < innerHeight + 1200;
  let scrollTick = false;
  addEventListener("scroll", () => {  // backup for browsers/tabs where observer callbacks are throttled
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => { scrollTick = false; document.querySelectorAll(".lazy-sentinel").forEach((el) => { if (near(el)) more(el); }); });
  }, { passive: true });
  function resetLazy() { if (lazyIO) lazyIO.disconnect(); lazyLists.clear(); }

  /* ---------- static text, tabs, chips ---------- */
  function applyStatic() {
    document.documentElement.lang = zh() ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = S()[el.dataset.i18n]; });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = S()[el.dataset.i18nHtml]; });
    $("#q").placeholder = S().search_ph;
    $("#langToggle").textContent = S().lang_toggle;
    const years = DATA.works.map((w) => w.year).filter(Boolean);
    $("#stats").innerHTML = [
      [S().stat_works, DATA.works.length], [S().stat_creators, DATA.creators.length],
      [S().stat_papers, DATA.works.filter((w) => w.paper?.url).length], [S().stat_video, DATA.works.filter((w) => w.video?.url).length],
      [S().stat_span, years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "—"],
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    $("#tabs").innerHTML = VIEWS.map((v) => `<button role="tab" class="tab" data-view="${v}">${esc(fieldById[v] ? nm(fieldById[v]) : S()["tab_" + v])}${v === "starred" ? ` <span class="tab__count mono" id="starCount"></span>` : ""}</button>`).join("");
    $("#generated").textContent = DATA.generated ? S().updated(DATA.generated) : "";
    $("#empty").textContent = S().empty;
  }
  function chipRow(label, items, cur, attr, skip) {
    const base = DATA.works.filter((w) => matches(w, skip));
    return `<div class="chiprow"><span class="chiprow__label mono">${esc(label)}</span><div class="chips">${items.map(([k, text, test]) => {
      const n = base.filter(test).length;
      return n || cur.has(k) ? `<button class="chip" data-${attr}="${esc(k)}" aria-pressed="${cur.has(k)}">${esc(text)}<small>${n}</small></button>` : "";
    }).join("")}</div></div>`;
  }
  function renderChips() {
    $("#facetChips").innerHTML =
      chipRow(S().f_field, FIELDS.map((f) => [f.id, nm(f), (w) => inField(w, f.id)]), state.fields, "field", "f") +
      (APPS.length ? chipRow(S().f_approach, APPS.map(([k]) => [k, appName(k), (w) => (w.approaches || []).includes(k)]), state.apps, "app", "a") : "") +
      (DISCS.length ? chipRow(S().f_discipline, DISCS.map(([k]) => [k, discName(k), (w) => (w.disciplines || []).includes(k)]), state.discs, "disc", "d") : "") +
      chipRow(S().f_organism, TAX.organisms.map(([k]) => [k, orgName(k), (w) => (w.organisms || []).includes(k)]), state.orgs, "org", "o") +
      chipRow(S().f_kind, TAX.kinds.map(([k]) => [k, kindName(k), (w) => w.kind === k]), state.kinds, "kind", "k") +
      (COLS.length ? chipRow(S().f_collection, COLS.map((c) => [c.id, nm(c), (w) => (w.collections || []).includes(c.id)]), state.cols, "col", "c") : "");
    $("#eraChips").innerHTML = ERAS.map(([k, , , label]) => `<button class="chip" data-era="${k}" aria-pressed="${state.era === k}">${label}</button>`).join("");
    const ac = $("#activeCreator");
    ac.hidden = !state.creator;
    if (state.creator) ac.innerHTML = `${esc(S().showing_by)} <strong>${esc(creatorsById[state.creator]?.name || state.creator)}</strong> <button data-clear-creator>${esc(S().clear_creator)}</button>`;
  }

  /* ---------- views ---------- */
  const colCount = (c) => DATA.works.filter((w) => (w.collections || []).includes(c.id)).length;
  const colCard = (c) => { const n = colCount(c); return n ? `<button class="colcard" data-col-go="${esc(c.id)}">
      <span class="colcard__n mono">${n} · ${esc(S().col_types[c.type] || "")}</span><span class="colcard__title">${esc(nm(c))}</span>
      <span class="colcard__desc">${esc(zh() ? c.desc_zh : c.desc_en)}</span></button>` : ""; };
  function renderCollections() {
    currentList = [];
    const groups = ["survey", "award", "exhibition", "venue"].map((t) => [t, COLS.filter((c) => (c.type || "award") === t && colCount(c))]).filter(([, cs]) => cs.length);
    $("#collectionList").innerHTML = `<div class="starred__head"><h2 class="starred__title">${esc(S().collections)}</h2><p class="starred__lede">${esc(S().collections_lede)}</p></div>` +
      groups.map(([t, cs]) => `<section class="scat"><div class="scat__head"><h3 class="scat__title">${esc(S().col_groups[t])}</h3><span class="scat__n mono">${cs.length}</span></div>
        <div class="cols__grid">${cs.map(colCard).join("")}</div></section>`).join("");
    return groups.length;
  }
  const pairName = (list, k) => { const r = list.find((x) => x[0] === k); return r ? (zh() ? r[2] : r[1]) : k; };
  function renderOrgs() {
    currentList = [];
    if (!detailsReady) { $("#orgHead").innerHTML = `<p class="count mono">${esc(S().loading)}</p>`; $("#orgList").innerHTML = ""; return 1; }
    const q = state.oq.toLowerCase();
    const hit = (o, skip) => (skip === "t" || !state.otype || o.type === state.otype) && (skip === "h" || !state.otheme || (o.themes || []).includes(state.otheme)) &&
      (!q || [o.name, o.description, o.description_zh, o.based, ...(o.people || [])].join(" ").toLowerCase().includes(q));
    const chips = (list, cur, attr, skip, test) => list.map(([k]) => { const n = ORGS.filter((o) => hit(o, skip) && test(o, k)).length;
      return n || cur === k ? `<button class="chip" data-${attr}="${esc(k)}" aria-pressed="${cur === k}">${esc(pairName(list, k))}<small>${n}</small></button>` : ""; }).join("");
    const shown = ORGS.filter((o) => hit(o));
    $("#orgHead").innerHTML = `<div class="starred__head"><h2 class="starred__title">${esc(S().tab_orgs)}</h2><p class="starred__lede">${esc(S().orgs_lede)}</p>
        <p class="count mono">${esc(S().orgs_n(shown.length))}</p></div>
      <label class="search orgsearch"><span class="visually-hidden">${esc(S().search_label)}</span><input id="oq" type="search" autocomplete="off" placeholder="${esc(S().orgs_search)}" value="${esc(state.oq)}"></label>
      <div class="facets"><div class="chiprow"><span class="chiprow__label mono">${esc(S().f_org_type)}</span><div class="chips">${chips(OTYPES, state.otype, "otype", "t", (o, k) => o.type === k)}</div></div>
      <div class="chiprow"><span class="chiprow__label mono">${esc(S().f_org_theme)}</span><div class="chips">${chips(OTHEMES, state.otheme, "otheme", "h", (o, k) => (o.themes || []).includes(k))}</div></div></div>`;
    const card = (o) => {
      const nWorks = o.creator_id ? (worksByCreator[o.creator_id] || []).length : 0;
      const meta = [pairName(OTYPES, o.type), zh() ? o.based_zh || o.based : o.based, o.founded].filter(Boolean).join(" · ");
      return `<article class="org">
        <a class="org__media" href="${esc(o.url)}" target="_blank" rel="noopener">${o.image ? imgTag(o.image, "") : ""}<span class="org__mono">${esc((o.name || "?").replace(/^(the|center|centre)\s+/i, "").slice(0, 1))}</span></a>
        <div class="org__body"><h3 class="org__name"><a href="${esc(o.url)}" target="_blank" rel="noopener">${esc(o.name)} ↗</a></h3>
          <div class="org__meta mono">${esc(meta)}</div>
          <p class="org__desc">${esc(zh() ? o.description_zh : o.description)}</p>
          <div class="tags">${(o.themes || []).map((k) => `<button class="tag tag--col" data-otheme="${esc(k)}">${esc(pairName(OTHEMES, k))}</button>`).join("")}</div>
          ${nWorks ? `<button class="org__works mono" data-creator="${esc(o.creator_id)}">${esc(S().org_works(nWorks))}</button>` : ""}</div></article>`;
    };
    const groups = OTYPES.map(([k]) => [k, shown.filter((o) => o.type === k)]).filter(([, g]) => g.length);
    $("#orgList").innerHTML = groups.map(([k, g]) => `<section class="scat"><div class="scat__head"><h3 class="scat__title">${esc(pairName(OTYPES, k))}</h3><span class="scat__n mono">${g.length}</span></div>
      <p class="scat__desc">${esc((OTYPES.find((x) => x[0] === k) || [])[3] || "")}</p><div class="orgs" data-og="${esc(k)}"></div></section>`).join("");
    groups.forEach(([k, g]) => fill($(`.orgs[data-og="${k}"]`), g, card, 9, 24));
    const inp = $("#oq");
    inp.addEventListener("input", (e) => { clearTimeout(renderOrgs.t); renderOrgs.t = setTimeout(() => { state.oq = e.target.value.trim(); render(); const i = $("#oq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200); });
    return ORGS.length;
  }
  function renderAtlas() {
    currentList = [];
    let num = 0;
    const card = (f) => {
      const i = num++;
      const ws = DATA.works.filter((w) => w.field === f.id);
      const photoFirst = (w) => (w.kind === "paper" || w.kind === "publication" ? 1 : 0) + (w.images?.length ? 0 : 0.5);
      const shots = sorted(ws.filter(poster)).sort((a, b) => photoFirst(a) - photoFirst(b)).slice(0, 3);
      const subs = f.subs.map((s) => { const n = ws.filter((w) => w.sub === s.id).length; return n ? `<li><button data-go="${f.id}" data-go-sub="${s.id}">${esc(nm(s))}<small class="mono">${n}</small></button></li>` : ""; }).join("");
      return `<section class="fieldcard">
        <button class="fieldcard__media" data-go="${f.id}" aria-label="${esc(nm(f))}">${shots.map((w, j) => `<div class="kc__shot kc__shot--${"abc"[j]}">${thumb(w, need(Math.min(innerWidth - 32, 760) * (j ? 0.34 : 0.67)))}</div>`).join("")}
          <span class="br br--tl"></span><span class="br br--tr"></span><span class="br br--bl"></span><span class="br br--br"></span></button>
        <div class="fieldcard__body"><span class="fieldcard__num mono">0${i + 1}</span>
          <h2 class="fieldcard__title"><button data-go="${f.id}">${esc(nm(f))}</button></h2>
          <p class="fieldcard__desc">${esc(zh() ? f.desc_zh : f.desc_en)}</p>
          <ul class="sublist">${subs}</ul>
          <button class="tour__start mono" data-go="${f.id}">${esc(S().atlas_open(ws.length))}</button></div></section>`;
    };
    $("#atlas").innerHTML = `<p class="keys__lede">${esc(S().atlas_lede)}</p>${GROUPS.map((g) => `${g.en ? `<h2 class="atlas__group mono">${esc(nm(g))}</h2>` : ""}
      <div class="atlas">${g.fields.map((id) => fieldById[id]).filter(Boolean).map(card).join("")}</div>`).join("")}${APPS.some(([k]) => DATA.works.some((w) => (w.approaches || []).includes(k))) ? `<section class="cols"><h2 class="scat__title">${esc(S().by_approach)}</h2><p class="scat__desc">${esc(S().by_approach_lede)}</p>
      <div class="cols__grid">${APPS.map(([k, en, zh_, dEn, dZh]) => { const n = DATA.works.filter((w) => (w.approaches || []).includes(k)).length; return n ? `<button class="colcard" data-app-go="${esc(k)}">
        <span class="colcard__n mono">${n}</span><span class="colcard__title">${esc(zh() ? zh_ : en)}</span><span class="colcard__desc">${esc(zh() ? dZh : dEn)}</span></button>` : ""; }).join("")}</div></section>` : ""}${COLS.length ? `<section class="cols"><h2 class="scat__title">${esc(S().collections)}</h2><p class="scat__desc">${esc(S().collections_lede)}</p>
      <div class="cols__grid">${COLS.map(colCard).join("")}</div></section>` : ""}`;
    return FIELDS.length;
  }
  function renderField(f) {
    const primary = sorted(DATA.works.filter((w) => w.field === f.id));
    const also = sorted(DATA.works.filter((w) => w.field !== f.id && (w.also || []).includes(f.id)));
    const bySub = (id) => primary.filter((w) => w.sub === id);
    const known = new Set(f.subs.map((s) => s.id));
    const other = primary.filter((w) => !known.has(w.sub));
    const cats = [...f.subs, ...(other.length ? [{ id: "_other", en: S().other_cat, zh: S().other_cat, desc_en: "", desc_zh: "" }] : []),
      ...(also.length ? [{ id: "_also", en: S().also_title, zh: S().also_title, desc_en: S().also_desc, desc_zh: S().also_desc }] : [])];
    const listOf = (id) => (id === "_other" ? other : id === "_also" ? also : bySub(id));
    const chip = (id, label, n) => `<button class="chip" data-sub="${esc(id)}" aria-pressed="${state.sub === id}">${esc(label)}<small>${n}</small></button>`;
    $("#fieldHead").innerHTML = `<div class="starred__head"><h2 class="starred__title">${esc(nm(f))}</h2>
        <p class="starred__lede">${esc(zh() ? f.desc_zh : f.desc_en)}</p><p class="count mono">${esc(S().field_count(primary.length, also.length))}</p></div>
      <div class="chips scat-chips">${chip("", S().all_cats, primary.length + also.length)}${cats.map((c) => { const n = listOf(c.id).length; return n ? chip(c.id, nm(c), n) : ""; }).join("")}</div>`;
    const section = (c) => { const ws = listOf(c.id); return ws.length ? `<section class="scat"><div class="scat__head"><h3 class="scat__title">${esc(nm(c))}</h3><span class="scat__n mono">${ws.length}</span></div>
        <p class="scat__desc">${esc(zh() ? c.desc_zh : c.desc_en)}</p><div class="grid" data-sub-grid="${esc(c.id)}"></div></section>` : ""; };
    const shown = state.sub ? cats.filter((c) => c.id === state.sub) : cats;
    $("#fieldGrid").innerHTML = shown.map(section).join("");
    shown.forEach((c) => fill($(`[data-sub-grid="${c.id}"]`), listOf(c.id), card, state.sub ? 24 : 8, 24));
    currentList = shown.flatMap((c) => listOf(c.id));
    return currentList.length;
  }
  function renderWorks() {
    currentList = sorted(DATA.works.filter((w) => matches(w)));
    fill($("#grid"), currentList, card, 24, 36);
    $("#worksCount").textContent = S().n_works(currentList.length);
    return currentList.length;
  }
  function renderPapers() {
    currentList = sorted(DATA.works.filter((w) => w.paper?.url && matches(w)));
    $("#papersHead").innerHTML = `<p class="count mono">${esc(S().papers_n(currentList.length))} · ${esc(S().papers_lede)}</p>`;
    $("#paperTable").innerHTML = currentList.length ? `<table class="papers"><thead><tr><th>${esc(S().col_year)}</th><th>${esc(S().col_title)}</th><th>${esc(S().col_venue)}</th><th>${esc(S().col_field)}</th></tr></thead><tbody id="paperRows"></tbody></table>` : "";
    const row = (w) => `
      <tr><td class="mono">${w.year || ""}</td>
        <td><button class="papers__title" data-open="${esc(w.id)}">${esc(w.title)}</button><div class="papers__who">${esc(creatorNames(w).join(", "))}</div></td>
        <td class="papers__venue"><a href="${esc(w.paper.url)}" target="_blank" rel="noopener">${esc(w.paper.venue || (w.paper.doi ? "DOI" : "Link"))} ↗</a></td>
        <td><span class="tag">${esc(nm(fieldById[w.field] || {}))}</span>${subOf(w) ? ` <span class="tag">${esc(nm(subOf(w)))}</span>` : ""}</td></tr>`;
    fill($("#paperRows"), currentList, row, 60, 80);
    return currentList.length;
  }
  function renderCreators() {
    if (!detailsReady) { $("#creatorList").innerHTML = `<p class="count mono">${esc(S().loading)}</p>`; return 1; }
    const q = state.q.toLowerCase();
    const rows = DATA.creators
      .map((c) => ({ c, works: sorted((worksByCreator[c.id] || []).filter((w) => matches(w))) }))
      .filter(({ c, works }) => works.length || (q && [c.name, c.bio, c.bio_zh, c.role].join(" ").toLowerCase().includes(q)))
      .sort((a, b) => b.works.length - a.works.length || a.c.name.localeCompare(b.c.name));
    currentList = rows.flatMap((r) => r.works);
    const article = ({ c, works }) => {
      const t = TX.creator(c, lang);
      const links = Object.entries(c.links || {}).filter(([, u]) => u).map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(k)} ↗</a>`).join("");
      const conn = (c.connected_to || []).filter((id) => creatorsById[id]).map((id) => `<button data-creator="${esc(id)}">${esc(creatorsById[id].name)}</button>`).join("");
      const kind = [c.kind ? S()["kind_" + c.kind] : "", ...(c.disciplines || []).map(discName)].filter(Boolean).join(" · ");
      return `<article class="creator" id="c-${esc(c.id)}"><div>
          <h2 class="creator__name"><button data-creator="${esc(c.id)}">${esc(c.name)}</button></h2>
          <p class="creator__role">${kind ? esc(kind) + " · " : ""}${esc(t.role || "")}${t.based ? " · " + esc(t.based) : ""} · ${esc(S().n_works(works.length))}</p>
          ${t.bio ? `<p class="creator__bio">${esc(t.bio)}</p>` : ""}
          ${t.why ? `<p class="creator__why">${esc(t.why)}</p>` : ""}
          <div class="links">${links}</div>
          ${conn ? `<div class="web">${esc(S().connected)} ${conn}</div>` : ""}
        </div><div class="strip">${works.slice(0, 12).map(card).join("")}${works.length > 12 ? `<button class="strip__more mono" data-creator="${esc(c.id)}">${esc(S().all_n(works.length))}</button>` : ""}</div></article>`;
    };
    fill($("#creatorList"), rows, article, 12, 12);
    return rows.length;
  }
  function renderStarred() {
    const list = DATA.works.filter((w) => stars.has(w.id));
    currentList = list;
    $("#starredHead").innerHTML = `<div class="starred__head">
        <h2 class="starred__title">${esc(S().starred_title)}</h2><p class="starred__lede">${esc(S().starred_lede)}</p>
        ${list.length ? `<div class="starred__actions">
          <button class="btn btn--accent mono" data-export="skill">${esc(S().export_skill)}</button>
          <button class="btn mono" data-export="readme">${esc(S().export_readme)}</button>
          <button class="btn mono" data-export="list">${esc(S().export_bib)}</button>
          <button class="btn mono" data-export="copy">${esc(S().copy_md)}</button>
          <button class="btn btn--quiet mono" data-export="clear">${esc(S().clear_stars)}</button></div>` : `<p class="starred__empty">${esc(S().starred_empty)}</p>`}</div>`;
    fill($("#starGrid"), list, card, 24, 36);
    return 1;
  }

  function render() {
    resetLazy();
    qLower = state.q.toLowerCase();
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.view === state.view));
    const f = fieldById[state.view];
    const pane = f ? "field" : state.view;
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("is-on", v.id === "view-" + pane));
    $("#q").value = state.q;
    $("#sort").value = state.sort;
    $("#filters").hidden = !FILTERED.includes(state.view);
    $("#hasVideo").setAttribute("aria-pressed", state.video);
    $("#hasPaper").setAttribute("aria-pressed", state.paper);
    $("#starCount").textContent = stars.size ? stars.size : "";
    renderChips();
    const n = f ? renderField(f) : { atlas: renderAtlas, collections: renderCollections, orgs: renderOrgs, works: renderWorks, papers: renderPapers, creators: renderCreators, starred: renderStarred }[state.view]();
    $("#empty").hidden = n > 0;
    lazyVideos();
    writeHash();
  }

  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.src = e.target.dataset.src; e.target.preload = "metadata"; io.unobserve(e.target); } });
  }, { rootMargin: "300px" }) : null;
  function lazyVideos() { document.querySelectorAll("video[data-src]:not([src])").forEach((v) => (io ? io.observe(v) : (v.src = v.dataset.src))); }

  /* ---------- player ---------- */
  function embed(v) {
    if (v.embeddable === false) {
      return `<a class="offsite" href="${esc(v.url)}" target="_blank" rel="noopener">${v.thumbnail ? `<img referrerpolicy="no-referrer" src="${esc(v.thumbnail)}" alt="">` : ""}
        <span class="offsite__btn mono">${esc(S().play_on(src(v.platform)))}</span><span class="offsite__note mono">${esc(S().only_on(src(v.platform)))}</span></a>`;
    }
    switch (v.platform) {
      case "youtube": return `<iframe class="frame" src="https://www.youtube-nocookie.com/embed/${esc(v.id)}?autoplay=1&rel=0&playsinline=1" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen title="Video"></iframe>`;
      case "vimeo": return `<iframe class="frame" src="https://player.vimeo.com/video/${esc(v.id)}?autoplay=1&dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Video"></iframe>`;
      case "x": {
        const light = document.documentElement.dataset.theme === "light" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: light)").matches);
        return `<iframe class="frame frame--tweet" src="https://platform.twitter.com/embed/Tweet.html?id=${esc(v.id)}&theme=${light ? "light" : "dark"}&dnt=true&lang=${lang}" allowfullscreen title="Post"></iframe>`;
      }
      case "mp4": return `<video src="${esc(v.url)}" controls autoplay playsinline></video>`;
      default: return `<a class="watch" href="${esc(v.url)}" target="_blank" rel="noopener">${esc(S().watch_on(src(v.platform)))}</a>`;
    }
  }
  const mediaItems = (w) => [...(w.video?.url ? [{ type: "video" }] : []), ...(w.images || []).map((u) => ({ type: "image", url: u }))];
  function showMedia(w) {
    const items = mediaItems(w);
    const m = items[mediaIndex];
    let main;
    if (!m) main = `<div class="paperview">${w.paper?.venue ? `<span class="mono ph__venue">${esc(w.paper.venue)}</span>` : ""}<h3>${esc(w.title)}</h3>
      <p class="mono">${esc(creatorNames(w).join(", "))}${w.year ? ` · ${w.year}` : ""}</p>${w.paper?.url ? `<a class="btn btn--accent mono" href="${esc(w.paper.url)}" target="_blank" rel="noopener">${esc(S().read_paper)}</a>` : ""}</div>`;
    else if (m.type === "video") main = embed(w.video);
    else main = `<img class="player__img" referrerpolicy="no-referrer" src="${esc(m.url)}" alt="${esc(w.title)}">`;
    const strip = items.length > 1 ? `<div class="mstrip">${items.map((it, i) => `<button class="mstrip__item" data-media="${i}" aria-pressed="${i === mediaIndex}">
        ${it.type === "video" ? (w.video.thumbnail ? `<img referrerpolicy="no-referrer" src="${esc(w.video.thumbnail)}" alt="">` : "") + '<span class="mstrip__play">▶</span>' : `<img referrerpolicy="no-referrer" src="${esc(it.url)}" alt="">`}</button>`).join("")}</div>` : "";
    $("#playerMedia").innerHTML = `<div class="player__main">${main}</div>${strip}`;
  }
  function openWork(id) {
    const list = currentList.length ? currentList : DATA.works;
    openIndex = list.findIndex((w) => w.id === id);
    const w = list[openIndex] || worksById[id];
    if (!w) return;
    mediaIndex = 0;
    $("#player").dataset.id = w.id;
    showMedia(w);
    fillInfo(w);
    if (!$("#player").open) $("#player").showModal();
    writeHash(w.id);
  }
  function fillInfo(w) {
    const t = TX.work(w, lang);
    const who = w.creator_ids.map((cid) => `<button data-creator="${esc(cid)}">${esc(creatorsById[cid]?.name || cid)}</button>`).join("");
    const note = (label, body) => (body ? `<div class="note"><b>${esc(label)}</b><p>${esc(body)}</p></div>` : "");
    const f = fieldById[w.field] || {};
    const fieldTags = [`<button class="tag tag--field" data-go="${esc(w.field)}" data-go-sub="${esc(w.sub || "")}">${esc(nm(f))}${subOf(w) ? " / " + esc(nm(subOf(w))) : ""}</button>`,
      ...(w.also || []).map((a) => `<button class="tag tag--field" data-go="${esc(a)}">${esc(nm(fieldById[a] || {}))}</button>`)].join("");
    const orgs = (w.organisms || []).map((o) => `<span class="tag">${esc(orgName(o))}</span>`).join("");
    const kws = (w.keywords || []).map((k) => `<span class="tag">${esc(k)}</span>`).join("");
    const cols = (w.collections || []).map((id) => COLS.find((c) => c.id === id)).filter(Boolean);
    const appTags = (w.approaches || []).map((k) => `<button class="tag tag--col" data-app-go="${esc(k)}">↳ ${esc(appName(k))}</button>`).join("");
    const colTags = cols.map((c) => `<button class="tag tag--col" data-col-go="${esc(c.id)}">◎ ${esc(nm(c))}</button>`).join("");
    const survey = COLS.find((c) => c.work === w.id);
    const surveyN = survey ? DATA.works.filter((x) => (x.collections || []).includes(survey.id) && x.id !== w.id).length : 0;
    const p = w.paper || {};
    $("#playerInfo").innerHTML = `
      <div class="meta">${w.year || ""} · ${esc(kindName(w.kind))}</div>
      <h2>${esc(w.title)}</h2>
      <div class="who">${who}</div>
      ${starBtn(w.id, "star-inline mono")}
      ${t.description ? `<p>${esc(t.description)}</p>` : ""}
      ${note(S().idea, t.idea)}${note(S().method, t.method)}
      ${survey && surveyN ? `<button class="tour__start mono survey-btn" data-col-go="${esc(survey.id)}">${esc(S().survey_works(surveyN))}</button>` : ""}
      <div class="tags">${fieldTags}</div>${appTags ? `<div class="tags">${appTags}</div>` : ""}${colTags ? `<div class="tags">${colTags}</div>` : ""}<div class="tags">${orgs}</div><div class="tags">${kws}</div>
      <div class="actions">
        ${p.url ? `<a class="watch watch--paper" href="${esc(p.url)}" target="_blank" rel="noopener">¶ ${esc(S().read_paper)}${p.title && p.title !== w.title ? `<span class="watch__sub watch__ptitle">${esc(p.title)}</span>` : ""}${p.venue || p.doi ? `<span class="watch__sub">${esc(p.venue || "")}${p.venue && p.doi ? " · " : ""}${p.doi ? "doi:" + esc(p.doi) : ""}</span>` : ""}</a>` : ""}
        ${w.video?.url ? `<a class="watch" href="${esc(w.video.url)}" target="_blank" rel="noopener">${esc(S().watch_on(src(w.video.platform)))}</a>` : ""}
        ${w.source_url ? `<a class="watch" href="${esc(w.source_url)}" target="_blank" rel="noopener">${esc(S().project_page)}</a>` : ""}
        ${w.code_url ? `<a class="watch" href="${esc(w.code_url)}" target="_blank" rel="noopener">${esc(S().source_code)}</a>` : ""}
      </div>`;
    document.querySelectorAll(".star-inline").forEach((b) => { b.textContent = stars.has(w.id) ? S().starred : S().star; });
  }
  function closeWork() { $("#playerMedia").innerHTML = ""; if ($("#player").open) $("#player").close(); writeHash(); }
  function step(d) {
    const list = currentList.length ? currentList : DATA.works;
    if (openIndex < 0) return;
    openWork(list[(openIndex + d + list.length) % list.length].id);
  }

  /* ---------- stars + export ---------- */
  function toggleStar(id) {
    stars.has(id) ? stars.delete(id) : stars.add(id);
    store.set("mth-stars", [...stars]);
    document.querySelectorAll(`[data-star="${CSS.escape(id)}"]`).forEach((b) => {
      b.setAttribute("aria-pressed", stars.has(id));
      b.textContent = b.classList.contains("star-inline") ? (stars.has(id) ? S().starred : S().star) : (stars.has(id) ? "★" : "☆");
    });
    $("#starCount").textContent = stars.size ? stars.size : "";
    if (state.view === "starred" && !$("#player").open) render();
  }
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 2200);
  }
  function download(name, body) {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([body], { type: "text/markdown;charset=utf-8" })), download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(S().downloaded(name));
  }
  let clearArmed = false;
  async function doExport(kind) {
    await detailsLoaded;
    const list = DATA.works.filter((w) => stars.has(w.id));
    const X = window.MthExport;
    if (kind === "skill") download("SKILL.md", X.skillMd(list, DATA, lang));
    if (kind === "readme") download("README.md", X.readmeMd(list, DATA, lang));
    if (kind === "list") download("reading-list.md", X.readingList(list, DATA, lang));
    if (kind === "copy") { const md = X.skillMd(list, DATA, lang); navigator.clipboard?.writeText(md).then(() => toast(S().copied), () => download("SKILL.md", md)); }
    if (kind === "clear") {
      if (!clearArmed) { clearArmed = true; toast(S().confirm_clear); setTimeout(() => { clearArmed = false; }, 3000); return; }
      stars = new Set(); store.set("mth-stars", []); clearArmed = false; toast(S().cleared); render();
    }
  }

  /* ---------- events ---------- */
  const toggle = (s, k) => (s.has(k) ? s.delete(k) : s.add(k));
  function go(view, sub = "") { state.view = view; state.sub = sub; closeWork(); render(); window.scrollTo({ top: $("#tabs").offsetTop, behavior: "smooth" }); }
  function setCreator(id) { state.creator = id; go("works"); }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    const d = t.dataset;
    if (d.star) return toggleStar(d.star);
    if (d.export) return doExport(d.export);
    if (t.classList.contains("tab")) { state.view = d.view; state.sub = ""; return render(); }
    if (d.go) return go(d.go, d.goSub || "");
    if (d.sub !== undefined) { state.sub = d.sub; return render(); }
    if (d.field) { toggle(state.fields, d.field); return render(); }
    if (d.org) { toggle(state.orgs, d.org); return render(); }
    if (d.col) { toggle(state.cols, d.col); return render(); }
    if (d.otype !== undefined) { state.otype = state.otype === d.otype ? "" : d.otype; return render(); }
    if (d.otheme !== undefined) { state.otheme = state.otheme === d.otheme ? "" : d.otheme; return render(); }
    if (d.app) { toggle(state.apps, d.app); return render(); }
    if (d.disc) { toggle(state.discs, d.disc); return render(); }
    if (d.appGo) { Object.assign(state, { q: "", apps: new Set([d.appGo]), discs: new Set(), cols: new Set(), fields: new Set(), orgs: new Set(), kinds: new Set(), era: "", creator: "", video: false, paper: false }); return go("works"); }
    if (d.colGo) { Object.assign(state, { q: "", apps: new Set(), discs: new Set(), cols: new Set([d.colGo]), fields: new Set(), orgs: new Set(), kinds: new Set(), era: "", creator: "", video: false, paper: false }); return go("works"); }
    if (d.kind) { toggle(state.kinds, d.kind); return render(); }
    if (d.era) { state.era = state.era === d.era ? "" : d.era; return render(); }
    if (d.media !== undefined) { mediaIndex = +d.media; return showMedia(worksById[$("#player").dataset.id]); }
    if (d.open) return openWork(d.open);
    if (d.creator) return setCreator(d.creator);
    if ("clearCreator" in d) { state.creator = ""; return render(); }
    if (t.classList.contains("card")) return openWork(d.id);
  });
  $("#clear").addEventListener("click", () => { Object.assign(state, { q: "", apps: new Set(), discs: new Set(), cols: new Set(), fields: new Set(), orgs: new Set(), kinds: new Set(), era: "", creator: "", video: false, paper: false }); render(); });
  $("#hasVideo").addEventListener("click", () => { state.video = !state.video; render(); });
  $("#hasPaper").addEventListener("click", () => { state.paper = !state.paper; render(); });
  let qTimer;
  $("#q").addEventListener("input", (e) => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value.trim(); render(); }, 160); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#playerClose").addEventListener("click", closeWork);
  $("#prev").addEventListener("click", () => step(-1));
  $("#next").addEventListener("click", () => step(1));
  $("#player").addEventListener("close", () => { $("#playerMedia").innerHTML = ""; writeHash(); });
  $("#player").addEventListener("click", (e) => { if (e.target.id === "player") closeWork(); });
  document.addEventListener("keydown", (e) => {
    if (!$("#player").open) return;
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  $("#langToggle").addEventListener("click", () => {
    lang = zh() ? "en" : "zh";
    store.set("mth-lang", lang);
    applyStatic();
    render();
    if ($("#player").open) { const w = worksById[$("#player").dataset.id]; if (w) fillInfo(w); }
  });
  const savedTheme = store.get("mth-theme", null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $("#themeToggle").addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const next = cur === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    store.set("mth-theme", next);
  });

  /* ---------- details: descriptions, full media, bios and organizations load after the first screen ---------- */
  let detailsReady = !DATA.details;
  const detailsLoaded = !DATA.details ? Promise.resolve() : fetch(DATA.details).then((r) => r.json()).then((d) => {
    DATA.works.forEach((w) => { const x = d.works[w.id]; if (x) Object.assign(w, x); w._h = null; });
    DATA.creators.forEach((c) => { const x = d.creators[c.id]; if (x) Object.assign(c, x); });
    ORGS = DATA.orgs = d.orgs || [];
    detailsReady = true;
    if (["creators", "orgs"].includes(state.view) || state.q) render();
    if ($("#player").open) { const w = worksById[$("#player").dataset.id]; if (w) { showMedia(w); fillInfo(w); } }
  }).catch(() => { detailsReady = true; });

  /* ---------- init ---------- */
  applyStatic();
  const start = readHash();
  render();
  if (start.work) openWork(start.work);
})();
