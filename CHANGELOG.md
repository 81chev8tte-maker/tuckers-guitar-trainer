# Changelog

## v2.6.7 — Guided Hardware Acceptance Test

- Added a child-friendly `Run Hardware Test` flow inside Hardware & Backup while preserving Advanced Diagnostics.
- Reused the production Guitar audio service for a measurement-only quiet baseline, all six open strings, repeated-note onset observation and a final silence/noise observation.
- Reused the shared Web MIDI service for guided Note On/Off, velocity, polyphony and optional sustain capability checks.
- Added five clearly labeled human-observation questions for reaction, delay, smoothness, readability and willingness to keep playing.
- Extended the existing local Hardware Validation report with FMQ version, guided measurements, retries, MIDI observations, warnings, tests not performed and human observations; Copy Report and Export JSON remain local-only.
- Did not change production scoring, pitch/onset thresholds, noise gates, Highway behavior, AlphaTab behavior, profile/save schemas or MIDI-service semantics.
- Added deterministic rule tests and a mocked browser regression for the guided flow/report while keeping real Chromebook/instrument acceptance manual.
- Advanced package/app/PWA asset and service-worker versioning to v2.6.7.

## v2.6.6 — Guitar Highway UI Cleanup

- Centered the fret/OPEN value both horizontally and vertically inside moving Highway blocks.
- Increased fret-number size while keeping two-digit frets and OPEN readable inside the existing note block.
- Prevented technique labels from shifting the primary fret value off-center.
- Removed 1–6 ordinals from permanent string labels; the edge strings retain simple thin/thick cues.
- Moved the PLAY NOW badge toward the top of the strike line so it no longer competes with notes at the hit point.
- Preserved the v2.6.4 bounded rendering/performance work and all v2.6.5 note/chord simplification.
- Added browser assertions for actual rendered fret centering/size and simplified string labels.
- Advanced package/app/PWA asset and service-worker versioning to v2.6.6.

## v2.6.5 — Guitar Highway Readability Correction

- Simplified moving Highway notes so string color identifies the string and the fret/OPEN value is the dominant visible information.
- Removed redundant E6/A5/D4-style string-number labels from moving note blocks.
- Simplified NEXT/NEXT NOTE cues to use plain string labels and frets without MIDI pitch-name clutter.
- Made multi-string shapes read like a compact tab cue (for example D 11 · A 11 · E 9).
- Reduced pending-note border/glow clutter while preserving hit/miss/demo feedback states.
- Preserved all v2.6.4 bounded rendering/indexing/performance work; the known imported Full Song stutter was reported gone on the original Chromebook stress song before this visual-only correction.
- Advanced package/app/PWA asset and service-worker versioning to v2.6.5.

## v2.6.4 — Guitar Player & String Engine Polish (release candidate)

- Reworked Guitar gameplay rendering to materialize only the bounded visible clock window instead of creating note DOM for an entire imported Full Song.
- Replaced repeated frame/input whole-song scans with clock indexes and pending/expiry pointers while preserving Guitar scoring thresholds and skipped-note rules.
- Rebuilt playable Tab View as a bounded, time-spaced staff with a stable NOW playhead, aligned chord notes, measure markers and no per-note smooth scrolling.
- Strengthened per-string identity and fret/OPEN readability on Highway notes and added compact chord-shape cues.
- Added collapsed performance diagnostics for frame timing, rendered/event counts, Tab window size, pitch-analysis cost/rate and AlphaTab tick freshness, plus a diagnosis-only input-analysis bypass.
- Removed fixed-six geometry from the touched renderer paths and generalized imported tuning/string helpers while continuing to expose only six-string Guitar tracks in this release.
- Added a 2,000-event synthetic browser regression proving Highway and Tab DOM remain bounded.
- Advanced package/app/PWA asset and service-worker cache versioning to v2.6.4.
- Physical Dell Chromebook 3100 audio/readability acceptance remains required before declaring the Full Song stutter blocker resolved.

## v2.6.3 — Musical Feel & Guitar Songbook

- Set natural authored 100% tempos for all built-in Piano pieces while retaining relative 50–100% practice speeds.
- Added deterministic Piano velocity/articulation metadata, quieter accompaniment, phrase-opening emphasis and an effective-BPM readout.
- Added an offline five-piece Guitar Songbook with independently authored FMQ arrangements of verified public-domain music.
- Added full-song and phrase practice, 50–100% speed choice, Note Highway and Tab View entry points for built-in Guitar songs.
- Added shared `MUSIC_SOURCES.md`, Guitar content validation and a Guitar Songbook browser smoke test.
- Advanced package, asset and service-worker cache versions to v2.6.3.

Meaningful Family Music Quest release summaries belong here. Keep entries focused on user-visible behavior, important correctness fixes, testing, and known limitations rather than reproducing every commit.

Do not fabricate historical details. Older history remains available in Git and the existing README release notes; migrate older entries here only when the information can be verified.

## Unreleased

### Project governance and agent-development framework

- Added permanent product specification and non-negotiable behavior in `PROJECT.md`.
- Added current architecture and known architectural debt in `ARCHITECTURE.md`.
- Added permanent automated/manual testing expectations in `TESTING.md`.
- Added focused agent-driven release process and Definition of Done in `RELEASE_PROCESS.md`.
- Added living product roadmap in `ROADMAP.md`.
- Added durable product/architecture decision log in `DECISIONS.md`.
- Added repository-level agent instructions in `AGENTS.md`.
- Added classified technical/test debt register in `TECHNICAL_DEBT.md`.
- No intentional functional gameplay change is part of this documentation pass.

## 2.6.2 — Songbook Quality & Complete Music

Verified from the repository's existing release documentation:

- completed the bundled Twinkle, Frère Jacques and Row, Row, Row Your Boat melodies;
- labeled Jingle Bells as a complete refrain and Ode to Joy as a complete principal theme rather than overstating the included material;
- rewrote the six Level 7 FMQ originals with explicit musical sections and written endings;
- added structural/song-manifest regression validation;
- retained monophonic microphone Melody Practice while MIDI/on-screen Hands Together preserves polyphony;
- maintained public-domain source/rights documentation and manual musical-review requirements.

## 2.6.1 — Gameplay Correctness & Stability

Verified from the repository's existing release documentation/tests:

- made Piano simultaneous target groups order-independent for MIDI Note On arrival;
- preserved imported MIDI polyphony for MIDI/on-screen-capable play while keeping microphone practice safe;
- excluded intentionally skipped Guitar events from final accuracy/coaching/stars/skill history;
- fixed Piano accompaniment mute/zero volume and pause/cleanup of active voices;
- made Guitar count-in cancellable;
- moved built-in Piano practice sections to phrase/measure boundaries;
- aligned core PWA versioned assets;
- expanded Playwright browser regression coverage.

## 2.6.0 — Piano Songbook & Real Music

Verified from existing repository release documentation:

- fixed Hardware & Backup layering so it opens above the instrument chooser;
- added built-in offline Piano Songbook arrangements of verified public-domain music;
- added explicit beat timing and simultaneous-note support to built-in arrangements;
- added Listen First and supported melody/hand/full-arrangement practice paths;
- retained microphone-safe monophonic learner parts while MIDI/on-screen play can use simultaneous notes;
- documented public-domain source and rights research.

## 2.5.0 — Piano Curriculum v2

Verified from existing repository release documentation:

- separated quick exercises, mini-songs, full songs and checkpoints;
- expanded the Piano curriculum with phrase/measure/skill/hand/finger metadata;
- added Listen First and assistance levels;
- added deterministic curriculum validation;
- retained conservative microphone compatibility.

## 2.4.0 — Hardware & Practice Intelligence Foundation

Verified from existing repository release documentation:

- added production Guitar microphone diagnostics;
- added shared Web MIDI service and live MIDI diagnostics;
- added per-player calibration/hardware reports;
- added versioned profile/progress backup/restore (imported song files excluded);
- added rolling skill-history and deterministic Smart Practice helper logic;
- added GitHub Actions regression CI and hardware validation documentation;
- retained the current analyser-based pitch detectors after AudioWorklet investigation.

## Maintaining this file

For future releases include, where relevant:

- release version/name;
- primary goal;
- important fixes/features;
- regression behavior preserved;
- tests/CI performed;
- PWA/cache changes;
- save/schema changes;
- notable limitations/manual testing still required.
