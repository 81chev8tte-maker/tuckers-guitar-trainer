(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const INSTRUMENT_KEY = 'family-music-instrument-v1';
  const DB_NAME = 'nova-piano-trainer';
  const DB_STORE = 'songs';
  const NOTE_NAMES = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const WHITE_PCS = new Set([0,2,4,5,7,9,11]);
  const PIANO_MIN = 21; // A0
  const PIANO_MAX = 108; // C8
  const BEGINNER_RANGE = {min:48,max:83,label:'Beginner · C3–B5'};
  const MAX_VISIBLE_WHITE_KEYS = 28;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const noteName = midi => `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
  const midiFromFrequency = hz => 69 + 12 * Math.log2(hz / 440);
  const frequencyFromMidi = midi => 440 * 2 ** ((midi - 69) / 12);
  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const notesInRange = (notes,start=-Infinity,end=Infinity) => notes.filter(n=>n.start>=start&&n.start<=end&&n.midi>=PIANO_MIN&&n.midi<=PIANO_MAX);
  const whiteCount = (min,max) => {let total=0;for(let midi=min;midi<=max;midi++)if(WHITE_PCS.has(midi%12))total++;return total;};
  const alignRange = range => {let min=range.min,max=range.max;while(min>PIANO_MIN&&!WHITE_PCS.has(min%12))min--;while(max<PIANO_MAX&&!WHITE_PCS.has(max%12))max++;return{...range,min,max};};
  function noteRange(notes){const valid=notes.filter(n=>n.midi>=PIANO_MIN&&n.midi<=PIANO_MAX);return valid.length?{min:Math.min(...valid.map(n=>n.midi)),max:Math.max(...valid.map(n=>n.midi))}:{...BEGINNER_RANGE};}
  function calculateDisplayRange(notes,preference='song',focusMidi=null){
    if(preference==='beginner')return{...BEGINNER_RANGE,wide:false};
    const actual=noteRange(notes),padded={min:clamp(actual.min-2,PIANO_MIN,PIANO_MAX),max:clamp(actual.max+2,PIANO_MIN,PIANO_MAX)};
    if(whiteCount(padded.min,padded.max)<=MAX_VISIBLE_WHITE_KEYS)return alignRange({...padded,actualMin:actual.min,actualMax:actual.max,wide:false,label:`Song Range · ${noteName(actual.min)}–${noteName(actual.max)}`});
    const focus=clamp(focusMidi??actual.min,PIANO_MIN,PIANO_MAX),min=clamp(focus-18,PIANO_MIN,PIANO_MAX-35),max=clamp(min+35,PIANO_MIN,PIANO_MAX);
    return alignRange({min,max,actualMin:actual.min,actualMax:actual.max,wide:true,label:`Following · ${noteName(min)}–${noteName(max)}`});
  }
  function melodyPracticeNotes(notes){const sorted=notes.map(n=>({...n})).sort((a,b)=>a.start-b.start||a.midi-b.midi),groups=[];for(const note of sorted){const group=groups.at(-1);if(group&&Math.abs(group[0].start-note.start)<.02)group.push(note);else groups.push([note]);}return groups.map(group=>({...group.at(-1),chordSize:group.length}));}

  const builtInSongs = [
    {id:'nova-first-tune',title:'First Five-Note Tune',description:'An original five-note melody for the right hand.',tempo:76,notes:[60,62,64,62,60,60,62,64,67,64,62,60].map((m,i)=>({midi:m,start:i*.7,duration:.52,hand:'right'}))},
    {id:'middle-c-march',title:'Middle C March',description:'Steady quarter notes around Middle C.',tempo:72,notes:[60,60,62,62,64,64,62,60].map((m,i)=>({midi:m,start:i*.82,duration:.58,hand:'right'}))},
    {id:'two-hand-steps',title:'Two-Hand Steps',description:'Take turns with left and right hands.',tempo:68,notes:[48,50,52,53,60,62,64,65].map((m,i)=>({midi:m,start:i*.86,duration:.62,hand:m<60?'left':'right'}))}
  ];
  const lessons = [
    {id:'middle-c',title:'Find Middle C',description:'Find the C nearest the middle of the keyboard.',song:'middle-c-march'},
    {id:'white-keys',title:'C, D and E',description:'Play three neighboring white keys from left to right.',song:'nova-first-tune'},
    {id:'rhythm',title:'Steady Steps',description:'Play one note for each steady beat.',song:'middle-c-march'},
    {id:'hands',title:'Left Hand, Right Hand',description:'Blue L notes use the left hand. Purple R notes use the right.',song:'two-hand-steps'}
  ];
  const curriculum=window.NovaPianoCurriculum;
  if(curriculum){builtInSongs.push(...curriculum.songs);lessons.splice(0,lessons.length,...curriculum.lessons);}
  const lessonGroups=curriculum?.groups||[{id:'start',title:'Piano Lessons',description:'Learn one note at a time.',lessons}];

  function loadProgress(){
    const empty={version:3,completedLessons:[],songs:{},bestCombo:0,totalHits:0,minutes:0,lastSong:null,skillModel:window.FMQPracticeIntelligence?.emptySkillModel?.()||null,settings:{rangeMode:'beginner',accompaniment:true,accompanimentVolume:.22,alwaysNoteNames:false}};
    try{const saved=window.FMQProfiles?.getInstrumentProgress('piano')||{};return{...empty,...saved,settings:{...empty.settings,...(saved.settings||{})}};}catch{return empty;}
  }
  let progress=loadProgress();
  let currentGame=null,startSongBusy=false;
  const saveProgress=()=>window.FMQProfiles?.saveInstrumentProgress('piano',progress);

  class PianoInputHub {
    constructor(){this.listeners=new Set();}
    subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
    emit(event){const normalized={type:'noteon',velocity:100,timestamp:performance.now(),...event};this.listeners.forEach(fn=>fn(normalized));}
  }
  const inputHub=new PianoInputHub();

  class OnScreenPianoInput {
    constructor(hub){this.hub=hub;}
    noteOn(midi){this.hub.emit({midi,source:'screen',type:'noteon'});}
    noteOff(midi){this.hub.emit({midi,source:'screen',type:'noteoff',velocity:0});}
  }
  const screenInput=new OnScreenPianoInput(inputHub);

  class MicrophonePianoInput {
    constructor(hub){this.hub=hub;this.active=false;this.context=null;this.stream=null;this.analyser=null;this.raf=0;this.history=[];this.stableMidi=null;this.stableFrames=0;this.lastEmit=new Map();this.lastAnalysis=0;this.onReading=()=>{};}
    async start(onReading){
      if(this.active)return;
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Microphone input is not available in this browser.');
      this.onReading=onReading||(()=>{});
      this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      this.context=new (window.AudioContext||window.webkitAudioContext)();
      await this.context.resume();
      const source=this.context.createMediaStreamSource(this.stream);
      this.analyser=this.context.createAnalyser();this.analyser.fftSize=4096;this.analyser.smoothingTimeConstant=.12;source.connect(this.analyser);this.active=true;this.tick();
    }
    stop(){this.active=false;cancelAnimationFrame(this.raf);this.stream?.getTracks().forEach(t=>t.stop());this.context?.close();this.stream=this.context=this.analyser=null;this.history=[];this.stableMidi=null;this.stableFrames=0;this.onReading({active:false});}
    tick(){
      if(!this.active||!this.analyser)return;
      const frameNow=performance.now();if(frameNow-this.lastAnalysis<85){this.raf=requestAnimationFrame(()=>this.tick());return;}this.lastAnalysis=frameNow;
      const data=new Float32Array(this.analyser.fftSize);this.analyser.getFloatTimeDomainData(data);
      let sum=0;for(const v of data)sum+=v*v;const rms=Math.sqrt(sum/data.length);
      const result=rms>.012?this.detectPitch(data,this.context.sampleRate):null;
      if(result&&result.confidence>.68&&result.frequency>=27&&result.frequency<=4250){
        const raw=midiFromFrequency(result.frequency);this.history.push(raw);if(this.history.length>5)this.history.shift();
        const smooth=[...this.history].sort((a,b)=>a-b)[Math.floor(this.history.length/2)];const midi=Math.round(smooth);const cents=(smooth-midi)*100;
        if(Math.abs(cents)<=45){
          if(midi===this.stableMidi)this.stableFrames++;else{this.stableMidi=midi;this.stableFrames=1;}
          if(this.stableFrames>=3){const now=performance.now();if(now-(this.lastEmit.get(midi)||0)>330){this.lastEmit.set(midi,now);this.hub.emit({midi,source:'microphone',frequency:result.frequency,confidence:result.confidence});}}
          this.onReading({active:true,midi,name:noteName(midi),frequency:result.frequency,confidence:result.confidence,level:rms,stable:this.stableFrames>=3,cents});
        }
      }else{this.stableFrames=0;this.onReading({active:true,level:rms,quiet:rms<=.012,confidence:result?.confidence||0});}
      this.raf=requestAnimationFrame(()=>this.tick());
    }
    detectPitch(buffer,sampleRate){
      const size=buffer.length;let bestOffset=-1,best=0;const min=Math.floor(sampleRate/4250),max=Math.min(Math.ceil(sampleRate/27),size>>1);
      for(let offset=min;offset<=max;offset++){
        let corr=0,a=0,b=0;for(let i=0;i<size-offset;i++){corr+=buffer[i]*buffer[i+offset];a+=buffer[i]*buffer[i];b+=buffer[i+offset]*buffer[i+offset];}
        corr/=Math.sqrt(a*b)||1;if(corr>best){best=corr;bestOffset=offset;}
      }
      return bestOffset>0?{frequency:sampleRate/bestOffset,confidence:best}:null;
    }
  }
  const microphoneInput=new MicrophonePianoInput(inputHub);

  class PianoSynth {
    constructor(){this.context=null;this.voices=new Map();}
    noteOn(midi,velocity=90,duration=.8){this.context??=new (window.AudioContext||window.webkitAudioContext)();const now=this.context.currentTime,hold=Math.max(.16,Math.min(3,duration)),osc=this.context.createOscillator(),gain=this.context.createGain();osc.type='triangle';osc.frequency.value=frequencyFromMidi(midi);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.12*(velocity/127),now+.012);gain.gain.exponentialRampToValueAtTime(.001,now+hold);osc.connect(gain).connect(this.context.destination);osc.start(now);osc.stop(now+hold+.03);this.voices.set(midi,osc);}
  }
  const pianoSynth=new PianoSynth();
  inputHub.subscribe(event=>{if(event.type==='noteon'&&event.source==='screen')pianoSynth.noteOn(event.midi,event.velocity);});

  // This provider contract is intentionally ready for Web MIDI note-on/note-off,
  // velocity and simultaneous notes without changing PianoGame.
  class MidiPianoInput {
    constructor(hub){this.hub=hub;this.unsubscribe=null;}
    receive(data){const command=data[0]&0xf0,midi=data[1],velocity=data[2];if(command===0x90&&velocity)this.hub.emit({midi,velocity,source:'midi'});else if(command===0x80||(command===0x90&&!velocity))this.hub.emit({midi,velocity:0,source:'midi',type:'noteoff'});}
    async connect(){const service=window.FMQHardware?.midi;if(!service)throw new Error('Web MIDI is unavailable.');await service.connect();this.unsubscribe?.();this.unsubscribe=service.subscribe(event=>{if(event.type==='noteon'||event.type==='noteoff')this.hub.emit({midi:event.midi,velocity:event.velocity,type:event.type,source:'midi'});});}
    stop(){this.unsubscribe?.();this.unsubscribe=null;}
  }
  window.NovaPianoInputs={PianoInputHub,MicrophonePianoInput,OnScreenPianoInput,MidiPianoInput};

  const pianoApp=$('pianoApp');
  pianoApp.innerHTML=`
    <header class="piano-topbar"><div class="piano-brand"><span>🎹</span><div><strong>Piano Quest</strong><small>Family Music Quest</small></div></div><button id="pianoSwitchInstrument" class="button small secondary">🎵 Instruments</button></header>
    <div class="piano-content">
      <section id="piano-view-home" class="piano-view active"><article class="piano-hero"><div><p class="eyebrow">LISTEN • PLAY • GROW</p><h1>Learn piano one note at a time.</h1><p class="muted">Watch a note fall, find the matching key, and play it on a real piano—or tap the screen.</p><div class="piano-actions"><button id="pianoQuickStart" class="button big">▶ Start First Lesson</button><button class="button secondary" data-piano-view="mic">🎙 Test Microphone</button></div></div><div class="nova-card"><div><span data-player-avatar>⭐</span><h2>Ready, <b data-player-name>Player</b>?</h2><p class="muted">Let's make some music.</p></div></div></article><div class="piano-grid"><article class="piano-card"><span>🌱 BEGINNER</span><h3>Wait for Me Mode</h3><p class="muted">The game waits until the right key is played.</p><button class="button" data-song="nova-first-tune" data-mode="wait">Start</button></article><article class="piano-card"><span>🎵 PLAY</span><h3>Rhythm Mode</h3><p class="muted">Keep up with the notes and build a combo.</p><button class="button" data-song="nova-first-tune" data-mode="normal">Play</button></article><article class="piano-card"><span>🎙 INPUT</span><h3>Can it hear the piano?</h3><p class="muted">Check the microphone before a lesson.</p><button class="button secondary" data-piano-view="mic">Mic Test</button></article></div></section>
      <section id="piano-view-lessons" class="piano-view"><div class="page-heading"><p class="eyebrow">LEARNING PATH</p><h1>Piano Lessons</h1><p class="muted">One short idea, then play it as a game.</p></div><div id="pianoLessonList" class="piano-lesson-list"></div></section>
      <section id="piano-view-songs" class="piano-view"><div class="page-heading"><p class="eyebrow">PIANO LIBRARY</p><h1>Songs</h1><p class="muted">Piano songs are kept separate from the Guitar library.</p></div><div id="pianoSongList" class="piano-library-list"></div></section>
      <section id="piano-view-import" class="piano-view"><div class="page-heading"><p class="eyebrow">ADD A PIANO SONG</p><h1>Import MIDI</h1><p class="muted">Choose a .mid or .midi file, then pick the track that contains the piano part.</p></div><div class="piano-import-drop"><label class="button big" for="pianoMidiFile">Choose MIDI File</label><input id="pianoMidiFile" type="file" accept=".mid,.midi,audio/midi" hidden><p id="midiImportStatus" class="muted">Files stay in this browser.</p></div><div id="midiPreview" class="piano-status-card" hidden></div></section>
      <section id="piano-view-mic" class="piano-view"><div class="page-heading"><p class="eyebrow">INPUT TEST</p><h1>Can the Chromebook hear the piano?</h1><p class="muted">Play one piano key at a time. A quiet room works best.</p></div><article class="piano-status-card"><div class="piano-toolbar"><button id="pianoMicToggle" class="button">Enable Microphone</button><span id="pianoMicStatus" class="muted">Microphone is off. You can still tap the keyboard.</span></div><div class="mic-readout"><small>DETECTED · NEAREST NOTE</small><div id="micDetectedNote" class="heard">—</div><strong id="micSignalText">Play a piano key…</strong><p id="micRangeText" class="muted">Beginner Range: C3–B5</p><div class="signal-meter"><i id="pianoSignalBar"></i></div><details class="technical-details"><summary>Technical details</summary><div id="micTechnical">Frequency — · MIDI — · Stability —</div></details></div><div id="micTestKeyboard"></div></article></section>
      <section id="piano-view-progress" class="piano-view"><div class="page-heading"><p class="eyebrow">PLAYER PROGRESS</p><h1>Piano Progress</h1><p class="muted">This Piano progress belongs to <span data-player-name>this player</span>.</p></div><div id="pianoProgressCards" class="piano-grid"></div></section>
    </div>
    <nav class="piano-bottom-nav" aria-label="Piano navigation"><button class="piano-nav-button active" data-piano-view="home"><span>🎹</span>Play</button><button class="piano-nav-button" data-piano-view="lessons"><span>🌱</span>Lessons</button><button class="piano-nav-button" data-piano-view="songs"><span>♫</span>Songs</button><button class="piano-nav-button" data-piano-view="import"><span>⬇</span>Import</button><button class="piano-nav-button" data-piano-view="mic"><span>🎙</span>Mic Test</button><button class="piano-nav-button" data-piano-view="progress"><span>★</span>Progress</button></nav>
    <section id="pianoGame" class="piano-game" hidden></section>`;

  function showChooser(){microphoneInput.stop();if(currentGame)currentGame.destroy();window.FMQProfiles?.showHome();}
  function chooseInstrument(name){
    localStorage.setItem(INSTRUMENT_KEY,name);$('instrumentChooser').hidden=true;const piano=name==='piano';document.body.classList.toggle('piano-active',piano);pianoApp.hidden=!piano;
    if(!piano){if(currentGame)currentGame.destroy();microphoneInput.stop();window.dispatchEvent(new CustomEvent('music-app:enter-guitar'));}
    else window.dispatchEvent(new CustomEvent('music-app:leave-guitar'));
  }
  $('chooseGuitar').addEventListener('click',()=>chooseInstrument('guitar'));
  $('choosePiano').addEventListener('click',()=>chooseInstrument('piano'));
  $('openInstrumentChooser').addEventListener('click',showChooser);
  $('pianoSwitchInstrument').addEventListener('click',showChooser);
  window.addEventListener('family-music:profile-changing',()=>{if(currentGame)currentGame.destroy();microphoneInput.stop();});
  window.addEventListener('family-music:profile-changed',()=>{progress=loadProgress();renderLessons();renderSongs();renderProgress();showPianoView('home');});
  window.addEventListener('family-music:show-home',()=>{if(currentGame)currentGame.destroy();microphoneInput.stop();});
  const remembered=localStorage.getItem(INSTRUMENT_KEY);
  if(window.FMQProfiles?.hasActiveProfile()){if(remembered)chooseInstrument(remembered);else showChooser();}

  function showPianoView(name){
    document.querySelectorAll('.piano-view').forEach(v=>v.classList.toggle('active',v.id===`piano-view-${name}`));
    document.querySelectorAll('.piano-nav-button').forEach(b=>b.classList.toggle('active',b.dataset.pianoView===name));
    if(name!=='mic')microphoneInput.stop();if(name==='progress')renderProgress();if(name==='songs')renderSongs();
  }
  pianoApp.addEventListener('click',e=>{const target=e.target.closest('[data-piano-view]');if(target)showPianoView(target.dataset.pianoView);const listen=e.target.closest('[data-listen-song]');if(listen){startSong(listen.dataset.listenSong,'listen','full',listen.dataset.lesson||null,'full');return;}const play=e.target.closest('[data-song]');if(play){if(play.dataset.lesson){showLessonIntro(lessons.find(lesson=>lesson.id===play.dataset.lesson));return;}const card=play.closest('.piano-list-card'),range=card?.querySelector('.piano-section-select')?.value||'full',hand=card?.querySelector('.piano-hand-select')?.value||'full';startSong(play.dataset.song,play.dataset.mode||'wait',range,null,hand);}});

  function renderLessons(){
    const nextId=lessons.find(lesson=>!progress.completedLessons.includes(lesson.id))?.id;
    const labels=curriculum?.contentLabels||{exercise:'Exercise',miniSong:'Mini Song',fullSong:'Full Song',checkpoint:'Concert'};
    $('pianoLessonList').innerHTML=lessonGroups.map(group=>`<section class="piano-lesson-group"><header><p class="eyebrow">${escapeHtml(group.title)}</p><h2>${escapeHtml(group.title.split('—').at(-1).trim())}</h2><p class="muted">${escapeHtml(group.description)}</p></header><div class="piano-lesson-cards">${group.lessons.map(lesson=>{const complete=progress.completedLessons.includes(lesson.id),current=lesson.id===nextId,type=lesson.contentType||'exercise',musical=type!=='exercise',action=type==='checkpoint'?'Start Concert':type==='fullSong'?'Play Full Song':type==='miniSong'?'Play Mini Song':'Play Exercise';return `<article class="piano-list-card ${current?'current':''} ${type}"><div><p class="eyebrow">${complete?'✓ COMPLETE':current?'PLAY THIS NEXT':escapeHtml(labels[type]||'PRACTICE')}</p><h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.instruction||lesson.description)}</p>${musical?`<small>${Math.round(lesson.duration||0)} seconds · ${escapeHtml(labels[type])}</small>`:''}</div><div class="piano-toolbar">${musical?`<button class="button ghost" data-listen-song="${lesson.song}" data-lesson="${lesson.id}">▶ Listen First</button>`:''}<button class="button ${complete?'secondary':''}" data-song="${lesson.song}" data-mode="${lesson.mode||'wait'}" data-lesson="${lesson.id}">${complete?'Play Again':action}</button></div></article>`;}).join('')}</div></section>`).join('');
  }
  function showLessonIntro(lesson){
    if(!lesson)return;let panel=$('pianoLessonIntro');if(!panel){panel=document.createElement('section');panel.id='pianoLessonIntro';panel.className='piano-lesson-intro';pianoApp.appendChild(panel);}
    panel.innerHTML=`<div class="piano-intro-card"><button id="closeLessonIntro" class="icon-button" aria-label="Close lesson introduction">✕</button><p class="eyebrow">${escapeHtml(lesson.groupTitle||'PIANO LESSON')}</p><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(lesson.instruction||lesson.description)}</p><div id="lessonIntroKeyboard" class="lesson-intro-keyboard"></div><div class="piano-toolbar"><button id="showLessonKey" class="button secondary">Show Me</button><button id="startLessonPractice" class="button big">Start Practice</button></div></div>`;panel.hidden=false;createKeyboard($('lessonIntroKeyboard'),false,BEGINNER_RANGE.min,BEGINNER_RANGE.max);
    const showKey=()=>{const key=panel.querySelector(`.piano-key[data-midi="${lesson.hintMidi??60}"]`);panel.querySelectorAll('.piano-key.required').forEach(k=>k.classList.remove('required'));key?.classList.add('required');};showKey();
    $('showLessonKey').onclick=showKey;$('closeLessonIntro').onclick=()=>{panel.hidden=true;};$('startLessonPractice').onclick=()=>{panel.hidden=true;startSong(lesson.song,lesson.mode||'wait','full',lesson.id);};
  }
  async function renderSongs(){
    const imported=await getAllSongs();const all=[...builtInSongs.filter(song=>!song.lessonExercise),...imported];
    $('pianoSongList').innerHTML=all.map(song=>{const duration=Math.max(...song.notes.map(n=>n.start+n.duration)),range=noteRange(song.notes),octaves=Math.max(1,Math.ceil((range.max-range.min+1)/12)),difficulty=song.difficulty&&song.difficulty!=='Unrated'?` · ${'⭐'.repeat(song.difficultyStars||1)} ${song.difficulty}`:'';const sections=duration>18?Array.from({length:Math.ceil(duration/30)},(_,i)=>`<option value="${i}">Section ${i+1} · ${formatTime(i*30)}–${formatTime(Math.min(duration,(i+1)*30))}</option>`).join(''):'';return `<article class="piano-list-card"><div><p class="eyebrow">${song.imported?'IMPORTED MIDI':'PRACTICE SONG'}${song.imported?` · ${song.trackName||'Selected track'}`:''}${difficulty}</p><h2>${escapeHtml(song.title)}</h2><p>${escapeHtml(song.description||`${song.notes.length} notes · ${Math.round(song.tempo||120)} BPM`)}</p>${song.practiceRole?`<p><strong>${escapeHtml(song.practiceRole)}</strong>${song.practiceTraits?.length?` · ${song.practiceTraits.map(escapeHtml).join(' · ')}`:''}</p>`:''}<p class="piano-range-summary">Range: <strong>${noteName(range.min)}–${noteName(range.max)}</strong>${octaves>=5?' · Wide song: the keyboard will follow the notes.':''}${song.imported?' · Chords use their highest melody note for microphone practice.':''}</p></div><div class="piano-toolbar">${sections?`<select class="piano-section-select" aria-label="Practice range"><option value="full">Full Song</option>${sections}</select>`:''}<button class="button" data-song="${song.id}" data-mode="wait">Wait Mode</button><button class="button secondary" data-song="${song.id}" data-mode="normal">Rhythm Mode</button>${song.imported?`<button class="button ghost" data-delete-piano-song="${song.id}">Delete</button>`:''}</div></article>`;}).join('');
    $('pianoSongList').querySelectorAll('[data-delete-piano-song]').forEach(button=>{const toolbar=button.closest('.piano-toolbar');if(!toolbar||toolbar.querySelector('.piano-hand-select'))return;const select=document.createElement('select');select.className='piano-hand-select';select.setAttribute('aria-label','Hand to practise');select.innerHTML='<option value="full">Full Part</option><option value="right">Right Hand (inferred)</option><option value="left">Left Hand (inferred)</option>';toolbar.prepend(select);});
  }
  function renderProgress(){
    const best=Math.max(0,...Object.values(progress.songs||{}).map(s=>s.bestScore||0));
    $('pianoProgressCards').innerHTML=`<article class="piano-card"><span>🌱 LESSONS</span><h2>${progress.completedLessons.length} / ${lessons.length}</h2><div class="piano-progress-bar"><i style="width:${100*progress.completedLessons.length/lessons.length}%"></i></div></article><article class="piano-card"><span>🎯 NOTES PLAYED</span><h2>${progress.totalHits||0}</h2></article><article class="piano-card"><span>⭐ BEST SCORE</span><h2>${best}</h2><p class="muted">Best combo: ${progress.bestCombo||0}</p></article>`;
  }
  renderLessons();renderSongs();renderProgress();

  function createKeyboard(container,onNote=true,min=BEGINNER_RANGE.min,max=BEGINNER_RANGE.max){
    const whites=[];for(let m=min;m<=max;m++)if(WHITE_PCS.has(m%12))whites.push(m);
    container.innerHTML='<div class="piano-keyboard"></div>';const keyboard=container.firstElementChild;
    whites.forEach(m=>{const key=document.createElement('button');key.className='piano-key white';key.dataset.midi=m;key.setAttribute('aria-label',noteName(m));key.innerHTML=`<span>${m%12===0?noteName(m):NOTE_NAMES[m%12]}</span>`;keyboard.appendChild(key);});
    const whiteIndex=new Map(whites.map((m,i)=>[m,i]));for(let m=min;m<=max;m++)if(!WHITE_PCS.has(m%12)){const preceding=[...whites].filter(w=>w<m).pop();if(preceding===undefined)continue;const key=document.createElement('button');key.className='piano-key black';key.dataset.midi=m;key.setAttribute('aria-label',noteName(m));key.style.left=`${(whiteIndex.get(preceding)+1)/whites.length*100}%`;key.innerHTML=`<span>${NOTE_NAMES[m%12]}</span>`;keyboard.appendChild(key);}
    if(onNote){keyboard.addEventListener('pointerdown',e=>{const key=e.target.closest('.piano-key');if(!key)return;e.preventDefault();key.classList.add('active');screenInput.noteOn(+key.dataset.midi);});keyboard.addEventListener('pointerup',e=>{const key=e.target.closest('.piano-key');if(key){key.classList.remove('active');screenInput.noteOff(+key.dataset.midi);}});keyboard.addEventListener('pointercancel',e=>e.target.closest('.piano-key')?.classList.remove('active'));}
    return keyboard;
  }
  createKeyboard($('micTestKeyboard'));

  function micReading(reading){
    $('pianoSignalBar').style.width=`${clamp((reading.level||0)*1800,0,100)}%`;
    if(reading.name){const inside=reading.midi>=BEGINNER_RANGE.min&&reading.midi<=BEGINNER_RANGE.max,extreme=reading.midi<33||reading.midi>96;$('micDetectedNote').textContent=reading.name;$('micSignalText').textContent=reading.stable?'Signal: Good':'Hold the note…';$('micRangeText').textContent=inside?'Inside Beginner Range':`Outside Beginner Range · Available in Song Range${extreme?' · This note may be harder for the Chromebook to hear.':''}`;$('micTechnical').textContent=`Frequency ${reading.frequency.toFixed(1)} Hz · MIDI ${reading.midi} · Stability ${reading.stable?'stable':'listening'} · ${Math.round(reading.confidence*100)}% confidence`;highlightKey($('micTestKeyboard'),reading.midi,'active',180);}
    else{$('micSignalText').textContent=reading.quiet?'Too quiet — play a little louder':'Listening…';}
  }
  $('pianoMicToggle').addEventListener('click',async()=>{
    if(microphoneInput.active){microphoneInput.stop();$('pianoMicToggle').textContent='Enable Microphone';$('pianoMicStatus').textContent='Microphone is off. You can still tap the keyboard.';return;}
    try{await microphoneInput.start(micReading);$('pianoMicToggle').textContent='Stop Microphone';$('pianoMicStatus').textContent='Microphone Ready — play one key at a time.';}catch(err){$('pianoMicStatus').textContent=`Microphone unavailable: ${err.message} Tap the keyboard below instead.`;}
  });
  function highlightKey(root,midi,className='active',duration=160){const key=root?.querySelector(`.piano-key[data-midi="${midi}"]`);if(key){key.classList.add(className);setTimeout(()=>key.isConnected&&key.classList.remove(className),duration);}}

  class PianoGame {
    constructor(song,mode,lessonId,options={}){this.song=song;this.mode=mode;this.lessonId=lessonId;this.rangePreference=options.rangePreference||(song.imported?'song':'beginner');this.returnView=lessonId?'lessons':'songs';this.speed=1;this.index=0;this.hits=0;this.misses=0;this.combo=0;this.bestCombo=0;this.score=0;this.time=0;this.running=false;this.waiting=false;this.finished=false;this.destroyed=false;this.lastFrame=0;this.unsubscribe=null;this.raf=0;this.lookAhead=4;this.timers=new Set();this.runToken=0;this.section={start:0,end:Math.max(...song.notes.map(n=>n.start+n.duration))+1};this.loop={start:this.section.start,end:this.section.end,enabled:false};this.displayRange={...BEGINNER_RANGE};}
    mount(){
      this.assistance=this.song.assistance||'practice';
      document.body.classList.add('piano-game-open');
      const root=$('pianoGame');root.hidden=false;root.innerHTML=`<div class="piano-game-shell"><header class="piano-game-header"><button id="pianoExitGame" class="icon-button" aria-label="Exit">✕</button><div class="piano-game-title"><span>${this.mode==='wait'?'BEGINNER · WAIT FOR ME':'RHYTHM PLAY'}</span><strong>${escapeHtml(this.song.title)}</strong></div><div class="piano-game-stats"><div class="piano-stat"><span>SCORE</span><strong id="pgScore">0</strong></div><div class="piano-stat"><span>ACCURACY</span><strong id="pgAccuracy">100%</strong></div><div class="piano-stat"><span>COMBO</span><strong id="pgCombo">0</strong></div></div></header><div id="pianoStage" class="piano-stage"><div id="pianoLanes" class="piano-lanes"></div><div class="piano-hit-line"><span>PLAY NOW</span></div><div id="pianoInputPill" class="piano-input-pill">Input: screen keys</div><div id="pianoGameFeedback" class="piano-game-feedback"></div><div id="pianoCountIn" class="piano-count-in" hidden>1</div><div class="piano-game-controls"><select id="pianoGameSpeed" aria-label="Playback speed"><option value=".5">50%</option><option value=".6">60%</option><option value=".7">70%</option><option value=".8">80%</option><option value=".9">90%</option><option value="1" selected>100%</option></select><button id="pianoLoopStart" class="button small secondary">A · Start</button><button id="pianoLoopEnd" class="button small secondary">B · End</button><button id="pianoLoopToggle" class="button small secondary">↻ Loop Off</button><label class="count-in-toggle"><input id="pianoCountInToggle" type="checkbox" checked> Count-In</label><button id="pianoGameMic" class="button small secondary">🎙 Mic</button><button id="pianoRestart" class="button small secondary">↻ Restart</button><button id="pianoPause" class="button small secondary">Pause</button></div><div id="waitCallout" class="wait-callout" hidden><span>PLAY</span><strong>—</strong><small>The game will wait for you</small></div></div><div id="pianoGameKeyboard" class="piano-keyboard-wrap"></div></div>`;
      this.resultPanel=document.createElement('section');this.resultPanel.className='piano-result-panel';this.resultPanel.hidden=true;this.resultPanel.innerHTML='<div class="piano-result-card"><p class="eyebrow" id="pianoResultLabel">SONG COMPLETE</p><h1 id="pianoResultTitle">Nice playing!</h1><div class="piano-result-stats"><div><span>Score</span><strong id="pianoResultScore">0</strong></div><div><span>Accuracy</span><strong id="pianoResultAccuracy">0%</strong></div><div><span>Best combo</span><strong id="pianoResultCombo">0</strong></div><div><span>Notes hit</span><strong id="pianoResultHits">0</strong></div></div><p id="pianoResultMessage" class="muted"></p><div class="piano-toolbar"><button id="pianoPlayAgain" class="button big">↻ Play Again</button><button id="pianoResultBack" class="button secondary">Back</button></div></div>';root.appendChild(this.resultPanel);
      const rangeSelect=document.createElement('select');rangeSelect.id='pianoRangeMode';rangeSelect.setAttribute('aria-label','Keyboard range');rangeSelect.innerHTML='<option value="beginner">Beginner · large keys</option><option value="song">Song Range · automatic</option>';rangeSelect.value=this.rangePreference;root.querySelector('.piano-game-controls').prepend(rangeSelect);
      const assistSelect=document.createElement('select');assistSelect.id='pianoAssistance';assistSelect.setAttribute('aria-label','Playing help');assistSelect.innerHTML='<option value="learn">Learn · names + fingers</option><option value="practice">Practice · note names</option><option value="perform">Perform · fewer hints</option><option value="master">Master · minimal help</option>';assistSelect.value=this.assistance;root.querySelector('.piano-game-controls').prepend(assistSelect);
      const namesLabel=document.createElement('label');namesLabel.className='count-in-toggle';namesLabel.innerHTML='<input id="pianoAlwaysNames" type="checkbox"> Note names';root.querySelector('.piano-game-controls').prepend(namesLabel);$('pianoAlwaysNames').checked=progress.settings?.alwaysNoteNames===true;
      root.querySelector('.piano-game-title span').textContent=this.mode==='listen'?'LISTEN FIRST':this.mode==='wait'?'BEGINNER · WAIT FOR ME':'RHYTHM PLAY';
      this.updateRange(true);this.keyboard=createKeyboard($('pianoGameKeyboard'),true,this.displayRange.min,this.displayRange.max);this.makeLanes();
      $('pianoExitGame').onclick=()=>this.destroy();$('pianoRestart').onclick=()=>this.restart();$('pianoPause').onclick=()=>this.togglePause();$('pianoGameSpeed').onchange=e=>this.speed=+e.target.value;$('pianoLoopStart').onclick=()=>this.setLoopPoint('start');$('pianoLoopEnd').onclick=()=>this.setLoopPoint('end');$('pianoLoopToggle').onclick=()=>this.toggleLoop();$('pianoCountInToggle').checked=progress.settings?.countIn!==false;$('pianoCountInToggle').onchange=e=>{progress.settings??={};progress.settings.countIn=Boolean(e.target.checked);saveProgress();};$('pianoRangeMode').onchange=e=>{const actual=noteRange(this.sectionNotes());if(e.target.value==='beginner'&&(actual.min<BEGINNER_RANGE.min||actual.max>BEGINNER_RANGE.max)){e.target.value='song';this.feedback('This song needs Song Range');}this.rangePreference=e.target.value;progress.settings??={};progress.settings.rangeMode=this.rangePreference;saveProgress();this.restart();};$('pianoGameMic').onclick=()=>this.toggleMic();$('pianoPlayAgain').onclick=()=>{this.resultPanel.hidden=true;this.restart();};$('pianoResultBack').onclick=()=>{const destination=this.returnView;this.destroy();showPianoView(destination);};
      $('pianoAssistance').onchange=e=>{this.assistance=e.target.value;progress.settings.noteNames=['learn','practice'].includes(this.assistance);saveProgress();$('pianoStage').querySelectorAll('.falling-note').forEach(note=>note.remove());};
      $('pianoAlwaysNames').onchange=e=>{progress.settings.alwaysNoteNames=Boolean(e.target.checked);saveProgress();$('pianoStage').querySelectorAll('.falling-note').forEach(note=>note.remove());};
      this.unsubscribe=inputHub.subscribe(event=>this.onInput(event));this.restart();
    }
    sectionNotes(){return notesInRange(this.song.notes,this.section.start,this.section.end);}
    updateRange(force=false,focusMidi=null){const next=calculateDisplayRange(this.sectionNotes(),this.rangePreference,focusMidi);if(!force&&next.min===this.displayRange.min&&next.max===this.displayRange.max)return false;this.displayRange=next;return true;}
    keyGeometry(midi){const whites=[];for(let m=this.displayRange.min;m<=this.displayRange.max;m++)if(WHITE_PCS.has(m%12))whites.push(m);const whiteWidth=100/whites.length;if(WHITE_PCS.has(midi%12)){const index=whites.indexOf(midi);return{left:index*whiteWidth,width:whiteWidth};}const preceding=[...whites].filter(m=>m<midi).pop(),boundary=whites.indexOf(preceding)+1;return{left:boundary*whiteWidth-whiteWidth*.3,width:whiteWidth*.6};}
    makeLanes(){const laneRoot=$('pianoLanes');laneRoot.innerHTML='';for(let m=this.displayRange.min;m<=this.displayRange.max;m++){const lane=document.createElement('i'),geo=this.keyGeometry(m);lane.className=`piano-lane ${WHITE_PCS.has(m%12)?'':'black-lane'}`;lane.dataset.midi=m;lane.style.left=`${geo.left}%`;lane.style.width=`${geo.width}%`;laneRoot.appendChild(lane);}}
    shiftRangeFor(midi){if(midi>=this.displayRange.min+3&&midi<=this.displayRange.max-3)return;if(!this.displayRange.wide)return;if(this.updateRange(false,midi)){createKeyboard($('pianoGameKeyboard'),true,this.displayRange.min,this.displayRange.max);this.makeLanes();$('pianoStage').querySelectorAll('.falling-note').forEach(n=>n.remove());}}
    schedule(fn,delay){const timer=setTimeout(()=>{this.timers.delete(timer);if(!this.destroyed)fn();},delay);this.timers.add(timer);return timer;}
    clearTimers(){this.timers.forEach(clearTimeout);this.timers.clear();clearTimeout(this.feedbackTimer);}
    restart(){this.loop.start=this.section.start;this.loop.end=this.section.end;this.loop.enabled=false;this.updateLoopUi();this.startRun(this.section.start,false);}
    startRun(start=this.section.start,isRepeat=false){cancelAnimationFrame(this.raf);this.clearTimers();const token=++this.runToken;this.finished=false;this.destroyed=false;this.running=false;this.countingIn=true;this.song.notes.forEach(n=>delete n.done);const end=this.loop.enabled?this.loop.end:this.section.end;this.index=this.song.notes.findIndex(n=>n.start>=start&&n.start<=end);if(this.index<0)this.index=0;this.hits=this.misses=this.combo=this.bestCombo=this.score=0;this.time=start;this.waiting=false;this.resultPanel.hidden=true;this.updateRange(true,this.song.notes[this.index]?.midi);createKeyboard($('pianoGameKeyboard'),true,this.displayRange.min,this.displayRange.max);this.makeLanes();$('pianoStage').querySelectorAll('.falling-note').forEach(n=>n.remove());$('waitCallout').hidden=true;$('pianoInputPill').textContent=`${this.displayRange.label||BEGINNER_RANGE.label} · screen keys`;$('pianoPause').disabled=true;this.updateHud();this.beginAfterCountIn(token,isRepeat);}
    async beginAfterCountIn(token,isRepeat){if(progress.settings?.countIn!==false)await this.countIn(token);if(this.destroyed||token!==this.runToken)return;this.countingIn=false;this.running=true;$('pianoPause').disabled=false;this.lastFrame=performance.now();this.frame(this.lastFrame);}
    async countIn(token){const overlay=$('pianoCountIn'),beat=window.FMQPracticeTools?.beatMilliseconds(this.tempoAt(this.time),this.speed)||750;overlay.hidden=false;for(const label of ['1','2','3','4']){if(this.destroyed||token!==this.runToken)return;overlay.textContent=label;this.countClick(label==='1');await new Promise(resolve=>this.schedule(resolve,beat));}overlay.textContent='PLAY!';await new Promise(resolve=>this.schedule(resolve,Math.min(250,beat*.35)));overlay.hidden=true;}
    countClick(accent=false){try{const context=synth.context??=new (window.AudioContext||window.webkitAudioContext)(),osc=context.createOscillator(),gain=context.createGain(),now=context.currentTime;osc.frequency.value=accent?880:660;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.05,now+.005);gain.gain.exponentialRampToValueAtTime(.0001,now+.07);osc.connect(gain).connect(context.destination);osc.start(now);osc.stop(now+.08);}catch{}}
    tempoAt(time){const map=this.song.tempoMap||[];const event=[...map].reverse().find(item=>Number(item.time)<=time);return Number(event?.bpm||this.song.tempo)||120;}
    frame(now){if(!this.running||this.finished||this.destroyed)return;const delta=Math.min(.05,(now-this.lastFrame)/1000);this.lastFrame=now;if(!this.waiting)this.time+=delta*this.speed;this.updateNotes();const end=this.loop.enabled?this.loop.end:this.section.end;if(this.time>end){if(this.loop.enabled){this.startRun(this.loop.start,true);return;}this.mode==='listen'?this.finishDemo():this.finish();}else if(this.running&&!this.finished)this.raf=requestAnimationFrame(t=>this.frame(t));}
    updateNotes(){
      const stage=$('pianoStage'),height=stage.clientHeight,travel=height-18;this.shiftRangeFor(this.song.notes[this.index]?.midi??this.displayRange.min);
      const start=this.loop.enabled?this.loop.start:this.section.start,end=this.loop.enabled?this.loop.end:this.section.end;this.song.notes.forEach((note,i)=>{if(note.start<start||note.start>end)return;const until=note.start-this.time;if(until>this.lookAhead||until<-.6)return;let el=stage.querySelector(`[data-note-index="${i}"]`);if(!el){const geo=this.keyGeometry(note.midi);el=document.createElement('div');el.className=`falling-note ${note.hand||'right'}`;el.dataset.noteIndex=i;el.dataset.midi=note.midi;el.style.left=`${geo.left}%`;el.style.width=`${geo.width}%`;el.innerHTML=`<small>${note.hand==='left'?'L':'R'}</small>${noteName(note.midi)}`;stage.appendChild(el);}const noteProgress=1-until/this.lookAhead;el.style.transform=`translateY(${noteProgress*travel-54}px)`;
        el.innerHTML=this.noteCaption(note);
        el.style.height=`${Math.max(54,Math.min(140,54+(note.duration||.5)*34))}px`;
        if(until<=0&&this.mode==='listen'&&!note.done)this.demoNote(note,i,el);
        if(until<=0&&i===this.index&&this.mode==='wait'&&!note.done){this.waiting=true;$('waitCallout').hidden=false;$('waitCallout').querySelector('strong').textContent=noteName(note.midi);this.requireKey(note.midi);}
        if(until<-.28&&this.mode==='normal'&&!note.done){this.markMiss(note,i,el);}
      });
      while(this.index<this.song.notes.length&&this.song.notes[this.index].done)this.index++;
    }
    noteCaption(note){const hand=note.hand==='left'?'L':'R',name=noteName(note.midi).replace(/\d/g,''),finger=note.finger?` · ${note.finger}`:'';if(progress.settings?.alwaysNoteNames)return `<small>${hand}${this.assistance==='learn'?finger:''}</small>${name}`;if(this.assistance==='learn')return `<small>${hand}${finger}</small>${name}`;if(this.assistance==='practice')return `<small>${hand}</small>${name}`;if(this.assistance==='perform')return `<small>${hand}</small>${note.finger||'●'}`;return `<small>${hand}</small>●`;}
    demoNote(note,i,el){if(note.done)return;note.done=true;el?.classList.add('hit');pianoSynth.noteOn(note.midi,note.velocity||82,note.duration);highlightKey($('pianoGame'),note.midi,'active',Math.max(180,note.duration*700));this.schedule(()=>el?.remove(),Math.max(220,note.duration*800));if(i===this.index)this.index++;}
    finishDemo(){if(this.finished||this.destroyed)return;this.finished=true;this.running=false;cancelAnimationFrame(this.raf);this.clearTimers();$('pianoResultLabel').textContent='LISTEN FIRST COMPLETE';$('pianoResultTitle').textContent=this.song.title;$('pianoResultScore').textContent='—';$('pianoResultAccuracy').textContent='—';$('pianoResultCombo').textContent='—';$('pianoResultHits').textContent=this.song.notes.length;$('pianoResultMessage').textContent='Now it is your turn. Start in Learn mode and the game will wait for you.';$('pianoPlayAgain').textContent='Try It';$('pianoPlayAgain').onclick=()=>{const id=this.song.id,lessonId=this.lessonId;this.destroy();startSong(id,'wait','full',lessonId);};$('pianoResultBack').textContent=this.lessonId?'Back to Lessons':'Back to Songs';this.resultPanel.hidden=false;}
    onInput(event){if(event.type!=='noteon'||!this.running||this.finished||this.mode==='listen')return;highlightKey($('pianoGame'),event.midi);$('pianoInputPill').textContent=`Heard: ${noteName(event.midi)} · ${event.source==='microphone'?'microphone':'screen key'}`;const note=this.song.notes[this.index];if(!note)return;const timing=note.start-this.time;const validTime=this.mode==='wait'?this.waiting:Math.abs(timing)<.36;if(validTime&&event.midi===note.midi){this.markHit(note,this.index,timing);}else if(validTime){this.feedback(`Almost! Heard ${noteName(event.midi)} · Find ${noteName(note.midi)}`,'bad');highlightKey($('pianoGame'),event.midi,'wrong',250);if(this.mode==='normal')this.combo=0;this.updateHud();}}
    markHit(note,i,timing){note.done=true;const el=$('pianoStage').querySelector(`[data-note-index="${i}"]`);el?.classList.add('hit');this.hits++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.score+=this.mode==='wait'?50:Math.max(50,100-Math.round(Math.abs(timing)*120));this.waiting=false;$('waitCallout').hidden=true;this.clearRequired();const cheers=['Great! ✓','You got it! ✓','Nice! ✓'];this.feedback(this.mode==='wait'?cheers[this.hits%cheers.length]:Math.abs(timing)<.1?'Perfect!':'Good!','good');this.schedule(()=>el?.remove(),180);this.index++;this.updateHud();}
    markMiss(note,i,el){note.done=true;this.misses++;this.combo=0;el.classList.add('missed');this.feedback('Keep going — try the next one','bad');this.schedule(()=>el.remove(),350);this.index++;this.updateHud();}
    requireKey(midi){this.clearRequired();$('pianoGame').querySelector(`.piano-key[data-midi="${midi}"]`)?.classList.add('required');$('pianoGame').querySelector(`.piano-lane[data-midi="${midi}"]`)?.classList.add('target');}
    clearRequired(){$('pianoGame')?.querySelectorAll('.piano-key.required,.piano-lane.target').forEach(x=>x.classList.remove('required','target'));}
    feedback(text){$('pianoGameFeedback').textContent=text;clearTimeout(this.feedbackTimer);this.feedbackTimer=this.schedule(()=>{if($('pianoGameFeedback'))$('pianoGameFeedback').textContent='';},850);}
    updateHud(){const total=this.hits+this.misses;$('pgScore').textContent=this.score;$('pgCombo').textContent=this.combo;$('pgAccuracy').textContent=`${total?Math.round(100*this.hits/total):100}%`;}
    setLoopPoint(which){const current=clamp(this.time,this.section.start,this.section.end);if(which==='start')this.loop.start=current;else this.loop.end=current;const valid=window.FMQPracticeTools?.validateLoop(this.loop.start,this.loop.end,this.section.end,1)||this.loop;this.loop.start=valid.start;this.loop.end=valid.end;this.loop.enabled=true;this.updateLoopUi();this.startRun(this.loop.start,true);}
    toggleLoop(){this.loop.enabled=!this.loop.enabled;this.updateLoopUi();if(this.loop.enabled)this.startRun(this.loop.start,true);}
    updateLoopUi(){const format=window.FMQPracticeTools?.formatPracticeTime||(n=>`${Math.round(n)}s`);if($('pianoLoopStart'))$('pianoLoopStart').textContent=`A · ${format(this.loop.start)}`;if($('pianoLoopEnd'))$('pianoLoopEnd').textContent=`B · ${format(this.loop.end)}`;if($('pianoLoopToggle'))$('pianoLoopToggle').textContent=this.loop.enabled?'↻ Loop On':'↻ Loop Off';}
    togglePause(){if(this.finished||this.destroyed||this.countingIn)return;this.running=!this.running;$('pianoPause').textContent=this.running?'Pause':'Resume';if(this.running){this.lastFrame=performance.now();this.frame(this.lastFrame);}else cancelAnimationFrame(this.raf);}
    async toggleMic(){if(microphoneInput.active){microphoneInput.stop();$('pianoGameMic').textContent='🎙 Mic';$('pianoInputPill').textContent='Input: screen keys';return;}try{await microphoneInput.start(r=>{if(r.name)$('pianoInputPill').textContent=`Heard: ${r.name}${r.stable?' ✓':''}`;});$('pianoGameMic').textContent='🎙 On';$('pianoInputPill').textContent='Microphone Ready';}catch(err){$('pianoInputPill').textContent='Mic unavailable — tap the keys';this.feedback('Use the on-screen keys');}}
    finish(){if(this.finished||this.destroyed)return;this.finished=true;this.running=false;cancelAnimationFrame(this.raf);this.clearTimers();const total=this.hits+this.misses,accuracy=total?Math.round(100*this.hits/total):0;progress.totalHits=(progress.totalHits||0)+this.hits;progress.bestCombo=Math.max(progress.bestCombo||0,this.bestCombo);progress.lastSong=this.song.id;const prior=progress.songs[this.song.id]||{},newBest=this.score>(prior.bestScore||0);progress.songs[this.song.id]={bestScore:Math.max(prior.bestScore||0,this.score),bestAccuracy:Math.max(prior.bestAccuracy||0,accuracy),lastPlayed:Date.now()};const lessonNew=this.lessonId&&!progress.completedLessons.includes(this.lessonId);if(lessonNew)progress.completedLessons.push(this.lessonId);saveProgress();$('pianoResultLabel').textContent=this.lessonId?'LESSON COMPLETE':'SONG COMPLETE';$('pianoResultTitle').textContent=this.song.title;$('pianoResultScore').textContent=this.score;$('pianoResultAccuracy').textContent=`${accuracy}%`;$('pianoResultCombo').textContent=this.bestCombo;$('pianoResultHits').textContent=this.hits;$('pianoResultMessage').textContent=[newBest?'New best score!':'Nice playing!',lessonNew?'Lesson completed ✓':''].filter(Boolean).join(' · ');$('pianoResultBack').textContent=this.lessonId?'Back to Lessons':'Back to Songs';this.resultPanel.hidden=false;}
    destroy(){if(this.destroyed)return;this.destroyed=true;this.runToken++;this.finished=true;this.running=false;cancelAnimationFrame(this.raf);this.clearTimers();this.unsubscribe?.();this.unsubscribe=null;microphoneInput.stop();this.clearRequired();this.song.notes.forEach(n=>delete n.done);document.body.classList.remove('piano-game-open');$('pianoGame').hidden=true;$('pianoGame').innerHTML='';if(currentGame===this)currentGame=null;renderLessons();renderProgress();}
  }

  async function startSong(id,mode='wait',sectionChoice='full',lessonId=null,handMode='full'){
    if(startSongBusy)return;startSongBusy=true;
    try{if(currentGame)currentGame.destroy();let song=builtInSongs.find(s=>s.id===id)||await getSong(id);if(!song)return;let selected=song.notes;if(song.imported&&handMode!=='full')selected=selected.filter(note=>(note.hand||(note.midi<60?'left':'right'))===handMode);if(!selected.length)selected=song.notes;const sourceNotes=song.imported?melodyPracticeNotes(selected):selected.map(n=>({...n}));const clone={...song,handMode,notes:sourceNotes.sort((a,b)=>a.start-b.start||a.midi-b.midi)};const rangePreference=lessonId?'beginner':song.imported?'song':(progress.settings?.rangeMode||'beginner');currentGame=new PianoGame(clone,mode,lessonId,{rangePreference});if(sectionChoice!=='full'){const start=+sectionChoice*30;currentGame.section={start,end:Math.min(start+30,Math.max(...clone.notes.map(n=>n.start+n.duration))+1)};}currentGame.mount();}finally{startSongBusy=false;}
  }
  $('pianoQuickStart').addEventListener('click',()=>showLessonIntro(lessons[0]));
  pianoApp.addEventListener('click',async e=>{const del=e.target.closest('[data-delete-piano-song]');if(del&&confirm('Delete this imported Piano song?')){await deleteSong(del.dataset.deletePianoSong);renderSongs();}});

  async function openDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(DB_STORE))request.result.createObjectStore(DB_STORE,{keyPath:'id'});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  async function storeSong(song){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(song);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});}
  async function getAllSongs(){try{const db=await openDb();return await new Promise((resolve,reject)=>{const req=db.transaction(DB_STORE).objectStore(DB_STORE).getAll();req.onsuccess=()=>{db.close();resolve(req.result||[]);};req.onerror=()=>reject(req.error);});}catch{return [];}}
  async function getSong(id){const all=await getAllSongs();return all.find(s=>s.id===id);}
  async function deleteSong(id){const db=await openDb();return new Promise(resolve=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).delete(id);tx.oncomplete=()=>{db.close();resolve();};});}

  class MidiFileParser {
    constructor(buffer){this.view=new DataView(buffer);this.pos=0;this.division=480;this.tempoEvents=[{tick:0,microseconds:500000}];}
    u8(){return this.view.getUint8(this.pos++);}u16(){const n=this.view.getUint16(this.pos);this.pos+=2;return n;}u32(){const n=this.view.getUint32(this.pos);this.pos+=4;return n;}
    text(n){let s='';while(n--)s+=String.fromCharCode(this.u8());return s;}
    vlq(){let value=0,b;do{b=this.u8();value=(value<<7)|(b&127);}while(b&128);return value;}
    parse(){if(this.text(4)!=='MThd')throw new Error('This is not a standard MIDI file.');const headerLength=this.u32(),format=this.u16(),trackCount=this.u16();this.division=this.u16();if(this.division&0x8000)throw new Error('SMPTE-timed MIDI files are not supported yet.');this.pos=8+headerLength;const tracks=[];for(let i=0;i<trackCount;i++)tracks.push(this.parseTrack(i));this.tempoEvents.sort((a,b)=>a.tick-b.tick);tracks.forEach(t=>{t.notes.forEach(n=>{n.start=this.tickToSeconds(n.startTick);n.duration=Math.max(.08,this.tickToSeconds(n.endTick)-n.start);delete n.startTick;delete n.endTick;});t.notes.sort((a,b)=>a.start-b.start||a.midi-b.midi);});const openingTempo=[...this.tempoEvents].filter(t=>t.tick===0).pop()||this.tempoEvents[0],tempoMap=this.tempoEvents.map(event=>({time:this.tickToSeconds(event.tick),bpm:Math.round(60000000/event.microseconds)}));return{format,division:this.division,tempo:Math.round(60000000/openingTempo.microseconds),tempoMap,tracks};}
    parseTrack(index){if(this.text(4)!=='MTrk')throw new Error('A MIDI track is damaged or missing.');const trackLength=this.u32(),end=this.pos+trackLength;let tick=0,running=0,name=`Track ${index+1}`,instrument='',notes=[],active=new Map();while(this.pos<end){tick+=this.vlq();let status=this.u8();if(status<128){this.pos--;status=running;}else if(status<0xf0)running=status;if(status===0xff){const type=this.u8(),len=this.vlq();if(type===0x03)name=this.text(len);else if(type===0x04)instrument=this.text(len);else if(type===0x51&&len===3){const us=(this.u8()<<16)|(this.u8()<<8)|this.u8();this.tempoEvents.push({tick,microseconds:us});}else this.pos+=len;continue;}if(status===0xf0||status===0xf7){const sysexLength=this.vlq();this.pos+=sysexLength;continue;}const cmd=status&0xf0,channel=status&15,a=this.u8(),two=cmd!==0xc0&&cmd!==0xd0,b=two?this.u8():0;if((cmd===0x90&&b>0)){const key=`${channel}:${a}`;if(!active.has(key))active.set(key,[]);active.get(key).push({tick,velocity:b});}else if(cmd===0x80||(cmd===0x90&&b===0)){const key=`${channel}:${a}`,stack=active.get(key);const start=stack?.shift();if(start)notes.push({midi:a,startTick:start.tick,endTick:tick,duration:0,velocity:start.velocity,channel,hand:a<60?'left':'right'});}}
      return{index,name,instrument,notes,channels:[...new Set(notes.map(n=>n.channel))]};}
    tickToSeconds(tick){let seconds=0,lastTick=0,tempo=this.tempoEvents[0].microseconds;for(const event of this.tempoEvents){if(event.tick>tick)break;seconds+=(event.tick-lastTick)*tempo/(this.division*1e6);lastTick=event.tick;tempo=event.microseconds;}return seconds+(tick-lastTick)*tempo/(this.division*1e6);}
  }
  $('pianoMidiFile').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;$('midiImportStatus').textContent='Reading MIDI…';
    try{const parsed=new MidiFileParser(await file.arrayBuffer()).parse();renderMidiPreview(file,parsed);$('midiImportStatus').textContent='Choose the playable piano track below.';}catch(err){$('midiImportStatus').textContent=`Could not import: ${err.message}`;$('midiPreview').hidden=true;}
  });
  function renderMidiPreview(file,parsed){
    const playable=parsed.tracks.filter(t=>t.notes.length);const analysis=window.FMQMidiAnalysis?.analyzeMidiTracks(playable,parsed.tempo);const recommended=(analysis?.recommendedIndex??-1)>=0?analysis.recommendedIndex:0;const preview=$('midiPreview');preview.hidden=false;if(!playable.length){preview.innerHTML='<p class="eyebrow">IMPORT PREVIEW</p><h2>No playable tracks found</h2><p>This file does not contain any note events.</p>';return;}preview.innerHTML=`<p class="eyebrow">IMPORT PREVIEW</p><h2>${escapeHtml(file.name)}</h2><p>${parsed.tempo} BPM · ${playable.reduce((n,t)=>n+t.notes.length,0)} note events · Choose one part to practise</p><div class="track-picker">${playable.map((t,i)=>{const valid=t.notes.filter(n=>n.channel!==9&&n.midi>=PIANO_MIN&&n.midi<=PIANO_MAX),range=valid.length?noteRange(valid):null,a=analysis?.analyses[i],isRecommended=i===recommended&&a?.playable;return `<label class="track-choice ${isRecommended?'recommended':''}"><span class="track-choice-main"><span><input type="radio" name="midiTrack" value="${i}" ${i===recommended?'checked':''}> <strong>${escapeHtml(t.name||`Track ${t.index+1}`)}</strong>${t.instrument?` · ${escapeHtml(t.instrument)}`:''}${isRecommended?'<b class="recommended-badge">Recommended</b>':''}</span><small>${escapeHtml(a?.role||(t.channels.includes(9)?'Drums':'Playable part'))} · ${valid.length} piano notes${range?` · ${noteName(range.min)}–${noteName(range.max)}`:''}</small>${a?.playable?`<small>${'⭐'.repeat(a.stars)} ${a.difficulty} · ${a.traits.map(escapeHtml).join(' · ')}</small><small class="track-reason">${escapeHtml(a.reason)}</small>`:''}</span></label>`;}).join('')}</div><button id="confirmMidiImport" class="button big">Import Selected Track</button>`;
    $('confirmMidiImport').onclick=async()=>{const chosen=$('midiPreview').querySelector('input:checked');if(!chosen){$('midiImportStatus').textContent='Choose a playable Piano track first.';return;}const selectedIndex=+chosen.value,selected=playable[selectedIndex],selectedAnalysis=analysis?.analyses[selectedIndex];const notes=selected.notes.filter(n=>n.channel!==9&&n.midi>=PIANO_MIN&&n.midi<=PIANO_MAX);if(!notes.length){$('midiImportStatus').textContent='That track has no valid piano notes from A0 through C8.';return;}const range=noteRange(notes),span=Math.max(1,Math.ceil((range.max-range.min+1)/12));const song={id:`midi-${uid()}`,title:file.name.replace(/\.midi?$/i,''),description:`Imported from ${file.name}`,tempo:parsed.tempo,tempoMap:parsed.tempoMap,trackName:selected.name,imported:true,notes,difficulty:selectedAnalysis?.difficulty||'Unrated',difficultyStars:selectedAnalysis?.stars||0,practiceRole:selectedAnalysis?.role||'Playable part',practiceTraits:selectedAnalysis?.traits||[]};await storeSong(song);$('midiImportStatus').textContent=`Imported ${notes.length} notes from ${selected.name}. ${selectedAnalysis?.difficulty||''} ${'⭐'.repeat(selectedAnalysis?.stars||0)} · Range: ${noteName(range.min)}–${noteName(range.max)}.${span>=5?' Song Range will follow this wide part.':''}`;preview.hidden=true;renderSongs();showPianoView('songs');};
  }
  function escapeHtml(text){const div=document.createElement('div');div.textContent=String(text);return div.innerHTML;}
  function formatTime(seconds){return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
  window.NovaPianoTest={calculateDisplayRange,noteRange,melodyPracticeNotes,MidiFileParser,PianoGame,getCurrentGame:()=>currentGame,lessons};
})();
