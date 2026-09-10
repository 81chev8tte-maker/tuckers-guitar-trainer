# Changelog

## v2.6.16 — Hardware Test Workflow Reliability

- Refs #43 and #44. Quick Hardware Tests now accumulate completed Guitar microphone, Piano microphone, and MIDI paths under one retained session ID instead of silently resetting after the first saved report.
- Added a visible **Test Another Input** continuation and an explicit, confirmed **Start New Test Session** reset. Chooser cards retain completion status and the consolidated Project Report/JSON recomputes genuinely unperformed guided paths.
- Reloaded prior session-level human answers/evidence for deliberate review after another subtest. Structured provenance preserves the first recorded time, records the latest human review time, and states which completed guided paths the evidence covers.
- Made the Piano guide physically explicit: Middle C is identified by the nearby two-black-key group, D4–G4 remain anchored to that area, and the final prompt requests the same Middle C again. Expected notes and MIDI values remain C4/D4/E4/F4/G4/C4 and 60/62/64/65/67/60.
- Added deterministic and browser coverage for both Guitar→Piano and Piano→Guitar accumulation, adding MIDI, consolidated report/not-performed logic, human provenance, explicit reset, and prompt-to-MIDI agreement.
- Aligned package/app/report/PWA assets and cache to v2.6.16. No detector, scoring, threshold, hardware-input, save/profile, wake-lock, or report-transfer behavior changed; physical Chromebook acceptance remains required.

## v2.6.15 — Piano Microphone Fundamental Selection Reliability

- Refs #40. Generated production-detector tests reproduced stable low subharmonics, including C3 → F1 at +3 cents and C4 → F1 at +6 cents. The original 80-case matrix failed 56 cases.
- Corrected only autocorrelation lag selection: choose the earliest near-equal local peak using interpolated peak height, then interpolate its lag. Confidence remains the selected measured correlation; frequencies/cents are not snapped to a target.
- Preserved C3–B5 support, monophonic input, RMS/confidence/cents gates, three stability frames, 330 ms debounce, 85 ms analysis cadence and 4096 samples. No #29 lifecycle, scoring, save, MIDI, Guitar or report-transfer behavior changed.
- Added deterministic fundamental/range/harmonic/noise/transition coverage and a browser regression proving generated C3/C4 score while wrong D notes remain wrong.
- Aligned package/app/report/PWA assets and cache to v2.6.15. #40 remains open for Tucker’s physical Dell Chromebook + electronic-keyboard-speaker → internal-microphone retest; automation is not physical acceptance.

## v2.6.14 — Child Self-Guided Hardware Tests

- Renamed the child-facing guided entry to **Quick Hardware Tests** with obvious Guitar microphone, Piano microphone and MIDI keyboard choices.
- Reused the existing guided Guitar and MIDI paths without changing detector/scoring behavior.
- Added a guided monophonic Piano microphone check using the production Piano microphone detector: quiet baseline, C4–D4–E4–F4–G4 and repeated C4 with plain retry feedback.
- Added structured guided Piano microphone evidence to the existing Hardware Validation session/report, so a completed guided check is no longer reported as unperformed while gameplay/perceived-response acceptance remains explicitly manual.
- Made the existing five child questions follow successful real quick tests and made the existing v2.6.13 **Send Report to Parent** flow the obvious completion action.
- No scoring windows, microphone thresholds, save schema, #24/#34 behavior, USB Guitar behavior, Bass work, or full Hardware Setup Wizard were added.
- Physical Dell Chromebook microphone/child-usability/wake-lock/Gmail acceptance remains required.

## v2.6.13 — Child-Friendly Parent Report Transfer

- Replaced the technical `Share Test Report` action with a child-readable `Send Report to Parent` flow using the native Web Share API.
- Preferred payload shares the existing structured Hardware Validation JSON plus a readable text companion; the full Project Report is also supplied as share text.
- The text companion includes the structured JSON after the readable report so evidence remains recoverable when a platform cannot attach the `.json` file separately.
- Added capability-based narrower native-share fallbacks, neutral cancellation/error handling, and preserved Copy Project Report / Download JSON fallbacks.
- Split manual-evidence fidelity to #34 rather than widening this release. Native ChromeOS/Gmail behavior still requires physical Dell Chromebook verification.

## v2.6.12 — Active Practice Screen Wake Lock

- Added a standards-based Screen Wake Lock lifecycle through the existing shared hardware-services layer so active Guitar gameplay/count-in, active Piano gameplay/Wait-for-Me/listening, and active Guided Hardware Test tasks can keep the Chromebook display awake without synthetic activity.
- Reused existing Guitar `.playing`, Piano game visibility and guided-test task state rather than adding a competing gameplay/session stack.
- Releases the lock when active practice/test state ends and handles background visibility, browser/system release, unsupported API and request rejection without changing gameplay.
- Added deterministic wake-lock lifecycle coverage plus Playwright integration checks for Guitar, Piano and Guided Hardware Test activation/cleanup.
- Advanced package/app/PWA/report/cache versioning to v2.6.12. Physical Dell Chromebook dim/sleep acceptance remains required for Issue #30.

## v2.6.11 — Piano Microphone Practice Reliability

- Preserved a deliberate/validated Piano microphone choice as a session-scoped input intent and reacquired microphone capture before compatible scored single-note runs, Restart and Play Again instead of silently reverting to screen-key-only input.
- Kept capture lifecycle-safe: leaving Mic Test/gameplay stops the actual microphone stream, profile change clears the intent, and Listen First/polyphonic material does not auto-start microphone capture.
- Made the active/fallback input explicit before count-in and on microphone acquisition failure while retaining screen-key and Web MIDI paths.
- Corrected detector transition smoothing by resetting candidate history when a clean rounded pitch changes or the signal becomes invalid, while retaining the existing 85 ms analysis cadence, RMS/confidence/cents gates, three-frame stability requirement and duplicate debounce.
- Added browser regressions for microphone intent/reacquisition/cleanup/fallback, detector transition gating, quiet/low-confidence non-emission, wrong-note rejection, screen input and MIDI provider behavior.
- Advanced package/app/PWA asset and service-worker versioning to v2.6.11. Real Dell Chromebook microphone responsiveness and child usability remain physical acceptance requirements for Issue #29.

## v2.6.10 — Startup Home & Player Safety Fix

- Fixed startup navigation so an existing active profile cold-launches/reloads at the Family Music Quest instrument chooser instead of automatically reopening the last Guitar or Piano destination.
- Kept first-run Who's Playing? setup intact and made the chooser the explicit startup home with the active player identity and player-switch control visible before instrument selection.
- Reused the existing Guitar/Piano Home lifecycle cleanup when returning to Instruments; no scoring, input, timing, import, Songbook or profile-save schema behavior changed.
- Added Playwright coverage for fresh setup, two-profile switching, persisted progress isolation, Guitar/Piano entry, Home cleanup, reload/new-page startup and rejection of last-instrument auto-resume.
- Advanced package/app/PWA asset and service-worker versioning to v2.6.10. Physical installed-PWA relaunch acceptance on the Dell Chromebook remains required before Issue #26 is closed.

## v2.6.9 — Piano Falling-Note Readability Fix

- Fixed a Dell Chromebook child-readability regression where shared Guitar `.falling-note` CSS left Piano targets with a transparent body and dark pitch text while the white border dominated the cue.
- Scoped the Guitar v2.6.4 falling-note override to the Guitar note layer and added Piano-scoped high-contrast pitch text so right/left-hand targets retain their intended fills without broad new `!important` overrides.
- Preserved Piano scoring, input, timing, lanes, hand cues, Wait for Me, Rhythm and Listen First behavior, and preserved the current Guitar Highway presentation.
- Added a Playwright computed-style regression that reproduces the v2.6.8 cascade failure and protects the corrected Piano target presentation.
- Advanced package/app/PWA asset and service-worker versioning to v2.6.9. Physical Dell Chromebook visual acceptance remains required before Issue #23 is closed.

## v2.6.8 — Hardware Report Sharing & Human Evidence

- Reworked the Hardware Validation Report into three primary actions: **Copy Project Report**, **Share Test Report**, and **Download JSON**.
- Added a compact paste-ready Project Report summarizing version/session/device inputs, guided Guitar/MIDI results, human observations, warnings, tests not performed, evidence labels and an explicit adult PASS/BLOCKER/NOT DECIDED decision.
- Added local session IDs plus lightweight adult-help, scoring-trust, child-comment, tester-context and evidence-reference fields without changing gameplay/profile/scoring schemas.
- Added native Web Share file transfer for the same structured JSON used by Download JSON; unsupported file sharing falls back to local download, share cancellation preserves evidence without downloading, and unexpected share errors keep manual download available.
- Kept report transfer local-first: no backend, accounts, telemetry, API keys, automatic uploads or stored media were added.
- Added deterministic and Playwright coverage for report metadata, Project Report formatting, file-share success/fallback/cancel/error paths and JSON-source consistency.
- Advanced package/app/PWA asset and service-worker versioning to v2.6.8. Actual ChromeOS native-share/Quick Share behavior remains a physical Monday check.

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
