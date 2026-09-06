# Family Music Quest — Legal Deterministic Test Fixture Strategy

This document defines how future automated import/player tests should use small, deterministic, repository-safe musical fixtures without relying on copyrighted commercial songs or unverifiable downloads.

It is a planning/source-of-truth document. It does **not** authorize adding large binary assets casually. Every fixture should justify its size, purpose, and rights status.

The goals are:

> **Reproduce important parser/player edge cases with tiny, legal, deterministic fixtures.**

and:

> **Keep copyrighted real-world stress songs as local manual test material only.**

---

# 1. Fixture categories

The repository may eventually use four categories.

## A. Pure-data fixtures

Small JavaScript/JSON structures representing already-parsed notes/events/tracks.

Best for:

- scoring;
- grouping;
- track classification;
- section generation;
- string/fret mapping;
- performance-window algorithms;
- transport math.

Prefer these when testing the parser itself is not necessary.

## B. Generated MIDI fixtures

Tiny MIDI files generated from FMQ-authored note data or committed as clearly documented original fixtures.

Best for:

- MIDI parser/import flow;
- track selection;
- tempo changes;
- simultaneous notes;
- sustain/control changes where supported;
- long/dense event counts without copyrighted content.

## C. Generated/string-score fixtures

Small Guitar Pro/MusicXML-like fixtures created specifically for FMQ tests when the supported toolchain can produce them legally and deterministically.

Best for:

- multiple string tracks;
- Guitar vs Bass track classification;
- alternate tuning;
- chords;
- open strings;
- tempo/measure/section parsing;
- selected-track muting/player setup.

If a binary Guitar Pro format is difficult to author reproducibly, prefer MusicXML or a tiny documented open fixture rather than committing an opaque commercial file.

## D. Manual stress assets

Real songs owned/obtained by the tester may be used locally for physical/manual validation.

Examples include the existing complex Coheed & Cambria Guitar Pro file used to reproduce the Full Song Chromebook issue.

Rules:

- do not commit it;
- do not bundle it;
- do not upload it to CI artifacts;
- do not use it as the only automated regression case;
- describe the stress characteristics, not the copyrighted musical content, in documentation.

---

# 2. Rights rules

A repository fixture must be one of:

- original Family Music Quest test material;
- generated from original FMQ test material;
- clearly public-domain underlying material with a new FMQ-authored test arrangement;
- explicitly compatible licensed material whose license and source are documented.

Do not commit:

- commercial Guitar Pro/tab files;
- random internet MIDI files;
- modern tutorial transcriptions;
- files with unclear provenance;
- copyrighted recordings;
- soundfont/sample assets merely because they were freely downloadable.

When in doubt, author a tiny original fixture.

---

# 3. Naming and metadata

Recommended fixture directory later:

```text
fixtures/
  midi/
  string-score/
  data/
  README.md
```

Every binary/structured fixture should have metadata describing:

```text
id
purpose
format
origin
rights/license
expected tracks
expected tempo map
expected notes/chords
expected tuning/string count
edge cases intentionally included
```

Keep the metadata human-readable.

---

# 4. Minimum MIDI fixture set

A useful future set can stay very small.

## `midi-single-melody`

Original 8–16 bar melody.

Covers:

- one melodic track;
- basic tempo;
- ordinary note durations;
- beginner track recommendation.

## `midi-chords-polyphony`

Original short Piano piece with:

- simultaneous triads;
- repeated chord tones;
- left/right ranges;
- different velocities;
- sustain if parser/service coverage needs it.

Covers chord grouping and polyphony.

## `midi-multitrack-band`

Original tracks such as:

- drums/percussion;
- bass;
- melody;
- chord accompaniment.

Covers role classification and recommended-track selection.

## `midi-tempo-map`

Short original piece with at least two intentional tempo changes.

Covers imported tempo/count-in/section timing logic where supported.

## `midi-dense-stress`

Programmatically generated original dense note stream.

Purpose:

- event-count/windowing/performance tests;
- not musical quality review.

Keep it small enough for CI but dense enough to expose accidental O(n)-per-frame transformations in deterministic tests where possible.

---

# 5. Minimum string-score fixture set

## `string-guitar-basic`

Six-string standard Guitar, one playable Guitar track.

Include:

- open strings;
- low/middle/high fret positions;
- sustained notes;
- repeated notes;
- one small chord;
- multiple measures/phrases.

## `string-guitar-multitrack`

Include:

- lead Guitar;
- rhythm Guitar;
- Bass-like track if useful;
- drums/non-playable track.

Purpose:

- track listing;
- manual/automatic selection;
- selected-track muting setup.

## `string-bass-four-string`

Future Bass fixture:

- E1/A1/D2/G2 standard tuning;
- open and fretted notes;
- preserved bass octave;
- one groove/chord-root pattern.

This fixture should land only when Bass import/player work begins.

## `string-alt-tuning`

Small original score with a documented non-standard Guitar tuning if the importer supports it.

Purpose:

- prove tuning metadata is honored rather than silently forcing standard tuning.

## `string-dense-stress`

Original/generated long-enough score with:

- high event count;
- dense repeated chord regions;
- sustains;
- multiple sections;
- deterministic timing.

It should exercise scale-dependent gameplay paths without reproducing any copyrighted song.

---

# 6. Stress-fixture philosophy

A CI stress fixture should isolate algorithmic scale, not attempt to sound like a commercial song.

Useful stress dimensions:

- total event count;
- simultaneous-event density;
- many measures;
- repeated note groups;
- long sustains;
- frequent visible-window turnover;
- multiple tracks;
- tempo changes;
- string-count/tuning metadata.

Avoid increasing fixture size merely to make it “realistic.”

---

# 7. Deterministic generation

Where practical, generate fixtures from checked-in source definitions.

Example conceptual flow:

```text
fixture-source.js/json
      ↓
fixture generator
      ↓
.mid / MusicXML / other supported format
      ↓
parser/import tests
```

Benefits:

- rights provenance is obvious;
- expected notes are known;
- fixtures can be regenerated;
- binary diffs are less mysterious;
- edge cases can be changed deliberately.

Do not add a heavyweight generation dependency unless the test value justifies it.

A one-time generated binary fixture can still be acceptable if its source/expected structure is documented.

---

# 8. Golden expected data

For parser fixtures, maintain compact expected results such as:

```text
track count
track names/roles
string count/tuning
note count
first/last note
chord count
measure count
tempo points
section boundaries
```

Do not snapshot enormous internal objects if a handful of meaningful invariants catches the regression.

Golden data should describe product behavior, not library-private implementation details.

---

# 9. Browser integration fixtures

Playwright should use the smallest fixture that exercises the intended user path.

Good examples:

- import tiny MIDI;
- see track recommendation;
- choose track;
- launch section;
- exit cleanly.

or:

- load tiny string-score fixture;
- select Guitar track;
- launch Full Song;
- verify correct player setup state;
- pause/exit.

Do not make CI “play” an entire long song just to prove the screen opens.

---

# 10. Performance testing boundaries

CI fixtures can test deterministic performance-sensitive invariants such as:

- bounded rendered-event counts;
- active-window indexes advance correctly;
- total DOM note count does not scale with entire song where virtualization is intended;
- tab window remains bounded;
- parsing completes without runaway allocation.

CI should **not** claim:

- Chromebook FPS acceptance;
- audible stutter elimination;
- microphone responsiveness;
- child readability.

Those remain governed by `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` and `MONDAY_HARDWARE_TEST_PLAN.md`.

---

# 11. Fixture review checklist

Before committing a new fixture:

- [ ] Is it necessary?
- [ ] Can pure data test the behavior instead?
- [ ] Is its origin/rights status documented?
- [ ] Is it original/FM Q-authored or otherwise clearly allowed?
- [ ] Is it as small as practical?
- [ ] Are expected invariants documented?
- [ ] Does it test product behavior rather than a third-party library detail?
- [ ] Could a generated source definition make it easier to maintain?
- [ ] Is a copyrighted local stress song accidentally being substituted into the repo?

---

# 12. Recommended implementation order

Do not create all fixtures immediately.

Add them when the corresponding test becomes valuable:

1. small generated MIDI fixture when imported-MIDI browser integration is next touched;
2. multitrack MIDI fixture when track recommendation/selection changes;
3. small legal string-score fixture after v2.6.4 settles and Guitar import/player seams are stable;
4. dense generated string-score fixture when a deterministic bounded-render regression becomes practical;
5. Bass fixture when Bass Quest import/player work begins.

Fixture work should follow product risk, not become a content project of its own.
