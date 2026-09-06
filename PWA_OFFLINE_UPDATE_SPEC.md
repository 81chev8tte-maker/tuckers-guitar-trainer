# Family Music Quest — PWA Offline Reliability and Update UX Specification

This document defines the intended direction for dependable installed-PWA use, offline behavior, runtime-asset readiness, and user-visible update handling in Family Music Quest.

It is a planning/source-of-truth document. It does **not** authorize a service-worker rewrite inside an unrelated release. Future implementation should preserve working PWA behavior and make focused, measured changes.

The product goal is:

> **A child should be able to open Family Music Quest on the Chromebook, know whether the app is ready to work offline, finish the current activity safely, and apply an available update without ending up on a mixed-version or broken screen.**

---

# 1. Current Baseline

At the time this specification was written, Family Music Quest is a static browser/PWA application hosted from repository assets.

The current service worker:

- uses a versioned cache such as `family-music-quest-v2.6.3`;
- pre-caches the main application shell;
- includes the external AlphaTab JavaScript URL in the install list;
- tolerates individual pre-cache failures rather than failing the entire installation;
- calls `skipWaiting()` during install;
- deletes old Family Music Quest caches during activation;
- claims clients immediately;
- uses network-first behavior for same-origin GET requests;
- falls back to cache when the network fails;
- uses cache-first behavior for cross-origin GET requests once those resources have been cached.

Current page-side registration:

- registers a release-versioned `sw.js` URL;
- asks the registration to check for an update;
- does not currently present a user-facing update-ready state, defer/apply action, or safe gameplay-aware reload flow.

Current Guitar Pro playback uses:

- AlphaTab JavaScript from jsDelivr;
- an AlphaTab soundfont from jsDelivr at runtime.

The external script may become cached, but the complete playback dependency chain is not currently guaranteed to be available on a clean install with no network.

This document is therefore about **reliability and lifecycle clarity**, not about adding PWA installability from scratch.

---

# 2. Product Principles

## Local-first must mean understandable offline behavior

The app should not merely have a service worker and then assume every feature works offline.

Family Music Quest should distinguish between:

- **app shell ready offline**;
- **built-in Guitar/Piano content ready offline**;
- **imported files available locally**;
- **Guitar Pro backing/player runtime ready offline**;
- features that genuinely require network access, if any remain.

Do not label the whole application “offline ready” if an important playback dependency has never been cached.

## Never interrupt active practice for an update

A new service worker/version should not force-reload the page while the child is:

- in a scored Guitar/Piano/Bass run;
- listening to backing/accompaniment;
- using A/B loops;
- calibrating hardware;
- importing/restoring data;
- completing a result flow.

An update can be downloaded/prepared in the background, but application of the update should happen at a safe boundary unless a critical recovery case requires otherwise.

## Avoid mixed-version execution

A page running one release should not casually start using a partially activated set of assets from another release.

Versioning, service-worker activation, asset references, and reload behavior should work together so the child is either on the old release or the new release—not an accidental hybrid.

## Preserve data before reload

Applying an update must not silently discard current-version progress that is expected to have been saved.

Before an update-triggered reload, the application should:

- finish/abort active run cleanup deliberately;
- save current profile/progress state through existing save paths where appropriate;
- stop AlphaTab/audio voices/input subscriptions;
- avoid leaving imported-song writes or backup restore operations half-complete.

Do not invent a broad persistence rewrite solely for update UX.

## Do not hide failure

If an offline dependency is missing, say so clearly and offer a useful recovery action.

Prefer:

> **Guitar backing audio needs one online setup before it can work offline.**
> Connect once, open Guitar Songs, then try again.

Instead of a spinner or generic “Could not open file.”

---

# 3. Offline Readiness Model

Future UI should avoid one misleading global boolean.

Conceptually track several readiness categories.

## App Shell

Required for basic launch/navigation:

- `index.html`;
- core CSS;
- core JavaScript modules;
- profile UI;
- diagnostics UI;
- manifest/icon;
- built-in curriculum/song data.

Expected state after a successful installed/online visit:

> **App ready offline**

## Built-In Guitar Content

Guitar lessons/Songbook event data are local application assets and should work offline when the app shell is available.

Microphone/USB input depends on browser permissions/hardware, not network connectivity.

If built-in Guitar Songbook does not require AlphaTab backing, it should remain playable offline independently of imported Guitar Pro runtime assets.

## Built-In Piano Content

Piano lessons/Songbook, app-generated accompaniment, on-screen input and compatible microphone/MIDI modes should remain local/offline once the app shell is installed.

Web MIDI availability depends on browser/device support, not the internet.

## Imported Song Files

Imported Guitar and Piano files stored in browser databases are local after import.

However, local file availability does not by itself prove the runtime required to play them is offline-ready.

## Guitar Pro / AlphaTab Playback Runtime

This category should only report Ready when the required AlphaTab runtime and playback assets have actually been made dependable locally.

Potential user-facing state:

> **Guitar Pro playback: Offline ready**

or

> **Guitar Pro playback: Needs online setup**

Do not claim readiness based solely on service-worker registration.

---

# 4. AlphaTab and Soundfont Direction

The current major offline gap is not the imported file itself; it is the external playback/runtime dependency.

Future implementation should deliberately choose one of the following strategies after checking licensing, size, deployment limits, update cost and Chromebook performance.

## Preferred direction — repository/self-hosted runtime assets

Where licensing and repository/deployment constraints permit, prefer shipping the exact AlphaTab runtime assets Family Music Quest needs from the same application origin.

Benefits:

- deterministic release version;
- easier cache integrity/version checks;
- no CDN availability dependency at play time;
- simpler offline readiness testing;
- easier avoidance of a partially cached external dependency chain.

This may include:

- pinned AlphaTab JS/runtime files;
- required web worker/WASM assets if the chosen AlphaTab configuration needs them;
- the selected soundfont or another approved playback asset.

Do **not** copy or redistribute assets until their licenses explicitly permit it and source/attribution requirements are documented.

## Acceptable fallback — deliberate runtime prefetch

If self-hosting a large soundfont is impractical, the app may provide an explicit online preparation step that downloads/caches all required runtime playback assets.

Example:

> **Prepare Guitar Songs for Offline Use**
>
> Downloads the playback sounds needed for imported Guitar Pro songs.

The UI must verify completion rather than assuming a request succeeded.

## Do not rely on accidental cache warming

Opening one song online and hoping every later dependency happened to enter Cache Storage is not a dependable offline strategy.

The implementation should know which required assets constitute readiness.

---

# 5. Offline Preparation UX

If any significant runtime asset requires a one-time preparation/download, expose it clearly in Hardware & Backup or a future Settings area.

Suggested states:

## Not prepared

> **Offline Guitar Pro playback isn't ready yet.**
>
> Connect to the internet once to download the playback sounds.
>
> `Prepare for Offline Use`

## Preparing

> **Preparing Guitar playback…**
>
> Keep Family Music Quest open until this finishes.

If size is known accurately, the app may show it. Do not invent a download size.

## Ready

> ✅ **Guitar Pro playback is ready offline.**

Include a last-checked/version value in Advanced Details if useful.

## Failed

> **Offline setup did not finish.**
>
> Check the connection and try again.

Do not delete previously working cached assets merely because a new preparation attempt fails.

---

# 6. Storage and Quota Awareness

Large soundfonts/runtime assets can consume meaningful browser storage.

Future implementation should:

- inspect available browser storage APIs where useful;
- avoid promising exact free capacity when the browser does not expose it reliably;
- fail gracefully on quota/storage errors;
- preserve profiles/progress/import databases when runtime-cache preparation fails;
- allow optional offline playback assets to be removed/re-prepared without wiping player progress.

A future Advanced Details view may show approximate storage usage where browser APIs support it.

Do not add a custom storage manager unless needed.

---

# 7. Update Lifecycle UX

The desired normal update flow is:

```text
App is running version A
        ↓
Browser discovers version B
        ↓
Version B downloads/prepares in background
        ↓
App shows: Update ready
        ↓
Child finishes current activity
        ↓
User chooses Restart & Update
        ↓
Old runtime cleans up/saves
        ↓
New worker/assets take control
        ↓
Page reloads once
        ↓
App confirms version B
```

The exact service-worker waiting/activation implementation can differ, but the user experience should follow this safety model.

---

# 8. Update Notification

Use a compact, non-blocking notification when an update has successfully reached a state where it can be applied.

Suggested copy:

> **Family Music Quest update ready**
>
> Restart when you're finished playing.
>
> `Restart & Update` · `Later`

Do not show this merely because an update check started.

Do not repeatedly nag during the same session after the user chooses `Later`.

A small persistent indicator may remain available from the home/instrument chooser.

---

# 9. Gameplay-Aware Update Behavior

If an update becomes ready during active gameplay:

- do not cover the strike area with a large modal;
- do not reload;
- do not interrupt audio;
- defer the prominent prompt until the run ends/returns to a safe screen.

A subtle indicator may be recorded internally.

After results:

> **Update ready**
> Restart before your next song?

This behavior should apply consistently to:

- Guitar Note Highway;
- Guitar Tab View;
- imported Guitar Pro player;
- Piano gameplay;
- Listen First;
- future Bass gameplay;
- Trouble Spot practice;
- Smart Practice loops.

---

# 10. Safe Restart / Cleanup

Before intentionally applying an update, call existing cleanup/save paths rather than simply invoking `location.reload()` from arbitrary state.

Where relevant:

- stop Guitar/Piano/Bass audio input subscriptions;
- stop AlphaTab playback;
- stop Piano accompaniment/voices;
- cancel count-in/scheduled callbacks;
- invalidate active gameplay run tokens;
- finish current progress save if the app normally saves at that boundary;
- close/abort transient dialogs cleanly.

Do not falsely mark an unfinished run as completed merely because an update is applied.

If the user is in the middle of restoring a backup or a critical storage write, disable/defer update application until that operation completes or safely aborts.

---

# 11. Service Worker Activation Strategy

The current worker calls `skipWaiting()` immediately.

A future user-controlled update UX may require changing that behavior so a newly installed worker can remain waiting until the application explicitly asks it to activate.

If implementation changes this:

- make it deliberately;
- add tests around waiting/activation messaging;
- make first-install behavior remain straightforward;
- avoid getting users permanently stuck on an old worker;
- ensure `controllerchange` causes at most one deliberate reload;
- preserve rollback/recovery behavior when a new worker fails to install.

A common conceptual message flow may be:

```text
page detects registration.waiting
      ↓
user chooses Restart & Update
      ↓
page sends SKIP_WAITING to waiting worker
      ↓
worker activates/claims clients
      ↓
controllerchange
      ↓
page reloads once
```

This is conceptual, not a mandate to use these exact identifiers.

Do not create reload loops.

---

# 12. First Install vs Update

Treat these as distinct situations.

## First install / first controlled visit

The user should get the current app with no unnecessary “Update ready” prompt caused by initial service-worker control.

## Existing installation receives a newer release

Only then show update-ready UX.

Automated tests should cover the distinction.

---

# 13. Cache Versioning Rules

Keep release version consistency deterministic.

Current automated validation already expects package/release asset references, service-worker registration and cache naming to match.

Future rules should continue to enforce:

- one canonical app release version;
- versioned service-worker registration where used by the existing deployment model;
- versioned core asset references;
- versioned app cache;
- no stale previous-release core asset references;
- runtime/offline-asset version metadata where required.

If AlphaTab/soundfont assets become self-hosted, pin them to explicit versions/checks rather than “latest.”

Do not use cache-busting timestamps generated independently on every request.

---

# 14. Cache Strategy by Resource Type

Avoid one strategy for everything.

## HTML/navigation

Network-first with reliable cached fallback is reasonable for the current GitHub Pages deployment.

Requirements:

- offline navigation resolves to a known cached shell;
- update transition does not mix HTML from version B with core JS from version A unexpectedly.

## Versioned core assets

Because URLs are release-versioned, cache-first or stale-while-revalidate can be considered, but changing strategy should be justified and tested.

The important property is deterministic version alignment, not following a fashionable caching pattern.

## External/runtime playback assets

Use an explicit cache/readiness strategy as described above.

## User-imported song files

Continue to store these in their existing browser databases rather than attempting to duplicate large song blobs into Cache Storage without a clear need.

---

# 15. Network Status UX

The application may continue to observe browser online/offline events, but `navigator.onLine` is only a coarse signal.

Use it for simple hints, not for proving that GitHub Pages/CDN resources are reachable.

Suggested global offline notice:

> **Offline mode**
> Built-in lessons and locally ready content are available.

If the user opens a feature whose runtime dependency is not cached:

> **This feature needs an internet connection once before it can work offline.**

Do not disable unrelated offline-capable features.

---

# 16. Feature-Specific Offline Expectations

## Profiles and Progress

Expected offline:

- create/edit/select local profiles;
- current-version progress saves;
- XP/stars/history;
- settings stored locally.

## Guitar Built-In Curriculum/Songbook

Expected offline after normal app installation/cache:

- lessons;
- Note Highway;
- Tab View;
- tuner/input where browser hardware permission works;
- speed/count-in/loops;
- built-in local song data.

## Imported Guitar Pro

Expected offline **only after**:

- imported file is stored locally;
- required AlphaTab runtime assets are available locally;
- required playback/soundfont assets are available locally.

The app should be able to distinguish these conditions.

## Piano Built-In Curriculum/Songbook

Expected offline after normal app installation/cache.

## Imported MIDI Piano

Expected offline once the imported MIDI data is saved locally, subject to normal browser storage/device-input constraints.

## Hardware Diagnostics

Expected offline except for any action that explicitly requires network access.

## Backup/Restore

Local JSON export/restore should not require internet connectivity.

---

# 17. Session Recovery After Update

The first update UX does not need full session resurrection.

At minimum after `Restart & Update`:

- preserve active profile;
- preserve normal saved progress/settings;
- return to a sensible home/instrument screen;
- do not falsely resume halfway through a scoring run.

Later enhancement may restore:

- last instrument;
- selected song;
- selected practice section;
- view/speed preference;

but only if doing so is reliable and does not replay stale run state.

Full mid-note gameplay resurrection is not an initial requirement.

---

# 18. Update Failure / Recovery

If a new worker or required asset fails to download:

- keep the currently working release usable;
- do not delete its cache prematurely;
- do not prompt `Restart & Update` until the new release is actually ready;
- retry later when online;
- log enough advanced information to diagnose the failure.

The user-facing message should remain simple:

> **Update couldn't finish yet.**
> Keep using Family Music Quest and we'll try again later.

Do not strand the user on a blank page because a new release could not install.

---

# 19. Cache Cleanup Safety

Old caches should be removed only when the new release is safely active and the removal rule clearly targets Family Music Quest-owned caches.

Do not indiscriminately delete unrelated Cache Storage entries that might belong to another app under an unusual shared origin configuration.

If separate optional runtime caches are introduced, distinguish them by purpose/version so app-shell cleanup does not accidentally discard still-valid offline song assets without intent.

---

# 20. Testing Strategy

PWA/update behavior needs more than static string checks.

Retain deterministic Node/static tests for release consistency and add browser/service-worker integration coverage where practical.

## Static/version tests

Verify:

- release version consistency;
- cache name consistency;
- core asset references;
- service-worker registration version;
- no stale previous-release references;
- self-hosted runtime asset references if/when introduced.

## Service-worker unit/integration checks

Where tooling permits, verify:

- install shell caching;
- navigation fallback;
- old-cache cleanup scope;
- first-install vs update distinction;
- waiting-worker detection;
- explicit activation message;
- controller change causes at most one reload;
- failed update preserves current release;
- runtime/offline readiness only reports Ready when all required assets exist.

## Playwright/browser flow

Useful future scenarios:

1. load version A;
2. simulate/deploy version B worker;
3. verify non-blocking Update Ready UI;
4. start gameplay and confirm no forced reload;
5. finish/exit gameplay;
6. choose Restart & Update;
7. verify one reload;
8. verify version B is active;
9. verify active profile/settings remain.

Automated tests cannot prove real CDN/offline behavior on the Dell Chromebook; physical validation remains required.

---

# 21. Offline Acceptance Matrix

A future release that claims improved offline readiness should physically test on the target Chromebook.

Before test:

- begin from a clean/controlled browser/PWA state when testing first-install readiness;
- record app version and Chrome version;
- distinguish installed PWA from ordinary browser tab if behavior differs.

## Test A — Core Offline Launch

Online first:

- open/install Family Music Quest;
- wait for expected app-shell preparation.

Then disconnect network and verify:

- app launches;
- profile chooser works;
- Guitar Quest opens;
- Piano Quest opens;
- Hardware & Backup opens.

## Test B — Built-In Guitar Offline

Offline:

- open Guitar lesson;
- open Guitar Songbook piece;
- Note Highway works;
- Tab View works;
- mic/USB input can start if hardware permission is available;
- pause/restart/exit work.

## Test C — Built-In Piano Offline

Offline:

- built-in lesson opens;
- Songbook opens;
- on-screen input works;
- MIDI works where hardware/browser permits;
- accompaniment works;
- Listen First works.

## Test D — Imported Piano MIDI Offline

Import/save while online or before disconnect as required, then verify offline practice of saved MIDI.

## Test E — Imported Guitar Pro Offline

After explicit runtime preparation:

- disconnect network completely;
- open saved Guitar Pro file;
- AlphaTab score loads;
- backing instruments play;
- selected Guitar track mute works;
- section play works;
- Full Song works;
- speed/loop/pause/resume work;
- no runtime request failure causes silent/broken playback.

This test is the real acceptance standard for “offline Guitar Pro playback.”

---

# 22. Update Acceptance Matrix on Chromebook

Use an already-installed older release.

1. Launch old release and confirm its displayed/version diagnostics.
2. Publish/make newer release available.
3. Open/return to Family Music Quest online.
4. Confirm update downloads/prepares without interrupting current screen.
5. Start a short gameplay run before applying it.
6. Confirm no forced reload during gameplay.
7. Finish/exit run.
8. Confirm update prompt is clear.
9. Choose `Restart & Update`.
10. Confirm cleanup occurs and page reloads once.
11. Confirm new release version is active.
12. Confirm active profile/current-version progress remains.
13. Close and reopen installed PWA.
14. Confirm new release remains active.
15. Repeat with network disconnected after the update to verify cached launch.

Record any stale-version/mixed-asset symptoms explicitly.

---

# 23. Diagnostics / Advanced Details

A future Advanced PWA/Offline status area may expose:

- current app version;
- controlling service-worker state/version where safely available;
- update state: checking / current / ready / failed;
- app-shell offline readiness;
- Guitar Pro playback-runtime readiness;
- last successful offline preparation;
- relevant cache/runtime version identifiers;
- coarse storage usage if supported;
- last update error text for troubleshooting.

Keep raw Cache Storage internals out of normal child UI.

---

# 24. Relationship to Hardware Setup

`HARDWARE_SETUP_WIZARD_SPEC.md` and this specification solve different problems.

Hardware Setup answers:

> **Can the app hear/see my instrument?**

PWA Offline/Update answers:

> **Can the app and its playback assets run without the network, and is my installed version current?**

Do not merge them into one giant setup wizard.

A Ready summary may link to offline preparation as an optional next step where helpful.

---

# 25. Relationship to Performance Work

Self-hosting or pre-caching runtime assets should not be claimed to fix gameplay CPU stutter.

Offline reliability and runtime performance are separate concerns.

Use `CHROMEBOOK_PERFORMANCE_BENCHMARK.md` for frame/audio performance validation.

A locally cached soundfont can eliminate network dependency/load delay, but it does not automatically solve main-thread rendering or pitch-analysis cost.

---

# 26. Relationship to Backup

Cache/offline runtime assets are reproducible application resources and normally should **not** be included in Family Music Quest profile backups.

Backups should continue to focus on user-created/stateful data according to backup policy.

Imported song blobs remain a separate product/storage decision and are not automatically included merely because offline runtime assets become dependable.

---

# 27. Security / Supply-Chain Considerations

Pin third-party versions.

Avoid loading mutable `latest` URLs.

If third-party runtime assets remain external:

- use explicit versions;
- document source/license;
- minimize the number of external origins;
- test failure behavior;
- consider integrity/version verification mechanisms supported by the chosen loading architecture.

If vendored/self-hosted:

- retain license/notice requirements;
- document update procedure;
- do not silently modify upstream code without a clear reason.

---

# 28. Staged Implementation Direction

Do not combine every PWA/offline idea into one oversized release.

## Stage 1 — Update UX Reliability

Focused goals:

- detect a genuinely waiting/ready update;
- child-friendly `Restart & Update` / `Later` UI;
- defer application during gameplay/critical operations;
- safe cleanup/save before reload;
- activate/reload exactly once;
- preserve current working release if update fails;
- browser tests for lifecycle behavior.

## Stage 2 — Offline Guitar Playback Completeness

Focused goals:

- choose/document AlphaTab runtime asset strategy;
- verify licensing/distribution;
- self-host or explicitly prefetch required playback assets;
- readiness indicator;
- clean-install offline Guitar Pro acceptance test;
- storage/quota failure handling.

These stages may be combined only if implementation remains focused and reviewable.

---

# 29. Explicit Non-Goals

Unless separately approved, this specification does not require:

- native Android/ChromeOS packaging;
- Trusted Web Activity conversion;
- Capacitor/Electron wrapper;
- cloud accounts/sync;
- background downloading while the PWA is closed;
- automatic destructive cache clearing;
- backing up Cache Storage;
- a custom app store updater;
- mid-note gameplay state resurrection;
- replacing AlphaTab solely because it is currently externally hosted;
- broad service-worker framework migration.

---

# 30. Definition of Done — Update UX

A release implementing update UX is complete when:

- an existing installation can discover a new release;
- the new release can prepare without interrupting active gameplay;
- the user receives one clear update-ready prompt at an appropriate time;
- `Later` works without repeated nagging during the session;
- `Restart & Update` performs deliberate cleanup/save;
- the worker activates and the page reloads at most once;
- the new version is visibly/diagnostically active afterward;
- current-version saved profile/progress remains;
- failed update preparation leaves the existing release usable;
- automated lifecycle tests pass;
- real Chromebook update flow is manually validated.

---

# 31. Definition of Done — Offline Guitar Pro Playback

A release may claim dependable offline imported Guitar Pro playback only when:

- the imported file is local;
- every required AlphaTab runtime asset is local/verified ready;
- every required playback/soundfont asset is local/verified ready;
- the network can be fully disabled;
- a saved Guitar Pro score opens;
- backing audio plays;
- selected Guitar track remains muted;
- section and Full Song playback work;
- speed, A/B loop, pause/resume and exit work;
- no hidden CDN request is required for successful playback;
- a fresh/controlled installed-PWA test has passed on the target Chromebook;
- licenses/source documentation for redistributed assets are complete;
- any remaining limitation is documented honestly.

Until those conditions are met, describe the current state as **partially offline-capable**, not fully self-contained Guitar Pro playback.
