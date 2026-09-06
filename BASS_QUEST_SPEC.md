# Family Music Quest — Bass Quest Specification

This document defines the intended Bass Quest architecture and staged implementation direction. It is a planning/source-of-truth document, not authorization to implement Bass in an unrelated release.

Bass Quest should be introduced only after the shared Guitar/string-player foundation is stable enough to support it without duplicating the Guitar codebase.

## Product intent

Bass Quest should feel like a real beginner bass-learning experience, not "Guitar Quest with two strings removed."

It should reuse shared mechanics where appropriate while keeping Bass-specific:

- tuning and range;
- curriculum;
- terminology;
- progression;
- skill history;
- calibration profile where necessary;
- technique content;
- learning tools;
- imported-track classification.

## Architectural principle

**Share mechanics, not curriculum.**

Prefer a shared configurable string-instrument foundation for:

- timing;
- scoring;
- song transport;
- Note Highway rendering;
- Tab View rendering;
- section/full-song practice;
- speed controls;
- count-in;
- A/B looping;
- AlphaTab backing synchronization;
- microphone/USB input contract;
- performance diagnostics;
- practice-intelligence helpers.

Keep distinct:

- Guitar lessons;
- Bass lessons;
- Guitar chord/reference content;
- Bass root/fifth/octave/groove tools;
- Guitar progress;
- Bass progress;
- Guitar skill history;
- Bass skill history;
- instrument-specific detection/calibration settings when required.

Do not fork `app.js` into a separate nearly-identical Bass player.

## Initial instrument configuration

Initial Bass Quest target:

- 4-string electric bass;
- standard tuning E1-A1-D2-G2;
- normal bass-tab display order;
- fret numbering consistent with Guitar Quest;
- standard string/fret-to-MIDI mapping;
- future 5-string support should be possible without a second architecture rewrite, but 5-string Bass is not initial scope.

Reference open pitches:

| Bass string | Scientific pitch | MIDI | Approx. frequency |
| --- | ---: | ---: | ---: |
| Low E | E1 | 28 | 41.2 Hz |
| A | A1 | 33 | 55.0 Hz |
| D | D2 | 38 | 73.4 Hz |
| G | G2 | 43 | 98.0 Hz |

A shared instrument configuration should be able to provide concepts such as:

- instrument id/type;
- string count;
- string label/name/number;
- open MIDI pitch;
- tuning;
- display order;
- color identity;
- playable range;
- optional detection profile;
- optional UI terminology.

The exact schema should follow the post-v2.6.4 code rather than this document inventing an incompatible abstraction.

## Current prerequisites/blockers

At v2.6.3 the current Guitar implementation has several known Bass blockers.

### Pitch floor

The Guitar detector rejects frequencies below roughly 55 Hz. Standard Bass E1 is about 41.2 Hz, so Low E cannot currently be detected.

### Analysis window/performance

The Guitar analyser uses a 2,048-sample time-domain buffer and main-thread autocorrelation. Extending low-frequency analysis by simply increasing buffer size may substantially increase CPU cost and latency on target Chromebooks.

Bass support therefore requires deliberate low-frequency design and measurement, not merely changing the minimum-frequency constant.

### Harmonic/octave errors

Bass strings can produce strong upper harmonics. Bass detection must specifically guard against routine errors such as:

- E1 detected as E2;
- A1 detected as A2;
- other strong harmonics selected instead of the fundamental.

### Guitar-track import restriction

Current imported Guitar Pro/MusicXML Guitar track selection treats playable tablature as six-string Guitar. Bass needs instrument-aware track classification and manual override.

### Profile schema

Current profile progress explicitly supports Guitar and Piano. Bass needs independent `bassProgress` or an equivalent explicit per-instrument extension while preserving existing profile behavior.

## Staged release direction

### Stage 1 — shared foundation / Bass Quest core

Likely first visible Bass release should include:

- Bass Quest third instrument option;
- 4-string standard Bass configuration;
- shared player/highway/tab use;
- Bass labels/terminology;
- independent Bass progress container;
- basic Bass skill history;
- tuner/input test/calibration integration;
- Bass-capable low-frequency detection;
- imported Bass-track selection;
- section/full-song practice;
- backing-track muting;
- speed/count-in/loop/pause/restart/exit behavior;
- small usable beginner curriculum rather than an empty mode;
- automated regression coverage;
- physical hardware checklist.

### Stage 2 — Bass learning path and identity

Deepen Bass-specific instruction with:

1. Bass orientation and four strings
2. Reading bass tab
3. Open strings
4. Fret numbers
5. E/A string movement
6. D/G string movement
7. Steady quarter-note pulse
8. Eighth-note rhythm
9. Alternating index/middle fingers
10. Pick playing as an optional technique
11. String crossing
12. Clean fretting
13. Basic muting
14. Root-note playing
15. Roots with fifths
16. Octaves
17. Repeated groove patterns
18. Locking with a drum/kick pulse
19. Simple bass riffs
20. Longer beginner bass lines

Use exercises, mini-grooves, checkpoints and longer pieces. Do not make every lesson the same length or structure.

## Bass-specific gameplay identity

Bass Quest should emphasize rhythm and groove more strongly than Guitar Quest.

Potential defining practice mechanic:

### Drum Lock

A simple locally generated drum pulse can support progression such as:

- hit a root on each kick;
- maintain quarter notes against kick/snare;
- play eighth-note roots;
- root/fifth groove;
- octave groove;
- simple syncopated pattern later.

The first version does not require sophisticated drum transcription. The purpose is to teach that bass often locks rhythmically with the drums.

## Input and pitch-detection requirements

Reuse the existing Guitar input pipeline where practical, but allow instrument-specific detection parameters/logic.

Conceptual direction:

### Guitar profile

- existing practical frequency range;
- existing onset behavior;
- responsiveness appropriate to Guitar.

### Bass profile

- lower supported frequency floor;
- enough analysis context for stable E1/A1 fundamentals;
- harmonic/fundamental correction;
- stability appropriate to bass without excessive latency;
- Chromebook-safe CPU cost.

Both should continue producing a common scoring-facing contract containing useful values such as:

- frequency;
- MIDI/note;
- RMS;
- onset;
- confidence/stability if implemented.

Do not degrade Guitar detection merely to support Bass.

## Bass detector acceptance cases

At minimum validate physically:

- open E1 detected as E1, not E2;
- open A1 detected as A1, not A2;
- D2 and G2 stable;
- fretted low E/A notes stable;
- repeated plucks do not oscillate between fundamental/octave excessively;
- muted/noisy strings do not score as clean notes;
- microphone mode remains usable where hardware permits;
- USB/direct audio interface is the preferred high-quality Bass input path;
- any longer analysis window does not create unacceptable perceived latency.

## Tuner and diagnostics

Bass Quest should integrate with:

- tuner;
- input test;
- calibration;
- Hardware & Backup diagnostics;
- USB audio device selection;
- scoreability/status displays.

Diagnostics should make octave mistakes obvious by showing detected note/frequency rather than only pass/fail.

Calibration should distinguish shareable device identity from instrument-specific detection calibration where necessary.

## Imported song support

Reuse the current device-local Guitar Pro/MusicXML library rather than requiring duplicate imports solely for Bass Quest.

A single Guitar Pro score may contain:

- Guitar 1;
- Guitar 2;
- Bass;
- drums;
- other instruments.

Bass track classification should consider multiple signals:

- string count;
- tuning;
- track name;
- MIDI/program/instrument metadata when available;
- note range;
- actual tablature/string-fret data.

Do not rely on one heuristic alone.

Always allow manual track selection when automatic classification is uncertain.

Preserve the imported track's real octave. Do not transpose Bass notes upward into Guitar range to accommodate the detector.

Reuse where appropriate:

- imported library;
- section generation;
- Full Song;
- practice speeds;
- A/B loop;
- backing instruments;
- selected player-track mute;
- score/accuracy/combo/stars/XP;
- alternate tuning metadata already supported by the score.

## Bass scoring

Initial microphone/direct-audio Bass scoring should remain honest about monophonic pitch detection.

Bass is especially suitable for monophonic note/riff scoring, but do not imply the app can verify every nuance of:

- muting technique;
- alternating fingers;
- pick direction;
- articulation;
- ghost notes;
- slides/hammer-ons/pull-offs;

unless a future detector proves those capabilities reliably.

Teach technique even when the app can only verify pitch/timing.

## Bass progress and profiles

Bass must have independent per-player progression.

Conceptually each profile should support:

- Guitar progress;
- Piano progress;
- Bass progress.

Bass progress should include its own:

- lesson completion;
- stars;
- XP/progress metrics;
- song bests;
- practice settings;
- skill history;
- calibration reference/data where appropriate.

Do not merge Guitar and Bass history just because they share rendering/input mechanics.

Current development-save policy applies: old development-save migration should not consume disproportionate effort unless policy changes later.

## Practice intelligence

Reuse Smart Practice infrastructure but separate Bass skill keys/history.

String/fret skill concepts can be shared structurally, for example:

`string:<index>:fret:<number>`

but should live in Bass progress when the active instrument is Bass.

Future Bass-specific skill concepts may include:

- pulse accuracy;
- string crossing;
- root recognition;
- fifth/octave shapes;
- groove consistency.

Do not invent inferred technique correctness that the input cannot actually observe.

## Bass tools

Prefer practical Bass reference/training tools over copying Guitar chord-reference features.

Good candidates:

- fretboard note reference;
- root-note finder;
- fifth-shape reference;
- octave-shape reference;
- rhythm/groove trainer;
- muting guidance;
- fingerstyle guidance;
- pick guidance.

Keep initial scope small and directly useful to the curriculum.

## Bass built-in music

Use a mix of:

- original FMQ grooves/bass lines;
- legally safe public-domain compositions with newly authored FMQ Bass arrangements.

Do not turn every public-domain melody into a bass melody just because the notes are available. Where musically appropriate, let FMQ supply melody/harmony while the learner performs a simplified bass accompaniment.

Existing rights rules apply:

- verify underlying composition rights;
- independently author FMQ arrangements;
- do not copy modern tabs/MIDI/commercial arrangements/recordings/tutorial transcriptions;
- update shared music-source documentation.

## Automated tests

At minimum Bass releases should cover:

- 4-string config;
- E1/A1/D2/G2 open MIDI values;
- string/fret-to-pitch calculations;
- highway lane generation for four strings;
- Tab View row generation/order;
- Bass progress isolation from Guitar/Piano;
- backup/restore inclusion;
- Bass navigation;
- imported Bass-track classification;
- manual Bass-track selection;
- Bass octave preservation;
- section/full-song setup;
- current Guitar six-string behavior remains unchanged;
- current Piano tests remain unchanged/passing;
- PWA assets/versioning.

Do not attempt to prove low-frequency physical detector quality solely with synthetic unit tests.

## Physical hardware validation

Required real-device checks include:

- Chromebook internal microphone with electric bass acoustically or through an amp where practical;
- USB guitar/bass audio interface;
- E1/A1/D2/G2 recognition;
- fretted low notes;
- octave/harmonic behavior;
- tuner stability;
- perceived latency;
- section playback;
- Full Song playback;
- pause/resume;
- A/B looping;
- profile switching/cleanup;
- imported Bass-track mute/backing behavior.

Use `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` when Bass changes create meaningful runtime load.

## Explicit non-goals for initial Bass work

Unless separately approved:

- 5-string Bass;
- slap/pop detection;
- polyphonic chord recognition;
- advanced technique recognition;
- full transcription generation;
- native-app rewrite;
- a second duplicated song/import database;
- a second duplicated Guitar-like player codebase.

## Bass Definition of Done

A Bass release is not complete merely because four lanes render.

It must demonstrate that:

- Bass has its own child-facing identity and learning content;
- open/fretted Bass pitches are represented in their real octave;
- E1 is actually supported by the input path on real hardware;
- common octave errors are controlled well enough for meaningful play;
- Bass imports can select real Bass tracks;
- Guitar and Piano regressions remain protected;
- Bass progress is isolated per player;
- target Chromebook performance is acceptable;
- remaining physical limitations are explicitly documented.
