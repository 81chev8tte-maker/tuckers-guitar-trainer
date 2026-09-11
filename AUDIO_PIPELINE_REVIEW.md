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

## v2.6.17 / Issue #40 — remaining octave-selection investigation

Baseline: v2.6.16 main `36a672d` (detector unchanged from PR #42). The authoritative adult real-keyboard/Dell Chromebook evidence in #40 is **a physical failure**, not pending first acceptance: C4 was 4/4 correct; C3 was 3/9 correct, 3/9 C4, and 3/9 without a stable note; Two-Hand Steps also produced C2. F1 was not observed. The separate Quick Piano C4–G4 PASS does not cover C3. #43/#44's v2.6.16 workflow prerequisite has since physically passed.

### Reproduction before production changes

`piano-octave.test.js` and the extended original FMQ generator were committed before changing `piano.js`. They execute the production class/tick/input gates, not a copied detector. The existing 379-case suite and 18 browser tests passed on the baseline. The new suite has 816 static signal trials plus evolving/transition/rejection streams (2,630 assertions). **352/816 static trials failed** on v2.6.16; the full suite had 1,005 failed assertions, including related pitch, emission and stability checks. Those assertion counts are not counts of independent physical attempts.

Reproduce against an extracted baseline file:

```bash
git show 36a672d:piano.js > /tmp/fmq-piano-v2.6.16.js
FMQ_INVESTIGATE=1 FMQ_PIANO_SOURCE=/tmp/fmq-piano-v2.6.16.js node piano-octave.test.js
node piano-octave.test.js
```

`FMQ_INVESTIGATE=1` prints failures without asserting success; normal `npm test` never uses that mode.

| Generated C3 case | v2.6.16 | v2.6.17 |
| --- | --- | --- |
| 48 kHz; partial gains `[.03,1,0,.3]` | 261.6625 Hz / C4, confidence .99823 | 130.8127 Hz / C3, confidence .999997 |
| 44.1 kHz; gains `[1,.7,.4,.2]`, noise .5, seed/phase 1 | 65.4998 Hz / C2, confidence .88435 | 130.6922 Hz / C3, confidence .88315 |
| Six changing frames, fundamental gain alternating .028/.036, other gains `[1,0,.3]` | C4/C3 alternate; no stable emission | C3 every frame; emission after the unchanged third frame |

Noise is seeded uniform broadband noise scaled by the fixture amplitude; it is not a recording or measured Chromebook noise spectrum. Both .04 and .12 amplitude scales are tested. Weak odd-partial tests also include added noise and a missing first partial with a present third partial. A waveform with only even harmonics correctly remains the actual upper tone; the detector must not manufacture an absent lower octave.

### Mechanisms and narrow correction

The old fixed **.002** comparison allowance has two distinct limitations:

1. On very clean signals it is too permissive: C3's half-period interpolated peak is .998372 while the full-period peak is .99999997. The difference contains meaningful weak odd-harmonic evidence, but fits inside .002, so the earlier C4 peak wins.
2. With noise, overlap lengths differ between lags. A longer lag can match that finite noise sample slightly better. The fixed allowance can be too small to retain the clear fundamental. This is not just the old integer sampling-grid failure.

Keep the normalized correlation calculation, local-peak search, parabolic lag refinement and selected **measured** confidence. Replace only the fixed comparison allowance with:

- a local estimate of quadratic-interpolation error from five existing correlation samples: `abs(thirdDifference)/16 + abs(fourthDifference)/128 + 1e-7`; the denominators follow the maximum cubic/quartic interpolation remainder factors over a half-sample shift;
- plus **10% of the best sampled peak's residual mismatch**, `.1 * max(0, 1-best)`, so noise allowance shrinks toward zero for clean periodic input.

The five-point calculation is an estimate, not a rigorous uncertainty bound for arbitrary audio. At search edges without five samples, retain the previous .002 interpolation allowance. The 10% residual allowance is a detector-selection heuristic supported by the generated noise controls, not a statistically calibrated confidence score or a change to the .68 confidence gate.

A rejected experiment used only the smaller interpolation allowance. It passed the old clean suite but regressed noisy controls: at noise scales .003/.01, 11/80 and 44/80 trials selected the wrong octave/period versus zero baseline failures. This is why merely tightening a constant is insufficient. The residual-aware comparison recovered those controls and the new octave suite without changing scoreability gates.

### Validation, cost and limits

The final new suite passes all 816 static trials and 2,630 assertions, including C3–G3/C4–G4, weak/even/upper partials, normal/reduced level, seeded noise, attack/decay, evolving phase/partial gain, C3↔D3/C4, genuine F1/C2–G2, absent fundamental, quiet, excessive noise and off-centre rejection. The old fundamental suite remains required. Browser coverage feeds weak-fundamental C3 into Find Lower C / Wait for Me and noisy C3 into Two-Hand Steps / Rhythm, while genuine C2 and C4 remain wrong for C3. Normal Rhythm's on-time 100 points and Wait's 50 points remain unchanged.

Local Node timing: 15 warmups each, then 60 interleaved calls each, alternating weak-partial/noisy C3 buffers at 48 kHz. Median **9.961 ms before / 9.819 ms after**, mean **10.108 / 9.997 ms**. This noisy container comparison supports no material added cost; it is not a claimed performance win or Chromebook latency acceptance. No additional correlation pass, analyser-size/cadence increase, dependency, or workspace allocation was added.

**Unchanged:** 4096 samples, 85 ms cadence, RMS > .012, measured confidence > .68, ±45 cents, three stable frames, history handling, 330 ms debounce, C3 support, monophony, #29 lifecycle, scoring, MIDI/screen keys, Guitar, saves, PWA behavior and reports (apart from release version).

**Limits:** These are reproducible equivalents, not a capture of the failing keyboard waveform. Some first attack buffers still propose an upper octave without becoming stable; the unchanged stability gate prevents emission in those tested streams, and the following three agreeing frames recover C3. Strong interference/modulation is not solved generally: an exploratory C3 signal with 20% amplitude modulation at 30 Hz still preferred a longer recurrence. Weak odd energy buried beneath noise remains ambiguous. Do not force a target/octave to conceal these limitations. Actual keyboard timbre, room response and retry burden must be judged in the real retest; if C3 still fails, capture controlled source/key evidence before expanding the detector work.
