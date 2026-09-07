# Family Music Quest — Decision Log

This file records durable product/architecture decisions that future agents should not accidentally undo. Add dated entries when a decision materially changes.

## 2026-09 — Issue status labels are the operational execution state; Project is the visual mirror

**Decision:** Each actionable GitHub Issue uses exactly one agent-manageable `status:*` label as the operational execution state: `status:backlog`, `status:ready`, `status:in-progress`, `status:needs-hardware-test`, or `status:done`. The GitHub Project remains the visual planning view and should mirror that state when practical.

**Rationale:** Available agent tooling can reliably update Issue labels but cannot currently guarantee synchronized Project-board status changes. Execution state must therefore remain manageable and accurate without requiring the product owner to open the Project board manually.

**Implications:**

- exactly one `status:*` execution label should exist on each actionable Issue;
- category/risk labels such as `bug`, `piano`, `hardware-test`, `maintenance`, and `blocker` remain separate and may coexist with the execution label;
- `status:ready` remains the Project Manager implementation-authorization boundary; `status:backlog` does not authorize implementation;
- `status:needs-hardware-test` preserves the distinction between technical completion and required physical acceptance;
- the GitHub Project is not removed; its Backlog → Ready → In Progress → Needs Hardware Test → Done view should mirror labels when practical;
- temporary board/label drift does not override the Issue's operational `status:*` state;
- a later focused governance task may automate Project Status synchronization from labels, but that automation is not part of this decision or any product release by itself.

## 2026-09 — GitHub is the durable execution record; repository docs remain product truth

**Decision:** Family Music Quest uses GitHub Issues/Project/Pull Requests/CI as the durable execution record for actionable work, while `PROJECT.md`, `DECISIONS.md`, `ROADMAP.md`, `TECHNICAL_DEBT.md`, and feature specifications remain authoritative for durable product/governance truth.

**Implications:**

- GitHub Issues are for actionable work packages, reproducible bugs/findings, hardware findings ready for prioritization, and explicit acceptance tasks; they do not replace roadmap/spec/debt documentation.
- Do not mass-create Issues for every idea, roadmap entry, or technical-debt item. A topic can remain in durable documentation until it becomes concrete enough to prioritize, implement, reproduce, or accept.
- The execution-state model remains Backlog → Ready → In Progress → Needs Hardware Test → Done; the newer `status:*` label decision above defines the operational representation, while the Project board remains the visual mirror.
- Ready means the Project Manager has approved that Issue/work package as implementation scope. Backlog does not authorize the Build Agent to begin work.
- Normal implementation flow is approved Issue/work package → focused branch → implementation/tests → focused PR → CI → any required physical acceptance.
- PRs should reference the relevant Issue when one exists; do not auto-close a hardware-dependent Issue at merge if physical acceptance remains outstanding.
- Main should receive normal changes through PRs with applicable FMQ CI required before merge where repository settings permit. Do not add a mandatory second human-review requirement solely for formality on this one-person, agent-assisted product.
- CI completion and hardware acceptance are separate gates. Physical microphone/MIDI/USB/Chromebook performance/latency/readability/musical-feel/child-usability evidence remains authoritative where applicable.
- Project Manager, Build Agent, Advisor, and Ideas roles keep their existing meanings. Advisor/Ideas proposals do not automatically become Issues or releases.
- This governance decision does not authorize Bass Quest or any product implementation and does not bypass the current Chromebook hardware/child-usability acceptance gate tracked by Issue #22.

## 2026-09 — FMQ should evolve toward an adaptive interactive teacher, not only a note-scoring game

**Decision:** Family Music Quest should gradually evolve into a child-friendly interactive music teacher/game that combines motivation, clear teaching, adaptive practice, and real-instrument feedback. The product should increasingly help a learner understand what to learn next, what went wrong, what to practice, how to make that practice easier, and whether improvement is actually happening.

**Implications:**

- Prefer improvements that strengthen the teaching loop over features that merely make the application larger.
- Build toward a loop of teach → demonstrate → try → listen → understandable feedback → identify weakness → focused practice → reduce assistance → complete performance → track improvement.
- Shared infrastructure should support distinct Guitar, Piano, and future Bass learning identities rather than making the experiences identical.
- Guitar may emphasize interactive song gameplay, Note Highway, tablature, riffs/chords, sections, timing and technique; Piano may emphasize guided teaching, reading, hands, rhythm, structured progression and reduced assistance; Bass should emphasize groove, roots/fifths/octaves, muting, drum timing, ensemble role and Bass-specific feel.
- Yousician, Simply Piano / Simply Guitar, Rocksmith, and similar products are research references only, not specifications or feature-parity targets. Study useful concepts, implement independently when they fit FMQ, and respect licensing/copyright/trademark/IP requirements.
- Core learning should remain local-first/offline-capable and should not require a subscription or cloud service. Optional future cloud features may be considered separately, but must not become a core-learning dependency unless the product owner explicitly changes this direction.
- This decision is a long-term product filter, not implementation authorization. It does not reorder the current Chromebook hardware/child-usability acceptance → foundational stability → Bass-staging sequence.

## 2026-09 — Development save compatibility is not yet guaranteed

**Decision:** During active development/testing, previous-release saves do not require guaranteed compatibility across releases.

**Implications:**

- Do not spend substantial time on migrations for old development-only saves unless explicitly requested.
- Current-version saves must still work reliably.
- Intentional incompatible schema resets must be deterministic and documented.
- Persistent cross-version compatibility becomes a requirement only when the product owner explicitly declares it.

## 2026-09 — Chromebook-first performance is a first-class constraint

**Decision:** Low-cost Chromebook performance is part of the product contract.

**Implications:**

- Performance-sensitive animation/audio/input changes require baseline comparison and real-device testing where practical.
- Avoid unnecessary work inside frame/audio loops.
- Large imported songs are representative stress cases.
- Do not assume a desktop browser result proves Chromebook suitability.

## 2026-09 — Browser/PWA remains the primary platform for now

**Decision:** Continue with the current browser/PWA architecture unless measurements demonstrate a concrete limitation that justifies native/hybrid packaging.

**Rationale:** The current product already benefits from Chrome PWA installability, Web Audio, Web MIDI, IndexedDB, microphone input and straightforward Chromebook deployment. A wrapper alone would not automatically solve main-thread rendering/pitch-analysis or AlphaTab stutter.

**Revisit when:** measured browser/device constraints remain after focused optimization or native hardware access becomes necessary.

## 2026-09 — Microphone remains a baseline input method

**Decision:** Microphone input remains important even as USB/direct Guitar input and MIDI improve.

**Implications:**

- Do not design core learning flows that require hardware most users may not have.
- Input-specific capabilities must be honest.
- Piano microphone mode remains monophonic-safe.
- Future Bass microphone support must be validated rather than assumed.

## 2026-09 — Progressive complexity for children

**Decision:** Child-facing learning flows should remain simple; technical controls belong in dedicated advanced areas.

**Implications:**

- Prefer clear actions and short instructions.
- Hardware diagnostics can expose technical detail, but normal lessons should not require understanding sample rates, MIDI channels, or detector thresholds.
- A technically correct feature still fails acceptance if the child cannot understand what to do.

## 2026-09 — No major rewrite without focused justification

**Decision:** Architecture may improve incrementally, but working systems must not be replaced solely because another design looks cleaner.

**Implications:**

- Inspect why unusual behavior exists before deleting/replacing it.
- Tie refactors to a release goal and regression plan.
- Large-file/module debt should be reduced opportunistically and safely rather than through a rewrite project.

## 2026-09 — Guitar and Piano keep independent progression

**Decision:** A player may use both instruments, but Guitar and Piano progress remain independent.

**Implications:**

- Shared profiles do not mean shared stars/lesson completion.
- Instrument-specific skill history remains distinct.
- Future Bass Quest must have separate progression rather than piggybacking Guitar state.

## 2026-09 — Imported libraries are device-local, not profile-owned

**Decision:** Imported song files are currently device-local/shared while practice progress belongs to the active player.

**Implications:**

- Switching players should not duplicate/import files again.
- Backup currently does not claim to be a complete device-to-device transfer of imported libraries.
- A future full backup may be a separate explicit mode.

## 2026-09 — Piano MIDI chords use simultaneous target groups

**Decision:** Notes sharing a musical start time form one target group. MIDI Note On arrival order must not matter.

**Implications:**

- C/E/G, G/C/E, etc. are equivalent when timing is valid.
- Duplicate Note On events must not satisfy the same required pitch twice.
- The target advances only when all required pitches are satisfied.
- Future scoring work must preserve this unless the product contract explicitly changes.

## 2026-09 — Piano microphone mode must not pretend to score arbitrary polyphony

**Decision:** Microphone practice uses a safe monophonic learner part while MIDI/on-screen-capable paths may preserve full polyphony.

**Implications:**

- Do not silently simplify MIDI to monophonic because microphone needs it.
- Do not penalize microphone users for notes the detector cannot reliably recognize simultaneously.

## 2026-09 — Guitar skipped events are not misses

**Decision:** Events intentionally removed/skipped by section selection, density/difficulty, or related practice logic must not count against accuracy, stars, coaching, skill history, or Smart Practice analysis.

**Implications:** Use the same active-scoring-event definition throughout scoring and analytics.

## 2026-09 — Run-owned timers/audio/subscriptions must be cleaned up

**Decision:** Gameplay lifecycle owns and cleans its asynchronous/audio state.

**Implications:**

- Pause/restart/exit/instrument/profile changes must not leave stale count-ins, callbacks, animations, voices, or subscriptions.
- Guitar count-in remains cancellable.
- Piano pause/cleanup stops active voices.

## 2026-09 — Built-in music requires rights/source documentation

**Decision:** Public-domain composition status and FMQ arrangement provenance must be documented.

**Implications:**

- Do not copy random MIDI/tab files, commercial sheet music, YouTube/tutorial transcriptions, or modern arrangements.
- Create independent FMQ arrangements from verified public-domain source material.
- Label partial/simplified classical material honestly.
- Maintain `PUBLIC_DOMAIN_MUSIC.md` or its successor.

## 2026-09 — Open-source references are research, not automatic code sources

**Decision:** Conceptual research from open-source projects is acceptable; copying source requires license compatibility.

**Implications:**

- Do not copy GPL or unlicensed code into this repository unless an explicit licensing strategy permits it.
- Prefer independent implementation of concepts when license status is incompatible or unclear.
- Keep `OPEN_SOURCE_REVIEW.md` current when research materially affects implementation.

## 2026-09 — Natural tempo at 100% for built-in music

**Decision:** Built-in song 100% speed should represent the intended FMQ performance tempo, not an already-slow beginner tempo.

**Implications:**

- Beginner difficulty is handled through practice-speed controls and assistance.
- Imported MIDI retains source tempo maps.
- Human listening remains required to judge whether a tempo feels musical.

## 2026-09 — Built-in Guitar songs reuse the production Guitar player

**Decision:** Built-in Guitar Songbook arrangements are a separate local library, but launch the established Guitar song-level engine.

**Implications:**

- Note Highway and Tab View render one canonical event set.
- Microphone scoring remains monophonic and does not claim chord recognition.
- Built-in music does not depend on AlphaTab, remote tabs, downloaded MIDI, recordings or backing tracks.
- Imported Guitar libraries and curriculum missions remain separate and unchanged.

## 2026-09 — Guitar/Bass should eventually share a configurable string foundation

**Decision:** A future Bass Quest should reuse/generalize the existing string-instrument engine rather than duplicate Guitar into a second codebase.

**Constraints:**

- Do not perform a major rewrite solely in anticipation of Bass.
- First remove hard-coded six-string assumptions where current Guitar polish naturally touches them.
- Guitar behavior must remain unchanged while generalizing.
- Bass needs distinct tuning, curriculum, labels, progress, technique content and low-frequency detector behavior.

## 2026-09 — Bass is later scope, not part of current Guitar-polish work

**Decision:** Bass Quest should be staged after Guitar player/readability/performance foundations are stable.

**Known blocker:** current Guitar pitch detection historically bottoms out around 55 Hz while Bass E1 is about 41.2 Hz. Low-frequency/harmonic/octave handling must be designed and tested deliberately.

## 2026-09 — Duet mode is not current roadmap scope

**Decision:** A synchronized Guitar/Piano duet feature is not needed at this time.

**Implication:** Do not preserve/add complexity specifically for duet mode unless the product owner reopens the decision.

## Decision-log maintenance

When adding a new decision:

1. date it;
2. state the decision clearly;
3. record why it matters;
4. list important implications/constraints;
5. note what evidence or product-owner instruction would justify revisiting it.
