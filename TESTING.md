# Family Music Quest — Testing

This document defines the minimum testing expectations for future releases. It must stay aligned with the actual repository scripts and test files.

For the current behavior-by-behavior coverage audit and prioritized automated gaps, see `TEST_DEBT_AUDIT.md`. Do not infer that a requirement is automated merely because it appears in a checklist here.

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

## v2.6.16 / #43 + #44 guided-session regression

`guided-hardware-acceptance.test.js` protects the Middle C/D4–G4/repeated-C4 prompt metadata, exact MIDI mapping, completed-path enumeration, and truthful not-performed rules. `browser-tests/quick-hardware-tests.spec.js` runs synthetic production-path evidence in both Guitar→Piano and Piano→Guitar order, adds MIDI, saves/reviews human evidence, compares consolidated report state, and verifies the explicit new-session reset. These tests do not claim physical key clarity, microphone/MIDI acceptance, ChromeOS behavior, or human provenance truthfulness beyond the data entered; use the v2.6.16 checklist in `HARDWARE_VALIDATION.md`.

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

CI is an automated validation gate, not the physical-acceptance gate. When an approved GitHub Issue/work package requires real hardware acceptance, its operational Issue status should remain **`status:needs-hardware-test`** after implementation/CI until the required physical evidence is recorded and the Project Manager decides pass/fail. The GitHub Project should mirror Needs Hardware Test when practical.

A merged PR or green CI must not auto-close a hardware-dependent Issue when real-hardware acceptance is still outstanding.

## Feature-specific acceptance references

Some product requirements need dedicated acceptance protocols beyond this general testing document. When a release touches these areas, use the corresponding durable spec:

- Guitar/imported-song performance and Full Song scale: `CHROMEBOOK_PERFORMANCE_BENCHMARK.md`
- latency/timing compensation: `LATENCY_CALIBRATION_SPEC.md`
- guided hardware/input setup: `HARDWARE_SETUP_WIZARD_SPEC.md`
- guided hardware acceptance report: `HARDWARE_VALIDATION.md` and `MONDAY_HARDWARE_TEST_PLAN.md`
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
- Piano microphone input intent/reacquisition across Mic Test, scored-run start, Restart/Play Again and lifecycle cleanup;
- detector transition gating so stale pitch history does not delay a clean new note while quiet/unstable/low-confidence candidates remain non-scoreable;
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
- active-practice Screen Wake Lock request/release, visibility restoration and unsupported/denied graceful behavior;
- browser navigation between instruments;
- offline app-shell behavior.

Relevant current files include:

- `practice-intelligence.test.js`
- `ui-layering.test.js`
- `pwa-assets.test.js`
- `browser-tests/app-smoke.spec.js`

The permanent matrix describes behavior that should be protected over time. The actual current coverage status is recorded in `TEST_DEBT_AUDIT.md`; several items above remain partial, manual-only or missing today.

## v2.6.15 / #40 fundamental-selection regression

`piano-fundamental.test.js` executes the production input-class prefix of `piano.js` in a Node VM, without copying/reimplementing the detector. Original generated signals cover 44.1/48 kHz, C3/C4 and D/E/F/G controls, pure/rich/dominant-second-harmonic timbres, the entire C3–B5 range, amplitude variation and cents. Production `tick()` streams verify RMS, three-frame stability, transitions and debounce; silence, quiet, seeded noise, low confidence and off-centre pitches remain non-scoreable. A genuine F1 control protects against a blacklist fix.

The browser microphone suite also feeds generated C3/C4 through the production detector and input hub into actual Wait for Me scoring; wrong D3/D4 must remain wrong. Existing #29 lifecycle, screen-key and MIDI provider tests stay required. `test-support/piano-signals.js` contains generated FMQ material only.

For physical acceptance use the focused Tucker checklist in `HARDWARE_VALIDATION.md`. The in-app Quick Piano guide does not include C3 and cannot replace that retest.

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

### Test-debt rule

When a historical bug is fixed and a stable automated reproduction is practical, add a regression test. Do not fake confidence with a weak test that only searches source code for a CSS property or function name when the actual failure was behavioral.

Use `TEST_DEBT_AUDIT.md` to distinguish high-value automatable gaps from requirements that should remain physical/manual acceptance.

## Manual acceptance testing

Automated tests cannot replace real hardware and child usability checks.

When a GitHub Issue exists for a hardware-dependent change, attach/comment/reference the relevant report/session/evidence there and keep the Issue at **`status:needs-hardware-test`** until the Project Manager closes the gate. Keep the Project board mirror in Needs Hardware Test when practical. Do not auto-close such an Issue solely from a merged PR or green CI.

### Guitar checklist

For v2.6.8 and later acceptance sessions, run the in-app Guided Hardware Test first when practical, copy/share/download its report, then complete the physical checks below. The report does not automatically approve latency, audio smoothness or child usability.

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
- [ ] Copy Project Report produces a concise paste-ready summary;
- [ ] Share Test Report opens the physical Chromebook share sheet where supported, while cancel/error leaves evidence intact;
- [ ] Download JSON works and unsupported file sharing falls back to the same JSON download;
- [ ] backup export works;
- [ ] restore works with a current supported backup;
- [ ] current-release progress survives normal reload;
- [ ] installed/offline PWA launches as expected;
- [ ] version update does not leave obviously stale core assets;
- [ ] major navigation fits target Chromebook viewport.

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

For Guitar Full Song/imported-song performance, follow `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` rather than substituting CI browser timing for target-device acceptance.

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
- hardware-report share/download fallback behavior using browser mocks (without claiming native ChromeOS destinations work);
- offline app-shell behavior where feasible.

Visual readability and audio quality still require human acceptance.
