# Changelog

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
