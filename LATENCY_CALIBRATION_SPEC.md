# Family Music Quest — Latency and Timing Calibration Specification

This document defines a future calibration model for timing-sensitive instrument gameplay. It does not require immediate implementation and should not be used to justify arbitrary scoring-window changes.

The central rule is:

> **Do not treat all timing error as one generic latency number.**

Family Music Quest has several different timing paths that can be early or late for different reasons. They should be measured and compensated separately where practical.

## Why this matters

Family Music Quest combines:

- microphone or USB/direct audio input;
- Web MIDI input;
- app-generated audio;
- AlphaTab backing playback;
- visual Note Highway/falling-note animation;
- strike-line timing;
- browser scheduling;
- hardware input/output latency.

A player may physically perform on time while the app receives, renders or compares the event later.

Without explicit calibration the product may compensate by making hit windows unnecessarily wide, which reduces meaningful rhythm feedback.

## Timing domains

The future system should distinguish at least four concepts.

### 1. Input latency compensation

How long after the physical performance does Family Music Quest receive a usable input event?

Examples:

- microphone capture and pitch-detection delay;
- USB audio interface buffering;
- pitch-analysis window/stability delay;
- Web MIDI device/browser delivery delay.

This affects **when a player's performance should be scored**.

### 2. Backing/playback synchronization offset

Does the audible backing track occur at the same musical moment represented by the gameplay clock?

This can include:

- AlphaTab scheduling/output latency;
- browser audio output latency;
- playback-range/speed behavior;
- app clock vs audible output differences.

This affects whether the **music the player hears** is aligned with the scoring/visual timeline.

### 3. Visual strike-line offset

Does the visual target reach the strike line when the player should physically perform?

This is a presentation offset and should not necessarily modify the underlying song clock.

Players can perceive video and audio timing differently, and display refresh/render delay can differ from audio output timing.

### 4. MIDI timing offset

Web MIDI bypasses pitch detection and often has different latency characteristics from microphone/audio input.

MIDI timing should not automatically inherit microphone/direct-audio compensation.

## Do not collapse these values

Avoid a single setting such as:

`latencyMs = 85`

that silently affects every subsystem.

A more explicit conceptual model could be:

```text
inputOffsetMs
backingOffsetMs
visualOffsetMs
midiInputOffsetMs
```

The actual implementation may use different names or structure, but the domains should remain understandable and separately testable.

## Sign convention

When implemented, document one sign convention permanently.

Recommended conceptual rule:

- positive input compensation means the event is known to arrive late and should be compared against an earlier musical time;
- positive visual offset should have one clearly documented direction, for example moving the target earlier on screen;
- backing offset should likewise document whether positive means delay or advance.

Do not ship ambiguous plus/minus controls.

The UI should use plain-language descriptions such as:

- "Input arrives late by about 45 ms"
- "Show notes slightly earlier"
- "Backing sounds slightly late"

rather than exposing unexplained raw signed values to children.

## Storage model

Current Family Music Quest calibration is per player and contains a selected microphone device record. Future latency calibration should distinguish between:

- player preference;
- physical device identity;
- instrument/detection profile;
- input type.

A conceptual structure might be:

```text
player
  device calibrations
    <device identity>
      guitar audio
      bass audio
      piano microphone
      midi
```

Do not adopt this exact schema blindly; inspect current profile/calibration code when implementation begins.

### What may be shared

Device identity and some hardware-level measurements may be reusable.

### What may differ

Detection latency may differ significantly between:

- Guitar microphone;
- Bass microphone;
- Guitar USB/direct audio;
- Bass USB/direct audio;
- Piano microphone;
- MIDI.

For example, Bass may need a longer analysis context than Guitar and therefore should not automatically inherit the same input compensation.

## Calibration UX principles

Normal child-facing gameplay should not require manual millisecond tuning.

Prefer:

1. a guided automatic/semi-automatic setup;
2. a simple result such as `Timing calibrated ✓`;
3. optional advanced fine adjustment in Hardware & Backup.

The setup should explain only what the player needs to do.

## Proposed guided input-latency calibration

Exact implementation depends on what can be measured reliably in-browser.

Potential flow:

1. choose instrument and input device;
2. app plays or displays a repeated reference pulse;
3. user performs a clear note/pluck/tap on each pulse;
4. collect multiple attempts;
5. reject obvious outliers;
6. estimate a central timing offset;
7. show confidence/consistency rather than pretending one sample is exact;
8. save only if results are stable enough.

### Important limitation

A human playing along with a click introduces human reaction/anticipation error. A simple play-along wizard therefore measures a combination of hardware/system latency and player timing.

Do not call that measurement "hardware latency" with fake precision.

It may still be useful as **gameplay timing calibration**, especially if several repetitions are consistent.

## Possible stronger measurement methods

Future experiments may investigate more objective methods where supported.

Examples:

### Audio loopback

Play a known click and capture it through an input/loopback path, measuring round-trip timing.

Advantages:

- more objective.

Limitations:

- requires suitable hardware/routing;
- measures round-trip audio, not necessarily instrument-detection latency;
- may not be beginner-friendly.

### MIDI loop/reference

If a device/setup can generate a known synchronized MIDI event, compare source/received timestamps.

Limitations:

- not representative of microphone detection;
- browser/device timestamps require careful interpretation.

### Detector timing test

Feed a known local/synthetic waveform into detector code in automated/performance testing and measure algorithmic processing delay separately from physical device delay.

This can help distinguish algorithm cost from real input/output latency but does not replace physical hardware validation.

## Scoring integration

Latency compensation should shift the effective comparison time, not silently widen correctness rules.

Conceptually:

```text
physical note
  -> browser receives/detects event late
  -> known input compensation applied
  -> compare against musical target time
```

Preserve existing hit-window semantics unless a release explicitly changes them.

Do not let calibration:

- turn wrong notes into correct notes;
- bypass onset requirements;
- alter skipped-note rules;
- make chord grouping order-dependent;
- modify song structure;
- hide backing synchronization defects.

## Visual integration

Visual timing is a separate presentation problem.

A future visual calibration may allow a parent/advanced user to choose whether targets should appear/reach the strike line slightly earlier or later relative to the musical clock.

This should be bounded to a sensible range based on real measurements. Do not invent a range until target-device tests establish what is useful.

The visual offset should apply consistently to:

- Guitar Note Highway;
- Guitar Tab playhead/current target where appropriate;
- Piano falling notes;
- future Bass Highway.

Do not move the audio/song clock merely to move a drawing.

## Backing synchronization integration

For imported Guitar/Bass songs using AlphaTab, evaluate separately:

- AlphaTab reported tick position;
- app/game musical time;
- audible backing output;
- visual target position.

If diagnostics show the backing is consistently late/early while the tick clock is stable, a playback/output compensation may be justified.

Do not solve a variable stutter/drift problem with a fixed offset. Fixed calibration only helps a **consistent** offset.

If timing changes during a song, investigate performance/scheduling/synchronization instead.

## MIDI integration

Web MIDI events already expose browser event timing information in the shared MIDI service.

Future work may compare:

- event receipt time;
- source timestamp where meaningful;
- game clock;
- target time.

Any compensation should preserve:

- Note On/Off order;
- chord simultaneity/grouping;
- sustain behavior;
- duplicate-event protection.

MIDI calibration should not reduce polyphonic correctness.

## Bass implications

Bass Quest makes latency work more important because low-frequency pitch detection may need more waveform context and/or additional stability logic.

When Bass detection is implemented, measure:

- processing time;
- time from pluck to stable E1/A1 detection;
- octave-error correction delay;
- USB/direct input vs microphone behavior.

Do not assume a Bass detector can use Guitar's calibration unchanged.

See `BASS_QUEST_SPEC.md`.

## Performance relationship

Latency and performance are related but not identical.

Examples:

- a stable 50 ms input delay may be calibratable;
- random 30–180 ms delays caused by frame stalls are not;
- backing audio that stutters is not fixed by adding 80 ms offset;
- a detector that sometimes takes twice as long is a stability/performance problem first.

Before adding calibration to compensate for a problem, establish whether the error is:

- consistent offset;
- jitter;
- drift;
- dropped processing;
- frame/audio stutter.

Use `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` for runtime profiling.

## Diagnostics requirements

When latency calibration is implemented, advanced diagnostics should expose enough context to troubleshoot it.

Potential fields:

- active input type;
- selected device identity/label where browser permits;
- saved input compensation;
- saved MIDI compensation;
- saved visual offset;
- saved backing offset;
- current measured/detected event timestamp;
- target musical timestamp;
- applied compensated timestamp;
- recent timing error distribution.

Do not overwhelm the normal gameplay HUD with these values.

## Calibration quality/confidence

Avoid presenting an offset as exact when measurements are noisy.

A future calibration result can classify stability, for example conceptually:

- stable;
- usable;
- inconsistent — retry.

Do not define hard thresholds until measured data exists.

Store enough metadata to know when calibration may be stale, such as:

- input device identity;
- input type;
- instrument/detection profile;
- sample rate if relevant;
- app calibration version;
- date updated.

## Recalibration triggers

Consider suggesting recalibration when meaningful hardware/runtime context changes, for example:

- a different USB interface is selected;
- switching from microphone to direct USB audio;
- detector architecture changes substantially;
- Bass mode uses a different analysis profile;
- browser/device changes make old calibration suspect.

Do not force recalibration on every launch.

## Automated testing

Automated tests should verify calculation/behavior, not pretend to measure physical latency.

Useful tests include:

- compensation sign/direction;
- offset applied exactly once;
- zero offset preserves current scoring behavior;
- Guitar/Piano/Bass instrument calibration isolation;
- device/profile lookup behavior;
- MIDI offset does not alter chord order/grouping;
- visual offset changes rendering timing rather than song/scoring time;
- backing offset does not modify imported source tempo maps;
- backup/restore preserves calibration when included in the schema;
- cleanup/profile switching does not leak one player's calibration into another.

## Physical acceptance testing

When implemented, validate on the target Chromebook with:

### Guitar microphone

- open strings;
- repeated plucks;
- short rhythmic pattern against count-in/backing.

### Guitar USB/direct input

Repeat the same pattern and compare perceived/recorded timing.

### Piano MIDI

- repeated quarter notes;
- faster eighths;
- simultaneous chords.

### Piano microphone

Single-note timing separately from MIDI.

### Bass

When available:

- E1/A1 repeated notes;
- root-note pulse;
- eighth-note groove;
- USB/direct vs microphone.

Record whether calibration improves alignment without making early/late feedback feel dishonest.

## Acceptance criteria for a future latency release

A future release should not be considered complete merely because offset fields exist.

It should demonstrate that:

- timing domains are separated rather than collapsed into one magic value;
- zero calibration preserves current behavior;
- calibration is stored for the correct player/device/instrument context;
- scoring applies input compensation consistently;
- visual offset does not corrupt the song clock;
- backing offset is only used for consistent synchronization error;
- MIDI remains polyphonically correct;
- real Chromebook tests show improved perceived/scored alignment for at least the hardware paths targeted by the release;
- jitter/stutter is still treated as a performance bug rather than hidden by calibration.

## Non-goals for the first latency-calibration release

Unless separately approved:

- sub-millisecond claims;
- automatic perfect hardware identification;
- cloud-synced calibration;
- compensation for Bluetooth audio without measured support;
- changing all scoring windows;
- replacing current audio engines solely to implement calibration;
- hiding performance regressions with larger offsets.
