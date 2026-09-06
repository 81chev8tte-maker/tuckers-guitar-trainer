# Family Music Quest — Testing

This document defines the minimum testing expectations for future releases. It must stay aligned with the actual repository scripts and test files.

## Current automated commands

The repository currently provides these package scripts:

```bash
npm test
npm run check
npm run test:browser
```

### `npm test`

Runs the current deterministic Node test suite, including practice tools, MIDI analysis/validation, practice intelligence, Piano Songbook/curriculum, gameplay rules, UI layering and PWA asset validation.

### `npm run check`

Runs `node --check` syntax validation against the current major JavaScript files.

### `npm run test:browser`

Runs Playwright browser tests.

## Commands that do not currently exist

At the time of this document:

- there is no repository lint script;
- there is no TypeScript/type-check script;
- there is no bundler/production-build script.

Future agents must not claim those checks passed unless they are actually added to the repository.

## CI

GitHub Actions currently:

1. checks out the repository;
2. installs Node 22;
3. runs `npm ci`;
4. runs `npm test`;
5. runs `npm run check`;
6. installs Playwright Chromium/dependencies;
7. runs `npm run test:browser`;
8. verifies important offline/PWA version references against `package.json`.

A focused release should not merge with failing applicable CI unless the failure is explicitly understood and intentionally deferred by the product owner.

## Feature-specific acceptance references

Some product requirements need dedicated acceptance protocols beyond this general testing document. When a release touches these areas, use the corresponding durable spec:

- Guitar/imported-song performance and Full Song scale: `CHROMEBOOK_PERFORMANCE_BENCHMARK.md`
- latency/timing compensation: `LATENCY_CALIBRATION_SPEC.md`
- guided hardware/input setup: `HARDWARE_SETUP_WIZARD_SPEC.md`
- automatic weak-section practice: `TROUBLE_SPOT_PRACTICE_SPEC.md`
- PWA update/offline Guitar playback: `PWA_OFFLINE_UPDATE_SPEC.md`
- Bass architecture/input/hardware acceptance: `BASS_QUEST_SPEC.md`
- Bass curriculum/content behavior: `BASS_CURRICULUM_PLAN.md`
- parent/teacher progress accuracy/history: `PARENT_TEACHER_PROGRESS_SPEC.md`
- built-in song/content validation: `SONG_AUTHORING_PIPELINE_SPEC.md`

These documents supplement this file; they do not replace the permanent regression matrix below.

## Test philosophy

Tests exist to protect product behavior, not to maximize test count.

Prefer high-value deterministic tests for:

- scoring correctness;
- timing/grouping rules;
- data transformations;
- section/loop boundaries;
- storage/profile isolation;
- import analysis;
- PWA versioning;
- regression-prone browser navigation/lifecycle behavior.

Do not create dozens of fragile source-string tests that merely mirror implementation details when a behavioral test is feasible.

## Permanent regression matrix

### Piano

Future releases should preserve or deliberately update tests for:

- simultaneous target-group scoring;
- order-independent MIDI chord Note On arrival;
- duplicate chord-note rejection;
- MIDI/on-screen polyphony preservation;
- microphone-safe monophonic arrangement extraction;
- Wait for Me target behavior;
- pause/restart/exit audio cleanup;
- accompaniment enable/mute and zero-volume behavior;
- phrase/measure-based practice sections for built-in songs;
- imported MIDI time-section fallback where musical structure is unavailable;
- one completion/result flow per run;
- complete built-in Songbook structural data;
- rights/source metadata for public-domain pieces;
- lesson/song references and curriculum integrity.

Relevant current files include:

- `gameplay-rules.test.js`
- `piano-songbook.test.js`
- `piano-curriculum.test.js`
- `midi-analysis.test.js`
- `midi-validation.test.js`
- `browser-tests/app-smoke.spec.js`

### Guitar

Future releases should preserve or add protection for:

- skipped/pruned events excluded from accuracy and skill history;
- cancellable count-in;
- restart/exit cleanup;
- microphone single-note scoring behavior;
- imported-song section/full-song setup;
- AlphaTab selected-track muting and playback synchronization behavior;
- A/B loop behavior;
- open-string clarity;
- fret-number readability;
- sustain rendering;
- string-color consistency;
- readable Note Highway behavior;
- readable Tab View behavior;
- current import formats and track selection.

Relevant current files include:

- `gameplay-rules.test.js`
- `practice-tools.test.js`
- `browser-tests/app-smoke.spec.js`

Some Guitar visual/audio requirements remain test debt because automated coverage cannot yet prove them well.

### Shared

Future releases should preserve or deliberately update protection for:

- profile creation/switching/deletion;
- separate Guitar/Piano progress;
- profile-switch gameplay cleanup;
- Web MIDI connection/reconnection state;
- Note On/Off, velocity, polyphony and sustain event handling;
- calibration/report storage;
- Hardware & Backup opening above the instrument chooser;
- current backup/export/restore format behavior;
- Smart Practice deterministic progression;
- PWA cache/version consistency;
- browser navigation between instruments;
- offline app-shell behavior.

Relevant current files include:

- `practice-intelligence.test.js`
- `ui-layering.test.js`
- `pwa-assets.test.js`
- `browser-tests/app-smoke.spec.js`

## Test debt

Test debt is important behavior that is weakly or not automatically protected. It is not automatically a release blocker, but future work touching the area should consider adding useful coverage.

### High-value current test debt

- audible stutter/dropout during dense imported Guitar Pro playback;
- AlphaTab/game clock drift under real load;
- microphone responsiveness/false positives with real Guitar input;
- physical USB guitar/audio-interface latency;
- real Web MIDI device reconnect/sustain behavior;
- real chord timing on physical MIDI keyboards;
- actual Chromebook frame/render performance;
- Note Highway readability on target Chromebook viewport;
- playable Tab View readability in dense imported songs;
- musical feel and accompaniment balance;
- service-worker update UX on an already-installed Chromebook;
- fully offline AlphaTab soundfont availability;
- backup behavior under browser-storage/quota failure;
- responsive layout across the actual Dell Chromebook screen modes.

The dedicated specs above convert several of these debts into explicit future acceptance protocols even when automation cannot fully cover them.

### Test-debt rule

When a historical bug is fixed and a stable automated reproduction is practical, add a regression test. Do not fake confidence with a weak test that only searches source code for a CSS property or function name when the actual failure was behavioral.

## Manual acceptance testing

Automated tests cannot replace real hardware and child usability checks.

### Guitar checklist

Adapt this checklist for releases touching Guitar:

- [ ] microphone permission is requested/handled correctly;
- [ ] selected microphone/USB input works;
- [ ] tuner recognizes standard open strings;
- [ ] correct notes score;
- [ ] wrong notes do not falsely score;
- [ ] repeated notes require appropriate onset behavior;
- [ ] count-in can be cancelled by exit/restart/instrument/profile change;
- [ ] OPEN notes are unmistakable;
- [ ] fret numbers are readable at playing distance;
- [ ] each string can be distinguished without relying on position alone;
- [ ] Note Highway remains readable during chords/dense sections;
- [ ] Tab View can be followed during normal play;
- [ ] imported song loads and correct track can be selected;
- [ ] selected player track is muted when backing is enabled;
- [ ] imported backing does not audibly stutter or glitch;
- [ ] gameplay remains synchronized with backing;
- [ ] pause/resume behaves correctly;
- [ ] A/B/section loops restart cleanly;
- [ ] backing mute/volume behaves correctly;
- [ ] current player progress saves correctly.

For releases changing imported Guitar performance/rendering, run the matrix in `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` rather than relying on this checklist alone.

### Piano checklist

Adapt for releases touching Piano:

- [ ] microphone mode recognizes intended single notes;
- [ ] on-screen keyboard works;
- [ ] Web MIDI connects to a real keyboard;
- [ ] polyphonic chords score correctly;
- [ ] chord order does not matter;
- [ ] duplicate MIDI events do not falsely complete chords;
- [ ] Wait for Me behaves correctly;
- [ ] pause/restart/exit clears active audio;
- [ ] accompaniment enable/mute/volume works;
- [ ] song completion appears once;
- [ ] phrase/measure practice sections are musically sensible;
- [ ] full songs contain the musical material they claim to contain;
- [ ] Listen First sounds coherent;
- [ ] reduced speed remains synchronized;
- [ ] current player progress saves correctly.

### Shared checklist

- [ ] create/select/switch player works;
- [ ] switching profile during/after gameplay leaves no stale run state;
- [ ] instrument chooser works;
- [ ] Hardware & Backup opens directly from chooser;
- [ ] hardware diagnostics close cleanly;
- [ ] backup export works;
- [ ] restore works with a current supported backup;
- [ ] current-release progress survives normal reload;
- [ ] installed/offline PWA launches as expected;
- [ ] version update does not leave obviously stale core assets;
- [ ] major navigation fits target Chromebook viewport.

When hardware setup, timing calibration or PWA lifecycle behavior is in scope, also use `HARDWARE_SETUP_WIZARD_SPEC.md`, `LATENCY_CALIBRATION_SPEC.md`, or `PWA_OFFLINE_UPDATE_SPEC.md` as applicable.

## Performance-sensitive validation process

Do not invent numerical performance budgets without baseline measurements.

For changes touching animation, audio, imports, pitch detection, MIDI, or large songs:

1. record baseline behavior;
2. make the focused change;
3. compare before/after;
4. use representative small and large imported songs;
5. test on target Chromebook hardware where practical;
6. avoid unnecessary allocations/whole-list scans/layout work inside animation/audio loops;
7. document meaningful regressions or tradeoffs.

For Guitar/imported-song work, `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` is the canonical repeatable baseline protocol.

Once repeatable measurements exist, concrete budgets can be added here.

## Browser test guidance

Playwright should protect high-value user paths, not every visual detail.

Good browser-test targets include:

- profile setup/persistence;
- instrument switching;
- opening/closing Hardware & Backup;
- launching/pausing/exiting gameplay;
- count-in cancellation;
- on-screen input scoring;
- target-group behavior;
- song/practice path launch;
- one result panel;
- current-release persistence after reload;
- offline app-shell behavior where feasible.

Future feature work should also add focused browser coverage where practical for guided hardware flow, update-ready/restart UX, Trouble Spot launch, and progress-summary navigation without pretending browser automation proves physical audio/MIDI quality.

Visual readability and audio quality still require human acceptance.
