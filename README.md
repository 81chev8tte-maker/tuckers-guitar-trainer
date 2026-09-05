# Family Music Quest

## v2.6 Piano Songbook & Real Music

- Fixes Hardware & Backup so it opens above the instrument chooser before either instrument is initialized
- Adds a built-in offline Piano songbook with five newly authored FMQ arrangements of public-domain melodies
- Rewrites all six Level 7 originals as 20–24 measure arrangements with intros, contrasting phrases, bass/harmony and cadential endings
- Adds exact beat positions and simultaneous notes to built-in arrangements without changing imported MIDI parsing
- Adds Listen First, Learn Melody, Left Hand, Right Hand and Hands Together choices where arrangements support them
- Keeps microphone play monophonic by assigning the melody to the learner while the app supplies accompaniment
- Allows on-screen/Web MIDI play to receive simultaneous notes; USB MIDI can be connected from gameplay
- Documents source and rights research in [PUBLIC_DOMAIN_MUSIC.md](PUBLIC_DOMAIN_MUSIC.md)

No third-party MIDI files, recordings, or modern arrangements are bundled. Physical Chromebook, acoustic-piano microphone, and USB-MIDI validation remain manual acceptance tests.

## v2.5 Piano Curriculum v2

- Keeps all existing Piano lesson IDs and completed-progress references intact
- Separates quick exercises, 20–40 second mini-songs, 45–70 second full songs, and concert checkpoints
- Adds seven musical checkpoints: First Melody, Five-Finger Concert, Rhythm Challenge, Left-Hand Challenge, Two-Hand Concert, C Major Concert, and Final Celebration Concert
- Expands Level 7 to six original pieces using repeated phrase forms rather than tiny note drills
- Uses explicit beat timing for quarter notes, half notes, rests, and introductory eighth notes
- Adds measure numbers, phrase labels/boundaries, skill tags, hand markers, and finger guidance metadata
- Adds optional Listen First playback through the normal falling-note stage with animated keys and no scoring
- Adds Learn, Practice, Perform, and Master assistance levels without duplicating song definitions
- Adds deterministic curriculum validation for IDs, references, timing, durations, hands, fingers, measures, phrases, and assistance modes

The course introduces C/F/G harmonic roots conservatively. Microphone lessons remain single-note compatible; reliable simultaneous chord scoring still requires Web MIDI. The app does not attempt to detect which physical finger was used.

## v2.4 hardware and practice-intelligence foundation

- Production Guitar microphone diagnostics plus actual granted device/audio settings
- Shared Web MIDI service and live Note On/Off, velocity, polyphony and sustain diagnostics
- Per-player calibration records and exportable local hardware reports
- Versioned profile/progress backup and validated restore (imported song files excluded)
- Compact rolling skill-history and deterministic Smart Practice controller logic
- Inferred left/right-hand selection for imported Piano parts
- GitHub Actions regression CI and physical Chromebook validation checklist
- AudioWorklet investigation retained the current production detector as the safe fallback

Generated MIDI accompaniment and the fully wired multi-speed Smart Practice session UI remain staged follow-up work; see `AUDIO_PIPELINE_REVIEW.md`.

## v2.3 practice tools

- A/B practice looping in imported Guitar and Piano gameplay
- Tempo-based four-beat count-in with a saved per-player preference
- Clean per-repeat note, scoring, animation and timing resets
- Count-in tempo follows imported MIDI tempo changes at the loop start
- Realistic deterministic MIDI validation covering melody, bass, drums, unnamed tracks, chords and dense accompaniment
- No microphone, onset-gating or polyphonic-ML changes

## v2.2 open-source review and MIDI learning analysis

- Analyzes every imported MIDI track using note density, range, jumps, chords, polyphony and tempo
- Labels likely melody, Piano, accompaniment, bass/left-hand and drum parts in kid-friendly language
- Recommends the most microphone-friendly practice track while preserving manual selection
- Saves difficulty and practice traits with imported Piano songs
- Adds 50%, 60%, 70%, 80%, 90% and 100% Piano practice speeds
- Adds no ML models, runtime CDN dependencies or copied external code
- See [OPEN_SOURCE_REVIEW.md](OPEN_SOURCE_REVIEW.md) for the feature-gap and licensing analysis

A free Chromebook-friendly PWA that teaches children Guitar and Piano as one family game. Each local player can use both instruments while keeping independent progress.

## v2.1.0 — Player Profiles

- Renames the instrument experiences to neutral Guitar Quest and Piano Quest
- Adds a quick two-step first-run player setup with name, avatar and accent colour
- Supports multiple local players, profile switching, editing and confirmed deletion
- Stores independent Guitar and Piano progress inside each active player profile
- Keeps imported Guitar and Piano song libraries shared on the device
- Retires the old development progress keys only once when the first profile is created
- Preserves both gameplay engines, microphone tools, imports and offline PWA behaviour

## v2.0.2 — Piano Refinement & Learning Path

- Replaces repeated browser completion dialogs with one guarded in-app result panel
- Cancels stale Piano animation frames, timers and input subscriptions on restart or exit
- Scopes gameplay and Mic Test key highlights to their own visible keyboards
- Retains imported Piano notes across the full A0–C8 MIDI range
- Adds Beginner Range and adaptive Song Range, including section-specific fitting and auto-follow for very wide songs
- Expands the Piano path to 33 short lessons across seven organized levels
- Adds short lesson introductions with a highlighted starting key
- Expands microphone analysis toward the practical Piano range while retaining conservative stability filtering

## v2.0.0 — Piano Quest

- Adds a top-level Guitar/Piano chooser while preserving Guitar v1.0
- Adds a responsive C3–B5 piano keyboard and falling-note play screen
- Adds forgiving Wait for Me lessons and timed Rhythm Mode
- Uses one input-event contract for microphone, screen keys and future Web MIDI hardware
- Adds stabilized single-note microphone pitch detection and a child-friendly Mic Test
- Adds separate Piano lessons, song library and saved progress
- Imports standard `.mid` and `.midi` files with track preview, tempo, timing and note duration
- Keeps Piano imports in a separate IndexedDB database from Guitar Pro songs
- Supports Full Song and 30-second section practice for longer Piano songs

### Piano v2.0 limitations

- Microphone scoring intentionally recognizes one piano note at a time; chords are retained in imported data but accurate chord scoring is reserved for future USB/MIDI input
- Imported notes across A0–C8 are retained; wide songs use adaptive Song Range
- The built-in Piano player shows and scores the selected part; full multi-track accompaniment is a future pass

## v1.0.0 — Guided Practice

- Adds a three-step Today’s Practice session with warm-up, review and recommended skill work
- Adds automatic input calibration and remembers the chosen microphone or USB guitar interface
- Adds optional adaptive note density, post-run weak-note coaching and feedback placed on the relevant string lane
- Keeps manual difficulty controls and all existing song, lesson, audio, progress and offline features

## v0.9.0 — Six-String Play Lanes

- Replaces the perspective fret grid in Note Highway with six large horizontal string lanes that match standard tab order
- Moves notes right-to-left toward one vertical strike line with large string and fret/open labels
- Shows chords as aligned stacks across their required string lanes and sustains as horizontal hold ribbons
- Keeps the perspective-free Tab View, imports, timing, audio detection, progress and lesson content intact

## v0.8.0 — Readable Beginner Highway

- Makes every incoming note a large two-line instruction showing both the string and either `OPEN` or the fret number
- Highlights the required string and fret lane for the next note and presents that instruction prominently above the highway
- Hides the supplemental live tab during Note Highway play to give the main game substantially more Chromebook screen space

## v0.7.0 — Fretboard Runway

- Replaces the six Guitar Hero-style columns with spatial fret lanes and a dedicated open-string area
- Adds a moving five-fret hand-position window, beat/measure guides and a compact six-string strike zone
- Enlarges beginner note targets, shortens sustain ribbons and gives the highway more room on Chromebook screens
- Preserves the v0.6 lesson course, Learn Tabs mode, importing, backing audio, looping and saved progress

## v0.6.0 — Learning Highway

- Adds a perspective six-string Note Highway with consistent string colours, chord shapes, open-note rings, sustain trails and technique badges
- Adds a dedicated Learn Tabs section while preserving the playable flat Tab View
- Remembers Note Highway or Tab View and offers a compact split-tab strip during play
- Adds eight stages of imported-song difficulty plus manual 50%, 75% and 100% note density
- Adds looping, early/late/wrong-note feedback and a virtualized 32-note tab window for smooth full songs
- Expands the built-in course from 35 to 50 missions with player setup, tuning, power chords, strumming and techniques
- Preserves IndexedDB imports, `tgq-progress-v2` progress, section/full-song play, AlphaTab backing and offline caching

## v0.5.0 — Beginner Curriculum & Chromebook Fit

- Expands the lesson map from 15 to 35 free missions across seven progressive worlds
- Adds rhythm, alternate picking, rests, fretting control, riff building, recovery and song-readiness practice
- Collapses lesson setup and compacts the gameplay HUD on short Chromebook screens once play begins
- Lets imported tabs run as either focused 8-bar sections or a complete song level

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
