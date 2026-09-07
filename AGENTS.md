# Family Music Quest — Agent Instructions

This repository uses AI-assisted project management and coding. This file is the permanent instruction entry point for future agents.

## Required reading before substantial changes

Read these files first:

1. `PROJECT.md`
2. `ARCHITECTURE.md`
3. `TESTING.md`
4. `RELEASE_PROCESS.md`
5. `DECISIONS.md`
6. `ROADMAP.md`
7. `TECHNICAL_DEBT.md`

Also inspect feature-specific documentation relevant to the work. Current durable references include:

### Music, curriculum and rights

- `PUBLIC_DOMAIN_MUSIC.md`
- `MUSIC_SOURCES.md`
- `PIANO_CURRICULUM.md`
- `BASS_CURRICULUM_PLAN.md`
- `SONG_AUTHORING_PIPELINE_SPEC.md`
- `MUSICAL_REVIEW_CHECKLIST.md`

### Audio, hardware and timing

- `AUDIO_PIPELINE_REVIEW.md`
- `HARDWARE_VALIDATION.md`
- `HARDWARE_SETUP_WIZARD_SPEC.md`
- `LATENCY_CALIBRATION_SPEC.md`
- `MONDAY_HARDWARE_TEST_PLAN.md`

### Guitar/string-player performance and future Bass

- `CHROMEBOOK_PERFORMANCE_BENCHMARK.md`
- `BASS_QUEST_SPEC.md`
- `INCREMENTAL_MODULARIZATION_PLAN.md`
- `ACCESSIBILITY_READABILITY_SPEC.md`

### Practice intelligence and progress

- `TROUBLE_SPOT_PRACTICE_SPEC.md`
- `PARENT_TEACHER_PROGRESS_SPEC.md`

### PWA/offline lifecycle and recovery

- `PWA_OFFLINE_UPDATE_SPEC.md`
- `SESSION_RECOVERY_SPEC.md`

### Testing strategy

- `TEST_DEBT_AUDIT.md`
- `TEST_FIXTURE_STRATEGY.md`

### Research/licensing

- `OPEN_SOURCE_REVIEW.md`

These planning/specification documents define intended direction and acceptance constraints. They do **not** authorize unrelated implementation work or a broad rewrite. Always reconcile them with the current implementation before coding.

## GitHub execution hierarchy

Family Music Quest uses GitHub as the durable execution record for actionable work, without replacing the permanent repository documentation.

Use this hierarchy:

1. **Permanent documentation** (`PROJECT.md`, `DECISIONS.md`, `ROADMAP.md`, `TECHNICAL_DEBT.md`, feature specs) — durable product truth, architecture direction, roadmap, debt and long-lived decisions.
2. **GitHub Issues** — actionable work packages, reproducible bugs/findings, hardware findings ready for prioritization, or explicit acceptance tasks.
3. **GitHub Project** — execution state only. Preferred states: Backlog → Ready → In Progress → Needs Hardware Test → Done.
4. **Pull Requests** — focused implementation/change record tied to an Issue when one exists.
5. **CI** — automated validation gate.
6. **Hardware reports/manual testing** — physical acceptance evidence.
7. **Project Manager** — final scope, priority, release grouping and pass/fail authority.

Issues must not replace or become a duplicate copy of `ROADMAP.md`, `TECHNICAL_DEBT.md`, feature specifications, or product decisions. Do not mass-create Issues from every idea/debt/spec item. Create an Issue when work is concrete enough to prioritize, implement, reproduce, or accept.

### Issue readiness and Build Agent handoff

An Issue existing does **not** mean it is approved implementation scope.

- **Backlog** — actionable, but not approved for immediate implementation.
- **Ready** — the Project Manager has approved the Issue as the current work package/release boundary.
- **In Progress** — an agent is actively working it.
- **Needs Hardware Test** — implementation/CI is complete, but physical acceptance remains outstanding.
- **Done** — all required implementation and acceptance gates are complete.

A Build Agent should normally receive a compact handoff such as:

> Work GitHub Issue #XX. Read `AGENTS.md` and all required/relevant repository documentation first. Treat the Issue acceptance criteria as the approved implementation boundary. Open a focused PR after implementation and automated validation. Do not expand scope.

Before coding an Issue, the Build Agent must still inspect current implementation, tests, recent fixes, and relevant permanent documentation. The Issue is the approved work package, not a substitute for repository context.

An implementation-ready Issue should normally contain:

- concise problem/goal;
- why it matters;
- current evidence/reproduction where applicable;
- approved scope;
- explicitly out-of-scope behavior;
- observable acceptance criteria;
- regression requirements;
- automated tests expected;
- physical hardware testing still required;
- relevant permanent docs/specs to read.

Keep Issues focused. Do not repeat the entire repository history.

### Hardware findings

Real Chromebook/instrument findings should become Issues when they expose a reproducible/actionable problem or a defined acceptance task. Useful evidence can include FMQ version, hardware-report session ID, expected/observed behavior, reproduction frequency, device/input, screenshot/video filenames, and blocker status.

Do not create an Issue for every test observation. The Project Manager should consolidate related evidence when that creates a clearer work package.

CI completion and hardware acceptance are separate gates. An Issue may remain **Needs Hardware Test** after a PR is merged or implementation is otherwise technically complete. Automated tests must never be treated as proof of microphone/MIDI/USB behavior, Chromebook performance, perceived latency, readability, musical feel, audio quality, or child usability.

The current v2.6.8 Monday hardware-acceptance gate remains the active product gate. Do not pre-create speculative bug Issues for failures not actually observed, and do not mark Bass Quest Ready merely because it is NEXT in the roadmap.

### Minimal label convention

Use labels sparingly for useful category/risk filtering rather than duplicating Project status. Preferred labels are:

- `bug`
- `hardware-test`
- `guitar`
- `piano`
- `bass`
- `pwa`
- `performance`
- `testing`
- `documentation`
- `maintenance`
- `future`
- `blocker`

Reuse existing equivalent labels rather than creating duplicates. Status belongs primarily in the GitHub Project, not in Ready/In Progress/etc. labels.

## Feature-specific required-reading map

When a task touches one of these areas, read the listed spec before designing the change:

| Area | Required reference |
| --- | --- |
| Bass Quest / shared string-instrument work | `BASS_QUEST_SPEC.md` |
| Bass curriculum, grooves, Drum Lock or built-in Bass content | `BASS_CURRICULUM_PLAN.md` |
| Guitar Full Song/import/render performance | `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` |
| Monday/child physical hardware acceptance | `MONDAY_HARDWARE_TEST_PLAN.md` |
| Guitar `app.js` extraction, renderer/input/transport modularization or architecture cleanup | `INCREMENTAL_MODULARIZATION_PLAN.md` |
| Gameplay readability, contrast, color/label cues or accessibility | `ACCESSIBILITY_READABILITY_SPEC.md` |
| Input/backing/visual/MIDI timing compensation | `LATENCY_CALIBRATION_SPEC.md` |
| Child-facing hardware/input setup | `HARDWARE_SETUP_WIZARD_SPEC.md` |
| Automatic weak-section/phrase practice | `TROUBLE_SPOT_PRACTICE_SPEC.md` |
| Installed PWA updates or offline Guitar playback | `PWA_OFFLINE_UPDATE_SPEC.md` |
| Interrupted-run/session recovery | `SESSION_RECOVERY_SPEC.md` |
| Parent/teacher progress reporting or new practice history | `PARENT_TEACHER_PROGRESS_SPEC.md` |
| Built-in music authoring format, validation or content tooling | `SONG_AUTHORING_PIPELINE_SPEC.md` |
| New MIDI/Guitar Pro test fixtures or import-player regression assets | `TEST_FIXTURE_STRATEGY.md` |

If a release touches multiple rows, read all applicable references. Do not rely on an old prompt as a substitute.

## Before coding

- Inspect the relevant current implementation.
- Do not assume architecture from old prompts or chat history.
- Search for an existing reusable system before creating another one.
- Check recent regression fixes before changing shared code.
- Read relevant tests.
- Identify scoring, storage, input, lifecycle, performance, PWA and child-UX risks.
- If documentation and code disagree, treat the code as evidence of current implementation and report/update the discrepancy rather than inventing behavior.

## During coding

- Prefer small focused changes.
- Avoid unrelated cleanup.
- Avoid broad rewrites.
- Reuse established patterns when they fit.
- Preserve current behavior unless the release explicitly changes it.
- Do not silently change scoring rules.
- Do not silently change hit windows or completion behavior.
- Do not silently change save formats.
- Do not silently change input behavior.
- Do not silently weaken rights/licensing requirements.
- Do not add dependencies without explaining why they are worth the size/performance/maintenance cost.
- Do not remove or disable tests because they fail after your change.
- Update tests when intended behavior changes.
- If a technical limitation forces a musical compromise, document it explicitly.

## Performance-sensitive systems

Treat these as performance-sensitive by default:

- Web Audio;
- microphone acquisition;
- pitch detection;
- onset detection;
- AlphaTab playback;
- imported-song synchronization;
- animation loops;
- Note Highway rendering;
- Tab View rendering/scrolling;
- large MIDI files;
- large Guitar Pro files;
- Web MIDI timing;
- service-worker/PWA startup/cache behavior;
- Chromebook layout/repaint work.

For performance-sensitive changes:

1. establish current behavior/baseline;
2. change only what the release needs;
3. compare before/after;
4. test representative small and large material;
5. avoid unnecessary allocations, whole-list scans, forced layouts or DOM churn inside high-frequency loops;
6. identify what still requires real Chromebook testing.

For Guitar/imported-song performance work, use `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` as the repeatable real-device protocol.

Do not claim a performance win from code inspection alone.

## Child UX

A technically correct implementation can still fail acceptance if a child cannot use it.

Prioritize:

- clear labels;
- large readable targets;
- obvious next actions;
- limited configuration during normal learning;
- forgiving but meaningful feedback;
- visual clarity over information density.

For gameplay readability/accessibility changes, follow `ACCESSIBILITY_READABILITY_SPEC.md` and validate on the target Chromebook at actual playing distance.

Advanced technical information belongs in dedicated diagnostic/setup areas.

## Musical correctness

Do not make arbitrary musical compromises merely to simplify implementation.

Examples:

- do not pad incomplete melodies with repeated fragments just to hit a duration threshold;
- do not flatten meaningful rhythm unless the arrangement is intentionally simplified and still recognizable;
- do not claim full chord recognition for a monophonic microphone detector;
- do not change instrument octave/range to fit an existing detector;
- do not relabel a partial classical theme as a complete work.

For new built-in content or content-format work, follow `SONG_AUTHORING_PIPELINE_SPEC.md` plus the rights/source documentation.

## Scoring invariants to protect

Unless a release explicitly changes them:

### Piano

- simultaneous notes at one start time form a target group;
- MIDI chord-note arrival order does not matter;
- duplicate Note On events cannot satisfy one required pitch twice;
- the target advances only when the required group is complete;
- MIDI/on-screen-capable modes preserve intended polyphony;
- microphone practice uses a compatible monophonic learner arrangement.

### Guitar

- intentionally skipped/pruned events are excluded from misses, accuracy, stars, coaching, skill history and Smart Practice analysis;
- count-in is cancellable;
- run cleanup prevents stale timers/callbacks;
- input/scoring remains honest about monophonic pitch-detection limits.

## Storage/save rules

Current development policy:

- previous-release saves do not require guaranteed compatibility;
- do not spend major effort on migrations unless explicitly requested;
- current-release saves must work reliably;
- profile isolation must remain correct;
- intentional incompatible resets must be documented;
- imported song libraries are currently device-local and not part of each profile's progress object.

Do not silently introduce a migration burden that the product does not yet require.

## Rights/licensing rules

For built-in music:

- verify public-domain/allowed source status;
- independently author FMQ arrangements;
- do not copy modern tabs, MIDI files, commercial arrangements, recordings or tutorial transcriptions;
- update source/rights documentation.

For repository test fixtures:

- prefer original/generated FMQ material or clearly documented public-domain/compatible material;
- keep copyrighted commercial-song stress files local/manual only;
- follow `TEST_FIXTURE_STRATEGY.md`.

For open-source research:

- conceptual learning is fine;
- copying code requires license compatibility;
- do not copy GPL or unlicensed source into this repository without an explicit licensing decision.

## Testing expectations

Use the repository's actual scripts. At the time of this document:

```bash
npm test
npm run check
npm run test:browser
```

Do not claim lint/typecheck/production build passed unless those commands actually exist and were run.

Keep CI green for applicable releases.

See `TESTING.md` for manual hardware acceptance requirements and test debt. Use the feature-specific acceptance/benchmark specs above when a release touches those areas.

## Completion report

Do not claim a release is complete merely because code compiles or tests pass.

Report:

- release/version;
- files/systems changed;
- behavior changed;
- important behavior preserved;
- tests run;
- CI status;
- save/schema impact;
- PWA/cache impact if relevant;
- known risks/limitations;
- manual hardware checks still recommended;
- newly discovered technical/test debt.

Never claim subjective audio quality, musical feel, child usability or physical-hardware behavior was verified when it was not actually tested by a human on that hardware.

## Project-management behavior

Future project-management agents should:

- keep release scope focused;
- decide whether a proposal/finding is durable documentation, an actionable Issue, or neither;
- use GitHub Issues as the normal execution handoff for approved actionable work;
- mark work Ready only when the Project Manager has approved the Issue/work package;
- keep GitHub Project state aligned with actual execution and hardware-acceptance status;
- turn real-world findings into observable acceptance criteria and consolidate related evidence when useful;
- prioritize foundational regressions before new roadmap expansion;
- keep `ROADMAP.md`, `DECISIONS.md`, and `TECHNICAL_DEBT.md` current;
- consult and maintain the relevant durable feature specs rather than rebuilding product decisions from chat history;
- schedule maintenance releases periodically;
- avoid turning every idea into an Issue or immediate implementation scope.
