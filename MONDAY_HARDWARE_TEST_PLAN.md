# Family Music Quest — Monday Hardware Test Plan

This document turns the existing hardware/performance requirements into a practical real-device session for the product owner and child testers.

It is intended for the Dell Chromebook 3100-class target device and complements `HARDWARE_VALIDATION.md` and `CHROMEBOOK_PERFORMANCE_BENCHMARK.md`.

The goal is not to make children interpret diagnostics. The goal is to let them **play normally, say what feels wrong, and expose the measurements only to the adult tester**.

---

# 1. Session goals

The Monday session should answer five questions:

1. Can a child get from launch to playing without adult troubleshooting?
2. Does Guitar input work reliably through the intended microphone/USB path?
3. Does Piano input work reliably through microphone/on-screen/Web MIDI paths that are actually available?
4. Is Guitar gameplay readable and responsive on the target Chromebook?
5. Does v2.6.8 preserve the v2.6.6/v2.6.7 gameplay and guided-test behavior while making the evidence easy to move from Chromebook to phone?

Do not turn the session into a long technical endurance test for the children. Use short rounds and let the adult handle diagnostic captures between them.

---

# 2. Roles

## Current primary child tester

**Tucker is the primary child hardware/usability tester for both Guitar Quest and Piano Quest**, including Piano microphone and future physical MIDI acceptance when the relevant hardware is available.

This is a tester-role change only. It does not weaken, remove, or reinterpret any Guitar, Piano, Chromebook/PWA, wake-lock, report-transfer, scoring-trust, readability, musical-feel, microphone, USB, or MIDI acceptance requirement.

Evidence provenance matters:

- record future Tucker runs as Tucker-tested;
- preserve historical Nova-tested evidence as Nova evidence;
- do not claim Nova-specific usability evidence when Nova did not perform the test;
- adult-only observations must remain labeled as adult observations.

For future printable/manual Hardware Test Quest materials, organize one Tucker-centered checklist/passport covering both Guitar and Piano rather than separate Tucker/Guitar and Nova/Piano sheets.

## Child tester

The child tester should mainly answer:

- “Was it easy to know what to do?”
- “Could you tell which note/string/key was next?”
- “Did anything feel late, jumpy or confusing?”
- “Did the app say you were wrong when you thought you were right?”
- “Did the song/game feel fun enough to keep playing?”

Do **not** ask the child to read FPS, cents, sample rate, event counts, drift or device IDs.

## Adult tester

The adult tester records:

- version/commit;
- Chromebook/Chrome/PWA mode;
- selected input;
- song/track/view/speed;
- diagnostic measurements;
- exact reproduction steps for failures;
- screenshots/video only where useful;
- whether a problem was child-observed, adult-observed, or both.

---

# 3. Before the child tester starts

Record:

```text
Date:
Child tester:
FMQ version/commit:
Chromebook model:
Chrome version if practical:
Installed PWA or browser tab:
Battery/charger state:
Headphones/speakers:
Guitar input device:
Piano input device:
Network connected/disconnected:
```

Then:

- restart/reopen the app cleanly;
- confirm the intended build is loaded;
- verify the correct player profile exists or create a temporary test profile;
- make sure no previous game is still active;
- have the instrument/cable/keyboard connected as intended for the first run;
- keep the complex local Guitar Pro stress file available, but do not upload it to the repository.


## 3A — Run the in-app guided hardware acceptance

Before the longer gameplay matrix, open **Hardware & Backup → Quick Hardware Tests**. Keep each child-facing round short.

- Tucker can run **Test Guitar Microphone** with the real guitar/amp and follow the quiet, six-string, repeated-note and silence prompts.
- Tucker can run **Test Piano Microphone** with the real electronic keyboard speaker → Chromebook microphone path and follow the one-note-at-a-time C4–D4–E4–F4–G4 plus repeated-C4 prompts.
- Tucker can run **Test MIDI Keyboard** when a real MIDI keyboard is actually available; otherwise leave it not performed.
- Answer the five short Human Observations questions without coaching the child toward an expected answer.
- Record **Adult help required** (0 / 1 / 2+).
- Ask the child whether the game usually agreed with what they thought they played (**Yes / Mostly / No / unsure**).
- Add an optional verbatim child comment, short tester/context note, and screenshot/video filenames when useful.
- Explicitly choose **PASS / BLOCKER / NOT DECIDED**; diagnostics never choose this automatically.
- After the short questions, use **Send Report to Parent** and verify the physical ChromeOS share sheet/Gmail path where supported.
- Confirm the parent receives an understandable report/attachments.
- Use **Copy Project Report** and **Download JSON** only as fallbacks when native transfer does not work.

Screenshots remain supplemental evidence for visual/readability problems. Short external phone video is preferred for stutter, audio glitches, perceived latency or timing problems. FMQ stores only evidence filenames/labels, not the media itself.

The guided report is evidence collection, not automatic acceptance. Continue with the manual Guitar/Piano/gameplay checks below, including disconnect/reconnect, Piano microphone, perceived delay, audio smoothness, Highway/Tab readability and normal save/profile behavior.

---

# 4. Child-facing score card

After each short run, ask only these five questions.

Use:

- ✅ Good
- 😐 Okay / unsure
- ❌ Bad / confusing

| Question | Rating |
| --- | --- |
| I knew what I was supposed to do | |
| I could see the next note clearly | |
| The game reacted when I played | |
| The music/game felt smooth | |
| I would keep playing this | |

Optional child comment:

> “What was the weirdest or hardest part?”

Do not lead the answer by telling them what bug you expect.

---

# 5. Guitar test — setup and note detection

## G1 — Launch/setup

Child task:

> Open Guitar Quest and get ready to play.

Observe:

- can the child identify Guitar Quest;
- is the selected input obvious enough;
- any permission prompt confusion;
- any need for adult intervention;
- tuner/input status clarity.

Adult result:

```text
PASS / NEEDS WORK
Notes:
```

## G2 — Open strings

Play each standard open string several times:

- low E
- A
- D
- G
- B
- high E

Test:

- normal pluck;
- soft pluck;
- louder pluck;
- repeated same note;
- mute between notes.

Record any:

- missed detection;
- wrong octave/note;
- obvious lag;
- false onset;
- room-noise false positive.

## G3 — Fretted notes

Use a small spread of low/middle/higher frets rather than exhaustive neck coverage.

Include:

- at least one note on every string;
- repeated same-fret notes;
- a simple string change;
- one small chord/dense shape if the current scoring mode supports the passage honestly.

## G4 — Noise rejection

Try briefly:

- silence;
- talking;
- muted-string tap;
- pick scrape;
- body knock/tap;
- wrong note followed by correct note.

The app should not score obvious non-note noise as a correct target.

---

# 6. Guitar test — built-in control

Use one built-in Guitar Songbook piece such as **Ode to Joy** as the lightweight control.

Run:

1. Note Highway at 100%;
2. Tab View at 100%;
3. one reduced-speed run if useful.

Child questions:

- Can you tell which string to use?
- Can you read the fret number quickly enough?
- Can you follow Tab View without guessing where you are?
- Is OPEN unmistakable?
- Do chords/dense shapes make sense?

Adult observations:

- obvious frame hitch;
- note jumps;
- visual clutter;
- timing/scoring mismatch;
- count-in behavior;
- exit/restart cleanup.

---

# 7. Guitar test — imported Full Song blocker

Use the same complex local Guitar Pro file used during the original failure.

This remains the primary gameplay/performance acceptance case. v2.6.8 only extends the guided measurement/reporting and local transfer layer; it does not replace this Full Song run.

Follow the matrix in `CHROMEBOOK_PERFORMANCE_BENCHMARK.md`:

| Run | Range | View | Backing | Input | Speed |
| --- | --- | --- | --- | --- | --- |
| B1 | short section | Highway | on | on | 100% |
| B2 | Full Song | Highway | on | on | 100% |
| B3 | Full Song | Tab | on | on | 100% |
| B4 | Full Song | Highway | on | diagnosis-only off | 100% |
| B5 | Full Song | Highway | off | on | 100% |
| B6 | Full Song | Highway | on | on | 70% |

For the child, only ask whether:

- the song sounds smooth;
- notes move smoothly;
- the app feels late;
- Tab/Highway can be followed.

For the adult, capture available diagnostics around:

- beginning;
- dense passage;
- several minutes in if practical;
- first glitch/hitch.

A short section being smooth does **not** clear the Full Song blocker.

---

# 8. Guitar test — controls/lifecycle

Short checks:

- pause/resume;
- restart;
- exit during count-in;
- A/B loop if available;
- section replay;
- speed change;
- backing volume/mute;
- switch instrument/profile after exiting.

Expected:

- no stale countdown;
- no stale audio;
- no duplicate completion/result;
- no scoring after exit;
- no stuck backing/player state.

---

# 9. Piano test — child flow

Use the actual input available on Monday.

## P1 — launch

Child task:

> Open Piano Quest and start an easy lesson/song.

Observe whether the child understands:

- where Piano Quest is;
- which practice mode to choose;
- whether input is active.

## P2 — simple note play

Test:

- single notes;
- repeated notes;
- small scale/stepwise passage;
- Wait for Me;
- Rhythm mode if appropriate.

## P3 — MIDI-specific checks if a keyboard is connected

Test:

- Note On/Off;
- soft/hard velocity;
- interval;
- triad;
- larger chord if appropriate;
- chord notes in different physical arrival orders;
- sustain pedal;
- unplug/replug if safe and supported.

Expected:

- chords do not require a specific arrival order;
- duplicate Note On does not cheat a chord;
- sustain state does not wedge the app;
- reconnect does not require unexplained refresh where Chrome supports reconnect.

## P4 — microphone-specific checks if used

Treat microphone Piano as monophonic.

Do not judge it as though it should recognize arbitrary chords.

Check:

- intended single notes;
- wrong-note rejection;
- repeated-note response;
- obvious octave errors;
- room-noise false positives.

---

# 10. Piano musical/readability check

Use one familiar built-in Songbook piece.

Try:

- Listen First;
- Learn Melody;
- Hands Together only if MIDI/on-screen input makes it appropriate;
- a phrase section;
- reduced speed.

Ask the child:

- Can you tell what key/note is next?
- Do the falling notes line up with when you think you should play?
- Is the accompaniment helping or distracting?
- Is anything too small or too busy?

Adult checks:

- completion appears once;
- pause/exit clears voices;
- accompaniment mute/zero behaves;
- progress saves.

---

# 11. Profile/save smoke test

After normal play:

1. exit cleanly;
2. return home;
3. switch profiles if a second test profile is available;
4. confirm progress does not visibly leak;
5. switch back;
6. reload/reopen the app;
7. confirm current-version progress remains.

Do not perform destructive restore/reset during the child tester's normal session unless intentionally testing it later.

---

# 12. Installed/offline smoke test

If the PWA is installed:

1. launch normally online;
2. close it;
3. temporarily disable network;
4. relaunch;
5. verify built-in Guitar/Piano content opens;
6. record whether imported Guitar backing can actually play offline.

Do not label imported Guitar playback offline-ready if the AlphaTab/soundfont dependency fails.

Restore network afterward.

---

# 13. Failure capture template

For any meaningful failure, record:

```text
Title:
Version/commit:
Child tester:
Profile:
Instrument:
Input:
Song/file:
Track:
Section/Full Song:
View:
Speed:
Backing:

Steps:
1.
2.
3.

Expected:
Actual:
Child noticed it? yes/no
Adult noticed it? yes/no
Reproducible? always/sometimes/once
Diagnostics/screenshot/video:
```

Prefer one precise failure report over ten vague comments.

---

# 14. Release decision after Monday

Classify findings:

## BLOCKER

Examples:

- severe Full Song audio stutter remains;
- scoring is materially wrong;
- input regularly fails;
- app crashes/hangs;
- save/profile corruption;
- Tab/Highway is unusable for the intended child;
- serious Piano regression.

A blocker should normally produce one focused maintenance release before Bass expansion.

## SHOULD FIX SOON

Examples:

- noticeable but non-blocking readability issue;
- occasional setup confusion;
- mild performance hitch;
- poor wording/visual hierarchy.

Can be scheduled based on dependency/risk.

## ACCEPTABLE / FOLLOW-UP

Minor polish that does not undermine learning or reliability.

If Monday clears the v2.6.6 gameplay/hardware gate while v2.6.8 reporting/sharing remains healthy, the project can seriously consider moving to the Bass Quest foundation described in `BASS_QUEST_SPEC.md`.

---

# 15. Keep the session child-friendly

- Use short test rounds.
- Let the child tester actually play, not only watch the adult debug.
- Ask open questions before revealing the expected bug.
- Stop a test when frustration replaces useful feedback.
- Do diagnostic isolation runs after the child-facing run when possible.
- Treat “I can’t tell what I’m supposed to hit” as a real product failure even if the code is technically correct.
