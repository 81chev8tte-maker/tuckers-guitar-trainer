# Family Music Quest — Bass Quest Curriculum and Content Plan

This document defines the planned learning path, content types, original groove direction, checkpoint structure, and built-in music approach for Bass Quest.

It complements `BASS_QUEST_SPEC.md`. It is planning/source-of-truth documentation only and does **not** authorize Bass implementation before the shared Guitar/string-player foundation is ready.

## Curriculum identity

Bass Quest should teach a child to become a beginning **bass player**, not merely to press the same frets as Guitar Quest on four lanes.

The course should repeatedly connect three ideas:

1. **Where is the note?** — string, fret, tab, root, fifth, octave.
2. **When does it happen?** — pulse, rests, eighth notes, repeated patterns, kick-drum relationship.
3. **How should it feel?** — clean attacks, controlled ringing, muting, consistency, groove.

The learning loop should be:

> **Learn one idea → play a short drill → use it in a groove → use it in music → checkpoint.**

Bass Quest should feel more rhythm- and groove-centered than Guitar Quest while remaining beginner friendly.

## What the app can and cannot verify initially

Initial microphone/USB-audio Bass scoring is expected to verify primarily:

- pitch;
- note onset/timing;
- rests/no-note periods to the extent the current engine supports them;
- completion/accuracy/combo;
- string/fret targets when the intended tablature position is known.

The app may **teach** these without pretending to detect them perfectly:

- alternating index/middle fingers;
- pick direction;
- left-hand finger choice;
- muting technique;
- ghost-note quality;
- articulation nuance;
- posture;
- hand relaxation.

Guidance must be phrased honestly. For example:

> "Try alternating index and middle fingers."

is valid even when the detector cannot identify which finger was used.

Do not award a special "perfect alternating fingers" badge unless the input system can actually observe that behavior.

---

# Content Types

Bass Quest should use several distinct content types rather than making every lesson the same length.

## Skill Drill

Very short focused exercise, usually 10–25 seconds.

Purpose:

- introduce one mechanical/tab/rhythm concept;
- allow quick retry;
- minimize cognitive load.

Examples:

- four open E notes;
- E → A string changes;
- fret 0/2/3 recognition;
- quarter-note pulse.

## Mini Groove

Approximately 20–40 seconds.

Purpose:

- repeat a small musically useful bass pattern;
- teach consistency and pulse;
- make practice feel like music rather than a test.

A Mini Groove should contain intentional form such as A/A/B/A or two contrasting phrases rather than one tiny cell copied until the timer is satisfied.

## Drum Lock

Rhythm-focused practice with a locally generated or otherwise legally safe drum pulse.

Purpose:

- teach relationship between bass and kick drum;
- make rhythmic placement obvious;
- build the concept of "the pocket."

Drum Lock should progress gradually from exact kick/root alignment to simple independent eighth-note patterns.

## Bass Line

A longer authored line, usually 30–60+ seconds, combining several learned skills.

It should have musical phrases and a clear ending.

## Song Arrangement

A complete claimed public-domain section/piece or a developed FMQ original arrangement.

Bass parts should behave like bass when appropriate. Do not force every recognizable melody into the bass register simply because it is easy to encode.

## Checkpoint / Gig

A world-ending performance that combines previously taught skills and introduces little or no brand-new technique.

The player should feel:

> "I can actually play something now."

Checkpoints should be replayable and suitable for Smart Practice.

---

# Assistance Progression

Bass Quest can borrow the philosophy of Piano's assistance ladder without copying Piano UI literally.

Suggested levels:

## Learn

- strong string color/label guidance;
- fret/open label;
- optional note name;
- generous preview;
- Wait-like behavior only where musically appropriate;
- explanatory tip before play.

## Practice

- standard highway/tab;
- speed controls;
- section practice;
- normal scoring;
- some note/string help.

## Perform

- reduced coaching;
- full rhythm flow;
- mistakes do not stop the song;
- musical backing/drum pulse where appropriate.

## Master

- minimal assistance;
- intended performance tempo;
- standard scoring/mastery target.

Do not make "Master" mandatory for basic progression if that would frustrate a beginner.

---

# Proposed Bass Quest Worlds

The exact IDs and final lesson counts should be chosen during implementation after inspecting the post-v2.6.4 shared player. The structure below defines learning intent rather than hard-coded data format.

## World 1 — Low-End Launchpad

**Goal:** Understand what the bass is, identify the four strings, read the first tab numbers, and play a steady pulse.

### 1. Meet the Bass

Type: orientation + Skill Drill

Teach:

- Bass has four standard strings for this course;
- low to high: E, A, D, G;
- bass usually supports rhythm and harmony;
- the player does not need chords to make real music.

Playable material:

- four open E notes at a slow quarter-note pulse.

### 2. Four Lines = Four Strings

Type: Learn Tabs + Skill Drill

Teach normal bass-tab order:

```text
G|----------------
D|----------------
A|----------------
E|----------------
```

Explain that the lowest-pitched/thickest E string appears at the bottom of tab.

### 3. Zero Means Open

Type: Skill Drill

Material:

- open E;
- open A;
- E/A alternating pattern.

### 4. Numbers Mean Frets

Type: Skill Drill

Introduce frets 2 and 3 on E/A.

Keep hand movement small.

### 5. The Low Pair — E and A

Type: Mini Groove

Use a simple two-string groove built from open, fret 2, and fret 3.

### World 1 Checkpoint — **First Low-End Groove**

Type: Checkpoint / Mini Groove

Target:

- 25–35 seconds;
- E/A strings;
- open + frets 2/3;
- quarter-note pulse;
- clear A/B/ending structure.

No new concepts.

---

## World 2 — Four-String Navigator

**Goal:** Add D/G strings and learn to cross the full instrument without losing the pulse.

### 1. Meet the D String

Open D and frets 2/3.

### 2. Meet the G String

Open G and nearby frets.

### 3. Climb the Strings

E → A → D → G and back.

Focus on looking ahead in Tab View/Highway.

### 4. String Crossing

Use non-adjacent but beginner-safe string changes.

Avoid speed as the main challenge.

### 5. Read the Whole Staff

Short four-string tab phrase mixing opens and low frets.

### World 2 Checkpoint — **Four-String Run**

Type: Bass Line

Target:

- 30–40 seconds;
- all four strings;
- simple fret movement;
- quarter-note timing;
- no advanced rhythm yet.

---

## World 3 — Pocket Builder

**Goal:** Make rhythm central to Bass Quest.

### 1. Quarter-Note Engine

Type: Drum Lock

Play one root on every beat over a simple drum count.

### 2. Meet the Kick

Type: Drum Lock

Start with kick on beats 1 and 3.

Player hits the root with the kick.

### 3. Eighth Notes

Count:

> 1 and 2 and 3 and 4 and

Use repeated low E/A notes.

### 4. Rests Matter

Teach intentional silence.

The groove should sound wrong if every rest is filled.

### 5. Alternating Fingers

Teach index/middle alternation as guidance.

The score should still be based on pitch/timing, not imagined finger detection.

### World 3 Checkpoint — **Lock In**

Type: Drum Lock + Mini Groove

Target:

- quarter and eighth notes;
- simple rests;
- clear kick alignment;
- E/A/D movement;
- approximately 35–45 seconds.

This should be the first checkpoint where "groove" is more important than fret difficulty.

---

## World 4 — Clean Note Workshop

**Goal:** Make notes start and stop cleanly.

### 1. Press Behind the Fret

Teach clean fretting position and avoiding excessive squeeze.

### 2. Stop the Ring

Teach basic left/right-hand muting conceptually.

Playable pattern includes deliberate rests after held notes.

### 3. One String at a Time

String-crossing pattern where unused strings should stay quiet.

The app need not claim it can detect every sympathetic ring.

### 4. Long vs Short

Teach held notes and shorter separated notes using visible sustain lengths.

### 5. Pick Option

Optional technique lesson.

Teach relaxed alternate pick strokes for players who prefer a pick.

Do not make pick playing mandatory.

### World 4 Checkpoint — **Clean Machine**

Type: Bass Line

Use:

- sustained notes;
- intentional rests;
- string changes;
- mixed quarter/eighth rhythm.

A successful performance should sound controlled rather than merely accurate in pitch.

---

## World 5 — Root Runner

**Goal:** Teach what the bassist is playing *for* harmonically.

### 1. What Is a Root?

Explain simply:

> The root is the home note of the chord. Bass players often make that home note feel strong.

### 2. Find Roots on E

Introduce useful natural/root locations on the E string.

Do not attempt to teach the entire fretboard at once.

### 3. Find Roots on A

Same concept on A string.

### 4. Follow the Chord Changes

Show a simple chord/root sequence visually, for example C → F → G, while the player supplies roots.

Do not require the child to form the Guitar/Piano chord.

### 5. Drum Lock: Roots

Kick pulse + changing roots.

### World 5 Checkpoint — **Root Rider**

Type: Song-like Groove

A developed FMQ original using a simple harmonic loop and a distinct ending.

The child should finish knowing that Bass can follow harmony without playing a chord shape.

---

## World 6 — Shape Shifter

**Goal:** Add movable bassist-friendly interval shapes.

### 1. Root + Fifth

Teach the sound and simple physical relationship.

### 2. Fifth Groove

Use root/fifth movement against a steady beat.

### 3. Meet the Octave

Explain:

> Same note name, higher sound.

### 4. Octave Shape

Teach a common movable octave relationship suitable for the active string pair.

### 5. Move the Shape

Transpose the same root/fifth or octave idea to multiple starting roots.

### World 6 Checkpoint — **Shape Shift**

Type: Mini Groove / Bass Line

Combine:

- roots;
- fifths;
- octaves;
- string crossing;
- quarter/eighth rhythm.

Do not require advanced stretches for small beginner hands.

---

## World 7 — Groove Lab

**Goal:** Turn known notes/shapes into intentional repeated grooves.

### 1. Repeat It Cleanly

Same one-measure groove repeated consistently.

### 2. Groove A / Groove B

Teach contrast between two phrases.

### 3. Kick Together, Then Move

Some notes align with kick, while others fill space between kicks.

### 4. Simple Anticipation

Introduce a note just before a strong beat only if the existing timing/scoring representation makes it clear enough for beginners.

This is the first mild syncopation concept and should remain optional/forgiving.

### 5. Dynamics and Feel

Teach that not every note must be attacked as hard as possible.

The app may provide guidance, but initial scoring should not pretend to judge nuanced dynamics unless input measurements are reliable.

### World 7 Checkpoint — **Pocket Test**

Type: Drum Lock / Bass Line

A 45–60 second original with:

- A/B form;
- root/fifth/octave material;
- rests;
- kick relationship;
- repeated groove consistency;
- a real ending.

---

## World 8 — Song Player

**Goal:** Prepare the child to play complete beginner bass parts and imported songs.

### 1. Read Ahead

Longer phrase with fewer instructional overlays.

### 2. Survive a Miss

Teach continuing in time instead of stopping to correct every mistake.

### 3. Practice a Phrase

Use phrase/section selection and reduced speed.

### 4. Build to 100%

Use Smart Practice on a complete phrase or bass line.

### 5. Imported Song Ready

Explain track selection, backing instruments, selected Bass track mute, speed, and sections in child-friendly terms.

### Final Checkpoint — **First Bass Gig**

Type: Full Bass Line / Song Arrangement

Target:

- approximately 60 seconds or musically complete claimed material;
- multiple phrases;
- rhythm + roots + shape movement;
- section-practice compatible;
- clear musical ending;
- suitable for 60–100% Smart Practice.

This should feel like a performance, not an exam made of unrelated drills.

---

# Original FMQ Groove Families

Original content is essential because real bass playing is not always well taught by moving familiar vocal melodies into the bass register.

These names are working titles and may change during composition.

## Engine Room

Character:

- steady quarter notes;
- low E/A focus;
- simple strong pulse.

Use:

- Worlds 1–3.

## Night Drive

Character:

- smooth eighth-note pattern;
- controlled string crossing;
- relaxed repeated groove.

Use:

- Worlds 3–4.

## Riverbed

Character:

- sustained roots;
- rests and space;
- strong muting/clean-ending lesson.

Use:

- World 4.

## Root Runner

Character:

- simple I/IV/V-style harmonic movement;
- roots changing with backing harmony.

Use:

- World 5.

## Fifth Gear

Character:

- root/fifth motion;
- driving but beginner-safe.

Use:

- World 6.

## Up One Floor

Character:

- octave movement;
- call/response between low root and octave.

Use:

- World 6.

## Pocket Patrol

Character:

- kick-aligned groove;
- rests;
- A/B phrase contrast.

Use:

- World 7.

## First Gig

Character:

- culmination piece;
- roots, fifths, octaves, eighth notes, rests;
- developed form and cadence/ending.

Use:

- World 8 final checkpoint.

Original pieces must be individually authored. Do not generate a four-note seed and repeat it until a duration threshold is met.

---

# Drum Lock Progression

Drum Lock should become one of Bass Quest's signature learning features.

The first implementation can use a very small local drum engine/pattern set. It does not require advanced drum transcription.

## Drum Lock 1 — Beat Together

Pattern:

- kick on 1 and 3;
- snare on 2 and 4;
- player hits root on every beat.

Learning goal:

- steady pulse;
- hear kick/snare distinction.

## Drum Lock 2 — Follow the Kick

Player note only on kick hits.

Learning goal:

- bass/kick relationship;
- intentional space.

## Drum Lock 3 — Eighth-Note Engine

Player performs eighth notes while drums keep quarter-note structure.

Learning goal:

- subdivision.

## Drum Lock 4 — Root Change

Kick remains stable while harmony/root changes every measure or phrase.

Learning goal:

- rhythmic consistency through note changes.

## Drum Lock 5 — Root/Fifth Pocket

Root aligns with strong kick; fifth fills another beat/subdivision.

Learning goal:

- groove shape rather than repeated root only.

## Drum Lock 6 — Simple Pocket

A short authored groove with one or two between-kick notes.

Learning goal:

- first controlled independence from exact kick duplication.

Do not introduce heavy syncopation until visual timing and scoring make it understandable on the target Chromebook.

---

# Built-In Public-Domain Bass Music Strategy

Bass Quest should reuse the shared rights policy in `MUSIC_SOURCES.md`.

Every Bass arrangement must be newly authored for FMQ. Do not copy modern bass tabs, MIDI files, commercial arrangements, recordings, tutorial transcriptions, or somebody else's bass line simply because the underlying composition is public domain.

## Already verified compositions that are plausible Bass candidates

These compositions already have shared source documentation. A Bass arrangement still requires its own musical design and documentation update.

### Ode to Joy

Good Bass uses:

- very early single-line note-reading arrangement;
- later simplified root accompaniment while FMQ supplies melody.

Avoid duplicating the Guitar arrangement mechanically.

### Jingle Bells — Complete Refrain

Good Bass uses:

- beginner root movement;
- quarter-note/eighth-note rhythm;
- holiday recognizable payoff.

A root-oriented accompaniment is more Bass-like than simply copying the melody.

### Amazing Grace

Good Bass uses:

- sustained roots;
- long note control;
- muting/clean releases;
- slow accompaniment underneath supplied melody.

This is particularly useful for World 4/5 skills.

### Auld Lang Syne

Good Bass uses:

- slow root changes;
- sustained notes;
- phrase awareness.

### In the Hall of the Mountain King — Beginner Theme

Good Bass uses:

- repeated ostinato/riff feeling;
- speed training;
- controlled repetition;
- later-world challenge.

This is probably the strongest already-verified candidate for a recognizable line that actually feels natural on Bass.

### Frère Jacques

Good Bass uses:

- simple repeating ostinato;
- root movement;
- round/call-and-response concept if FMQ provides another voice.

### Row, Row, Row Your Boat

Good Bass uses:

- simple harmonic accompaniment;
- steady pulse;
- phrase repetition.

### Twinkle, Twinkle, Little Star

Use carefully.

It can teach note reading, but simply playing the child's melody on Bass does not teach much about Bass's musical role. Prefer a simple root/bass accompaniment when supporting playback is available.

## Public-domain candidate rule

Do not add a composition to the Bass Songbook merely because it is famous or old.

A candidate should satisfy most of these:

- rights can be verified cleanly;
- recognizable to a beginner/family;
- arrangement can teach a specific Bass skill;
- comfortable low-position fingering is possible;
- the result sounds like a plausible bass part;
- the piece does not require copied modern arrangement language to be recognizable.

Additional compositions may be researched later and added to `MUSIC_SOURCES.md` only after source verification.

---

# Song/Arrangement Difficulty Model

Where useful, a composition can have intentionally authored Bass arrangements at different skill levels.

Possible arrangement types:

## Beginner Root Line

- roots only or mostly roots;
- quarter notes;
- limited fret range;
- clear harmony changes.

## Groove Line

- roots + fifths/octaves;
- eighth notes/rests;
- stronger rhythmic identity.

## Melody Bass

Use only when playing the melody on Bass genuinely serves the learning goal.

## Full Beginner Bass Arrangement

- developed complete line;
- phrase structure;
- musically appropriate movement;
- full claimed song/section.

Do not create "difficulty" by randomly deleting notes from a complete line if that produces an incoherent bass part.

---

# Suggested v2.7.0 Curriculum Scope

The first visible Bass Quest release needs enough learning content that the instrument mode is not an empty technical demo, but it should not attempt the entire curriculum at once.

Recommended v2.7.0 minimum content:

## World 1 — complete

- Meet the Bass
- Four Lines = Four Strings
- Zero Means Open
- Numbers Mean Frets
- The Low Pair
- First Low-End Groove checkpoint

## World 2 — complete

- D string
- G string
- Climb the Strings
- String Crossing
- Read the Whole Staff
- Four-String Run checkpoint

## Early rhythm preview

At least two World 3 concepts:

- Quarter-Note Engine
- Meet the Kick / first Drum Lock

This gives the first release approximately 12–14 meaningful playable items depending on how orientation screens/checkpoints are represented.

The initial release should also include at least one developed original Mini Groove and, if implementation capacity permits, one legally documented recognizable Bass arrangement.

Do not sacrifice low-E detection quality, imports, or Guitar/Piano stability just to increase lesson count.

---

# Suggested v2.7.1 Curriculum Scope

v2.7.1 should deepen the learning experience rather than rebuild infrastructure.

Complete:

- World 3 — Pocket Builder
- World 4 — Clean Note Workshop
- World 5 — Root Runner
- World 6 — Shape Shifter
- World 7 — Groove Lab
- World 8 — Song Player

Add:

- full Drum Lock progression;
- Bass-specific reference tools required by those worlds;
- several FMQ original grooves/bass lines;
- a small public-domain Bass Songbook;
- Smart Practice recommendations based on Bass skill history;
- longer checkpoints and First Bass Gig.

Release scope may be split further if physical Bass testing exposes foundational input/performance problems.

---

# Bass Skill Taxonomy

Use a small explicit set of skill tags rather than relying only on level IDs.

Suggested initial tags:

- `bass-open-strings`
- `bass-tab-reading`
- `bass-fret-reading`
- `bass-ea-movement`
- `bass-dg-movement`
- `bass-string-crossing`
- `bass-quarter-pulse`
- `bass-eighth-pulse`
- `bass-rests`
- `bass-sustain-control`
- `bass-clean-release`
- `bass-root-finding`
- `bass-root-following`
- `bass-fifths`
- `bass-octaves`
- `bass-groove-repeat`
- `bass-kick-lock`
- `bass-read-ahead`
- `bass-recovery`
- `bass-full-line`

Only create performance history for skills the app can reasonably infer from scored events or explicit lesson completion.

Technique guidance such as alternating fingers can have curriculum tags without pretending the detector verified the technique itself.

---

# Checkpoint Standards

Every checkpoint should:

- combine skills already taught;
- contain musical phrase/form structure;
- work at reduced practice speeds;
- work with count-in;
- be section/phrase practice compatible where long enough;
- have an intentional ending;
- avoid introducing a major unexplained new technique;
- remain playable with the supported input path;
- report skill history honestly.

A checkpoint should **not** be considered a full musical piece merely because it lasts 45 seconds.

Completeness/form matters more than duration.

---

# Child-Facing Language Principles

Prefer concrete Bass language.

Good:

> "Hit the root with the kick."

> "Let this note ring until the ribbon ends."

> "Stop the string for the rest."

> "Same shape, new starting note."

Avoid unnecessary theory jargon before it is useful.

When theory is introduced, connect it immediately to sound and play.

Example:

> "The fifth is a strong partner note for the root. Try the shape and hear how solid it sounds."

---

# Manual Musical Review

Automated tests can verify:

- IDs;
- timing validity;
- string/fret range;
- MIDI/string/fret consistency;
- section bounds;
- durations;
- skill metadata;
- no impossible references.

A human must still judge:

- whether the groove actually feels good;
- whether the Bass line supports the music;
- whether rests/muting instructions make sense;
- whether fingering is comfortable on a real Bass;
- whether the tempo is appropriate;
- whether a child can understand the instructions;
- whether backing/drums overpower the instrument;
- whether the line becomes boring from excessive repetition.

Do not claim these subjective checks passed solely from deterministic tests.

---

# Curriculum Acceptance Standard

Bass Quest's learning path is successful when a beginner can progress from:

> "I know almost nothing about Bass"

through:

> "I can read basic Bass tab and play all four strings"

then:

> "I can hold quarter/eighth-note pulse and lock simple notes with a drum beat"

then:

> "I can follow roots and use fifth/octave shapes"

and finally:

> "I can practice and perform a complete beginner Bass line or imported Bass part."

The final product should teach the musical job of the instrument—not merely fret recognition.