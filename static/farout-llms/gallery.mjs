const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
const displayDate = value => dateFormat.format(new Date(value + "T00:00:00Z"));
const byId = id => document.getElementById(id);
const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const link = (text, href) => {
  const a = el("a", text);
  a.href = href;
  return a;
};
const time = date => {
  const node = el("time", displayDate(date));
  node.dateTime = date;
  return node;
};
const option = (text, value) => {
  const node = el("option", text);
  node.value = value;
  return node;
};

function diagram(entry) {
  const figure = el("figure", null, "diagram");
  const steps = el("ol", null, "steps");
  for (const [i, name] of entry.diagram.steps.entries()) {
    steps.append(el("li", name, i === entry.diagram.accent ? "change" : ""));
  }
  figure.append(steps, el("figcaption", entry.diagram.caption));
  return figure;
}

const facts = [["Scale", "scale"], ["Context", "context"], ["Generation", "generation"], ["Mixing", "mixing"]];
const notes = [["What changed", "novelty"], ["Evidence", "evidence"], ["Limitations", "limits"]];
const compareRows = [
  ["Family", e => e.families.join(", ")], ["Status", e => e.status],
  ["Date", e => displayDate(e.date)], ...facts.map(([label, f]) => [label, e => e[f]]),
  ["Layer composition", e => e.composition], ["KV / state", e => e.state], ["Availability", e => e.availability],
  ...notes.map(([label, f]) => [label, e => e[f]]),
];

function card(entry, setModel) {
  const article = el("article", null, "card");
  article.id = entry.id;
  article.setAttribute("aria-labelledby", "title-" + entry.id);
  const meta = el("div", null, "card-top secondary");
  meta.append(el("span", entry.status, "pill " + entry.status.toLowerCase()), time(entry.date));
  const title = el("h3");
  title.id = "title-" + entry.id;
  title.append(link(entry.name, "#" + entry.id));
  const tags = el("div", null, "tags");
  for (const family of entry.families) tags.append(el("span", family, "tag"));
  const list = el("dl", null, "facts");
  for (const [label, key] of facts) {
    const fact = el("div", null, "fact");
    fact.append(el("dt", label), el("dd", entry[key]));
    list.append(fact);
  }
  const details = el("details");
  details.append(el("summary", "Architecture and evidence"));
  for (const [label, key] of [
    ["Layer composition", "composition"], ["KV / state", "state"], ["Availability", "availability"], ...notes,
  ]) {
    const p = el("p");
    p.append(el("strong", label + ": "), document.createTextNode(entry[key]));
    details.append(p);
  }
  const actions = el("div", null, "card-actions");
  for (const source of entry.sources) actions.append(link(source.label, source.url));
  for (const slot of ["a", "b"]) {
    const button = el("button", "Use as " + slot.toUpperCase());
    button.type = "button";
    button.setAttribute("aria-label", "Use " + entry.name + " as model " + slot.toUpperCase());
    button.addEventListener("click", () => {
      setModel(slot, entry.id);
      location.hash = "compare";
      byId("model-" + slot).focus({ preventScroll: true });
    });
    actions.append(button);
  }
  article.append(meta, title, tags, diagram(entry), el("p", entry.summary), list, details, actions);
  return article;
}

function table(a, b) {
  const result = el("table");
  const head = result.createTHead().insertRow();
  for (const [label, entry] of [["Field", null], [a.name, a], [b.name, b]]) {
    const cell = el("th");
    cell.scope = "col";
    if (entry) cell.append(link(label, "#" + entry.id));
    else cell.textContent = label;
    head.append(cell);
  }
  const body = result.createTBody();
  const addRow = (label, render) => {
    const row = body.insertRow();
    const heading = el("th", label);
    heading.scope = "row";
    row.append(heading);
    for (const e of [a, b]) row.insertCell().append(render(e));
  };
  addRow("Mechanism", e => diagram(e));
  for (const [label, read] of compareRows) addRow(label, e => document.createTextNode(read(e)));
  addRow("Primary source", e => link(e.sources[0].label, e.sources[0].url));
  return result;
}

function init({ entries, families, updated }) {
  const elements = Object.fromEntries(
    ["cards", "search", "family", "status", "sort", "model-a", "model-b", "comparison", "compare-help", "swap", "clear", "feedback"]
      .map(id => [id, byId(id)]),
  );
  const { cards, search, family, status, sort, comparison, feedback } = elements;
  const modelA = elements["model-a"];
  const modelB = elements["model-b"];
  const lookup = new Map(entries.map(e => [e.id, e]));
  const alphabetical = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  for (const group of families) family.append(option(group, group));
  for (const select of [modelA, modelB]) {
    for (const e of alphabetical) select.append(option(e.name, e.id));
  }
  byId("catalog-meta").append(document.createTextNode(entries.length + " designs · Updated "), time(updated));
  const cached = new Map(entries.map(e => [e.id, card(e, (slot, value) => {
    elements["model-" + slot].value = value;
    compare(true);
  })]));
  const sorts = {
    new: (a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name),
    old: (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name),
    name: (a, b) => a.name.localeCompare(b.name),
  };
  function filter() {
    const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = entries.filter(e =>
      (!family.value || e.families.includes(family.value)) &&
      (!status.value || e.status === status.value) &&
      words.every(w => [e.name, ...e.families, e.mixing, e.generation, e.summary, e.novelty].join(" ").toLowerCase().includes(w))
    ).sort(sorts[sort.value] || sorts.new);
    cards.replaceChildren(...filtered.map(e => cached.get(e.id)));
    feedback.textContent = filtered.length
      ? "Showing " + filtered.length + " of " + entries.length + (entries.length === 1 ? " design." : " designs.")
      : "No architectures match. Try a different search or reset the filters.";
  }
  function reset() {
    search.value = family.value = status.value = "";
    sort.value = "new";
    filter();
  }
  function compare(updateUrl) {
    const a = lookup.get(modelA.value);
    const b = lookup.get(modelB.value);
    if (updateUrl) {
      const url = new URL(location.href);
      for (const [key, e] of [["a", a], ["b", b]]) {
        if (e) url.searchParams.set(key, e.id);
        else url.searchParams.delete(key);
      }
      history.replaceState(null, "", url);
    }
    elements.swap.disabled = !a || !b || a === b;
    elements.clear.disabled = !a && !b;
    comparison.replaceChildren();
    if (a && b && a !== b) {
      comparison.append(table(a, b));
      elements["compare-help"].textContent = "Comparing " + a.name + " and " + b.name + ". Copy the page URL to share.";
    } else {
      elements["compare-help"].textContent = a && a === b
        ? "Choose two different designs." : "Select models here or use the A / B buttons on a gallery card.";
    }
  }
  function syncCompare() {
    const params = new URL(location.href).searchParams;
    modelA.value = lookup.has(params.get("a")) ? params.get("a") : "";
    modelB.value = lookup.has(params.get("b")) ? params.get("b") : "";
    compare(false);
  }
  function revealHash() {
    const id = location.hash.slice(1);
    if (!lookup.has(id)) return;
    if (!byId(id)) reset();
    byId(id)?.scrollIntoView({ block: "nearest" });
  }
  search.addEventListener("input", filter);
  for (const select of [family, status, sort]) select.addEventListener("change", filter);
  byId("reset").addEventListener("click", reset);
  for (const select of [modelA, modelB]) select.addEventListener("change", () => compare(true));
  elements.swap.addEventListener("click", () => {
    [modelA.value, modelB.value] = [modelB.value, modelA.value];
    compare(true);
  });
  elements.clear.addEventListener("click", () => {
    modelA.value = modelB.value = "";
    compare(true);
  });
  window.addEventListener("hashchange", revealHash);
  window.addEventListener("popstate", syncCompare);
  byId("filters").hidden = byId("compare-controls").hidden = false;
  filter();
  syncCompare();
  revealHash();
}

try {
  const response = await fetch(new URL("./architectures.json", import.meta.url), { cache: "no-cache" });
  if (!response.ok) throw new Error("Catalogue request failed: " + response.status);
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.entries)) throw new Error("Unsupported catalogue format");
  init(data);
} catch (error) {
  console.error(error);
  byId("feedback").append(
    document.createTextNode("Could not load the catalogue. Try reloading or open the "),
    link("catalogue JSON", "./architectures.json"), document.createTextNode("."),
  );
}
