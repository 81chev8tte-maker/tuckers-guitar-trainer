# Family Music Quest physical validation

Record the device, browser version, selected input, date, and actual result for every test. Automated tests cannot validate physical microphone or MIDI behavior.

## Guided in-app acceptance (v2.6.7)

Start from **Hardware & Backup → Run Hardware Test**. The guided flow records technical observations while the child follows plain-language prompts. It reuses the production Guitar audio service and shared Web MIDI service; it does not change scoring/detector thresholds or replace the manual checks below.

Recommended order:

1. run Guitar audio if Guitar hardware is available;
2. run Piano MIDI if MIDI hardware is available;
3. answer the five Human Observations questions;
4. open Report and use **Copy Report** or **Export JSON**;
5. attach the report to the release-acceptance notes.

The guided quiet baseline is measurement-only. USB/MIDI disconnect/reconnect, Piano microphone, perceived latency, audio smoothness and child usability remain manual Monday evidence.

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
