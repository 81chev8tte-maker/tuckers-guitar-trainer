# Family Music Quest — Incremental Modularization Plan

This document defines the intended long-term approach for reducing coupling in the large Guitar `app.js` without destabilizing working gameplay.

It is a planning/source-of-truth document. It does **not** authorize a broad refactor, framework migration, or rewrite. The central rule is:

> **Extract a boundary only when a focused product release already needs meaningful work in that boundary, and preserve behavior before improving architecture.**

The goal is not to make the repository look cleaner. The goal is to make future Guitar, Bass, performance, hardware, import, and reliability work safer.

---

# 1. Current Baseline

At the time this plan was written, `app.js` contains much of Guitar Quest, including:

- Guitar curriculum/world navigation;
- Guitar tools and tab-learning UI;
- Guitar state/progress integration;
- microphone/USB-audio input;
- pitch/onset analysis;
- Note Highway rendering;
- playable Tab View rendering;
- game-session lifecycle;
- scoring integration;
- count-in, pause, restart and exit behavior;
- speed/section/A-B practice controls;
- imported-song library UI;
- Guitar Pro/MusicXML/text-tab handling;
- imported-score track selection and conversion;
- AlphaTab initialization/playback/backing synchronization;
- imported-song Full Song/section practice setup;
- top-level Guitar navigation.

This concentration creates coupling and makes performance-sensitive changes harder to isolate.

However, the repository already demonstrates successful incremental extraction. Separate modules now exist for:

- `profiles.js` — player/profile ownership;
- `hardware-services.js` — shared Web MIDI;
- `practice-tools.js` — loop/timing utilities;
- `practice-intelligence.js` — skill history and Smart Practice helpers;
- `gameplay-rules.js` — deterministic scoring/grouping rules;
- `midi-analysis.js` — imported MIDI learning analysis;
- `guitar-songbook.js` — built-in Guitar Songbook content;
- `piano-songbook.js` / `piano-lessons.js` — Piano content/curriculum.

The future Guitar decomposition should follow the same pattern: **small stable ownership boundaries with explicit contracts**.

---

# 2. Non-Goals

This plan is **not** permission to:

- rewrite Guitar Quest in a framework;
- convert the whole repository to TypeScript;
- introduce a bundler solely to support modularization;
- replace the current SPA/navigation model;
- replace AlphaTab without evidence;
- replace Web Audio input without evidence;
- rewrite scoring while moving files;
- merge Guitar and Piano into one generic player;
- expose Bass before its own release scope;
- move every helper into a tiny file;
- perform a large one-shot `app.js` breakup;
- change public APIs simply because another naming scheme looks cleaner.

A refactor that changes behavior and architecture simultaneously is higher risk and should be avoided unless the product change truly requires both.

---

# 3. Architectural Principles

## Ownership before file count

A useful module has a clear responsibility and owns a coherent state/lifecycle boundary.

Bad goal:

> “Make `app.js` under 1,000 lines.”

Good goal:

> “AlphaTab lifecycle and backing-clock behavior are owned by one adapter with a small tested interface.”

## Extract contracts, not arbitrary chunks

Do not move a block of functions merely because they are adjacent in the file.

A module is ready to extract when its inputs, outputs, state ownership, and cleanup behavior can be stated clearly.

## Preserve one source of truth

Do not create parallel ownership of:

- gameplay clock;
- score state;
- run lifecycle token;
- active input stream;
- imported song selection;
- profile progress;
- AlphaTab player instance.

During migration, one side must remain authoritative.

## Prefer adapters around third-party/runtime systems

AlphaTab, Web Audio, IndexedDB, and browser device APIs should be reached through narrow project-owned boundaries where practical.

This makes the app easier to test without pretending those browser systems are simple pure functions.

## Pure transformations first where useful

Data conversion/validation helpers are lower-risk extraction targets than highly stateful rendering/audio code.

But do not delay a needed performance fix merely to perform a purity refactor first.

## Physical acceptance still matters

Moving code between files does not prove Guitar audio, latency, Tab View, Highway readability, or Chromebook performance remains correct.

Any extraction touching those systems inherits the relevant manual acceptance requirements.

---

# 4. Desired Long-Term Boundaries

Names below are conceptual. Exact filenames should be chosen when a real release performs an extraction. Do not create empty placeholder files merely to match this document.

A reasonable eventual structure is:

```text
Guitar Quest shell / orchestration
│
├── String instrument configuration
├── Game session / lifecycle
├── Highway renderer
├── Tab renderer
├── Guitar audio input / detector adapter
├── Practice transport / clock
├── AlphaTab backing adapter
├── Imported-song conversion / library
├── Guitar content / curriculum
└── Guitar UI/navigation
```

These are **ownership boundaries**, not a requirement for exactly nine files.

---

# 5. Boundary A — String-Instrument Configuration

## Responsibility

Represent instrument/string facts used by reusable string-player systems:

- string count;
- string order;
- names/labels;
- physical string numbers;
- open MIDI pitches;
- colors/visual identifiers;
- tuning;
- playable/fret constraints where appropriate.

## Why it matters

Current Guitar code contains fixed-six assumptions. Future Bass requires a deliberate 4-string configuration without duplicating the player.

See `BASS_QUEST_SPEC.md`.

## Contract direction

Renderers and shared string helpers should consume an instrument/string configuration rather than infer six-string Guitar globally.

Conceptually:

```text
instrumentConfig
  id
  strings[]
  stringCount (derived if possible)
  tuning
  display order
  detector profile reference
```

Do not force detector implementation details into the visual string configuration.

## Extraction trigger

Perform only as part of:

- v2.6.4-style removal of fixed-six assumptions;
- Bass Quest foundation;
- another focused string-rendering change that genuinely benefits.

## Regression requirements

- six-string Guitar remains identical in supported behavior;
- existing Guitar Songbook positions remain correct;
- tab order remains correct;
- imported Guitar tuning remains correct;
- color/string identity remains stable unless intentionally changed.

---

# 6. Boundary B — Game Session / Lifecycle

## Responsibility

Own the lifecycle of one active Guitar practice run:

- run identity/token;
- running/paused/completed state;
- current event/index/window state;
- score/combo/result state integration;
- count-in ownership;
- restart/exit cleanup coordination;
- completion exactly once;
- invalidation of stale callbacks.

## Why it matters

Lifecycle bugs can produce duplicate completions, stale timers, stale scoring, or audio continuing after navigation/profile changes.

The current test-debt audit identifies this as a high-value future test area.

## Contract direction

Other modules should not independently decide that a run is still valid.

Conceptually:

```text
session.start(level, options)
session.pause()
session.resume()
session.restart()
session.finish(reason)
session.dispose(reason)
session.isCurrent(runToken)
```

Exact APIs should fit the current code rather than being imposed prematurely.

## Extraction trigger

Only when a release substantially touches:

- restart/exit/count-in behavior;
- duplicate completion;
- Trouble Spot replay;
- session recovery;
- profile/instrument switching during play.

## Important rule

Do not combine this extraction with scoring-rule changes unless the release explicitly requires them.

---

# 7. Boundary C — Highway Renderer

## Responsibility

Own visual representation of Guitar/future string-instrument highway state:

- lane/string geometry;
- strike line;
- note blocks;
- fret/open labels;
- sustain ribbons;
- chord stacks/cues;
- hit/miss visual feedback;
- visible event window;
- renderer-owned DOM recycling/caching;
- responsive layout measurements.

## Should not own

- score calculation;
- microphone detection;
- profile storage;
- AlphaTab playback;
- musical clock authority;
- song import parsing.

## Preferred input

A bounded render snapshot, for example conceptually:

```text
current musical time
instrument/string config
visible/upcoming events
strike/playhead state
view options
hit/miss presentation state
```

The renderer should not repeatedly search the entire song merely because it can access the game object.

## Why it matters

The current Full Song performance investigation identified whole-event-list work and large DOM materialization as likely scale-sensitive pressure points.

## Extraction trigger

After v2.6.4 performance changes are hardware-validated, or during a later focused Highway/accessibility release.

**Do not extract the pre-v2.6.4 renderer while the performance patch is still unsettled.**

## Acceptance

Use `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` plus normal Guitar scoring regressions.

A code move is not successful if frame behavior or readability regresses.

---

# 8. Boundary D — Tab Renderer

## Responsibility

Own playable tablature presentation:

- string lines;
- tab order;
- musical/time spacing;
- chord vertical alignment;
- measure/phrase markers;
- active playhead/current target indication;
- bounded/virtualized upcoming window;
- renderer-owned DOM reuse;
- accessibility/readability presentation.

## Should not own

- gameplay scoring;
- backing playback;
- song clock;
- imported parser;
- speed logic.

## Why separate from Highway

Highway and Tab View are two presentations of the same gameplay material but have substantially different layout/readability needs.

Sharing low-level event-window helpers may be sensible; forcing both into one renderer abstraction is not required.

## Extraction trigger

Only after the v2.6.4 Tab View redesign stabilizes on the real Chromebook.

A future cleanup may then extract the **accepted** design rather than modularizing a version already known to be inadequate.

---

# 9. Boundary E — Guitar Audio Input / Detection

## Responsibility

Own real-time Guitar input acquisition and detection lifecycle:

- device selection;
- `getUserMedia` stream ownership;
- AudioContext/analyser setup;
- RMS/noise gate;
- pitch estimation;
- onset/stability calculation;
- detector sampling cadence;
- input diagnostics emitted to the UI;
- start/stop/dispose.

## Critical contract

The detector should report observations; it should not own gameplay scoring policy.

Conceptual output:

```text
frequency
midi/note estimate
cents/confidence where applicable
RMS/input level
onset
sample timestamp
scoreability/validity metadata
```

The gameplay layer decides whether an observation satisfies the current target under existing scoring rules.

## Why it matters

Bass needs a different low-frequency detector profile without damaging Guitar. Latency calibration and the Hardware Setup wizard also need a stable input boundary.

See:

- `BASS_QUEST_SPEC.md`
- `LATENCY_CALIBRATION_SPEC.md`
- `HARDWARE_SETUP_WIZARD_SPEC.md`
- `AUDIO_PIPELINE_REVIEW.md`

## Extraction trigger

A focused release involving:

- Bass detector work;
- latency calibration;
- guided input setup;
- measured AudioWorklet experimentation;
- significant microphone/device lifecycle fixes.

## Do not do

Do not change pitch thresholds, onset behavior, noise gate behavior, or scoring acceptance merely because the code is being moved.

---

# 10. Boundary F — Practice Transport / Musical Clock

## Responsibility

Own the timeline used by gameplay and practice controls:

- current musical position/time;
- play/pause/resume/seek;
- speed;
- section/full-song bounds;
- A/B loop range;
- repeat/restart position;
- count-in handoff;
- synchronization contract with backing playback.

## Why it matters

Imported Guitar gameplay currently coordinates with AlphaTab backing while built-in/no-backing Guitar runs use a simpler local timing path.

Transport is one of the most dangerous places to create two sources of truth.

## Architectural rule

> **There is one gameplay timeline authority for a run. Backing playback may supply or synchronize that timeline, but renderers, scoring, and loops must not each invent separate clocks.**

## AlphaTab relationship

The transport contract should not require the rest of Guitar gameplay to know every AlphaTab API detail.

The AlphaTab adapter can provide capabilities such as:

- ready state;
- current tick/position;
- playback state;
- speed;
- seek/range;
- mute/volume;
- lifecycle callbacks.

The transport/game layer decides how those capabilities fit FMQ practice behavior.

## Extraction trigger

A focused release touching:

- A/B integration;
- playback drift;
- latency/sync calibration;
- Trouble Spot section replay;
- imported backing reliability.

Do not perform transport extraction during an unresolved Full Song stutter investigation unless profiling shows it is necessary to the fix.

---

# 11. Boundary G — AlphaTab Backing Adapter

## Responsibility

Contain AlphaTab-specific setup and lifecycle:

- `AlphaTabApi` creation/destruction;
- score load callbacks;
- player-ready state;
- soundfont/runtime configuration;
- selected-track mute;
- master volume;
- playback speed/range;
- tick/position events;
- player pause/stop/seek;
- error/readiness reporting.

## Should not own

- FMQ score calculation;
- note-density difficulty logic;
- profile XP;
- Tab View/Highway rendering;
- Guitar input detection.

## Why it matters

AlphaTab is a third-party dependency with performance and offline implications. A narrow adapter would reduce the number of places future PWA, performance, and import work must understand its raw API.

See `PWA_OFFLINE_UPDATE_SPEC.md`.

## Extraction trigger

Only after v2.6.4 establishes the actual performance bottleneck and accepted playback behavior.

If AlphaTab is not the bottleneck, do not rewrite its integration simply because an adapter would be cleaner.

---

# 12. Boundary H — Imported-Song Data / Library

This may eventually be more than one module, but avoid over-splitting early.

## Responsibility candidates

### Import/library storage

- file metadata;
- IndexedDB persistence;
- saved imported library listing;
- delete/load operations;
- format/version validation.

### Imported-score conversion

- playable track detection;
- tuning/string metadata extraction;
- note/string/fret/MIDI conversion;
- chord/event grouping;
- section/bar information;
- difficulty metadata;
- Guitar/Bass track classification in the future.

### UI selection

Imported library cards and track/section selection may remain orchestration/UI responsibilities initially rather than creating a giant import subsystem at once.

## Architectural rule

Conversion should be deterministic where practical and testable without launching the entire player.

This is especially important before Bass Quest, where Guitar and Bass may share one imported score library but select different instrument tracks.

## Extraction trigger

- Bass import support;
- import bug fixes requiring parser changes;
- backup/full-library redesign;
- legal synthetic/open fixture tests;
- major imported-song UI work.

---

# 13. Boundary I — Guitar Content / Curriculum

Built-in Guitar Songbook is already separated into `guitar-songbook.js`.

The remaining curriculum/world definitions inside `app.js` are a relatively low-risk eventual extraction candidate, provided IDs and behavior remain stable.

## Responsibility

- lesson/world metadata;
- built-in level note definitions;
- coaching text;
- progression references;
- skill tags;
- content IDs.

## Should not own

- DOM navigation logic;
- scoring;
- audio input;
- transport;
- profile storage.

## Relationship to future authoring pipeline

See `SONG_AUTHORING_PIPELINE_SPEC.md`.

Do not migrate all current Guitar curriculum data to a new canonical format merely as part of file extraction. Format migration and file ownership are separate decisions.

## Extraction trigger

A focused Guitar curriculum/content expansion or song-authoring pipeline implementation.

---

# 14. Boundary J — Guitar UI / Navigation Shell

This is likely the **last** area worth extracting.

## Responsibility

- Guitar top navigation;
- view switching;
- opening curriculum/tools/songs;
- wiring user actions to service/player modules;
- high-level orchestration.

Ideally, after lower-level responsibilities are extracted, the remaining `app.js` can naturally become a thinner Guitar shell/orchestrator.

Do not start by extracting navigation while all lower-level state remains globally coupled; that usually just moves DOM code into another file without improving architecture.

---

# 15. Recommended Extraction Order

This is a dependency-aware direction, not a mandatory release sequence.

## Stage 0 — Finish and validate v2.6.4 first

Before architecture cleanup:

- fix/measure Full Song performance;
- stabilize the new/accepted Tab View;
- stabilize Highway rendering/string identity;
- validate on the target Chromebook.

Do not modularize moving targets while the release-blocking behavior is still unresolved.

## Stage 1 — Pure/stable data boundaries when naturally touched

Likely candidates:

- string-instrument configuration;
- imported-score conversion helpers;
- Guitar curriculum data.

These are generally easier to regression-test than live render/audio systems.

## Stage 2 — Renderer ownership

After v2.6.4 behavior is accepted:

- Highway renderer;
- Tab renderer;
- shared bounded-event-window helpers only if genuinely shared.

Do not force the two renderers into one abstraction.

## Stage 3 — Lifecycle/transport boundaries

When the product needs Trouble Spot, stronger A/B integration, session recovery, or sync work:

- game session/lifecycle;
- practice transport/clock;
- AlphaTab adapter.

These should be accompanied by stronger lifecycle/browser tests from `TEST_DEBT_AUDIT.md`.

## Stage 4 — Audio input boundary

When Bass, latency calibration, or hardware setup requires detector work:

- extract/clarify Guitar audio-input observation contract;
- then introduce instrument-specific detector profiles behind the shared boundary.

Do not perform a speculative AudioWorklet conversion as part of the extraction.

## Stage 5 — Thin shell

Only after meaningful ownership has moved out should `app.js` be reduced to high-level orchestration/navigation.

---

# 16. Release-Trigger Matrix

| Future work | Boundary to consider |
| --- | --- |
| Bass Quest foundation | String config, imported-score conversion, audio detector contract |
| Highway accessibility/polish | Highway renderer |
| Tab learning/readability follow-up | Tab renderer |
| Trouble Spot Practice | Game session + transport |
| Latency calibration | Audio input contract + transport |
| Guided Hardware Setup | Audio input/service boundary |
| PWA/offline AlphaTab work | AlphaTab adapter |
| Guitar Pro track/import expansion | Import conversion/library |
| Backup imported-library expansion | Import storage/library |
| Guitar curriculum expansion | Content/curriculum |
| Session recovery | Game session + transport |
| Full Song performance follow-up | Only the measured bottleneck; do not refactor unrelated boundaries |

The matrix means “consider extraction while working here,” not “must extract before implementing the feature.”

---

# 17. State Ownership Rules

Future modules should make ownership explicit.

## Profile progress

Owned by the profile/progress layer. Gameplay may request save/load but should not create a parallel profile store.

## Active game session

One session owner should define run validity, pause, completion, restart and disposal.

## Input stream

One audio-input owner should hold the current stream/context/analyser lifecycle.

## Backing player

One AlphaTab adapter instance should own its player lifecycle.

## Transport clock

One authoritative timeline per run.

## Renderer state

Renderers may own DOM caches/recycled nodes/layout measurements, but not musical score state.

## Imported library

One storage layer should own IndexedDB persistence rather than UI components independently reading/writing stores.

---

# 18. Interface Design Rules

## Pass the smallest useful data

Do not give every module the entire mutable `game`, `state`, or DOM root if a smaller contract works.

## Prefer commands/events over shared mutation

Useful conceptual patterns:

```text
renderer.render(snapshot)
input.subscribe(onObservation)
transport.seek(position)
backing.setVolume(value)
library.load(id)
session.dispose(reason)
```

Do not implement an event bus merely because this document uses the word “event.” Existing direct callbacks/custom events are fine when simple.

## Keep hot paths allocation-conscious

A clean module API that allocates huge snapshots every animation frame can be worse than the current code.

Performance-sensitive boundaries must respect `CHROMEBOOK_PERFORMANCE_BENCHMARK.md`.

## No hidden fallbacks

If an adapter cannot perform a requested operation, fail/report clearly rather than silently changing scoring, speed, density, or backing behavior.

---

# 19. Testing Requirements Per Extraction

A refactor release should prove behavior, not merely syntax.

## Always

Run the repository’s actual commands:

```bash
npm test
npm run check
npm run test:browser
```

## Add tests when the boundary makes them practical

Use `TEST_DEBT_AUDIT.md` to prioritize.

Examples:

### Session extraction

Add:

- one completion per run;
- stale callback invalidation;
- exit/restart/profile-switch lifecycle tests.

### Import conversion extraction

Add:

- deterministic track/string/fret/MIDI conversion tests;
- legal synthetic/open fixtures where practical.

### AlphaTab adapter extraction

Add stable adapter-state/command tests around a seam where possible, while keeping real audio/Chromebook validation manual.

### Audio input extraction

Add deterministic tests for pure pitch/calibration helpers when credible; do not pretend synthetic unit tests validate physical microphones.

### Renderer extraction

Protect view launch/state and bounded event behavior in browser tests; readability remains human acceptance.

---

# 20. Performance Guardrails

Modularization must not introduce performance regression through abstraction overhead.

Especially avoid:

- rebuilding full-song arrays on every frame;
- copying large event arrays through module APIs per frame;
- repeated JSON cloning in animation/audio paths;
- unnecessary custom-event dispatch for high-rate pitch/frame updates;
- querying DOM globally from multiple modules every frame;
- duplicated layout reads;
- parallel RAF loops that could be one coordinated player loop;
- wrapping AlphaTab/player events in layers that add uncontrolled scheduling.

Measure before/after when extracting any high-frequency system.

---

# 21. PWA / Script Loading Constraints

The repository currently runs as a static PWA without a bundler.

Future modularization should respect that reality.

Possible approaches include continuing the current explicit script-loading/global-service pattern where appropriate.

Do **not** add a build system solely because ES module imports would look cleaner. A build/bundling decision requires its own justification based on maintenance, caching, deployment, testing, and Chromebook behavior.

Every new runtime script must be included correctly in:

- page loading order;
- service-worker/app-shell versioning where applicable;
- PWA asset tests;
- syntax-check commands if it is a major runtime file.

See `PWA_OFFLINE_UPDATE_SPEC.md`.

---

# 22. How to Handle Temporary Duplication

During a safe extraction it can be acceptable to briefly have an adapter/wrapper call existing legacy functions.

But avoid long-lived dual implementations.

A good migration pattern:

1. characterize existing behavior with tests;
2. introduce a narrow module/API;
3. route one existing path through it;
4. verify behavior;
5. remove the old duplicate path in the same focused change when safe.

Do not leave two scoring engines, two clocks, two pitch detectors, or two import converters active indefinitely.

---

# 23. When **Not** to Extract

Do not modularize a boundary in a release when:

- the behavior is currently failing and the root cause is not understood;
- profiling is still identifying the bottleneck;
- the area will immediately be redesigned again;
- there is no regression protection for a risky behavior and no way to add credible coverage;
- the extraction substantially increases release scope;
- the only reason is file length or style preference.

For example, while v2.6.4 Full Song performance is under active diagnosis, optimize the measured path first. Extract the accepted implementation later unless extraction is itself clearly necessary to make the fix safe.

---

# 24. Maintenance Release Direction

A future maintenance release may perform **one or two** low-risk extractions after product blockers are stable.

Good maintenance scope example:

> Extract imported-score conversion helpers and Guitar curriculum definitions with regression tests; no gameplay behavior changes.

Bad maintenance scope example:

> Break all of `app.js` into fifteen modules, convert scripts to ES modules, add a bundler, and clean up naming everywhere.

The latter creates too many simultaneous failure modes.

---

# 25. Relationship to Bass Quest

Bass is the strongest reason to improve shared string boundaries, but it must not become an excuse for a premature generic-engine rewrite.

The sequence should remain:

1. stabilize Guitar player/performance;
2. remove/configure obvious fixed-six assumptions;
3. establish only the shared contracts Bass actually needs;
4. add Bass-specific configuration, detector profile, progress, curriculum and tools;
5. keep Guitar behavior regression-tested.

See `BASS_QUEST_SPEC.md` and `BASS_CURRICULUM_PLAN.md`.

The principle remains:

> **Share mechanics, not curriculum or instrument identity.**

---

# 26. Definition of Done for an Extraction

A modularization change is successful only when:

- one clear ownership boundary is improved;
- public behavior remains unchanged unless explicitly in scope;
- scoring invariants remain intact;
- save/profile behavior remains intact;
- PWA/script references are correct;
- applicable deterministic/browser tests pass;
- new tests protect the extracted boundary where useful;
- high-frequency work is not measurably worse;
- required Chromebook/hardware checks are identified or completed;
- obsolete duplicate code is removed where safe;
- `ARCHITECTURE.md` is updated to describe what actually exists;
- no speculative future architecture is falsely documented as implemented.

A smaller `app.js` by itself is **not** a Definition of Done.

---

# 27. Recommended Immediate Decision

Do **not** start a modularization implementation while v2.6.4 is paused/incomplete.

Resume and complete the existing v2.6.4 Guitar Player & String Engine Polish work first. Validate its Full Song, Highway and Tab View behavior on the target Dell Chromebook.

After that validation:

- if Guitar still has a release-blocking performance problem, perform a focused v2.6.5-style correction before Bass;
- if Guitar is stable, use Bass Quest or another focused feature as the trigger for the first truly useful extraction boundary;
- avoid a standalone architecture rewrite between those releases.

This plan exists so future agents know **where the seams should be when the product work reaches them**, not so the seams become work by themselves.
