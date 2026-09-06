# Family Music Quest — Release Process

Family Music Quest is developed in focused, agent-assisted releases. This process is designed to keep changes reviewable, preserve working behavior, and ensure real-world hardware testing remains authoritative.

## Release-scope rule

**One focused release at a time.**

Avoid combining several unrelated major features into one release.

Bug-fix, correctness, maintenance, and polish releases are valid releases. A release does not need a shiny new feature.

If real-world testing exposes a foundational problem, fixing it takes priority over roadmap expansion.

## Phase 1 — Inspect

Before planning implementation, the coding agent must inspect the relevant current repository state.

At minimum:

- read `AGENTS.md`;
- read `PROJECT.md`;
- read relevant sections of `ARCHITECTURE.md`, `TESTING.md`, `DECISIONS.md`, and `ROADMAP.md`;
- inspect the files that actually implement the affected feature;
- inspect current tests around that feature;
- inspect recent fixes that could regress;
- inspect storage/input/audio/PWA code if the change crosses those boundaries.

Do not plan from chat history alone when the repository can answer the question.

## Phase 2 — Plan

Before substantial implementation, the agent should be able to state:

- what it found;
- which systems are affected;
- what behavior will change;
- what behavior will intentionally remain unchanged;
- known regression risks;
- data/save implications;
- hardware/performance implications;
- the automated test plan;
- the manual acceptance plan.

For small obvious bug fixes this can be concise, but the reasoning still needs to exist.

## Phase 3 — Implement

Favor the smallest coherent implementation that solves the release goal.

Rules:

- avoid unrelated cleanup;
- do not replace working architecture without justification;
- reuse established patterns when they fit;
- improve abstractions only where the release genuinely needs it;
- do not silently change scoring, input, save, or rights behavior;
- do not remove tests because a change broke them;
- update tests when intended behavior changes;
- add dependencies only when the benefit justifies the maintenance/performance cost.

## Phase 4 — Validate

Run the repository's applicable current checks.

At present the normal validation set is:

```bash
npm test
npm run check
npm run test:browser
```

CI should also pass.

If the repository later adds lint/build/typecheck scripts, update `TESTING.md` and this file rather than assuming those checks exist today.

For PWA-sensitive releases, confirm release/cache asset versions remain aligned.

For performance-sensitive releases, compare representative before/after behavior rather than declaring improvement from code inspection alone.

## Phase 5 — Human hardware acceptance

The coding agent must explicitly acknowledge where automation is insufficient.

Examples include:

- microphone responsiveness;
- actual electric/acoustic Guitar input;
- USB guitar/audio-interface behavior;
- real MIDI keyboard behavior;
- sustain pedal behavior;
- target Chromebook performance;
- perceived input/output latency;
- audible stutter/dropouts;
- Note Highway readability at playing distance;
- Tab View usability during a dense song;
- musical feel and accompaniment balance;
- whether a child understands what to do.

A release touching these areas should include a short human acceptance checklist drawn from `TESTING.md`.

Real-world test results outrank an automated test that does not actually reproduce the problem.

## Phase 6 — Release notes

Every release report should include:

- version;
- release goal;
- PR number if applicable;
- merge commit SHA;
- meaningful files/systems changed;
- user-visible behavior changed;
- important behavior deliberately preserved;
- tests run;
- CI result;
- PWA/cache version where applicable;
- save/schema changes;
- known limitations;
- manual hardware testing still recommended;
- any newly discovered technical/test debt.

Do not claim subjective musical/audio quality was verified if no human actually listened/tested it.

## Definition of Done

A release is normally complete when:

- requested behavior is implemented;
- related working behavior is preserved;
- acceptance criteria are satisfied;
- applicable automated tests pass;
- current repository syntax/build-equivalent validation succeeds;
- documentation is current;
- regression risk has been considered;
- manual hardware checks are clearly identified;
- no known major blocker is hidden.

## Writing good acceptance criteria

Prefer observable outcomes over vague implementation requests.

Good:

> Imported Guitar songs should play without audible stutter during normal gameplay on the target Chromebook.

Weak:

> Optimize audio.

Good:

> The Guitar Tab View should show a readable bounded musical window with a stable playhead and should not require the child to chase tiny horizontally scrolling event cells during normal play.

Weak:

> Make tabs better.

Good:

> A C-major Piano chord must score when Note On events arrive C-E-G, G-C-E, or E-G-C, and the target must not advance until all required pitches are received.

Weak:

> Improve MIDI chords.

## Project Manager vs Coding Agent vs Human tester

### Project Manager

Owns:

- release scope;
- priorities;
- acceptance criteria;
- roadmap;
- regression requirements;
- whether a discovered issue blocks expansion;
- review of agent reports;
- sequencing of releases.

### Coding Agent

Owns:

- repository inspection;
- implementation;
- automated tests;
- CI/build-equivalent verification;
- documentation updates;
- identification of technical risks;
- explanation of tradeoffs.

The coding agent does not get to dismiss real-world failures because tests pass.

### Human tester / product owner

Owns final judgment on:

- actual instruments and hardware;
- Chromebook usability;
- child usability;
- musical quality/feel;
- audio quality;
- perceived latency;
- whether a feature solves the intended learning problem.

## Maintenance-release guidance

Schedule maintenance-focused releases periodically instead of continuously adding features.

Useful maintenance goals:

- remove confirmed dead code;
- consolidate safe duplication;
- reduce test debt;
- investigate measured performance hotspots;
- carefully update dependencies;
- simplify brittle code;
- improve documentation;
- review accessibility;
- review PWA/offline reliability.

Maintenance work must remain scoped. It is not permission for a broad rewrite.
