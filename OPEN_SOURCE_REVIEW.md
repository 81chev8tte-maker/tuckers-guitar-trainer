# Open-source reference review — v2.2

Family Music Quest remains an independently implemented, lightweight, offline-first application. No source code was copied from the projects below.

## Reference projects and licenses

| Project | License | Useful ideas reviewed | Decision for this pass |
| --- | --- | --- | --- |
| [Bach to Basics](https://github.com/gigliof/bach-to-basics) | MIT | Synced practice views, A/B loops, speed trainer, per-hand practice, count-in, render latency offset, MIDI parsing in a worker | Adopted only the clearer practice-speed steps and the principle of keeping analysis separate from gameplay. Full synchronization engine and backend features are too large for this pass. |
| [Piano Trainer](https://github.com/Floopdible/piano_trainer) | GPL-3.0 | Pitchy, Basic Pitch, Transkun, Kong, calibration and noise filtering | Research only. No GPL code copied. The 52 MB Transkun and 95 MB Kong models, plus 17 MB optional denoising assets, are inappropriate for the target Chromebooks/PWA today. |
| [PianoHero](https://github.com/7effrey89/PianoHero) | No license found | Worker preprocessing, visible-note windowing, optional WASM math, soundfont playback | Concepts only. Its GPU/worker pipeline is useful for future very large-song profiling, but Family Music Quest does not currently need that added weight. |
| [KeyMistry](https://github.com/Bumblebee-3/KeyMistry) | GPL-3.0 | Guided sections, Note-Wait, hand selection, per-loop feedback, latency offset and saved per-song practice state | Concepts only; no GPL code copied. It assumes Web MIDI hardware and intentionally blocks mobile, unlike this app's microphone-first approach. |
| [PickHero](https://github.com/Artemarius/PickHero) | MIT | YIN pitch tracking, separate onset detection, calibration, section history, Wait Mode and lightweight operation | Guitar Quest already uses independent pitch plus onset gating and has comparable practice controls. No detector change was justified without real USB-guitar measurements. |
| [guitar-audio-kit](https://github.com/kretoffer/guitar-audio-kit) | MIT | Browser pitch, multipitch and string-aware chord analysis | Research only. Promising for a controlled USB-input experiment; microphone chord claims need device testing before integration. |
| [String Sensei](https://github.com/manynames3/string-sensei) | No license found | Browser YIN detector, cents display and noise rejection | Supporting reference only. Guitar Quest already has these core ideas. |

## Feature-gap analysis

### Already implemented or stronger here

- Guitar and Piano experiences in one child-friendly, profile-aware PWA.
- Guitar Note Highway plus a dedicated Tab View and structured lessons.
- Piano falling notes, Wait for Me, Rhythm mode and adaptive keyboard range.
- Microphone-first play with on-screen fallback and future MIDI input abstraction.
- Guitar onset gating, pitch stability/noise thresholds, tuner and input test.
- Full-song and section practice, Guitar looping and tempo-aware Guitar backing playback.
- Local imported-song persistence and player-specific progress.
- Chromebook layout and offline service-worker caching.

### Small improvements shipped in v2.2

- MIDI tracks are described as likely melody, Piano part, accompaniment, bass/left hand or drums.
- Difficulty is calculated from note density, chord density, polyphony, range, jumps and tempo.
- The most microphone-friendly playable track is highlighted, with a plain-language reason.
- Manual track selection remains available.
- Imported songs retain the calculated role, difficulty and friendly practice traits.
- Piano practice speed now offers 50%, 60%, 70%, 80%, 90% and 100%.

### Medium improvements

- True A/B markers with per-loop feedback and an optional automatic speed ramp.
- Optional left/right track pairing for MIDI files with separate hand tracks.
- Count-in and metronome synchronized to Piano gameplay.
- Move parsing/analysis into a Web Worker if real-world files prove slow.

### Future research

- Real-time polyphonic microphone recognition.
- Automatic fingering and higher-confidence hand separation.
- Guitar chord/multipitch scoring from a clean USB interface.
- Full sample/soundfont backing playback.

## MIDI difficulty model

The v2.2 classifier is deliberately understandable rather than machine-learned. It considers:

- notes per second;
- percentage of simultaneous note groups;
- maximum notes sounding together;
- keyboard span;
- median and octave-sized jumps;
- tempo.

The recommendation favors mostly single-note tracks in a comfortable range at a moderate density. This makes it useful for microphone practice, but it is a suggestion—not a claim that the musical role was identified perfectly.

## Licensing conclusion

No external source code or assets were copied or bundled. GPL projects were used only to understand general practice concepts. The new MIDI analysis implementation was written independently for Family Music Quest, so this pass adds no third-party attribution or reciprocal-license requirement.
