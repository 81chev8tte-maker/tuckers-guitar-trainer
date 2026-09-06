# Family Music Quest — Accessibility and Readability Specification

This document defines visual/readability rules for Guitar, Piano, future Bass, setup flows, and installed-PWA use.

It is a planning/source-of-truth document. It does **not** authorize a broad visual redesign. Future releases should apply these rules incrementally when touching the relevant UI.

The product goal is:

> **A child should be able to understand what to play next at normal Chromebook viewing distance without depending on tiny text, subtle glow differences, or color alone.**

---

# 1. Product principles

## Readability beats decoration

Effects such as glow, shadow, gradient, animation and particle feedback must not overpower:

- note identity;
- string/key identity;
- fret number;
- strike timing;
- current target;
- next action.

If an effect makes the target harder to read, reduce the effect before shrinking or obscuring the information.

## Color is helpful but never sufficient alone

Important state/identity must also be communicated through one or more of:

- position;
- label;
- number;
- shape;
- outline/pattern;
- lane/string/key association;
- text.

This is especially important for Guitar/Bass string colors and hit/miss feedback.

## Playing distance matters

The app should be judged from the actual position where a child sits or stands while playing, not only from close-up developer inspection.

The Dell Chromebook target viewport and display density are first-class acceptance conditions.

## Stable location reduces cognitive load

Frequently used information should not jump around unnecessarily.

Examples:

- strike line stays fixed;
- current Tab playhead stays fixed/stable where practical;
- score/combo/status stays in a predictable area;
- pause/exit controls do not move between practice modes without reason.

---

# 2. Global text and controls

Child-facing controls should:

- use plain language;
- avoid unexplained technical abbreviations;
- have obvious enabled/disabled state;
- provide a sufficiently large target for Chromebook touchpad/touch use where applicable;
- avoid placing critical controls dangerously close together;
- retain visible keyboard focus;
- expose meaningful accessible names.

Avoid relying on placeholder text as the only label.

Important buttons should not be icon-only unless the icon is universally clear and an accessible label is provided.

---

# 3. Contrast and state

Text and important symbols should have strong foreground/background contrast.

For gameplay notes:

- the target number/label should remain readable over the string/key color;
- selected/current state should be visible without washing out the identity color;
- hit/miss effects should be transient and should not permanently destroy string/key identity;
- disabled elements should remain legible enough to understand why they are unavailable.

Do not use low-opacity text for information the child actually needs while playing.

---

# 4. Guitar Note Highway

The Highway should preserve the existing horizontal string-lane model while making note identity unmistakable.

Each target should communicate:

- which string;
- which fret or OPEN;
- when to strike;
- sustain length where relevant;
- chord membership where relevant.

## String identity

Use multiple cues:

- lane position;
- strong string color;
- string label/number;
- string-colored note edge/fill/sustain ribbon;
- high-contrast fret number.

Do not rely on glow alone.

## Fret numbers

Fret numbers are primary gameplay information, not decoration.

They should:

- be large enough to read at playing distance;
- use high contrast;
- remain readable in dense passages;
- not be obscured by hit/miss effects.

## OPEN

Open-string notes must be unmistakable.

Prefer explicit `OPEN` or a highly legible `0` with an open-note treatment rather than a tiny zero that can be mistaken for another fret.

## Sustains

Sustain ribbons should preserve the string identity and make their start/end obvious without hiding nearby note numbers.

## Dense passages

When density increases:

- do not shrink notes/fret numbers until they become unreadable;
- bound the rendered/visible window;
- prioritize upcoming/current targets over distant decoration;
- avoid excessive overlapping labels.

---

# 5. Guitar chords and shape cues

Dense chord stacks must be readable as a single musical target.

The app should provide a compact shape cue such as:

```text
E6 7
A5 9
D4 9
```

or another mini-tab representation consistent with the actual string order.

Requirements:

- vertically align simultaneous notes;
- make shared timing obvious;
- preserve each string’s identity;
- keep fret numbers readable;
- avoid six separate animated elements visually colliding without a grouping cue.

Do not imply polyphonic acoustic recognition if the active Guitar detector remains monophonic.

---

# 6. Guitar Tab View

Tab View should resemble musical tablature strongly enough that time/string relationships are immediately understandable.

Preferred characteristics:

- continuous horizontal string lines;
- conventional tab order;
- time runs left-to-right;
- simultaneous notes align vertically;
- fixed/stable playhead where practical;
- upcoming notes move predictably;
- measure/phrase separators;
- visible current note/chord;
- bounded rendering around the current musical region;
- no requirement to manually scroll while playing.

Avoid:

- one arbitrary-width cell per event when it destroys rhythmic spacing;
- smooth-scrolling the whole layout for every note;
- tiny fret numbers;
- excessive historical notes remaining visually dominant;
- requiring the child to infer which of several columns is “now.”

Tab View should teach real tab-reading concepts rather than only act as a second visual skin for the Highway.

---

# 7. Future Bass Highway/Tab

Bass should inherit the same readability principles while using its own four-string configuration.

Do not hard-code visual spacing for six strings and then compress/expand it awkwardly.

Bass-specific priorities:

- very clear E/A/D/G identity;
- fret/OPEN readability;
- groove/rhythm visibility;
- root/fifth/octave shape clarity;
- future Drum Lock timing cues that do not obscure the tab/highway target.

See `BASS_QUEST_SPEC.md` and `BASS_CURRICULUM_PLAN.md`.

---

# 8. Piano gameplay

Falling-note gameplay should make these obvious:

- target pitch/key;
- target timing;
- chord/group relationships;
- current vs upcoming notes;
- left/right hand distinction where enabled;
- Wait for Me state.

## Notes/chords

Simultaneous notes should visually read as a group.

Do not make chord notes appear sequential when they share a start time.

## Keyboard

The on-screen keyboard should:

- maintain recognizable white/black key geometry;
- show current/required keys clearly;
- preserve labels where the selected learning level needs them;
- avoid cluttering every key with permanent text if it harms readability.

## Hand cues

Use more than color alone when hand distinction matters.

Possible secondary cues:

- `L` / `R` marker;
- lane/region treatment;
- small hand icon;
- shape/outline difference.

---

# 9. Motion and effects

Future accessibility options should consider:

- reduced decorative motion;
- reduced glow/flash intensity;
- simplified Highway visuals;
- reduced particle effects;
- larger labels/fret numbers.

Do not remove timing motion that is essential to gameplay merely because reduced-motion is enabled. Instead reduce nonessential animation while retaining a clear timing representation.

Avoid rapid flashing effects.

---

# 10. Color-blind-safe direction

A future color-blind/readability option should not require replacing the entire visual identity system.

Preferred strategy:

- keep established instrument/string colors;
- add stronger outlines/patterns/labels/shapes;
- optionally offer an alternate high-separation palette;
- ensure hit/miss/current state remains distinguishable in grayscale-like conditions.

Any alternate palette must remain consistent across:

- Highway;
- Tab View;
- tuner/string labels;
- setup wizard;
- Guitar/Bass learning diagrams.

---

# 11. Hardware/setup screens

The guided Hardware Setup wizard should separate:

## Child/parent-facing result

Examples:

- `Ready ✓`
- `Play the low E string`
- `We can hear you`
- `Try a little louder`
- `Wrong note — try again`

## Advanced diagnostics

Examples:

- sample rate;
- RMS/noise floor;
- frequency;
- cents;
- onset state;
- MIDI channel;
- polyphony;
- sustain;
- timing diagnostics.

Never force the child through advanced diagnostic data during normal setup.

See `HARDWARE_SETUP_WIZARD_SPEC.md`.

---

# 12. Progress/results screens

Results should emphasize:

1. what went well;
2. what to work on next;
3. one clear action.

Avoid a wall of numbers.

Useful hierarchy:

- stars/accuracy/score;
- clear improvement message;
- one Trouble Spot/Smart Practice recommendation;
- retry/continue/full-song action.

Parent/teacher detail belongs in the dedicated progress-summary flow rather than crowding the child result screen.

---

# 13. Responsive Chromebook requirements

At the target Chromebook viewport:

- no critical gameplay control should be below an inaccessible fold during active play;
- score/status should not cover targets;
- modal/overlay content must fit or scroll intentionally;
- Tab/Highway should use available width rather than shrinking core information excessively;
- browser/PWA chrome differences should not make important controls disappear;
- zooming should not be required for normal use.

Test both normal browser and installed-PWA presentation where practical.

---

# 14. Accessibility semantics

Interactive controls should have:

- semantic buttons/inputs where practical;
- accessible names;
- visible focus state;
- correct `aria-pressed` / selected state where appropriate;
- no keyboard trap in overlays;
- close/back controls that work predictably.

Dynamic status messages that matter outside visual gameplay should be exposed accessibly where practical without flooding assistive technology with high-frequency animation updates.

Do not attempt to announce every falling/highway note through a live region.

---

# 15. Test strategy

## Automated

Useful automated checks include:

- controls have accessible names;
- overlays can open/close without traps;
- key labels/state classes are present;
- layouts fit representative viewport sizes;
- no obvious horizontal overflow in key screens;
- semantic selected/pressed states update correctly.

Avoid source-string tests that pretend to prove readability.

## Visual/manual

Required for meaningful acceptance:

- Dell Chromebook at normal playing distance;
- simple built-in song;
- dense imported Guitar song;
- Highway and Tab View;
- child observation;
- chord/dense passage;
- OPEN note;
- reduced speed;
- bright/dim room where practical;
- any accessibility/readability mode actually shipped.

---

# 16. Child usability questions

When testing a changed screen, ask without leading:

- “What are you supposed to play next?”
- “Which string/key?”
- “What number do you see?”
- “When are you supposed to play it?”
- “What would you press if you wanted to stop?”
- “What part is confusing?”

If the child cannot answer from the screen, treat that as product evidence even when the implementation matches the design.

---

# 17. Definition of Done for a readability change

A readability/accessibility change is done when:

- the required identity/timing information is more understandable;
- no scoring/audio behavior was silently changed;
- color is not the sole essential cue;
- target Chromebook layout remains usable;
- applicable automated checks pass;
- human review confirms the intended visual result;
- the change does not create excessive rendering cost;
- any remaining limitation is documented honestly.

Do not claim child usability was verified unless a child actually used the changed flow.
