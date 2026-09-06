'use strict';
const fs=require('fs');

const VERSION='2.6.4';

function read(path){return fs.readFileSync(path,'utf8');}
function write(path,content){fs.writeFileSync(path,content);}
function replaceOnce(source,from,to,label=from){
  const i=source.indexOf(from);
  if(i<0) throw new Error(`Missing replacement anchor: ${label}`);
  if(source.indexOf(from,i+from.length)>=0) console.warn(`Anchor appears more than once: ${label}`);
  return source.slice(0,i)+to+source.slice(i+from.length);
}
function replaceNamedFunction(source,name,nextName,fn){
  const starts=[`  function ${name}(`,`  async function ${name}(`];
  let start=-1;
  for(const marker of starts){start=source.indexOf(marker);if(start>=0)break;}
  if(start<0) throw new Error(`Missing function ${name}`);
  const tail=source.slice(start+1);
  const nextRe=new RegExp(`\\n  (?:async )?function ${nextName.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}\\(`);
  const match=tail.match(nextRe);
  if(!match) throw new Error(`Missing next function ${nextName} after ${name}`);
  const end=start+1+match.index;
  const replacement=sourceOf(fn,name);
  return source.slice(0,start)+replacement+source.slice(end+1);
}
function sourceOf(fn,target){
  const raw=fn.toString().replace(fn.name,target);
  return raw.split('\n').map(line=>`  ${line}`).join('\n')+'\n\n';
}
function insertBeforeFunction(source,name,functions){
  const marker=`  function ${name}(`;
  const i=source.indexOf(marker);
  if(i<0) throw new Error(`Missing insertion function ${name}`);
  return source.slice(0,i)+functions.map(([fn,target])=>sourceOf(fn,target)).join('')+source.slice(i);
}

function v264_lowerBoundClock(events,value){
  let lo=0,hi=events.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(Number(events[mid].clock)<value)lo=mid+1;else hi=mid;}
  return lo;
}
function v264_upperBoundClock(events,value){
  let lo=0,hi=events.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(Number(events[mid].clock)<=value)lo=mid+1;else hi=mid;}
  return lo;
}
function v264_eventClockRange(start,end){
  if(!game?.events?.length)return[0,0];
  return[lowerBoundClock(game.events,start),upperBoundClock(game.events,end)];
}
function v264_stringCount(){return Math.max(1,Number(game?.stringInfo?.length)||STRING_INFO.length);}
function v264_advancePendingIndex(){
  if(!game)return;
  while(game.nextPendingIndex<game.events.length&&game.events[game.nextPendingIndex].status!=='pending')game.nextPendingIndex++;
}
function v264_releaseGameEventElements(ev){
  if(!ev?.elements?.length)return;
  ev.elements.forEach(el=>el.remove());
  ev.elements=[];ev.element=null;
  game?.renderedEventIndexes?.delete(ev.index);
}
function v264_ensureGameEventElements(ev){
  if(!game||ev.status==='skipped')return[];
  if(ev.elements?.length)return ev.elements;
  const layer=$('#noteLayer');
  const info=game.stringInfo||STRING_INFO;
  const count=info.length||STRING_INFO.length;
  const shape=Array.isArray(ev.chordNotes)&&ev.chordNotes.length?ev.chordNotes:[{string:ev.string,fret:ev.fret,midi:ev.midi,technique:ev.technique}];
  ev.elements=shape.map(note=>{
    const el=document.createElement('div');
    const technique=note.technique||ev.technique||'';
    const fret=Number(note.fret)||0;
    const stringIndex=Number(note.string)||0;
    const string=info[stringIndex]||STRING_INFO[stringIndex]||{};
    const stringNumber=Number(string.number)||count-stringIndex;
    const stringName=`${string.label||'?'}${stringNumber}`;
    el.className=`falling-note string-${stringIndex} ${game.listenOnly?'listen-note':''} ${fret===0?'open-note':''} ${technique?'has-technique':''} ${shape.length>1?'chord-note':''}`;
    el.style.setProperty('--string-color',string.color||STRING_INFO[stringIndex%STRING_INFO.length]?.color||'#a8f23d');
    el.innerHTML=`<span class="note-string">${escapeHtml(stringName)}</span><b>${fret===0?'OPEN':fret}</b>${technique?`<small>${escapeHtml(technique)}</small>`:''}`;
    el.dataset.eventIndex=ev.index;
    el.dataset.stringIndex=stringIndex;
    el.dataset.fret=fret;
    el.dataset.chordSize=shape.length;
    if(ev.status!=='pending')el.classList.add(ev.status);
    layer.appendChild(el);
    return el;
  });
  ev.element=ev.elements[0]||null;
  game.renderedEventIndexes.add(ev.index);
  return ev.elements;
}
function v264_syncRenderedEvents(startIndex,endIndex){
  if(!game)return;
  for(const index of game.renderedEventIndexes){
    if(index<startIndex||index>=endIndex)releaseGameEventElements(game.events[index]);
  }
  for(let i=startIndex;i<endIndex;i++)if(game.events[i]?.status!=='skipped')ensureGameEventElements(game.events[i]);
}
function v264_tabPercentForClock(value,t){
  const playhead=28;
  const before=Math.max(1,Number(game?.tabBefore)||1);
  const after=Math.max(1,Number(game?.tabAfter)||1);
  const dt=Number(value)-Number(t);
  if(dt>=0)return playhead+Math.min(1,dt/after)*(96-playhead);
  return playhead-Math.min(1,-dt/before)*(playhead-7);
}
function v264_recordFramePerformance(now){
  const p=game?.perf;if(!p)return;
  if(p.lastFrameAt){
    const delta=Math.max(0,now-p.lastFrameAt);
    p.frameSamples[p.frameCursor]=delta;
    p.frameCursor=(p.frameCursor+1)%p.frameSamples.length;
    p.frameSampleCount=Math.min(p.frameSamples.length,p.frameSampleCount+1);
  }
  p.lastFrameAt=now;
  if(now-p.lastUiAt>=500){p.lastUiAt=now;updatePerformanceDiagnostics();}
}
function v264_getPerformanceSnapshot(){
  const p=game?.perf;
  let avg=0,worst=0;
  if(p?.frameSampleCount){
    for(let i=0;i<p.frameSampleCount;i++){const value=Number(p.frameSamples[i])||0;avg+=value;worst=Math.max(worst,value);}
    avg/=p.frameSampleCount;
  }
  const tickAge=game?.lastSongClockUpdate?Math.max(0,performance.now()-game.lastSongClockUpdate):null;
  return{
    version:APP_VERSION,
    fps:avg>0?1000/avg:0,
    averageFrameMs:avg,
    worstFrameMs:worst,
    totalEvents:game?.events?.length||0,
    activeEvents:game?.activeTotal||0,
    completedEvents:game?.completedCount||0,
    renderedEvents:game?.renderedEventIndexes?.size||0,
    tabEvents:game?.tabVisibleEventCount||0,
    pitchAnalysisMs:Number(audio?.analysisMs)||0,
    pitchAnalysisHz:Number(audio?.analysisHz)||0,
    inputAnalysisEnabled:Boolean(performanceDiagnostics.inputAnalysisEnabled),
    clockSource:usesSongBackingClock()?'AlphaTab ticks':'local seconds',
    songClockTick:Number(game?.songClockTick)||0,
    backingTickAgeMs:tickAge
  };
}
function v264_updatePerformanceDiagnostics(){
  const el=$('#gamePerfStats');if(!el)return;
  const s=getPerformanceSnapshot();
  const age=s.backingTickAgeMs==null?'—':`${Math.round(s.backingTickAgeMs)} ms`;
  el.textContent=`FPS ${s.fps?s.fps.toFixed(0):'—'} · frame ${s.averageFrameMs?s.averageFrameMs.toFixed(1):'—'} ms (worst ${s.worstFrameMs?s.worstFrameMs.toFixed(1):'—'}) · events ${s.totalEvents} · rendered ${s.renderedEvents} · tab ${s.tabEvents} · pitch ${s.pitchAnalysisMs?s.pitchAnalysisMs.toFixed(1):'—'} ms @ ${s.pitchAnalysisHz?s.pitchAnalysisHz.toFixed(0):'—'} Hz · clock ${s.clockSource} · tick age ${age}`;
}

function v264_launchLevel(levelOrId,freePractice=false){
  const isSongLevel=levelOrId&&typeof levelOrId==='object';
  const level=isSongLevel?levelOrId:flatLevels.find(l=>l.id===levelOrId);
  if(!level)return;
  if(!freePractice&&!isSongLevel&&!isLevelUnlocked(flatLevels.findIndex(l=>l.id===level.id))){toast('Earn a star on the previous mission first.');return;}
  stopGameLoop();
  $('#gameScreen').classList.remove('playing');
  const stringInfo=level.stringInfo||STRING_INFO;
  const secondsPerBeat=60/Math.max(20,Number(level.bpm)||80);
  const practiceKey=levelPracticeKey(level);
  const density=Math.max(.5,Math.min(1,Number(state.levelDensity?.[practiceKey]??state.settings?.noteDensity)||1));
  const sourceNotes=density>=1?level.notes:level.notes.filter((_,i)=>i===0||Math.floor((i+1)*density)>Math.floor(i*density));
  const events=sourceNotes.map((n,i)=>({
    ...n,index:i,
    time:Number.isFinite(n.time)?n.time:n.beat*secondsPerBeat,
    clock:level.mode==='song'&&level.songSpec?.backingEnabled&&Number.isFinite(n.tick)?n.tick-Number(level.sectionStartTick||0):(Number.isFinite(n.time)?n.time:n.beat*secondsPerBeat),
    durationClock:level.mode==='song'&&level.songSpec?.backingEnabled?Math.max(0,Number(n.durationTicks)||0):Math.max(0,Number(n.duration)||(Number(n.durationTicks)||0)/960)*secondsPerBeat,
    midi:Number.isFinite(n.midi)?n.midi:(stringInfo[n.string]?.openMidi??STRING_INFO[n.string]?.openMidi??40)+n.fret,
    measure:Number.isFinite(n.measure)?Number(n.measure):Math.floor(Math.max(0,Number(n.beat)||0)/4)+1,
    status:'pending',element:null,elements:[]
  })).sort((a,b)=>a.clock-b.clock).map((e,i)=>({...e,index:i}));
  if(!events.length){toast('This section has no playable guitar notes.');return;}
  game={
    mode:level.mode||'mission',level,practiceKey,density,stringInfo,events,running:false,paused:false,startPerf:0,songClockTick:0,songTempo:Number(level.bpm)||80,pausedAt:0,raf:0,
    hits:0,misses:0,combo:0,bestCombo:0,score:0,loop:false,loopStart:0,loopEnd:null,restartingLoop:false,startToken:0,listenOnly:Boolean(level.listenOnly),lastWrongFeedback:0,lastAcceptedPitchClass:null,lastAcceptedEvent:-1,
    activeTotal:events.length,completedCount:0,nextPendingIndex:0,expireIndex:0,renderedEventIndexes:new Set(),tabWindowClockStart:-Infinity,tabWindowClockEnd:-Infinity,tabBefore:0,tabAfter:0,tabVisibleEventCount:0,tabPositionElements:[],fretWindowStart:1,lastSongClockUpdate:0,
    perf:{frameSamples:new Array(120),frameCursor:0,frameSampleCount:0,lastFrameAt:0,lastUiAt:0},
    startedAtDate:Date.now(),endTime:(events.at(-1)?.time||0)+1.2,
    endClock:Number(level.sectionEndTick)>Number(level.sectionStartTick)?Number(level.sectionEndTick)-Number(level.sectionStartTick):null
  };
  tabCurrentIndex=-1;
  $('#gameScreen').hidden=false;
  setGameView(state.settings?.gameView||'highway');
  $('#resultScreen').hidden=true;
  $('#gameStart').hidden=false;
  $('#gameNoteDensity').value=String(density);
  $('#gameAdaptive').checked=state.settings?.adaptiveDifficulty!==false;
  $('#resultEyebrow').textContent=game.mode==='song'?'SONG SECTION COMPLETE':'MISSION COMPLETE';
  $('#backToMap').textContent=game.mode==='song'?'Back to Song':'Mission Map';
  $('#gameWorldLabel').textContent=game.mode==='song'?`SONG LEVEL · ${String(level.trackName||'GUITAR').toUpperCase()}`:`WORLD ${level.worldNumber} · ${level.worldTitle.toUpperCase()}`;
  $('#gameLevelTitle').textContent=level.title;
  $('#gameLessonTag').textContent=level.tag;
  $('#gameLessonHeadline').textContent=level.headline;
  $('#gameLessonText').textContent=level.lesson;
  $('#tabHint').textContent=level.hint;
  $('#gameStart').textContent=!performanceDiagnostics.inputAnalysisEnabled?'Start Diagnostic Run':audio.active?(game.mode==='song'?'Start Song Level':'Start Mission'):'Enable Guitar & Start';
  $('#gameStart').disabled=false;
  $('#gamePause').disabled=true;
  $('#gamePause').textContent='Pause';
  $('#gameLoop').textContent='↻ Loop Off';
  $('#gameLoop').setAttribute('aria-pressed','false');
  $('#gameCountIn').checked=state.settings?.countIn!==false;
  $('#gameLoopStart').hidden=$('#gameLoopEnd').hidden=game.mode!=='song';
  $('#gameLoopStart').textContent='A · Start';
  $('#gameLoopEnd').textContent='B · End';
  $('#gameScore').textContent='0';
  $('#gameAccuracy').textContent='100%';
  $('#gameCombo').textContent='0';
  $('#gameHearing').textContent=audio.lastResult?.note||'—';
  $('#nextNoteText').textContent=formatExpected(events[0]);
  $('#gameProgressBar').style.width='0%';
  const perfInput=$('#gamePerfInputAnalysis');if(perfInput)perfInput.checked=performanceDiagnostics.inputAnalysisEnabled;
  const perfStats=$('#gamePerfStats');if(perfStats)perfStats.textContent=`Ready · ${events.length} total events`;
  renderStringLabels();
  renderGameNotes();
  renderLiveTabWindow(0);
  updateGameBoard(0);
  updatePerformanceDiagnostics();
}

async function v264_startMission(){
  if(!game||game.running)return;
  const startingGame=game;
  const startToken=++game.startToken;
  $('#gameStart').disabled=true;
  $('#gameStart').textContent='Getting input…';
  try{
    if(!game.listenOnly&&performanceDiagnostics.inputAnalysisEnabled&&!audio.active)await startAudioInput(selectedDeviceId);
    $('#gameScreen').classList.add('playing');
    if(state.settings?.countIn!==false)await runCountdown(game.songTempo,game.level?.songSpec?.speed||1);
    if(game!==startingGame||startToken!==game.startToken||!$('#gameScreen').classList.contains('playing'))return;
    if(usesSongBackingClock()){
      configureSongBacking(game.level);
      if(!alphaApi.play())throw new Error('Backing player is not ready yet.');
    }
    game.running=true;
    game.startPerf=performance.now();
    game.paused=false;
    game.perf.lastFrameAt=0;
    $('#gameStart').hidden=true;
    $('#gamePause').disabled=false;
    game.raf=requestAnimationFrame(gameLoop);
  }catch(err){
    console.error(err);
    $('#gameScreen').classList.remove('playing');
    $('#gameStart').disabled=false;
    $('#gameStart').textContent=performanceDiagnostics.inputAnalysisEnabled?'Try Guitar Input Again':'Start Diagnostic Run';
    toast(performanceDiagnostics.inputAnalysisEnabled?'I could not access the guitar input. Check Chrome microphone permission.':'Could not start this diagnostic run.');
  }
}

function v264_gameLoop(now){
  if(!game?.running)return;
  if(game.paused){game.raf=requestAnimationFrame(gameLoop);return;}
  recordFramePerformance(now);
  const t=currentGameClock(now);
  updateGameBoard(t);
  markExpiredNotes(t);
  updateCurrentTab(t);
  const total=Math.max(1,Number(game.activeTotal)||0);
  const done=Math.min(total,Number(game.completedCount)||0);
  $('#gameProgressBar').style.width=`${Math.min(100,(done/total)*100)}%`;
  const endClock=game.loop&&Number.isFinite(game.loopEnd)?game.loopEnd:usesSongBackingClock()?(game.endClock??game.events.at(-1)?.clock):game.endTime;
  if(t>=endClock&&done>=total){
    if(game.loop){restartPracticeLoop();return;}
    finishMission();return;
  }
  game.raf=requestAnimationFrame(gameLoop);
}

async function v264_restartPracticeLoop(){
  if(!game||game.restartingLoop)return;
  game.restartingLoop=true;
  const loopGame=game;
  game.running=false;
  cancelAnimationFrame(game.raf);
  if(usesSongBackingClock())alphaApi?.pause?.();
  const start=Number.isFinite(game.loopStart)?game.loopStart:0;
  const end=Number.isFinite(game.loopEnd)?game.loopEnd:(usesSongBackingClock()?game.endClock:game.endTime);
  let activeTotal=0;
  game.events.forEach(ev=>{ev.status=ev.clock>=start&&ev.clock<=end?'pending':'skipped';if(ev.status==='pending')activeTotal++;});
  renderGameNotes();
  game.activeTotal=activeTotal;
  game.completedCount=0;
  game.hits=0;game.misses=0;game.combo=0;game.score=0;game.songClockTick=start;
  game.nextPendingIndex=lowerBoundClock(game.events,start);
  game.expireIndex=game.nextPendingIndex;
  advancePendingIndex();
  tabCurrentIndex=-1;
  game.tabWindowClockStart=-Infinity;game.tabWindowClockEnd=-Infinity;
  updateGameHud();
  renderLiveTabWindow(start);
  updateGameBoard(start);
  if(state.settings?.countIn!==false)await runCountdown(game.songTempo,game.level?.songSpec?.speed||1);
  if(game!==loopGame||!$('#gameScreen').classList.contains('playing')){loopGame.restartingLoop=false;return;}
  if(usesSongBackingClock()){
    configureSongBacking(game.level);
    const absoluteStart=Number(game.level.sectionStartTick||0)+start;
    alphaApi.tickPosition=absoluteStart;
    game.songClockTick=start;
    alphaApi.play();
  }
  game.startPerf=performance.now()-start*1000;
  game.running=true;
  game.restartingLoop=false;
  game.perf.lastFrameAt=0;
  game.raf=requestAnimationFrame(gameLoop);
}

function v264_updateGameBoard(t){
  if(!game)return;
  const board=$('#gameBoard');
  const rect=board.getBoundingClientRect();
  const hitY=rect.height-58,spawnY=48;
  const hitX=Math.max(118,rect.width*.16),spawnX=rect.width-44;
  const clock=gameClockWindows();
  const [startIndex,endIndex]=eventClockRange(t-clock.expired,t+clock.lookahead);
  syncRenderedEvents(startIndex,endIndex);
  updateFretWindow(t,clock.lookahead);
  renderBeatMarkers(t,clock,spawnY,hitY,hitX,spawnX);
  const flatView=$('#gameScreen').classList.contains('tab-mode');
  const count=stringCount();
  for(let i=startIndex;i<endIndex;i++){
    const ev=game.events[i];if(!ev?.elements?.length)continue;
    const dt=ev.clock-t;
    const progress=Math.max(0,Math.min(1.08,1-dt/clock.lookahead));
    const y=spawnY+progress*(hitY-spawnY);
    const scale=.58+.42*Math.min(1,progress);
    const sustainTravel=flatView?hitY-spawnY:spawnX-hitX;
    const sustain=Math.min(flatView?110:190,Math.max(0,Number(ev.durationClock||0)/clock.lookahead*sustainTravel));
    ev.elements.forEach(el=>{
      const stringIndex=Number(el.dataset.stringIndex);
      const x=flatView?rect.width*((stringIndex+.5)/count):spawnX-progress*(spawnX-hitX);
      const laneTop=58,laneBottom=rect.height-35;
      const laneY=laneTop+((count-1-stringIndex)+.5)/count*(laneBottom-laneTop);
      const stringOffset=flatView?0:laneY-y;
      el.hidden=false;
      el.style.left=`${x}px`;
      el.style.top=`${y+stringOffset}px`;
      el.style.transform=`translate(-50%,-50%) scale(${scale})`;
      el.style.setProperty('--sustain-length',`${sustain}px`);
    });
  }
  advancePendingIndex();
  const next=game.events[game.nextPendingIndex];
  $('#nextNoteText').textContent=next?formatExpected(next):'Finish strong!';
  updateHighwayFocus(next);
}

function v264_updateHighwayFocus(next){
  if(!next)return;
  const shape=Array.isArray(next.chordNotes)&&next.chordNotes.length?next.chordNotes:[next];
  const activeStrings=new Set(shape.map(note=>Number(note.string)));
  $$('.string-labels span').forEach(label=>label.classList.toggle('active',activeStrings.has(Number(label.dataset.string))));
  const frets=eventFrets(next);
  $$('.fret-lane').forEach(lane=>lane.classList.toggle('active',frets.includes(Number(lane.dataset.fret))||(!frets.length&&Number(lane.dataset.fret)===0)));
  const info=game.stringInfo||STRING_INFO;
  const count=info.length||STRING_INFO.length;
  const cue=shape.map(note=>{
    const string=info[note.string]||STRING_INFO[note.string]||{};
    const number=Number(string.number)||count-Number(note.string);
    return `${string.label||'?'}${number} ${Number(note.fret)===0?'OPEN':note.fret}`;
  }).join(' · ');
  $('#handPosition').classList.toggle('open-focus',!frets.length);
  $('#handPosition').classList.toggle('chord-focus',shape.length>1);
  $('#handPositionText').textContent=cue;
}

function v264_updateFretWindow(t,lookahead){
  const [startIndex,endIndex]=eventClockRange(t-.15*lookahead,t+lookahead*.72);
  let anchor=Infinity,max=-Infinity;
  for(let i=startIndex;i<endIndex;i++){
    const ev=game.events[i];if(ev.status!=='pending')continue;
    const frets=eventFrets(ev);
    for(const fret of frets){anchor=Math.min(anchor,fret);max=Math.max(max,fret);}
  }
  let nextStart=Number.isFinite(anchor)?Math.max(1,anchor-1):1;
  if(Number.isFinite(max)&&max-nextStart>4)nextStart=Math.max(1,max-4);
  if(nextStart===game.fretWindowStart)return;
  game.fretWindowStart=nextStart;
  renderFretboard();
}

function v264_markExpiredNotes(t){
  if(!game)return;
  const hit=gameClockWindows().hit;
  while(game.expireIndex<game.events.length){
    const ev=game.events[game.expireIndex];
    const ready=game.listenOnly?t>=ev.clock:t>ev.clock+hit;
    if(!ready)break;
    if(ev.status==='pending'){if(game.listenOnly)markDemo(ev);else markMiss(ev);}
    game.expireIndex++;
  }
}
function v264_markDemo(ev){
  if(ev.status!=='pending')return;
  ev.status='demo';game.hits++;game.completedCount++;
  ev.elements.forEach(el=>el.classList.add('demo'));
  updateTabEvent(ev);advancePendingIndex();updateGameHud();
}

function v264_updateCurrentTab(t){
  if(!game)return;
  const before=Math.max(1,Number(game.tabBefore)||gameClockWindows().lookahead*.25);
  const after=Math.max(1,Number(game.tabAfter)||gameClockWindows().lookahead*1.35);
  if(!Number.isFinite(game.tabWindowClockStart)||t<game.tabWindowClockStart+before*.25||t>game.tabWindowClockEnd-after*.35)renderLiveTabWindow(t);
  (game.tabPositionElements||[]).forEach(el=>{el.style.left=`${tabPercentForClock(Number(el.dataset.tabClock),t)}%`;});
  advancePendingIndex();
  const closest=game.nextPendingIndex<game.events.length?game.nextPendingIndex:-1;
  if(closest===tabCurrentIndex)return;
  tabCurrentIndex=closest;
  $$('.tab-cell.current',$('#liveTab')).forEach(c=>c.classList.remove('current'));
  if(closest>=0)$$(`[data-tab-event="${closest}"]`,$('#liveTab')).forEach(c=>c.classList.add('current'));
}

function v264_renderGameNotes(){
  const layer=$('#noteLayer');
  if(!game||!layer)return;
  for(const index of game.renderedEventIndexes||[])if(game.events[index]){game.events[index].elements=[];game.events[index].element=null;}
  layer.innerHTML='';
  game.renderedEventIndexes=new Set();
}
function v264_renderLiveTabWindow(centerClock=0){
  const wrap=$('#liveTab');if(!wrap||!game)return;
  const info=game.stringInfo||STRING_INFO;
  const clock=gameClockWindows();
  const before=Math.max(clock.unitsPerSecond*.6,clock.lookahead*.22);
  const after=Math.max(clock.unitsPerSecond*3.2,clock.lookahead*1.35);
  game.tabBefore=before;game.tabAfter=after;
  game.tabWindowClockStart=Math.max(0,centerClock-before);
  game.tabWindowClockEnd=centerClock+after;
  let [startIndex,endIndex]=eventClockRange(game.tabWindowClockStart,game.tabWindowClockEnd);
  const centerIndex=lowerBoundClock(game.events,centerClock);
  if(endIndex-startIndex>48){
    startIndex=Math.max(startIndex,centerIndex-12);
    endIndex=Math.min(game.events.length,startIndex+48);
    if(endIndex-startIndex<48)startIndex=Math.max(0,endIndex-48);
  }
  const visibleEvents=[];
  for(let i=startIndex;i<endIndex;i++)if(game.events[i].status!=='skipped')visibleEvents.push(game.events[i]);
  game.tabVisibleEventCount=visibleEvents.length;
  const rows=Array.from({length:info.length},(_,i)=>info.length-1-i);
  const measureMarkers=[];let priorMeasure=null;
  for(const ev of visibleEvents){
    const measure=Number(ev.measure)||null;
    if(measure&&measure!==priorMeasure){measureMarkers.push(`<i class="tab-measure-marker" data-tab-clock="${ev.clock}" style="left:${tabPercentForClock(ev.clock,centerClock)}%"><small>${measure}</small></i>`);priorMeasure=measure;}
  }
  wrap.innerHTML=`<div class="tab-staff"><i class="tab-playhead" aria-hidden="true"><small>NOW</small></i><div class="tab-measures" aria-hidden="true">${measureMarkers.join('')}</div>${rows.map(stringIndex=>{
    const string=info[stringIndex]||{};
    const label=string.label||`S${info.length-stringIndex}`;
    const number=Number(string.number)||info.length-stringIndex;
    const color=string.color||STRING_INFO[stringIndex%STRING_INFO.length]?.color||'#a8f23d';
    const notes=[];
    for(const ev of visibleEvents){
      const shape=Array.isArray(ev.chordNotes)&&ev.chordNotes.length?ev.chordNotes:[ev];
      const tabNote=shape.find(note=>Number(note.string)===stringIndex);if(!tabNote)continue;
      const fret=Number(tabNote.fret)||0;
      notes.push(`<span class="tab-cell tab-note ${ev.status!=='pending'?ev.status:''}" data-tab-event="${ev.index}" data-tab-clock="${ev.clock}" style="left:${tabPercentForClock(ev.clock,centerClock)}%;--string-color:${color}" aria-label="${escapeHtml(label)}${number} ${fret===0?'open':`fret ${fret}`}">${fret}</span>`);
    }
    return `<div class="tab-line-row" data-tab-string="${stringIndex}" style="--string-color:${color}"><span class="tab-row-label">${escapeHtml(label)}<small>${number}</small></span><i class="tab-string-line" aria-hidden="true"></i>${notes.join('')}</div>`;
  }).join('')}</div>`;
  game.tabPositionElements=$$('[data-tab-clock]',wrap);
}

function v264_handleAudioFrame(result){
  if(inputCalibration&&result.freq&&result.rms>.001)inputCalibration.samples.push(result.rms);
  updateInputMonitor(result);
  if(tunerActive)updateTuner(result);
  if(!performanceDiagnostics.inputAnalysisEnabled||!game?.running||game.paused||!result.freq)return;
  $('#gameHearing').textContent=result.note||'—';
  const t=currentGameClock(performance.now());
  const hitWindow=gameClockWindows().hit;
  const [startIndex,endIndex]=eventClockRange(t-hitWindow,t+hitWindow);
  let best=null,bestDelta=Infinity,expected=null,expectedDelta=Infinity;
  for(let i=startIndex;i<endIndex;i++){
    const ev=game.events[i];if(ev.status!=='pending')continue;
    const delta=Math.abs(ev.clock-t);
    if(delta<expectedDelta){expected=ev;expectedDelta=delta;}
    if(delta<bestDelta&&pitchMatches(result.freq,midiToFreq(ev.midi))){best=ev;bestDelta=delta;}
  }
  if(!best){
    if(expected&&result.onset&&performance.now()-game.lastWrongFeedback>500){game.lastWrongFeedback=performance.now();showGameFeedback('WRONG NOTE','miss',expected);}
    return;
  }
  const pitchClass=best.midi%12;
  const repeatedPitch=game.lastAcceptedPitchClass===pitchClass;
  if(repeatedPitch&&!result.onset)return;
  markHit(best,t);
  game.lastAcceptedPitchClass=pitchClass;
  game.lastAcceptedEvent=best.index;
}
function v264_markHit(ev,t){
  if(ev.status!=='pending')return;
  ev.status='hit';ev.timingMs=(t-ev.clock)/gameClockWindows().unitsPerSecond*1000;
  game.hits++;game.completedCount++;game.combo++;game.bestCombo=Math.max(game.bestCombo,game.combo);
  const timing=Math.abs(ev.clock-t)/gameClockWindows().unitsPerSecond;
  const timingBonus=timing<.12?60:timing<.24?30:0;
  game.score+=100+timingBonus+Math.min(100,game.combo*4);
  ev.elements.forEach(el=>el.classList.add('hit'));
  updateTabEvent(ev);
  const signedTiming=(t-ev.clock)/gameClockWindows().unitsPerSecond;
  const feedback=timing<.1?'PERFECT!':signedTiming<0?'EARLY':'LATE';
  showGameFeedback(feedback,'hit',ev);advancePendingIndex();updateGameHud();
}
function v264_markMiss(ev){
  if(ev.status!=='pending')return;
  ev.status='miss';game.misses++;game.completedCount++;game.combo=0;
  ev.elements.forEach(el=>el.classList.add('miss'));
  updateTabEvent(ev);showGameFeedback('MISS','miss',ev);advancePendingIndex();updateGameHud();
}
function v264_showGameFeedback(text,type,ev=null){
  const el=$('#gameFeedback');clearTimeout(feedbackTimer);el.textContent=text;el.className=`game-feedback show ${type}`;
  if(ev&&!$('#gameScreen').classList.contains('tab-mode')){
    const board=$('#gameBoard').getBoundingClientRect(),count=stringCount();
    el.style.top=`${58+((count-1-Number(ev.string))+.5)/count*(board.height-93)}px`;
    el.style.left=`${Math.max(118,board.width*.16)+72}px`;el.style.bottom='auto';
  }else{el.style.top='';el.style.left='50%';el.style.bottom='';}
  feedbackTimer=setTimeout(()=>{el.className='game-feedback';},350);
}

function v264_setupSongGame(score){
  const tracks=Array.from(score?.tracks||[]);
  loadedSongTracks=tracks.map((track,index)=>{
    const staff=getFrettedStaff(track);
    const bars=staff?Array.from(staff.bars||[]):[];
    const stringCount=staff?getStaffTuning(staff).length:0;
    const noteCount=staff?countPlayableNotes(staff):0;
    return{index,track,staff,bars,stringCount,noteCount,playable:Boolean(staff&&stringCount===STRING_INFO.length&&noteCount>0)};
  });
  const playable=loadedSongTracks.filter(t=>t.playable),select=$('#songTrackSelect');
  select.innerHTML=loadedSongTracks.map(t=>{
    const name=t.track?.name||t.track?.shortName||`Track ${t.index+1}`;
    const detail=t.playable?`${t.stringCount} strings · ${t.noteCount} notes`:`not a ${STRING_INFO.length}-string guitar track`;
    return `<option value="${t.index}" ${t.playable?'':'disabled'}>${escapeHtml(name)} — ${detail}</option>`;
  }).join('');
  if(!playable.length){$('#songGameSetup').hidden=false;$('#songGameInfo').textContent=`I could not find a playable ${STRING_INFO.length}-string guitar track in this file.`;$('#playSongAsLevel').disabled=true;$('#songSectionSelect').innerHTML='<option>No playable sections</option>';return;}
  select.value=String(playable[0].index);$('#playSongAsLevel').disabled=false;$('#songGameSetup').hidden=false;
  $('#songGameInfo').textContent=`${playable.length} playable guitar track${playable.length===1?'':'s'} found. Full chord shapes are shown; the selected low or high anchor lets the microphone score them reliably.`;
  updateSongSectionOptions();updateSongLevelPreview();
}
function v264_countPlayableNotes(staff){
  let count=0;
  const tuningCount=getStaffTuning(staff).length||STRING_INFO.length;
  Array.from(staff?.bars||[]).forEach(bar=>Array.from(bar?.voices||[]).forEach(voice=>Array.from(voice?.beats||[]).forEach(beat=>{
    Array.from(beat?.notes||[]).forEach(note=>{const str=Number(note?.string),fret=Number(note?.fret);if(Number.isFinite(str)&&str>=1&&str<=tuningCount&&Number.isFinite(fret)&&fret>=0&&!note.isDead&&!note.tieOrigin)count++;});
  })));
  return count;
}
function v264_makeStringInfoFromStaff(staff){
  const tuningTopToBottom=getStaffTuning(staff);
  const tuningLowToHigh=tuningTopToBottom.length?[...tuningTopToBottom].reverse():STRING_INFO.map(s=>s.openMidi);
  const count=tuningLowToHigh.length;
  return tuningLowToHigh.map((midi,i)=>{
    const name=midiToName(Math.round(midi)),pitch=name.replace(/\d+$/,'');
    return{label:count===6&&i===count-1&&pitch==='E'?'e':pitch,number:count-i,name:`String ${count-i} (${name})`,openMidi:Math.round(midi),color:STRING_INFO[i%STRING_INFO.length]?.color||'#a8f23d'};
  });
}

function v264_createAudioEngine(){
  const listeners=new Set();
  return{
    context:null,stream:null,source:null,analyser:null,buffer:null,active:false,raf:0,lastTick:0,
    lastResult:{freq:null,rms:0,note:'—',onset:false,midi:null},envelope:0,lastMidi:null,noiseGate:.018,deviceId:'',analysisMs:0,analysisHz:0,_analysisCount:0,_analysisWindowAt:0,
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    async ensureContext(){if(!this.context)this.context=new(window.AudioContext||window.webkitAudioContext)();if(this.context.state==='suspended')await this.context.resume();return this.context;},
    async start(deviceId=''){
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Audio input is not supported in this browser.');
      this.stop(false);
      const constraints={audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1}};
      if(deviceId)constraints.audio.deviceId={exact:deviceId};
      this.stream=await navigator.mediaDevices.getUserMedia(constraints);
      this.deviceId=this.stream.getAudioTracks()[0]?.getSettings()?.deviceId||deviceId||'';
      const ctx=await this.ensureContext();
      this.source=ctx.createMediaStreamSource(this.stream);this.analyser=ctx.createAnalyser();this.analyser.fftSize=2048;this.analyser.smoothingTimeConstant=0;this.buffer=new Float32Array(this.analyser.fftSize);this.source.connect(this.analyser);
      this.active=true;this.envelope=0;this.lastMidi=null;this.analysisMs=0;this.analysisHz=0;this._analysisCount=0;this._analysisWindowAt=performance.now();
      const tick=now=>{
        if(!this.active)return;
        if(now-this.lastTick>=42){
          this.lastTick=now;this.analyser.getFloatTimeDomainData(this.buffer);
          const analysisStarted=performance.now();
          const raw=autoCorrelate(this.buffer,ctx.sampleRate,this.noiseGate);
          const cost=performance.now()-analysisStarted;
          this.analysisMs=this.analysisMs?this.analysisMs*.85+cost*.15:cost;
          this._analysisCount++;
          if(now-this._analysisWindowAt>=1000){this.analysisHz=this._analysisCount*1000/Math.max(1,now-this._analysisWindowAt);this._analysisCount=0;this._analysisWindowAt=now;}
          const prevEnvelope=this.envelope;this.envelope=prevEnvelope*.82+raw.rms*.18;
          const onset=raw.rms>this.noiseGate&&raw.rms>Math.max(this.noiseGate*1.4,prevEnvelope*1.38);
          let result={freq:raw.freq,rms:raw.rms,onset,note:'—',midi:null};
          if(raw.freq){const midiFloat=69+12*Math.log2(raw.freq/440),midi=Math.round(midiFloat);result.midi=midi;result.note=midiToName(midi);}
          this.lastResult=result;listeners.forEach(fn=>{try{fn(result);}catch(err){console.error(err);}});
        }
        this.raf=requestAnimationFrame(tick);
      };
      this.raf=requestAnimationFrame(tick);
    },
    stop(updateUi=true){
      if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.stream?.getTracks().forEach(t=>t.stop());try{this.source?.disconnect();}catch{}
      this.stream=null;this.source=null;this.analyser=null;this.buffer=null;this.active=false;this.analysisHz=0;
      this.lastResult={freq:null,rms:0,note:'—',onset:false,midi:null};if(updateUi)updateInputButtons();
    }
  };
}

let app=read('app.js');
app=app.replace("const APP_VERSION = '2.6.3';",`const APP_VERSION = '${VERSION}';`);
app=app.replace("navigator.serviceWorker.register('./sw.js?v=2.6.3')",`navigator.serviceWorker.register('./sw.js?v=${VERSION}')`);
app=replaceOnce(app,'  let dailyPractice = null;\n','  let dailyPractice = null;\n  const performanceDiagnostics = { inputAnalysisEnabled:true };\n','performance diagnostics state');
app=replaceOnce(app,"    $('#showNoteHighway').addEventListener('click', () => setGameView('highway'));\n",`    const perfInput=$('#gamePerfInputAnalysis');\n    if(perfInput){\n      perfInput.checked=performanceDiagnostics.inputAnalysisEnabled;\n      perfInput.addEventListener('change',async e=>{\n        performanceDiagnostics.inputAnalysisEnabled=Boolean(e.target.checked);\n        if(!performanceDiagnostics.inputAnalysisEnabled&&audio.active)audio.stop();\n        else if(performanceDiagnostics.inputAnalysisEnabled&&game?.running&&!game.listenOnly&&!audio.active){try{await startAudioInput(selectedDeviceId);}catch(err){console.error(err);toast('Could not restart Guitar input.');}}\n        if(game&&!game.running)$('#gameStart').textContent=performanceDiagnostics.inputAnalysisEnabled?(audio.active?(game.mode==='song'?'Start Song Level':'Start Mission'):'Enable Guitar & Start'):'Start Diagnostic Run';\n        updatePerformanceDiagnostics();\n      });\n    }\n    $('#showNoteHighway').addEventListener('click', () => setGameView('highway'));\n`,'bind performance diagnostics');
app=replaceNamedFunction(app,'launchLevel','levelPracticeKey',v264_launchLevel);
app=replaceNamedFunction(app,'startMission','runCountdown',v264_startMission);
app=replaceNamedFunction(app,'gameLoop','restartPracticeLoop',v264_gameLoop);
app=replaceNamedFunction(app,'restartPracticeLoop','guitarLoopLimit',v264_restartPracticeLoop);
app=insertBeforeFunction(app,'updateGameBoard',[
  [v264_lowerBoundClock,'lowerBoundClock'],[v264_upperBoundClock,'upperBoundClock'],[v264_eventClockRange,'eventClockRange'],[v264_stringCount,'stringCount'],[v264_advancePendingIndex,'advancePendingIndex'],[v264_releaseGameEventElements,'releaseGameEventElements'],[v264_ensureGameEventElements,'ensureGameEventElements'],[v264_syncRenderedEvents,'syncRenderedEvents'],[v264_tabPercentForClock,'tabPercentForClock'],[v264_recordFramePerformance,'recordFramePerformance'],[v264_getPerformanceSnapshot,'getPerformanceSnapshot'],[v264_updatePerformanceDiagnostics,'updatePerformanceDiagnostics']
]);
app=replaceNamedFunction(app,'updateGameBoard','updateHighwayFocus',v264_updateGameBoard);
app=replaceNamedFunction(app,'updateHighwayFocus','eventFrets',v264_updateHighwayFocus);
app=replaceNamedFunction(app,'updateFretWindow','renderFretboard',v264_updateFretWindow);
app=replaceNamedFunction(app,'markExpiredNotes','markDemo',v264_markExpiredNotes);
app=replaceNamedFunction(app,'markDemo','updateCurrentTab',v264_markDemo);
app=replaceNamedFunction(app,'updateCurrentTab','renderStringLabels',v264_updateCurrentTab);
app=replaceNamedFunction(app,'renderGameNotes','renderLiveTab',v264_renderGameNotes);
app=replaceNamedFunction(app,'renderLiveTabWindow','updateTabEvent',v264_renderLiveTabWindow);
app=replaceNamedFunction(app,'handleAudioFrame','markHit',v264_handleAudioFrame);
app=replaceNamedFunction(app,'markHit','markMiss',v264_markHit);
app=replaceNamedFunction(app,'markMiss','updateGameHud',v264_markMiss);
app=replaceNamedFunction(app,'showGameFeedback','finishMission',v264_showGameFeedback);
app=replaceNamedFunction(app,'createAudioEngine','autoCorrelate',v264_createAudioEngine);
app=replaceNamedFunction(app,'setupSongGame','getFrettedStaff',v264_setupSongGame);
app=replaceNamedFunction(app,'countPlayableNotes','updateSongSectionOptions',v264_countPlayableNotes);
app=replaceNamedFunction(app,'makeStringInfoFromStaff','destroyAlphaTab',v264_makeStringInfoFromStaff);
app=replaceOnce(app,'    const bars = meta.bars.slice(spec.startBar, spec.endBar);\n','    const bars = meta.bars.slice(spec.startBar, spec.endBar);\n    const stringCount = Math.max(1, Number(meta.stringCount) || STRING_INFO.length);\n','import string count');
app=app.replace('return Number.isFinite(str) && str >= 1 && str <= 6 && Number.isFinite(fret) && fret >= 0 && !note.isDead && !note.tieOrigin;','return Number.isFinite(str) && str >= 1 && str <= stringCount && Number.isFinite(fret) && fret >= 0 && !note.isDead && !note.tieOrigin;');
app=replaceOnce(app,'      raw.push({ string:chosen.stringNumber - 1, fret:chosen.fret, midi:chosen.midi, tick:group.tick, beat:2 + quarterBeats, durationTicks:group.durationTicks, technique:chosen.technique, chordNotes:unique.map(note => ({ string:note.string, fret:note.fret, midi:note.midi, technique:note.technique })) });','      raw.push({ string:chosen.stringNumber - 1, fret:chosen.fret, midi:chosen.midi, tick:group.tick, beat:2 + quarterBeats, measure:spec.startBar + Math.floor(quarterBeats / 4) + 1, durationTicks:group.durationTicks, technique:chosen.technique, chordNotes:unique.map(note => ({ string:note.string, fret:note.fret, midi:note.midi, technique:note.technique })) });','import measure metadata');
app=replaceOnce(app,'        game.songClockTick = Math.max(0, Number(args.currentTick) - Number(game.level.sectionStartTick || 0));\n        game.songTempo = Number(args.modifiedTempo) || Number(game.level.bpm) || 80;','        game.songClockTick = Math.max(0, Number(args.currentTick) - Number(game.level.sectionStartTick || 0));\n        game.songTempo = Number(args.modifiedTempo) || Number(game.level.bpm) || 80;\n        game.lastSongClockUpdate = performance.now();','AlphaTab clock diagnostics');
app=replaceOnce(app,"  window.FMQGuitarTest = { getState:() => JSON.parse(JSON.stringify(state)), reloadActiveProfile, defaultState, startTestCountdown:runCountdown, cancelCountdown, isCountdownActive:()=>Boolean(countdownTimer) };",`  window.FMQGuitarTest = {\n    getState:() => JSON.parse(JSON.stringify(state)), reloadActiveProfile, defaultState, startTestCountdown:runCountdown, cancelCountdown, isCountdownActive:()=>Boolean(countdownTimer),\n    getPerformanceSnapshot,\n    setPerformanceInputAnalysis:enabled=>{performanceDiagnostics.inputAnalysisEnabled=Boolean(enabled);const input=$('#gamePerfInputAnalysis');if(input)input.checked=performanceDiagnostics.inputAnalysisEnabled;return performanceDiagnostics.inputAnalysisEnabled;},\n    launchSyntheticStressLevel:(noteCount=2000)=>{\n      const count=Math.max(1,Math.min(2000,Number(noteCount)||2000));\n      const notes=Array.from({length:count},(_,i)=>({string:i%STRING_INFO.length,fret:i%13,beat:i*.08,duration:.06,chordNotes:i%17===0?[{string:i%STRING_INFO.length,fret:i%13},{string:(i+1)%STRING_INFO.length,fret:(i+3)%13},{string:(i+2)%STRING_INFO.length,fret:(i+5)%13}]:undefined}));\n      launchLevel({id:'synthetic-stress',mode:'mission',worldNumber:0,worldTitle:'Diagnostics',title:'Synthetic Stress',tag:'DIAGNOSTIC',headline:'Bounded renderer test',lesson:'Synthetic original events for automated rendering tests.',hint:'Diagnostic only.',bpm:80,notes},true);\n      return getPerformanceSnapshot();\n    },\n    jumpRenderForTest:t=>{if(!game)return null;const value=Math.max(0,Number(t)||0);game.nextPendingIndex=lowerBoundClock(game.events,value);game.expireIndex=game.nextPendingIndex;updateGameBoard(value);renderLiveTabWindow(value);updateCurrentTab(value);return getPerformanceSnapshot();},\n    setGameViewForTest:view=>{setGameView(view);if(game)renderLiveTabWindow(game.events[Math.min(game.nextPendingIndex,game.events.length-1)]?.clock||0);return view;}\n  };`,'test API');
write('app.js',app);

let html=read('index.html').replaceAll('?v=2.6.3',`?v=${VERSION}`);
html=replaceOnce(html,'        <div class="game-progress-track"><span id="gameProgressBar"></span></div>\n',`        <div class="game-progress-track"><span id="gameProgressBar"></span></div>\n        <details id="gamePerfPanel" class="game-perf-panel"><summary>Performance diagnostics</summary><span id="gamePerfStats">Waiting for a run…</span><label><input id="gamePerfInputAnalysis" type="checkbox" checked> Input analysis <small>(turn off only to diagnose performance; scoring is disabled)</small></label></details>\n`,'performance diagnostics UI');
write('index.html',html);

let css=read('styles.css');
css+=`\n/* v2.6.4 Guitar player readability + bounded live-tab presentation */\n.falling-note{background:var(--string-color)!important;border:2px solid rgba(255,255,255,.95)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--string-color) 78%,#000 22%),0 5px 14px rgba(0,0,0,.34)!important}\n.falling-note b{display:grid;place-items:center;min-width:34px;min-height:28px;padding:2px 7px;border-radius:8px;background:#071018;color:#fff;font-size:clamp(1rem,2.2vw,1.35rem);line-height:1;text-shadow:none}\n.falling-note.open-note b{min-width:48px;font-size:.88rem;letter-spacing:.04em}\n.falling-note .note-string{background:#071018!important;color:var(--string-color)!important;border:1px solid color-mix(in srgb,var(--string-color) 70%,#fff 30%);font-weight:1000}\n.hand-position.chord-focus #handPositionText{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.03em}\n.live-tab{overflow:hidden!important;min-height:198px;border-radius:12px;background:#090d13;border:1px solid var(--line);padding:8px 10px}\n.tab-staff{position:relative;min-height:180px;padding:8px 8px 8px 54px;overflow:hidden}\n.tab-line-row{position:relative;height:27px}\n.tab-row-label{position:absolute;left:-48px;top:50%;transform:translateY(-50%);width:42px;text-align:right;font-weight:1000;color:var(--string-color);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;z-index:4}\n.tab-row-label small{display:inline;margin-left:3px;font-size:.62rem;color:var(--muted)}\n.tab-string-line{position:absolute;left:0;right:0;top:50%;border-top:2px solid color-mix(in srgb,var(--string-color) 45%,#aab6c5 55%);opacity:.9}\n.tab-note{position:absolute;top:50%;transform:translate(-50%,-50%);z-index:5;min-width:25px;height:23px;display:grid;place-items:center;border-radius:6px;background:#091018;color:#fff;border:2px solid var(--string-color);font:900 .82rem/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;transition:left .05s linear,transform .08s,background .08s}\n.tab-note.current{transform:translate(-50%,-50%) scale(1.18);background:var(--string-color);color:#061018;box-shadow:0 0 0 2px #fff}\n.tab-note.hit,.tab-note.demo{opacity:.45}.tab-note.miss{border-style:dashed;opacity:.6}\n.tab-playhead{position:absolute;left:28%;top:4px;bottom:4px;width:3px;background:#fff;z-index:3;box-shadow:0 0 8px rgba(255,255,255,.7)}\n.tab-playhead small{position:absolute;top:0;left:6px;color:#fff;font-size:.55rem;letter-spacing:.12em}\n.tab-measures{position:absolute;left:54px;right:8px;top:5px;bottom:5px;pointer-events:none}\n.tab-measure-marker{position:absolute;top:12px;bottom:0;border-left:1px solid rgba(255,255,255,.2);z-index:1}\n.tab-measure-marker small{position:absolute;top:-11px;left:4px;color:var(--muted);font-size:.58rem}\n.game-perf-panel{flex:1 0 100%;margin-top:4px;padding:7px 9px;border:1px solid var(--line);border-radius:10px;background:rgba(0,0,0,.2);color:var(--muted);font-size:.68rem}\n.game-perf-panel summary{cursor:pointer;color:var(--muted);font-weight:800}\n.game-perf-panel>span{display:block;margin:7px 0;line-height:1.45;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}\n.game-perf-panel label{display:flex;align-items:center;gap:6px}.game-perf-panel label small{color:var(--muted)}\n`;
write('styles.css',css);

let sw=read('sw.js').replaceAll('2.6.3',VERSION);write('sw.js',sw);
let pwa=read('pwa-assets.test.js').replace("const version='2.6.3';",`const version='${VERSION}';`);write('pwa-assets.test.js',pwa);
const pkg=JSON.parse(read('package.json'));pkg.version=VERSION;write('package.json',JSON.stringify(pkg,null,2)+'\n');
const lock=JSON.parse(read('package-lock.json'));lock.version=VERSION;if(lock.packages?.[''])lock.packages[''].version=VERSION;write('package-lock.json',JSON.stringify(lock,null,2)+'\n');

let browser=read('browser-tests/app-smoke.spec.js');
browser+=`\n\ntest('Guitar rendering stays bounded with a 2,000-event synthetic run',async({page})=>{\n  await page.goto('/');\n  await page.getByLabel('Your name').fill('Guitar Stress Test');\n  await page.getByRole('button',{name:'Continue'}).click();\n  await page.getByRole('button',{name:'Start Playing'}).click();\n  await page.getByRole('button',{name:/Guitar Quest Learn guitar/}).click();\n  const first=await page.evaluate(()=>window.FMQGuitarTest.launchSyntheticStressLevel(2000));\n  expect(first.totalEvents).toBe(2000);\n  expect(first.renderedEvents).toBeLessThan(120);\n  expect(await page.locator('#noteLayer .falling-note').count()).toBeLessThan(120);\n  const middle=await page.evaluate(()=>window.FMQGuitarTest.jumpRenderForTest(60));\n  expect(middle.totalEvents).toBe(2000);\n  expect(middle.renderedEvents).toBeLessThan(120);\n  expect(await page.locator('#noteLayer .falling-note').count()).toBeLessThan(120);\n  await page.evaluate(()=>window.FMQGuitarTest.setGameViewForTest('tab'));\n  const tab=await page.evaluate(()=>window.FMQGuitarTest.jumpRenderForTest(60));\n  expect(tab.tabEvents).toBeLessThanOrEqual(48);\n  expect(await page.locator('#liveTab .tab-note').count()).toBeLessThanOrEqual(288);\n  await expect(page.locator('#liveTab .tab-playhead')).toBeVisible();\n});\n`;
write('browser-tests/app-smoke.spec.js',browser);

let changelog=read('CHANGELOG.md');
const entry=`## v2.6.4 — Guitar Player & String Engine Polish (release candidate)\n\n- Reworked Guitar gameplay rendering to materialize only the bounded visible clock window instead of creating note DOM for an entire imported Full Song.\n- Replaced repeated frame/input whole-song scans with clock indexes and pending/expiry pointers while preserving Guitar scoring thresholds and skipped-note rules.\n- Rebuilt playable Tab View as a bounded, time-spaced staff with a stable NOW playhead, aligned chord notes, measure markers and no per-note smooth scrolling.\n- Strengthened per-string identity and fret/OPEN readability on Highway notes and added compact chord-shape cues.\n- Added collapsed performance diagnostics for frame timing, rendered/event counts, Tab window size, pitch-analysis cost/rate and AlphaTab tick freshness, plus a diagnosis-only input-analysis bypass.\n- Removed fixed-six geometry from the touched renderer paths and generalized imported tuning/string helpers while continuing to expose only six-string Guitar tracks in this release.\n- Added a 2,000-event synthetic browser regression proving Highway and Tab DOM remain bounded.\n- Advanced package/app/PWA asset and service-worker cache versioning to v2.6.4.\n- Physical Dell Chromebook 3100 audio/readability acceptance remains required before declaring the Full Song stutter blocker resolved.\n\n`;
changelog=replaceOnce(changelog,'## v2.6.3 — Musical Feel & Guitar Songbook\n',entry+'## v2.6.3 — Musical Feel & Guitar Songbook\n','changelog v2.6.3 heading');write('CHANGELOG.md',changelog);

let architecture=read('ARCHITECTURE.md');
architecture=architecture.replace('1. `app.js` contains an internal `APP_VERSION` value that is older than the package/PWA release version. PWA versioning itself is separately aligned through package/service-worker assets, but the stale constant is confusing technical debt.','1. `app.js` remains large and highly coupled, but its internal release constant is aligned with the package/PWA release as of the v2.6.4 candidate.');
architecture=architecture.replace('5. Guitar imported-song gameplay performs repeated whole-event-list operations in animation-sensitive paths.','5. The v2.6.4 candidate replaces the known frame-sensitive whole-event scans and full-song note DOM materialization with bounded clock windows/indexes; real Chromebook performance acceptance is still required before considering the stutter debt closed.');
write('ARCHITECTURE.md',architecture);

let debt=read('TECHNICAL_DEBT.md');
debt=debt.replace('Several high-frequency Guitar gameplay functions scan/filter full event arrays. This is acceptable for small lessons but may become expensive for large imported songs.\n\nPrefer moving indexes/windows/cached active sets where profiling demonstrates benefit.','The v2.6.4 candidate replaces the identified frame-sensitive full-list scans and full-song note DOM materialization with bounded clock windows/indexes. Keep this item open until the complex Full Song benchmark passes on the target Chromebook; if stutter remains, use the new diagnostics to identify the next bottleneck rather than assuming the renderer is still responsible.');
write('TECHNICAL_DEBT.md',debt);

// One-shot scaffolding removes itself from the resulting implementation commit.
try{fs.unlinkSync('scripts/v264-upgrade.cjs');}catch{}
try{fs.unlinkSync('.github/workflows/v264-upgrade.yml');}catch{}
console.log('v2.6.4 transformation complete');
