# Family Music Quest — Test Debt Audit

This document records the current automated-test coverage of Family Music Quest and identifies the highest-value gaps.

It is a planning/source-of-truth document. It does **not** mean every missing test should be added immediately. Tests should be added when they protect meaningful behavior, especially when a focused release touches the affected system or fixes a historical regression.

The audit is based on the actual test commands and test files present in the repository, not on intended coverage described in old prompts.

## Coverage labels

- **Protected** — current automated tests exercise the important behavior directly enough to catch a likely regression.
- **Partially protected** — some supporting behavior is tested, but a major integration/lifecycle path is not.
- **Manual-only** — the requirement fundamentally depends on physical hardware, audible quality, visual readability, child usability or another environment that automation cannot credibly reproduce.
- **Missing/high-value** — important deterministic or browser behavior has little/no useful automated protection and is a strong candidate for future regression coverage.

A source-string assertion can be useful for release metadata or static wiring, but it is not equivalent to a behavioral browser test.

---

# 1. Current automated suite

`npm test` currently runs ten deterministic Node test files:

1. `practice-tools.test.js`
2. `midi-analysis.test.js`
3. `midi-validation.test.js`
4. `practice-intelligence.test.js`
5. `piano-songbook.test.js`
6. `guitar-songbook.test.js`
7. `piano-curriculum.test.js`
8. `gameplay-rules.test.js`
9. `ui-layering.test.js`
10. `pwa-assets.test.js`

`npm run test:browser` currently runs one Playwright file, `browser-tests/app-smoke.spec.js`, containing four browser tests.

`npm run check` performs syntax checks. It is useful release validation, but it is not behavioral test coverage.

---

# 2. Executive summary

## Strongest current protection

The current suite is strongest in deterministic music/scoring/data logic:

- Piano target-group/chord order correctness;
- duplicate Piano Note On rejection;
- microphone-safe monophonic Piano arrangement extraction;
- Guitar skipped-event exclusion from run accuracy;
- MIDI track analysis/classification/difficulty;
- Smart Practice deterministic speed progression;
- practice-loop boundary math;
- Piano Songbook structure, timing, polyphony, tempo metadata and rights metadata;
- Guitar Songbook string/fret/MIDI consistency, sections and rights metadata;
- Piano curriculum IDs/references/structure;
- release-version PWA asset-reference consistency.

## Weakest current protection

The current suite is weakest around systems that cross multiple modules or depend on browser/runtime lifecycle:

- profile switching/deletion and progress isolation;
- current-release Guitar/Piano progress persistence after actual gameplay;
- backup export/restore behavior and invalid/partial restore cases;
- real imported Guitar Pro player setup and AlphaTab synchronization;
- imported Piano MIDI browser flow beyond analysis helpers;
- A/B looping integrated with real player transport;
- service-worker install/update/activation behavior;
- true offline launch and offline Guitar playback dependencies;
- microphone/Web MIDI hardware-service lifecycle and reconnect behavior;
- one-and-only-one completion/result flow;
- accompaniment enable/mute/true-zero behavior in browser integration;
- session cleanup across profile/instrument changes during active runs.

These should not all be solved at once. Prioritize by release risk.

---

# 3. Coverage matrix — scoring and gameplay rules

| Behavior | Status | Current protection | Recommended action |
| --- | --- | --- | --- |
| Piano simultaneous notes form one target group | **Protected** | `gameplay-rules.test.js`; browser rule check | Keep permanent regression |
| Piano chord notes accepted in any order | **Protected** | deterministic tests plus browser-evaluated tracker | Keep permanent regression |
| Duplicate Piano Note On cannot satisfy same pitch twice | **Protected** | `gameplay-rules.test.js` | Keep permanent regression |
| Repeated same Piano pitch can satisfy successive targets | **Protected** | `gameplay-rules.test.js` | Keep |
| MIDI/on-screen Piano preserves polyphony | **Protected** at transformation layer | `gameplay-rules.test.js`, `piano-songbook.test.js` | Add browser-path coverage only when changing input/player integration |
| Piano microphone learner arrangement is monophonic | **Protected** | `gameplay-rules.test.js`, `piano-songbook.test.js` | Keep |
| Guitar skipped/pruned events excluded from accuracy | **Protected** at summary layer | `gameplay-rules.test.js` | When v2.6.4 changes event windows, add integration regression that proves skipped events never become misses |
| Guitar hit windows/onset scoring with real signal | **Manual-only / partial** | no physical signal automation | Keep physical validation; deterministic detector tests only if stable signal fixtures become credible |
| One completion/result flow per run | **Missing/high-value** | no direct completion-count regression in current suite | Add browser regression when next touching completion/restart lifecycle |
| Pause/restart/exit cannot allow stale callbacks to score later | **Partially protected** | Piano voice cleanup and Guitar countdown cancellation exercised in Playwright | Add targeted lifecycle test when touching run-token/cleanup code |

---

# 4. Coverage matrix — practice systems

| Behavior | Status | Current protection | Recommended action |
| --- | --- | --- | --- |
| A/B loop boundary normalization | **Protected** | `practice-tools.test.js` | Keep |
| Repeated loop boundary does not numerically drift | **Protected** | 100-repeat deterministic check | Keep |
| A/B loop integrated with Guitar/Piano transport | **Missing/high-value** | utility math only | Add one browser integration test per shared transport behavior when loop code is next changed |
| Count-in cancellation | **Partially protected** | Guitar browser test uses test API to start/cancel countdown | Extend to exit/restart/profile/instrument change when that lifecycle is touched |
| Smart Practice 3-success speed-up | **Protected** | `practice-intelligence.test.js` | Keep |
| Smart Practice deterioration step-down | **Protected** | `practice-intelligence.test.js` | Keep |
| Weakest-skill selection | **Protected** for current simple model | `practice-intelligence.test.js` | Extend when model changes |
| Current crude Trouble Spot time range | **Protected** only superficially | current test asserts a valid range, not musical quality | Replace/extend when `TROUBLE_SPOT_PRACTICE_SPEC.md` is implemented |
| Smart Practice integrated with actual song/section replay | **Missing/high-value** | no end-to-end browser coverage | Add when targeted practice flow is implemented |

---

# 5. Coverage matrix — Piano content and player

| Behavior | Status | Current protection | Recommended action |
| --- | --- | --- | --- |
| Piano Songbook IDs/counts/metadata | **Protected** | `piano-songbook.test.js` | Keep |
| Authored tempos remain intended | **Protected** | explicit tempo regression map | Keep |
| Velocity/articulation valid and deterministic | **Protected** | note-level assertions | Keep |
| Song phrases/measures valid | **Protected** | phrase and measure assertions | Keep |
| Public-domain rights metadata present | **Protected** | Songbook test | Keep |
| Listen First route launches | **Partially protected** | Playwright opens Twinkle Listen First | Add completion/audio cleanup only when player changes |
| Learn Melody route launches | **Partially protected** | Playwright phrase launch | Keep smoke coverage |
| Hands Together route launches | **Partially protected** | Playwright launch only | Chord scoring itself is protected separately; no need for fragile full-performance automation unless regression occurs |
| Wait for Me simple on-screen score | **Partially protected** | Playwright clicks C4 and expects score 50 | Expand only for historical regressions |
| Pause clears active Piano voices | **Protected** for tested path | Playwright polls active voice count | Keep |
| Accompaniment enabled/muted/true-zero volume | **Missing/high-value** | no direct browser test in current suite | Add deterministic/browser regression next time accompaniment transport is touched |
| Imported MIDI analysis/classification | **Protected** | two Node test files | Keep |
| Imported MIDI full browser import/track selection/section flow | **Missing/high-value** | analysis layer only | Add fixture-based browser test if a small legally safe synthetic MIDI fixture is practical |
| Physical MIDI chord timing/sustain/reconnect | **Manual-only** | browser automation cannot replace device validation | Keep hardware checklist |
| Piano microphone accuracy on real acoustic/electric piano | **Manual-only** | no credible browser synthetic replacement | Keep hardware testing |

---

# 6. Coverage matrix — Guitar content, imports and player

| Behavior | Status | Current protection | Recommended action |
| --- | --- | --- | --- |
| Guitar Songbook IDs/counts/metadata | **Protected** | `guitar-songbook.test.js` | Keep |
| Built-in string/fret maps to intended MIDI | **Protected** | explicit `openMidi + fret` assertion | Keep |
| Built-in phrase/section boundaries valid | **Protected** | Songbook test | Keep |
| Built-in public-domain rights metadata | **Protected** | Songbook test | Keep |
| Songbook Note Highway launch | **Partially protected** | Playwright verifies game screen and view class | Keep smoke test |
| Songbook Tab View phrase launch | **Partially protected** | Playwright verifies tab mode/title | Visual followability remains manual |
| Full Song imported Guitar Pro loading | **Missing/high-value** | no browser import/player fixture | After v2.6.4 settles, add a small legal synthetic/open fixture if practical; do not add copyrighted Coheed material |
| Guitar Pro track classification/selection | **Missing/high-value** at browser integration | current production behavior is not directly exercised by tests | Add focused deterministic importer tests if the parser surface can be isolated cleanly |
| AlphaTab selected-track muting | **Missing/high-value** | no direct automated integration | Add a deterministic integration seam/test when AlphaTab transport is next refactored |
| AlphaTab/game clock synchronization | **Manual-only + future instrumentation** | automation can inspect clocks, but audible/glitch acceptance still needs Chromebook | v2.6.4 diagnostics/benchmark first; only automate stable invariants afterward |
| Full Song scale/performance | **Manual-only** for release acceptance | no browser CI can represent Dell Chromebook audio/render load | Use `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` |
| Note Highway readability | **Manual-only** | launch test cannot prove readability | Human Chromebook test |
| Tab View readability | **Manual-only** | launch test cannot prove musical followability | Human Chromebook test |
| Microphone/USB Guitar note quality | **Manual-only** | actual device/room/input matters | Hardware test |
| Dense chord visual clarity | **Manual-only** | visual acceptance at playing distance | Human test |

---

# 7. Coverage matrix — profiles, storage and backup

| Behavior | Status | Current protection | Recommended action |
| --- | --- | --- | --- |
| First profile creation | **Protected** at smoke level | Playwright creates profile | Keep |
| Profile identity persists after reload | **Protected** at smoke level | Playwright reloads and sees saved identity | Keep |
| Profile switching | **Missing/high-value** | no current browser test switches between two saved profiles | Add browser test |
| Profile deletion | **Missing/high-value** | no current behavioral test | Add when profile manager is next touched |
| Guitar/Piano progress isolation between profiles | **Missing/high-value** | no current direct test | Highest-value storage regression after v2.6.4 |
| Current-release gameplay progress persists after reload | **Missing/high-value** | identity persistence is not progress persistence | Add instrument-specific save/reload assertions |
| Imported libraries remain device-shared while progress stays profile-specific | **Missing/high-value** | no integration test | Add if storage/import architecture is touched |
| Backup export includes supported profile/progress/calibration state | **Missing/high-value** | no behavior test | Add deterministic export-payload test |
| Valid current backup restore | **Missing/high-value** | no automated restore test | Add browser/unit test before backup feature expands |
| Invalid backup rejected | **Missing/high-value** | no automated test | Add alongside restore coverage |
| Storage/quota/interrupted restore failure | **Manual/specialized** | difficult to simulate realistically, but some failure injection is possible | Later reliability test, not immediate priority |

---

# 8. Coverage matrix — hardware services and diagnostics

| Behavior | Status | Current protection | Recommended action |
| --- | --- | --- | --- |
| Hardware & Backup opens above chooser | **Protected** only at wiring/layer level | static z-index/source checks plus Playwright open/close | Adequate unless overlay architecture changes |
| Diagnostics close cleanly | **Partially protected** | Playwright opens/closes panel | Keep |
| Microphone calibration calculation/storage | **Missing/high-value** | no direct test | Isolate deterministic calibration math if/when wizard work begins |
| Device ID reuse/selection | **Manual/partial** | browser permissions/device labels vary | Test state logic; keep physical device validation |
| Web MIDI Note On/Off parsing | **Missing/high-value** at service layer | gameplay target rules are tested, hardware service is not | Add synthetic MIDI-message unit tests if service API allows |
| Web MIDI velocity/polyphony/sustain state | **Missing/high-value** | diagnostics code records it, but no direct service test | Add before guided hardware wizard or MIDI-service refactor |
| Physical MIDI reconnect | **Manual-only** | depends on hardware/browser | Keep manual |
| Actual Guitar/Piano/Bass input quality | **Manual-only** | physical signal required | Keep manual |

---

# 9. Coverage matrix — PWA/offline/update

| Behavior | Status | Current protection | Recommended action |
| --- | --- | --- | --- |
| Release-version asset references match | **Protected** | `pwa-assets.test.js` source/static assertions | Keep |
| Service-worker registration URL uses current version | **Protected** statically | `pwa-assets.test.js` | Keep |
| App shell actually launches offline after install | **Missing/high-value** | no browser offline/service-worker behavioral test | Add focused Playwright offline test when PWA lifecycle work starts |
| New worker install/update detected | **Missing/high-value** | no behavioral lifecycle test | Add with update UX implementation |
| Update waits for safe boundary/user action | **Not implemented / future** | covered by `PWA_OFFLINE_UPDATE_SPEC.md`, not current tests | Test when implemented |
| One clean reload onto new version | **Not implemented / future** | none | Test with update UX |
| AlphaTab JavaScript available offline on clean install | **Manual/partial** | current worker lists external script but install failures are tolerated | Validate physically and later automate readiness where practical |
| AlphaTab soundfont available offline | **Manual-only/current gap** | soundfont is runtime external dependency | Follow `PWA_OFFLINE_UPDATE_SPEC.md` |
| Cache cleanup does not delete needed current assets | **Missing/high-value** | no behavioral worker test | Add with PWA lifecycle work |

---

# 10. Coverage matrix — visual, audio and child usability

These should **not** be converted into weak source-string tests merely to make the coverage table look greener.

| Requirement | Status | Correct validation |
| --- | --- | --- |
| Guitar Note Highway readable at playing distance | **Manual-only** | Dell Chromebook + real player |
| Guitar Tab View musically followable | **Manual-only** | dense/simple songs on Chromebook |
| String colors distinguishable in motion | **Manual-only** | visual human review, including accessibility modes later |
| Piano Listen First sounds coherent | **Manual-only** | human listening |
| Accompaniment balance | **Manual-only** | speakers/headphones + human review |
| Imported Guitar audio has no severe stutter | **Manual-only release acceptance** | benchmark on target Chromebook |
| Child understands next action | **Manual-only** | child usability observation |
| Real-input perceived latency | **Manual-only** | physical input/hardware calibration |

Automation may support these with diagnostics/screenshots/timing data, but it cannot approve them by itself.

---

# 11. Highest-value automated gaps

Prioritize these in roughly this order **when the relevant system is next touched**.

## Priority A — storage/profile correctness

1. **Two-profile progress isolation**
   - create two profiles;
   - earn/save Guitar or Piano progress on one;
   - switch profile;
   - prove progress does not leak;
   - switch back and prove it remains.

2. **Actual gameplay progress survives reload**
   - do not confuse profile identity persistence with instrument progress persistence.

These are high value because silent profile/save corruption would directly damage user trust.

## Priority B — run lifecycle correctness

3. **One completion/result flow per run**

4. **Exit/restart/profile/instrument switch invalidates stale run-owned callbacks**

These protect historical classes of bugs and shared lifecycle code.

## Priority C — backup integrity

5. **Current backup export payload**

6. **Valid current restore + invalid backup rejection**

Do this before expanding backup scope.

## Priority D — integrated practice transport

7. **A/B loop playback integration**

8. **Smart Practice section replay integration** when Trouble Spot work begins.

## Priority E — import/player integration

9. **Small legal imported MIDI browser fixture** for track/section launch if practical.

10. **Small legal/synthetic Guitar Pro fixture** for parser/track/player setup after v2.6.4 architecture settles.

Do not add copyrighted commercial-song fixtures.

## Priority F — hardware-service logic

11. Synthetic Web MIDI message/state tests.

12. Deterministic microphone calibration math tests.

These become especially valuable before implementing `HARDWARE_SETUP_WIZARD_SPEC.md`.

## Priority G — PWA lifecycle

13. Installed/offline app-shell Playwright test.

14. Update lifecycle tests when `PWA_OFFLINE_UPDATE_SPEC.md` is implemented.

---

# 12. v2.6.4-specific guidance

The paused/current v2.6.4 Guitar Player & String Engine Polish work should not be disrupted by this audit.

When that release is ready for review, the most relevant automated additions are those directly tied to its final implementation, such as:

- bounded/active-window event-selection invariants;
- configurable string-count calculations touched by the release;
- Tab View ordering/windowing behavior that can be tested deterministically;
- skipped Guitar events remaining excluded from scoring after windowing changes;
- cleanup/count-in regressions if touched;
- PWA release-version references.

Do **not** pretend Playwright on CI proves:

- Chromebook Full Song performance;
- audible AlphaTab stutter is fixed;
- Tab View is readable at playing distance;
- microphone/USB input feels correct.

Those remain physical acceptance items in `CHROMEBOOK_PERFORMANCE_BENCHMARK.md`.

---

# 13. Test-design rules

Future tests should follow these rules:

1. **Behavior over implementation strings.** Use source-string checks mainly for static release metadata/wiring where appropriate.
2. **One historical regression = one clear regression test** when a stable reproduction is practical.
3. **Do not mock away the thing being tested.** A transport test that never runs transport code proves little.
4. **Use tiny legal fixtures.** Imported-song tests must not commit copyrighted commercial songs/tabs/MIDI.
5. **Keep browser tests few and high-value.** The target hardware is slow; avoid hundreds of brittle end-to-end tests.
6. **Do not automate subjective approval.** Visual/audio/child-usability checks remain human responsibilities.
7. **No test-only architecture rewrite.** Create seams/helpers only when they also improve maintainability or make a meaningful invariant testable.
8. **Keep CI deterministic.** Avoid tests that depend on actual microphones, MIDI hardware, network CDNs or timing-sensitive audio output.
9. **Update this audit after major reliability/test releases.** Move items from missing/partial to protected only when the actual test exists.

---

# 14. Recommended next test-focused release/work package

Do **not** insert a broad test release ahead of the v2.6.4 physical blocker.

After v2.6.4 is completed and physically validated, a small reliability/test package is justified before or alongside larger roadmap expansion if the high-value gaps remain.

Best candidates:

- two-profile progress isolation;
- gameplay save/reload;
- one completion panel per run;
- backup export/restore validation;
- integrated A/B loop invariant;
- synthetic Web MIDI service-state tests.

This would increase confidence in shared foundations without becoming a rewrite or delaying Bass Quest for low-value coverage work.
