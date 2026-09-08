# Family Music Quest physical validation

Record the device, browser version, selected input, date, and actual result for every test. Automated tests cannot validate physical microphone or MIDI behavior.

## Guided in-app acceptance and report transfer (v2.6.8)

Start from **Hardware & Backup → Run Hardware Test**. The guided flow records technical observations while the child follows plain-language prompts. It reuses the production Guitar audio service and shared Web MIDI service; it does not change scoring/detector thresholds or replace the manual checks below.

Recommended order:

1. run Guitar audio if Guitar hardware is available;
2. run Piano MIDI if MIDI hardware is available;
3. answer the existing five Human Observations plus scoring-trust, adult-help and adult PASS/BLOCKER/NOT DECIDED fields;
4. add optional child/tester notes or screenshot/video filenames when useful;
5. open Report and prefer **Send Report to Parent**; choose the intended native share target such as Gmail and confirm the prepared report/attachments before sending;
6. verify the recipient receives an understandable report plus structured evidence through the real Chromebook share path;
7. if native sharing is unavailable or a target does not preserve the prepared evidence, use **Copy Project Report** and **Download JSON** as local fallbacks.

Send Report to Parent and Download JSON use the same structured Hardware Validation report object. The parent-transfer action also prepares the full human-readable Project Report and, where supported, a readable text companion. Native share destinations and target-specific handling are controlled by ChromeOS/the selected app; FMQ does not promise Gmail or any other target will preserve every share field until that path is physically verified, and FMQ does not upload or send the report itself.

The guided quiet baseline is measurement-only. USB/MIDI disconnect/reconnect, Piano microphone, perceived latency, audio smoothness, child usability and actual ChromeOS share-sheet behavior remain manual Monday evidence.

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
