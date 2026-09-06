# Family Music Quest — Automatic Trouble Spot Practice Specification

This document defines the intended design for automatic **Trouble Spot Practice** in Family Music Quest.

It is a planning/source-of-truth document. It does **not** authorize unrelated implementation work and should be implemented only in a focused release after the current Guitar-player/performance work is stable.

The core idea is:

> **After a run, Family Music Quest should be able to identify the part that caused the most trouble and offer one obvious button to practise that musical section at an appropriate speed.**

The feature should reduce the need for children to manually diagnose mistakes, set A/B points, or decide what speed to use.

---

# 1. Product Goal

Family Music Quest already contains several pieces needed for targeted practice:

- per-run hit/miss information;
- weak-note/string-fret analysis;
- per-player skill history;
- Smart Practice speed progression;
- Guitar and Piano phrase/section concepts;
- measure/phrase metadata in built-in Piano content;
- phrase sections in built-in Guitar Songbook content;
- A/B loop infrastructure;
- imported-song section practice;
- speed controls;
- count-in;
- profile-specific progress.

The missing layer is the teacher-like decision:

> **"This is the part you should practise next."**

A child-facing result should be concise, for example:

> **Trouble Spot: Phrase B**
>
> You missed 4 notes here.
>
> **Practise at 70%**

or:

> **Let's fix this part**
>
> Measures 9–12 gave you the most trouble.
>
> `Practise This Part`

The normal UI should not expose statistical jargon such as weighted error density, confidence thresholds, or event-window clustering.

---

# 2. Design Principles

## Musical boundaries before arbitrary time windows

When phrase or measure metadata exists, prefer a real musical unit:

1. phrase;
2. authored section;
3. measure group;
4. imported section/bar group;
5. only then a bounded time/event window.

Do not default to an arbitrary loop such as "four seconds before the median miss and four seconds after" when the app already knows the musical structure.

## One recommendation, not a dashboard

The primary child-facing result should normally offer **one best next action**.

Avoid presenting:

- five weak phrases;
- twelve bad notes;
- multiple competing speed suggestions;
- complex charts

on the normal results screen.

Advanced/parent reporting may later expose more detail.

## Help after meaningful evidence

Do not call every single mistake a Trouble Spot.

A recommendation should require enough evidence that the selected section genuinely stood out relative to the run.

For a very short exercise with only one or two mistakes, simple normal feedback may be better than creating a special loop.

## Preserve flow

Trouble Spot practice should be optional and quick to enter.

The child should be able to choose:

- `Practise This Part`
- `Play Again`
- `Done`

without being trapped in remediation.

## Honest input interpretation

Recommendations must be based on things the active input can actually observe.

Examples:

- Guitar/Bass audio input: pitch/timing misses can identify a weak string/fret/section;
- MIDI Piano: polyphonic chord misses can identify a weak target group/section;
- Piano microphone: recommendations should reflect the monophonic learner arrangement, not claim full-chord failure analysis;
- future technique teaching must not claim finger/pick/muting faults unless those are actually measured.

---

# 3. Current Foundation and Limitation

At the time this specification was written, `practice-intelligence.js` already provides:

- `updateSkill(...)`;
- `weakestSkill(...)`;
- `analyzeRun(...)`;
- `smartPracticeStep(...)`;
- deterministic 50–100% speed steps.

Current `analyzeRun(...)` behavior is intentionally simple:

- count misses;
- find the most frequently missed note or Guitar string/fret key;
- sort miss times;
- choose the median miss;
- return an approximate range of four seconds before and after that center.

That is a useful prototype/fallback, not the final Trouble Spot selector.

Future implementation should preserve simple deterministic behavior while making the selected practice range more musically meaningful.

Do not turn this into an opaque machine-learning system.

---

# 4. Trouble Spot Selection Hierarchy

The selector should operate on the **scored active events** for the completed run, respecting all existing scoring exclusions.

For Guitar in particular, intentionally skipped/pruned events must remain excluded from misses, accuracy, coaching, skill history, and Trouble Spot analysis.

## Level A — Authored phrase

If events carry a phrase label/id or can be mapped to an authored phrase:

- group scored events by phrase;
- compute performance for each phrase;
- identify the weakest meaningful phrase;
- recommend that entire phrase.

This is the preferred path for built-in Piano pieces and any built-in Guitar/Bass content with authored phrase metadata.

Example:

> **Practise Phrase B**
>
> 72% accuracy · 4 misses

The child-facing UI does not need to show the percentage unless helpful.

## Level B — Existing practice section

If the song already defines practice sections but not phrase-level scoring metadata:

- map events to the existing section boundaries;
- score each section;
- choose the weakest section with enough evidence.

This is appropriate for Guitar Songbook phrase sections and imported-song sections where authored musical labels are available.

## Level C — Measures / bar groups

If bar/measure numbers are available:

- score measures;
- avoid recommending a single extremely short/empty measure unless musically sensible;
- combine adjacent weak measures into a compact practice unit when necessary.

Typical recommendation:

> **Practise measures 9–12**

A useful target is usually a coherent 1–4 measure span rather than one isolated event.

Do not impose a universal fixed measure count if the content structure clearly suggests another boundary.

## Level D — Error cluster

For imported material without useful authored phrase metadata:

- cluster nearby misses in musical time/event space;
- identify the densest meaningful error region;
- expand the region to nearby bar boundaries when bar data exists;
- otherwise expand to a safe count-in-friendly start/end.

The result should include a little context before the first problem event so the child can enter the phrase naturally.

## Level E — Fallback time/event window

Only when no better structure exists, use a bounded fallback around the error center.

The existing approximate ±4-second range can inform this fallback, but it should:

- clamp to song/section bounds;
- include at least enough material to establish rhythm;
- avoid absurdly tiny loops;
- avoid very long loops that defeat the purpose;
- respect tempo/speed conversion correctly.

---

# 5. What Makes a Section "Weak"?

The algorithm should remain deterministic and explainable.

A section score may consider:

- misses;
- accuracy;
- timing deviation where valid/reliable;
- repeated failure on the same target;
- chord/target-group incompleteness for chord-capable Piano input;
- existing skill-history weakness;
- event count, so one miss in a one-note phrase does not automatically outrank six misses in a dense phrase without context.

Avoid overengineering the first version.

A simple first implementation could rank sections primarily by:

1. miss count/error density;
2. accuracy;
3. repeated weak-skill overlap;
4. recency/position as a deterministic tie-breaker.

The exact formula should be tested against representative real runs before becoming a permanent rule.

Do not change global scoring rules merely to make Trouble Spot selection easier.

---

# 6. Recommendation Confidence / When Not to Recommend

Trouble Spot practice should not appear when the evidence is weak.

Possible reasons to show **no special recommendation**:

- perfect or near-perfect run;
- only one isolated mistake in a long otherwise-clean piece;
- too few scored events;
- the run was aborted before enough material was played;
- active input was unstable/invalid;
- section contains too little playable material;
- all sections performed similarly and no meaningful weak region exists.

In those cases normal result actions are enough:

> `Play Again` · `Choose Another Song`

The app should not manufacture a problem just to display the feature.

---

# 7. Suggested Practice Speed

Trouble Spot Practice should integrate with existing Smart Practice philosophy rather than inventing another unrelated speed ladder.

Existing supported Smart Practice speeds are:

- 50%
- 60%
- 70%
- 80%
- 90%
- 100%

Suggested initial behavior:

## Mild difficulty

If the weak section was close to mastery at the current speed:

- keep the same speed, or
- reduce one step only when useful.

## Clear difficulty

If the section accuracy is materially below target:

- start one speed step below the run speed.

## Severe difficulty

If the child is missing much of the section:

- reduce enough to make success realistic, but do not jump arbitrarily to the slowest speed unless warranted.

## Existing Smart Practice state

If the song/section already has an active Smart Practice state, reuse/continue it where possible rather than maintaining two contradictory speed states.

The recommendation should be easy to understand:

> **Try this part at 70%.**

Do not show formulas or mastery thresholds to the child.

---

# 8. Trouble Spot Practice Session

Selecting `Practise This Part` should create a normal practice run using the existing player wherever possible.

The practice session should reuse:

- the same song/event source;
- the same input mode;
- current instrument configuration;
- count-in;
- backing/accompaniment;
- selected track mute;
- speed controls;
- pause/restart/exit cleanup;
- scoring rules;
- Note Highway/Tab/Falling Notes view;
- Smart Practice state.

Do not create a second simplified scoring engine for Trouble Spots.

## Loop behavior

The selected musical range should be loopable.

A good first flow:

1. short count-in;
2. play Trouble Spot;
3. results for that repetition;
4. Smart Practice decides same speed / step up / step down;
5. replay after user confirmation or an existing deliberate repeat behavior.

Do not trap children in an endless automatic loop with no clear exit.

## Context lead-in

Where practical, begin a little before the first difficult note/bar so the player can establish tempo.

Do not score the lead-in as part of the weak section unless it is actually part of the chosen range.

---

# 9. Child-Facing Results UX

The normal result screen should remain simple.

Recommended pattern:

> **Nice run!**
>
> One part needs a little work.
>
> **Phrase B**
> You missed 4 notes here.
>
> **Practise at 70%**
>
> `Practise This Part`  `Play Again`  `Done`

For very young/beginner-friendly wording:

> **Let's fix one tricky part.**
>
> `Practise This Part`

Possible Guitar/Bass detail when genuinely useful:

> **Watch the A string, fret 3.**

Possible Piano detail:

> **Watch for F4 in this phrase.**

Do not overload the result with a full error report.

---

# 10. Instrument-Specific Behavior

## Guitar

Useful signals:

- scored miss locations;
- string/fret weak keys;
- phrase/section/bar mapping;
- timing where existing scoring provides meaningful data.

Requirements:

- skipped/pruned events remain excluded;
- monophonic microphone limits remain explicit;
- imported Guitar Pro section/backing synchronization remains intact;
- Trouble Spot ranges should not break AlphaTab playback-range/tick synchronization.

## Piano — MIDI / On-Screen

Useful signals:

- target-group completion;
- note/chord misses;
- phrase/measure mapping;
- hand metadata where present;
- chord/interval target groups.

A weak chord should be treated as the musical target group, not merely as several unrelated single-note failures.

## Piano — Microphone

Use the active monophonic learner arrangement.

Do not report:

> "You missed the left-hand chord"

when microphone mode never asked the player to perform that chord.

## Future Bass

Reuse string/fret/section mechanics from Guitar while maintaining separate Bass progress/skill history.

Bass-specific future recommendations could eventually mention:

- pulse consistency;
- repeated root changes;
- root/fifth/octave shapes;
- Drum Lock phrase;

but only if the app has actual evidence for that category.

Do not infer muting/fingerstyle technique correctness from pitch-only detection.

---

# 11. Imported Song Behavior

Trouble Spot Practice is especially valuable for imported songs because they can be long and intimidating.

## Imported Guitar Pro / MusicXML

Prefer, in order:

1. authored/imported bars/sections;
2. nearby bar boundaries;
3. clustered event range.

Maintain:

- chosen track;
- selected player-track mute;
- backing volume;
- speed;
- AlphaTab tick synchronization;
- tempo map;
- A/B loop behavior.

Do not turn the Trouble Spot into a detached event snippet that no longer matches backing playback.

## Imported MIDI Piano

Prefer:

- musical bars if available/derived;
- target-group boundaries;
- phrase analysis if introduced later;
- bounded clustered range otherwise.

Tempo-map behavior must remain correct.

---

# 12. Relationship to Manual A/B Loops

Automatic Trouble Spot Practice should **complement**, not remove, manual A/B looping.

Use cases differ:

### Automatic Trouble Spot

> "The app noticed this was the hardest part."

### Manual A/B loop

> "I want to practise this exact part."

A useful future option may be:

> `Adjust Loop`

which preloads the recommended Trouble Spot boundaries into the existing A/B controls.

Do not require children to manipulate A/B points just to use the automatic recommendation.

---

# 13. Relationship to Weak-Skill History

Per-run Trouble Spot selection and long-term weak-skill history are related but distinct.

## Per-run question

> "What part of this song went worst just now?"

## Long-term question

> "What note/string/fret/skill has been weak across multiple sessions?"

A strong first version should use the current run as the primary source and use long-term skill history only as a tie-breaker/context signal.

Do not recommend an unrelated old weakness instead of the song section the child just struggled with.

Future Today's Practice may use long-term history more heavily.

---

# 14. Data Model Direction

Avoid storing large duplicated copies of event lists.

A Trouble Spot recommendation should conceptually be lightweight, for example:

```text
instrument
source/song id
track/arrangement id where relevant
section/phrase/measure identifier
start/end musical position
recommended speed
weak key (optional)
reason summary
run id/timestamp (optional)
```

Exact fields should match the architecture at implementation time.

Do not introduce a save-schema migration solely to persist transient recommendations unless persistence has a clear product need.

A recommendation may initially exist only for the current results/session.

---

# 15. Smart Practice Integration

Trouble Spot Practice should feed naturally into existing Smart Practice behavior.

Expected loop:

```text
Full/section run
      ↓
Identify Trouble Spot
      ↓
Recommend speed
      ↓
Practice Trouble Spot
      ↓
3 strong repetitions → speed up
      ↓
Performance falls apart → step down
      ↓
Reach 100% / mastery
      ↓
Return to full section/song
```

A useful completion prompt:

> **Nice — that part is stronger now.**
>
> `Try the Full Song Again`

This closes the learning loop instead of leaving the child permanently practising fragments.

---

# 16. Today's Practice Integration

Future integration may use Trouble Spot history to improve Today's Practice.

Examples:

- unfinished Trouble Spot from yesterday;
- repeatedly weak phrase in a current song;
- mastered Trouble Spot ready to return to full-song testing.

Do not add this automatically in the first implementation unless release scope permits it.

The first release should prioritize the immediate post-run recommendation.

---

# 17. Parent/Teacher Reporting

The normal child-facing experience should remain simple, but future parent/teacher summaries may show:

- most-practised Trouble Spots;
- sections that improved after focused practice;
- current recurring weak skills;
- speed progression;
- whether the child returned successfully to the full piece.

Do not turn Trouble Spot practice into surveillance-like reporting or expose raw technical event logs unnecessarily.

---

# 18. Performance Requirements

Trouble Spot analysis should happen **after the run** or at another low-frequency point, not add expensive repeated work to animation/audio loops.

Requirements:

- avoid new per-frame whole-song scans;
- reuse existing scored-event summaries where possible;
- large imported songs must not become less playable because Trouble Spot analysis was added;
- post-run analysis should be bounded and efficient;
- no audio scheduling should wait on heavy analysis.

Use `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` when implementation touches imported-song runtime behavior.

---

# 19. Automated Testing

A focused implementation should add deterministic tests for the selector rather than relying on browser snapshots.

At minimum test:

- phrase with highest meaningful error rate is selected;
- authored phrase boundaries beat arbitrary time windows;
- measure/bar fallback works;
- adjacent weak measures can form one coherent range;
- fallback range clamps to song bounds;
- skipped Guitar events do not influence selection;
- perfect/near-perfect run can return no recommendation;
- insufficient evidence can return no recommendation;
- Piano target-group/chord behavior remains intact;
- microphone Piano recommendations use the active monophonic arrangement;
- suggested speed stays within supported Smart Practice speeds;
- severe failure can step down appropriately;
- recommendation does not mutate source song data;
- profile/instrument histories stay isolated;
- existing Smart Practice tests remain green.

Avoid brittle tests tied to exact UI wording unless the wording itself is an accessibility/behavior requirement.

---

# 20. Playwright / Browser Acceptance

Where browser coverage adds value, verify:

- completing a deliberately poor run can show one Trouble Spot recommendation;
- `Practise This Part` launches the intended bounded section;
- the selected speed is applied;
- correct view/player is retained;
- pause/restart/exit cleanup remains correct;
- finishing Trouble Spot practice can return to the original song/section;
- a strong run does not force an unnecessary Trouble Spot prompt;
- profile switching does not leak a previous player's recommendation.

Do not claim Playwright proves the recommendation is musically ideal. Musical acceptance remains a human responsibility.

---

# 21. Human Acceptance Checklist

## Guitar

- intentionally miss one concentrated phrase;
- recommendation selects that phrase/nearby bars, not a random part of the song;
- skipped-density notes do not count as Trouble Spots;
- backing and selected-track mute stay synchronized;
- recommended speed feels reasonable;
- repeat/exit/full-song return works;
- child can understand what to do without explanation.

## Piano MIDI

- deliberately fail one chord/phrase;
- recommendation maps to the intended musical phrase;
- chord errors are not presented as nonsensical unrelated notes;
- section practice launches correctly;
- accompaniment cleanup remains correct.

## Piano microphone

- recommendation reflects only notes actually expected in microphone mode;
- no fake chord/left-hand diagnosis appears.

## Imported song

- long song produces a compact useful practice region;
- loop starts with enough rhythmic context;
- tempo/speed/backing stay synchronized;
- returning to Full Song is easy.

## Child usability

Ask the practical question:

> **Without being told what this feature does, does the child understand that the app found a hard part and is offering to practise it?**

If not, the feature is not done even if its algorithm is technically correct.

---

# 22. Initial Release Scope Recommendation

Keep the first Trouble Spot release focused.

Recommended v1 scope:

- post-run analysis only;
- one recommended section;
- phrase/section/measure-aware selection;
- fallback clustered range;
- Smart Practice-compatible speed suggestion;
- one-click launch into existing player;
- return to original song/full-song flow;
- Guitar + Piano support where current metadata permits;
- automated selector tests;
- Playwright smoke coverage;
- Chromebook/manual musical acceptance.

Defer unless clearly cheap:

- multiple ranked recommendations;
- heatmaps;
- long-term dashboards;
- automatic Today's Practice scheduling;
- parent analytics;
- AI-generated explanations;
- technique inference;
- cloud history.

---

# 23. Explicit Non-Goals

The first implementation should **not**:

- change global scoring rules;
- widen hit windows to improve recommendations;
- punish skipped/pruned notes;
- replace manual A/B loops;
- create a second practice player;
- add expensive analysis to requestAnimationFrame/audio loops;
- pretend microphone Piano supports polyphonic diagnosis;
- pretend Guitar/Bass pitch input can diagnose finger choice or muting technique;
- require cloud/AI services;
- force remediation after every imperfect run.

---

# 24. Definition of Done

Automatic Trouble Spot Practice is successful when:

- a meaningful weak musical region can be identified from a completed run;
- phrase/section/measure boundaries are preferred when available;
- the recommendation is deterministic enough to test and explain;
- the player can enter that region with one obvious action;
- the practice run reuses existing scoring/player/backing/loop infrastructure;
- Smart Practice speed progression integrates cleanly;
- skipped/unscored events remain excluded;
- Guitar/Piano input limitations are represented honestly;
- imported-song synchronization remains correct;
- performance-sensitive gameplay loops are not made heavier;
- the child understands the recommendation;
- and the workflow encourages returning to the complete song after the Trouble Spot improves.
