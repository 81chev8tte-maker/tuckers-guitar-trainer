# Family Music Quest — Living Roadmap

This roadmap is a planning aid, not a promise. It should be updated when real-world testing changes priorities. Do not invent release dates.

## Roadmap vs GitHub execution

This file remains the durable roadmap and priority source of truth. GitHub Issues/Project track concrete execution work; they do not replace this roadmap.

- Keep ideas, later directions, and staged product plans here or in the relevant durable specification until they become actionable.
- Create Issues for concrete work packages, reproducible findings, or explicit acceptance tasks when they are ready for prioritization.
- Do not mirror every roadmap/backlog item into Issues.
- An Issue with `status:backlog` is not approved implementation scope. `status:ready` means the Project Manager has approved that work package.
- Hardware-dependent work may remain `status:needs-hardware-test` after implementation/CI until physical acceptance evidence clears the gate.
- The GitHub Project remains the visual planning view and should mirror the Issue's operational `status:*` label when practical.

## Durable roadmap specifications

Several later roadmap items now have dedicated planning/source-of-truth documents. Future agents should use these instead of rebuilding requirements from old prompts or chat history:

- Guitar/imported-song performance validation: `CHROMEBOOK_PERFORMANCE_BENCHMARK.md`
- Monday real-hardware acceptance session: `MONDAY_HARDWARE_TEST_PLAN.md`
- accessibility/readability direction: `ACCESSIBILITY_READABILITY_SPEC.md`
- Bass architecture/foundation: `BASS_QUEST_SPEC.md`
- Bass curriculum/content/Drum Lock: `BASS_CURRICULUM_PLAN.md`
- input/backing/visual/MIDI timing calibration: `LATENCY_CALIBRATION_SPEC.md`
- guided child/parent hardware setup: `HARDWARE_SETUP_WIZARD_SPEC.md`
- automatic weak-section practice: `TROUBLE_SPOT_PRACTICE_SPEC.md`
- PWA/offline/update reliability: `PWA_OFFLINE_UPDATE_SPEC.md`
- parent/teacher progress reporting: `PARENT_TEACHER_PROGRESS_SPEC.md`
- built-in music authoring/validation pipeline: `SONG_AUTHORING_PIPELINE_SPEC.md`
- incremental Guitar/string-player modularization: `INCREMENTAL_MODULARIZATION_PLAN.md`
- interrupted-session recovery: `SESSION_RECOVERY_SPEC.md`
- legal deterministic import/player fixtures: `TEST_FIXTURE_STRATEGY.md`

These documents define intended direction and acceptance constraints; they do not move an item into immediate release scope by themselves.

## Long-term product filter

After current acceptance/stability gates are satisfied, later roadmap choices should be evaluated against FMQ's long-term goal of becoming a highly effective, child-friendly interactive music teacher/game rather than only a note-scoring application.

Prefer work that strengthens the learning loop:

> teach → demonstrate → try → listen → understandable feedback → identify weakness → focused practice → reduce assistance → complete performance → track improvement

This filter should help prioritize later work such as Guided Hardware Setup, latency calibration, Trouble Spot Practice, progressive hints/assistance, stronger skill-based recommendations, parent/helper progress summaries, curriculum refinement, song/content authoring tools, and richer instrument-specific learning mechanics.

Shared infrastructure should support distinct Guitar, Piano, and future Bass learning identities rather than flattening them into one identical experience. Competitor products may be studied for useful concepts, but feature parity is not a roadmap objective.

**This long-term direction does not change the current NOW/NEXT sequence.** The Chromebook hardware/child-usability acceptance gate tracked by Issue #22 remains the active product gate; foundational blockers still outrank expansion; Bass staging remains contingent on that gate clearing.

## NOW

### Complete Chromebook hardware & child-usability acceptance on the current deployed baseline

The guided hardware/report-sharing foundation originated in v2.6.7/v2.6.8. Subsequent focused maintenance releases corrected two physical-test blockers: v2.6.9 fixed Piano falling-note readability (#23), and v2.6.10 fixed startup/player-safety behavior (#26). Both have now been physically accepted and are Done.

Issue #22 remains the broader acceptance gate. Physical testing should use the latest deployed maintenance baseline rather than an older historical release number. v2.6.11 addresses the newly observed Piano microphone input-state/response blocker in Issue #29, but remains subject to real Dell Chromebook microphone acceptance before that blocker is considered cleared.

Issue #30 shipped technically in v2.6.12 and remains subject to real Dell Chromebook wake-lock acceptance. Issue #31 is the focused v2.6.13 child-friendly parent-report-transfer maintenance release and likewise requires physical ChromeOS/Gmail verification after deployment. Its separate manual-evidence-fidelity concern is tracked in Backlog Issue #34. Issue #24 remains a separate, non-blocking Backlog reporting issue about distinguishing an enumerated virtual/system MIDI endpoint from a verified playable keyboard. Neither #24/#34 nor Bass work is included in this maintenance sequence.

Primary acceptance goals remain:

- run Hardware & Backup → Run Hardware Test where practical, record human evidence, Copy Project Report, and transfer the JSON by native share or download fallback;
- run the complex local imported Guitar Pro Full Song with backing and normal input analysis at 100%;
- compare Full Song Highway and Tab View against a short imported section and a built-in Guitar Songbook control;
- verify that severe scale-dependent audio stutter/lag is gone or materially isolated with the existing diagnostics;
- verify Tab View is musically followable with the stable playhead/time spacing;
- verify per-string identity, fret numbers, OPEN notes and dense chord cues are readable at normal playing distance;
- verify microphone/USB Guitar scoring still behaves normally;
- verify pause/resume, count-in cancellation, loops, backing mute/volume and cleanup remain correct;
- complete Piano smoke/hardware and child-usability checks on the current deployed baseline;
- verify profile/current-version progress and installed-PWA behavior on the Chromebook;
- collect the remaining child/hardware evidence and let the Project Manager record final PASS/BLOCKER for #22.

Use `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` and `MONDAY_HARDWARE_TEST_PLAN.md` for the underlying physical protocols rather than relying on memory or desktop-only testing. Historical v2.6.8 wording in those documents may describe the release that introduced the guided reporting flow; current acceptance should still run against the latest deployed maintenance baseline.

Automated validation cannot approve audible stutter, perceived latency, musical followability, child usability or real physical-input behavior.

## NEXT — choose from hardware evidence

### If Issue #22 still has a blocker: focused follow-up

If current hardware/child-usability testing finds a reproducible blocker such as scoring/input regression, unusable Tab/Highway readability, save/profile failure, renewed Full Song stutter or serious Piano regression, do another focused maintenance release before expansion.

Use the existing diagnostics and exact reproduction matrix to isolate the remaining cause. Do not compensate by weakening scoring, disabling normal backing/input, hiding required events or doing a broad architecture rewrite.

### If Issue #22 clears the current gameplay/hardware gate: Bass Quest foundation

If the Guitar/Piano player and real hardware are stable on the target Chromebook and no major regression remains, the next major expansion may begin from `BASS_QUEST_SPEC.md` and `BASS_CURRICULUM_PLAN.md`.

Bass Quest must not be implemented as "Guitar with four strings" and should reuse shared string-player mechanics only where musically appropriate.

Preferred direction:

- generalize the existing string-instrument configuration rather than duplicating Guitar into another codebase;
- initial 4-string electric bass configuration;
- standard tuning E1-A1-D2-G2;
- dedicated Bass curriculum, labels, progress and technique content;
- reuse Note Highway/Tab/player/import systems where musically appropriate;
- identify/import real bass tracks from Guitar Pro/MusicXML when possible;
- separate Bass progress/skill history from Guitar progress;
- Bass-oriented tools such as root, fifth, octave, groove, muting and fingerstyle guidance.

#### Known Bass input blocker

Current Guitar pitch detection intentionally still rejects frequencies below roughly **55 Hz**. Standard Bass low E1 is approximately **41.2 Hz**.

Bass therefore requires deliberate work on:

- lower-frequency analysis range;
- analyser/window configuration;
- latency impact;
- strong-harmonic/octave errors (for example E1 mistaken for E2);
- fundamental selection/stability;
- microphone vs direct USB-interface behavior;
- real Chromebook performance.

Do not "fix" this by changing one cutoff constant without detector benchmarks and physical hardware validation.

### Bass release staging

A likely staged approach:

1. shared string-engine/Bass UI foundation;
2. Bass input/tuner/calibration/import support;
3. Bass beginner curriculum and Smart Practice integration;
4. physical hardware validation and polish.

The exact Bass release numbers should be chosen only after Issue #22 closes the current Chromebook hardware/child-usability gate.

## LATER — Reliability and learning-system improvements

### Input/latency calibration

Add deliberate per-input timing calibration when measurements justify it. Distinguish input latency from visual/backing synchronization offset. Follow `LATENCY_CALIBRATION_SPEC.md`.

Potential needs:

- USB/direct Guitar input timing offset;
- microphone timing characteristics;
- MIDI timing offset;
- visual/backing playback offset;
- saved calibration tied to appropriate device identity.

### Guided hardware setup

Evolve Hardware & Backup from a technical monitor toward an optional guided validation flow. Follow `HARDWARE_SETUP_WIZARD_SPEC.md`.

- choose input;
- play expected strings/notes;
- measure level/noise;
- verify pitch/onset;
- report pass/fail clearly;
- preserve advanced raw diagnostics for troubleshooting.

### Automatic trouble-spot practice

Use existing phrase/measure and skill-history data to offer one-click practice around the worst section after a run. Follow `TROUBLE_SPOT_PRACTICE_SPEC.md`.

Example outcome:

> Practice Phrase B at 70%

rather than requiring a child to manually identify and set A/B points.

### Performance baselines/budgets

Use the v2.6.4 instrumentation to record repeatable baseline measurements on the target Chromebook and turn meaningful ones into real budgets. Do not invent numbers before measurement. Use `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` as the baseline protocol for Guitar/imported-song work.

### PWA update UX

Replace "refresh/reopen until the service worker updates" with a clear child/parent-facing update-ready/restart flow when practical. Follow `PWA_OFFLINE_UPDATE_SPEC.md`.

### More dependable offline Guitar playback

Either bundle required AlphaTab playback assets locally or provide a deliberate offline-asset download path with clear status. Follow `PWA_OFFLINE_UPDATE_SPEC.md` and verify actual offline behavior before claiming completeness.

### Parent / teacher progress summary

Provide a concise local-first view of practice consistency, curriculum progress, song improvement, sufficiently sampled weak skills, Smart Practice state and future Trouble Spot progress. Follow `PARENT_TEACHER_PROGRESS_SPEC.md`. Do not add cloud monitoring or invasive telemetry as part of the first implementation.

### Song authoring / validation pipeline

Move toward a shared authoring/validation layer with instrument-specific runtime adapters rather than forcing Guitar, Piano and Bass into one identical runtime shape. Follow `SONG_AUTHORING_PIPELINE_SPEC.md`. Migrate content incrementally; do not rewrite all current Songbook/curriculum data at once.

### Session recovery

Add safe local recovery for interrupted practice only when a focused reliability release justifies it. Follow `SESSION_RECOVERY_SPEC.md`; never turn an unfinished recovered run into fake completion/mastery.

### Modularization

Incrementally reduce oversized-file coupling (especially Guitar `app.js`) when focused releases naturally touch those boundaries. Follow `INCREMENTAL_MODULARIZATION_PLAN.md` and avoid a rewrite-for-cleanliness project.

## BACKLOG / IDEAS

Ideas are not approved scope merely because they appear here.

- more public-domain Guitar/Piano/Bass arrangements;
- richer original lesson music/grooves;
- compact local Piano sample set after performance/bundle-size measurement;
- deeper Guitar/Bass technique instruction;
- technique recognition only where reliable enough to validate honestly;
- accessibility options such as stronger contrast, color-blind-safe cues, larger labels and reduced effects;
- richer imported-song section/phrase analysis;
- optional full backup including imported song files with size warnings;
- transactional restore/stronger backup validation;
- cloud sync someday if the product actually needs it;
- additional instruments only after the shared foundations justify them;
- family challenges if they support learning rather than distracting from it;
- AudioWorklet experiments for measured input/performance problems while retaining safe fallback behavior.

## Explicitly not planned

### Duet mode

A synchronized Guitar/Piano duet mode is not currently needed and should not be treated as roadmap scope unless the product owner explicitly reopens the idea.

## Roadmap rule

When real-world testing reveals scoring errors, audio dropouts, unreadable gameplay, save corruption, hardware failure, or serious Chromebook-performance problems, those issues outrank new instrument/content expansion.
