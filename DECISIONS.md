# Family Music Quest — Decision Log

This file records durable product/architecture decisions that future agents should not accidentally undo. Add dated entries when a decision materially changes.

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
