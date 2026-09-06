# Family Music Quest — Song Authoring and Content Pipeline Specification

This document defines the intended future authoring, validation, rights-tracking, and build/runtime pipeline for built-in Family Music Quest musical content across Guitar, Piano, and future Bass.

It is a planning/source-of-truth document. It does **not** authorize a broad content-format migration, player rewrite, or editor implementation inside an unrelated release.

The product goal is:

> **Make it easy to create, review, validate, and maintain high-quality Family Music Quest music without hand-editing scattered runtime JavaScript structures or weakening the instrument-specific behavior that already works.**

The architectural goal is:

> **Share authoring metadata and validation where it makes sense; keep instrument-specific runtime adapters where the actual players require different data.**

---

# 1. Current Baseline

At the time this specification was written, built-in music is authored directly in JavaScript.

## Guitar Songbook

`guitar-songbook.js` currently contains:

- a six-string standard tuning reference;
- a beginner MIDI-to-string/fret position map;
- event helpers;
- phrase helpers;
- a `makeArrangement(...)` helper;
- song metadata;
- public-domain rights metadata;
- phrase/section boundaries;
- beat/duration data;
- generated Guitar gameplay `notes`;
- generated `songSpec` values;
- a Songbook manifest.

The resulting Guitar runtime shape is deliberately compatible with the existing Guitar gameplay engine.

## Piano Songbook

`piano-songbook.js` currently contains:

- note/event helpers;
- finger guidance helpers;
- hand/role data;
- velocity and articulation;
- authored sections;
- generated phrase boundaries;
- measure assignment;
- harmony/accompaniment;
- melody/right/left/full arrangement extraction;
- microphone-safe monophonic arrangement extraction;
- rights metadata;
- public-domain pieces;
- Family Music Quest originals.

The Piano runtime shape is richer because Piano requires concepts that Guitar does not share directly.

## Curriculum content

Built-in Guitar and Piano lesson/curriculum content also lives in instrument-specific source files and uses additional metadata for:

- lesson sequencing;
- world/level placement;
- coaching;
- assistance;
- checkpoints;
- skills;
- progression.

## Rights documentation

`MUSIC_SOURCES.md` and related rights documents record the underlying public-domain compositions and FMQ arrangement status.

## Current strengths

The existing approach has several good properties that should be preserved:

- music data is deterministic;
- no runtime network dependency is required for built-in notes;
- content is inspectable in the repository;
- rights basis is explicit;
- tests can validate pitch/timing/sections;
- Guitar and Piano can author music in ways appropriate to their engines.

## Current weaknesses

As the library grows, direct runtime-JavaScript authoring becomes harder to maintain because:

- Guitar and Piano use different helper conventions;
- metadata is duplicated across song objects, manifests, curriculum references, and rights docs;
- validation rules are spread across tests and constructors;
- accidental malformed timing can be difficult to spot manually;
- every new piece requires intimate knowledge of the player’s runtime object shape;
- future Bass would add a third authoring pattern if nothing changes;
- reusable composition identity is not yet a first-class shared concept;
- public-domain source metadata can drift from arrangement files;
- human musical review is not represented as part of a formal content lifecycle.

The solution should improve authoring discipline without requiring a risky rewrite of existing working players.

---

# 2. Core Architectural Principle

**Canonical authoring data is not the same thing as canonical runtime data.**

Do not force Guitar, Piano, and Bass to consume one giant universal event object if their players genuinely need different concepts.

Instead use a layered model:

```text
Composition Registry
        ↓
Arrangement Authoring Source
        ↓
Shared Validation
        ↓
Instrument Adapter / Compiler
        ↓
Existing Instrument Runtime Shape
        ↓
Guitar / Piano / Bass Player
```

This allows:

- shared source/rights metadata;
- shared identifiers;
- shared timing/phrase validation;
- shared authoring conventions;
- instrument-specific fingering, hand, role, string, fret, accompaniment, and scoring requirements.

---

# 3. Composition Registry

A future shared composition registry should represent the identity and rights/source basis of the **underlying musical work**, separate from any one Guitar/Piano/Bass arrangement.

Conceptual example:

```js
{
  id: 'ode-to-joy',
  title: 'Ode to Joy',
  composer: 'Ludwig van Beethoven',
  work: 'Symphony No. 9, Op. 125',
  compositionDate: '1824',
  rights: {
    status: 'public-domain',
    basis: 'Underlying composition is public domain',
    sources: [
      {
        label: 'Beethoven-Haus work record',
        url: '...'
      }
    ]
  }
}
```

For Family Music Quest originals:

```js
{
  id: 'fmq-first-gig',
  title: 'First Gig',
  composer: 'Family Music Quest',
  rights: {
    status: 'fmq-original'
  }
}
```

## Why composition identity matters

The same underlying composition may have:

- Piano arrangement;
- Guitar arrangement;
- future Bass accompaniment arrangement;
- curriculum excerpt;
- Songbook arrangement;
- easier/harder arrangement.

Those should share one composition identity where appropriate instead of independently repeating rights/source facts.

## Registry rules

The registry should contain facts about the work, not player-runtime behavior.

It should **not** contain:

- Guitar string/fret mapping;
- Piano hand assignment;
- Bass groove pattern;
- scoring thresholds;
- gameplay CSS;
- player-specific speed state.

---

# 4. Arrangement Identity

Every built-in playable musical arrangement should have a stable arrangement ID distinct from the composition ID.

Examples:

```text
composition: ode-to-joy
arrangement: piano-ode-to-joy-beginner-complete
arrangement: guitar-ode-to-joy-easy-lead
arrangement: bass-ode-to-joy-root-groove
```

This avoids ambiguous progress keys when multiple arrangements share a composition.

## Arrangement metadata

Common arrangement metadata should be able to express concepts such as:

- arrangement ID;
- composition ID;
- instrument;
- title/display title;
- arrangement name;
- content type;
- difficulty label/stars;
- intended BPM;
- time signature;
- measure count;
- approximate duration;
- curriculum recommendation;
- skill tags;
- assistance defaults;
- rights/arrangement statement;
- author/reviewer notes;
- version/revision if useful.

Not every field must be required for every content type.

---

# 5. Content Types

The pipeline should recognize explicit content semantics rather than treating everything as merely an array of notes.

Recommended common content types:

- `exercise`
- `miniSong`
- `fullSong`
- `checkpoint`
- `groove`
- `bassLine`
- `drumLock`
- `songbook`
- `lessonExcerpt`

Instrument-specific content types may exist when genuinely useful.

## Completeness claims

A content type should support an honest completeness label.

Examples:

- `Complete Theme`
- `Complete Refrain`
- `First Verse Melody`
- `Beginner Theme`
- `Original Full Song`

Do not label a fragment as a complete song merely because it reaches a target duration.

Duration is a sanity check, not proof of musical completeness.

---

# 6. Canonical Musical Time

The authoring format should use **musical time first**, not hard-coded wall-clock seconds.

Preferred core concepts:

- beat position;
- duration in beats;
- measure/bar number derived or validated from beat position;
- phrase boundaries;
- tempo/BPM;
- time signature;
- tempo changes where supported.

Runtime adapters may convert beat time to seconds where necessary.

## Why beat time matters

Beat-relative authoring allows:

- practice-speed changes;
- count-in;
- phrase extraction;
- measure display;
- Smart Practice;
- Trouble Spot Practice;
- future tempo-map support;
- consistent Listen First timing.

Do not make authored built-in arrangements depend on fixed millisecond timestamps unless a feature specifically requires them.

---

# 7. Canonical Phrase and Measure Structure

Every non-trivial built-in musical piece should define or derive meaningful musical structure.

Preferred structure:

```text
Arrangement
├── Phrase A
├── Phrase B
├── Phrase A2
└── Ending
```

Each phrase should be able to expose:

- stable ID;
- child-facing label;
- start beat;
- end beat;
- start measure;
- end measure;
- optional skill tags;
- optional curriculum notes.

## Rules

- phrase boundaries must not overlap illegally;
- phrase end must be after phrase start;
- events must fall inside the arrangement bounds;
- measure numbering must be internally consistent;
- empty phrases should be rejected unless intentionally supported;
- ending material should not silently fall outside the declared form.

This structure should directly support future Trouble Spot Practice.

---

# 8. Canonical Note/Event Concepts

A shared authoring layer should define only concepts that are genuinely common.

Base musical event may include:

```js
{
  pitch: 64,          // MIDI pitch where applicable
  beat: 12,
  durationBeats: 1,
  velocity: 88,
  articulation: 0.9,
  phraseId: 'A',
  skillTags: []
}
```

Additional instrument-specific fields belong in adapters or instrument extensions.

## Guitar/Bass extensions

May include:

- string index/number;
- fret;
- technique display token;
- sustain representation;
- chord-note stack;
- tuning reference;
- preferred position/fingering.

## Piano extensions

May include:

- hand;
- finger guidance;
- musical role (`melody`, `bass`, `harmony`);
- simultaneous target-group membership;
- accompaniment flag;
- articulation/velocity defaults.

Do not make fields mandatory for instruments that cannot use them.

---

# 9. String-Instrument Authoring

Guitar and future Bass should share the concept of string/fret mapping without sharing all curriculum/content.

A string-instrument arrangement should be validated against an explicit instrument/tuning configuration.

For each note:

```text
open-string MIDI + fret = intended MIDI pitch
```

must hold unless the format explicitly represents techniques that alter pitch.

## Required validation

- string index is in range;
- fret is non-negative;
- fret does not exceed configured authoring/playable range;
- string/fret-derived pitch matches MIDI target;
- open-string note uses fret 0;
- chord stack does not contain impossible duplicate string use unless deliberately supported;
- arrangement tuning matches its declared instrument configuration.

## Position choice

The authoring pipeline should allow either:

1. explicit string/fret positions authored by the arranger; or
2. a deterministic position resolver for simple beginner material.

For educational content, explicit authored positions are often preferable because the same pitch can occur in multiple places and the chosen position is part of what is being taught.

Do not silently re-finger an arrangement at runtime.

---

# 10. Piano Authoring

Piano arrangements need richer event semantics than string-instrument lead lines.

The canonical authoring layer should support Piano concepts such as:

- melody;
- left/right hand;
- accompaniment;
- simultaneous notes;
- explicit velocity;
- articulation;
- finger guidance;
- phrase/measure metadata.

## Microphone-safe extraction

The authoring format should allow the Piano adapter to derive a safe monophonic microphone arrangement where the source is polyphonic.

That derived arrangement must remain deterministic.

Rules should be documented and tested.

Do not claim microphone chord recognition simply because the canonical source contains chords.

## Listen First

Listen First should consume the complete intended arrangement rather than a separate hand-maintained duplicate song.

This reduces drift between demo playback and learner content.

---

# 11. Bass Authoring

Future Bass authoring should build on the shared string-instrument concepts while supporting Bass-specific musical identity.

Bass arrangements may represent:

- learner bass line;
- backing melody/harmony;
- Drum Lock pattern reference;
- roots/fifths/octaves;
- groove sections;
- rests and sustained notes;
- real Bass octave.

The pipeline must not transpose Bass upward simply to reuse Guitar detection/runtime assumptions.

Bass E1 remains MIDI 28.

Bass built-in content should be able to use the same composition registry as Piano/Guitar while authoring a musically appropriate bass accompaniment rather than copying the melody mechanically.

---

# 12. Dynamics and Articulation

Built-in music should remain deterministic.

The authoring format may support:

- velocity;
- phrase-opening emphasis;
- role-specific defaults;
- articulation/length ratio;
- sustained/short-note intent.

Avoid random humanization in source data or runtime playback unless a future feature deliberately introduces deterministic seeded humanization.

Human musical feel should come from authored choices, not nondeterministic randomness that makes testing difficult.

---

# 13. Harmony / Accompaniment

The pipeline should distinguish the **learner part** from **app accompaniment**.

Conceptual structure:

```text
Arrangement
├── learner part
├── accompaniment part(s)
└── optional demo/listen mix
```

This is especially useful for:

- Piano Learn Melody;
- future Bass accompaniment arrangements;
- Guitar built-in songs if backing is later added.

Accompaniment must respect:

- enabled/disabled state;
- true zero volume;
- pause/restart/exit cleanup;
- practice speed;
- phrase/section extraction.

The authoring pipeline should not hard-code user playback preferences into the musical source.

---

# 14. Drum Lock Authoring

Future Bass Drum Lock content should be representable without embedding a large audio file.

Conceptual drum pattern data may include:

- BPM;
- measure length;
- kick beats/subdivisions;
- snare beats;
- optional hi-hat pulse;
- learner bass events;
- phrase/form labels.

Example concept:

```js
{
  drumPattern: {
    kick: [0, 2],
    snare: [1, 3],
    hats: 'eighths'
  }
}
```

Exact schema should be designed only when Drum Lock implementation begins.

Do not make the general song format depend on Drum Lock-specific fields.

---

# 15. Skill Tags

Arrangement and phrase/event metadata may include skill tags.

Examples:

### Guitar

- `open-strings`
- `fret-reading`
- `string-crossing`
- `sustain`
- `alternate-picking-guidance`

### Piano

- `stepwise-motion`
- `repeated-notes`
- `left-hand`
- `hands-together`
- `target-groups`

### Bass

- `quarter-pulse`
- `eighth-notes`
- `roots`
- `fifths`
- `octaves`
- `drum-lock`

Skill tags should support curriculum/search/recommendation behavior, but they should not automatically become claims that the detector verified a physical technique.

---

# 16. Curriculum References

Curriculum lessons should reference arrangement IDs rather than copying musical arrays where practical.

Conceptual example:

```js
{
  lessonId: 'bass-world-3-lock-in',
  arrangementId: 'bass-lock-in-checkpoint',
  assistance: 'practice',
  unlockAfter: [...]
}
```

This reduces duplication between:

- Songbook;
- curriculum;
- Listen First;
- checkpoint;
- phrase practice.

However, tiny one-purpose drills may remain embedded lesson exercises if extracting them creates more complexity than value.

Do not force every four-note drill into a global registry merely for architectural purity.

---

# 17. Rights and Source Metadata

Rights validation is a first-class authoring step, not documentation added at the end.

For public-domain works, the arrangement source should point to a composition registry entry that includes:

- underlying work;
- attribution;
- source URL(s);
- public-domain basis;
- relevant historical date;
- FMQ arrangement statement;
- whether lyrics are included.

## FMQ arrangement policy

Every bundled public-domain arrangement must remain:

> **Public-domain composition/melody + newly authored Family Music Quest arrangement.**

Do not copy:

- modern commercial sheet-music arrangements;
- copyrighted tabs;
- random downloaded MIDI files;
- YouTube tutorial transcriptions;
- paid teaching arrangements;
- copyrighted recordings;
- unlicensed Guitar Pro files.

## Documentation generation

A future tool may generate or validate portions of `MUSIC_SOURCES.md` from the canonical registry.

Until that tooling exists, the repository documentation and arrangement metadata must agree and tests/review should catch drift.

---

# 18. Original Family Music Quest Compositions

FMQ originals should carry explicit original-work identity.

They should not be produced by taking a tiny motif and mechanically padding/repeating it until a duration target is met.

For Mini Songs / Full Songs / Checkpoints, reviewers should expect musical development such as:

- intro where appropriate;
- phrase A;
- contrasting phrase B;
- return/development;
- cadence/ending;
- intentional harmonic motion;
- appropriate rhythmic variation.

The pipeline cannot mathematically prove that a song is musically satisfying. That remains a human review responsibility.

---

# 19. Authoring Source Format

The long-term source format should be human-readable and diff-friendly.

Reasonable implementation choices may include:

- JavaScript data modules;
- JSON with validation;
- YAML converted at build/check time;
- a small purpose-built DSL.

The format choice should be made only when implementation begins.

## Requirements regardless of syntax

The chosen format must:

- be reviewable in Git diffs;
- work without proprietary authoring software;
- support deterministic validation;
- avoid binary-only source of truth;
- preserve exact timing and pitch;
- support instrument-specific extensions;
- be easy for coding agents and humans to edit;
- not require a heavy production build system merely to run the app unless that build step is deliberately adopted.

## Recommended first implementation direction

Given the current static app architecture, the lowest-risk first step is likely:

> **structured JavaScript/JSON authoring data + validation/compiler scripts that emit or adapt to the current runtime shapes.**

Do not introduce a large framework/toolchain solely for music authoring.

---

# 20. Adapter / Compiler Responsibilities

The authoring adapter should convert canonical arrangement data into the existing runtime contract for the target instrument.

## Guitar adapter

May produce:

- `notes` with string/fret/MIDI/beat/duration;
- phrase `sections`;
- Guitar Songbook card metadata;
- `songSpec`;
- manifest data.

## Piano adapter

May produce:

- sorted runtime notes;
- seconds derived from beat/BPM;
- hand/role/finger values;
- measure assignment;
- phrase boundaries;
- arrangement extraction metadata;
- Songbook metadata.

## Bass adapter

Future adapter may produce:

- 4-string runtime notes;
- Bass-specific sections;
- Drum Lock references;
- shared string-player configuration references;
- Bass Songbook/card metadata.

Adapters should be deterministic and testable.

---

# 21. Validation Pipeline

Authoring validation should fail loudly before bad content reaches gameplay.

Recommended validation categories follow.

## Identity

- arrangement ID exists;
- arrangement ID is unique;
- composition ID exists where required;
- content type valid;
- instrument valid;
- title/arrangement name present.

## Musical time

- BPM is positive and within a plausible supported range;
- beats are finite/non-negative;
- durations are positive;
- event ordering is valid;
- phrase boundaries are valid;
- measure count is consistent;
- section declared length is not exceeded;
- arrangement does not contain accidental negative/NaN timing.

## Pitch

- MIDI pitch integer/in supported range;
- Piano events fall in supported keyboard range;
- Guitar/Bass string/fret pitch matches MIDI;
- tuning configuration valid;
- Bass real octave preserved.

## Structure

- non-trivial pieces have meaningful phrase/form metadata;
- sections do not overlap illegally;
- checkpoint/full-song completeness claims have explicit review status;
- no empty accidental sections.

## Dynamics

- velocity in MIDI-safe range;
- articulation finite/positive and within defined practical range;
- accompaniment role data valid.

## Rights

- public-domain composition registry entry exists;
- source/basis present;
- FMQ arrangement statement present;
- lyrics flag explicit;
- original works identified as FMQ originals.

## Curriculum

- referenced arrangement IDs exist;
- skill tags valid or at least consistently formatted;
- lesson/checkpoint references resolve.

---

# 22. Validation Severity

Not every review finding needs to be a hard build failure.

Suggested levels:

## Error

Cannot ship:

- impossible pitch/string mapping;
- duplicate ID;
- missing composition source for a public-domain bundle;
- negative duration;
- invalid phrase range;
- broken curriculum reference.

## Warning

Requires human review:

- unusually short “fullSong”;
- extremely high/low BPM for beginner content;
- phrase with very few events;
- suspiciously repetitive form;
- very large leap for beginner arrangement;
- missing optional fingering guidance.

## Human review required

Cannot be settled purely by code:

- does the arrangement sound musical?;
- is the tempo appropriate?;
- is fingering comfortable?;
- is accompaniment balanced?;
- does the Bass line feel like bass?;
- does the song genuinely match its completeness claim?;
- does the child-facing difficulty label feel right?

Do not falsely automate subjective musical judgment.

---

# 23. Human Musical Review Workflow

Every significant built-in arrangement should pass a manual review checklist before release.

Recommended stages:

```text
Author
  ↓
Static validator passes
  ↓
Automated tests pass
  ↓
Listen First / synthesized playback review
  ↓
Instrument-view review
  ↓
Target Chromebook review
  ↓
Rights/source check
  ↓
Release
```

## Guitar/Bass manual review

- fingering/string choices sensible;
- open strings/fret labels correct;
- chord stacks readable;
- Highway readable;
- Tab View readable;
- phrase boundaries musical;
- tempo playable;
- microphone/USB scoring target matches authored pitch.

## Piano manual review

- melody correct;
- harmony does not overpower learner part;
- velocity/articulation sound intentional;
- hand/finger guidance reasonable;
- phrase boundaries useful;
- microphone melody extraction sensible;
- MIDI full arrangement behaves correctly.

---

# 24. Automated Tests

The authoring pipeline should have direct tests independent of the full browser UI.

At minimum test:

- unique composition/arrangement IDs;
- rights registry resolution;
- timing validity;
- phrase boundaries;
- duration/measure calculations;
- Guitar/Bass string/fret pitch mapping;
- Piano event grouping/simultaneity preservation;
- microphone-safe Piano extraction;
- deterministic adapter output;
- curriculum arrangement references;
- manifest generation;
- no unsupported/NaN values;
- stable expected BPM for existing pieces.

Existing regression tests for v2.6.x songs should remain during any migration so the pipeline cannot silently change music.

---

# 25. Golden / Snapshot Testing

For high-value built-in arrangements, a compact deterministic representation can be used as a golden test.

Examples of safe snapshot fields:

```text
arrangement id
BPM
measure count
phrase labels/boundaries
note count
first/last pitch
pitch+beat+duration tuples
string/fret mapping where relevant
```

Avoid huge brittle snapshots containing irrelevant runtime/UI properties.

The purpose is to catch accidental musical changes during refactors.

---

# 26. Migration Strategy

Do **not** migrate every existing song in one release.

Recommended incremental strategy:

### Phase 1 — specification and validators

- define canonical registry and validation helpers;
- no runtime behavior change.

### Phase 2 — one new arrangement through pipeline

- author one new built-in piece using the new source format;
- compile/adapt to the existing player;
- compare against manually-authored patterns;
- validate CI/PWA behavior.

### Phase 3 — migrate one instrument library gradually

- migrate only when touching content for a legitimate release goal;
- preserve IDs and runtime behavior where required;
- keep regression tests.

### Phase 4 — shared registry / docs generation

- centralize composition rights/source facts once confidence is high.

### Phase 5 — optional visual authoring tool

Only after the underlying format is stable.

Do not start with a GUI editor before the data contract is proven.

---

# 27. Future Authoring Tool / Editor

A future local authoring tool may be useful, but it should be considered a convenience layer over the validated source format.

Potential features:

- choose instrument;
- set BPM/time signature;
- add/edit notes;
- Guitar/Bass fretboard picker;
- Piano keyboard picker;
- phrase/measure markers;
- playback preview;
- accompaniment preview;
- rights/source fields;
- validation panel;
- export source data.

## Important rule

The editor must not become the only place where data can be understood.

The repository source remains human-readable and reviewable.

A broken editor must never make the music library impossible to maintain.

---

# 28. Import Is Not Authoring

User-imported Guitar Pro/MIDI/MusicXML files and built-in FMQ arrangements are different product concepts.

Do not automatically turn imported copyrighted songs into bundled FMQ content.

The authoring pipeline is for:

- FMQ originals;
- FMQ-authored public-domain arrangements;
- explicitly approved legally safe built-in material.

Imported libraries remain user/device-local and governed by existing import behavior.

---

# 29. Public-Domain Research Workflow

For a new recognizable built-in composition:

1. identify the underlying work;
2. verify public-domain status/basis;
3. record a reputable historical/institutional source;
4. do not download/copy a modern arrangement into FMQ;
5. independently author the FMQ arrangement;
6. add composition registry/source metadata;
7. validate arrangement data;
8. update/generated-check shared rights documentation;
9. perform musical review;
10. ship only after tests and source review pass.

Preferred source classes remain:

- Library of Congress;
- IMSLP historical public-domain editions;
- Beethoven-Haus or comparable authoritative composer archives;
- Wikimedia Commons items with clearly compatible public-domain/CC0 status;
- reputable historical archives.

Avoid unclear modern arrangements and CC-NC material for bundled app content.

---

# 30. Performance Requirements

Built-in authoring improvements must not make runtime playback heavier unnecessarily.

Preferred architecture:

- validate/derive as much as possible outside the frame/audio loop;
- precompute deterministic runtime arrays at load/init time where appropriate;
- avoid parsing a large authoring DSL on every animation frame;
- avoid repeated phrase/measure searches inside critical loops when cached mappings suffice.

The pipeline exists primarily to improve maintainability and correctness, not to add runtime overhead.

---

# 31. PWA / Offline Requirements

Built-in musical content must remain available offline with the app shell.

If authoring introduces new generated/runtime files:

- they must be versioned consistently;
- service-worker asset coverage must be updated;
- PWA asset tests must verify them;
- clean-install offline behavior must be checked when relevant.

Do not make built-in Songbook content depend on a network-hosted music JSON endpoint.

---

# 32. Save / Progress Compatibility

Arrangement IDs and song keys can be referenced by saved progress.

Therefore migrations must deliberately decide whether IDs remain stable.

During the current development-save policy, old cross-version saves do not require disproportionate migration work, but current-version behavior still must be internally consistent.

Do not casually rename arrangement IDs inside a release without checking:

- song bests;
- stars;
- Smart Practice state;
- curriculum references;
- Trouble Spot references;
- future progress summaries.

---

# 33. Child UX Metadata

The authoring source should support concise child-facing metadata separate from developer comments.

Useful fields may include:

- display title;
- difficulty label;
- coaching sentence;
- short hint;
- recommended-after skill;
- arrangement type;
- child-facing phrase labels.

Avoid embedding large tutorial prose directly into every note array.

Curriculum instructional text may still live in lesson-specific content where that is more appropriate.

---

# 34. Accessibility Metadata

Where helpful, arrangement metadata can support accessibility/readability features such as:

- simplified view recommendation;
- larger fret-number recommendation;
- reduced-effects suitability;
- note-name assistance availability;
- color-independent string labels.

Do not encode accessibility as musical pitch changes unless an explicit alternate arrangement is authored.

---

# 35. Difficulty Arrangements

Future difficulty should prefer intentional authored arrangements over blindly deleting notes from a complete part when musical quality matters.

Possible structure:

```text
composition
├── beginner arrangement
├── easy arrangement
└── full/advanced arrangement
```

This is particularly useful for:

- Guitar dense chord/riff material;
- Bass groove simplification;
- Piano hand/texture simplification.

Existing adaptive note-density behavior may remain useful for practice, but it should not be confused with a musically authored easier arrangement.

---

# 36. Tooling Commands

Any future authoring tooling must be reflected in real repository scripts.

Do not document commands that do not exist.

A future implementation might eventually add commands conceptually like:

```text
npm run music:validate
npm run music:compile
```

but those names are **not current requirements** until they are actually added to `package.json` and documented in `TESTING.md`.

Current repository validation remains governed by the actual commands defined in the project framework.

---

# 37. Relationship to Existing Project Specs

This pipeline should support, not conflict with:

- `BASS_QUEST_SPEC.md`
- `BASS_CURRICULUM_PLAN.md`
- `TROUBLE_SPOT_PRACTICE_SPEC.md`
- `PARENT_TEACHER_PROGRESS_SPEC.md`
- `PWA_OFFLINE_UPDATE_SPEC.md`
- `LATENCY_CALIBRATION_SPEC.md`
- `PUBLIC_DOMAIN_MUSIC.md`
- `MUSIC_SOURCES.md`
- `MUSICAL_REVIEW_CHECKLIST.md`

Examples:

- phrase metadata enables Trouble Spot Practice;
- stable IDs enable progress summaries;
- Bass adapter supports four-string content;
- composition registry supports shared rights metadata;
- PWA rules keep built-in arrangements offline.

---

# 38. Explicit Non-Goals for the First Pipeline Release

Unless separately approved, the first implementation should **not** include:

- a full DAW;
- a browser notation editor;
- automatic copyrighted-song transcription;
- automatic conversion of user imports into bundled content;
- AI-generated arrangements shipped without human review;
- a major Guitar/Piano player rewrite;
- replacing AlphaTab as the imported Guitar Pro engine;
- cloud content management;
- proprietary binary authoring files;
- migrating every existing built-in song at once.

---

# 39. Definition of Done — Authoring Pipeline Foundation

The first real pipeline implementation is complete only when:

- a documented canonical arrangement/composition contract exists in code;
- validation catches malformed timing and IDs;
- rights/source validation exists for public-domain built-ins;
- at least one real arrangement is authored through the new path;
- that arrangement is adapted to an existing player rather than requiring a second player;
- deterministic automated tests cover the output;
- musical/manual review is completed;
- existing Guitar/Piano content does not regress;
- PWA/offline asset behavior remains correct;
- the source format is human-readable and reviewable;
- future Bass can use the model without another fundamental redesign.

---

# 40. Long-Term Success Criteria

The pipeline is successful when adding a new piece primarily means:

1. register/verify the composition if needed;
2. author the arrangement musically;
3. add instrument-specific fingering/hand/groove data;
4. run validation;
5. listen/review;
6. commit.

A content author should **not** need to understand the entire Guitar/Piano application internals merely to add one safe built-in arrangement.

At the same time, the resulting runtime objects should remain efficient and compatible with the instrument players that actually use them.
