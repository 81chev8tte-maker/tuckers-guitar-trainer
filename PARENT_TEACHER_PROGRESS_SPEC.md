# Family Music Quest — Parent / Teacher Progress Summary Specification

This document defines the intended design for a local-first **Parent / Teacher Progress Summary** in Family Music Quest.

It is a planning/source-of-truth document. It does **not** authorize unrelated implementation work and should be implemented only in a focused release after the current player/performance foundations are stable.

The product goal is:

> **Give a parent, teacher, or older helper a quick, useful picture of what the child has been practising, what is improving, and what would be worth practising next — without requiring cloud accounts, invasive tracking, or technical interpretation of raw event logs.**

---

# 1. Current Foundation

Family Music Quest already stores local player profiles and separate per-instrument progress containers.

Current Guitar progress includes concepts such as:

- XP;
- stars;
- song bests;
- level runs;
- total hits/misses;
- best combo;
- best accuracy;
- practice seconds;
- practice days;
- missions/song runs;
- Smart Practice / skill model data;
- input/practice settings.

Piano has its own separate progress model and practice history.

Future Bass Quest is intended to have its own independent progress container as well.

The app also already has or plans to have:

- weak-skill history;
- Smart Practice speed progression;
- built-in curriculum progress;
- song/section bests;
- Today’s Practice;
- Automatic Trouble Spot Practice;
- per-player profiles;
- local backup/restore.

The missing layer is a concise, human-readable summary for someone helping the learner.

---

# 2. Product Principles

## Local-first by default

The first implementation should require:

- no Family Music Quest account;
- no server database;
- no cloud sync;
- no teacher login;
- no remote monitoring.

The summary should be generated from the same local profile/progress data already stored on the device.

## Useful, not surveillance-like

The summary should answer practical learning questions such as:

- How much did they practise?
- What have they completed?
- What is improving?
- What is still difficult?
- What song/lesson are they currently working on?
- What should they practise next?

Avoid collecting or presenting unnecessary detail such as:

- every exact timestamped note played;
- raw microphone recordings;
- continuous device activity;
- browsing history;
- keystroke history unrelated to music practice.

Do not record audio for this feature.

## Explainable metrics only

Do not invent vague scores such as:

- “Musical Talent 87%”;
- “Focus Score 72”;
- “Potential 9/10.”

Every displayed metric should have a clear basis in real app activity.

Good examples:

- `42 minutes practised this week`
- `3 songs improved`
- `Ode to Joy: 78% → 91%`
- `Weakest Guitar area: A string, fret 3`
- `Smart Practice reached 90% speed`

## Separate instruments

Do not merge Guitar, Piano, and future Bass into one meaningless overall skill score.

A player can be advanced in Piano and brand-new on Guitar.

The summary should provide:

- an overall practice snapshot;
- separate Guitar summary;
- separate Piano summary;
- future separate Bass summary.

## Encourage, do not shame

Parent-facing wording should remain factual and constructive.

Prefer:

> `Practised 2 days this week. Most improvement: Jingle Bells.`

Avoid:

> `Only practised 2 days.`

The feature should support learning conversations, not create punishment metrics.

---

# 3. Entry Point

Recommended entry point from the profile/home area:

> **Progress Summary**

Alternative child-friendly label:

> **My Progress**

with an optional parent/helper view inside it.

Do not put the full report directly on the main instrument screen where it would clutter normal play.

The summary should clearly show which profile is being viewed.

Example:

> **Tucker’s Progress**
>
> Guitar · Piano

Profile switching must refresh the report immediately.

---

# 4. Time Ranges

The first version should support a small number of understandable ranges.

Recommended:

- **This Week**
- **Last 30 Days**
- **All Time**

Do not build a complex analytics date picker initially.

## Week definition

Use a documented local calendar-week rule and apply it consistently.

Do not derive “this week” from UTC in a way that shifts practice days around local midnight.

## Historical limitations

Only show trends that can be supported by stored historical records.

If the current data only stores cumulative totals and a set of practice days, do not fabricate exact prior-week practice minutes.

A future implementation may need lightweight session/run summaries to support real weekly/monthly trends.

---

# 5. Overview Card

The top of the report should be glanceable.

Potential overview fields:

### Practice

- practice time in selected period where genuinely available;
- number of practice days;
- recent activity date;
- current streak only if streak rules are explicitly defined and correctly stored.

### Progress

- lessons/checkpoints completed;
- songs played;
- songs improved;
- current instrument/course world.

### Current focus

One concise next-practice recommendation, for example:

> **Suggested next:** Guitar · Ode to Joy · Phrase B at 80%

This can later consume Automatic Trouble Spot / Today’s Practice recommendations.

Do not show a recommendation if there is not enough evidence.

---

# 6. Instrument Summary Cards

Each supported instrument should have its own card.

## Guitar

Potential fields:

- current world/mission progress;
- stars earned;
- recent song bests;
- best accuracy;
- best combo;
- practice time/days;
- weakest sufficiently-sampled string/fret skill;
- strongest sufficiently-sampled string/fret skill;
- current Smart Practice song/section and speed where meaningful;
- most recent Trouble Spot / improvement result when that feature exists.

Example:

> **Guitar Quest**
>
> 3 practice days this week
> 5 missions completed
> Best recent improvement: Ode to Joy 76% → 90%
> Working on: A string fret 3
> Smart Practice: Phrase B at 80%

## Piano

Potential fields:

- curriculum progress;
- Songbook bests;
- recent practice days/time;
- weak notes/target groups where enough evidence exists;
- hand/section progress only where the data actually records it;
- current Smart Practice material;
- recent Trouble Spot improvement.

Do not present microphone-mode results as full chord-performance evidence.

## Future Bass

Potential fields:

- Bass curriculum/world progress;
- practice time/days;
- song/groove bests;
- weak string/fret skills;
- Drum Lock progress;
- root/fifth/octave skill progress where actually measured;
- current Smart Practice speed;
- Trouble Spot improvement.

Keep Bass separate from Guitar even though parts of the engine are shared.

---

# 7. Progress Over Time

The most useful trend is **improvement**, not just accumulated XP.

Good trend examples:

- song best accuracy improved;
- Smart Practice speed increased;
- Trouble Spot mastered;
- repeated weak skill success rate improved;
- more curriculum checkpoints completed.

## Minimal first implementation

If historical run records are limited, show only trends that existing data can prove.

Do not infer:

> `Improved 18% this week`

from one current cumulative best and no historical baseline.

## Future lightweight run history

If a later release adds compact run summaries, prefer a bounded local history such as:

```text
run id/date
instrument
content id
section/phrase id
speed
accuracy
score/stars
practice duration
trouble-spot result (optional)
```

Do not store full note-by-note event arrays indefinitely just to build charts.

Retention should be bounded and documented.

---

# 8. Song / Piece Progress

A useful report should make it easy to answer:

> “What songs are they actually learning?”

Recommended per-piece summary where data exists:

- title;
- instrument;
- best accuracy;
- best speed/mastered speed;
- best stars;
- most recent attempt;
- whether Full Song was completed;
- phrase/section currently being practised;
- recent improvement.

Example:

| Piece | Status | Best |
| --- | --- | --- |
| Ode to Joy | Full Song completed | 91% at 100% |
| Jingle Bells | Phrase practice | 86% at 80% |
| Amazing Grace | Learning | 74% at 70% |

Do not expose copyrighted imported-song content itself in an exported summary; title/metadata and performance results are sufficient.

---

# 9. Skills View

The existing skill model is useful but too technical for normal presentation.

The parent/helper view should translate skill keys into plain language.

Examples:

### Guitar / Bass

Internal:

`string:1:fret:3`

Display:

> `A string · fret 3`

### Piano

Internal:

`note:60`

Display:

> `Middle C (C4)`

## Strong / needs practice

Only classify a skill after a minimum meaningful attempt count.

Do not label a note “weak” after one accidental miss.

Recommended categories:

- **Going well**
- **Needs more practice**

Avoid ranking every child skill from best to worst.

## Timing

If timing data is included, present it only when the underlying measurement/calibration makes it meaningful.

Do not show misleading millisecond precision before latency calibration is implemented and validated.

See `LATENCY_CALIBRATION_SPEC.md`.

---

# 10. Trouble Spot Integration

After `TROUBLE_SPOT_PRACTICE_SPEC.md` is implemented, the report can show useful outcomes rather than raw errors.

Examples:

> **Improved this week**
>
> Jingle Bells · Measures 9–12
> Started at 60% → reached 90%

or:

> **Still working on**
>
> Ode to Joy · Phrase B
> Recommended next speed: 80%

The report should distinguish:

- currently unresolved Trouble Spot;
- improved/mastered Trouble Spot;
- returned successfully to Full Song.

Do not list every miss that created the recommendation.

---

# 11. Smart Practice Integration

Smart Practice already has a meaningful progression model based on repeated successful attempts and 50–100% speed steps.

The summary should expose outcomes in simple language.

Good:

> `Stepping Stones: built from 60% to 90%`

> `Phrase B: 2 of 3 strong tries at 80%`

Avoid:

> `Adaptive state = {speed:.8, successes:2, mastery:85}`

The report should never imply the child mastered a piece at 100% if the Smart Practice state did not actually reach mastery.

---

# 12. Curriculum Progress

For structured Guitar/Piano/Bass lessons, the summary should show meaningful milestones rather than a wall of individual exercise IDs.

Potential structure:

> **Guitar Quest**
> World 3 · 4/6 activities complete

> **Piano Quest**
> Level 5 · Concert checkpoint next

> **Bass Quest**
> World 2 · Four-String Navigator *(future)*

Where useful, include recent milestone messages:

> `Completed First Low-End Groove`

Do not expose future Bass UI before Bass Quest ships.

---

# 13. Practice Consistency

Practice consistency can be useful if presented gently.

Potential information:

- practice days in selected range;
- total practice time where genuinely available;
- longest recent session only if session data is reliable;
- streak only if exact rules and local-day handling are correct.

Do not use manipulative streak-loss language.

Prefer:

> `Practised 4 days this week`

rather than:

> `You broke your 12-day streak.`

The goal is sustainable learning, not compulsive engagement.

---

# 14. “What to Practise Next”

One of the report’s most valuable sections should be a concise recommendation.

Priority sources may eventually be:

1. unresolved Trouble Spot from current material;
2. active Smart Practice section;
3. next curriculum lesson/checkpoint;
4. sufficiently established weak skill;
5. recent song ready for Full Song retry.

The recommendation should remain deterministic and explainable.

Example:

> **Next practice**
>
> Guitar · Jingle Bells · Phrase 2
> Start at 80%
> Why: this was the hardest part of the last run.

Do not use opaque AI-generated coaching that contradicts the app’s actual progress state.

---

# 15. Child View vs Parent / Teacher Detail

The same data can support two presentation levels without separate accounts.

## Child-facing My Progress

Emphasize:

- stars;
- completed worlds/levels;
- songs learned;
- recent wins;
- one next goal.

Keep it encouraging and simple.

## Parent / Teacher Detail

Add:

- practice time/days;
- recent improvement;
- weak/strong skills with evidence thresholds;
- current Smart Practice state;
- Trouble Spot status;
- curriculum position;
- export/print option when implemented.

Do not require a secret parent PIN in the first version unless there is a clear product reason.

---

# 16. Export / Print Direction

A future useful feature is a simple **Progress Report** that can be:

- printed;
- saved as PDF through the browser print flow;
- exported as a compact JSON/CSV only if genuinely useful for technical analysis.

The human-facing report should be designed for readability, not raw database dumping.

Example printable sections:

- player name/avatar;
- date range;
- practice summary;
- instrument summaries;
- recent achievements;
- current focus;
- recommended next practice.

Do not include:

- device IDs;
- microphone noise-floor values;
- raw MIDI events;
- private technical diagnostics

unless the user explicitly exports a separate hardware report.

---

# 17. Privacy and Data Boundaries

The first implementation should remain entirely local.

Do not add:

- analytics SDKs;
- advertising identifiers;
- background telemetry;
- cloud student profiles;
- remote teacher dashboards;
- automatic emailing of reports;
- raw audio storage.

If remote sharing is ever considered later, it requires a separate privacy/product decision and should not be smuggled into this feature.

---

# 18. Data Accuracy Rules

The report must not silently equate different concepts.

Examples:

### Best accuracy is not current ability

A historical 100% best does not mean every current run is 100%.

Label it clearly as **Best**.

### XP is not mastery

XP can show engagement/progression, but should not be treated as a direct musical skill percentage.

### Microphone and MIDI evidence differ

A Piano MIDI run may provide chord/polyphony evidence that Piano microphone mode does not.

Do not compare those modes as though the observations were identical.

### Skipped Guitar events are not misses

Existing scoring exclusions must carry through to any summary derived from scoring history.

### Imported content may have different difficulty

Do not compare raw accuracy across unrelated songs and declare one musical skill better without context.

---

# 19. Suggested First-Version Layout

A practical first release could use:

```text
Tucker’s Progress
This Week | 30 Days | All Time

OVERVIEW
Practice days · practice time · recent milestone

GUITAR QUEST
Current world
Recent songs
Needs practice
Smart Practice

PIANO QUEST
Current level
Recent songs
Needs practice
Smart Practice

NEXT PRACTICE
One recommendation

[Print / Save Report]   [Close]
```

Future Bass card appears only after Bass Quest ships.

Avoid a dense analytics dashboard with tiny charts on the Chromebook.

---

# 20. Charts

Charts are optional, not required for the first version.

If added later, useful simple charts may include:

- practice days over recent weeks;
- song accuracy/speed trend for one selected piece;
- Smart Practice speed progression.

Do not add charts where the historical data is insufficient.

A table or concise sentence is better than a misleading graph.

---

# 21. Storage Direction

Prefer deriving the report from existing progress where possible.

If trends require additional storage, add only compact bounded summaries.

Potential future run-summary record:

```text
id
date/time
local day
instrument
content id/type
section id
input mode
speed
accuracy
stars
practice duration
result status
trouble spot id/result (optional)
```

Do not persist:

- full event arrays;
- raw pitch frames;
- microphone samples;
- every MIDI event

for long-term reporting.

Retention limits should be deliberate.

---

# 22. Backup / Restore

If the progress summary adds new persistent learning-history records, current-version backup/restore should include them.

Follow the active development-save policy in `DECISIONS.md`:

- current-version data should work reliably;
- do not spend disproportionate time preserving old development schemas unless policy later changes.

Imported song files themselves remain governed by the existing backup policy.

---

# 23. Performance Requirements

The summary must not affect gameplay performance.

Requirements:

- no report aggregation in animation loops;
- no report aggregation in microphone pitch callbacks;
- no large note-event history kept solely for reporting;
- calculate summaries when opening the report or from compact precomputed records;
- normal gameplay remains unchanged when the report is closed.

On the target Chromebook, opening the report should feel immediate with realistic local history sizes.

---

# 24. Accessibility / Readability

The report should work for a parent glancing at the Chromebook as well as a child.

Requirements:

- large readable text;
- strong contrast;
- do not rely on color alone for strong/weak status;
- no tiny chart labels;
- touch-friendly controls;
- printable layout should remain readable in grayscale;
- plain-language skill names.

Avoid red/green-only performance coding.

---

# 25. Automated Tests

A future implementation should add focused deterministic tests for:

- correct active-profile isolation;
- Guitar/Piano/Bass progress kept separate;
- practice-day aggregation;
- date-range filtering using local-day rules;
- best-vs-recent labels;
- minimum-attempt threshold before weak-skill labeling;
- skill-key human-readable formatting;
- Smart Practice status formatting;
- Trouble Spot summary integration;
- no future Bass card before Bass Quest is enabled;
- backup/restore inclusion if new persistent summary data is introduced;
- profile deletion removes/report-isolates associated local progress as existing profile semantics require.

Do not make tests depend on the real current date without an injectable/testable clock where practical.

---

# 26. Playwright Coverage

Useful browser smoke coverage:

- open Progress Summary from active profile;
- correct player name shown;
- switch profile and verify report changes;
- Guitar and Piano cards remain separate;
- report works with only Guitar progress;
- report works with only Piano progress;
- report handles brand-new profile gracefully;
- close/reopen report without gameplay side effects;
- print-friendly mode does not create horizontal overflow at Chromebook-like viewport;
- future Bass card only when Bass is actually supported.

Playwright should not attempt to prove long-term musical improvement by itself.

---

# 27. Manual Acceptance

On the target Chromebook verify:

## New profile

- summary opens cleanly;
- no fake zero-heavy analytics wall;
- clear message such as `Play a few lessons and your progress will appear here.`

## Active Guitar learner

- practice days/time match known activity;
- stars/course position make sense;
- recent song bests are correct;
- weak skill wording matches actual stored skill data;
- Smart Practice status matches gameplay.

## Active Piano learner

- curriculum/song progress correct;
- microphone/MIDI evidence is not misrepresented;
- recommendations point to real current material.

## Multiple profiles

- no Tucker/Nova progress leakage between reports;
- switching profiles updates immediately.

## Print / Save

If implemented:

- readable on paper/PDF;
- no clipped cards;
- no raw technical diagnostic data.

---

# 28. Explicit Non-Goals for the First Version

Unless separately approved, do not add:

- cloud accounts;
- teacher portals;
- school/class management;
- remote monitoring;
- email reports;
- push notifications to parents;
- leaderboard comparisons between children;
- AI-generated personality judgments;
- raw audio recording;
- detailed surveillance timelines;
- complex BI-style analytics dashboards.

---

# 29. Relationship to Other Specifications

This feature should integrate with, but not duplicate:

- `TROUBLE_SPOT_PRACTICE_SPEC.md` — targeted weak-section recommendations;
- `LATENCY_CALIBRATION_SPEC.md` — timing data credibility;
- `HARDWARE_SETUP_WIZARD_SPEC.md` — hardware readiness, kept separate from musical progress;
- `BASS_QUEST_SPEC.md` / `BASS_CURRICULUM_PLAN.md` — future independent Bass progression;
- `PWA_OFFLINE_UPDATE_SPEC.md` — installed/offline reliability;
- current backup/restore policy.

Hardware diagnostics should remain a separate technical report. Musical progress should not be cluttered with device troubleshooting data.

---

# 30. Definition of Done

A Parent / Teacher Progress Summary release is complete when:

- the active player’s data is clearly isolated;
- Guitar/Piano/future Bass remain separate;
- the report uses only metrics the app can actually support;
- practice consistency and progression are understandable at a glance;
- weak skills require meaningful evidence;
- Smart Practice/Trouble Spot outcomes are translated into plain language;
- one useful next-practice recommendation is shown when justified;
- no cloud account is required;
- no raw audio or surveillance-style telemetry is added;
- gameplay performance is unaffected while the report is closed;
- Chromebook layout and print/export behavior are physically checked;
- automated tests protect profile isolation and summary calculations.
