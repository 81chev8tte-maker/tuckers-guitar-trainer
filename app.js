(() => {
  'use strict';

  const APP_VERSION = '0.4.0';
  const PROGRESS_KEY = 'tgq-progress-v2';
  const OLD_PROGRESS_KEY = 'tgt-progress-v1';
  const DB_NAME = 'tucker-guitar-trainer';
  const DB_VERSION = 1;
  const STORE_SONGS = 'songs';
  const HIT_WINDOW = 0.46;
  const NOTE_LOOKAHEAD = 3.2;

  const STRING_INFO = [
    { label:'E', number:6, name:'Low E', openMidi:40 },
    { label:'A', number:5, name:'A', openMidi:45 },
    { label:'D', number:4, name:'D', openMidi:50 },
    { label:'G', number:3, name:'G', openMidi:55 },
    { label:'B', number:2, name:'B', openMidi:59 },
    { label:'e', number:1, name:'High e', openMidi:64 }
  ];

  const NOTE_NAMES = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];

  const chords = [
    { name:'Em', frets:'0 2 2 0 0 0', note:'Easy first chord. Strum all 6 strings.' },
    { name:'E', frets:'0 2 2 1 0 0', note:'Like Em with one extra finger.' },
    { name:'A', frets:'x 0 2 2 2 0', note:'Start from the A string.' },
    { name:'D', frets:'x x 0 2 3 2', note:'Use the four thinnest strings.' },
    { name:'C', frets:'x 3 2 0 1 0', note:'Avoid the low E string.' },
    { name:'G', frets:'3 2 0 0 0 3', note:'Let the middle strings ring.' },
    { name:'Am', frets:'x 0 2 2 1 0', note:'Useful minor open chord.' },
    { name:'Dm', frets:'x x 0 2 3 1', note:'Use the four thinnest strings.' }
  ];

  function seq(pattern, startBeat = 1, step = 1) {
    return pattern.map((p, i) => ({ string:p[0], fret:p[1], beat:startBeat + i * step }));
  }

  const worlds = [
    {
      id:'tab-decoder', number:1, title:'Tab Decoder', subtitle:'Learn what tab means by playing it',
      levels:[
        {
          id:'zero-open', title:'0 = Open', short:'Open-string hits', bpm:60,
          tag:'TAB DECODER', headline:'0 means OPEN',
          lesson:'The bottom E line in tab is your thickest string. A 0 means do not hold a fret — just pick the string.',
          hint:'Bottom E line + 0 = open low E.',
          notes:seq([[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]])
        },
        {
          id:'fret-numbers', title:'Numbers = Frets', short:'0, 3 and 5', bpm:60,
          tag:'TAB DECODER', headline:'The number tells you the fret',
          lesson:'A 3 means hold the 3rd fret on that string. A 5 means the 5th fret. Read the number on the falling block and the matching tab column.',
          hint:'Number = fret. 0 = open.',
          notes:seq([[0,0],[0,3],[0,0],[0,5],[0,3],[0,0],[0,3],[0,5]])
        },
        {
          id:'a-string', title:'Meet the A String', short:'Move one string', bpm:60,
          tag:'TAB DECODER', headline:'Each tab line is a different string',
          lesson:'The A line is the next string up from the bottom E line. Same rule: 0 is open, 2 means 2nd fret, 3 means 3rd fret.',
          hint:'Watch the A line light up in the live tab.',
          notes:seq([[1,0],[1,2],[1,3],[1,2],[1,0],[1,3],[1,2],[1,0]])
        },
        {
          id:'string-jump', title:'String Jump', short:'E ↔ A', bpm:64,
          tag:'TAB DECODER', headline:'Follow the line AND the number',
          lesson:'Now the notes move between the low E and A strings. First find the string, then play the fret number.',
          hint:'Lane tells you the string. Number tells you the fret.',
          notes:seq([[0,0],[1,0],[0,3],[1,2],[0,5],[1,3],[0,3],[1,2],[0,0]])
        },
        {
          id:'first-riff', title:'First Riff', short:'Read a real pattern', bpm:68,
          tag:'WORLD 1 BOSS', headline:'You are reading tab now',
          lesson:'No new rule here. Read the string and fret, keep the beat, and try to finish with a combo.',
          hint:'Don’t stare at your hands — glance down only when you need to.',
          notes:seq([[0,0],[0,0],[0,3],[0,0],[0,5],[0,3],[1,0],[1,2],[0,3],[0,0],[1,3],[1,2]])
        }
      ]
    },
    {
      id:'riff-runner', number:2, title:'Riff Runner', subtitle:'Timing, string changes and faster reactions',
      levels:[
        {
          id:'d-string', title:'Add the D String', short:'Three strings', bpm:68,
          tag:'RIFF RUNNER', headline:'Third string unlocked',
          lesson:'The D string is string 4. Watch how its tab line sits above A and low E.',
          hint:'Low E → A → D climbs upward in tab.',
          notes:seq([[0,0],[1,0],[2,0],[1,2],[2,2],[1,3],[0,3],[2,0],[1,2],[0,0]])
        },
        {
          id:'steady-eights', title:'Steady Eighths', short:'Quicker picking', bpm:72,
          tag:'RHYTHM', headline:'Two notes per beat',
          lesson:'The blocks are closer together now. Use small pick movements and try alternate down-up picking.',
          hint:'Stay relaxed. Speed comes from smaller movement.',
          notes:seq([[0,0],[0,0],[0,3],[0,3],[1,0],[1,0],[1,2],[1,2],[0,5],[0,5],[0,3],[0,3]],1,.5)
        },
        {
          id:'three-string-riff', title:'Three-String Riff', short:'E, A and D', bpm:74,
          tag:'RIFF RUNNER', headline:'Track the lane changes',
          lesson:'The notes can jump across three strings. Read ahead by one block instead of waiting until the note reaches the line.',
          hint:'Eyes ahead, hands follow.',
          notes:seq([[0,0],[1,2],[2,2],[1,0],[0,3],[1,3],[2,0],[1,2],[0,5],[2,2],[1,0],[0,3]])
        },
        {
          id:'speed-run', title:'Speed Run', short:'80 BPM', bpm:80,
          tag:'SPEED RUN', headline:'Same rules, less time',
          lesson:'Nothing new to memorize. This level is about recognizing tab quickly and hitting the right note on time.',
          hint:'If it falls apart, retry until 75% feels easy.',
          notes:seq([[0,0],[0,3],[1,0],[1,2],[0,5],[1,3],[2,0],[2,2],[1,2],[0,3],[0,0],[1,0],[2,2],[1,3]])
        },
        {
          id:'garage-boss', title:'Garage Boss', short:'Long riff', bpm:82,
          tag:'WORLD 2 BOSS', headline:'Put the pieces together',
          lesson:'Longer pattern, faster tempo, three strings. Build the combo instead of chasing a perfect score.',
          hint:'A clean 80% is better than a frantic 100% attempt.',
          notes:seq([[0,0],[0,0],[0,3],[1,0],[1,2],[0,5],[0,3],[1,3],[2,0],[2,2],[1,2],[0,3],[0,0],[1,0],[1,3],[2,2],[1,2],[0,5]])
        }
      ]
    },
    {
      id:'fretboard-explorer', number:3, title:'Fretboard Explorer', subtitle:'Use all six strings and higher notes',
      levels:[
        {
          id:'g-string', title:'G String', short:'String 3', bpm:70,
          tag:'FRETBOARD EXPLORER', headline:'Meet the G string',
          lesson:'The G line is the third line from the top in normal tab. Play open, 2nd and 4th fret.',
          hint:'G string = string 3.',
          notes:seq([[3,0],[3,2],[3,4],[3,2],[3,0],[3,4],[3,2],[3,0]])
        },
        {
          id:'b-string', title:'B String', short:'String 2', bpm:70,
          tag:'FRETBOARD EXPLORER', headline:'One string from the top',
          lesson:'The B string is the second-thinnest string. In tab it is the second line from the top.',
          hint:'B line is directly under high e.',
          notes:seq([[4,0],[4,1],[4,3],[4,1],[4,0],[4,3],[4,1],[4,0]])
        },
        {
          id:'high-e', title:'High e', short:'String 1', bpm:70,
          tag:'FRETBOARD EXPLORER', headline:'The TOP tab line',
          lesson:'The top line in tab is the thinnest high-e string. That is why tab can look upside down at first.',
          hint:'Top tab line = thinnest string.',
          notes:seq([[5,0],[5,1],[5,3],[5,5],[5,3],[5,1],[5,0],[5,3]])
        },
        {
          id:'six-string-scan', title:'Six-String Scan', short:'All strings', bpm:74,
          tag:'FRETBOARD EXPLORER', headline:'Read the whole tab staff',
          lesson:'Every string is now in play. The falling highway and live tab show the same note in two different ways.',
          hint:'Use the tab to understand; use the highway to react.',
          notes:seq([[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[5,3],[4,3],[3,2],[2,2],[1,2],[0,3]])
        },
        {
          id:'tab-boss', title:'Tab Boss', short:'All six strings', bpm:78,
          tag:'WORLD 3 BOSS', headline:'You can read beginner tab',
          lesson:'This final starter mission uses all six strings. One star means you have the basics needed to start learning simple songs.',
          hint:'Read ahead and keep moving after a miss.',
          notes:seq([[0,0],[1,2],[2,2],[3,0],[4,1],[5,0],[5,3],[4,3],[3,2],[2,0],[1,3],[0,3],[2,2],[4,1],[5,0],[3,0]])
        }
      ]
    }
  ];

  const flatLevels = worlds.flatMap(w => w.levels.map((l, i) => ({ ...l, worldId:w.id, worldNumber:w.number, worldTitle:w.title, worldIndex:worlds.indexOf(w), levelIndex:i })));

  const achievements = [
    { icon:'🎸', title:'First Note', text:'Hit your first note', test:s => s.totalHits >= 1 },
    { icon:'⭐', title:'First Star', text:'Earn your first mission star', test:s => totalStars(s) >= 1 },
    { icon:'🔥', title:'On Fire', text:'Reach a 10-note combo', test:s => s.bestCombo >= 10 },
    { icon:'🎯', title:'Bullseye', text:'Finish a mission at 90%+', test:s => s.bestAccuracy >= 90 },
    { icon:'🏁', title:'Tab Decoder', text:'Clear World 1', test:s => worldCleared(0, s) },
    { icon:'⚡', title:'Riff Runner', text:'Clear World 2', test:s => worldCleared(1, s) },
    { icon:'🗺️', title:'Fretboard Explorer', text:'Clear World 3', test:s => worldCleared(2, s) },
    { icon:'💯', title:'Century Club', text:'Hit 100 notes', test:s => s.totalHits >= 100 }
  ];

  let state = loadProgress();
  let dbPromise = null;
  let currentSong = null;
  let alphaApi = null;
  let loadedSongScore = null;
  let loadedSongTracks = [];
  let songLevelSpec = null;
  let alphaPlayerReady = false;
  let mutedBackingTrack = null;
  let deferredInstallPrompt = null;
  let metronomeTimer = null;
  let metronomeBeat = 0;
  let bpm = 80;
  let tunerActive = false;
  let selectedDeviceId = '';
  let game = null;
  let feedbackTimer = null;
  let tabCurrentIndex = -1;
  let inputChallengeHits = new Set();

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const audio = createAudioEngine();

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // Always boot into the normal app shell; CSS also honors [hidden].
    $('#gameScreen').hidden = true;
    $('#resultScreen').hidden = true;
    bindNavigation();
    bindGameControls();
    bindInput();
    bindSongImport();
    bindMetronome();
    bindTuner();
    bindProgress();
    bindPwaInstall();
    renderWorldMap();
    renderChords();
    renderInputChallenges();
    updateStats();
    refreshSongs();
    updateNetworkBadge();
    registerServiceWorker();
    audio.subscribe(handleAudioFrame);
  }

  function defaultState() {
    return { xp:0, stars:{}, songBest:{}, totalHits:0, totalMisses:0, bestCombo:0, bestAccuracy:0, practiceSeconds:0, practiceDays:{}, missionsPlayed:0, songRuns:0 };
  }

  function loadProgress() {
    const base = defaultState();
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY));
      if (saved && typeof saved === 'object') return { ...base, ...saved, stars:saved.stars || {}, songBest:saved.songBest || {}, practiceDays:saved.practiceDays || {} };
    } catch {}
    try {
      const old = JSON.parse(localStorage.getItem(OLD_PROGRESS_KEY));
      if (old) {
        base.practiceSeconds = Number(old.practiceMinutes || 0) * 60;
        base.practiceDays = old.practiceDays || {};
      }
    } catch {}
    return base;
  }

  function saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
    updateStats();
  }

  function bindNavigation() {
    $$('[data-view-target]').forEach(el => el.addEventListener('click', () => showView(el.dataset.viewTarget)));
  }

  function showView(name) {
    if (!name) return;
    $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
    $$('.nav-button').forEach(b => b.classList.toggle('active', b.dataset.viewTarget === name));
    window.scrollTo({ top:0, behavior:'smooth' });
    if (name === 'progress') renderAchievements();
  }

  function renderWorldMap() {
    const map = $('#worldMap');
    map.innerHTML = worlds.map((world, wi) => {
      const missionCards = world.levels.map(level => {
        const flatIndex = flatLevels.findIndex(l => l.id === level.id);
        const unlocked = isLevelUnlocked(flatIndex);
        const stars = Number(state.stars[level.id] || 0);
        const current = flatIndex === nextLevelIndex();
        return `<button class="mission-card ${stars ? 'complete' : ''} ${current ? 'current' : ''}" data-level-id="${level.id}" ${unlocked ? '' : 'disabled'}>
          <span class="mission-num">MISSION ${flatIndex + 1}</span>
          <strong>${escapeHtml(level.title)}</strong>
          <small>${escapeHtml(level.short)}</small>
          <span class="mission-stars">${starsText(stars)}</span>
        </button>`;
      }).join('');
      return `<section class="world ${wi > 0 && !isLevelUnlocked(worldStartIndex(wi)) ? 'locked-world' : ''}">
        <div class="world-head"><div><p class="eyebrow">WORLD ${world.number}</p><h3>${escapeHtml(world.title)}</h3><span>${escapeHtml(world.subtitle)}</span></div><span>${worldStars(wi)} / ${world.levels.length * 3} stars</span></div>
        <div class="mission-row">${missionCards}</div>
      </section>`;
    }).join('');
    $$('[data-level-id]', map).forEach(btn => btn.addEventListener('click', () => launchLevel(btn.dataset.levelId)));
  }

  function worldStartIndex(worldIndex) {
    let n = 0;
    for (let i = 0; i < worldIndex; i++) n += worlds[i].levels.length;
    return n;
  }

  function isLevelUnlocked(index) {
    if (index <= 0) return true;
    const prev = flatLevels[index - 1];
    return Number(state.stars[prev.id] || 0) >= 1;
  }

  function nextLevelIndex() {
    const idx = flatLevels.findIndex((level, i) => isLevelUnlocked(i) && Number(state.stars[level.id] || 0) < 1);
    return idx >= 0 ? idx : flatLevels.length - 1;
  }

  function worldStars(worldIndex) {
    return worlds[worldIndex].levels.reduce((n, l) => n + Number(state.stars[l.id] || 0), 0);
  }

  function totalStars(s = state) {
    return Object.values(s.stars || {}).reduce((n, v) => n + Number(v || 0), 0);
  }

  function worldCleared(worldIndex, s = state) {
    return worlds[worldIndex].levels.every(l => Number(s.stars?.[l.id] || 0) >= 1);
  }

  function starsText(n) {
    return `${'★'.repeat(n)}${'☆'.repeat(3 - n)}`;
  }

  function bindGameControls() {
    $('#continueMission').addEventListener('click', () => launchLevel(flatLevels[nextLevelIndex()].id));
    $('#exitGame').addEventListener('click', exitGame);
    $('#gameStart').addEventListener('click', startMission);
    $('#gamePause').addEventListener('click', togglePause);
    $('#retryLevel').addEventListener('click', () => {
      $('#resultScreen').hidden = true;
      if (game?.mode === 'song' && game.level) launchLevel(game.level);
      else launchLevel(game?.level?.id || flatLevels[nextLevelIndex()].id);
    });
    $('#nextLevel').addEventListener('click', () => {
      $('#resultScreen').hidden = true;
      if (game?.mode === 'song') {
        launchNextSongSection();
        return;
      }
      const currentIndex = game ? flatLevels.findIndex(l => l.id === game.level.id) : nextLevelIndex();
      const next = Math.min(flatLevels.length - 1, currentIndex + 1);
      launchLevel(flatLevels[next].id);
    });
    $('#backToMap').addEventListener('click', () => {
      $('#resultScreen').hidden = true;
      $('#gameScreen').hidden = true;
      if (game?.mode === 'song') {
        showView('songs');
      } else {
        renderWorldMap();
        showView('play');
      }
    });
  }

  function launchLevel(levelOrId) {
    const isSongLevel = levelOrId && typeof levelOrId === 'object';
    const level = isSongLevel ? levelOrId : flatLevels.find(l => l.id === levelOrId);
    if (!level) return;
    if (!isSongLevel && !isLevelUnlocked(flatLevels.findIndex(l => l.id === level.id))) {
      toast('Earn a star on the previous mission first.');
      return;
    }
    stopGameLoop();
    const stringInfo = level.stringInfo || STRING_INFO;
    const secondsPerBeat = 60 / Math.max(20, Number(level.bpm) || 80);
    const events = level.notes.map((n, i) => ({
      ...n,
      index:i,
      time:Number.isFinite(n.time) ? n.time : n.beat * secondsPerBeat,
      clock:level.mode === 'song' && level.songSpec?.backingEnabled && Number.isFinite(n.tick)
        ? n.tick - Number(level.sectionStartTick || 0)
        : (Number.isFinite(n.time) ? n.time : n.beat * secondsPerBeat),
      midi:Number.isFinite(n.midi) ? n.midi : (stringInfo[n.string]?.openMidi ?? STRING_INFO[n.string]?.openMidi ?? 40) + n.fret,
      status:'pending',
      element:null
    })).sort((a,b) => a.clock - b.clock).map((e, i) => ({ ...e, index:i }));
    if (!events.length) {
      toast('This section has no playable guitar notes.');
      return;
    }
    game = {
      mode:level.mode || 'mission',
      level,
      stringInfo,
      events,
      running:false,
      paused:false,
      startPerf:0,
      songClockTick:0,
      songTempo:Number(level.bpm) || 80,
      pausedAt:0,
      raf:0,
      hits:0,
      misses:0,
      combo:0,
      bestCombo:0,
      score:0,
      lastAcceptedPitchClass:null,
      lastAcceptedEvent:-1,
      startedAtDate:Date.now(),
      endTime:(events.at(-1)?.time || 0) + 1.2,
      endClock:Number(level.sectionEndTick) > Number(level.sectionStartTick)
        ? Number(level.sectionEndTick) - Number(level.sectionStartTick)
        : null
    };
    tabCurrentIndex = -1;
    $('#gameScreen').hidden = false;
    $('#resultScreen').hidden = true;
    $('#gameStart').hidden = false;
    $('#resultEyebrow').textContent = game.mode === 'song' ? 'SONG SECTION COMPLETE' : 'MISSION COMPLETE';
    $('#backToMap').textContent = game.mode === 'song' ? 'Back to Song' : 'Mission Map';
    $('#gameWorldLabel').textContent = game.mode === 'song'
      ? `SONG LEVEL · ${String(level.trackName || 'GUITAR').toUpperCase()}`
      : `WORLD ${level.worldNumber} · ${level.worldTitle.toUpperCase()}`;
    $('#gameLevelTitle').textContent = level.title;
    $('#gameLessonTag').textContent = level.tag;
    $('#gameLessonHeadline').textContent = level.headline;
    $('#gameLessonText').textContent = level.lesson;
    $('#tabHint').textContent = level.hint;
    $('#gameStart').textContent = audio.active ? (game.mode === 'song' ? 'Start Song Level' : 'Start Mission') : 'Enable Guitar & Start';
    $('#gameStart').disabled = false;
    $('#gamePause').disabled = true;
    $('#gamePause').textContent = 'Pause';
    $('#gameScore').textContent = '0';
    $('#gameAccuracy').textContent = '100%';
    $('#gameCombo').textContent = '0';
    $('#gameHearing').textContent = audio.lastResult?.note || '—';
    $('#nextNoteText').textContent = formatExpected(events[0]);
    $('#gameProgressBar').style.width = '0%';
    renderStringLabels();
    renderLiveTab();
    renderGameNotes();
    updateGameBoard(0);
  }

  async function startMission() {
    if (!game || game.running) return;
    $('#gameStart').disabled = true;
    $('#gameStart').textContent = 'Getting input…';
    try {
      if (!audio.active) await startAudioInput(selectedDeviceId);
      await runCountdown();
      if (usesSongBackingClock()) {
        configureSongBacking(game.level);
        if (!alphaApi.play()) throw new Error('Backing player is not ready yet.');
      }
      game.running = true;
      game.startPerf = performance.now();
      game.paused = false;
      $('#gameStart').hidden = true;
      $('#gamePause').disabled = false;
      game.raf = requestAnimationFrame(gameLoop);
    } catch (err) {
      console.error(err);
      $('#gameStart').disabled = false;
      $('#gameStart').textContent = 'Try Guitar Input Again';
      toast('I could not access the guitar input. Check Chrome microphone permission.');
    }
  }

  function runCountdown() {
    return new Promise(resolve => {
      const el = $('#countdown');
      el.hidden = false;
      const steps = ['3','2','1','GO!'];
      let i = 0;
      el.textContent = steps[i];
      clickSound(true);
      const timer = setInterval(() => {
        i++;
        if (i >= steps.length) {
          clearInterval(timer);
          el.hidden = true;
          resolve();
          return;
        }
        el.textContent = steps[i];
        clickSound(i === steps.length - 1);
      }, 650);
    });
  }

  function gameLoop(now) {
    if (!game?.running) return;
    if (game.paused) {
      game.raf = requestAnimationFrame(gameLoop);
      return;
    }
    const t = currentGameClock(now);
    updateGameBoard(t);
    markExpiredNotes(t);
    updateCurrentTab(t);
    const total = game.events.length;
    const done = game.hits + game.misses;
    $('#gameProgressBar').style.width = `${Math.min(100, (done / total) * 100)}%`;
    const endClock = usesSongBackingClock() ? (game.endClock ?? game.events.at(-1)?.clock) : game.endTime;
    if (t >= endClock && done >= total) {
      finishMission();
      return;
    }
    game.raf = requestAnimationFrame(gameLoop);
  }

  function updateGameBoard(t) {
    if (!game) return;
    const board = $('#gameBoard');
    const rect = board.getBoundingClientRect();
    const hitY = rect.height - 72;
    const spawnY = -28;
    const laneWidth = rect.width / 6;
    game.events.forEach(ev => {
      const dt = ev.clock - t;
      const el = ev.element;
      if (!el) return;
      const clock = gameClockWindows();
      const inRange = dt <= clock.lookahead && dt >= -clock.expired;
      el.hidden = !inRange;
      if (!inRange) return;
      const progress = 1 - dt / clock.lookahead;
      const y = spawnY + progress * (hitY - spawnY);
      const x = laneWidth * (ev.string + .5);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    });
    const next = game.events.find(e => e.status === 'pending');
    $('#nextNoteText').textContent = next ? formatExpected(next) : 'Finish strong!';
  }

  function markExpiredNotes(t) {
    game.events.forEach(ev => {
      if (ev.status === 'pending' && t > ev.clock + gameClockWindows().hit) markMiss(ev);
    });
  }

  function updateCurrentTab(t) {
    if (!game) return;
    let closest = -1;
    let closestDelta = Infinity;
    game.events.forEach(ev => {
      if (ev.status !== 'pending') return;
      const d = Math.abs(ev.clock - t);
      if (d < closestDelta) { closestDelta = d; closest = ev.index; }
    });
    if (closest === tabCurrentIndex) return;
    tabCurrentIndex = closest;
    $$('.tab-cell.current', $('#liveTab')).forEach(c => c.classList.remove('current'));
    if (closest >= 0) {
      $$(`[data-tab-col="${closest}"]`, $('#liveTab')).forEach(c => c.classList.add('current'));
      const target = $(`[data-tab-col="${closest}"]`, $('#liveTab'));
      target?.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
    }
  }

  function renderStringLabels() {
    const info = game?.stringInfo || STRING_INFO;
    const wrap = $('#stringLabels');
    if (!wrap) return;
    wrap.innerHTML = info.map((s, i) => {
      const number = info.length - i;
      const edge = i === 0 ? ' thick' : i === info.length - 1 ? ' thin' : '';
      return `<span>${escapeHtml(s.label)}<small>${number}${edge}</small></span>`;
    }).join('');
  }

  function renderGameNotes() {
    const layer = $('#noteLayer');
    layer.innerHTML = '';
    game.events.forEach(ev => {
      const el = document.createElement('div');
      el.className = `falling-note s${6 - ev.string}`;
      el.textContent = ev.fret;
      el.hidden = true;
      el.dataset.eventIndex = ev.index;
      layer.appendChild(el);
      ev.element = el;
    });
  }

  function renderLiveTab() {
    const wrap = $('#liveTab');
    const info = game?.stringInfo || STRING_INFO;
    const rows = Array.from({ length:info.length }, (_, i) => info.length - 1 - i);
    wrap.innerHTML = `<div class="tab-grid" style="--tab-cols:${game.events.length}">${rows.map(stringIndex => {
      const label = info[stringIndex]?.label || `S${info.length - stringIndex}`;
      const cells = game.events.map(ev => {
        const isNote = ev.string === stringIndex;
        return `<span class="tab-cell ${isNote ? 'note' : ''}" data-tab-col="${ev.index}" data-tab-event="${ev.index}">${isNote ? ev.fret : '—'}</span>`;
      }).join('');
      return `<div class="tab-row"><span class="tab-row-label">${escapeHtml(label)}</span>${cells}</div>`;
    }).join('')}</div>`;
  }

  function updateTabEvent(ev) {
    $$(`[data-tab-event="${ev.index}"]`, $('#liveTab')).forEach(c => c.classList.add(ev.status));
  }

  function handleAudioFrame(result) {
    updateInputMonitor(result);
    if (tunerActive) updateTuner(result);
    if (!game?.running || game.paused || !result.freq) return;
    $('#gameHearing').textContent = result.note || '—';
    const t = currentGameClock(performance.now());
    const hitWindow = gameClockWindows().hit;
    const candidates = game.events
      .filter(ev => ev.status === 'pending' && Math.abs(ev.clock - t) <= hitWindow && pitchMatches(result.freq, midiToFreq(ev.midi)))
      .sort((a,b) => Math.abs(a.clock - t) - Math.abs(b.clock - t));
    if (!candidates.length) return;
    const ev = candidates[0];
    const pitchClass = ev.midi % 12;
    const repeatedPitch = game.lastAcceptedPitchClass === pitchClass;
    if (repeatedPitch && !result.onset) return;
    markHit(ev, t);
    game.lastAcceptedPitchClass = pitchClass;
    game.lastAcceptedEvent = ev.index;
  }

  function markHit(ev, t) {
    if (ev.status !== 'pending') return;
    ev.status = 'hit';
    game.hits++;
    game.combo++;
    game.bestCombo = Math.max(game.bestCombo, game.combo);
    const timing = Math.abs(ev.clock - t) / gameClockWindows().unitsPerSecond;
    const timingBonus = timing < .12 ? 60 : timing < .24 ? 30 : 0;
    game.score += 100 + timingBonus + Math.min(100, game.combo * 4);
    ev.element?.classList.add('hit');
    updateTabEvent(ev);
    showGameFeedback(timing < .12 ? 'PERFECT!' : 'HIT!', 'hit');
    updateGameHud();
  }

  function markMiss(ev) {
    if (ev.status !== 'pending') return;
    ev.status = 'miss';
    game.misses++;
    game.combo = 0;
    ev.element?.classList.add('miss');
    updateTabEvent(ev);
    showGameFeedback('MISS', 'miss');
    updateGameHud();
  }

  function updateGameHud() {
    const attempts = game.hits + game.misses;
    const accuracy = attempts ? Math.round(game.hits / attempts * 100) : 100;
    $('#gameScore').textContent = game.score.toLocaleString();
    $('#gameCombo').textContent = game.combo;
    $('#gameAccuracy').textContent = `${accuracy}%`;
  }

  function showGameFeedback(text, type) {
    const el = $('#gameFeedback');
    clearTimeout(feedbackTimer);
    el.textContent = text;
    el.className = `game-feedback show ${type}`;
    feedbackTimer = setTimeout(() => { el.className = 'game-feedback'; }, 350);
  }

  function finishMission() {
    if (!game) return;
    stopGameLoop();
    const total = game.events.length;
    const accuracy = total ? Math.round(game.hits / total * 100) : 0;
    const stars = accuracy >= 90 ? 3 : accuracy >= 75 ? 2 : accuracy >= 55 ? 1 : 0;
    const isSong = game.mode === 'song';
    if (isSong) {
      const key = game.level.songKey || `${game.level.songId || 'song'}:${game.level.trackIndex || 0}:${game.level.songSpec?.startBar || 0}`;
      const previous = state.songBest[key] || { stars:0, accuracy:0 };
      state.songBest[key] = { stars:Math.max(previous.stars || 0, stars), accuracy:Math.max(previous.accuracy || 0, accuracy) };
      state.songRuns++;
    } else {
      const oldStars = Number(state.stars[game.level.id] || 0);
      state.stars[game.level.id] = Math.max(oldStars, stars);
      state.missionsPlayed++;
    }
    state.totalHits += game.hits;
    state.totalMisses += game.misses;
    state.bestCombo = Math.max(state.bestCombo, game.bestCombo);
    state.bestAccuracy = Math.max(state.bestAccuracy, accuracy);
    const elapsed = Math.max(0, (Date.now() - game.startedAtDate) / 1000);
    state.practiceSeconds += Math.min(900, elapsed);
    state.practiceDays[new Date().toISOString().slice(0,10)] = true;
    const xpEarned = Math.round(game.hits * 7 + stars * 40 + game.bestCombo * 2);
    state.xp += xpEarned;
    saveProgress();
    if (!isSong) renderWorldMap();

    $('#gameScreen').hidden = true;
    $('#resultScreen').hidden = false;
    $('#resultStars').textContent = starsText(stars);
    $('#resultAccuracy').textContent = `${accuracy}%`;
    $('#resultCombo').textContent = game.bestCombo;
    $('#resultXp').textContent = `+${xpEarned}`;
    if (isSong) {
      $('#resultTitle').textContent = stars === 3 ? 'Section crushed!' : stars === 2 ? 'Nice run!' : stars === 1 ? 'Section cleared!' : 'Run it again!';
      $('#resultMessage').textContent = stars ? 'That section is now scored. Retry it for more stars or move on to the next chunk.' : 'Slow it down or retry this section until the notes start to feel automatic.';
      const spec = game.level.songSpec;
      const hasNext = Boolean(spec && spec.endBar < spec.totalBars);
      $('#nextLevel').hidden = !hasNext;
      $('#nextLevel').textContent = 'Next Section ▶';
    } else {
      $('#resultTitle').textContent = stars === 3 ? 'Crushed it!' : stars === 2 ? 'Nice run!' : stars === 1 ? 'Mission cleared!' : 'Almost there!';
      $('#resultMessage').textContent = stars ? 'You unlocked the next mission. Retry anytime to chase more stars.' : 'Get to 55% accuracy to earn the first star and unlock the next mission.';
      const currentIndex = flatLevels.findIndex(l => l.id === game.level.id);
      const atEnd = currentIndex >= flatLevels.length - 1;
      $('#nextLevel').hidden = atEnd || stars < 1;
      $('#nextLevel').textContent = 'Next Mission ▶';
    }
  }

  function togglePause() {
    if (!game?.running) return;
    if (!game.paused) {
      game.paused = true;
      game.pausedAt = performance.now();
      if (usesSongBackingClock()) alphaApi?.pause();
      $('#gamePause').textContent = 'Resume';
      showGameFeedback('PAUSED', 'hit');
    } else {
      game.startPerf += performance.now() - game.pausedAt;
      game.paused = false;
      if (usesSongBackingClock()) alphaApi?.play();
      $('#gamePause').textContent = 'Pause';
    }
  }

  function exitGame() {
    const returnToSongs = game?.mode === 'song';
    stopGameLoop();
    $('#gameScreen').hidden = true;
    $('#resultScreen').hidden = true;
    $('#gameStart').hidden = false;
    showView(returnToSongs ? 'songs' : 'play');
  }

  function stopGameLoop() {
    if (game?.raf) cancelAnimationFrame(game.raf);
    if (game?.mode === 'song') releaseSongBacking();
    if (game) { game.running = false; game.paused = false; game.raf = 0; }
  }

  function releaseSongBacking() {
    alphaApi?.stop?.();
    if (mutedBackingTrack && alphaApi) {
      alphaApi.changeTrackMute([mutedBackingTrack], false);
      mutedBackingTrack = null;
    }
    if (alphaApi) alphaApi.playbackRange = null;
  }

  function usesSongBackingClock() {
    return Boolean(game?.mode === 'song' && game.level?.songSpec?.backingEnabled && alphaApi);
  }

  function currentGameClock(now = performance.now()) {
    if (!game) return 0;
    return usesSongBackingClock() ? game.songClockTick : (now - game.startPerf) / 1000;
  }

  function gameClockWindows() {
    if (!usesSongBackingClock()) {
      return { lookahead:NOTE_LOOKAHEAD, hit:HIT_WINDOW, expired:.75, unitsPerSecond:1 };
    }
    const unitsPerSecond = 960 * Math.max(20, Number(game.songTempo) || 80) / 60;
    return {
      lookahead:NOTE_LOOKAHEAD * unitsPerSecond,
      hit:HIT_WINDOW * unitsPerSecond,
      expired:.75 * unitsPerSecond,
      unitsPerSecond
    };
  }

  function configureSongBacking(level) {
    if (!alphaApi || !alphaPlayerReady) throw new Error('Backing instruments are still loading.');
    if (mutedBackingTrack) {
      alphaApi.changeTrackMute([mutedBackingTrack], false);
      mutedBackingTrack = null;
    }
    const selectedTrack = loadedSongScore?.tracks?.[level.trackIndex];
    if (selectedTrack) {
      alphaApi.changeTrackMute([selectedTrack], true);
      mutedBackingTrack = selectedTrack;
    }
    alphaApi.playbackSpeed = Number(level.songSpec?.speed) || 1;
    alphaApi.masterVolume = Number(level.songSpec?.backingVolume ?? .8);
    alphaApi.playbackRange = {
      startTick:Number(level.sectionStartTick) || 0,
      endTick:Number(level.sectionEndTick) || Number(level.sectionStartTick) + 960
    };
    alphaApi.tickPosition = Number(level.sectionStartTick) || 0;
    game.songClockTick = 0;
  }

  function formatExpected(ev) {
    if (!ev) return '—';
    const info = game?.stringInfo || STRING_INFO;
    const s = info[ev.string] || STRING_INFO[ev.string] || { name:`String ${6 - ev.string}` };
    return `${s.name} · fret ${ev.fret} · ${midiToName(ev.midi)}`;
  }

  function bindInput() {
    $('#inputToggle').addEventListener('click', async () => {
      if (audio.active) {
        audio.stop();
        updateInputButtons();
        return;
      }
      try { await startAudioInput(selectedDeviceId); } catch (err) { console.error(err); toast('Microphone/input permission was blocked.'); }
    });
    $('#audioDeviceSelect').addEventListener('change', async e => {
      selectedDeviceId = e.target.value;
      if (audio.active) {
        try { await startAudioInput(selectedDeviceId); } catch (err) { console.error(err); toast('Could not switch input device.'); }
      }
    });
    $('#noiseGate').addEventListener('input', e => {
      audio.noiseGate = Number(e.target.value);
      const v = audio.noiseGate;
      $('#noiseGateText').textContent = v < .012 ? 'Very sensitive' : v < .025 ? 'Normal' : v < .045 ? 'Less sensitive' : 'High noise room';
    });
  }

  async function startAudioInput(deviceId = '') {
    await audio.start(deviceId);
    selectedDeviceId = audio.deviceId || deviceId || '';
    await refreshAudioDevices();
    updateInputButtons();
  }

  async function refreshAudioDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audioinput');
    const select = $('#audioDeviceSelect');
    select.innerHTML = devices.map((d, i) => `<option value="${escapeHtml(d.deviceId)}">${escapeHtml(d.label || `Audio input ${i + 1}`)}</option>`).join('');
    select.disabled = devices.length <= 1;
    if (selectedDeviceId && devices.some(d => d.deviceId === selectedDeviceId)) select.value = selectedDeviceId;
  }

  function updateInputButtons() {
    $('#inputToggle').textContent = audio.active ? 'Stop Listening' : 'Enable Guitar Input';
    $('#gameStart')?.classList.toggle('input-ready', audio.active);
  }

  function renderInputChallenges() {
    $('#inputChallenges').innerHTML = STRING_INFO.map((s, i) => `<div class="input-challenge" data-input-challenge="${i}"><strong>${s.label}${Math.floor(s.openMidi / 12) - 1}</strong><span>${s.name} · open</span></div>`).join('');
  }

  function updateInputMonitor(result) {
    const signal = Math.min(100, Math.max(0, result.rms * 1500));
    $('#signalBar').style.width = `${signal}%`;
    if (!audio.active) {
      $('#inputNote').textContent = '—';
      $('#inputFreq').textContent = 'Play one string';
      $('#inputAccuracy').textContent = 'Input is off';
      $('#inputAccuracy').className = 'input-status';
      return;
    }
    if (!result.freq) {
      $('#inputNote').textContent = '…';
      $('#inputFreq').textContent = 'Listening';
      $('#inputAccuracy').textContent = result.rms > audio.noiseGate ? 'Finding pitch…' : 'Play a clean single note';
      $('#inputAccuracy').className = 'input-status';
      return;
    }
    $('#inputNote').textContent = result.note;
    $('#inputFreq').textContent = `${result.freq.toFixed(1)} Hz`;
    $('#inputAccuracy').textContent = result.onset ? 'Attack detected ✓' : 'Signal locked';
    $('#inputAccuracy').className = 'input-status good';
    STRING_INFO.forEach((s, i) => {
      const f = midiToFreq(s.openMidi);
      if (exactOrHarmonicMatch(result.freq, f)) {
        inputChallengeHits.add(i);
        $(`[data-input-challenge="${i}"]`)?.classList.add('hit');
      }
    });
  }

  function bindTuner() {
    $('#tunerToggle').addEventListener('click', async () => {
      if (!tunerActive) {
        try {
          if (!audio.active) await startAudioInput(selectedDeviceId);
          tunerActive = true;
          $('#tunerToggle').textContent = 'Stop Tuner';
        } catch (err) { console.error(err); toast('Could not access the guitar input.'); }
      } else {
        tunerActive = false;
        $('#tunerToggle').textContent = 'Start Tuner';
        $('#tunerMessage').textContent = 'Tuner is off.';
      }
    });
  }

  function updateTuner(result) {
    if (!result.freq) {
      $('#tunerMessage').textContent = 'Play one string clearly.';
      return;
    }
    const midi = 69 + 12 * Math.log2(result.freq / 440);
    const nearest = Math.round(midi);
    const cents = (midi - nearest) * 100;
    const name = NOTE_NAMES[(nearest % 12 + 12) % 12];
    const octave = Math.floor(nearest / 12) - 1;
    $('#tunerNote').textContent = name;
    $('#tunerOctave').textContent = octave;
    $('#tunerFrequency').textContent = `${result.freq.toFixed(1)} Hz`;
    $('#tunerNeedle').style.left = `${50 + Math.max(-50, Math.min(50, cents))}%`;
    $('#tunerMessage').textContent = Math.abs(cents) < 5 ? 'In tune ✓' : cents < 0 ? `${Math.abs(cents).toFixed(0)} cents flat` : `${Math.abs(cents).toFixed(0)} cents sharp`;
  }

  function createAudioEngine() {
    const listeners = new Set();
    return {
      context:null, stream:null, source:null, analyser:null, buffer:null, active:false, raf:0, lastTick:0,
      lastResult:{ freq:null, rms:0, note:'—', onset:false, midi:null }, envelope:0, lastMidi:null, noiseGate:.018, deviceId:'',
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      async ensureContext() {
        if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
        if (this.context.state === 'suspended') await this.context.resume();
        return this.context;
      },
      async start(deviceId = '') {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Audio input is not supported in this browser.');
        this.stop(false);
        const constraints = { audio:{ echoCancellation:false, noiseSuppression:false, autoGainControl:false, channelCount:1 } };
        if (deviceId) constraints.audio.deviceId = { exact:deviceId };
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.deviceId = this.stream.getAudioTracks()[0]?.getSettings()?.deviceId || deviceId || '';
        const ctx = await this.ensureContext();
        this.source = ctx.createMediaStreamSource(this.stream);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0;
        this.buffer = new Float32Array(this.analyser.fftSize);
        this.source.connect(this.analyser);
        this.active = true;
        this.envelope = 0;
        this.lastMidi = null;
        const tick = now => {
          if (!this.active) return;
          if (now - this.lastTick >= 42) {
            this.lastTick = now;
            this.analyser.getFloatTimeDomainData(this.buffer);
            const raw = autoCorrelate(this.buffer, ctx.sampleRate, this.noiseGate);
            const prevEnvelope = this.envelope;
            this.envelope = prevEnvelope * .82 + raw.rms * .18;
            const onset = raw.rms > this.noiseGate && raw.rms > Math.max(this.noiseGate * 1.4, prevEnvelope * 1.38);
            let result = { freq:raw.freq, rms:raw.rms, onset, note:'—', midi:null };
            if (raw.freq) {
              const midiFloat = 69 + 12 * Math.log2(raw.freq / 440);
              const midi = Math.round(midiFloat);
              result.midi = midi;
              result.note = midiToName(midi);
            }
            this.lastResult = result;
            listeners.forEach(fn => { try { fn(result); } catch (err) { console.error(err); } });
          }
          this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
      },
      stop(updateUi = true) {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = 0;
        this.stream?.getTracks().forEach(t => t.stop());
        try { this.source?.disconnect(); } catch {}
        this.stream = null; this.source = null; this.analyser = null; this.buffer = null; this.active = false;
        this.lastResult = { freq:null, rms:0, note:'—', onset:false, midi:null };
        if (updateUi) updateInputButtons();
      }
    };
  }

  function autoCorrelate(input, sampleRate, gate) {
    const size = input.length;
    let rms = 0;
    for (let i = 0; i < size; i++) rms += input[i] * input[i];
    rms = Math.sqrt(rms / size);
    if (rms < gate) return { freq:null, rms };

    let r1 = 0, r2 = size - 1;
    const trim = .2;
    for (let i = 0; i < size / 2; i++) { if (Math.abs(input[i]) < trim) { r1 = i; break; } }
    for (let i = 1; i < size / 2; i++) { if (Math.abs(input[size - i]) < trim) { r2 = size - i; break; } }
    const buf = input.slice(r1, r2);
    const n = buf.length;
    if (n < 128) return { freq:null, rms };
    const c = new Float32Array(n);
    for (let lag = 0; lag < n; lag++) {
      let sum = 0;
      for (let i = 0; i < n - lag; i++) sum += buf[i] * buf[i + lag];
      c[lag] = sum;
    }
    let d = 0;
    while (d + 1 < n && c[d] > c[d + 1]) d++;
    let maxVal = -Infinity, maxPos = -1;
    const maxLag = Math.min(n - 2, Math.floor(sampleRate / 55));
    for (let i = Math.max(d, Math.floor(sampleRate / 1200)); i <= maxLag; i++) {
      if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; }
    }
    if (maxPos <= 1 || !Number.isFinite(maxVal)) return { freq:null, rms };
    let T0 = maxPos;
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const denom = x1 - 2 * x2 + x3;
    if (denom !== 0) T0 += .5 * (x1 - x3) / denom;
    const freq = sampleRate / T0;
    if (!Number.isFinite(freq) || freq < 55 || freq > 1300) return { freq:null, rms };
    return { freq, rms };
  }

  function pitchMatches(freq, targetFreq) {
    if (!freq || !targetFreq) return false;
    let cents = 1200 * Math.log2(freq / targetFreq);
    cents = ((cents + 600) % 1200 + 1200) % 1200 - 600;
    return Math.abs(cents) <= 58;
  }

  function exactOrHarmonicMatch(freq, targetFreq) {
    if (!freq || !targetFreq) return false;
    const ratios = [1,2,.5];
    return ratios.some(r => Math.abs(1200 * Math.log2(freq / (targetFreq * r))) < 70);
  }

  function midiToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  function midiToName(midi) { return `${NOTE_NAMES[(midi % 12 + 12) % 12]}${Math.floor(midi / 12) - 1}`; }

  function bindMetronome() {
    $('#metroToggle').addEventListener('click', () => metronomeTimer ? stopMetronome() : startMetronome());
    $('#bpmDown').addEventListener('click', () => setBpm(bpm - 5));
    $('#bpmUp').addEventListener('click', () => setBpm(bpm + 5));
    $('#bpmSlider').addEventListener('input', e => setBpm(Number(e.target.value), true));
  }

  function setBpm(value, fromSlider = false) {
    bpm = Math.max(40, Math.min(220, Math.round(value)));
    $('#bpmValue').textContent = bpm;
    if (!fromSlider) $('#bpmSlider').value = bpm;
    if (metronomeTimer) { stopMetronome(); startMetronome(); }
  }

  async function startMetronome() {
    await audio.ensureContext();
    metronomeBeat = 0;
    clickBeat();
    metronomeTimer = setInterval(clickBeat, 60000 / bpm);
    $('#metroToggle').textContent = 'Stop';
  }

  function stopMetronome() {
    clearInterval(metronomeTimer);
    metronomeTimer = null;
    $('#metroToggle').textContent = 'Start';
    $$('#beatDots span').forEach(d => d.classList.remove('active'));
  }

  function clickBeat() {
    clickSound(metronomeBeat === 0);
    $$('#beatDots span').forEach((d, i) => d.classList.toggle('active', i === metronomeBeat));
    metronomeBeat = (metronomeBeat + 1) % 4;
  }

  async function clickSound(accent = false) {
    try {
      const ctx = await audio.ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = accent ? 1200 : 820;
      gain.gain.setValueAtTime(.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.12, ctx.currentTime + .003);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .055);
      osc.connect(gain).connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + .06);
    } catch {}
  }

  function renderChords() {
    $('#chordGrid').innerHTML = chords.map(c => `<article class="chord-card"><strong>${c.name}</strong><code>${c.frets}</code><span>${c.note}</span></article>`).join('');
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
    $('#alphaSpeed').addEventListener('change', e => { if (alphaApi) alphaApi.playbackSpeed = Number(e.target.value); });
    $('#songTrackSelect').addEventListener('change', () => { updateSongSectionOptions(); updateSongLevelPreview(); });
    $('#songSectionSelect').addEventListener('change', updateSongLevelPreview);
    $('#songLineMode').addEventListener('change', updateSongLevelPreview);
    $('#songGameSpeed').addEventListener('change', updateSongLevelPreview);
    $('#songBackingEnabled').addEventListener('change', updateSongLevelPreview);
    $('#songBackingVolume').addEventListener('input', e => {
      $('#songBackingVolumeText').textContent = `${Math.round(Number(e.target.value) * 100)}%`;
      if (alphaApi) alphaApi.masterVolume = Number(e.target.value);
    });
    $('#playSongAsLevel').addEventListener('click', startImportedSongLevel);
  }

  async function importFiles(files) {
    const allowed = ['gp','gpx','gp3','gp4','gp5','musicxml','xml','txt','tab'];
    let imported = 0;
    for (const file of files) {
      const ext = extensionOf(file.name);
      if (!allowed.includes(ext)) { toast(`Skipped ${file.name}: unsupported file type.`); continue; }
      await putSong({ id:`${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`, name:file.name, ext, size:file.size, createdAt:Date.now(), blob:file });
      imported++;
    }
    $('#songFileInput').value = '';
    await refreshSongs();
    if (imported) toast(`${imported} file${imported === 1 ? '' : 's'} saved.`);
  }

  function getDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE_SONGS)) req.result.createObjectStore(STORE_SONGS, { keyPath:'id' }); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function putSong(record) { const db = await getDb(); return txPromise(db, 'readwrite', s => s.put(record)); }
  async function getSongs() { const db = await getDb(); const songs = await txPromise(db, 'readonly', s => s.getAll()); return songs.sort((a,b) => b.createdAt - a.createdAt); }
  async function getSong(id) { const db = await getDb(); return txPromise(db, 'readonly', s => s.get(id)); }
  async function deleteSong(id) { const db = await getDb(); return txPromise(db, 'readwrite', s => s.delete(id)); }
  function txPromise(db, mode, fn) { return new Promise((resolve,reject) => { const tx=db.transaction(STORE_SONGS,mode); const req=fn(tx.objectStore(STORE_SONGS)); req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); }); }

  async function refreshSongs() {
    let songs = [];
    try { songs = await getSongs(); } catch (err) { console.error(err); }
    $('#songCount').textContent = songs.length;
    const list = $('#songList');
    if (!songs.length) { list.className='song-list empty-state'; list.textContent='No songs imported yet.'; return; }
    list.className='song-list';
    list.innerHTML = songs.map(s => `<div class="song-item"><button class="song-main" data-open-song="${s.id}"><strong>${escapeHtml(stripExtension(s.name))}</strong><span>${s.ext.toUpperCase()} · ${formatBytes(s.size)}</span></button><button class="icon-button" data-delete-song="${s.id}" aria-label="Delete ${escapeHtml(s.name)}">🗑</button></div>`).join('');
    $$('[data-open-song]', list).forEach(b => b.addEventListener('click', () => openSong(b.dataset.openSong)));
    $$('[data-delete-song]', list).forEach(b => b.addEventListener('click', async () => {
      const song = await getSong(b.dataset.deleteSong);
      if (song && confirm(`Delete ${song.name} from this browser?`)) { if (currentSong?.id === song.id) closePlayer(); await deleteSong(song.id); await refreshSongs(); toast('Song removed.'); }
    }));
  }

  async function openSong(id) {
    const song = await getSong(id); if (!song) return;
    currentSong = song;
    loadedSongScore = null;
    loadedSongTracks = [];
    songLevelSpec = null;
    alphaPlayerReady = false;
    $('#playerEmpty').hidden = true;
    $('#playerContent').hidden = false;
    $('#playerSongName').textContent = stripExtension(song.name);
    $('#songGameSetup').hidden = true;
    $('#textTab').hidden = true;
    $('#alphaTab').hidden = false;
    $('#alphaControls').hidden = false;
    $('#alphaStatus').textContent = 'Loading…';
    if (song.ext === 'txt' || song.ext === 'tab') {
      destroyAlphaTab();
      $('#alphaControls').hidden = true;
      $('#alphaTab').hidden = true;
      $('#songGameSetup').hidden = true;
      $('#textTab').hidden = false;
      $('#textTab').textContent = await song.blob.text();
      return;
    }
    try {
      if (!window.alphaTab) throw new Error('Tab player library is unavailable. Connect to the internet once and reload.');
      destroyAlphaTab();
      const viewport = $('#tabViewport');
      alphaApi = new alphaTab.AlphaTabApi($('#alphaTab'), {
        player:{ enablePlayer:true, enableCursor:true, enableUserInteraction:true, soundFont:'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.4/dist/soundfont/sonivox.sf2', scrollElement:viewport },
        display:{ scale:.9 }
      });
      alphaApi.scoreLoaded.on(score => {
        loadedSongScore = score;
        setupSongGame(score);
      });
      alphaApi.renderStarted.on(() => { $('#alphaStatus').textContent = 'Rendering…'; });
      alphaApi.renderFinished.on(() => { $('#alphaStatus').textContent = 'Ready'; });
      alphaApi.playerReady.on(() => { alphaPlayerReady = true; $('#alphaStatus').textContent = 'Ready to play'; });
      alphaApi.playerPositionChanged.on(args => {
        if (!game || game.mode !== 'song') return;
        game.songClockTick = Math.max(0, Number(args.currentTick) - Number(game.level.sectionStartTick || 0));
        game.songTempo = Number(args.modifiedTempo) || Number(game.level.bpm) || 80;
      });
      alphaApi.playerStateChanged.on(args => { $('#alphaPlay').textContent = args.state === 1 ? '❚❚ Pause' : '▶ Play'; });
      alphaApi.error.on(err => { console.error(err); $('#alphaStatus').textContent = 'Could not open this file'; $('#songGameSetup').hidden = true; });
      alphaApi.load(await song.blob.arrayBuffer());
    } catch (err) { console.error(err); $('#alphaStatus').textContent = err.message || 'Could not load tab.'; toast(err.message || 'Could not load tab.'); }
  }

  function setupSongGame(score) {
    const tracks = Array.from(score?.tracks || []);
    loadedSongTracks = tracks.map((track, index) => {
      const staff = getFrettedStaff(track);
      const bars = staff ? Array.from(staff.bars || []) : [];
      const stringCount = staff ? getStaffTuning(staff).length : 0;
      const noteCount = staff ? countPlayableNotes(staff) : 0;
      return { index, track, staff, bars, stringCount, noteCount, playable:Boolean(staff && stringCount === 6 && noteCount > 0) };
    });
    const playable = loadedSongTracks.filter(t => t.playable);
    const select = $('#songTrackSelect');
    select.innerHTML = loadedSongTracks.map(t => {
      const name = t.track?.name || t.track?.shortName || `Track ${t.index + 1}`;
      const detail = t.playable ? `${t.stringCount} strings · ${t.noteCount} notes` : 'not a 6-string guitar track';
      return `<option value="${t.index}" ${t.playable ? '' : 'disabled'}>${escapeHtml(name)} — ${detail}</option>`;
    }).join('');
    if (!playable.length) {
      $('#songGameSetup').hidden = false;
      $('#songGameInfo').textContent = 'I could not find a playable six-string guitar track in this file.';
      $('#playSongAsLevel').disabled = true;
      $('#songSectionSelect').innerHTML = '<option>No playable sections</option>';
      return;
    }
    select.value = String(playable[0].index);
    $('#playSongAsLevel').disabled = false;
    $('#songGameSetup').hidden = false;
    $('#songGameInfo').textContent = `${playable.length} playable guitar track${playable.length === 1 ? '' : 's'} found. Song-game beta uses the file's fret/string data and simplifies simultaneous chords to one scored note.`;
    updateSongSectionOptions();
    updateSongLevelPreview();
  }

  function getFrettedStaff(track) {
    const staves = Array.from(track?.staves || []);
    return staves.find(staff => {
      const tuning = getStaffTuning(staff);
      if (tuning.length < 4 || tuning.length > 8) return false;
      return Array.from(staff?.bars || []).some(bar => Array.from(bar?.voices || []).some(voice => Array.from(voice?.beats || []).some(beat => Array.from(beat?.notes || []).some(note => Number.isFinite(Number(note?.string)) && Number(note.string) > 0))));
    }) || null;
  }

  function getStaffTuning(staff) {
    try {
      const direct = Array.from(staff?.tuning || []).map(Number).filter(Number.isFinite);
      if (direct.length) return direct;
    } catch {}
    try {
      const nested = Array.from(staff?.stringTuning?.tunings || []).map(Number).filter(Number.isFinite);
      if (nested.length) return nested;
    } catch {}
    return [];
  }

  function countPlayableNotes(staff) {
    let count = 0;
    Array.from(staff?.bars || []).forEach(bar => Array.from(bar?.voices || []).forEach(voice => Array.from(voice?.beats || []).forEach(beat => {
      Array.from(beat?.notes || []).forEach(note => {
        const str = Number(note?.string), fret = Number(note?.fret);
        if (Number.isFinite(str) && str >= 1 && str <= 6 && Number.isFinite(fret) && fret >= 0 && !note.isDead && !note.tieOrigin) count++;
      });
    })));
    return count;
  }

  function updateSongSectionOptions() {
    const meta = loadedSongTracks.find(t => t.index === Number($('#songTrackSelect').value));
    const select = $('#songSectionSelect');
    if (!meta?.playable) { select.innerHTML = '<option>No playable sections</option>'; return; }
    const total = meta.bars.length;
    const chunk = 8;
    const options = [];
    for (let start = 0; start < total; start += chunk) {
      const end = Math.min(total, start + chunk);
      options.push(`<option value="${start}:${end}">Bars ${start + 1}–${end}</option>`);
    }
    select.innerHTML = options.join('');
    if (songLevelSpec && songLevelSpec.trackIndex === meta.index) {
      const wanted = `${songLevelSpec.startBar}:${songLevelSpec.endBar}`;
      if ([...select.options].some(o => o.value === wanted)) select.value = wanted;
    }
  }

  function readSongBuilderSpec() {
    const trackIndex = Number($('#songTrackSelect').value);
    const meta = loadedSongTracks.find(t => t.index === trackIndex);
    if (!meta?.playable) return null;
    const parts = String($('#songSectionSelect').value || '0:8').split(':').map(Number);
    const startBar = Math.max(0, Number.isFinite(parts[0]) ? parts[0] : 0);
    const endBar = Math.min(meta.bars.length, Number.isFinite(parts[1]) ? parts[1] : startBar + 8);
    return {
      trackIndex,
      startBar,
      endBar,
      totalBars:meta.bars.length,
      lineMode:$('#songLineMode').value === 'high' ? 'high' : 'low',
      speed:Math.max(.4, Math.min(1, Number($('#songGameSpeed').value) || .75)),
      backingEnabled:$('#songBackingEnabled').value !== 'off',
      backingVolume:Math.max(0, Math.min(1, Number($('#songBackingVolume').value) || 0))
    };
  }

  function updateSongLevelPreview() {
    const spec = readSongBuilderSpec();
    if (!spec || !loadedSongScore) { $('#songLevelPreview').textContent = 'Choose a playable guitar track.'; return; }
    try {
      const level = buildImportedLevel(loadedSongScore, spec, true);
      const simplification = level.chordsSimplified ? ` · ${level.chordsSimplified} chord beat${level.chordsSimplified === 1 ? '' : 's'} simplified` : '';
      const backing = spec.backingEnabled ? ' · backing instruments on' : ' · backing off';
      $('#songLevelPreview').textContent = `${level.notes.length} scored notes · ${Math.round(level.bpm)} BPM game speed${backing}${simplification}`;
    } catch (err) {
      $('#songLevelPreview').textContent = err.message || 'This section cannot be converted.';
    }
  }

  function startImportedSongLevel() {
    if (!loadedSongScore || !currentSong) { toast('Open a Guitar Pro or MusicXML file first.'); return; }
    const spec = readSongBuilderSpec();
    if (!spec) { toast('Choose a playable guitar track.'); return; }
    try {
      songLevelSpec = spec;
      alphaApi?.stop?.();
      const level = buildImportedLevel(loadedSongScore, spec, false);
      launchLevel(level);
    } catch (err) {
      console.error(err);
      toast(err.message || 'Could not turn this section into a level.');
    }
  }

  function launchNextSongSection() {
    if (!loadedSongScore || !game?.level?.songSpec) { showView('songs'); return; }
    const previous = game.level.songSpec;
    if (previous.endBar >= previous.totalBars) { showView('songs'); return; }
    const length = Math.max(1, previous.endBar - previous.startBar);
    const next = { ...previous, startBar:previous.endBar, endBar:Math.min(previous.totalBars, previous.endBar + length) };
    songLevelSpec = next;
    $('#songTrackSelect').value = String(next.trackIndex);
    updateSongSectionOptions();
    const optionValue = `${next.startBar}:${next.endBar}`;
    if ([...$('#songSectionSelect').options].some(o => o.value === optionValue)) $('#songSectionSelect').value = optionValue;
    const level = buildImportedLevel(loadedSongScore, next, false);
    launchLevel(level);
  }

  function buildImportedLevel(score, spec, previewOnly = false) {
    const meta = loadedSongTracks.find(t => t.index === spec.trackIndex);
    if (!meta?.playable) throw new Error('That track is not a playable six-string guitar track.');
    const track = meta.track;
    const staff = meta.staff;
    const bars = meta.bars.slice(spec.startBar, spec.endBar);
    const groups = new Map();
    let chordGroups = 0;
    bars.forEach(bar => {
      Array.from(bar?.voices || []).forEach(voice => {
        Array.from(voice?.beats || []).forEach(beat => {
          const notes = Array.from(beat?.notes || []).filter(note => {
            const str = Number(note?.string), fret = Number(note?.fret);
            return Number.isFinite(str) && str >= 1 && str <= 6 && Number.isFinite(fret) && fret >= 0 && !note.isDead && !note.tieOrigin;
          });
          if (!notes.length) return;
          const fallbackTick = Number(bar?.masterBar?.start || 0) + Number(beat?.playbackStart || 0);
          const tick = Number.isFinite(Number(beat?.absolutePlaybackStart)) ? Number(beat.absolutePlaybackStart) : fallbackTick;
          const key = String(Math.round(tick));
          if (!groups.has(key)) groups.set(key, { tick, notes:[] });
          groups.get(key).notes.push(...notes);
        });
      });
    });
    const ordered = [...groups.values()].sort((a,b) => a.tick - b.tick);
    if (!ordered.length) throw new Error('No playable notes were found in this section.');
    const firstTick = ordered[0].tick;
    const tempo = Math.max(30, Number(score?.tempo) || 80);
    const gameBpm = tempo * spec.speed;
    const raw = [];
    ordered.forEach(group => {
      const unique = [];
      const seen = new Set();
      group.notes.forEach(note => {
        const stringNumber = Number(note.string);
        const fret = Number(note.fret);
        const midiRaw = Number(note.realValue);
        const midi = Number.isFinite(midiRaw) ? Math.round(midiRaw) : Math.round(Number(note.stringTuning) + fret);
        if (!Number.isFinite(midi)) return;
        const key = `${stringNumber}:${fret}:${midi}`;
        if (seen.has(key)) return;
        seen.add(key);
        unique.push({ stringNumber, fret, midi, note });
      });
      if (!unique.length) return;
      if (unique.length > 1) chordGroups++;
      unique.sort((a,b) => a.midi - b.midi);
      const chosen = spec.lineMode === 'high' ? unique.at(-1) : unique[0];
      const quarterBeats = (group.tick - firstTick) / 960;
      raw.push({ string:chosen.stringNumber - 1, fret:chosen.fret, midi:chosen.midi, tick:group.tick, beat:2 + quarterBeats });
    });
    const notes = raw.filter((n, i) => i === 0 || n.beat !== raw[i-1].beat || n.midi !== raw[i-1].midi);
    if (!notes.length) throw new Error('No scored notes remained after simplifying this section.');
    if (notes.length > 420) throw new Error('This 8-bar section is unusually dense. Choose a different guitar track for now.');
    const stringInfo = makeStringInfoFromStaff(staff);
    const trackName = track?.name || track?.shortName || `Track ${spec.trackIndex + 1}`;
    const sectionName = `Bars ${spec.startBar + 1}–${spec.endBar}`;
    const sectionStartTick = Number(bars[0]?.masterBar?.start ?? firstTick);
    const nextBar = meta.bars[spec.endBar];
    const finalTick = ordered.at(-1)?.tick ?? firstTick;
    const sectionEndTick = Number(nextBar?.masterBar?.start ?? (finalTick + 960));
    return {
      id:`song:${currentSong?.id || 'local'}:${spec.trackIndex}:${spec.startBar}:${spec.endBar}:${spec.lineMode}:${spec.speed}`,
      mode:'song',
      songId:currentSong?.id || 'local',
      songKey:`${currentSong?.id || 'local'}:${spec.trackIndex}:${spec.startBar}:${spec.endBar}:${spec.lineMode}`,
      trackIndex:spec.trackIndex,
      trackName,
      songSpec:{ ...spec },
      sectionStartTick,
      sectionEndTick,
      stringInfo,
      title:`${stripExtension(currentSong?.name || score?.title || 'Imported Song')} · ${sectionName}`,
      tag:'SONG GAME · BETA',
      headline:`${trackName} · ${sectionName}`,
      lesson:spec.lineMode === 'high' ? 'Lead mode scores the highest note whenever the tab contains a chord. Follow the falling fret blocks and play clean single notes.' : 'Riff mode scores the lowest/root note whenever the tab contains a chord. Follow the falling fret blocks and play clean single notes.',
      hint:'The live tab below mirrors the simplified playable line generated from your imported file.',
      bpm:gameBpm,
      notes,
      chordsSimplified:chordGroups,
      previewOnly
    };
  }

  function makeStringInfoFromStaff(staff) {
    const tuningTopToBottom = getStaffTuning(staff);
    const tuningLowToHigh = tuningTopToBottom.length === 6 ? [...tuningTopToBottom].reverse() : STRING_INFO.map(s => s.openMidi);
    return tuningLowToHigh.map((midi, i) => {
      const name = midiToName(Math.round(midi));
      const pitch = name.replace(/\d+$/, '');
      return { label:i === 5 && pitch === 'E' ? 'e' : pitch, number:6 - i, name:`String ${6 - i} (${name})`, openMidi:Math.round(midi) };
    });
  }

  function destroyAlphaTab() {
    if (alphaApi) { try { alphaApi.destroy(); } catch {} alphaApi=null; }
    alphaPlayerReady = false;
    mutedBackingTrack = null;
    loadedSongScore = null;
    loadedSongTracks = [];
    $('#alphaTab').innerHTML='';
  }

  function closePlayer() {
    destroyAlphaTab();
    currentSong=null;
    songLevelSpec=null;
    $('#songGameSetup').hidden=true;
    $('#playerContent').hidden=true;
    $('#playerEmpty').hidden=false;
  }

  function bindProgress() {
    $('#resetProgress').addEventListener('click', () => {
      if (!confirm('Reset all Guitar Quest mission progress and XP?')) return;
      state = defaultState(); saveProgress(); renderWorldMap(); renderAchievements(); toast('Game progress reset.');
    });
  }

  function playerLevel(xp) { return Math.floor(Math.max(0,xp) / 300) + 1; }
  function rankName(level) { return level >= 10 ? 'Stage Monster' : level >= 7 ? 'Riff Hunter' : level >= 4 ? 'Garage Player' : 'Garage Rookie'; }

  function updateStats() {
    const level = playerLevel(state.xp);
    const into = state.xp % 300;
    const pct = into / 300 * 100;
    const minutes = Math.floor(state.practiceSeconds / 60);
    $('#headerLevel').textContent = `Lv ${level}`; $('#headerXp').textContent = `${state.xp} XP`;
    $('#heroLevel').textContent = level; $('#heroXpText').textContent = `${into} / 300 XP`; $('#heroXpBar').style.width = `${pct}%`;
    $('#statStars').textContent = totalStars(); $('#statCombo').textContent = state.bestCombo; $('#statHits').textContent = state.totalHits; $('#statMinutes').textContent = minutes;
    $('#progressLevel').textContent = level; $('#progressTitleRank').textContent = rankName(level); $('#progressXpBar').style.width = `${pct}%`; $('#progressXpText').textContent = `${state.xp} XP total · ${into} / 300 to next level`;
    $('#progressStars').textContent = totalStars(); $('#progressHits').textContent = state.totalHits; $('#progressCombo').textContent = state.bestCombo; $('#progressMinutes').textContent = minutes;
    renderAchievements();
  }

  function renderAchievements() {
    $('#achievementGrid').innerHTML = achievements.map(a => { const unlocked = a.test(state); return `<article class="achievement ${unlocked ? 'unlocked' : ''}"><div class="achievement-icon">${a.icon}</div><strong>${a.title}</strong><span>${a.text}</span></article>`; }).join('');
  }

  function bindPwaInstall() {
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstallPrompt = e; $('#installButton').hidden = false; });
    $('#installButton').addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; $('#installButton').hidden = true;
    });
  }

  function updateNetworkBadge() {
    const apply = () => { $('#offlineBadge').textContent = navigator.onLine ? 'Online' : 'Offline'; };
    apply(); window.addEventListener('online', apply); window.addEventListener('offline', apply);
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('./sw.js?v=0.4.0');
      reg.update().catch(() => null);
    } catch (err) { console.error(err); }
  }

  function toast(message) {
    const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function extensionOf(name) { return (name.split('.').pop() || '').toLowerCase(); }
  function stripExtension(name) { return name.replace(/\.[^.]+$/, ''); }
  function formatBytes(n) { if (n < 1024) return `${n} B`; if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`; return `${(n/1024/1024).toFixed(1)} MB`; }
  function escapeHtml(s) { return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  console.info(`Tucker's Guitar Quest ${APP_VERSION}`);
})();
