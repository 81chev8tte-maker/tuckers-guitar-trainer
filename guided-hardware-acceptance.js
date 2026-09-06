(() => {
  'use strict';

  const APP_VERSION = '2.6.7';
  const RESULT_KEY = 'family-music-quest-hardware-results-v1';
  const CAL_KEY = 'family-music-quest-calibration-v1';
  const QUIET_SAMPLE_COUNT = 36;
  const GUITAR_STRINGS = [
    { id:'low-e', label:'thick E string', short:'E', note:'E2', midi:40 },
    { id:'a', label:'A string', short:'A', note:'A2', midi:45 },
    { id:'d', label:'D string', short:'D', note:'D3', midi:50 },
    { id:'g', label:'G string', short:'G', note:'G3', midi:55 },
    { id:'b', label:'B string', short:'B', note:'B3', midi:59 },
    { id:'high-e', label:'thin e string', short:'e', note:'E4', midi:64 }
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
  function createSession(meta={}) {
    return {
      format:'family-music-quest-guided-hardware-acceptance', version:1, appVersion:APP_VERSION, commit:null,
      startedAt:meta.startedAt || new Date().toISOString(), completedAt:null, status:'in-progress',
      player:meta.player || null, platform:meta.platform || null,
      audioDevice:null, audioSettings:null,
      guitar:{ status:'not-run', quiet:null, strings:[], repeated:null, silence:null },
      midi:{ status:'not-run', device:null, noteOn:null, noteOff:null, velocitySamples:[], polyphonyMax:0, sustain:null, skipped:[] },
      humanObservations:{}, warnings:[], testsNotPerformed:[]
    };
  }
  function computeNotPerformed(session) {
    const missing = [];
    if (session?.guitar?.status !== 'complete') missing.push('Guided Guitar six-string/repeated-note/silence test');
    if (session?.midi?.status !== 'complete') missing.push('Guided Piano MIDI capability test');
    if (session?.midi?.sustain == null) missing.push('MIDI sustain capability (optional)');
    missing.push('USB audio disconnect/reconnect (manual Monday test)');
    missing.push('MIDI disconnect/reconnect (manual Monday test)');
    missing.push('Piano microphone check (manual, one note at a time)');
    missing.push('Physical end-to-end latency measurement');
    return [...new Set(missing)];
  }

  const rules = { APP_VERSION, QUIET_SAMPLE_COUNT, GUITAR_STRINGS, HUMAN_QUESTIONS, scoreable, createNoteResult, applyNoteReading, summarizeQuiet, summarizeSilence, createSession, computeNotPerformed };
  if (typeof module !== 'undefined' && module.exports) module.exports = rules;
  if (typeof window === 'undefined' || !window.document) return;

  const $ = id => document.getElementById(id);
  const getJson = (key, fallback={}) => { try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; } };
  const setJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const activeProfile = () => window.FMQProfiles?.getActiveProfile?.() || null;
  const activeId = () => activeProfile()?.id || 'no-profile';
  const platform = () => ({ userAgent:navigator.userAgent, platform:navigator.userAgentData?.platform || navigator.platform || 'Unknown', language:navigator.language });
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
  let synthetic = false;
  let noiseGate = .018;
  let midiTarget = null;
  let message = '';
  let baseReportObject = null;
  let baseReportText = null;

  function loadSession() {
    session = getJson(RESULT_KEY)[activeId()]?.guidedAcceptance || null;
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
    session = createSession({ player:profile ? { id:profile.id, name:profile.name } : null, platform:platform() });
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
    launch.innerHTML = '<button id="diagRunGuided" class="button big" type="button">▶ Run Hardware Test</button><span>Short kid-friendly checks. Technical details are recorded automatically.</span>';
    nav.before(launch);

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.dataset.diagTab = 'guided';
    tab.textContent = '🧪 Guided Test';
    nav.prepend(tab);

    const view = document.createElement('section');
    view.className = 'diagnostic-view guided-test-view';
    view.dataset.diagView = 'guided';
    view.hidden = true;
    view.innerHTML = `
      <div class="guided-title-row"><div><p class="eyebrow">MONDAY HARDWARE ACCEPTANCE</p><h2>Guided Hardware Test</h2></div><span id="guidedProgress" class="badge">Ready</span></div>
      <p id="guidedLead" class="muted">Pick a test. You only need to follow the big instructions — Family Music Quest records the technical details.</p>
      <div id="guidedMenu" class="guided-menu">
        <button id="guidedStartGuitar" class="guided-choice" type="button"><span>🎸</span><strong>Guitar audio</strong><small>Quiet check, all six open strings, repeated note and silence.</small></button>
        <button id="guidedStartMidi" class="guided-choice" type="button"><span>🎹</span><strong>Piano MIDI</strong><small>Note On/Off, velocity, chord/polyphony and optional sustain.</small></button>
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
    $('guidedProgress').textContent = !s ? 'Ready' : s.status === 'complete' ? 'Report saved' : path === 'guitar' ? 'Guitar' : path === 'midi' ? 'MIDI' : 'In progress';
    $('guidedLead').textContent = s ? `Guitar: ${statusText(s.guitar.status)} · MIDI: ${statusText(s.midi.status)}. Raw measurements stay in the report.` : 'Pick a test. You only need to follow the big instructions — Family Music Quest records the technical details.';
    if (!path) {
      $('guidedStartGuitar').querySelector('small').textContent = `${statusText(s?.guitar?.status)} · Quiet check, six strings, repeated note and silence.`;
      $('guidedStartMidi').querySelector('small').textContent = `${statusText(s?.midi?.status)} · Note On/Off, velocity, polyphony and optional sustain.`;
    }
    if (path === 'guitar') renderGuitarTask();
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
    persistSession(); renderGuided();
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
    persistSession(); renderGuided();
  }

  function handleGuidedAction() {
    if (path === 'guitar' && phase === 'silence-ready') startSilenceCheck();
    else if (path === 'midi' && phase === 'midi-unavailable') startMidi(false).catch(showGuidedError);
  }

  function showQuestions() {
    ensureSession(); cleanupResources(); path = null; phase = 'questions';
    const form = $('guidedQuestions');
    form.innerHTML = `<h3>Five quick human checks</h3><p class="muted">These are your observations, not automatic measurements. Good = no problem; Bad = a clear problem.</p>${HUMAN_QUESTIONS.map((q,i)=>`<fieldset><legend>${i+1}. ${q.text}</legend><div class="guided-rating"><label><input type="radio" name="guided-${q.id}" value="good" required> Good</label><label><input type="radio" name="guided-${q.id}" value="okay"> Okay</label><label><input type="radio" name="guided-${q.id}" value="bad"> Bad</label></div></fieldset>`).join('')}<button class="button" type="submit">Save Answers & Finish</button>`;
    form.onsubmit = event => {
      event.preventDefault();
      const answers = {};
      for (const q of HUMAN_QUESTIONS) answers[q.id] = form.querySelector(`[name="guided-${q.id}"]:checked`)?.value || null;
      if (Object.values(answers).some(v=>!v)) { message = 'Please answer all five quick questions.'; $('guidedLead').textContent = message; return; }
      completeSession(answers);
    };
    renderGuided();
  }
  function completeSession(answers) {
    ensureSession();
    session.humanObservations = { scale:'good/okay/bad', answers:{...answers}, recordedAt:new Date().toISOString(), source:'human' };
    session.testsNotPerformed = computeNotPerformed(session);
    session.status = 'complete'; session.completedAt = new Date().toISOString();
    phase = 'summary'; persistSession(); renderGuided();
  }
  function renderSummary() {
    if (!session) return;
    $('guidedSummary').innerHTML = `<strong>✅ Hardware test report saved</strong><p>Guitar: ${statusText(session.guitar.status)} · MIDI: ${statusText(session.midi.status)}</p><p class="muted">Open Report to copy or export the technical results and human observations. Monday physical gameplay checks are still required.</p><div class="diagnostic-actions"><button id="guidedViewReport" class="button" type="button">View Report</button><button id="guidedNewSession" class="button secondary" type="button">Start New Test</button></div>`;
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
  function cleanupResources() { cleanupAudio(); cleanupMidi(); }

  function guidedLines(s) {
    if (!s) return ['Guided acceptance: NOT RUN'];
    const lines = ['', 'GUIDED HARDWARE ACCEPTANCE', `Status: ${s.status || 'unknown'}`, `Started: ${s.startedAt || '—'}`, `Completed: ${s.completedAt || '—'}`];
    lines.push(`Guitar guided test: ${String(s.guitar?.status || 'not-run').toUpperCase()}`);
    if (s.audioDevice?.label) lines.push(`Audio input: ${s.audioDevice.label}`);
    if (s.audioSettings?.sampleRate) lines.push(`Audio settings: ${s.audioSettings.sampleRate} Hz · ${s.audioSettings.channelCount || 1} channel`);
    if (s.guitar?.quiet) lines.push(`Quiet measurement: noise ${Number(s.guitar.quiet.noiseFloor || 0).toFixed(4)} · peak ${Number(s.guitar.quiet.peak || 0).toFixed(4)} · measurement only`);
    for (const r of s.guitar?.strings || []) lines.push(`${r.expected.label}: PASS · heard ${r.detectedNote || '—'} · ${r.frequency ? r.frequency.toFixed(1)+' Hz' : '—'} · ${r.cents == null ? '—' : r.cents.toFixed(0)+' cents'} · attempts ${r.attempts} · retries ${r.retries} · onset ${r.onsetSeen ? 'yes' : 'no'}`);
    if (s.guitar?.repeated) lines.push(`Repeated A-string onsets: ${s.guitar.repeated.onsetsObserved}/${s.guitar.repeated.requested} · attempts ${s.guitar.repeated.attempts}`);
    if (s.guitar?.silence) lines.push(`Silence observation: onset ${s.guitar.silence.onsetCount} · stable pitch ${s.guitar.silence.stablePitchReadings} · scoreable readings ${s.guitar.silence.scoreableReadings}`);
    lines.push(`MIDI guided test: ${String(s.midi?.status || 'not-run').toUpperCase()}`);
    if (s.midi?.device?.name) lines.push(`MIDI device: ${s.midi.device.name}${s.midi.device.manufacturer ? ' · '+s.midi.device.manufacturer : ''}`);
    lines.push(`MIDI Note On: ${s.midi?.noteOn ? 'OBSERVED' : 'NOT OBSERVED'}`);
    lines.push(`MIDI Note Off: ${s.midi?.noteOff ? 'OBSERVED' : 'NOT OBSERVED'}`);
    lines.push(`MIDI velocity samples: ${s.midi?.velocitySamples?.length ? s.midi.velocitySamples.join(', ') : 'NOT OBSERVED'}`);
    lines.push(`MIDI max polyphony observed: ${s.midi?.polyphonyMax || 0}`);
    lines.push(`MIDI sustain: ${s.midi?.sustain?.observed ? 'OBSERVED' : s.midi?.skipped?.includes('sustain') ? 'SKIPPED' : 'NOT OBSERVED'}`);
    lines.push('', 'HUMAN OBSERVATIONS');
    for (const q of HUMAN_QUESTIONS) lines.push(`${q.text} ${s.humanObservations?.answers?.[q.id] || 'NOT ANSWERED'}`);
    if (s.warnings?.length) { lines.push('', 'WARNINGS'); s.warnings.forEach(w=>lines.push(`- ${w}`)); }
    if (s.testsNotPerformed?.length) { lines.push('', 'TESTS NOT PERFORMED'); s.testsNotPerformed.forEach(t=>lines.push(`- ${t}`)); }
    return lines;
  }
  function combinedReportObject() {
    const base = baseReportObject ? baseReportObject() : { format:'family-music-quest-hardware-report', version:1, generatedAt:new Date().toISOString(), player:activeProfile(), platform:platform() };
    const saved = getJson(RESULT_KEY)[activeId()]?.guidedAcceptance || session || null;
    return { ...base, appVersion:APP_VERSION, commit:null, guidedAcceptance:saved };
  }
  function combinedReportText() {
    const report = combinedReportObject();
    const base = baseReportText ? baseReportText(report) : 'Family Music Quest Hardware Validation';
    return [`${base}`, `FMQ version: ${APP_VERSION}`, `Generated: ${report.generatedAt || new Date().toISOString()}`, ...guidedLines(report.guidedAcceptance)].join('\n');
  }
  function refreshCombinedReport() { if ($('diagReport')) $('diagReport').textContent = combinedReportText(); }
  function downloadJson(name, object) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(object, null, 2)], { type:'application/json' }));
    a.download = name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 500);
  }
  function wireReport() {
    if (!window.FMQDiagnostics) return;
    baseReportObject = window.FMQDiagnostics.reportObject;
    baseReportText = window.FMQDiagnostics.reportText;
    window.FMQDiagnostics.reportObject = combinedReportObject;
    window.FMQDiagnostics.reportText = combinedReportText;
    $('diagCopyReport').onclick = () => navigator.clipboard?.writeText(combinedReportText());
    $('diagExportReport').onclick = () => downloadJson('family-music-quest-hardware-report.json', combinedReportObject());
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectUi(); wireReport(); loadSession(); renderGuided(); refreshCombinedReport();
  });

  window.FMQGuidedHardwareTest = {
    rules,
    getSession:() => session ? clone(session) : null,
    getState:() => ({ path, phase, stringIndex, resources:{ audioSubscribed:Boolean(guidedAudioUnsub), audioOwned:guidedAudioOwned, midiSubscribed:Boolean(guidedMidiUnsub), midiOwned:guidedMidiOwned } }),
    beginNew:() => { newSession(); showGuided(); },
    beginGuitarSynthetic:() => startGuitar(true),
    feedAudio:reading => processAudioReading(reading),
    startSilenceSynthetic:startSilenceCheck,
    beginMidiSynthetic:() => startMidi(true),
    feedMidi:event => processMidiEvent(event),
    skipMidi:skipGuidedStep,
    completeWithHumanForTest:answers => completeSession(answers),
    cancel:cancelGuided,
    reportObject:combinedReportObject,
    reportText:combinedReportText
  };
})();
