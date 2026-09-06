from pathlib import Path
import json

ROOT = Path('.')

def read(path):
    return (ROOT / path).read_text()

def write(path, text):
    (ROOT / path).write_text(text)

def replace_required(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing expected text for {label}: {old[:120]!r}')
    return text.replace(old, new)

# Small UX fixes in the newly added guided controller before wiring it into the app.
p = 'guided-hardware-acceptance.js'
s = read(p)
s = replace_required(s,
    "    $('guidedCancel').onclick = () => cancelGuided('Stopped by tester');",
    "    $('guidedCancel').onclick = () => { if (path || phase === 'questions' || phase === 'summary') cancelGuided('Stopped by tester'); else document.querySelector('[data-diag-tab=\"microphone\"]')?.click(); };",
    'guided back action')
s = replace_required(s,
    "    $('guidedCancel').textContent = path ? 'Stop current test' : 'Close guided test';",
    "    $('guidedCancel').textContent = path || phase === 'questions' || phase === 'summary' ? 'Stop current test' : 'Back to diagnostics';",
    'guided back label')
s = replace_required(s,
    "  function showGuided() {\n    document.querySelectorAll('.diagnostic-view').forEach(v => v.hidden = v.dataset.diagView !== 'guided');",
    "  function showGuided() {\n    if (session?.status === 'complete' && !path && !phase) phase = 'summary';\n    document.querySelectorAll('.diagnostic-view').forEach(v => v.hidden = v.dataset.diagView !== 'guided');",
    'restore completed summary')
s = replace_required(s,
    "    $('guidedSummary').innerHTML = `<strong>✅ Hardware test report saved</strong><p>Guitar: ${statusText(session.guitar.status)} · MIDI: ${statusText(session.midi.status)}</p><p class=\"muted\">Open Report to copy or export the technical results and human observations. Monday physical gameplay checks are still required.</p><button id=\"guidedViewReport\" class=\"button\" type=\"button\">View Report</button>`;\n    $('guidedViewReport').onclick = () => {",
    "    $('guidedSummary').innerHTML = `<strong>✅ Hardware test report saved</strong><p>Guitar: ${statusText(session.guitar.status)} · MIDI: ${statusText(session.midi.status)}</p><p class=\"muted\">Open Report to copy or export the technical results and human observations. Monday physical gameplay checks are still required.</p><div class=\"diagnostic-actions\"><button id=\"guidedViewReport\" class=\"button\" type=\"button\">View Report</button><button id=\"guidedNewSession\" class=\"button secondary\" type=\"button\">Start New Test</button></div>`;\n    $('guidedViewReport').onclick = () => {",
    'summary new-test button')
s = replace_required(s,
    "      setTimeout(refreshCombinedReport, 0);\n    };\n  }\n  function cancelGuided",
    "      setTimeout(refreshCombinedReport, 0);\n    };\n    $('guidedNewSession').onclick = () => { newSession(); phase = null; showGuided(); };\n  }\n  function cancelGuided",
    'summary new-test wiring')
s = replace_required(s,
    "    $('diagReset')?.addEventListener('click', () => setTimeout(() => { session = null; path = null; phase = null; renderGuided(); }, 0));\n    window.addEventListener('family-music:profile-changed'",
    "    $('diagReset')?.addEventListener('click', () => setTimeout(() => { session = null; path = null; phase = null; renderGuided(); }, 0));\n    $('openDiagnostics')?.addEventListener('click', () => setTimeout(() => { loadSession(); phase = session?.status === 'complete' ? 'summary' : null; renderGuided(); refreshCombinedReport(); }, 0));\n    window.addEventListener('family-music:profile-changed'",
    'open refresh')
write(p, s)

# Package/version scripts.
pkg = json.loads(read('package.json'))
pkg['version'] = '2.6.7'
if 'guided-hardware-acceptance.test.js' not in pkg['scripts']['test']:
    pkg['scripts']['test'] += ' && node guided-hardware-acceptance.test.js'
if 'guided-hardware-acceptance.js' not in pkg['scripts']['check']:
    pkg['scripts']['check'] += ' && node --check guided-hardware-acceptance.js'
write('package.json', json.dumps(pkg, indent=2) + '\n')

# Version all app-shell references and load the new guided controller after diagnostics.
p = 'index.html'
s = read(p).replace('v=2.6.6', 'v=2.6.7')
needle = '  <script defer src="./diagnostics.js?v=2.6.7"></script>\n'
if './guided-hardware-acceptance.js?v=2.6.7' not in s:
    s = replace_required(s, needle, needle + '  <script defer src="./guided-hardware-acceptance.js?v=2.6.7"></script>\n', 'guided runtime script')
write(p, s)

p = 'sw.js'
s = read(p).replace('2.6.6', '2.6.7')
needle = "  './diagnostics.js?v=2.6.7',\n"
if './guided-hardware-acceptance.js?v=2.6.7' not in s:
    s = replace_required(s, needle, needle + "  './guided-hardware-acceptance.js?v=2.6.7',\n", 'guided runtime cache')
write(p, s)

p = 'app.js'
s = read(p)
s = replace_required(s, "const APP_VERSION = '2.6.6';", "const APP_VERSION = '2.6.7';", 'app version')
s = replace_required(s, "./sw.js?v=2.6.6", "./sw.js?v=2.6.7", 'service worker registration')
write(p, s)

p = 'pwa-assets.test.js'
s = read(p)
s = replace_required(s, "const version='2.6.6';", "const version='2.6.7';", 'PWA test version')
s = replace_required(s, "'piano.js','diagnostics.js','manifest.webmanifest'", "'piano.js','diagnostics.js','guided-hardware-acceptance.js','manifest.webmanifest'", 'PWA guided asset')
write(p, s)

# Guided child-facing styles; keep raw diagnostics visually separate.
p = 'diagnostics.css'
s = read(p)
if '.guided-launch' not in s:
    s += """
.guided-launch{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:16px 0;padding:14px 16px;border:1px solid #40546a;border-radius:16px;background:#0d1722}.guided-launch span{color:#b9c7d7}.guided-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.guided-menu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:18px 0}.guided-choice{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;align-items:center;text-align:left;border:1px solid #496077;background:#132131;color:#fff;border-radius:18px;padding:18px;font:inherit}.guided-choice>span{grid-row:1/3;font-size:2rem}.guided-choice strong{font-size:1.15rem}.guided-choice small{color:#b9c7d7;line-height:1.4}.guided-choice:hover,.guided-choice:focus-visible{outline:3px solid var(--player-accent,#a8f23d);outline-offset:2px}.guided-task{display:grid;gap:10px;margin:18px 0;padding:22px;border:1px solid #4c647d;border-radius:18px;background:#101d2b}.guided-task>strong{font-size:clamp(1.55rem,4vw,2.6rem);line-height:1.15}.guided-task p{margin:0;color:#d7e0ea}.guided-questions{display:grid;gap:12px}.guided-questions fieldset{border:1px solid #40546a;border-radius:14px;padding:14px}.guided-questions legend{font-weight:800;padding:0 6px}.guided-rating{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}.guided-rating label{display:flex;align-items:center;gap:7px;padding:10px 12px;border-radius:12px;background:#152435}.guided-summary{margin:18px 0;padding:18px;border-radius:16px;background:#10251b;border:1px solid #3d7d55}.guided-summary>strong{font-size:1.25rem}.guided-actions{margin-top:16px}@media(max-width:620px){.guided-menu{grid-template-columns:1fr}.guided-launch .button{width:100%}.guided-rating label{flex:1;justify-content:center;min-width:84px}}
"""
write(p, s)

# Browser regression: mocked readings exercise state/UI/reporting without pretending to test physical hardware.
p = 'browser-tests/app-smoke.spec.js'
s = read(p)
if "guided Hardware Acceptance Test records mocked measurements" not in s:
    s += r'''

test('guided Hardware Acceptance Test records mocked measurements and human observations',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Your name').fill('Hardware Guide Test');
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
  await page.getByRole('button',{name:/Hardware & Backup/}).click();
  await page.getByRole('button',{name:/Run Hardware Test/}).click();
  await expect(page.getByRole('heading',{name:'Guided Hardware Test'})).toBeVisible();
  await page.getByRole('button',{name:'🎸 Microphone'}).click();
  await expect(page.getByRole('heading',{name:'Production Guitar Input'})).toBeVisible();
  await page.getByRole('button',{name:'🧪 Guided Test'}).click();

  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginGuitarSynthetic());
  await page.evaluate(()=>{for(let i=0;i<36;i++)window.FMQGuidedHardwareTest.feedAudio({rms:.002,freq:null,midi:null,note:'—',onset:false});});
  await expect(page.locator('#guidedPrompt')).toContainText('thick E string');
  await page.evaluate(()=>window.FMQGuidedHardwareTest.feedAudio({rms:.03,freq:110,midi:45,note:'A2',onset:true}));
  expect(await page.evaluate(()=>window.FMQGuidedHardwareTest.getState().stringIndex)).toBe(0);
  await page.evaluate(()=>{
    const api=window.FMQGuidedHardwareTest;
    for(const step of api.rules.GUITAR_STRINGS){
      const freq=440*Math.pow(2,(step.midi-69)/12);
      api.feedAudio({rms:.03,freq,midi:step.midi,note:step.note,onset:true});
      api.feedAudio({rms:.028,freq,midi:step.midi,note:step.note,onset:false});
    }
  });
  const firstString=await page.evaluate(()=>window.FMQGuidedHardwareTest.getSession().guitar.strings[0]);
  expect(firstString.retries).toBe(1);
  expect(firstString.stable).toBe(true);
  await expect(page.locator('#guidedPrompt')).toContainText('A string three times');
  await page.evaluate(()=>{for(let i=0;i<3;i++)window.FMQGuidedHardwareTest.feedAudio({rms:.03,freq:110,midi:45,note:'A2',onset:true});});
  await expect(page.locator('#guidedAction')).toHaveText('Start Silence Check');
  await page.evaluate(()=>window.FMQGuidedHardwareTest.startSilenceSynthetic());
  await page.evaluate(()=>{for(let i=0;i<36;i++)window.FMQGuidedHardwareTest.feedAudio({rms:.002,freq:null,midi:null,note:'—',onset:false});});
  expect(await page.evaluate(()=>window.FMQGuidedHardwareTest.getSession().guitar.status)).toBe('complete');

  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginMidiSynthetic());
  await page.evaluate(()=>{
    const api=window.FMQGuidedHardwareTest;
    api.feedMidi({type:'noteon',note:'C4',midi:60,velocity:55,channel:1,polyphony:1});
    api.feedMidi({type:'noteoff',note:'C4',midi:60,velocity:0,channel:1,polyphony:0});
    api.feedMidi({type:'noteon',note:'D4',midi:62,velocity:35,channel:1,polyphony:1});
    api.feedMidi({type:'noteon',note:'E4',midi:64,velocity:105,channel:1,polyphony:1});
    api.feedMidi({type:'noteon',note:'G4',midi:67,velocity:90,channel:1,polyphony:2});
    api.feedMidi({type:'controlchange',controller:64,value:127,sustain:true,polyphony:0});
  });
  const midi=await page.evaluate(()=>window.FMQGuidedHardwareTest.getSession().midi);
  expect(midi.status).toBe('complete');
  expect(midi.noteOn.note).toBe('C4');
  expect(midi.noteOff.note).toBe('C4');
  expect(midi.velocitySamples).toEqual([35,105]);
  expect(midi.polyphonyMax).toBe(2);
  expect(midi.sustain.observed).toBe(true);

  await page.locator('#guidedFinish').click();
  for(const id of ['reaction','delay','smooth','readability','keepPlaying']) await page.locator(`input[name="guided-${id}"][value="good"]`).check();
  await page.getByRole('button',{name:'Save Answers & Finish'}).click();
  await expect(page.locator('#guidedSummary')).toContainText('Hardware test report saved');
  const report=await page.evaluate(()=>window.FMQGuidedHardwareTest.reportObject());
  expect(report.appVersion).toBe('2.6.7');
  expect(report.guidedAcceptance.humanObservations.source).toBe('human');
  expect(report.guidedAcceptance.testsNotPerformed.some(item=>item.includes('USB audio disconnect/reconnect'))).toBe(true);
  expect(await page.evaluate(()=>window.FMQGuidedHardwareTest.reportText())).toContain('HUMAN OBSERVATIONS');

  await page.evaluate(()=>{window.FMQGuidedHardwareTest.beginNew();return window.FMQGuidedHardwareTest.beginGuitarSynthetic();});
  await page.evaluate(()=>window.FMQGuidedHardwareTest.cancel('Browser cancellation test'));
  const cleanup=await page.evaluate(()=>window.FMQGuidedHardwareTest.getState());
  expect(cleanup.path).toBe(null);
  expect(cleanup.resources.audioSubscribed).toBe(false);
  expect(cleanup.resources.midiSubscribed).toBe(false);
});
'''
write(p, s)

# Changelog.
p = 'CHANGELOG.md'
s = read(p)
entry = """## v2.6.7 — Guided Hardware Acceptance Test

- Added a child-friendly `Run Hardware Test` flow inside Hardware & Backup while preserving Advanced Diagnostics.
- Reused the production Guitar audio service for a measurement-only quiet baseline, all six open strings, repeated-note onset observation and a final silence/noise observation.
- Reused the shared Web MIDI service for guided Note On/Off, velocity, polyphony and optional sustain capability checks.
- Added five clearly labeled human-observation questions for reaction, delay, smoothness, readability and willingness to keep playing.
- Extended the existing local Hardware Validation report with FMQ version, guided measurements, retries, MIDI observations, warnings, tests not performed and human observations; Copy Report and Export JSON remain local-only.
- Did not change production scoring, pitch/onset thresholds, noise gates, Highway behavior, AlphaTab behavior, profile/save schemas or MIDI-service semantics.
- Added deterministic rule tests and a mocked browser regression for the guided flow/report while keeping real Chromebook/instrument acceptance manual.
- Advanced package/app/PWA asset and service-worker versioning to v2.6.7.

"""
if entry not in s:
    s = replace_required(s, '# Changelog\n\n', '# Changelog\n\n' + entry, 'changelog insert')
write(p, s)

# Hardware validation instructions now start with the in-app guided capture, then retain manual tests.
p = 'HARDWARE_VALIDATION.md'
s = read(p)
section = """## Guided in-app acceptance (v2.6.7)\n\nStart from **Hardware & Backup → Run Hardware Test**. The guided flow records technical observations while the child follows plain-language prompts. It reuses the production Guitar audio service and shared Web MIDI service; it does not change scoring/detector thresholds or replace the manual checks below.\n\nRecommended order:\n\n1. run Guitar audio if Guitar hardware is available;\n2. run Piano MIDI if MIDI hardware is available;\n3. answer the five Human Observations questions;\n4. open Report and use **Copy Report** or **Export JSON**;\n5. attach the report to the release-acceptance notes.\n\nThe guided quiet baseline is measurement-only. USB/MIDI disconnect/reconnect, Piano microphone, perceived latency, audio smoothness and child usability remain manual Monday evidence.\n\n"""
if '## Guided in-app acceptance (v2.6.7)' not in s:
    s = replace_required(s, '## Guitar on the Chromebook\n', section + '## Guitar on the Chromebook\n', 'hardware validation guided section')
write(p, s)

# Monday plan: correct stale release language and make guided capture the first short step.
p = 'MONDAY_HARDWARE_TEST_PLAN.md'
s = read(p)
s = s.replace('Does the v2.6.4 candidate materially improve the known Full Song imported-Guitar problem without breaking existing Guitar/Piano behavior?', 'Does v2.6.7 preserve the v2.6.6 Guitar fixes while giving us a complete guided hardware report without breaking Guitar/Piano behavior?')
s = s.replace('This is the primary v2.6.4 acceptance case.', 'This remains the primary gameplay/performance acceptance case. v2.6.7 only adds the guided measurement/reporting layer; it does not replace this Full Song run.')
s = s.replace('A blocker should normally produce a focused v2.6.5 before Bass expansion.', 'A blocker should normally produce one focused maintenance release before Bass expansion.')
s = s.replace('If v2.6.4 clears its blockers and Guitar/Piano remain healthy, the project can seriously consider moving to the Bass Quest foundation described in `BASS_QUEST_SPEC.md`.', 'If Monday clears the v2.6.6 gameplay/hardware gate while v2.6.7 reporting remains healthy, the project can seriously consider moving to the Bass Quest foundation described in `BASS_QUEST_SPEC.md`.')
insert_after = "- keep the complex local Guitar Pro stress file available, but do not upload it to the repository.\n"
guided = """\n\n## 3A — Run the in-app guided hardware acceptance\n\nBefore the longer gameplay matrix, open **Hardware & Backup → Run Hardware Test**.\n\n- Run **Guitar audio** with the intended microphone/USB input.\n- Run **Piano MIDI** when the physical MIDI keyboard is available.\n- Answer the five short Human Observations questions without coaching the child toward an expected answer.\n- Open **Report** and use **Copy Report** or **Export JSON**.\n\nThe guided report is evidence collection, not automatic acceptance. Continue with the manual Guitar/Piano/gameplay checks below, including disconnect/reconnect, Piano microphone, perceived delay, audio smoothness, Highway/Tab readability and normal save/profile behavior.\n"""
if '## 3A — Run the in-app guided hardware acceptance' not in s:
    s = replace_required(s, insert_after, insert_after + guided, 'Monday guided section')
write(p, s)

# Testing: identify the guided report as a convenience layer, not physical acceptance.
p = 'TESTING.md'
s = read(p)
if 'guided hardware acceptance report' not in s:
    s = replace_required(s,
        '- guided hardware/input setup: `HARDWARE_SETUP_WIZARD_SPEC.md`\n',
        '- guided hardware/input setup: `HARDWARE_SETUP_WIZARD_SPEC.md`\n- guided hardware acceptance report: `HARDWARE_VALIDATION.md` and `MONDAY_HARDWARE_TEST_PLAN.md`\n',
        'testing feature reference')
    s = replace_required(s,
        '### Guitar checklist\n\nAdapt this checklist for releases touching Guitar:\n',
        '### Guitar checklist\n\nFor v2.6.7 and later acceptance sessions, run the in-app Guided Hardware Test first when practical, export/copy its report, then complete the physical checks below. The report does not automatically approve latency, audio smoothness or child usability.\n\nAdapt this checklist for releases touching Guitar:\n',
        'testing guided note')
write(p, s)

# Roadmap: v2.6.7 is the current acceptance tool, but the underlying gameplay gate remains v2.6.6.
p = 'ROADMAP.md'
s = read(p)
s = s.replace('### Validate v2.6.6 Guitar Highway UI cleanup on real hardware', '### Run v2.6.7 Guided Hardware Acceptance on real hardware')
s = s.replace('v2.6.4 removed the severe imported Full Song stutter on the known Chromebook stress song. v2.6.5 simplified the moving-note presentation, and immediate Chromebook review confirmed the fret-dominant direction was substantially clearer. v2.6.6 keeps that performance/readability architecture intact while centering and enlarging fret values and removing the remaining string-label/strike-line clutter.', 'v2.6.4 removed the severe imported Full Song stutter on the known Chromebook stress song. v2.6.5/v2.6.6 corrected and polished Highway readability. v2.6.7 adds a short Guided Hardware Acceptance Test over the existing diagnostics/input services so Monday can capture consistent technical results and human observations without changing the v2.6.6 gameplay/scoring/input behavior being accepted.')
s = s.replace('The known real-world blocker is **not considered resolved until physical Dell Chromebook testing confirms it**.', 'The underlying v2.6.6 gameplay/hardware gate is **not considered fully accepted until Monday physical Dell Chromebook/instrument testing confirms it**. The v2.6.7 report helps collect that evidence but does not replace it.')
first_bullet = '- run the complex local imported Guitar Pro Full Song with backing and normal input analysis at 100%;\n'
if '- run Hardware & Backup → Run Hardware Test' not in s:
    s = replace_required(s, first_bullet, '- run Hardware & Backup → Run Hardware Test and export/copy the guided acceptance report;\n' + first_bullet, 'roadmap guided bullet')
s = s.replace('### If v2.6.6 still has a blocker: focused follow-up', '### If Monday v2.6.7 acceptance still has a blocker: focused follow-up')
s = s.replace('### If v2.6.6 clears hardware acceptance: Bass Quest foundation', '### If Monday v2.6.7 acceptance clears the v2.6.6 gameplay/hardware gate: Bass Quest foundation')
s = s.replace('If the Guitar player is stable on the target Chromebook and no major regression remains, the next major expansion may begin', 'If the Guitar/Piano player and real hardware are stable on the target Chromebook and no major regression remains, the next major expansion may begin')
s = s.replace('The exact release numbers should be chosen after v2.6.4 hardware acceptance and any required v2.6.5 work.', 'The exact Bass release numbers should be chosen only after Monday v2.6.7 acceptance closes the current v2.6.6 gameplay/hardware gate.')
write(p, s)

# PWA asset test must include the new local runtime file.
# (already versioned above; assert package test catches any missed index/SW reference.)

# Remove the temporary implementation runner files from the final tree after successful validation.
# The workflow file removes itself after running this script; this script removes itself too.
Path('.github/scripts/apply_v267.py').unlink(missing_ok=True)
