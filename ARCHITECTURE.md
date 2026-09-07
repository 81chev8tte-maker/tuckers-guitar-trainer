# Family Music Quest — Architecture

This document describes the architecture that exists in the repository. It is descriptive, not aspirational. Future agents should inspect the implementation before changing it and update this document when architecture materially changes.

## Runtime model

Family Music Quest is currently a static browser/PWA application hosted from repository assets. There is no server-side application layer in the current product.

Primary entry/UI files include:

- `index.html` — application shell, instrument chooser, Guitar UI, Piano mount point, Hardware & Backup panel, and script/style loading.
- `app.js` — large Guitar Quest application module and much of the shared top-level Guitar navigation/import/gameplay behavior.
- `piano.js` — Piano Quest application, input hub, gameplay loop, scoring integration, imported MIDI handling, accompaniment and Piano navigation.
- `styles.css` / `piano.css` / `piano-songbook.css` — Guitar/shared and Piano presentation.
- `profiles.js` / `profiles.css` — local player profiles, player switching, per-instrument progress containers and player appearance.
- `diagnostics.js` / `diagnostics.css` / `diagnostics-layer.css` — Hardware & Backup UI, calibration/reporting, backup/restore.
- `hardware-services.js` — shared Web MIDI service.
- `practice-intelligence.js` — shared skill-history and Smart Practice helper logic.
- `practice-tools.js` — shared practice timing/loop helpers.
- `gameplay-rules.js` — deterministic gameplay rules including Piano target grouping and Guitar active-event summary behavior.
- `midi-analysis.js` — imported MIDI learning analysis.
- `piano-lessons.js` — built-in Piano curriculum/song definitions.
- `piano-songbook.js` — built-in Piano Songbook arrangements and arrangement extraction.
- `guitar-songbook.js` — built-in Guitar Songbook arrangements, phrase sections, rights metadata and Guitar-level event data.
- `sw.js` / `manifest.webmanifest` — PWA/offline shell.

## Navigation and top-level UI

The application starts with local profile setup/selection and an instrument chooser. The chooser exposes Guitar Quest, Piano Quest, and Hardware & Backup.

Player profile changes dispatch custom browser events. Instrument switching returns to the chooser rather than navigating to separate routes/pages.

The product is intentionally a single-page browser application, with UI areas shown/hidden rather than a framework router.

## Player profiles and progress

`profiles.js` stores the profile collection in localStorage under a Family Music Quest profile key.

Each profile currently contains separate:

- `guitarProgress`
- `pianoProgress`

The profile service only accepts the current `guitar` and `piano` instrument identifiers.

Imported song libraries are not embedded into each profile. They remain device-local and shared across player profiles.

Profile switching emits lifecycle events so active gameplay can clean up before the next player becomes active.

### Important limitation

The current profile schema is explicitly two-instrument. A future Bass Quest requires an intentional schema/configuration extension; do not assume arbitrary instrument progress is already supported.

## Guitar Quest

### Guitar curriculum and tools

Guitar Quest currently lives primarily in `app.js` and includes:

- beginner mission worlds;
- Learn Tabs/tab-decoder content;
- Note Highway and playable Tab View;
- tuner;
- metronome;
- chord reference;
- microphone/USB-audio input setup and calibration;
- score/accuracy/combo/stars/XP;
- adaptive note density and weak-note coaching;
- imported-song library and playback/practice flow.

The built-in Guitar Songbook is separate from imported files but deliberately launches the existing Guitar song-level engine. Its local event data therefore uses the same Note Highway, Tab View, microphone scoring, count-in, speed, phrase practice, loop, cleanup and result behavior.

### Guitar string model

The current implementation defines six standard Guitar strings with names, numbers, open MIDI pitches and per-string colors.

Several Guitar rendering/scoring paths still contain hard-coded six-string assumptions such as fixed lane counts and reverse string-index math. This is known architectural debt and should be removed incrementally before a future Bass mode.

### Guitar Note Highway

The current Note Highway renders six horizontal string lanes with a vertical strike line. Notes travel right-to-left. Fret/open labels, sustain ribbons, string labels and chord stacks are rendered from imported or lesson events.

Per-string colors are defined and applied in CSS. Real-world testing has shown that dense note blocks can still be visually difficult to distinguish because border/glow/shape styling can overpower color identity. This is a UX issue, not evidence that the string color data is absent.

### Guitar Tab View

The playable tab currently uses a virtualized event-window approach. A window of gameplay events is converted into six tab rows, one cell per event, and the current event is highlighted/scrolled into view.

This was designed to avoid rendering an entire long song at once, but real-world testing has shown that dense imported songs can be difficult to follow. Future work should preserve bounded rendering while improving conventional tab readability, time spacing, measure grouping and playhead behavior.

## Guitar audio/input pipeline

Guitar uses `getUserMedia` through Web Audio with:

- mono input constraints;
- echo cancellation/noise suppression/automatic gain disabled where supported;
- an `AnalyserNode` with a 2,048-sample FFT/time-domain buffer;
- main-thread autocorrelation pitch estimation;
- RMS/noise-gate filtering;
- envelope-based onset detection;
- approximate analysis every 42 ms.

The current detector rejects frequencies below roughly 55 Hz and above roughly 1,300 Hz.

This is important future context: standard bass low E1 is approximately 41.2 Hz, so a future Bass Quest cannot be implemented merely by changing UI/string count. Low-frequency detection and harmonic/octave behavior require deliberate work.

The AudioWorklet path has been investigated but intentionally remains deferred until profiling on target Chromebook hardware establishes a useful baseline.

## Guitar imported-song pipeline

The Guitar library accepts formats including Guitar Pro variants, MusicXML/XML, and text/tab formats supported by the current importer.

For Guitar Pro/MusicXML playback the app uses AlphaTab. Current imported-song flow includes:

- device-local IndexedDB storage;
- score loading;
- playable track selection;
- section/full-song practice generation;
- difficulty/note-density options;
- speed selection;
- A/B looping;
- selected player-track muting;
- synthesized backing instruments;
- AlphaTab tick clock synchronization for song gameplay.

### Important performance/offline constraints

During imported-song gameplay the main thread currently performs several repeated event-list operations for rendering, expiration, tab focus, active-event state, and fret/window decisions while microphone pitch processing also runs on the main thread. Dense imported songs can therefore become performance-sensitive on target Chromebooks.

AlphaTab is currently loaded from jsDelivr and its later soundfont behavior is not fully guaranteed by the app-shell cache. Imported Guitar Pro playback is therefore not yet guaranteed to be completely offline on a fresh install.

## Piano Quest

`piano.js` contains the main Piano experience.

Current Piano functionality includes:

- falling-note gameplay;
- Wait for Me;
- Rhythm play;
- on-screen keyboard;
- microphone input;
- Web MIDI input;
- MIDI import and track analysis;
- song/section selection;
- practice-speed controls;
- A/B looping;
- count-in;
- accompaniment;
- result/progress updates;
- built-in lesson and Songbook integration.

## Piano input model

Piano uses an input-hub contract so on-screen, microphone, and MIDI input can feed the gameplay engine through a common event path.

### Microphone

Piano microphone detection uses a larger 4,096-sample analyser buffer and main-thread autocorrelation with confidence/stability/debounce logic. It is intentionally treated as monophonic. The production thresholds remain conservative; candidate-pitch history is reset when a clean rounded pitch changes or the signal becomes invalid so stale readings from the previous note do not unnecessarily delay the next stable note.

A successful Piano microphone test/selection establishes a session-scoped microphone intent. Actual capture is still released on Mic Test/game/navigation cleanup boundaries; compatible scored single-note practice reacquires the microphone before count-in/restart and shows the active input explicitly. This intent is not a profile/save-schema field, is cleared on profile change, and Listen First/polyphonic material does not auto-start microphone capture.

### Web MIDI

The shared `hardware-services.js` MIDI service exposes Note On/Off, velocity, channel, held notes/polyphony, sustain CC64 and connection state. Piano subscribes to this shared service during MIDI gameplay.

### On-screen keyboard

The on-screen keyboard produces the same note events through the Piano input hub and can therefore exercise polyphonic target logic when interaction supports it.

## Piano scoring

`gameplay-rules.js` provides Piano target grouping.

Notes with the same musical start time form a target group. Required pitches can arrive in any order. A pitch cannot satisfy the same target twice, and the game advances only after the target group is complete.

This behavior protects:

- MIDI chord ordering;
- intervals;
- Hands Together;
- chord-capable imported MIDI;
- Wait/target-group behavior.

Microphone arrangements are intentionally extracted into safe monophonic practice material rather than claiming general chord recognition.

## Piano curriculum and Songbook

`piano-lessons.js` contains the structured built-in curriculum. `piano-songbook.js` contains complete built-in arrangements, public-domain pieces, FMQ originals, phrase boundaries, measures, timing and arrangement-selection logic.

Built-in song data supports explicit musical beat timing and simultaneous events. Practice paths can extract melody, left hand, right hand, or full material where appropriate.

Rights/source research for bundled public-domain pieces is documented in `PUBLIC_DOMAIN_MUSIC.md`.

## Accompaniment and synthesized Piano audio

Piano uses a lightweight browser oscillator synth for app-generated note playback and accompaniment. Accompaniment enable/mute and volume settings are stored in Piano progress; zero volume is treated as a real mute.

Pause/restart/exit cleanup stops active voices and run-owned scheduling.

The current oscillator sound is intentionally lightweight. A larger sample/soundfont system is deferred until correctness and target-device performance are measured.

## Practice intelligence

`practice-intelligence.js` currently provides:

- compact skill-history records;
- exponentially weighted success/timing updates;
- weakest-skill lookup;
- simple run analysis;
- deterministic Smart Practice speed progression across 50–100%;
- three successful repetitions before a speed increase;
- speed reduction after material deterioration.

Guitar also stores/update string/fret-specific skill information after scored active events.

Smart Practice is a foundation rather than a complete autonomous teacher. Future changes should avoid overstating what is currently wired into each gameplay flow.

## Hardware diagnostics and calibration

`diagnostics.js` provides the Hardware & Backup panel.

Current capabilities include:

- production Guitar microphone observation;
- granted device/audio settings;
- input level, detected pitch/note/cents, onset and scoreability status;
- per-player saved microphone calibration record;
- Web MIDI connection and live event diagnostics;
- Note On/Off, velocity, held-note/polyphony and sustain observations;
- local validation report export;
- backup/restore controls.

Calibration currently stores one microphone setup record per player (including the device ID in that record), not a general multi-device calibration catalogue.

## Backup/restore

Current backup format includes:

- profile store and per-profile Guitar/Piano progress;
- calibration records;
- hardware validation results;
- selected instrument preference.

Imported Guitar and Piano song files are intentionally excluded. Restore validation is useful but relatively shallow and is not implemented as a transactional all-or-nothing browser-storage migration.

## Storage

Current browser storage includes:

- localStorage for profiles/progress containers, calibration, hardware results and preferences;
- IndexedDB for imported Guitar song files;
- separate Piano imported-MIDI storage/database.

The exact keys/databases are implementation details and must be inspected before schema work.

## PWA/offline architecture

`sw.js` implements a versioned cache and:

- caches the app shell during installation;
- uses network-first behavior for same-origin requests with cache fallback;
- claims clients on activation;
- deletes older app caches;
- caches external GET resources when requested/available.

CI checks that the service-worker cache/versioned asset references match `package.json`.

Known limitation: AlphaTab and its soundfont dependency chain are not yet guaranteed to be fully available offline on a clean install.

## Automated test architecture

Current automated validation includes:

- deterministic Node tests for practice tools, MIDI analysis/fixtures, practice intelligence, Piano Songbook/curriculum, gameplay rules, UI layering and PWA assets;
- JavaScript syntax checks via `node --check`;
- Playwright Chromium smoke tests for profiles, navigation, Hardware & Backup, Guitar count-in cancellation, Piano Wait/on-screen scoring, pause cleanup, target-group chord order and Piano Songbook practice paths;
- GitHub Actions running those checks on pushes/PRs.

There is currently no bundler production-build command, lint command, or TypeScript/type-check command in `package.json`. Do not document nonexistent commands as requirements.

## Current architectural debt / discrepancies

These are documented rather than silently changed by this governance pass:

1. `app.js` remains large and highly coupled, but its internal release constant is aligned with the package/PWA release as of the v2.6.4 candidate.
2. `app.js` is very large and contains Guitar curriculum, input, rendering, imports, gameplay and UI behavior in one file. Incremental modularization may become appropriate, but a major rewrite is not authorized by this document.
3. Guitar rendering contains hard-coded six-string assumptions that should be generalized before Bass Quest.
4. Guitar Tab View is event-column based and has known readability limitations in dense songs.
5. The v2.6.4 candidate replaces the known frame-sensitive whole-event scans and full-song note DOM materialization with bounded clock windows/indexes; real Chromebook performance acceptance is still required before considering the stutter debt closed.
6. Guitar and Piano pitch analysis are still main-thread CPU work.
7. AlphaTab/soundfont offline completeness is not guaranteed.
8. Backup excludes imported song blobs and restore is not transactional.
9. Profile progress schema is currently explicitly Guitar/Piano rather than arbitrary instrument configuration.

## Conceptual architecture direction

Architecture may evolve toward clearer modules (for example Guitar rendering/input/import separation and a shared configurable string-instrument foundation), but future agents must earn that change through focused release goals, regression coverage, and real performance/usability evidence. This document does not authorize a broad rewrite.
