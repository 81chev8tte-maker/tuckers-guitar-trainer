# Family Music Quest physical validation

Record the device, browser version, selected input, date, and actual result for every test. Automated tests cannot validate physical microphone or MIDI behavior.

## Guided in-app acceptance and report transfer (v2.6.8)

Start from **Hardware & Backup → Run Hardware Test**. The guided flow records technical observations while the child follows plain-language prompts. It reuses the production Guitar audio service and shared Web MIDI service; it does not change scoring/detector thresholds or replace the manual checks below.

Recommended order:

1. run Guitar audio if Guitar hardware is available;
2. run Piano MIDI if MIDI hardware is available;
3. answer the existing five Human Observations plus scoring-trust, adult-help and adult PASS/BLOCKER/NOT DECIDED fields;
4. add optional child/tester notes or screenshot/video filenames when useful;
5. open Report and use **Copy Project Report** for the Project Manager chat;
6. use **Share Test Report** to invoke the native file share sheet when supported, or **Download JSON** as the local fallback;
7. move the JSON to the Android phone and attach it to the Family Music Quest Project for technical analysis.

Share Test Report and Download JSON serialize the same structured Hardware Validation report object. Native share destinations are selected by ChromeOS; FMQ does not promise a particular target such as Quick Share and does not upload the report itself.

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

## Release result

Attach the exported Hardware Validation JSON and note any browser permission or device-label limitations.
