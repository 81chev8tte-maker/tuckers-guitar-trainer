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

### Guitar/string-player performance and future Bass

- `CHROMEBOOK_PERFORMANCE_BENCHMARK.md`
- `BASS_QUEST_SPEC.md`

### Practice intelligence and progress

- `TROUBLE_SPOT_PRACTICE_SPEC.md`
- `PARENT_TEACHER_PROGRESS_SPEC.md`

### PWA/offline lifecycle

- `PWA_OFFLINE_UPDATE_SPEC.md`

### Research/licensing

- `OPEN_SOURCE_REVIEW.md`

These planning/specification documents define intended direction and acceptance constraints. They do **not** authorize unrelated implementation work or a broad rewrite. Always reconcile them with the current implementation before coding.

## Feature-specific required-reading map

When a task touches one of these areas, read the listed spec before designing the change:

| Area | Required reference |
| --- | --- |
| Bass Quest / shared string-instrument work | `BASS_QUEST_SPEC.md` |
| Bass curriculum, grooves, Drum Lock or built-in Bass content | `BASS_CURRICULUM_PLAN.md` |
| Guitar Full Song/import/render performance | `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` |
| Input/backing/visual/MIDI timing compensation | `LATENCY_CALIBRATION_SPEC.md` |
| Child-facing hardware/input setup | `HARDWARE_SETUP_WIZARD_SPEC.md` |
| Automatic weak-section/phrase practice | `TROUBLE_SPOT_PRACTICE_SPEC.md` |
| Installed PWA updates or offline Guitar playback | `PWA_OFFLINE_UPDATE_SPEC.md` |
| Parent/teacher progress reporting or new practice history | `PARENT_TEACHER_PROGRESS_SPEC.md` |
| Built-in music authoring format, validation or content tooling | `SONG_AUTHORING_PIPELINE_SPEC.md` |

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
- turn real-world findings into observable acceptance criteria;
- prioritize foundational regressions before new roadmap expansion;
- keep `ROADMAP.md`, `DECISIONS.md`, and `TECHNICAL_DEBT.md` current;
- consult and maintain the relevant durable feature specs rather than rebuilding product decisions from chat history;
- schedule maintenance releases periodically;
- avoid turning every idea into immediate implementation scope.
