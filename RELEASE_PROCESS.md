# Family Music Quest — Release Process

Family Music Quest is developed in focused, agent-assisted releases. This process is designed to keep changes reviewable, preserve working behavior, and ensure real-world hardware testing remains authoritative.

## Release-scope rule

**One focused release at a time.**

Avoid combining several unrelated major features into one release.

Bug-fix, correctness, maintenance, and polish releases are valid releases. A release does not need a shiny new feature.

If real-world testing exposes a foundational problem, fixing it takes priority over roadmap expansion.

## Durable truth vs execution records

Repository documentation and GitHub have different jobs:

- `PROJECT.md`, `DECISIONS.md`, `ROADMAP.md`, `TECHNICAL_DEBT.md`, and feature specifications remain the durable product/governance source of truth.
- GitHub Issues are the normal actionable execution record for approved work packages, reproducible bugs/findings, and explicit acceptance tasks.
- A simple GitHub Project tracks execution state.
- Pull Requests record focused implementation/change sets.
- CI records automated validation.
- hardware reports and manual testing record physical acceptance evidence.
- the Project Manager decides scope, priority, release grouping, blocker status, and final pass/fail.

Do not convert every roadmap idea, specification item, or debt entry into an Issue. Create an Issue when a topic becomes concrete enough to reproduce, prioritize, implement, or accept.

## Issue workflow

Preferred Project states:

**Backlog → Ready → In Progress → Needs Hardware Test → Done**

- **Backlog** — actionable, but not approved for immediate implementation.
- **Ready** — Project Manager-approved work package. This is the implementation authorization boundary for the Build Agent.
- **In Progress** — an agent is actively working the approved Issue.
- **Needs Hardware Test** — implementation/CI is complete, but required physical acceptance remains outstanding.
- **Done** — all required implementation and acceptance gates are complete.

For work that genuinely does not require hardware acceptance, In Progress may move directly to Done after normal completion gates.

An implementation-ready Issue should normally contain:

- concise problem/goal and why it matters;
- current evidence/reproduction where applicable;
- approved scope;
- explicitly out-of-scope behavior;
- observable acceptance criteria;
- regression requirements;
- automated tests expected;
- manual/physical hardware testing still required;
- relevant permanent docs/specs to read.

Do not repeat the entire repository history in an Issue. The Build Agent still reads `AGENTS.md` and the relevant current repository documentation/implementation before coding.

A normal handoff is deliberately compact:

> Work GitHub Issue #XX. Read `AGENTS.md` and all required/relevant repository documentation first. Treat the Issue acceptance criteria as the approved implementation boundary. Open a focused PR after implementation and automated validation. Do not expand scope.

An Issue in Backlog is **not** approved scope merely because it exists. Ready means approved.

## Hardware findings and acceptance

Real Chromebook/instrument findings should become Issues when they expose a concrete actionable problem or a defined acceptance task. Useful evidence can include:

- FMQ version;
- hardware-report session ID;
- expected behavior;
- observed behavior;
- reproduction frequency;
- device/input;
- screenshot/video/report filenames or labels where useful;
- whether the finding blocks expansion.

Do not create one Issue per observation automatically. Consolidate related findings when that produces a clearer work package.

Automated completion and physical acceptance remain separate gates. If implementation is complete but hardware testing is still required, the PR may be merged when appropriate while the Issue/Project item remains **Needs Hardware Test**. Add or reference the physical evidence on the Issue, then let the Project Manager decide PASS/BLOCKER and move it to Done or back into focused follow-up work.

CI does not prove microphone, MIDI, USB-audio behavior, target-Chromebook performance, perceived latency, readability, musical feel, audio quality, or child usability.

The current **v2.6.8 Monday hardware-acceptance gate remains the active product gate**. This GitHub workflow does not pre-create speculative bug Issues or make Bass Quest Ready. Monday evidence should be recorded first; actionable findings can then become/refine Issues, while a clean acceptance result closes the gate through normal Project Manager judgment.

## Minimal labels

Labels are for useful category/risk filtering, not workflow status. Prefer a small convention and reuse existing equivalents:

- `bug`
- `hardware-test`
- `guitar`
- `piano`
- `bass`
- `pwa`
- `performance`
- `testing`
- `documentation`
- `maintenance`
- `future`
- `blocker`

Do not add Ready/In Progress/etc. labels when the Project board already represents state.

## Phase 1 — Inspect

Before planning implementation, the coding agent must inspect the relevant current repository state.

At minimum:

- read `AGENTS.md`;
- read `PROJECT.md`;
- read relevant sections of `ARCHITECTURE.md`, `TESTING.md`, `DECISIONS.md`, and `ROADMAP.md`;
- read the approved Issue/work package when one exists;
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

The approved Issue acceptance criteria are the release/work-package boundary unless the Project Manager explicitly changes them. Discovery of unrelated work should be reported rather than silently absorbed into scope.

## Phase 3 — Implement

Favor the smallest coherent implementation that solves the release goal.

Normal flow:

**approved Issue/work package → focused branch → implementation → tests → PR → CI → acceptance**

Rules:

- avoid unrelated cleanup;
- do not replace working architecture without justification;
- reuse established patterns when they fit;
- improve abstractions only where the release genuinely needs it;
- do not silently change scoring, input, save, or rights behavior;
- do not remove tests because a change broke them;
- update tests when intended behavior changes;
- add dependencies only when the benefit justifies the maintenance/performance cost.

## Phase 4 — Pull Request and automated validation

When an Issue exists, the PR should reference it. Prefer GitHub closing syntax (`Closes #XX`) only when merging the PR really completes the Issue; if physical acceptance remains, use a non-closing reference such as `Refs #XX` so the Issue can remain in Needs Hardware Test.

PR descriptions should summarize:

- release/work goal;
- what changed;
- important behavior deliberately preserved;
- validation completed;
- remaining physical acceptance;
- known limitations.

Avoid unrelated changes in the PR.

Normal main-branch policy should be PR-first with applicable FMQ CI green before merge. Repository protection/ruleset settings should enforce this where the account/repository supports it, without requiring a second human reviewer solely for formality.

Run the repository's applicable current checks.

At present the normal validation set is:

```bash
npm test
npm run check
npm run test:browser
```

CI should also pass before merge.

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

When a hardware-dependent Issue is implemented, keep it in **Needs Hardware Test** until the required evidence is recorded and the Project Manager closes the gate.

## Phase 6 — Release notes and Issue closure

Every release report should include:

- version;
- release goal;
- Issue number when applicable;
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

Move the Issue to Done only after all required acceptance gates are satisfied. If physical evidence exposes a blocker, keep/reopen the actionable work rather than treating a green PR as product acceptance.

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

## Project Manager vs Build Agent vs Human tester

### Project Manager

Owns:

- deciding whether something becomes an Issue;
- release scope and grouping;
- priorities;
- Issue acceptance criteria;
- moving actionable work to Ready;
- regression requirements;
- roadmap;
- whether hardware evidence is a blocker;
- closing physical acceptance gates and deciding Done.

### Build Agent

Owns:

- one approved Ready Issue/work package at a time;
- repository inspection;
- implementation;
- automated tests;
- focused branch and PR;
- CI/build-equivalent verification;
- documentation updates within scope;
- identification of technical risks;
- technical completion report.

The Build Agent must not treat a Backlog Issue as approved scope and does not get to dismiss real-world failures because tests pass.

### Advisor

Remains advisory. Workflow/tool/governance recommendations do not become implementation scope automatically.

### Ideas

Remains product/strategy brainstorming. Ideas do not automatically become Issues or releases; the Project Manager reconciles them against repository truth and current priorities first.

### Human tester / product owner

Owns final evidence/judgment on:

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
