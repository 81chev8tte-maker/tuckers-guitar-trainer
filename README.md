# Tucker's Guitar Quest

A free Chromebook-friendly PWA that teaches beginner electric guitar as a game.

## v0.4.0 — Synchronized Backing Instruments

- Imported song levels can play AlphaTab's synthesized backing instruments
- The selected guitar track is muted so the player supplies that part
- The note highway follows AlphaTab's MIDI-tick clock to stay aligned through tempo changes
- Backing playback follows the selected 50–100% game speed
- Pause, resume, stop, section range and backing volume are shared with the game
- Backing can be disabled for silent note-highway practice

## v0.3.0 — Imported Song Levels

- Guitar Pro / MusicXML files can now be turned into falling-note song levels
- Detects playable six-string guitar tracks from the imported score
- Track picker for multi-track files (for example Guitar 1 / Guitar 2)
- Automatically splits a song into 8-bar practice sections
- 50%, 60%, 75%, 85% and 100% game-speed choices
- Riff mode keeps the lowest/root note when a beat contains a chord
- Lead mode keeps the highest/melody note when a beat contains a chord
- Uses the imported file's string, fret and pitch data, including alternate tuning when supplied
- Song sections earn score, accuracy, combo, stars and XP
- Next Section and Retry flow after a song run
- Versioned app assets and a network-first service worker make future GitHub Pages updates much less sticky

## Existing game features

- Falling-note Guitar Hero/Rocksmith-style beginner missions
- Live microphone / USB audio-input pitch detection
- Hit, miss, timing, combo, accuracy, score, XP and 1–3 star ratings
- Tab Decoder world teaches tablature while the player performs it
- Live six-line tab strip mirrors every falling note
- Guitar-input test, tuner, metronome and chord reference
- Local song library stored in IndexedDB

## Song-game beta limitation

The current microphone pitch detector scores one pitch at a time. When an imported beat contains several simultaneous notes, v0.3 simplifies that beat to either the lowest note (Riff mode) or highest note (Lead mode). Full chord / power-chord recognition is a later step.

Imported song files are never bundled with or uploaded by this app. They remain in the browser on the device.
