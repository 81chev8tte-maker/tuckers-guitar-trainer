(() => {
  'use strict';

  const APP_VERSION = '2.6.15';
  const RESULT_KEY = 'family-music-quest-hardware-results-v1';
  const CAL_KEY = 'family-music-quest-calibration-v1';
  const SESSION_COUNTER_KEY = 'family-music-quest-hardware-session-counter-v1';
  const QUIET_SAMPLE_COUNT = 36;
  const GUITAR_STRINGS = [
    { id:'low-e', label:'thick E string', short:'E', note:'E2', midi:40 },
    { id:'a', label:'A string', short:'A', note:'A2', midi:45 },
    { id:'d', label:'D string', short:'D', note:'D3', midi:50 },
    { id:'g', label:'G string', short:'G', note:'G3', midi:55 },
    { id:'b', label:'B string', short:'B', note:'B3', midi:59 },
    { id:'high-e', label:'thin e string', short:'e', note:'E4', midi:64 }
  ];
  const PIANO_MIC_QUIET_SAMPLE_COUNT = 12;
  const PIANO_MIC_NOTES = [
    { id:'c4', label:'C', note:'C4', midi:60 },
    { id:'d4', label:'D', note:'D4', midi:62 },
    { id:'e4', label:'E', note:'E4', midi:64 },
    { id:'f4', label:'F', note:'F4', midi:65 },
    { id:'g4', label:'G', note:'G4', midi:67 },
    { id:'c4-repeat', label:'C again', note:'C4', midi:60, repeated:true }
  ];
  const HUMAN_QUESTIONS = [
    { id:'reaction', text:'Did the game react when you played?' },
    { id:'delay', text:'Did anything feel delayed?' },
    { id:'smooth', text:'Did the music sound smooth?' },
    { id:'readability', text:'Could you clearly see what to play?' },
    { id:'keepPlaying', text:'Would you keep playing this?' }
  ];

  const clone = value => JSON.parse(JSON.stringify(value));
  const expectedFrequency = midi => 440 * (2 ** ((midi - 69) / 12));
  const centsFromExpected = (freq, midi) => freq ? 1200 * Math.log2(freq / expectedFrequency(midi)) : null;
  const scoreable = (reading, noiseGate) => Boolean(reading?.freq && Number(reading.rms || 0) > Number(noiseGate || 0));
  const createNoteResult = step => ({
    expected:{ id:step.id, label:step.label, note:step.note, midi:step.midi },
    detectedNote:null, detectedMidi:null, frequency:null, cents:null, rms:0, peak:0,
    onsetSeen:false, scoreable:false, stable:false, matchingReadings:0,
    attempts:0, retries:0, wrongDetections:[], passedAt:null
  });
  function applyNoteReading(result, step, reading, noiseGate) {
    const next = clone(result);
    const isScoreable = scoreable(reading, noiseGate);
    next.rms = Number(reading?.rms || 0);
    next.peak = Math.max(Number(next.peak || 0), next.rms);
    if (reading?.freq) {
      next.detectedNote = reading.note || null;
      next.detectedMidi = Number.isFinite(reading.midi) ? reading.midi : null;
      next.frequency = reading.freq;
      next.cents = centsFromExpected(reading.freq, step.midi);
    }
    next.scoreable = next.scoreable || isScoreable;
    if (reading?.onset && isScoreable) {
      next.attempts += 1;
      if (reading.midi === step.midi) next.onsetSeen = true;
      else {
        next.retries += 1;
        next.wrongDetections.push({ note:reading.note || null, midi:Number.isFinite(reading.midi) ? reading.midi : null, frequency:reading.freq || null });
        next.wrongDetections = next.wrongDetections.slice(-6);
      }
    }
    if (isScoreable && reading.midi === step.midi) next.matchingReadings += 1;
    else if (isScoreable) next.matchingReadings = 0;
    const passed = next.onsetSeen && next.matchingReadings >= 2;
    if (passed) {
      next.stable = true;
      next.passedAt = new Date().toISOString();
    }
    return { result:next, passed, scoreable:isScoreable };
  }
  function summarizeQuiet(samples) {
    const clean = samples.map(Number).filter(Number.isFinite);
    if (!clean.length) return { sampleCount:0, noiseFloor:null, peak:null };
    const sorted = [...clean].sort((a,b)=>a-b);
    return {
      sampleCount:clean.length,
      noiseFloor:sorted[Math.floor(sorted.length * 0.8)] || 0,
      peak:Math.max(...clean)
    };
  }
  function summarizeSilence(readings, noiseGate) {
    const rms = readings.map(r=>Number(r?.rms || 0));
    return {
      sampleCount:readings.length,
      peak:rms.length ? Math.max(...rms) : 0,
      onsetCount:readings.filter(r=>r?.onset).length,
      stablePitchReadings:readings.filter(r=>r?.freq).length,
      scoreableReadings:readings.filter(r=>scoreable(r, noiseGate)).length
    };
  }

  const createPianoMicNoteResult = step => ({
    expected:{ id:step.id, label:step.label, note:step.note, midi:step.midi, repeated:Boolean(step.repeated) },
    detectedNote:null, detectedMidi:null, frequency:null, cents:null, confidence:0, level:0, peak:0, stable:false,
    readings:0, attempts:0, retries:0, wrongDetections:[], passedAt:null
  });
  function applyPianoMicReading(result, step, reading) {
    const next = clone(result);
    next.readings += 1;
    next.level = Number(reading?.level || 0);
    next.peak = Math.max(Number(next.peak || 0), next.level);
    next.confidence = Number(reading?.confidence || 0);
    if (Number.isFinite(reading?.midi)) {
      next.detectedMidi = reading.midi;
      next.detectedNote = reading.name || null;
      next.frequency = reading.frequency || null;
      next.cents = Number.isFinite(reading.cents) ? reading.cents : null;
    }
    if (!reading?.stable) return { result:next, passed:false, reason:reading?.quiet ? 'quiet' : 'unstable' };
    next.attempts += 1;
    if (reading.midi !== step.midi) {
      next.retries += 1;
      next.wrongDetections.push({ note:reading.name || null, midi:Number.isFinite(reading.midi) ? reading.midi : null, frequency:reading.frequency || null });
      next.wrongDetections = next.wrongDetections.slice(-6);
      return { result:next, passed:false, reason:'wrong-note' };
    }
    next.stable = true;
    next.passedAt = new Date().toISOString();
    return { result:next, passed:true, reason:'passed' };
  }
  function createPianoMicrophoneState() {
    return { status:'not-run', mode:'monophonic', quiet:null, notes:[], repeated:null, device:null, audioSettings:null, detectorRules:null, startedAt:null, completedAt:null };
  }

  function localDateStamp(value) {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    const safe = Number.isNaN(date.getTime()) ? new Date() : date;
    const pad = number => String(number).padStart(2, '0');
    return `${safe.getFullYear()}-${pad(safe.getMonth()+1)}-${pad(safe.getDate())}`;
  }
  function makeSessionId(startedAt, sequence=1) {
    const seq = Math.max(1, Number(sequence) || 1);
    return `FMQ-HW-${localDateStamp(startedAt)}-${String(seq).padStart(2, '0')}`;
  }
  function normalizeEvidenceReferences(value) {
    const raw = Array.isArray(value) ? value : String(value || '').split(/[\n,]+/);
    return [...new Set(raw.map(item=>String(item || '').trim().slice(0,120)).filter(Boolean))].slice(0,12);
  }
  function createHumanEvidence(data={}) {
    const adultResult = ['pass','blocker','not-decided'].includes(data.adultResult) ? data.adultResult : 'not-decided';
    const help = String(data.adultHelpRequired ?? '0');
    const adultHelpRequired = ['0','1','2+'].includes(help) ? help : '0';
    const childScoringTrust = ['yes','mostly','no-unsure'].includes(data.childScoringTrust) ? data.childScoringTrust : null;
    return {
      adultResult,
      adultHelpRequired,
      adultHelpNote:String(data.adultHelpNote || '').trim().slice(0,240),
      childScoringTrust,
      childComment:String(data.childComment || '').trim().slice(0,300),
      testerNote:String(data.testerNote || '').trim().slice(0,500),
      evidenceReferences:normalizeEvidenceReferences(data.evidenceReferences)
    };
  }
  function createReportPayload(report) {
    const sessionId = report?.guidedAcceptance?.sessionId || `FMQ-HW-${localDateStamp(report?.generatedAt || Date.now())}`;
    const safeId = String(sessionId).replace(/[^A-Za-z0-9._-]+/g, '-');
    return {
      report,
      json:JSON.stringify(report, null, 2),
      filename:`family-music-quest-hardware-${safeId}.json`
    };
  }

  function createSession(meta={}) {
    return {
      format:'family-music-quest-guided-hardware-acceptance', version:3, appVersion:APP_VERSION, commit:null,
      sessionId:meta.sessionId || makeSessionId(meta.startedAt || new Date().toISOString(), meta.sequence || 1),
      startedAt:meta.startedAt || new Date().toISOString(), completedAt:null, status:'in-progress',
      player:meta.player || null, platform:meta.platform || null,
      audioDevice:null, audioSettings:null,
      guitar:{ status:'not-run', quiet:null, strings:[], repeated:null, silence:null },
      pianoMicrophone:createPianoMicrophoneState(),
      midi:{ status:'not-run', device:null, noteOn:null, noteOff:null, velocitySamples:[], polyphonyMax:0, sustain:null, skipped:[] },
      humanObservations:{}, humanEvidence:createHumanEvidence(meta.humanEvidence), warnings:[], testsNotPerformed:[]
    };
  }
  function computeNotPerformed(session) {
    const missing = [];
    if (session?.guitar?.status !== 'complete') missing.push('Guided Guitar six-string/repeated-note/silence test');
    if (session?.pianoMicrophone?.status !== 'complete') missing.push('Guided Piano microphone check (one note at a time)');
    if (session?.midi?.status !== 'complete') missing.push('Guided Piano MIDI capability test');
    if (session?.midi?.sustain == null) missing.push('MIDI sustain capability (optional)');
    missing.push('USB audio disconnect/reconnect (manual Monday test)');
    missing.push('MIDI disconnect/reconnect (manual Monday test)');
    missing.push('Piano microphone gameplay / perceived response (manual physical test)');
    missing.push('Physical end-to-end latency measurement');
    return [...new Set(missing)];
  }

  const rules = { APP_VERSION, QUIET_SAMPLE_COUNT, GUITAR_STRINGS, PIANO_MIC_QUIET_SAMPLE_COUNT, PIANO_MIC_NOTES, HUMAN_QUESTIONS, scoreable, createNoteResult, applyNoteReading, createPianoMicNoteResult, applyPianoMicReading, summarizeQuiet, summarizeSilence, makeSessionId, normalizeEvidenceReferences, createHumanEvidence, createReportPayload, createSession, computeNotPerformed };
  if (typeof module !== 'undefined' && module.exports) module.exports = rules;
  if (typeof window === 'undefined' || !window.document) return;

  const $ = id => document.getElementById(id);
  const getJson = (key, fallback={}) => { try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; } };
  const setJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const activeProfile = () => window.FMQProfiles?.getActiveProfile?.() || null;
  const activeId = () => activeProfile()?.id || 'no-profile';
  const platform = () => ({ userAgent:navigator.userAgent, platform:navigator.userAgentData?.platform || navigator.platform || 'Unknown', language:navigator.language, displayMode:window.matchMedia?.('(display-mode: standalone)')?.matches ? 'standalone' : 'browser' });
  const savedCalibration = () => getJson(CAL_KEY)[activeId()] || {};

  let session = null;
  let path = null;
  let phase = null;
  let stringIndex = 0;
  let noteResult = null;
  let quietSamples = [];
  let silenceReadings = [];
  let guidedAudioUnsub = null;
  let guidedAudioOwned = false;
  let guidedMidiUnsub = null;
  let guidedMidiOwned = false;
  let guidedPianoMic = null;
  let pianoMicNoteIndex = 0;
  let pianoMicNoteResult = null;
  let pianoMicQuietSamples = [];
  let synthetic = false;
  let noiseGate = .018;
  let midiTarget = null;
  let message = '';
  let baseReportObject = null;
  let baseReportText = null;

  function nextSessionId(startedAt=new Date().toISOString()) {
    const day = localDateStamp(startedAt);
    const counters = getJson(SESSION_COUNTER_KEY, {});
    const next = Math.max(0, Number(counters[day] || 0)) + 1;
    counters[day] = next;
    setJson(SESSION_COUNTER_KEY, counters);
    return makeSessionId(startedAt, next);
  }

  function loadSession() {
    session = getJson(RESULT_KEY)[activeId()]?.guidedAcceptance || null;
    if (session) {
      let changed = false;
      if (!session.sessionId) { session.sessionId = nextSessionId(session.startedAt || new Date().toISOString()); changed = true; }
      if (!session.humanEvidence) { session.humanEvidence = createHumanEvidence(); changed = true; }
      if (!session.pianoMicrophone) { session.pianoMicrophone = createPianoMicrophoneState(); changed = true; }
      if (Number(session.version || 0) < 3) { session.version = 3; changed = true; }
      if (changed) {
        const all = getJson(RESULT_KEY);
        const existing = all[activeId()] || {};
        all[activeId()] = { ...existing, guidedAcceptance:clone(session), updatedAt:Date.now(), platform:existing.platform || platform() };
        setJson(RESULT_KEY, all);
      }
    }
    return session;
  }
  function persistSession() {
    if (!session) return;
    const all = getJson(RESULT_KEY);
    const existing = all[activeId()] || {};
    all[activeId()] = { ...existing, guidedAcceptance:clone(session), updatedAt:Date.now(), platform:existing.platform || platform() };
    setJson(RESULT_KEY, all);
    refreshCombinedReport();
  }
  function newSession() {
    const profile = activeProfile();
    cleanupResources();
    const startedAt = new Date().toISOString();
    session = createSession({
      startedAt,
      sessionId:nextSessionId(startedAt),
      player:profile ? { id:profile.id, name:profile.name } : null,
      platform:platform()
    });
    path = null; phase = null; message = ''; synthetic = false;
    persistSession();
    renderGuided();
    return session;
  }
  function ensureSession() {
    if (!session) loadSession();
    if (!session || session.status !== 'in-progress') newSession();
    return session;
  }

  function injectUi() {
    const panel = document.querySelector('#hardwareDiagnostics .diagnostics-panel');
    const nav = panel?.querySelector('.diagnostic-tabs');
    const micView = panel?.querySelector('[data-diag-view="microphone"]');
    if (!panel || !nav || !micView || $('diagRunGuided')) return;

    const launch = document.createElement('div');
    launch.className = 'guided-launch';
    launch.innerHTML = '<button id="diagRunGuided" class="button big" type="button">🧪 Quick Hardware Tests</button><span>Short kid-friendly checks. Family Music Quest records the technical details for you.</span>';
    nav.before(launch);

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.dataset.diagTab = 'guided';
    tab.textContent = '🧪 Quick Tests';
    nav.prepend(tab);

    const view = document.createElement('section');
    view.className = 'diagnostic-view guided-test-view';
    view.dataset.diagView = 'guided';
    view.hidden = true;
    view.innerHTML = `
      <div class="guided-title-row"><div><p class="eyebrow">SHORT CHILD-FRIENDLY CHECKS</p><h2>Quick Hardware Tests</h2></div><span id="guidedProgress" class="badge">Ready</span></div>
      <p id="guidedLead" class="muted">Pick one test and follow the big instructions. Technical details stay in the report.</p>
      <div id="guidedMenu" class="guided-menu">
        <button id="guidedStartGuitar" class="guided-choice" type="button"><span>🎸</span><strong>Test Guitar Microphone</strong><small>Quiet check, all six open strings, repeated note and silence.</small></button>
        <button id="guidedStartPianoMic" class="guided-choice" type="button"><span>🎹</span><strong>Test Piano Microphone</strong><small>One note at a time: C–D–E–F–G, then C again.</small></button>
        <button id="guidedStartMidi" class="guided-choice" type="button"><span>🎹</span><strong>Test MIDI Keyboard</strong><small>Note On/Off, velocity, chord/polyphony and optional sustain.</small></button>
      </div>
      <div id="guidedTask" class="guided-task" hidden>
        <span id="guidedStep" class="eyebrow">STEP</span>
        <strong id="guidedPrompt">Ready</strong>
        <p id="guidedMessage">Follow the instruction above.</p>
        <div class="signal-meter"><i id="guidedSignal"></i></div>
      </div>
      <form id="guidedQuestions" class="guided-questions" hidden></form>
      <div id="guidedSummary" class="guided-summary" hidden></div>
      <div class="diagnostic-actions guided-actions">
        <button id="guidedAction" class="button" type="button" hidden>Continue</button>
        <button id="guidedSkip" class="button secondary" type="button" hidden>Skip this check</button>
        <button id="guidedFinish" class="button secondary" type="button">Finish & Questions</button>
        <button id="guidedCancel" class="button ghost" type="button">Stop Test</button>
      </div>`;
    micView.before(view);

    $('diagRunGuided').onclick = () => { ensureSession(); showGuided(); };
    tab.onclick = () => { if (!session) loadSession(); showGuided(); };
    $('guidedStartGuitar').onclick = () => startGuitar(false).catch(showGuidedError);
    $('guidedStartPianoMic').onclick = () => startPianoMic(false).catch(showGuidedError);
    $('guidedStartMidi').onclick = () => startMidi(false).catch(showGuidedError);
    $('guidedAction').onclick = handleGuidedAction;
    $('guidedSkip').onclick = skipGuidedStep;
    $('guidedFinish').onclick = showQuestions;
    $('guidedCancel').onclick = () => { if (path || phase === 'questions' || phase === 'summary') cancelGuided('Stopped by tester'); else document.querySelector('[data-diag-tab="microphone"]')?.click(); };
    document.querySelector('[data-diag-tab="report"]')?.addEventListener('click', () => setTimeout(refreshCombinedReport, 0));
    $('closeDiagnostics')?.addEventListener('click', () => { if (path) cancelGuided('Hardware & Backup closed'); else cleanupResources(); });
    $('diagReset')?.addEventListener('click', () => setTimeout(() => { session = null; path = null; phase = null; renderGuided(); }, 0));
    $('openDiagnostics')?.addEventListener('click', () => setTimeout(() => { loadSession(); phase = session?.status === 'complete' ? 'summary' : null; renderGuided(); refreshCombinedReport(); }, 0));
    window.addEventListener('family-music:profile-changed', () => { if (path) cancelGuided('Player changed'); cleanupResources(); session = null; });
  }

  function showGuided() {
    if (session?.status === 'complete' && !path && !phase) phase = 'summary';
    document.querySelectorAll('.diagnostic-view').forEach(v => v.hidden = v.dataset.diagView !== 'guided');
    document.querySelectorAll('[data-diag-tab]').forEach(b => b.classList.toggle('active', b.dataset.diagTab === 'guided'));
    renderGuided();
  }
  function showGuidedError(err) {
    message = err?.message || String(err);
    if (session) {
      session.warnings.push(message);
      session.warnings = [...new Set(session.warnings)];
      persistSession();
    }
    renderGuided();
    if ($('guidedLead') && message) $('guidedLead').textContent = message;
  }
  function statusText(status) {
    if (status === 'complete') return '✅ Complete';
    if (status === 'running') return 'Testing…';
    if (status === 'partial') return '⚠ Partial';
    if (status === 'not-available') return 'Not available';
    return 'Not run';
  }

  function renderGuided() {
    if (!$('guidedMenu')) return;
    const s = session || loadSession();
    const menu = $('guidedMenu'), task = $('guidedTask'), questions = $('guidedQuestions'), summary = $('guidedSummary');
    menu.hidden = Boolean(path) || phase === 'questions' || phase === 'summary';
    task.hidden = !path;
    questions.hidden = phase !== 'questions';
    summary.hidden = phase !== 'summary';
    $('guidedFinish').hidden = Boolean(path) || phase === 'questions' || phase === 'summary';
    $('guidedCancel').textContent = path || phase === 'questions' || phase === 'summary' ? 'Stop current test' : 'Back to diagnostics';
    $('guidedProgress').textContent = !s ? 'Ready' : s.status === 'complete' ? 'Report saved' : path === 'guitar' ? 'Guitar' : path === 'piano-mic' ? 'Piano microphone' : path === 'midi' ? 'MIDI' : 'In progress';
    $('guidedLead').textContent = s ? `Guitar mic: ${statusText(s.guitar.status)} · Piano mic: ${statusText(s.pianoMicrophone?.status)} · MIDI: ${statusText(s.midi.status)}.` : 'Pick one test and follow the big instructions. Technical details stay in the report.';
    if (!path) {
      $('guidedStartGuitar').querySelector('small').textContent = `${statusText(s?.guitar?.status)} · Quiet check, six strings, repeated note and silence.`;
      $('guidedStartPianoMic').querySelector('small').textContent = `${statusText(s?.pianoMicrophone?.status)} · One note at a time: C–D–E–F–G, then C again.`;
      $('guidedStartMidi').querySelector('small').textContent = `${statusText(s?.midi?.status)} · Note On/Off, velocity, polyphony and optional sustain.`;
    }
    if (path === 'guitar') renderGuitarTask();
    if (path === 'piano-mic') renderPianoMicTask();
    if (path === 'midi') renderMidiTask();
    if (phase === 'summary') renderSummary();
  }

  function setTask(step, prompt, detail, level=0) {
    $('guidedStep').textContent = step;
    $('guidedPrompt').textContent = prompt;
    $('guidedMessage').textContent = detail || message || '';
    $('guidedSignal').style.width = `${Math.max(0, Math.min(100, level * 1600))}%`;
  }
  function renderGuitarTask() {
    $('guidedSkip').hidden = true;
    $('guidedAction').hidden = true;
    if (phase === 'quiet') {
      setTask(`GUITAR · QUIET ${Math.min(quietSamples.length, QUIET_SAMPLE_COUNT)} / ${QUIET_SAMPLE_COUNT}`, 'Stay quiet for a moment', 'We are measuring the room/input. This does not change your scoring or calibration.');
      return;
    }
    if (phase === 'note') {
      const step = GUITAR_STRINGS[stringIndex];
      setTask(`GUITAR · STRING ${stringIndex + 1} OF 6`, `Play the ${step.label}`, message || `Waiting for ${step.note}…`, noteResult?.rms || 0);
      return;
    }
    if (phase === 'repeated') {
      setTask('GUITAR · REPEATED NOTE', 'Play the A string three times', `Let it stop between notes. Onsets heard: ${session.guitar.repeated?.onsetsObserved || 0} / 3`);
      return;
    }
    if (phase === 'silence-ready') {
      setTask('GUITAR · FINAL QUIET CHECK', 'Stop playing', 'When the strings are quiet, start the silence check.');
      $('guidedAction').hidden = false;
      $('guidedAction').textContent = 'Start Silence Check';
      return;
    }
    if (phase === 'silence') {
      setTask(`GUITAR · SILENCE ${Math.min(silenceReadings.length, QUIET_SAMPLE_COUNT)} / ${QUIET_SAMPLE_COUNT}`, 'Stay quiet — almost done', 'We are checking for unexpected note/onset readings.');
    }
  }
  function renderPianoMicTask() {
    $('guidedSkip').hidden = true;
    $('guidedAction').hidden = true;
    if (phase === 'piano-mic-quiet') {
      setTask(`PIANO MICROPHONE · QUIET ${Math.min(pianoMicQuietSamples.length, PIANO_MIC_QUIET_SAMPLE_COUNT)} / ${PIANO_MIC_QUIET_SAMPLE_COUNT}`, 'Stay quiet for a moment', 'Microphone mode listens to one piano note at a time. No chords in this test.');
      return;
    }
    if (phase === 'piano-mic-note') {
      const step = PIANO_MIC_NOTES[pianoMicNoteIndex];
      const prompt = step.repeated ? 'Play C again' : `Play ${step.label}`;
      setTask(`PIANO MICROPHONE · ${pianoMicNoteIndex + 1} OF ${PIANO_MIC_NOTES.length}`, prompt, message || `Waiting for ${step.note}… One note at a time.`, pianoMicNoteResult?.level || 0);
    }
  }

  function renderMidiTask() {
    $('guidedAction').hidden = true;
    $('guidedSkip').hidden = false;
    if (phase === 'midi-noteon') setTask('MIDI · 1 OF 5', 'Play any piano key', message || 'Waiting for Note On…');
    else if (phase === 'midi-noteoff') setTask('MIDI · 2 OF 5', 'Let go of that key', `Waiting for Note Off${midiTarget?.note ? ` from ${midiTarget.note}` : ''}…`);
    else if (phase === 'midi-velocity') setTask('MIDI · 3 OF 5', 'Play one soft note, then one stronger note', `Velocity readings: ${session.midi.velocitySamples.length} / 2. Fixed velocity is okay.`);
    else if (phase === 'midi-polyphony') setTask('MIDI · 4 OF 5', 'Press two or three keys together', `Most keys held so far: ${session.midi.polyphonyMax || 0}`);
    else if (phase === 'midi-sustain') setTask('MIDI · 5 OF 5 · OPTIONAL', 'Press the sustain pedal', 'No pedal? Tap Skip — sustain is not required for beginner play.');
    else if (phase === 'midi-unavailable') {
      setTask('MIDI', 'No MIDI keyboard detected', message || 'Plug in a keyboard and try again, or skip MIDI for Monday.');
      $('guidedAction').hidden = false;
      $('guidedAction').textContent = 'Try MIDI Again';
    }
  }

  async function startGuitar(isSynthetic=false) {
    ensureSession(); cleanupResources();
    synthetic = isSynthetic; path = 'guitar'; phase = 'quiet'; message = ''; stringIndex = 0; quietSamples = []; silenceReadings = []; noteResult = null;
    session.guitar = { status:'running', quiet:null, strings:[], repeated:null, silence:null };
    persistSession(); renderGuided();
    if (isSynthetic) { noiseGate = .018; return; }
    const audio = window.FMQGuitarAudio;
    if (!audio) throw new Error('Guitar input service is still loading.');
    guidedAudioOwned = !audio.active;
    if (!audio.active) await audio.start(savedCalibration().microphone?.deviceId || '');
    noiseGate = Number(audio.noiseGate || .018);
    const track = audio.stream?.getAudioTracks?.()[0];
    const settings = track?.getSettings?.() || {};
    session.audioDevice = { id:audio.deviceId || settings.deviceId || '', label:track?.label || 'Default microphone' };
    session.audioSettings = { sampleRate:audio.context?.sampleRate || settings.sampleRate || null, channelCount:settings.channelCount || 1, echoCancellation:settings.echoCancellation ?? null, noiseSuppression:settings.noiseSuppression ?? null, autoGainControl:settings.autoGainControl ?? null, productionNoiseGate:noiseGate };
    guidedAudioUnsub = audio.subscribe(processAudioReading);
    persistSession();
  }
  function processAudioReading(reading) {
    if (path !== 'guitar') return;
    if ($('guidedSignal')) $('guidedSignal').style.width = `${Math.min(100, Number(reading?.rms || 0) * 1600)}%`;
    if (phase === 'quiet') {
      quietSamples.push(Number(reading?.rms || 0));
      if (quietSamples.length >= QUIET_SAMPLE_COUNT) {
        session.guitar.quiet = { ...summarizeQuiet(quietSamples), measuredAt:new Date().toISOString(), measurementOnly:true };
        phase = 'note'; stringIndex = 0; noteResult = createNoteResult(GUITAR_STRINGS[0]); message = '';
        persistSession();
      }
      renderGuided(); return;
    }
    if (phase === 'note') {
      const step = GUITAR_STRINGS[stringIndex];
      const applied = applyNoteReading(noteResult, step, reading, noiseGate);
      noteResult = applied.result;
      if (reading?.onset && applied.scoreable && reading.midi !== step.midi) message = `We heard ${reading.note || 'another note'}. Try the ${step.label} again.`;
      if (applied.passed) {
        session.guitar.strings.push(noteResult);
        stringIndex += 1; message = '';
        if (stringIndex >= GUITAR_STRINGS.length) {
          phase = 'repeated';
          session.guitar.repeated = { expected:{ note:'A2', midi:45, label:'A string' }, requested:3, onsetsObserved:0, attempts:0, wrongDetections:[] };
          noteResult = null;
        } else noteResult = createNoteResult(GUITAR_STRINGS[stringIndex]);
        persistSession();
      }
      renderGuided(); return;
    }
    if (phase === 'repeated') {
      const rep = session.guitar.repeated;
      if (reading?.onset && scoreable(reading, noiseGate)) {
        rep.attempts += 1;
        if (reading.midi === 45) rep.onsetsObserved += 1;
        else rep.wrongDetections.push({ note:reading.note || null, midi:reading.midi ?? null });
        if (rep.onsetsObserved >= 3) { phase = 'silence-ready'; persistSession(); }
      }
      renderGuided(); return;
    }
    if (phase === 'silence') {
      silenceReadings.push({ rms:Number(reading?.rms || 0), freq:reading?.freq || null, note:reading?.note || null, midi:reading?.midi ?? null, onset:Boolean(reading?.onset) });
      if (silenceReadings.length >= QUIET_SAMPLE_COUNT) finishGuitarPath();
      else renderGuided();
    }
  }
  function startSilenceCheck() { if (path === 'guitar' && phase === 'silence-ready') { silenceReadings = []; phase = 'silence'; renderGuided(); } }
  function finishGuitarPath() {
    const summary = summarizeSilence(silenceReadings, noiseGate);
    session.guitar.silence = { ...summary, measuredAt:new Date().toISOString() };
    session.guitar.status = 'complete';
    if (summary.scoreableReadings > 0) session.warnings.push(`Guitar input produced ${summary.scoreableReadings} scoreable reading(s) during the guided silence check.`);
    session.warnings = [...new Set(session.warnings)];
    cleanupAudio(); path = null; phase = null; message = '';
    persistSession();
    if (!synthetic) { showQuestions(); return; }
    renderGuided();
  }

  async function startPianoMic(isSynthetic=false) {
    ensureSession(); cleanupResources();
    synthetic = isSynthetic; path = 'piano-mic'; phase = 'piano-mic-quiet'; message = ''; pianoMicNoteIndex = 0; pianoMicNoteResult = null; pianoMicQuietSamples = [];
    session.pianoMicrophone = { ...createPianoMicrophoneState(), status:'running', startedAt:new Date().toISOString() };
    persistSession(); renderGuided();
    if (isSynthetic) return;
    const PianoMic = window.NovaPianoInputs?.MicrophonePianoInput;
    if (!PianoMic) throw new Error('Piano microphone input is still loading.');
    guidedPianoMic = new PianoMic({ emit:()=>{} });
    try {
      await guidedPianoMic.start(processPianoMicReading);
    } catch (error) {
      session.pianoMicrophone.status = 'not-available';
      session.pianoMicrophone.completedAt = new Date().toISOString();
      cleanupPianoMic(); path = null; phase = null;
      persistSession(); renderGuided();
      throw error;
    }
    const track = guidedPianoMic.stream?.getAudioTracks?.()[0] || guidedPianoMic.stream?.getTracks?.()[0];
    const settings = track?.getSettings?.() || {};
    session.pianoMicrophone.device = { id:settings.deviceId || '', label:track?.label || 'Default microphone' };
    session.pianoMicrophone.audioSettings = { sampleRate:guidedPianoMic.context?.sampleRate || settings.sampleRate || null, channelCount:settings.channelCount || 1 };
    session.pianoMicrophone.detectorRules = clone(window.NovaPianoInputs.MIC_RULES || {});
    persistSession();
  }
  function processPianoMicReading(reading) {
    if (path !== 'piano-mic' || reading?.active === false) return;
    if ($('guidedSignal')) $('guidedSignal').style.width = `${Math.min(100, Number(reading?.level || 0) * 1600)}%`;
    if (phase === 'piano-mic-quiet') {
      pianoMicQuietSamples.push(Number(reading?.level || 0));
      if (pianoMicQuietSamples.length >= PIANO_MIC_QUIET_SAMPLE_COUNT) {
        session.pianoMicrophone.quiet = { ...summarizeQuiet(pianoMicQuietSamples), measuredAt:new Date().toISOString(), measurementOnly:true };
        phase = 'piano-mic-note'; pianoMicNoteIndex = 0; pianoMicNoteResult = createPianoMicNoteResult(PIANO_MIC_NOTES[0]); message = '';
        persistSession();
      }
      renderGuided(); return;
    }
    if (phase !== 'piano-mic-note') return;
    const step = PIANO_MIC_NOTES[pianoMicNoteIndex];
    const applied = applyPianoMicReading(pianoMicNoteResult, step, reading);
    pianoMicNoteResult = applied.result;
    if (applied.reason === 'quiet') message = 'Too quiet — play a little louder.';
    else if (applied.reason === 'unstable') message = 'We can hear something, but the note is not steady yet. Try one clean note.';
    else if (applied.reason === 'wrong-note') message = `We heard ${reading.name || 'another note'}. Try ${step.label} again.`;
    if (applied.passed) {
      message = `Great — we heard ${step.label}.`;
      if (step.repeated) session.pianoMicrophone.repeated = pianoMicNoteResult;
      else session.pianoMicrophone.notes.push(pianoMicNoteResult);
      pianoMicNoteIndex += 1;
      if (pianoMicNoteIndex >= PIANO_MIC_NOTES.length) { finishPianoMicPath(); return; }
      pianoMicNoteResult = createPianoMicNoteResult(PIANO_MIC_NOTES[pianoMicNoteIndex]);
    }
    persistSession(); renderGuided();
  }
  function finishPianoMicPath() {
    session.pianoMicrophone.status = 'complete';
    session.pianoMicrophone.completedAt = new Date().toISOString();
    cleanupPianoMic(); path = null; phase = null; message = '';
    persistSession();
    if (!synthetic) { showQuestions(); return; }
    renderGuided();
  }

  async function startMidi(isSynthetic=false) {
    ensureSession(); cleanupMidi();
    synthetic = isSynthetic; path = 'midi'; phase = 'midi-noteon'; midiTarget = null; message = '';
    session.midi = { status:'running', device:null, noteOn:null, noteOff:null, velocitySamples:[], polyphonyMax:0, sustain:null, skipped:[] };
    persistSession(); renderGuided();
    if (isSynthetic) return;
    const service = window.FMQHardware?.midi;
    if (!service) throw new Error('MIDI service is still loading.');
    const before = service.snapshot?.() || {};
    guidedMidiOwned = before.status !== 'connected';
    guidedMidiUnsub = service.subscribe(processMidiEvent);
    const snapshot = before.status === 'connected' ? before : await service.connect();
    session.midi.device = snapshot.input ? { ...snapshot.input } : null;
    if (!snapshot.input) { phase = 'midi-unavailable'; message = 'Web MIDI is available, but no keyboard is connected.'; }
    persistSession(); renderGuided();
  }
  function processMidiEvent(event) {
    if (path !== 'midi') return;
    if (event?.snapshot?.input) session.midi.device = { ...event.snapshot.input };
    session.midi.polyphonyMax = Math.max(session.midi.polyphonyMax || 0, Number(event?.polyphony || 0));
    if (phase === 'midi-noteon' && event.type === 'noteon') {
      session.midi.noteOn = { note:event.note, midi:event.midi, velocity:event.velocity, channel:event.channel, receivedAt:event.receivedAt ?? null, sourceTimestamp:event.sourceTimestamp ?? null };
      midiTarget = { note:event.note, midi:event.midi }; phase = 'midi-noteoff';
    } else if (phase === 'midi-noteoff' && event.type === 'noteoff' && (midiTarget?.midi == null || event.midi === midiTarget.midi)) {
      session.midi.noteOff = { note:event.note, midi:event.midi, velocity:event.velocity, channel:event.channel }; phase = 'midi-velocity';
    } else if (phase === 'midi-velocity' && event.type === 'noteon') {
      session.midi.velocitySamples.push(Number(event.velocity || 0));
      if (session.midi.velocitySamples.length >= 2) phase = 'midi-polyphony';
    } else if (phase === 'midi-polyphony' && Number(event.polyphony || 0) >= 2) {
      phase = 'midi-sustain';
    } else if (phase === 'midi-sustain' && event.type === 'controlchange' && event.controller === 64) {
      session.midi.sustain = { observed:true, value:event.value, active:Boolean(event.sustain) }; finishMidiPath(); return;
    }
    persistSession(); renderGuided();
  }
  function skipGuidedStep() {
    if (path !== 'midi') return;
    const label = phase?.replace('midi-', '') || 'unknown';
    session.midi.skipped.push(label);
    if (phase === 'midi-noteon') phase = 'midi-noteoff';
    else if (phase === 'midi-noteoff') phase = 'midi-velocity';
    else if (phase === 'midi-velocity') phase = 'midi-polyphony';
    else if (phase === 'midi-polyphony') phase = 'midi-sustain';
    else if (phase === 'midi-sustain' || phase === 'midi-unavailable') { finishMidiPath(); return; }
    persistSession(); renderGuided();
  }
  function finishMidiPath() {
    session.midi.status = session.midi.skipped.length ? 'partial' : 'complete';
    cleanupMidi(); path = null; phase = null; message = '';
    persistSession();
    if (!synthetic) { showQuestions(); return; }
    renderGuided();
  }

  function handleGuidedAction() {
    if (path === 'guitar' && phase === 'silence-ready') startSilenceCheck();
    else if (path === 'midi' && phase === 'midi-unavailable') startMidi(false).catch(showGuidedError);
  }

  function showQuestions() {
    ensureSession(); cleanupResources(); path = null; phase = 'questions';
    const form = $('guidedQuestions');
    const human = session.humanEvidence || createHumanEvidence();
    form.innerHTML = `<h3>✅ Done! Five quick questions</h3><p class="muted">Answer what you actually noticed. Good = no problem; Bad = a clear problem.</p>${HUMAN_QUESTIONS.map((q,i)=>`<fieldset><legend>${i+1}. ${q.text}</legend><div class="guided-rating"><label><input type="radio" name="guided-${q.id}" value="good" required> Good</label><label><input type="radio" name="guided-${q.id}" value="okay"> Okay</label><label><input type="radio" name="guided-${q.id}" value="bad"> Bad</label></div></fieldset>`).join('')}
      <section class="guided-human-evidence">
        <h3>Adult / tester evidence</h3>
        <p class="muted">These notes help the Project Manager understand the session. They do not change scoring.</p>
        <div class="guided-evidence-grid">
          <label class="guided-field">Overall adult result
            <select id="guidedAdultResult"><option value="not-decided">NOT DECIDED</option><option value="pass">PASS</option><option value="blocker">BLOCKER</option></select>
          </label>
          <label class="guided-field">Adult help required
            <select id="guidedAdultHelp"><option value="0">0</option><option value="1">1</option><option value="2+">2+</option></select>
          </label>
        </div>
        <label class="guided-field">Optional help note<input id="guidedAdultHelpNote" maxlength="240" placeholder="Example: Needed help choosing the USB input."></label>
        <fieldset><legend>Did the game usually agree with what you thought you played?</legend><div class="guided-rating"><label><input type="radio" name="guided-scoring-trust" value="yes" required> Yes</label><label><input type="radio" name="guided-scoring-trust" value="mostly"> Mostly</label><label><input type="radio" name="guided-scoring-trust" value="no-unsure"> No / unsure</label></div></fieldset>
        <label class="guided-field">Optional child comment<textarea id="guidedChildComment" maxlength="300" rows="2" placeholder="Write the child's words as closely as practical."></textarea></label>
        <label class="guided-field">Optional tester / context note<textarea id="guidedTesterNote" maxlength="500" rows="2" placeholder="Example: USB guitar cable, Chromebook on charger, moderate room noise."></textarea></label>
        <label class="guided-field">Optional evidence filenames / labels<textarea id="guidedEvidenceRefs" maxlength="1000" rows="2" placeholder="highway-open-note.jpg&#10;full-song-stutter.mp4"></textarea></label>
        <p class="muted">FMQ stores only these labels. Screenshots and videos stay outside the app and must be attached manually.</p>
      </section>
      <button class="button" type="submit">Save Answers & Finish</button>`;
    $('guidedAdultResult').value = human.adultResult || 'not-decided';
    $('guidedAdultHelp').value = human.adultHelpRequired || '0';
    $('guidedAdultHelpNote').value = human.adultHelpNote || '';
    $('guidedChildComment').value = human.childComment || '';
    $('guidedTesterNote').value = human.testerNote || '';
    $('guidedEvidenceRefs').value = (human.evidenceReferences || []).join('\n');
    if (human.childScoringTrust) form.querySelector(`[name="guided-scoring-trust"][value="${human.childScoringTrust}"]`)?.setAttribute('checked','checked');
    form.onsubmit = event => {
      event.preventDefault();
      const answers = {};
      for (const q of HUMAN_QUESTIONS) answers[q.id] = form.querySelector(`[name="guided-${q.id}"]:checked`)?.value || null;
      if (Object.values(answers).some(v=>!v)) { message = 'Please answer all five quick questions.'; $('guidedLead').textContent = message; return; }
      const childScoringTrust = form.querySelector('[name="guided-scoring-trust"]:checked')?.value || null;
      if (!childScoringTrust) { message = 'Please answer the scoring-trust question.'; $('guidedLead').textContent = message; return; }
      completeSession(answers, {
        adultResult:$('guidedAdultResult').value,
        adultHelpRequired:$('guidedAdultHelp').value,
        adultHelpNote:$('guidedAdultHelpNote').value,
        childScoringTrust,
        childComment:$('guidedChildComment').value,
        testerNote:$('guidedTesterNote').value,
        evidenceReferences:$('guidedEvidenceRefs').value
      });
    };
    renderGuided();
  }
  function completeSession(answers, evidence={}) {
    ensureSession();
    session.humanObservations = { scale:'good/okay/bad', answers:{...answers}, recordedAt:new Date().toISOString(), source:'human' };
    session.humanEvidence = createHumanEvidence(evidence);
    session.testsNotPerformed = computeNotPerformed(session);
    session.status = 'complete'; session.completedAt = new Date().toISOString();
    phase = 'summary'; persistSession(); renderGuided();
  }
  function renderSummary() {
    if (!session) return;
    $('guidedSummary').innerHTML = `<strong>✅ Done! Hardware test report saved</strong><p>Session: ${session.sessionId || '—'} · Adult result: ${formatAdultResult(session.humanEvidence?.adultResult)}</p><p>Guitar mic: ${statusText(session.guitar.status)} · Piano mic: ${statusText(session.pianoMicrophone?.status)} · MIDI: ${statusText(session.midi.status)}</p><p class="muted">This records what you tested. It does not automatically approve the release.</p><div class="diagnostic-actions"><button id="guidedSendParent" class="button" type="button">Send Report to Parent</button><button id="guidedViewReport" class="button secondary" type="button">View Report</button><button id="guidedNewSession" class="button secondary" type="button">Start New Test</button></div><p id="guidedShareStatus" class="muted" aria-live="polite"></p>`;
    $('guidedSendParent').onclick = async () => {
      const result = await shareTestReport();
      const status = $('guidedShareStatus');
      if (!status) return;
      status.textContent = result.status === 'shared' ? 'Share opened. Choose the parent destination and confirm Send.' : result.status === 'cancelled' ? 'Sharing cancelled. Your report is still saved.' : result.status === 'downloaded' ? 'Native sharing is unavailable, so the JSON fallback was downloaded.' : 'Could not open sharing. Your report is still saved; use View Report for Copy/Download fallbacks.';
    };
    $('guidedViewReport').onclick = () => {
      document.querySelector('[data-diag-tab="report"]')?.click();
      setTimeout(refreshCombinedReport, 0);
    };
    $('guidedNewSession').onclick = () => { newSession(); phase = null; showGuided(); };
  }
  function cancelGuided(reason='Cancelled') {
    if (session && path) {
      session.status = 'in-progress';
      session.warnings.push(reason);
      session.warnings = [...new Set(session.warnings)];
      persistSession();
    }
    cleanupResources(); path = null; phase = null; message = ''; renderGuided();
  }

  function cleanupAudio() {
    guidedAudioUnsub?.(); guidedAudioUnsub = null;
    if (guidedAudioOwned) window.FMQGuitarAudio?.stop?.();
    guidedAudioOwned = false;
  }
  function cleanupMidi() {
    guidedMidiUnsub?.(); guidedMidiUnsub = null;
    if (guidedMidiOwned) window.FMQHardware?.midi?.destroy?.();
    guidedMidiOwned = false;
  }
  function cleanupPianoMic() {
    if (guidedPianoMic) { try { guidedPianoMic.stop(); } catch {} }
    guidedPianoMic = null;
    pianoMicQuietSamples = []; pianoMicNoteResult = null; pianoMicNoteIndex = 0;
  }
  function cleanupResources() { cleanupAudio(); cleanupPianoMic(); cleanupMidi(); }

  function ratingLabel(value) {
    return value === 'good' ? 'Good' : value === 'okay' ? 'Okay' : value === 'bad' ? 'Bad' : 'Not answered';
  }
  function formatAdultResult(value) {
    return value === 'pass' ? 'PASS' : value === 'blocker' ? 'BLOCKER' : 'NOT DECIDED';
  }
  function trustLabel(value) {
    return value === 'yes' ? 'Yes' : value === 'mostly' ? 'Mostly' : value === 'no-unsure' ? 'No / unsure' : 'Not answered';
  }
  function browserLabel(platformData={}) {
    const match = String(platformData.userAgent || '').match(/(?:Chrome|CriOS)\/([\d.]+)/);
    return match ? `Chrome ${match[1]}` : 'Browser version not identified';
  }
  function guitarProjectSummary(s) {
    const guitar = s?.guitar || {};
    if (guitar.status === 'not-run') return 'NOT RUN';
    const strings = guitar.strings || [];
    const retries = strings.reduce((sum,item)=>sum+Number(item.retries || 0),0);
    const repeated = guitar.repeated ? `${guitar.repeated.onsetsObserved}/${guitar.repeated.requested} repeated onsets` : 'repeated-note check not run';
    const silence = guitar.silence ? `${guitar.silence.scoreableReadings} scoreable silence readings` : 'silence check not run';
    return `${String(guitar.status || 'unknown').toUpperCase()} · ${strings.length}/${GUITAR_STRINGS.length} open strings passed · retries ${retries} · ${repeated} · ${silence}`;
  }
  function pianoMicProjectSummary(s) {
    const mic = s?.pianoMicrophone || {};
    if (mic.status === 'not-run' || !mic.status) return 'NOT RUN';
    const notes = mic.notes || [];
    const retries = [...notes, ...(mic.repeated ? [mic.repeated] : [])].reduce((sum,item)=>sum+Number(item.retries || 0),0);
    return `${String(mic.status || 'unknown').toUpperCase()} · monophonic · ${notes.length}/5 C–G notes passed · repeated C ${mic.repeated?.stable ? 'passed' : 'not passed'} · retries ${retries}`;
  }
  function midiProjectSummary(s) {
    const midi = s?.midi || {};
    if (midi.status === 'not-run') return 'NOT RUN';
    const sustain = midi.sustain?.observed ? 'sustain observed' : midi.skipped?.includes('sustain') ? 'sustain skipped' : 'sustain not observed';
    return `${String(midi.status || 'unknown').toUpperCase()} · Note On ${midi.noteOn ? 'yes' : 'no'} · Note Off ${midi.noteOff ? 'yes' : 'no'} · velocity samples ${midi.velocitySamples?.length || 0} · max polyphony ${midi.polyphonyMax || 0} · ${sustain}`;
  }
  function combinedReportObject() {
    const base = baseReportObject ? baseReportObject() : { format:'family-music-quest-hardware-report', version:1, generatedAt:new Date().toISOString(), player:activeProfile(), platform:platform() };
    const saved = getJson(RESULT_KEY)[activeId()]?.guidedAcceptance || session || null;
    const currentPlatform = platform();
    return { ...base, appVersion:APP_VERSION, commit:base.commit || null, platform:{ ...(base.platform || {}), displayMode:currentPlatform.displayMode }, guidedAcceptance:saved };
  }
  function projectReportText(report=combinedReportObject()) {
    const s = report.guidedAcceptance;
    const human = s?.humanEvidence || createHumanEvidence();
    const observations = s?.humanObservations?.answers || {};
    const platformData = report.platform || s?.platform || {};
    const lines = [
      'Family Music Quest — Project Hardware Report',
      `FMQ version: ${report.appVersion || APP_VERSION}`,
      `Commit/build: ${report.commit || 'Not available'}`,
      `Session: ${s?.sessionId || 'NOT RUN'}`,
      `Generated: ${report.generatedAt || new Date().toISOString()}`,
      `Player: ${report.player?.name || s?.player?.name || 'Unknown'}`,
      `Device: ${platformData.platform || 'Unknown'} · ${browserLabel(platformData)} · ${platformData.displayMode === 'standalone' ? 'Installed PWA' : 'Browser tab'}`,
      `Guitar/audio input: ${s?.audioDevice?.label || 'Not recorded'}`,
      `Piano microphone input: ${s?.pianoMicrophone?.device?.label || 'Not recorded'}`,
      `Piano/MIDI input: ${s?.midi?.device?.name || 'Not recorded'}`,
      '',
      'HUMAN VALIDATION',
      `Adult result: ${formatAdultResult(human.adultResult)}`,
      `Adult help required: ${human.adultHelpRequired || '0'}`,
      `Child trusted scoring: ${trustLabel(human.childScoringTrust)}`,
      'Child feedback:',
      `- Game reacted when played: ${ratingLabel(observations.reaction)}`,
      `- Delay: ${ratingLabel(observations.delay)}`,
      `- Music smoothness: ${ratingLabel(observations.smooth)}`,
      `- Readability: ${ratingLabel(observations.readability)}`,
      `- Would keep playing: ${ratingLabel(observations.keepPlaying)}`
    ];
    if (human.adultHelpNote) lines.push(`Adult help note: ${human.adultHelpNote}`);
    if (human.childComment) lines.push(`Child comment: "${human.childComment}"`);
    if (human.testerNote) lines.push(`Tester/context: ${human.testerNote}`);
    lines.push('', 'AUTOMATED EVIDENCE', `Guitar microphone: ${guitarProjectSummary(s)}`, `Piano microphone: ${pianoMicProjectSummary(s)}`, `Piano/MIDI: ${midiProjectSummary(s)}`);
    if (s?.warnings?.length) { lines.push('Warnings:'); s.warnings.forEach(item=>lines.push(`- ${item}`)); }
    if (s?.testsNotPerformed?.length) { lines.push('Tests not performed:'); s.testsNotPerformed.forEach(item=>lines.push(`- ${item}`)); }
    if (human.evidenceReferences?.length) { lines.push('Evidence references:'); human.evidenceReferences.forEach(item=>lines.push(`- ${item}`)); }
    return lines.join('\n');
  }
  function combinedReportText() { return projectReportText(); }
  function refreshCombinedReport() { if ($('diagReport')) $('diagReport').textContent = projectReportText(); }
  function setReportActionStatus(text) {
    if ($('diagReportActionStatus')) $('diagReportActionStatus').textContent = text || '';
  }
  function downloadReportPayload(payload=createReportPayload(combinedReportObject())) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([payload.json], { type:'application/json' }));
    a.download = payload.filename;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 500);
    return payload;
  }
  function buildParentShareFiles(payload, reportText) {
    if (typeof File === 'undefined') return { jsonFile:null, textFile:null, textFilename:null };
    const jsonFile = new File([payload.json], payload.filename, { type:'application/json' });
    const textFilename = payload.filename.replace(/\.json$/i, '-parent-report.txt');
    const companionText = `${reportText}

--- STRUCTURED HARDWARE VALIDATION JSON ---
${payload.json}`;
    const textFile = new File([companionText], textFilename, { type:'text/plain' });
    return { jsonFile, textFile, textFilename };
  }
  function canShareFileSet(files) {
    if (!navigator.canShare || !files?.length || files.some(file=>!file)) return false;
    try { return Boolean(navigator.canShare({ files })); } catch { return false; }
  }
  async function shareTestReport() {
    const payload = createReportPayload(combinedReportObject());
    const reportText = projectReportText(payload.report);
    const { jsonFile, textFile } = buildParentShareFiles(payload, reportText);
    const title = 'Family Music Quest hardware test report';
    let method = null;
    let files = [];

    if (jsonFile && textFile && canShareFileSet([jsonFile, textFile])) {
      method = 'json+text-files';
      files = [jsonFile, textFile];
    } else if (jsonFile && canShareFileSet([jsonFile])) {
      method = 'json-file';
      files = [jsonFile];
    } else if (textFile && canShareFileSet([textFile])) {
      method = 'text-file';
      files = [textFile];
    } else if (navigator.share) {
      let textShareable = true;
      if (navigator.canShare) {
        try { textShareable = Boolean(navigator.canShare({ title, text:reportText })); } catch { textShareable = false; }
      }
      if (textShareable) method = 'text-only';
    }

    if (!navigator.share || !method) {
      downloadReportPayload(payload);
      setReportActionStatus('This Chromebook cannot open a compatible native share. The JSON report was downloaded; Copy Project Report is also available.');
      return { status:'downloaded', method:'download-json', payload };
    }

    const shareData = { title, text:reportText };
    if (files.length) shareData.files = files;
    try {
      await navigator.share(shareData);
      if (method === 'json+text-files') setReportActionStatus('Share sheet completed with the readable report and structured JSON attached. FMQ cannot verify whether the selected app sent the message.');
      else if (method === 'json-file') setReportActionStatus('Share sheet completed with structured JSON plus the full report text. The selected app may handle the text differently; verify before sending.');
      else if (method === 'text-file') setReportActionStatus('Share sheet completed with a readable report file that also contains the structured JSON. A separate .json attachment was not supported on this device.');
      else setReportActionStatus('Share sheet completed with the full report text. File sharing was unavailable; use Download JSON if the structured file is still needed.');
      return { status:'shared', method, payload };
    } catch (error) {
      if (error?.name === 'AbortError') {
        setReportActionStatus('Sharing was canceled or no destination was selected. Nothing was sent; the report is still saved.');
        return { status:'cancelled', method, payload };
      }
      setReportActionStatus('Sharing did not complete. Nothing was removed; use Send Report to Parent again, Copy Project Report, or Download JSON.');
      return { status:'error', method, payload, error:String(error?.message || error) };
    }
  }
  function wireReport() {
    if (!window.FMQDiagnostics) return;
    baseReportObject = window.FMQDiagnostics.reportObject;
    baseReportText = window.FMQDiagnostics.reportText;
    window.FMQDiagnostics.reportObject = combinedReportObject;
    window.FMQDiagnostics.reportText = projectReportText;
    $('diagCopyReport').onclick = async () => {
      try {
        await navigator.clipboard?.writeText(projectReportText());
        setReportActionStatus('Project Report copied. Paste it into the Family Music Quest Project Manager chat.');
      } catch {
        setReportActionStatus('Could not copy automatically. Select the report text above, or use Send Report to Parent / Download JSON.');
      }
    };
    $('diagShareReport').onclick = shareTestReport;
    $('diagExportReport').onclick = () => {
      downloadReportPayload(createReportPayload(combinedReportObject()));
      setReportActionStatus('Hardware Validation JSON downloaded.');
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectUi(); wireReport(); loadSession(); renderGuided(); refreshCombinedReport();
  });

  window.FMQGuidedHardwareTest = {
    rules,
    getSession:() => session ? clone(session) : null,
    getState:() => ({ path, phase, stringIndex, pianoMicNoteIndex, resources:{ audioSubscribed:Boolean(guidedAudioUnsub), audioOwned:guidedAudioOwned, pianoMicActive:Boolean(guidedPianoMic), midiSubscribed:Boolean(guidedMidiUnsub), midiOwned:guidedMidiOwned } }),
    beginNew:() => { newSession(); showGuided(); },
    beginGuitarSynthetic:() => startGuitar(true),
    feedAudio:reading => processAudioReading(reading),
    startSilenceSynthetic:startSilenceCheck,
    beginPianoMicSynthetic:() => startPianoMic(true),
    feedPianoMic:reading => processPianoMicReading(reading),
    beginMidiSynthetic:() => startMidi(true),
    feedMidi:event => processMidiEvent(event),
    skipMidi:skipGuidedStep,
    completeWithHumanForTest:(answers,evidence={}) => completeSession(answers,evidence),
    cancel:cancelGuided,
    reportObject:combinedReportObject,
    reportText:projectReportText,
    reportPayload:() => createReportPayload(combinedReportObject()),
    shareReport:shareTestReport,
    downloadReport:() => downloadReportPayload(createReportPayload(combinedReportObject()))
  };
})();
