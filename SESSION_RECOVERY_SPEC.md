# Family Music Quest — Session Recovery Specification

This document defines the intended future behavior for recovering safely from accidental reloads, browser/PWA termination, Chromebook sleep, tab closure, or crashes during practice.

It is a planning/source-of-truth document. It does **not** authorize background autosave or gameplay changes in an unrelated release.

The product goal is:

> **If a practice session is interrupted, Family Music Quest should reopen safely, preserve durable progress, and offer a simple way to resume the same material when that can be done honestly—without pretending an unfinished scored run was completed.**

---

# 1. Recovery is not score completion

An interrupted run must not be converted into:

- a completed song;
- earned stars;
- a perfect/partial score that was never finalized;
- mastery progress;
- a Smart Practice success;
- a Trouble Spot mastery result.

Durable progress earned before the interruption may remain, but an unfinished run must stay unfinished.

---

# 2. Recovery targets

Potential interruptions include:

- accidental page reload;
- closing the installed PWA;
- browser crash;
- Chromebook sleep/suspend;
- power loss;
- tab discard under memory pressure;
- service-worker update/reload;
- navigation away from the app;
- profile/instrument switch while a run is active.

Not every event can be distinguished perfectly. Recovery logic should stay simple and deterministic.

---

# 3. Minimal recoverable session descriptor

A future recovery record should contain only enough information to reconstruct the activity, for example:

```text
schemaVersion
profileId
instrument
content source/type
content ID or imported-library ID
track ID/index if needed
section/phrase/full-song selection
practice speed
view/mode
backing enabled/volume if relevant
loop settings if active
safe musical resume location if supported
startedAt
lastHeartbeatAt
```

Do not persist:

- microphone audio;
- raw MIDI streams;
- every note event from the run;
- transient DOM/render state;
- current score as though it were finalized.

Imported content should be referenced by the device-local library ID rather than duplicated into the recovery record.

---

# 4. Safe resume vs restart

The first implementation should prefer **restart the selected musical unit** over frame-perfect mid-note resume.

Good recovery choices:

- restart current phrase;
- restart current section;
- restart current A/B loop;
- restart Full Song from the beginning;
- optionally resume at the start of the nearest measure/phrase when the transport can guarantee synchronization.

Avoid resuming at an arbitrary millisecond in the middle of:

- a sustained note;
- a chord;
- AlphaTab scheduling;
- accompaniment scheduling;
- count-in.

Musical-boundary restart is safer and easier for children to understand.

---

# 5. Child-facing UX

On startup, if a valid interrupted session exists for the active profile, show a small prompt such as:

> **Keep practising?**
>
> Ode to Joy · Phrase B · 80%
>
> [Continue] [Start Over] [Not Now]

For imported content:

> **Keep practising?**
>
> Imported Song · Guitar track · Full Song · 70%

Do not show technical recovery information.

If the referenced imported file is no longer available, discard the recovery option cleanly and return to the normal library.

---

# 6. Profile isolation

Recovery state must be tied to the player profile.

Switching profiles must not offer another player's interrupted run as though it belonged to the new player.

A device may retain at most a small bounded number of recent recovery descriptors if multi-profile recovery is useful, but one active-profile recovery is sufficient for a first implementation.

---

# 7. Clean exit behavior

When the player intentionally:

- completes a run;
- exits a run;
- starts a different activity;
- deletes the referenced content;
- resets relevant progress;

the stale recovery descriptor should be cleared or replaced appropriately.

A clean exit should not cause an unnecessary “resume?” prompt on next launch.

---

# 8. Heartbeat/write frequency

Do not write local storage on every animation frame or every note.

Potential approach:

- write once when the run starts;
- update only on meaningful state changes;
- optionally update a lightweight heartbeat at a modest interval;
- update musical resume boundary only when crossing a phrase/measure/loop boundary.

Measure storage cost before choosing a heartbeat frequency.

---

# 9. Imported Guitar Pro / AlphaTab

Recovery must reuse the existing imported-song transport/player rather than inventing another playback path.

Requirements:

- reload the local imported asset;
- reselect the same track;
- restore speed/backing settings;
- recreate the selected section/full-song range;
- restart from a safe musical boundary;
- apply the normal count-in if the normal flow uses it;
- never restore a stale AlphaTab API/player instance.

Do not persist AlphaTab internal state.

---

# 10. Piano

Piano recovery should reconstruct the normal practice route:

- lesson/Songbook/imported MIDI;
- melody/left/right/full mode;
- Wait/Rhythm mode where applicable;
- phrase/section;
- speed;
- input mode preference where appropriate.

All active oscillator voices, MIDI subscriptions and microphone streams must still be created fresh through normal startup logic.

---

# 11. PWA update integration

The future update flow in `PWA_OFFLINE_UPDATE_SPEC.md` may deliberately restart the application.

Before a user-approved update reload:

1. finish/stop the current run safely;
2. persist a recovery descriptor if appropriate;
3. clean up audio/input/player resources;
4. activate/reload;
5. offer normal recovery after the new version starts.

Do not rely on recovery as an excuse to force updates during active play.

---

# 12. Version/schema handling

The application is still under the development save policy described in `DECISIONS.md`.

Recovery records should carry a schema/version marker.

If a new release cannot safely interpret an old recovery record:

- discard it deterministically;
- preserve normal current-version progress;
- do not spend major effort migrating stale interrupted-session state unless cross-version persistence is explicitly required.

---

# 13. Test strategy

## Automated

High-value tests:

- valid recovery descriptor appears only for matching profile;
- clean exit clears recovery;
- completed run clears recovery;
- missing imported asset invalidates recovery safely;
- invalid schema is ignored safely;
- recovery does not grant completion/stars/mastery;
- restored route uses intended mode/section/speed;
- update/reload path does not duplicate completion.

## Manual

Test on Chromebook:

- close PWA during practice;
- reload during practice;
- sleep/wake during practice;
- terminate/reopen after imported Guitar Full Song;
- recover after Piano lesson/Songbook;
- confirm audio/input/player state is clean;
- confirm the child understands the resume prompt.

Browser crash/power-loss behavior may not be perfectly reproducible; document what was actually tested.

---

# 14. Non-goals

The first recovery implementation should not include:

- cloud session sync;
- exact sample-accurate playback resume;
- raw note-event replay;
- audio recording;
- multi-device handoff;
- preserving unfinished scores as official results;
- complex journaling/database transactions solely for recovery.

---

# 15. Definition of Done

Session recovery is done when an interrupted practice flow can be reconstructed safely from a small local descriptor, the child gets a simple choice, no false completion/mastery is awarded, and normal player/input cleanup remains correct.
