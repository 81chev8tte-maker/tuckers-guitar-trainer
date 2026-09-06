# Family Music Quest — Technical & Test Debt

This file tracks known debt without automatically turning every imperfection into urgent scope.

Use these approximate priorities:

- **Critical** — scoring corruption, save corruption, crashes, severe hardware/input failure, major audio failure.
- **Should Address** — meaningful UX/performance/reliability debt that should be handled before dependent expansion.
- **Opportunistic** — worth improving when a focused release naturally touches the area.
- **Cosmetic** — harmless naming/style/cleanup with little user impact.

## Critical

No repository-wide critical issue is currently recorded by this documentation pass.

If real-world testing reveals reproducible scoring corruption, save corruption, crashes, severe audio dropout, or input failure, promote it here immediately and prioritize it over roadmap expansion.

## Should Address

### Guitar Tab View readability

The current playable Tab View is based on a virtualized event-cell grid. Dense imported songs can be hard to follow musically.

Desired outcome: preserve bounded rendering/performance while presenting readable string lines, musical spacing/measure structure and a stable playhead suitable for Chromebook use.

### Guitar Note Highway string identity

Per-string colors exist, but real-world testing shows dense notes/chords can still visually blend because borders/glows/size dominate the color cue.

Desired outcome: the note itself should carry unmistakable string identity while color is not the only cue.

### Imported Guitar Pro audio/gameplay stutter investigation

Real-world imported-song testing has produced glitchy/laggy playback. Current Guitar gameplay performs repeated event-list work while AlphaTab and microphone pitch analysis are also active.

Do not guess at one cause. Add useful performance instrumentation and compare frame/render work, pitch-analysis cost and playback drift on the target Chromebook.

### Whole-event-list work in Guitar animation paths

Several high-frequency Guitar gameplay functions scan/filter full event arrays. This is acceptable for small lessons but may become expensive for large imported songs.

Prefer moving indexes/windows/cached active sets where profiling demonstrates benefit.

### Hard-coded six-string Guitar assumptions

Reusable string rendering contains fixed-six assumptions. These should be removed incrementally before Bass Quest, without changing Guitar behavior.

### AlphaTab/soundfont offline completeness

The PWA caches the external AlphaTab script opportunistically, but Guitar playback dependencies are not guaranteed to be fully ready offline on a clean install.

Future options: local bundling or explicit offline playback-asset download/status.

### Stale Guitar internal version constant

`app.js` contains an internal `APP_VERSION` value older than the current package/PWA version. The actual v2.6.2 PWA asset references are aligned elsewhere, so this is not currently recorded as a functional cache failure, but the stale constant is misleading and should be resolved during a focused versioning/maintenance pass.

### Backup completeness and restore robustness

Current backup excludes imported song blobs. Restore validation is not a transactional multi-store operation and could theoretically leave partial state if browser storage fails mid-process.

A future backup redesign should explicitly distinguish progress/settings backup from optional full imported-library backup.

### Guided hardware validation

Hardware & Backup is useful but still more technical monitor than guided child/parent validation wizard. Future work can add structured expected/detected/pass/fail tests without removing advanced diagnostics.

## Opportunistic

### Large `app.js`

Guitar curriculum, input, imports, rendering, gameplay and navigation are highly coupled in one large file.

Incremental modularization is reasonable when a focused release naturally touches a boundary. Do not launch a rewrite-for-cleanliness project.

### Main-thread pitch analysis

Guitar and Piano pitch analysis are currently main-thread CPU work.

`AUDIO_PIPELINE_REVIEW.md` documents a possible AudioWorklet experiment. Only pursue after baseline profiling demonstrates a meaningful problem and retain a safe fallback.

### Piano full-note-list rendering

Piano currently scans the song note list during animation. This may become expensive with very large imported MIDI files. Profile before rewriting.

### Profile/calibration generality

Profiles explicitly store Guitar/Piano progress and diagnostics store one microphone calibration record per player. Future Bass or multi-device calibration will require deliberate schema/config changes.

### PWA update UX

Installed PWAs currently rely on normal service-worker activation/refresh behavior. A future update-ready/restart experience could reduce confusion during active development/testing.

### Internal content-authoring workflow

Built-in songs are hand-authored in code. As the library grows, a small internal authoring/validation/export tool may reduce mistakes while keeping runtime dependencies small.

## Cosmetic

- harmless naming/style inconsistencies that do not affect child UX or behavior;
- safe duplicate helper cleanup with no performance/reliability effect;
- documentation formatting improvements.

Cosmetic work should not displace correctness, audio, hardware, or readability work.

# Test Debt

## Audio and timing

- imported Guitar Pro audio stutter/dropout under real Chromebook load;
- AlphaTab/gameplay synchronization drift under stress;
- real input/output latency;
- pause/resume behavior with physical hardware;
- accompaniment balance through Chromebook speakers.

## Guitar input

- microphone/USB-interface false positives;
- real repeated-note onset behavior;
- open/fretted note detection across the neck;
- device-specific sample-rate/latency behavior.

## Piano hardware

- physical MIDI Note On order/timing;
- sustain-pedal interaction;
- real MIDI reconnect behavior;
- physical keyboard pause/restart cleanup;
- acoustic-piano microphone detection.

## Visual/child UX

- Guitar Note Highway readability at actual playing distance;
- Tab View readability during dense songs;
- Chromebook responsive fit;
- child understanding of controls/instructions;
- musical feel and song recognizability.

## Storage/PWA

- restore failure under quota/interruption;
- complete offline Guitar playback after clean install;
- update activation on previously installed PWA;
- crash/session recovery for long practice runs.

# Debt handling rule

When a release touches one of these areas:

1. decide whether the debt blocks the release;
2. add a stable automated regression when practical;
3. keep genuinely hardware/subjective checks manual;
4. update this register after the release;
5. do not use debt cleanup as justification for unrelated architecture replacement.
