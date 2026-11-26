# Maintaining Farout LLMs

Canonical page: https://www.protimroy.com/farout-llms/

The main site is `protimroy/protimroy.github.io`. Edit the source branch `master`, not `gh-pages` or the separate Pro-log repository. Goku copies `static/farout-llms/` into the published site. The existing Build and Publish workflow runs on a push to `master`.

The scheduled Architecture Watch maintains only `static/farout-llms/architectures.json`:

1. Fetch the current file. Use the last successful check as the research window; on the first upkeep run, compare the current file as well. Verify new items against author papers, official technical reports, or official release notes.
2. Deduplicate by mechanism, ID and primary-source URL. Preserve IDs and external links. Update an existing entry when new implementation or evidence materially changes it; do not create a new family for a checkpoint or version bump. Include distinct designs with credible language-model evidence. Use Watch for genuinely distinct but narrow or preliminary results. Do not publish Exclude items.
3. Add original summaries and a short original diagram. Include scale, context, generation, mixing, layer composition, KV/state cost, availability, novelty versus prior work, evidence, limits, and primary-source links. Use explicit descriptions when specs are not disclosed. Never invent benchmark values, context ceilings, releases, or code availability. Use technical-announcement dates, not the day a story was covered. Set the top-level `updated` date only when catalogue content changes.
4. Run `node scripts/check-farout.mjs` when a local checkout is available; otherwise parse and validate the proposed JSON before writing. Use the current blob SHA to make an atomic file update, refreshing and reconciling if it changed. Leave template, workflows, and unrelated files alone.
5. Confirm the commit, check the publishing workflow and read back the published JSON when available. Report a publication failure or required approval accurately; do not claim the live page was updated without confirmation. If the repository requires review, use a single update pull request. If nothing qualifies, make no commit.

Local preview without Zig: run `python3 -m http.server 8000 --directory static` and open `http://localhost:8000/farout-llms/`. Full website build: use the pinned Zig compiler and run `zig build site`.
