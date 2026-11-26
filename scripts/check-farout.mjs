import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = new URL("../static/farout-llms/", import.meta.url);
const data = JSON.parse(await readFile(new URL("architectures.json", base), "utf8"));
const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const nonempty = value => typeof value === "string" && value.trim().length > 0;
assert.equal(data.schemaVersion, 1);
assert.ok(isDate(data.updated), "invalid catalogue date");
assert.ok(data.families.length && data.families.every(nonempty));
assert.equal(data.families.length, new Set(data.families).size);
assert.ok(data.entries.length);
const ids = new Set();
const sources = new Set();
for (const entry of data.entries) {
  const { id, families, status, date, diagram, sources: links } = entry;
  assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(!ids.has(id), "duplicate ID " + id);
  ids.add(id);
  assert.ok(isDate(date) && date <= data.updated, id + " has invalid date");
  assert.ok(["Include", "Watch"].includes(status), id + " has invalid status");
  assert.ok(families.length && families.every(f => data.families.includes(f)), id + " has an invalid family");
  assert.equal(families.length, new Set(families).size, id + " has duplicate families");
  for (const field of ["name", "scale", "context", "generation", "mixing", "composition", "state", "availability", "summary", "novelty", "evidence", "limits"]) {
    assert.ok(nonempty(entry[field]), id + " is missing " + field);
  }
  assert.ok(diagram.steps.length >= 2 && diagram.steps.length <= 4 && diagram.steps.every(nonempty));
  assert.ok(Number.isInteger(diagram.accent) && diagram.accent >= 0 && diagram.accent < diagram.steps.length);
  assert.ok(nonempty(diagram.caption));
  assert.ok(links.length && links.every(({ label, url }) => nonempty(label) && new URL(url).protocol === "https:"));
  const primary = new URL(links[0].url);
  const key = primary.origin + primary.pathname.replace(/v\d+$/, "").replace(/\/$/, "");
  assert.ok(!sources.has(key), "duplicate primary source " + key);
  sources.add(key);
}
const html = await readFile(new URL("index.html", base), "utf8");
for (const file of ["./gallery.css", "./gallery.mjs", "./architectures.json"]) assert.ok(html.includes(file));
assert.ok(ids.has("latent-lattice"), "featured architecture missing from the catalogue");
console.log("Farout catalogue valid: " + ids.size + " unique architectures.");
