# Family Music Quest — Guided Hardware Setup Wizard Specification

This document defines the intended child/parent-facing hardware setup experience for Family Music Quest.

It is a planning/source-of-truth document. It does **not** authorize unrelated implementation work and should not replace the existing Hardware & Backup diagnostics until the guided flow is deliberately implemented.

The guiding idea is simple:

> **A child should be able to plug in an instrument, follow a few obvious steps, and reach “Ready to Play” without understanding sample rates, RMS, MIDI status bytes, or noise-gate values.**

Advanced diagnostics should remain available for troubleshooting.

---

# 1. Product Goal

Family Music Quest currently supports or plans to support several input paths:

- Guitar through Chromebook/internal microphone;
- Guitar through USB/direct audio input;
- Piano through microphone;
- Piano through Web MIDI;
- Piano through the on-screen keyboard;
- future Bass through microphone;
- future Bass through USB/direct audio input.

The current Hardware & Backup area already exposes useful low-level information such as:

- selected/granted microphone device;
- sample rate/channel information;
- live input level;
- detected pitch/frequency/cents;
- onset indication;
- whether the current reading would be considered scoreable;
- saved microphone noise-floor/gate calibration;
- Web MIDI connection state;
- Note On/Off;
- velocity;
- held-note/polyphony state;
- sustain pedal state;
- exportable hardware validation results.

The wizard should reuse those systems where appropriate rather than creating a second hardware stack.

The normal user experience should answer only the questions a beginner actually needs:

1. **What are you playing?**
2. **How is it connected?**
3. **Can Family Music Quest hear/see it?**
4. **Are the expected notes arriving correctly?**
5. **Is the input clean enough to play?**
6. **Is this setup ready?**

---

# 2. UX Principles

## Child-facing first, diagnostics second

The default setup flow should use plain language and large obvious controls.

Prefer:

- `We can hear your guitar.`
- `Play the thick E string.`
- `Great — E is coming through clearly.`

Instead of:

- `RMS 0.018 / gate 0.012`
- `Autocorrelation confidence 0.82`
- `MIDI channel 1 Note On velocity 94`

Raw values may remain available under **Advanced Details**.

## Do not make setup feel like homework

A normal successful setup should take only a few minutes.

Avoid:

- long questionnaires;
- asking users to choose technical audio settings they do not understand;
- showing every device capability before it matters;
- forcing a complete calibration every time the app opens.

## Progressive disclosure

Show only the decisions needed for the selected instrument and connection type.

A Guitar user should not see MIDI sustain tests.

A MIDI Piano user should not be asked to calibrate microphone noise.

A future Bass user should not see Guitar-specific string instructions.

## Honest capabilities

The wizard must not claim the app verified something it cannot observe.

Examples:

- microphone Guitar setup can verify pitch/onset/level, not pick direction;
- microphone Piano setup is monophonic and should not claim chord validation;
- future Bass setup must not claim low E1 support until the detector actually supports it reliably;
- MIDI can verify Note On/Off, velocity, held-note polyphony, and sustain events when the device sends them.

## Never punish a child for hardware limitations

Where practical, use statuses such as:

- **Ready**
- **Ready with a note**
- **Needs attention**
- **Not available**

Avoid dramatic red failure screens for non-critical differences.

A user should be allowed to continue with a known-limited setup when doing so is safe and the limitation is explained honestly.

---

# 3. Entry Points

The guided setup should eventually be reachable from several places without duplicating its logic.

Recommended entry points:

### First use of an instrument

When a profile enters Guitar Quest, Piano Quest, or future Bass Quest for the first time and no usable input setup exists:

> **Set Up Your Instrument**

with a clear `Set Up Now` action and a secondary `Not Now` where the instrument has another usable input path.

### Instrument home screen

A persistent but unobtrusive action such as:

> **Input Setup**

### Hardware & Backup

Add a prominent child/parent-friendly option:

> **Guided Hardware Setup**

Keep the existing raw diagnostics/report area under something like:

> **Advanced Diagnostics**

### Gameplay recovery

If the active input disappears or becomes unusable during play, gameplay should provide a concise recovery route:

> `USB Guitar Input disconnected.`
> `Reconnect` · `Choose Another Input` · `Exit`

Do not silently switch to a different microphone in the middle of scored gameplay unless product behavior explicitly allows it.

---

# 4. Overall Wizard Flow

The wizard should be data-driven by instrument/input capability rather than implemented as three unrelated copies.

Conceptual flow:

```text
Choose instrument
      ↓
Choose connection method
      ↓
Request permission / connect device
      ↓
Confirm device identity
      ↓
Quiet-room / baseline check if audio input
      ↓
Play expected notes/strings/keys
      ↓
Validate signal + pitch/event behavior
      ↓
Optional timing/latency calibration when available
      ↓
Ready summary
      ↓
Save setup
```

The exact UI can be one panel with progress steps rather than separate pages.

---

# 5. Step 1 — Choose Instrument

If the wizard is launched from an instrument mode, preselect that instrument.

If launched from Hardware & Backup, show only currently supported visible instruments.

Current product:

- Guitar
- Piano

Future after Bass is actually released:

- Bass

Do not expose Bass merely because this specification exists.

Suggested copy:

> **What are you setting up?**
>
> 🎸 Guitar
>
> 🎹 Piano
>
> 🎸 Bass *(only after Bass Quest is released)*

---

# 6. Step 2 — Choose Connection Method

## Guitar

Recommended choices:

### USB / Direct Guitar Input

Use when the Guitar is connected through a USB guitar cable or audio interface.

Child-facing explanation:

> **Best choice when available.**
> Plug the guitar into your USB cable/interface so Family Music Quest hears the guitar directly.

### Chromebook Microphone

Use the internal/external microphone.

Explanation:

> Play where the Chromebook can hear your guitar or amp clearly.

Do not imply that the internal microphone is equivalent to a direct interface in noisy rooms.

## Piano

Recommended choices:

### USB MIDI Keyboard

Preferred when available.

Explanation:

> Family Music Quest receives the exact keys you press. This is the best option for chords and two-hand playing.

### Microphone

Explanation:

> Family Music Quest listens to one piano note at a time. This works for compatible melody practice but not full chord recognition.

### On-Screen Keyboard

No hardware setup required.

Explanation:

> Use the Chromebook screen to play notes. No microphone or cable needed.

## Future Bass

Choices should mirror Guitar where appropriate:

### USB / Direct Bass Input

Preferred.

### Chromebook Microphone

Fallback where physical testing shows acceptable results.

The UI must not appear until Bass Quest and its low-frequency detector are actually shipped.

---

# 7. Audio Device Permission and Selection

For Guitar/Bass/microphone Piano:

1. explain why microphone/audio permission is needed;
2. request browser permission only after the user chooses the audio path;
3. display the granted device name when available;
4. allow another device to be selected when the browser exposes multiple inputs;
5. remember the chosen device where the current product policy permits;
6. handle missing labels gracefully before permission is granted.

Suggested states:

### Before permission

> **Family Music Quest needs permission to hear your instrument.**
>
> Audio stays in the browser and is used for note detection.
>
> `Allow Audio`

### Permission granted

> ✅ **Input found**
>
> `USB Audio Device`

### Permission denied

> **We can't use this input yet.**
>
> Allow microphone/audio access in Chrome, then try again.
>
> `Try Again` · `Choose Another Method`

Do not trap the user in the wizard after permission denial.

---

# 8. Audio Signal Check

Before pitch tests, verify that useful signal is arriving.

The normal UI should show a simple animated level meter and status such as:

- `Too quiet`
- `Good level`
- `Very loud — turn down a little`

Do not show numeric RMS as the primary feedback.

Advanced Details may expose:

- RMS;
- peak;
- sample rate;
- channel count;
- noise suppression/echo cancellation/AGC state where available.

## Quiet baseline

For microphone/direct audio setups, collect a short quiet-room/input baseline using the existing calibration concept.

Suggested copy:

> **Stay quiet for a moment…**
>
> We're learning what the room/input sounds like when you are not playing.

Then:

> ✅ **Background level learned**

If the environment is unusually noisy:

> **This room is pretty noisy.**
>
> You can still try playing, but note detection may work better closer to the instrument or with a USB input.

Do not invent a universal hard failure threshold unless measured data supports one.

---

# 9. Guitar Guided Note Test

The Guitar path should validate the existing six-string configuration without becoming a full lesson.

Recommended sequence:

1. low E open;
2. A open;
3. D open;
4. G open;
5. B open;
6. high e open.

A faster setup may initially test low E, D/G region, and high e, with an optional **Check All Strings** path. However, the full-string test is preferable when calibration quality matters.

For each string:

> **Play the thick E string**
>
> `Waiting for E…`

On stable expected detection:

> ✅ **E sounds good**

If a neighboring/wrong pitch is stable:

> **We heard D♯ instead of E.**
>
> Check tuning, then try again.

If level exists but no stable pitch:

> **We can hear the guitar, but the note isn't clear yet.**
>
> Try one clean note and let it ring briefly.

If there is no onset/level:

> **We don't hear a note yet.**
>
> Check the cable/input or move closer to the microphone.

## Guitar acceptance observations

The wizard should internally be able to record useful observations such as:

- expected string/note;
- detected note;
- detected frequency;
- cents difference;
- signal level;
- onset seen;
- stable/scoreable status;
- retries.

The child does not need to see the raw record.

---

# 10. Future Bass Guided Note Test

Do not implement/expose this until Bass detection is real.

Bass setup should explicitly validate:

1. E1 — ~41.2 Hz;
2. A1 — 55.0 Hz;
3. D2 — ~73.4 Hz;
4. G2 — ~98.0 Hz.

The wizard must specifically identify octave errors.

Example:

> **Play the low E string.**

If the detector reports E2:

> ⚠️ **We hear E, but one octave too high.**
>
> Try another clean pluck. If this keeps happening, this input setup is not ready for reliable Bass scoring yet.

Do not mark Bass as Ready if E1 repeatedly resolves as E2.

USB/direct input should be recommended for the highest-quality Bass setup.

---

# 11. Piano MIDI Setup

The MIDI flow should feel substantially simpler than the raw diagnostic page.

## Connect

> **Plug in your MIDI keyboard, then tap Connect.**

If Web MIDI is unavailable:

> **MIDI isn't available in this browser/device.**
>
> You can use Piano microphone mode or the on-screen keyboard instead.

If connected:

> ✅ **MIDI keyboard connected**
>
> `[device name]`

## Basic key test

Prompt:

> **Play any key.**

Validate Note On.

Then:

> **Let go of the key.**

Validate Note Off.

## Velocity test

If velocity data is meaningful:

> **Play one soft note, then one stronger note.**

Do not fail setup if a basic controller sends fixed velocity. Mark it as a capability note.

Example:

> ✅ Notes work
>
> ℹ️ This keyboard does not appear to send different velocity levels. That's okay for normal beginner play.

## Polyphony test

> **Press two or three keys together.**

Confirm multiple held notes where supported.

This matters because Piano chord scoring depends on chord-capable input.

## Sustain test

If the user has a pedal:

> **Optional: press your sustain pedal.**

If no pedal is present, allow Skip.

Sustain is a capability check, not a requirement for basic readiness.

---

# 12. Piano Microphone Setup

Piano microphone mode must remain honest about monophony.

Recommended guided notes can span a beginner-safe range such as:

- C4;
- E4;
- G4;
- one lower/higher note if useful to validate range.

Copy:

> **Play middle C by itself.**

Then show simple pass/retry feedback.

Explicit note:

> **Microphone mode listens to one piano note at a time.**
> For chords and two-hand playing, use a MIDI keyboard.

Do not ask the child to play a chord as a microphone hardware test.

---

# 13. On-Screen Piano Setup

This should be nearly instant.

> ✅ **No hardware setup needed**
>
> Use the piano keys on the screen.

If useful, offer one test key to demonstrate that input is working, then finish.

---

# 14. Readiness Model

Avoid a single hidden boolean that masks useful distinctions.

Conceptually a setup result may contain:

```text
connection
permission/device
signal
calibration
pitch/event validation
polyphony capability
sustain capability
latency calibration status
warnings
last validated time
```

The exact schema should be designed against the implementation at the time of development.

User-facing summary should reduce this to a few understandable states.

## Ready

All capabilities required for the selected learning path are present.

Example:

> ✅ **Your guitar is ready!**
>
> USB Audio Device
>
> All six strings detected clearly.

## Ready with a note

Core play works, but an optional capability is missing.

Example:

> ✅ **Your MIDI keyboard is ready.**
>
> ℹ️ No sustain pedal was detected. You can add one later.

## Needs attention

A required part of scoring is unreliable.

Example:

> ⚠️ **We can hear the guitar, but pitch detection is unstable.**
>
> Try tuning the guitar, reducing room noise, or using a USB input.

## Not available

The chosen path cannot work on the current browser/device.

Example:

> **Web MIDI is not available here.**
>
> Choose Microphone or On-Screen Keyboard.

---

# 15. Save and Reuse Setup

The wizard should not run in full every session.

When a setup passes:

- remember the selected input where appropriate;
- preserve current per-player calibration policy unless a later storage decision changes it;
- remember enough device identity to recognize likely reconnects;
- record last successful validation time/version where useful;
- allow the user to rerun setup manually.

## Device identity versus player calibration

These are related but not identical.

A USB interface may be the same physical device for multiple profiles and instruments, while:

- noise calibration;
- instrument detection profile;
- future latency compensation;
- scoring preferences

may differ by player/instrument/device.

Do not prematurely collapse all of these into one global device record.

See `LATENCY_CALIBRATION_SPEC.md` for the separate timing-calibration model.

---

# 16. Latency Calibration Integration

The guided hardware wizard should reserve a natural place for future latency calibration but should not require it in the first wizard release unless the latency feature is ready.

Possible final setup step:

> **Timing Check — Optional**
>
> Make the game line up more closely with your device.

If implemented, route into the dedicated latency-calibration flow rather than hiding a timing offset inside basic noise calibration.

Keep separate concepts for:

- audio-input latency;
- MIDI input timing;
- backing/audio offset;
- visual strike-line offset.

Do not widen hit windows as a substitute for calibration.

---

# 17. Reconnection and Device Changes

Hardware can disappear while the app is open.

The setup system should define graceful behavior for:

- USB audio disconnected;
- MIDI keyboard disconnected;
- browser permission revoked;
- device ID no longer present;
- different default microphone after reboot;
- MIDI keyboard connected after the app starts.

## Outside gameplay

Show a concise status and allow reconnect/choose another input.

## During scored gameplay

Avoid silently substituting a different device in a way that changes scoring behavior.

Prefer:

> **Input disconnected**
>
> Gameplay paused.
>
> `Reconnect` · `Choose Another Input` · `Exit`

If the current engine cannot safely pause for input loss, document the limitation rather than pretending recovery is complete.

---

# 18. Advanced Diagnostics Relationship

The guided wizard should **not remove** the existing advanced Hardware & Backup tools.

Recommended eventual organization:

```text
Hardware & Backup

[ Guided Hardware Setup ]

Current setup
Guitar: USB Audio Device — Ready
Piano MIDI: Not connected

[ Advanced Diagnostics ]
[ Export Hardware Report ]
[ Backup / Restore ]
```

Advanced diagnostics should continue to expose values useful for project testing and support, such as:

- exact input device;
- sample rate;
- RMS/noise floor/gate;
- frequency/cents;
- onset;
- scoreability;
- MIDI event type;
- MIDI note/velocity/channel;
- held notes/polyphony;
- sustain;
- future performance/latency observations.

The wizard and diagnostics should consume the same underlying services wherever practical.

---

# 19. Report and Troubleshooting Output

After a guided setup, the user should be able to export or copy a support-friendly summary without exposing unnecessary complexity in normal play.

A future report can include:

- app version;
- platform/browser;
- player/profile identifier/name as current privacy policy permits;
- instrument;
- selected connection type;
- detected device label/id where available;
- sample rate;
- calibration summary;
- expected/detected guided notes;
- MIDI capability checks;
- warnings;
- future latency-calibration summary;
- timestamp.

Do not upload reports automatically. Current hardware validation is local/export-based and should remain privacy-respecting unless product policy explicitly changes.

---

# 20. Troubleshooting Guidance

Troubleshooting should be contextual rather than a giant FAQ.

## Audio input too quiet

Suggest:

- turn up guitar/interface output modestly;
- check cable/interface input gain;
- move acoustic instrument/amp closer to the Chromebook microphone;
- choose the intended audio device.

## Input clipping/too loud

Suggest lowering interface/amp/input level.

## Wrong Guitar pitch

Suggest:

- tune the string;
- play one clean note;
- let the note ring briefly;
- reduce room noise.

## Future Bass octave error

Suggest:

- direct USB input;
- clean single pluck;
- reduce excessive distortion/effects;
- retry calibration.

Do not suggest transposing the bass or pretending E2 is E1.

## MIDI not detected

Suggest:

- plug in before connecting;
- reconnect cable;
- choose the detected device;
- try Chrome/browser support path;
- fall back to another Piano input.

## MIDI notes work but chords do not

Use diagnostics to distinguish device/input limitation from gameplay regression.

---

# 21. Child UX and Accessibility

The wizard should work at Chromebook viewing distance and on touch.

Requirements:

- large buttons;
- short instructions;
- one primary task per step;
- high-contrast Ready/Warning states;
- icons plus text, not color alone;
- no tiny raw-value tables in the main flow;
- keyboard accessibility where practical;
- visible progress such as `2 of 5` without making the process feel long;
- Back/Exit always available except during very brief measurement windows;
- measurement steps cancellable safely.

Sound should never be the only feedback channel.

---

# 22. Suggested Initial Implementation Scope

The first guided-hardware release should stay focused.

Recommended initial scope:

### Guitar

- choose microphone vs USB/direct audio;
- permission/device selection;
- level check;
- quiet baseline/calibration;
- guided open-string validation;
- Ready summary;
- save/reuse setup.

### Piano

- choose MIDI vs microphone vs on-screen;
- MIDI connect;
- Note On/Off test;
- optional velocity/polyphony/sustain capability checks;
- microphone single-note setup;
- Ready summary.

### Shared

- Guided Setup entry from Hardware & Backup;
- preserve Advanced Diagnostics;
- save validation result;
- reconnect/choose-another-device flow where practical;
- automated tests for deterministic state/UX logic;
- physical Chromebook acceptance checklist.

Do **not** include Bass until Bass Quest is actually released.

Do **not** require latency calibration until that feature is implemented deliberately.

---

# 23. Later Enhancements

Possible later additions:

- Bass guided setup after Bass Quest ships;
- integrated latency calibration;
- automatic revalidation after meaningful device/browser changes;
- child-facing setup health indicator on instrument home screens;
- per-device history for families with several interfaces/keyboards;
- better capability-based recommendations;
- printable/exportable hardware report improvements;
- guided troubleshooting based on repeated failed test patterns.

Do not make these requirements for the first implementation.

---

# 24. Automated Test Expectations

Automated tests should focus on deterministic behavior, not pretend to validate physical acoustics.

Useful coverage includes:

- correct connection choices per instrument;
- Piano on-screen path requires no hardware permission;
- audio path requests/handles permission states correctly through mocked services;
- successful guided-note sequence advances appropriately;
- wrong-note/retry state does not falsely pass;
- MIDI Note On/Off capability state;
- MIDI polyphony capability state;
- sustain optional/skip behavior;
- Ready vs Ready-with-note vs Needs-attention classification;
- setup result persistence/profile isolation where applicable;
- disconnect flow state;
- advanced diagnostics remains accessible;
- instrument switching does not leak subscriptions;
- wizard cleanup stops owned audio/MIDI listeners;
- existing Guitar/Piano gameplay tests remain green.

Do not create brittle tests that depend on exact decorative wording unless the wording itself is an acceptance requirement.

---

# 25. Physical Chromebook Acceptance Matrix

Automated tests are insufficient.

## Guitar — internal microphone

Verify:

- permission flow understandable;
- intended microphone selected;
- quiet calibration completes;
- all six open strings can be validated;
- wrong string produces understandable retry;
- noisy room creates useful warning rather than nonsense pass/fail;
- setup persists and does not rerun unnecessarily;
- gameplay uses the validated setup.

## Guitar — USB/direct input

Verify:

- interface appears with understandable name where browser provides it;
- signal meter responds;
- low/high strings detect;
- unplug/reconnect behavior;
- returning to gameplay uses the intended interface.

## Piano — MIDI

Verify:

- keyboard can connect before launch and after launch;
- Note On/Off;
- velocity where supported;
- two/three-note polyphony;
- sustain pedal where present;
- disconnect/reconnect;
- fallback path when MIDI unavailable.

## Piano — microphone

Verify:

- single-note setup works;
- child-facing explanation clearly says microphone mode is one note at a time;
- no chord-capability claim.

## Shared

Verify:

- setup fits Chromebook viewport;
- Back/Exit works;
- no stale microphone capture after leaving setup;
- no stale MIDI subscriptions after leaving setup;
- profile switching does not show another player's calibration as the active player's setup unless the eventual schema deliberately shares device-level data;
- Advanced Diagnostics still works.

## Future Bass

When Bass is implemented, add:

- E1/A1/D2/G2 guided validation;
- explicit E1→E2 octave-error test;
- microphone and USB input;
- perceived latency;
- detector stability on fretted low notes.

---

# 26. Acceptance Criteria for the Feature

A guided-hardware release should not be considered complete until observable outcomes are met.

Good acceptance criteria:

> **A child can connect a Guitar through the Chromebook microphone or a USB audio interface, follow the guided open-string checks, and reach a clear Ready state without interpreting raw diagnostic values.**

> **A Piano player can connect a MIDI keyboard and verify notes/polyphony through a short guided flow, while microphone mode clearly communicates its monophonic limitation.**

> **Advanced diagnostics remain available for troubleshooting and use the same underlying input services rather than a separate duplicate hardware implementation.**

> **Leaving, cancelling, switching instruments, or disconnecting hardware does not leave stale audio capture or MIDI subscriptions active.**

Weak acceptance criteria:

- `Improve hardware UX.`
- `Make setup easier.`
- `Add device wizard.`

---

# 27. Non-Goals

Unless separately approved, the guided setup project should not become:

- a rewrite of the Guitar audio engine;
- a rewrite of Web MIDI;
- a native driver layer;
- cloud hardware-profile synchronization;
- a mandatory technical calibration before every session;
- an excuse to widen scoring windows;
- an automatic upload/telemetry system;
- Bass exposure before Bass Quest exists;
- a replacement for advanced diagnostics;
- a large settings redesign unrelated to input setup.

---

# 28. Relationship to Other Permanent Specs

Future agents implementing this feature must also read:

- `AGENTS.md`
- `PROJECT.md`
- `ARCHITECTURE.md`
- `TESTING.md`
- `RELEASE_PROCESS.md`
- `DECISIONS.md`
- `ROADMAP.md`
- `TECHNICAL_DEBT.md`
- `HARDWARE_VALIDATION.md`
- `LATENCY_CALIBRATION_SPEC.md`
- `BASS_QUEST_SPEC.md` when Bass work is relevant
- `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` when setup/input changes affect runtime performance

The implementation should be adapted to the actual repository state at that time rather than treating this document's conceptual state model as an immutable code schema.

---

# 29. Definition of Done

The guided hardware setup feature is done when:

- normal users can configure supported input without understanding diagnostics jargon;
- the wizard reuses established hardware/input services where practical;
- instrument-specific capability differences are represented honestly;
- successful setups can be reused without unnecessary repetition;
- failure/retry paths are understandable;
- input disconnect/cancellation cleanup is correct;
- Advanced Diagnostics remains available;
- relevant automated tests pass;
- real Chromebook microphone/USB/MIDI validation is performed;
- manual limitations are documented;
- no unsupported hardware capability is falsely presented as verified.
