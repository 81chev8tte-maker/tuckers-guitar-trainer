# Family Music Quest physical validation

Record the device, browser version, selected input, date, **actual child tester**, and actual result for every test. Automated tests cannot validate physical microphone or MIDI behavior.

## Current primary child tester

**Tucker is the primary child hardware/usability tester for both Guitar Quest and Piano Quest**, including Piano microphone and future physical MIDI acceptance when the relevant hardware is available.

This changes the tester, not the acceptance standard. Keep all existing Guitar, Piano, Chromebook/PWA, wake-lock, report-transfer and child-usability requirements. Record future evidence truthfully as Tucker-tested when Tucker performs it, preserve historical Nova-tested evidence as Nova evidence, and do not infer Nova-specific usability conclusions from Tucker's runs.

## Guided in-app acceptance and report transfer (v2.6.16)

Start from **Hardware & Backup → Quick Hardware Tests**. The child-facing flow records technical observations while the child follows plain-language prompts. It reuses the production Guitar audio service, the production monophonic Piano microphone detector, the shared Web MIDI service, and the existing Hardware Validation/report-transfer system; it does not change scoring/detector thresholds or replace the manual checks below.

The three guided paths accumulate under one visible session ID. After saving the questions, choose **Test Another Input** to retain earlier completed paths; **Start New Test Session** is the explicit, confirmed reset. Previously recorded human answers reload when another path is added and must be reviewed so their recorded/reviewed timestamps and covered-path provenance remain truthful.

Recommended order:

1. run **Test Guitar Microphone** if Guitar hardware is available;
2. run **Test Piano Microphone** for Middle C (C4), nearby D4–E4–F4–G4, and the same Middle C again when Piano microphone is being evaluated;
3. run **Test MIDI Keyboard** if real MIDI hardware is available;
4. answer the existing five Human Observations plus scoring-trust; adult/helper context remains distinct and the overall adult result stays NOT DECIDED unless an adult deliberately changes it;
5. add optional child/tester notes or screenshot/video filenames when useful;
6. use **Send Report to Parent**; choose the intended native share target such as Gmail and confirm the prepared report/attachments before sending;
7. verify the recipient receives an understandable report plus structured evidence through the real Chromebook share path;
8. if native sharing is unavailable or a target does not preserve the prepared evidence, use **Copy Project Report** and **Download JSON** as local fallbacks.

### v2.6.16 / #43 + #44 post-deployment acceptance

On the adult-operated Dell Chromebook, confirm the app visibly reports v2.6.16, then intentionally start one clean Quick Hardware Test session.

1. Record the displayed session ID. Complete **Test Guitar Microphone**, save truthful human answers/context, then choose **Test Another Input**.
2. Confirm the same session ID remains and Guitar stays visibly **Complete**. Complete **Test Piano Microphone** without starting a new session.
3. Verify the first prompt identifies **Middle C** as the white key immediately left of the two black keys near the middle. Verify D/E/F/G remain in that same area and the final prompt clearly requests the same Middle C again.
4. Review the reloaded session-level human answers so they describe the combined run, then save. In both Project Report and downloaded JSON, verify Guitar and Piano are complete, the same session ID is retained, their evidence is present, and only genuinely unperformed guided paths (for example MIDI when unavailable) are listed.
5. If a MIDI keyboard is available, use **Test Another Input**, complete MIDI, review/save the answers again, and verify all earlier results remain. If unavailable, do not simulate or mark MIDI performed.
6. Activate **Start New Test Session**, confirm the warning, and verify a different session ID with Guitar/Piano/MIDI all **Not run**. Do not overwrite or double-count repeated exports of the earlier session ID.

Record wording ambiguity, disappeared completion state, changed session ID before explicit reset, missing consolidated evidence, incorrect `testsNotPerformed`, or provenance that does not clearly cover the accumulated paths as blockers. Automation does not pass these physical/usability checks. Keep #43 and #44 at `status:needs-hardware-test` until the Project Manager accepts the evidence.

Send Report to Parent and Download JSON use the same structured Hardware Validation report object. The parent-transfer action also prepares the full human-readable Project Report and, where supported, a readable text companion. Native share destinations and target-specific handling are controlled by ChromeOS/the selected app; FMQ does not promise Gmail or any other target will preserve every share field until that path is physically verified, and FMQ does not upload or send the report itself.

The guided quiet baselines are measurement-only. Completing the guided Piano microphone path truthfully records that short monophonic C4–G4/repeated-C4 hardware check; it does **not** certify Piano gameplay modes, chord recognition, calibrated latency or perceived responsiveness. USB/MIDI disconnect/reconnect, perceived latency, audio smoothness, child usability and actual ChromeOS share-sheet behavior remain physical evidence.

## Guitar on the Chromebook

- Internal microphone; USB microphone/audio input when available
- Six open strings and fretted notes in low, middle, and high regions
- Quiet/loud notes, repeated notes, and rapid alternate picking
- Silence, talking, room noise, muted strings, body taps, and pick scrape
- Wrong-note rejection followed by the correct note
- Note Highway, Tab View, imported song, loop, reduced speed, count-in, pause/resume
- Disconnect/reconnect the selected USB input

For every guided note record expected/detected note, frequency, cents, onset indication, acceptance, and observed response time. The diagnostics report intentionally does not invent physical end-to-end latency.

## Piano on the Chromebook

- MIDI keyboard connected before launch and after launch
- Note On/Off, repeated notes, soft/hard velocity, scale, intervals, triads, larger chords, rapid streams, sustain
- Unplug/replug without refresh where Chrome supports it
- Lessons, Wait for Me, Rhythm, imported MIDI, loop, speed, pause/resume, and profile switching
- Microphone single-note input separately from MIDI
- During active Guitar/Piano practice or an active guided hardware test, leave hands off the Chromebook long enough to cross the normal dim timeout and confirm the display remains awake; after exit/Home, confirm normal system dim/sleep is allowed again. Record this as physical evidence only — automation cannot approve it.

## Release result

Attach the exported Hardware Validation JSON and note any browser permission or device-label limitations.

## v2.6.15 / #40 — Tucker’s focused Piano microphone retest

Use the real electronic keyboard’s speaker → Dell Chromebook **internal microphone**, one key at a time. Confirm the app shows **v2.6.15**, select Tucker’s profile, and record the keyboard sound/volume, placement, Chrome/PWA version and actual tester. Keep the normal setup comparable to the earlier failure. An adult can point out C3 (one octave below middle C) and C4 (middle C).

1. Open **Piano Quest → Mic Test → Enable Microphone**. Play C3 five separate times, then C4 five times. Hold each briefly and release between attempts. Record the displayed stable note and any extra attempts needed; do not count an old label during silence as a new stable detection.
2. Alternate **C3 → D3 → C3 → D3** and **C3 → C4 → C3 → C4**, repeating each sequence twice.
3. Play **C3, D3, E3, F3, G3**, then **C4, D4, E4, F4, G4**, two rounds each. G4 is an explicit control because Tucker’s pre-fix test required many retries.
4. Repeat steps 1–3 at a **somewhat softer but clearly audible** keyboard level. This is not a requirement to recognize sound below the noise gate. Note the changed volume; avoid changing several setup variables at once.
5. Play one short **Wait for Me** run: **Lessons → Level 4 — Left Hand → Find Lower C → Start Practice**. Confirm microphone input is selected; this existing exercise contains repeated C3. Record any `Almost! Heard … · Find C3`, particularly F1/other stable low aliases.
6. Play one short **Rhythm** run: **Songs → Two-Hand Steps → Rhythm Mode · Full Part**. This existing monophonic piece begins C3–D3–E3–F3 and then moves to C4–D4–E4–F4. Confirm microphone input is active. Record wrong detections separately from simply playing late.
7. Optionally run **Hardware & Backup → Quick Hardware Tests → Test Piano Microphone** for structured C4–G4/repeated-C4 evidence. This guide does not cover C3 and does not replace steps 1–6. Use existing report-copy/download options and record manual notes/video references alongside the report.

For each round record: normal/softer level, intended note, **stable wrong note(s)** (including frequency/cents when readily available to the adult), attempts/retries and whether C3/C4 need materially more attempts than neighboring notes. Ask Tucker whether the game’s feedback felt trustworthy. A short phone video can capture a stable wrong detection that would otherwise disappear.

Acceptance means trustworthy recognition, not zero retries ever. Silence/attack transitions and occasional retries must be distinguished from repeated confident aliases. Keep #40 open at **status:needs-hardware-test** until the Project Manager judges this physical evidence. No hardware PASS is claimed by the generated-signal or browser tests. Historical Nova evidence remains Nova-tested evidence.
