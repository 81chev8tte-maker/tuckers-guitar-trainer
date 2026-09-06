# Family Music Quest — Permanent Project Specification

This file is the durable product source of truth for Family Music Quest. Future project-management and coding agents should read this file together with `AGENTS.md`, `ARCHITECTURE.md`, `TESTING.md`, `RELEASE_PROCESS.md`, `DECISIONS.md`, and `ROADMAP.md` before substantial work.

## Product identity

**Family Music Quest** is a browser-based, kid-friendly music-learning application designed primarily for inexpensive Chromebook hardware.

Current supported instrument experiences:

- **Guitar Quest**
- **Piano Quest**

Both instruments are available to any local player profile. Guitar and Piano progression are stored separately per player while imported song libraries are device-local.

## Product goals

Family Music Quest should:

- make learning music feel like a game;
- provide immediate interactive feedback from real instruments where possible;
- teach genuine musical skills rather than only gamifying button presses;
- remain approachable for complete beginners;
- gradually introduce real tablature, rhythm, pitch, hand, and musical-structure concepts;
- work well on low-cost Chromebook hardware;
- support microphone-based learning as a baseline;
- support direct/USB audio and Web MIDI where available;
- work as an installable and offline-capable PWA where practical;
- maintain independent player progress;
- provide useful practice intelligence without overwhelming children with technical detail.

## Primary real-world users

The product is currently tested primarily by children learning Guitar and Piano. Child-facing decisions should prioritize:

- obvious controls;
- readable gameplay;
- forgiving but meaningful feedback;
- low-friction setup;
- clear progress;
- short explanations;
- minimal unnecessary configuration.

Advanced diagnostics are appropriate in dedicated areas such as **Hardware & Backup**, but should not dominate the normal learning experience.

## Core product principles

### Stability before expansion

Real-world regressions take priority over roadmap expansion. A bug-fix or polish release is a valid release.

### Beginner usability before technical cleverness

A technically sophisticated feature that a child cannot understand is not successful.

### Musical correctness before flashy presentation

Do not distort a song, rhythm, chord, technique, or lesson merely because a simplified implementation is easier. If a technical limitation requires a musical compromise, make it explicit and document it.

### Shared systems where appropriate

Reuse common profile, hardware, scoring, practice, storage, and future string-instrument foundations when doing so reduces risk and duplication.

### Instrument-specific logic where musically necessary

Guitar and Piano should not be forced through one abstraction when their musical/input requirements differ. A future Bass mode must likewise be more than renamed Guitar content.

### Progressive difficulty

Teach a skill, provide focused practice, then use the skill musically. Difficulty should progress gradually and should not be created merely by removing arbitrary notes from a coherent piece.

### Graceful hardware fallback

Microphone, on-screen input, Web MIDI, and USB/direct input have different capabilities. The UI and scoring model should not claim capabilities the active input cannot provide.

### Deterministic scoring where possible

Scoring rules should be explicit, testable, and stable. Do not silently change hit windows, target grouping, skipped-note handling, chord completion, or completion rules.

### Avoid regressions

Working behavior is a constraint. Before changing a system, inspect why it exists and which historical regression it protects.

### Chromebook performance is a product requirement

Low-cost Chromebook rendering, audio, input latency, and memory behavior are first-class constraints, not afterthoughts.

### No unnecessary architectural rewrites

Incremental architecture improvement is encouraged. Replacing a working major system solely because a cleaner architecture is possible is not.

## Current major capabilities

### Guitar Quest

Current Guitar functionality includes a structured beginner curriculum, Note Highway, playable Tab View, tab-learning content, microphone/USB-audio pitch input, onset gating, tuner, metronome, chord reference, score/accuracy/combo/stars/XP, imported Guitar Pro/MusicXML/text-tab handling, section/full-song practice, speed controls, A/B looping, AlphaTab backing playback, selected-track muting, saved imported songs, adaptive note density, coaching, and skill-history updates.

### Piano Quest

Current Piano functionality includes falling-note gameplay, Wait for Me, Rhythm play, microphone pitch input, on-screen keyboard, Web MIDI input, imported MIDI analysis and track selection, full-range imported notes, practice sections, speed controls, A/B looping, built-in curriculum, built-in public-domain Songbook arrangements, Listen First, melody/hand/full-arrangement paths, chord-group scoring, order-independent MIDI chords, polyphony, accompaniment, score/progress, and current skill-history infrastructure.

### Shared

Shared product systems include:

- local player profiles;
- profile-specific Guitar and Piano progress;
- shared Web MIDI service;
- per-player calibration/hardware result storage;
- Hardware & Backup diagnostics;
- versioned backup/restore of supported profile/progress/settings/calibration data;
- practice-intelligence helpers and rolling skill history;
- PWA installation/offline app-shell behavior;
- deterministic Node tests and Playwright browser smoke tests.

## Non-negotiable behavior

Future changes must preserve these unless a release explicitly changes the product contract and updates tests/documentation:

- Guitar and Piano remain distinct child-facing modes.
- Any player profile may use either instrument.
- Guitar and Piano progress remain independent per player.
- Imported libraries remain local to the device unless a future release explicitly changes that model.
- Piano MIDI chords are order-independent target groups and must preserve polyphony in MIDI/on-screen-capable modes.
- Piano microphone practice must remain safe for its monophonic detector rather than pretending to score arbitrary polyphony.
- Guitar skipped/pruned events must not count as misses or poison skill history.
- Pausing/exiting/restarting gameplay must clean up run-owned audio/timers/subscriptions.
- Guitar count-in must remain cancellable.
- Accompaniment must respect enable/mute and true zero volume.
- Built-in musical sections should use meaningful phrase/measure structure where available.
- PWA asset versions must stay consistent with the release.
- Public-domain music must retain source/rights documentation and use independently authored FMQ arrangements rather than copied modern tabs/MIDI/arrangements.

## Development save policy

The application is still under active development and testing.

**Previous-release saves do not currently require guaranteed compatibility between releases.**

Do not spend significant development time creating migrations for old development saves unless explicitly requested. It is acceptable for an intentional schema change to reset incompatible development data if the reset is deterministic and documented.

Current-release requirements still apply:

- saves must work reliably within the current version;
- profile isolation must remain correct;
- current supported backup/restore must work as documented;
- data must not be randomly cleared during normal use.

Persistent cross-version compatibility becomes a requirement only when the product owner explicitly declares it.

## Rights and licensing

Built-in non-original music must have documented rights/source provenance. Public-domain composition status does not make a modern tab, MIDI, recording, transcription, or arrangement public domain.

Preferred content workflow:

1. verify the underlying composition/public-domain basis using a credible historical source;
2. create an independent Family Music Quest arrangement;
3. document source, rights basis, simplification/transposition, and included musical material;
4. do not copy commercial or unknown-license arrangements.

Open-source projects may be used for conceptual research. Do not copy GPL or unlicensed source code into this repository unless an explicit licensing decision permits it. Independently implement concepts when license compatibility is uncertain.

## Definition of Done

A feature or focused release is normally done when:

- requested behavior is implemented;
- related working behavior is preserved;
- observable acceptance criteria are satisfied;
- applicable automated tests pass;
- syntax/build-equivalent validation available in this repo passes;
- documentation is updated;
- regression risks were considered;
- manual hardware checks are identified where automation is insufficient;
- no known major blocker is hidden in the completion report.

`Works on my machine` is not sufficient.

## Acceptance-criteria guidance

Write acceptance criteria as observable outcomes.

Good:

> Imported Guitar songs should play without audible stutter during normal Chromebook gameplay.

Weak:

> Improve performance.

Good:

> Tab View must remain readable at the target Chromebook viewport during normal gameplay without requiring the player to chase tiny event cells.

Weak:

> Improve tabs.

Good acceptance criteria describe what a human or automated test can observe, not only the implementation technique.

## Roles

### Project Manager

Responsible for release scope, priorities, acceptance criteria, roadmap, regression requirements, deciding whether discovered issues block expansion, reviewing agent reports, and coordinating focused releases.

### Coding Agent

Responsible for repository inspection, implementation, tests, validation, documentation updates, identifying technical risks, and explaining tradeoffs. The coding agent must not override real-world test failures simply because CI passes.

### Human tester / product owner

Responsible for final judgment on real hardware, Chromebook usability, child usability, musical feel, audio quality, perceived latency, real instrument behavior, and whether the interaction makes sense in practice.

## Maintenance releases

Periodically schedule maintenance-focused releases. Appropriate goals include dead-code removal, safe consolidation, test-debt reduction, dependency review, performance investigation, accessibility review, documentation cleanup, PWA/offline reliability, and brittle-code simplification.

Maintenance is not permission for an uncontrolled rewrite.
