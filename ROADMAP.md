# Family Music Quest — Living Roadmap

This roadmap is a planning aid, not a promise. It should be updated when real-world testing changes priorities. Do not invent release dates.

## NOW

### Finish the current focused Piano/Guitar work

The currently planned/in-progress direction is musical-feel polish plus the first Guitar Songbook/public-domain content pass.

Important goals include:

- natural 100% performance tempos for built-in Piano songs;
- better Piano dynamics/articulation/phrasing without a major audio-engine rewrite;
- preserving all v2.6.1/v2.6.2 scoring/correctness fixes;
- establishing a small, high-quality Guitar Songbook from verified public-domain compositions with independently authored FMQ Guitar arrangements;
- keeping rights/source documentation current.

The repository main branch may lag the active agent pass until that release is merged.

## NEXT

### Guitar Player & String Engine Polish

Real-world Chromebook testing has exposed foundational Guitar-player issues that should be addressed before major expansion.

Priority areas:

- **Tab View usability** — replace or improve the current dense event-cell experience while retaining bounded/virtualized rendering;
- **Note Highway readability** — make string identity unmistakable on the note itself, not only in lane/label styling;
- **dense chord readability** — compact and readable next-shape cues;
- **imported-song playback performance** — investigate audible glitching/stutter under real Guitar Pro playback;
- **performance diagnostics** — measure frame time/FPS, active/visible event counts, pitch-analysis cost and useful playback-drift indicators;
- **animation-loop efficiency** — reduce unnecessary repeated whole-song filtering/scanning/allocation in frame-sensitive code where profiling justifies it;
- **tab focus behavior** — avoid expensive or visually distracting per-note smooth scrolling;
- **string-engine readiness** — remove obvious hard-coded six-string assumptions only where needed, without changing Guitar behavior;
- **offline Guitar playback planning** — document/decide how AlphaTab/soundfont assets should be made dependable for installed-PWA use.

Acceptance should include the actual target Chromebook and both a simple built-in song and a complex imported Guitar Pro song.

## LATER

### Bass Quest — after shared string/audio systems are ready

Bass Quest is desired, but should not be implemented as "Guitar with four strings" and should not be added before Guitar/string-player foundations are stable.

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

Current Guitar pitch detection historically rejects frequencies below roughly **55 Hz**. Standard Bass low E1 is approximately **41.2 Hz**.

Bass therefore requires deliberate work on:

- lower-frequency analysis range;
- analyser/window configuration;
- latency impact;
- strong-harmonic/octave errors (for example E1 mistaken for E2);
- fundamental selection/stability;
- microphone vs direct USB-interface behavior;
- real Chromebook performance.

Do not "fix" this by changing one cutoff constant without hardware validation.

### Bass release staging

A likely staged approach:

1. shared string-engine/Bass UI foundation;
2. Bass input/tuner/calibration/import support;
3. Bass beginner curriculum and Smart Practice integration;
4. physical hardware validation and polish.

The exact release numbers should be chosen when the prerequisite Guitar work is complete.

## LATER — Reliability and learning-system improvements

### Input/latency calibration

Add deliberate per-input timing calibration when measurements justify it. Distinguish input latency from visual/backing synchronization offset.

Potential needs:

- USB/direct Guitar input timing offset;
- microphone timing characteristics;
- MIDI timing offset;
- visual/backing playback offset;
- saved calibration tied to appropriate device identity.

### Guided hardware setup

Evolve Hardware & Backup from a technical monitor toward an optional guided validation flow:

- choose input;
- play expected strings/notes;
- measure level/noise;
- verify pitch/onset;
- report pass/fail clearly;
- preserve advanced raw diagnostics for troubleshooting.

### Automatic trouble-spot practice

Use existing phrase/measure and skill-history data to offer one-click practice around the worst section after a run.

Example outcome:

> Practice Phrase B at 70%

rather than requiring a child to manually identify and set A/B points.

### Performance baselines/budgets

After instrumentation exists, record repeatable baseline measurements on the target Chromebook and turn meaningful ones into real budgets. Do not invent numbers before measurement.

### PWA update UX

Replace "refresh/reopen until the service worker updates" with a clear child/parent-facing update-ready/restart flow when practical.

### More dependable offline Guitar playback

Either bundle required AlphaTab playback assets locally or provide a deliberate offline-asset download path with clear status.

### Modularization

Incrementally reduce oversized-file coupling (especially Guitar `app.js`) when focused releases naturally touch those boundaries. Avoid a rewrite-for-cleanliness project.

## BACKLOG / IDEAS

Ideas are not approved scope merely because they appear here.

- more public-domain Guitar/Piano/Bass arrangements;
- richer original lesson music/grooves;
- compact local Piano sample set after performance/bundle-size measurement;
- deeper Guitar/Bass technique instruction;
- technique recognition only where reliable enough to validate honestly;
- improved teacher/parent summary of practice and weak skills;
- accessibility options such as stronger contrast, color-blind-safe cues, larger labels and reduced effects;
- richer imported-song section/phrase analysis;
- optional full backup including imported song files with size warnings;
- transactional restore/stronger backup validation;
- cloud sync someday if the product actually needs it;
- additional instruments only after the shared foundations justify them;
- family challenges if they support learning rather than distracting from it;
- crash/session recovery for long imported-song practice;
- an internal song-authoring/validation tool for FMQ-authored content;
- AudioWorklet experiments for measured input/performance problems while retaining safe fallback behavior.

## Explicitly not planned

### Duet mode

A synchronized Guitar/Piano duet mode is not currently needed and should not be treated as roadmap scope unless the product owner explicitly reopens the idea.

## Roadmap rule

When real-world testing reveals scoring errors, audio dropouts, unreadable gameplay, save corruption, hardware failure, or serious Chromebook-performance problems, those issues outrank new instrument/content expansion.
