# Family Music Quest — Chromebook Performance Benchmark

This document defines a repeatable manual benchmark for performance-sensitive Guitar gameplay on the target Chromebook. It is intended to complement automated tests, not replace them.

Use this protocol whenever work changes:

- imported Guitar Pro playback;
- Note Highway rendering;
- Tab View rendering;
- microphone pitch/onset analysis;
- AlphaTab synchronization;
- Full Song behavior;
- animation-loop logic;
- string-player performance;
- PWA/runtime asset loading.

Do not turn subjective observations into fake precision. Record what can actually be measured and describe audible/visual behavior honestly.

## Target device

Primary real-world target:

- Dell Chromebook 3100 or equivalent low-cost Chromebook class
- Chrome / installed PWA as normally used

For every benchmark record:

- date;
- Family Music Quest version/commit;
- Chromebook model;
- Chrome version if practical;
- installed PWA vs normal browser tab;
- input device;
- song/file tested;
- selected track;
- practice speed;
- Note Highway or Tab View;
- backing enabled/disabled;
- microphone/USB input enabled/disabled;
- section or Full Song.

## Reference material

Use at least two cases.

### Case A — lightweight control

Use a built-in Guitar Songbook arrangement such as Ode to Joy or another small deterministic built-in piece.

Purpose: establish whether the basic player is healthy when song size is small.

### Case B — complex imported stress case

Use the known complex Coheed & Cambria Guitar Pro file already used in real-world testing.

This file is a local manual test asset only. Do not commit or bundle copyrighted song data into the repository.

Purpose: exercise long/full-song event counts, AlphaTab backing, real imported timing, dense passages and sustained runtime load.

## Core benchmark matrix

Run the following combinations after a fresh launch when practical.

| Run | Range | View | Backing | Input analysis | Speed | Purpose |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | Built-in Full Song | Highway | normal | normal | 100% | lightweight control |
| B1 | Imported short section | Highway | on | on | 100% | section baseline |
| B2 | Imported Full Song | Highway | on | on | 100% | primary failing real-world case |
| B3 | Imported Full Song | Tab View | on | on | 100% | isolate view/render contribution |
| B4 | Imported Full Song | Highway | on | diagnosis-only off | 100% | isolate pitch-analysis cost |
| B5 | Imported Full Song | Highway | off | on | 100% | isolate AlphaTab/backing contribution |
| B6 | Imported Full Song | Highway | on | on | 70% | scheduling/load sensitivity |

Diagnosis-only input/backing changes are for measurement. They are not acceptable shipped fixes if normal gameplay requires those features.

## What to record

If performance diagnostics exist, record values at roughly:

- shortly after gameplay starts;
- a representative dense passage;
- several minutes into Full Song where practical;
- immediately before/after any audible glitch or visible lag.

Useful metrics include:

- approximate FPS;
- average/recent frame time;
- worst recent frame time;
- total song events;
- active/visible event count;
- rendered Highway element count;
- rendered Tab View event count;
- pitch-analysis processing time;
- pitch-analysis rate;
- current playback speed;
- song/section duration or event count;
- AlphaTab/game-clock drift when that metric is implemented meaningfully.

Do not compare metrics that were collected using different definitions without noting the change.

## Subjective observations

For each run record:

### Audio

- clean;
- occasional click/glitch;
- repeated stutter;
- severe breakup;
- backing tempo feels unstable;
- backing stops/restarts unexpectedly.

### Visuals

- smooth;
- occasional hitch;
- repeated visible lag;
- notes jump rather than move smoothly;
- strike-line synchronization visibly drifts;
- Tab View playhead/current note difficult to follow.

### Input/scoring

- note response feels normal;
- obvious added detection delay;
- missed onsets that were previously reliable;
- scoring appears ahead/behind backing;
- USB input behaves differently from internal microphone.

## Before/after comparison rule

For a performance release:

1. record a baseline from the previous released version when possible;
2. repeat the same matrix on the candidate version;
3. use the same Chromebook, song, track, input and settings;
4. compare both measured metrics and audible/visual behavior;
5. record any tradeoff introduced by the optimization.

Do not claim a performance improvement solely from code inspection or desktop testing.

## Full Song release blocker

The current known blocker is:

> A complex imported Guitar Pro file can exhibit severe audible glitching/lag during **Full Song as Level** on the target Chromebook.

A release claiming to fix this issue must specifically test the Full Song path. Smooth short sections are not sufficient evidence.

Expected acceptance outcome:

> The complex imported Full Song can run under normal Guitar gameplay with backing and normal input analysis without the severe scale-dependent stutter/lag previously observed.

If the issue cannot be fully eliminated, document:

- which matrix runs still fail;
- measured differences between working and failing cases;
- the most likely remaining bottleneck;
- whether the limitation appears application-, browser-, asset-, or hardware-related;
- what next experiment would distinguish those possibilities.

## Regression checks after optimization

Performance improvements must not silently break:

- Guitar scoring;
- skipped-note accuracy rules;
- count-in cancellation;
- section practice;
- Full Song completion;
- A/B looping;
- backing track muting;
- speed changes;
- pause/resume;
- exit/restart cleanup;
- microphone/USB detection;
- Note Highway readability;
- Tab View readability;
- Guitar Songbook play;
- Piano behavior.

## Reporting template

```text
Version/commit:
Device:
Chrome/PWA:
Input:
Song/track:

A1 built-in control:
B1 imported section:
B2 imported Full Song Highway:
B3 imported Full Song Tab:
B4 Full Song without input analysis (diagnosis only):
B5 Full Song without backing (diagnosis only):
B6 Full Song 70%:

Key diagnostics:
Audio observations:
Visual observations:
Input/scoring observations:
Before/after conclusion:
Remaining blocker:
```

## Relationship to other project documents

- `TESTING.md` defines permanent automated/manual release expectations.
- `HARDWARE_VALIDATION.md` covers physical input validation more broadly.
- `ARCHITECTURE.md` documents the runtime architecture.
- `TECHNICAL_DEBT.md` tracks unresolved performance debt.
- `LATENCY_CALIBRATION_SPEC.md` defines future timing-offset work separately from raw performance optimization.
