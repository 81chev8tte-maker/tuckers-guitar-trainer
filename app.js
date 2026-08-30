(() => {
  'use strict';

  const APP_VERSION = '0.1.0';
  const PROGRESS_KEY = 'tgt-progress-v1';
  const DB_NAME = 'tucker-guitar-trainer';
  const DB_VERSION = 1;
  const STORE_SONGS = 'songs';

  const lessons = [
    {
      id: 'parts', title: 'Meet the Guitar', time: '5 min',
      summary: 'Strings, frets, pickups, controls and the basic names you need.',
      body: `<p>An electric guitar is easier to learn when the parts stop being mysterious. The six strings are numbered from the thinnest string to the thickest: 1 through 6.</p>
      <h3>String names</h3><p>From thickest to thinnest in standard tuning: <strong>E A D G B E</strong>.</p>
      <h3>Try this</h3><p>Point to each string and say its name out loud twice. Then find fret 1, fret 3, fret 5 and fret 12.</p>`
    },
    {
      id: 'pick', title: 'Hold the Pick & Make a Clean Note', time: '7 min',
      summary: 'Relaxed grip, small pick movement, clean single notes.',
      body: `<p>Hold the pick between your thumb and the side of your index finger. Only a small point of the pick needs to stick out. Keep your wrist loose.</p>
      <h3>Drill</h3><p>Pick the open low E string eight times slowly. Then fret the 3rd fret and do it again. Aim for a clear note with no buzzing.</p>`
    },
    {
      id: 'tab', title: 'Read Guitar Tab', time: '8 min',
      summary: 'Understand strings, fret numbers and reading left to right.',
      body: `<p>Tab has six lines. The top line is the thin high E string and the bottom line is the thick low E string. A number tells you which fret to play.</p>
      <pre>e|----------------|\nB|----------------|\nG|----------------|\nD|----------------|\nA|----------------|\nE|0--0--3--0--5--3|</pre>
      <p>Play the numbers from left to right. A <strong>0</strong> means play the string open.</p>`
    },
    {
      id: 'alternate-pick', title: 'Alternate Picking', time: '8 min',
      summary: 'Down-up picking for smoother, faster playing.',
      body: `<p>Instead of using only downstrokes, alternate: down, up, down, up. Keep the movement small.</p>
      <pre>e|0-0-0-0-0-0-0-0-|\n   D U D U D U D U</pre>
      <p>Start at 60 BPM with the metronome. One note per click.</p>`
    },
    {
      id: 'power-chords', title: 'Power Chords', time: '12 min',
      summary: 'The shape behind a huge amount of rock guitar.',
      body: `<p>A basic two-note power chord uses a root note plus the note two frets higher on the next thinner string.</p>
      <pre>   G5      A5\ne|---------|---------|\nB|---------|---------|\nG|---------|---------|\nD|5--------|7--------|\nA|5--------|7--------|\nE|3--------|5--------|</pre>
      <p>Use your index finger on the lower fret and ring finger on the higher fret. Try to mute the strings you are not playing.</p>`
    },
    {
      id: 'palm-mute', title: 'Palm Muting', time: '10 min',
      summary: 'Turn open, ringing power into tight rock rhythm.',
      body: `<p>Rest the edge of your picking-hand palm lightly on the strings right where they leave the bridge. Too far forward kills the note; too far back does nothing.</p>
      <p>Try eight steady low-E notes. Move your palm a few millimetres until you get a tight <em>chunk</em> instead of a dead click.</p>`
    },
    {
      id: 'open-chords', title: 'First Open Chords', time: '15 min',
      summary: 'Em, E, A, D, C and G — useful shapes for thousands of songs.',
      body: `<p>Start with <strong>Em</strong> because it is friendly: 0 2 2 0 0 0 from low E to high e. Strum slowly and listen for every string.</p>
      <p>Then use the Chord Library in Tools to work through E, A, D, C and G. Do not worry about changing fast yet.</p>`
    },
    {
      id: 'changes', title: 'Chord Changes', time: '10 min',
      summary: 'Switch cleanly without rushing.',
      body: `<p>Pick two chords. Set the metronome to 60 BPM. Play the first chord for four clicks, switch, then play the second chord for four clicks.</p>
      <p>Do five clean switches before increasing the speed.</p>`
    },
    {
      id: 'hammer-pull', title: 'Hammer-ons & Pull-offs', time: '10 min',
      summary: 'Make two notes with one pick stroke.',
      body: `<p>For a hammer-on, pick the first note then bring another finger down firmly on a higher fret. For a pull-off, pull the fretting finger slightly downward as it leaves the string.</p>
      <pre>e|----------------|\nB|----------------|\nG|----------------|\nD|----------------|\nA|----------------|\nE|0h3--3p0--0h5p0-|</pre>`
    },
    {
      id: 'slides-bends', title: 'Slides & Bends', time: '12 min',
      summary: 'Give single notes movement and attitude.',
      body: `<p>For a slide, keep pressure on the string and move to the target fret. For a bend, support the bending finger with the fingers behind it and push the string sideways.</p>
      <pre>e|----------------|\nB|----------------|\nG|5/7--7\\5--7b9--|\nD|----------------|</pre>
      <p>Bends must land in tune. Compare the bent note to the target fret before practicing faster.</p>`
    },
    {
      id: 'minor-pent', title: 'Minor Pentatonic Box 1', time: '15 min',
      summary: 'A five-note scale shape for riffs and beginner lead guitar.',
      body: `<p>Start with A minor pentatonic at the 5th fret. Use one finger per fret area and play slowly.</p>
      <pre>e|5--8|\nB|5--8|\nG|5--7|\nD|5--7|\nA|5--7|\nE|5--8|</pre>
      <p>Play up and down using alternate picking. Start at 60 BPM.</p>`
    },
    {
      id: 'first-riff', title: 'Build Your Own Riff', time: '15 min',
      summary: 'Use what you learned instead of only copying other players.',
      body: `<p>Choose three notes from the low E string: open, 3rd fret and 5th fret. Create a four-beat rhythm and repeat it. Add a palm mute, a rest, or one power chord.</p>
      <p>Record it on a phone if you like it. The goal is not to write a masterpiece — it is to turn technique into music.</p>`
    }
  ];

  const chords = [
    { name: 'Em', frets: '0 2 2 0 0 0', note: 'Easy first chord. Strum all 6 strings.' },
    { name: 'E',  frets: '0 2 2 1 0 0', note: 'Like Em with one extra finger.' },
    { name: 'A',  frets: 'x 0 2 2 2 0', note: 'Start strumming from the A string.' },
    { name: 'D',  frets: 'x x 0 2 3 2', note: 'Use only the four thinnest strings.' },
    { name: 'C',  frets: 'x 3 2 0 1 0', note: 'Avoid the low E string.' },
    { name: 'G',  frets: '3 2 0 0 0 3', note: 'Let the middle strings ring clearly.' },
    { name: 'Am', frets: 'x 0 2 2 1 0', note: 'A useful minor open chord.' },
    { name: 'Dm', frets: 'x x 0 2 3 1', note: 'Use only the four thinnest strings.' }
  ];

  const achievements = [
    { id: 'lesson1', icon: '🎸', title: 'First Step', text: 'Complete 1 lesson', test: s => s.completedLessons.length >= 1 },
    { id: 'lesson5', icon: '⚡', title: 'Getting Loud', text: 'Complete 5 lessons', test: s => s.completedLessons.length >= 5 },
    { id: 'allLessons', icon: '🏁', title: 'Beginner Path', text: 'Complete every lesson', test: s => s.completedLessons.length >= lessons.length },
    { id: 'practice10', icon: '⏱️', title: 'Ten Minutes', text: 'Log 10 practice minutes', test: s => s.practiceMinutes >= 10 },
    { id: 'practice60', icon: '🔥', title: 'One Hour', text: 'Log 60 practice minutes', test: s => s.practiceMinutes >= 60 },
    { id: 'days3', icon: '📅', title: 'Three Days', text: 'Practice on 3 different days', test: s => Object.keys(s.practiceDays).length >= 3 },
    { id: 'song1', icon: '🎵', title: 'My First Tab', text: 'Import a song file', asyncTest: true },
    { id: 'song5', icon: '💿', title: 'Mini Library', text: 'Save 5 song files', asyncTest: true }
  ];

  let state = loadProgress();
  let deferredInstallPrompt = null;
  let dbPromise = null;
  let currentSong = null;
  let alphaApi = null;
  let practiceInterval = null;
  let practiceSecondsLeft = 600;
  let practiceRunning = false;
  let metronomeTimer = null;
  let metronomeBeat = 0;
  let audioContext = null;
  let tunerStream = null;
  let tunerRaf = null;
  let tunerAnalyser = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    renderLessons();
    renderChords();
    bindNavigation();
    bindPracticeTimer();
    bindSongImport();
    bindTuner();
    bindMetronome();
    bindProgressReset();
    bindPwaInstall();
    updateNetworkBadge();
    updateStats();
    refreshSongs();
    registerServiceWorker();
  }

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY));
      return {
        completedLessons: Array.isArray(saved?.completedLessons) ? saved.completedLessons : [],
        practiceMinutes: Number(saved?.practiceMinutes || 0),
        practiceDays: saved?.practiceDays && typeof saved.practiceDays === 'object' ? saved.practiceDays : {}
      };
    } catch {
      return { completedLessons: [], practiceMinutes: 0, practiceDays: {} };
    }
  }

  function saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
    updateStats();
  }

  function bindNavigation() {
    $$('[data-view-target]').forEach(el => {
      el.addEventListener('click', () => {
        const view = el.dataset.viewTarget;
        showView(view);
        const tool = el.dataset.focusTool;
        if (tool) requestAnimationFrame(() => $(`#tool-${tool}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      });
    });
  }

  function showView(name) {
    $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
    $$('.nav-button').forEach(b => b.classList.toggle('active', b.dataset.viewTarget === name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'progress') renderAchievements();
  }

  function renderLessons() {
    const list = $('#lessonList');
    list.innerHTML = lessons.map((lesson, i) => {
      const done = state.completedLessons.includes(lesson.id);
      return `<details class="lesson ${done ? 'complete' : ''}" data-lesson-id="${lesson.id}">
        <summary>
          <span class="lesson-number">${i + 1}</span>
          <span class="lesson-title"><strong>${escapeHtml(lesson.title)}</strong><span>${escapeHtml(lesson.time)} · ${escapeHtml(lesson.summary)}</span></span>
          <span class="lesson-check">${done ? '✓' : '○'}</span>
        </summary>
        <div class="lesson-body">${lesson.body}
          <div class="lesson-actions"><button class="button lesson-complete">${done ? 'Completed ✓' : 'Mark Complete'}</button></div>
        </div>
      </details>`;
    }).join('');

    $$('.lesson-complete', list).forEach(btn => {
      btn.addEventListener('click', e => {
        const lessonEl = e.target.closest('.lesson');
        toggleLesson(lessonEl.dataset.lessonId);
      });
    });
  }

  function toggleLesson(id) {
    const i = state.completedLessons.indexOf(id);
    if (i >= 0) state.completedLessons.splice(i, 1);
    else state.completedLessons.push(id);
    saveProgress();
    renderLessons();
    toast(i >= 0 ? 'Lesson marked incomplete.' : 'Lesson completed!');
  }

  function bindPracticeTimer() {
    $('#practiceStart').addEventListener('click', () => {
      if (practiceRunning) stopPracticeTimer(false);
      else startPracticeTimer();
    });
    $('#practiceReset').addEventListener('click', () => {
      stopPracticeTimer(false);
      practiceSecondsLeft = 600;
      updatePracticeClock();
    });
    updatePracticeClock();
  }

  function startPracticeTimer() {
    practiceRunning = true;
    $('#practiceStart').textContent = 'Pause';
    practiceInterval = setInterval(() => {
      practiceSecondsLeft--;
      updatePracticeClock();
      if (practiceSecondsLeft <= 0) {
        stopPracticeTimer(true);
        practiceSecondsLeft = 600;
        updatePracticeClock();
      }
    }, 1000);
  }

  function stopPracticeTimer(completed) {
    clearInterval(practiceInterval);
    practiceInterval = null;
    practiceRunning = false;
    $('#practiceStart').textContent = 'Start Timer';
    if (completed) {
      state.practiceMinutes += 10;
      state.practiceDays[new Date().toISOString().slice(0,10)] = true;
      saveProgress();
      toast('10 practice minutes logged!');
    }
  }

  function updatePracticeClock() {
    const min = Math.floor(practiceSecondsLeft / 60);
    const sec = practiceSecondsLeft % 60;
    $('#practiceTimer').textContent = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  function bindSongImport() {
    const input = $('#songFileInput');
    const zone = $('#dropZone');
    input.addEventListener('change', () => importFiles([...input.files]));
    ['dragenter','dragover'].forEach(evt => zone.addEventListener(evt, e => { e.preventDefault(); zone.classList.add('dragging'); }));
    ['dragleave','drop'].forEach(evt => zone.addEventListener(evt, e => { e.preventDefault(); zone.classList.remove('dragging'); }));
    zone.addEventListener('drop', e => importFiles([...e.dataTransfer.files]));
    zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') input.click(); });
    $('#closePlayer').addEventListener('click', closePlayer);
    $('#alphaPlay').addEventListener('click', () => alphaApi?.playPause());
    $('#alphaStop').addEventListener('click', () => alphaApi?.stop());
    $('#alphaSpeed').addEventListener('change', e => {
      if (alphaApi) alphaApi.playbackSpeed = Number(e.target.value);
    });
  }

  async function importFiles(files) {
    const allowed = ['gp','gpx','gp3','gp4','gp5','musicxml','xml','txt','tab'];
    let imported = 0;
    for (const file of files) {
      const ext = extensionOf(file.name);
      if (!allowed.includes(ext)) {
        toast(`Skipped ${file.name}: unsupported file type.`);
        continue;
      }
      const record = {
        id: `${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`,
        name: file.name,
        ext,
        size: file.size,
        createdAt: Date.now(),
        blob: file
      };
      await putSong(record);
      imported++;
    }
    inputReset();
    await refreshSongs();
    if (imported) toast(`${imported} file${imported === 1 ? '' : 's'} saved.`);
  }

  function inputReset() { $('#songFileInput').value = ''; }

  function getDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_SONGS)) db.createObjectStore(STORE_SONGS, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function putSong(record) {
    const db = await getDb();
    return txPromise(db, 'readwrite', store => store.put(record));
  }

  async function getSongs() {
    const db = await getDb();
    const songs = await txPromise(db, 'readonly', store => store.getAll());
    return songs.sort((a,b) => b.createdAt - a.createdAt);
  }

  async function getSong(id) {
    const db = await getDb();
    return txPromise(db, 'readonly', store => store.get(id));
  }

  async function deleteSong(id) {
    const db = await getDb();
    return txPromise(db, 'readwrite', store => store.delete(id));
  }

  function txPromise(db, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SONGS, mode);
      const store = tx.objectStore(STORE_SONGS);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function refreshSongs() {
    let songs = [];
    try { songs = await getSongs(); } catch (err) { console.error(err); }
    const list = $('#songList');
    $('#songCount').textContent = songs.length;
    if (!songs.length) {
      list.className = 'song-list empty-state';
      list.textContent = 'No songs imported yet.';
    } else {
      list.className = 'song-list';
      list.innerHTML = songs.map(s => `<div class="song-item">
        <button class="song-main" data-open-song="${s.id}"><strong>${escapeHtml(stripExtension(s.name))}</strong><span>${s.ext.toUpperCase()} · ${formatBytes(s.size)}</span></button>
        <button class="icon-button" data-delete-song="${s.id}" aria-label="Delete ${escapeHtml(s.name)}">🗑</button>
      </div>`).join('');
      $$('[data-open-song]', list).forEach(b => b.addEventListener('click', () => openSong(b.dataset.openSong)));
      $$('[data-delete-song]', list).forEach(b => b.addEventListener('click', async () => {
        const song = await getSong(b.dataset.deleteSong);
        if (song && confirm(`Delete ${song.name} from this browser?`)) {
          if (currentSong?.id === song.id) closePlayer();
          await deleteSong(song.id);
          await refreshSongs();
          toast('Song removed.');
        }
      }));
    }
    updateStats(songs.length);
  }

  async function openSong(id) {
    const song = await getSong(id);
    if (!song) return;
    currentSong = song;
    $('#playerEmpty').hidden = true;
    $('#playerContent').hidden = false;
    $('#playerSongName').textContent = stripExtension(song.name);
    $('#textTab').hidden = true;
    $('#alphaTab').hidden = false;
    $('#alphaControls').hidden = false;
    $('#alphaStatus').textContent = 'Loading…';

    if (song.ext === 'txt' || song.ext === 'tab') {
      destroyAlphaTab();
      $('#alphaControls').hidden = true;
      $('#alphaTab').hidden = true;
      $('#textTab').hidden = false;
      $('#textTab').textContent = await song.blob.text();
      return;
    }

    try {
      if (!window.alphaTab) throw new Error('Tab player library is not available. Connect to the internet once and reload.');
      destroyAlphaTab();
      const viewport = $('#tabViewport');
      alphaApi = new alphaTab.AlphaTabApi($('#alphaTab'), {
        player: {
          enablePlayer: true,
          enableCursor: true,
          enableUserInteraction: true,
          soundFont: 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.4/dist/soundfont/sonivox.sf2',
          scrollElement: viewport
        },
        display: { scale: 0.9 }
      });
      alphaApi.renderStarted.on(() => { $('#alphaStatus').textContent = 'Rendering…'; });
      alphaApi.renderFinished.on(() => { $('#alphaStatus').textContent = 'Ready'; });
      alphaApi.playerReady.on(() => { $('#alphaStatus').textContent = 'Ready to play'; });
      alphaApi.playerStateChanged.on(args => {
        const playing = args.state === 1;
        $('#alphaPlay').textContent = playing ? '❚❚ Pause' : '▶ Play';
      });
      alphaApi.error.on(err => {
        console.error(err);
        $('#alphaStatus').textContent = 'Could not open this file';
      });
      alphaApi.load(await song.blob.arrayBuffer());
    } catch (err) {
      console.error(err);
      $('#alphaStatus').textContent = err.message || 'Could not load tab.';
      toast(err.message || 'Could not load tab.');
    }
  }

  function destroyAlphaTab() {
    if (alphaApi) {
      try { alphaApi.destroy(); } catch {}
      alphaApi = null;
    }
    $('#alphaTab').innerHTML = '';
  }

  function closePlayer() {
    destroyAlphaTab();
    currentSong = null;
    $('#playerContent').hidden = true;
    $('#playerEmpty').hidden = false;
  }

  function bindTuner() {
    $('#tunerToggle').addEventListener('click', () => tunerStream ? stopTuner() : startTuner());
  }

  async function startTuner() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation:false, autoGainControl:false, noiseSuppression:false }, video:false });
      tunerStream = stream;
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();
      const source = audioContext.createMediaStreamSource(stream);
      tunerAnalyser = audioContext.createAnalyser();
      tunerAnalyser.fftSize = 2048;
      source.connect(tunerAnalyser);
      $('#tunerToggle').textContent = 'Stop Tuner';
      $('#tunerMessage').textContent = 'Play one string and let it ring.';
      tuneLoop();
    } catch (err) {
      console.error(err);
      $('#tunerMessage').textContent = 'Microphone access was blocked or unavailable.';
      toast('Allow microphone access to use the tuner.');
    }
  }

  function stopTuner() {
    cancelAnimationFrame(tunerRaf);
    tunerRaf = null;
    tunerStream?.getTracks().forEach(t => t.stop());
    tunerStream = null;
    tunerAnalyser = null;
    $('#tunerToggle').textContent = 'Start Tuner';
    $('#tunerNote').textContent = '—';
    $('#tunerOctave').textContent = '';
    $('#tunerFrequency').textContent = '0.0 Hz';
    $('#tunerNeedle').style.left = '50%';
    $('#tunerMessage').textContent = 'Tuner is off.';
  }

  function tuneLoop() {
    if (!tunerAnalyser || !audioContext) return;
    const buffer = new Float32Array(tunerAnalyser.fftSize);
    tunerAnalyser.getFloatTimeDomainData(buffer);
    const freq = autoCorrelate(buffer, audioContext.sampleRate);
    if (freq > 0) {
      const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
      const rounded = Math.round(noteNum) + 69;
      const names = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
      const note = names[((rounded % 12) + 12) % 12];
      const octave = Math.floor(rounded / 12) - 1;
      const targetFreq = 440 * Math.pow(2, (rounded - 69) / 12);
      const cents = Math.max(-50, Math.min(50, 1200 * Math.log2(freq / targetFreq)));
      $('#tunerNote').textContent = note;
      $('#tunerOctave').textContent = octave;
      $('#tunerFrequency').textContent = `${freq.toFixed(1)} Hz`;
      $('#tunerNeedle').style.left = `${50 + cents}%`;
      $('#tunerMessage').textContent = Math.abs(cents) < 5 ? 'In tune ✓' : cents < 0 ? `${Math.abs(Math.round(cents))} cents flat` : `${Math.round(cents)} cents sharp`;
    }
    tunerRaf = requestAnimationFrame(tuneLoop);
  }

  function autoCorrelate(buffer, sampleRate) {
    let rms = 0;
    for (const v of buffer) rms += v * v;
    rms = Math.sqrt(rms / buffer.length);
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = buffer.length - 1, threshold = 0.2;
    for (let i = 0; i < buffer.length / 2; i++) { if (Math.abs(buffer[i]) < threshold) { r1 = i; break; } }
    for (let i = 1; i < buffer.length / 2; i++) { if (Math.abs(buffer[buffer.length - i]) < threshold) { r2 = buffer.length - i; break; } }
    const buf = buffer.slice(r1, r2);
    const c = new Array(buf.length).fill(0);
    for (let i = 0; i < buf.length; i++) for (let j = 0; j < buf.length - i; j++) c[i] += buf[j] * buf[j + i];
    let d = 0;
    while (c[d] > c[d + 1] && d < c.length - 2) d++;
    let maxValue = -1, maxPos = -1;
    for (let i = d; i < c.length; i++) if (c[i] > maxValue) { maxValue = c[i]; maxPos = i; }
    let t0 = maxPos;
    if (t0 <= 0 || t0 >= c.length - 1) return -1;
    const x1 = c[t0 - 1], x2 = c[t0], x3 = c[t0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) t0 -= b / (2 * a);
    return sampleRate / t0;
  }

  function bindMetronome() {
    const slider = $('#bpmSlider');
    const setBpm = value => {
      const bpm = Math.max(40, Math.min(220, Number(value)));
      slider.value = bpm;
      $('#bpmValue').textContent = bpm;
      if (metronomeTimer) restartMetronome();
    };
    slider.addEventListener('input', e => setBpm(e.target.value));
    $('#bpmDown').addEventListener('click', () => setBpm(Number(slider.value) - 5));
    $('#bpmUp').addEventListener('click', () => setBpm(Number(slider.value) + 5));
    $('#metroToggle').addEventListener('click', () => metronomeTimer ? stopMetronome() : startMetronome());
  }

  async function startMetronome() {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') await audioContext.resume();
    metronomeBeat = 0;
    clickBeat();
    const interval = 60000 / Number($('#bpmSlider').value);
    metronomeTimer = setInterval(clickBeat, interval);
    $('#metroToggle').textContent = 'Stop';
  }

  function restartMetronome() {
    stopMetronome();
    startMetronome();
  }

  function stopMetronome() {
    clearInterval(metronomeTimer);
    metronomeTimer = null;
    $('#metroToggle').textContent = 'Start';
    $$('#beatDots span').forEach(d => d.classList.remove('active'));
  }

  function clickBeat() {
    const dots = $$('#beatDots span');
    dots.forEach((d,i) => d.classList.toggle('active', i === metronomeBeat));
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.frequency.value = metronomeBeat === 0 ? 1100 : 760;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, audioContext.currentTime + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.055);
    osc.connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.06);
    metronomeBeat = (metronomeBeat + 1) % 4;
  }

  function renderChords() {
    $('#chordGrid').innerHTML = chords.map(c => `<div class="chord-card"><strong>${c.name}</strong><code>E A D G B e<br>${c.frets}</code><span>${c.note}</span></div>`).join('');
  }

  function bindProgressReset() {
    $('#resetProgress').addEventListener('click', () => {
      if (!confirm('Reset all lesson and practice progress? Imported songs will stay saved.')) return;
      state = { completedLessons: [], practiceMinutes: 0, practiceDays: {} };
      saveProgress();
      renderLessons();
      renderAchievements();
      toast('Progress reset.');
    });
  }

  async function updateStats(knownSongCount = null) {
    let songCount = knownSongCount;
    if (songCount == null) {
      try { songCount = (await getSongs()).length; } catch { songCount = 0; }
    }
    const done = state.completedLessons.length;
    const days = Object.keys(state.practiceDays).length;
    const pct = Math.round((done / lessons.length) * 100);
    $('#statLessons').textContent = `${done}/${lessons.length}`;
    $('#statMinutes').textContent = state.practiceMinutes;
    $('#statDays').textContent = days;
    $('#statSongs').textContent = songCount;
    $('#homeProgressPercent').textContent = `${pct}%`;
    $('#learnProgressText').textContent = `${done} / ${lessons.length}`;
    $('#progressLessons').textContent = `${done}/${lessons.length}`;
    $('#progressMinutes').textContent = state.practiceMinutes;
    $('#progressDays').textContent = days;
    $('#progressSongs').textContent = songCount;
    renderAchievements(songCount);
  }

  async function renderAchievements(knownSongCount = null) {
    let songCount = knownSongCount;
    if (songCount == null) {
      try { songCount = (await getSongs()).length; } catch { songCount = 0; }
    }
    $('#achievementGrid').innerHTML = achievements.map(a => {
      const unlocked = a.asyncTest ? (a.id === 'song1' ? songCount >= 1 : songCount >= 5) : a.test(state);
      return `<div class="achievement ${unlocked ? 'unlocked' : ''}"><div class="achievement-icon">${a.icon}</div><strong>${a.title}</strong><span>${a.text}${unlocked ? ' · Unlocked!' : ''}</span></div>`;
    }).join('');
  }

  function bindPwaInstall() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredInstallPrompt = e;
      $('#installButton').hidden = false;
    });
    $('#installButton').addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      $('#installButton').hidden = true;
    });
    window.addEventListener('appinstalled', () => toast('App installed.'));
    window.addEventListener('online', updateNetworkBadge);
    window.addEventListener('offline', updateNetworkBadge);
  }

  function updateNetworkBadge() {
    const badge = $('#offlineBadge');
    const online = navigator.onLine;
    badge.textContent = online ? 'Online' : 'Offline';
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.error);
  }

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function extensionOf(name) { return (name.split('.').pop() || '').toLowerCase(); }
  function stripExtension(name) { return name.replace(/\.[^.]+$/, ''); }
  function formatBytes(n) { if (n < 1024) return `${n} B`; if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`; return `${(n/1024/1024).toFixed(1)} MB`; }
  function escapeHtml(s) { return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  console.info(`Tucker's Guitar Trainer v${APP_VERSION}`);
})();
