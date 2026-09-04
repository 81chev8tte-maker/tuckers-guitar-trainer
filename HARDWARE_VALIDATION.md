# Family Music Quest physical validation

Record the device, browser version, selected input, date, and actual result for every test. Automated tests cannot validate physical microphone or MIDI behavior.

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
