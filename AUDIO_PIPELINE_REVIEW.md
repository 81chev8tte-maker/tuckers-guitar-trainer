# Audio pipeline review — v2.4.0

Both production detectors currently acquire analyser buffers and run amplitude/pitch work on the main thread. Guitar uses a 2,048-sample autocorrelation frame plus envelope-based onset gating about every 42 ms. Piano uses a 4,096-sample autocorrelation frame with confidence, stability, debounce and duplicate suppression about every 85 ms.

An AudioWorklet was investigated but is intentionally not shipped in this release. Moving buffer acquisition, RMS/noise-floor tracking and onset preprocessing is technically appropriate in current Chrome, but changing the production timing boundary before physical Chromebook baselines exist would make regressions harder to distinguish from hardware variability. The current analyser path remains the fallback design.

A later isolated experiment should move only RMS/envelope/onset preprocessing to a worklet, retain the existing pitch algorithms, use one AudioContext per active input, and compare dropped frames, CPU time and detection latency on Dell Chromebook 3100, Android Chrome and desktop Chrome. It must fall back when `audioWorklet` is unavailable and prove cleanup across pause, exit, restart, instrument switching and profile switching.

## v2.6.15 / Issue #40 — fundamental-selection investigation

Baseline: `04621a9` (v2.6.14 plus tester-role documentation). Before production changes, `piano-fundamental.test.js` called the existing `MicrophonePianoInput.detectPitch()` and `processCandidate()` on 80 generated cases: C/D/E/F/G in octaves 3 and 4; 44.1/48 kHz; pure fundamental or four harmonics `[1,.7,.4,.2]`; peak scale .04/.2. **56/80 failed** the fundamental/emitted-note expectation. These are deterministic equivalents, not recordings of Nova or Tucker.

Representative unchanged-detector findings:

| Signal | Sample rate | Winning lag | Reported Hz | Relationship |
| --- | --- | --- | --- | --- |
| C3 +3 cents | 48000 | 1099 | 43.6761 (F1) | approximately 3 periods |
| C4 +6 cents | 48000 | 1097 | 43.7557 (F1) | approximately 6 periods |
| C4, concert tuning | 44100 | 1517 | 29.0705 | approximately 9 periods |
| C4, concert tuning | 48000 | 367 | 130.7902 (C3) | approximately 2 periods |
| G4, concert tuning | 44100 | 225 | 196.0000 (G3) | approximately 2 periods |
| G4, concert tuning | 48000 | 1347 | 35.6347 | approximately 11 periods |

Root cause demonstrated: normalized autocorrelation repeats at integer multiples of a periodic waveform. The original global maximum over **integer sample lags** favors whichever multiple happens to align best with the sampling grid. For C4/48 kHz, the true period is 183.4683 samples: correlation at lag 183 is .9998721, but lag 367 reaches .9999977. The lower alias can pass the unchanged confidence, cents and three-frame stability gates. This explains a credible mechanism consistent with the physical reports, without claiming the exact physical waveform was captured or every real error has the same cause.

### Narrow correction

Keep the existing normalized correlation calculation and search range. Store correlations in a reusable bounded `Float64Array`, then select the **earliest local peak** whose three-point parabolic peak estimate is within **.002** of the global sampled maximum and whose measured correlation still exceeds the unchanged .68 confidence gate. Requiring a local peak avoids selecting the initial zero-lag shoulder. Refine the selected lag by at most half a sample using the same neighboring correlations. Return the selected **measured** confidence, not an inflated/interpolated confidence, and the continuous frequency, not a snapped MIDI pitch.

Interpolating peak height matters: a preliminary raw-peak-only comparison still selected multiples on several upper beginner-range rich signals. In the 288-case C3–B5/44.1–48 kHz/four-timbre control sweep, the largest interpolated fundamental-peak deficit relative to the sampled global maximum was approximately .000528 (B5, 44.1 kHz, seven harmonics). The .002 comparison tolerance accommodates those discretization residuals; it is not a relaxed scoreability threshold. Ambiguous or missing fundamentals and real mixed/room signals are not guaranteed by these fixtures.

Unchanged: 4096-sample analyser; 85 ms cadence; RMS > .012; measured confidence > .68; ±45-cent gate; three stability frames; history reset/median behavior; 330 ms debounce; monophony; #29 lifecycle/input intent; scoring windows; MIDI/on-screen/Guitar behavior; saves and report transfer. No dependency or second detector was introduced. A true F1 is still recognized as F1.

### Validation and cost boundary

The final Node suite covers 379 pitch/gate cases, 20 evolving phase/decay streams through production `tick()`, and silence/quiet/seeded-noise/unstable/low-confidence/cents/debounce controls. Browser coverage checks actual C3/C4 Wait for Me scoring with generated detector output and honest wrong-D rejection.

A local Node comparison used the unchanged baseline and corrected detector, the same 4096-sample four-harmonic C4/48 kHz signal, 15 warmups each and 60 interleaved calls each: median **15.996 ms before / 15.994 ms after**, mean **17.068 / 17.221 ms**. These noisy desktop/container measurements do not establish Chromebook performance or latency acceptance. The expensive correlation search is unchanged; the added peak scan is linear in at most 2048 lags and its storage is reused. No analyser/cadence increase was made.

Physical retest remains mandatory under `HARDWARE_VALIDATION.md`. #40 must remain Needs Hardware Test after deployment until the Project Manager accepts the actual Dell Chromebook + keyboard-speaker path.
