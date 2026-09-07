from pathlib import Path
import re


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def regex_once(text, pattern, replacement, label):
    out, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one regex match, found {count}")
    return out


path = Path("piano.js")
s = path.read_text()

s = replace_once(
    s,
    "  function melodyPracticeNotes(notes){const sorted=notes.map(n=>({...n})).sort((a,b)=>a.start-b.start||a.midi-b.midi),groups=[];for(const note of sorted){const group=groups.at(-1);if(group&&Math.abs(group[0].start-note.start)<.02)group.push(note);else groups.push([note]);}return groups.map(group=>({...group.at(-1),chordSize:group.length}));}\n",
    "  function melodyPracticeNotes(notes){const sorted=notes.map(n=>({...n})).sort((a,b)=>a.start-b.start||a.midi-b.midi),groups=[];for(const note of sorted){const group=groups.at(-1);if(group&&Math.abs(group[0].start-note.start)<.02)group.push(note);else groups.push([note]);}return groups.map(group=>({...group.at(-1),chordSize:group.length}));}\n  function isMonophonicMaterial(notes){const sorted=[...notes].sort((a,b)=>a.start-b.start||a.midi-b.midi);for(let i=1;i<sorted.length;i++)if(Math.abs(sorted[i].start-sorted[i-1].start)<.02)return false;return true;}\n",
    "monophonic helper",
)

s = replace_once(
    s,
    "  let progress=loadProgress();\n  let currentGame=null,startSongBusy=false;\n  const saveProgress=()=>window.FMQProfiles?.saveInstrumentProgress('piano',progress);\n",
    "  let progress=loadProgress();\n  let currentGame=null,startSongBusy=false;\n  let pianoInputIntent='screen';\n  const PIANO_MIC_RULES=Object.freeze({analysisIntervalMs:85,minRms:.012,minConfidence:.68,maxCents:45,stableFrames:3,emitDebounceMs:330,minFrequency:27,maxFrequency:4250,historySize:5});\n  const setPianoInputIntent=input=>{pianoInputIntent=input==='microphone'?'microphone':'screen';};\n  const getPianoInputIntent=()=>pianoInputIntent;\n  const saveProgress=()=>window.FMQProfiles?.saveInstrumentProgress('piano',progress);\n",
    "input intent/rules",
)

mic_class = r'''  class MicrophonePianoInput {
    constructor(hub){this.hub=hub;this.active=false;this.context=null;this.stream=null;this.analyser=null;this.raf=0;this.history=[];this.historyMidi=null;this.stableMidi=null;this.stableFrames=0;this.lastEmit=new Map();this.lastAnalysis=0;this.onReading=()=>{};}
    async start(onReading){
      if(this.active)return;
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Microphone input is not available in this browser.');
      this.onReading=onReading||(()=>{});
      this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      this.context=new (window.AudioContext||window.webkitAudioContext)();
      await this.context.resume();
      const source=this.context.createMediaStreamSource(this.stream);
      this.analyser=this.context.createAnalyser();this.analyser.fftSize=4096;this.analyser.smoothingTimeConstant=.12;source.connect(this.analyser);this.active=true;setPianoInputIntent('microphone');this.tick();
    }
    resetStability(){this.history=[];this.historyMidi=null;this.stableMidi=null;this.stableFrames=0;}
    stop(){this.active=false;cancelAnimationFrame(this.raf);this.stream?.getTracks().forEach(t=>t.stop());this.context?.close();this.stream=this.context=this.analyser=null;this.resetStability();this.onReading({active:false});}
    processCandidate(result,rms,now=performance.now()){
      const valid=Boolean(result&&rms>PIANO_MIC_RULES.minRms&&result.confidence>PIANO_MIC_RULES.minConfidence&&result.frequency>=PIANO_MIC_RULES.minFrequency&&result.frequency<=PIANO_MIC_RULES.maxFrequency);
      if(!valid){this.resetStability();const reading={active:true,level:rms,quiet:rms<=PIANO_MIC_RULES.minRms,confidence:result?.confidence||0,stable:false};this.onReading(reading);return reading;}
      const raw=midiFromFrequency(result.frequency),rawMidi=Math.round(raw),rawCents=(raw-rawMidi)*100;
      if(Math.abs(rawCents)>PIANO_MIC_RULES.maxCents){this.resetStability();const reading={active:true,level:rms,quiet:false,confidence:result.confidence,frequency:result.frequency,stable:false};this.onReading(reading);return reading;}
      if(this.historyMidi!==rawMidi){this.historyMidi=rawMidi;this.history=[];this.stableMidi=null;this.stableFrames=0;}
      this.history.push(raw);if(this.history.length>PIANO_MIC_RULES.historySize)this.history.shift();
      const smooth=[...this.history].sort((a,b)=>a-b)[Math.floor(this.history.length/2)],midi=Math.round(smooth),cents=(smooth-midi)*100;
      if(Math.abs(cents)>PIANO_MIC_RULES.maxCents){this.resetStability();const reading={active:true,level:rms,quiet:false,confidence:result.confidence,frequency:result.frequency,stable:false};this.onReading(reading);return reading;}
      if(midi===this.stableMidi)this.stableFrames++;else{this.stableMidi=midi;this.stableFrames=1;}
      const stable=this.stableFrames>=PIANO_MIC_RULES.stableFrames,last=this.lastEmit.get(midi);
      if(stable&&(last==null||now-last>PIANO_MIC_RULES.emitDebounceMs)){this.lastEmit.set(midi,now);this.hub.emit({midi,source:'microphone',frequency:result.frequency,confidence:result.confidence});}
      const reading={active:true,midi,name:noteName(midi),frequency:result.frequency,confidence:result.confidence,level:rms,stable,cents};this.onReading(reading);return reading;
    }
    tick(){
      if(!this.active||!this.analyser)return;
      const frameNow=performance.now();if(frameNow-this.lastAnalysis<PIANO_MIC_RULES.analysisIntervalMs){this.raf=requestAnimationFrame(()=>this.tick());return;}this.lastAnalysis=frameNow;
      const data=new Float32Array(this.analyser.fftSize);this.analyser.getFloatTimeDomainData(data);
      let sum=0;for(const v of data)sum+=v*v;const rms=Math.sqrt(sum/data.length);
      const result=rms>PIANO_MIC_RULES.minRms?this.detectPitch(data,this.context.sampleRate):null;
      this.processCandidate(result,rms,frameNow);
      this.raf=requestAnimationFrame(()=>this.tick());
    }
    detectPitch(buffer,sampleRate){
      const size=buffer.length;let bestOffset=-1,best=0;const min=Math.floor(sampleRate/PIANO_MIC_RULES.maxFrequency),max=Math.min(Math.ceil(sampleRate/PIANO_MIC_RULES.minFrequency),size>>1);
      for(let offset=min;offset<=max;offset++){
        let corr=0,a=0,b=0;for(let i=0;i<size-offset;i++){corr+=buffer[i]*buffer[i+offset];a+=buffer[i]*buffer[i];b+=buffer[i+offset]*buffer[i+offset];}
        corr/=Math.sqrt(a*b)||1;if(corr>best){best=corr;bestOffset=offset;}
      }
      return bestOffset>0?{frequency:sampleRate/bestOffset,confidence:best}:null;
    }
  }
  const microphoneInput=new MicrophonePianoInput(inputHub);'''
s = regex_once(
    s,
    r"  class MicrophonePianoInput \{.*?\n  \}\n  const microphoneInput=new MicrophonePianoInput\(inputHub\);",
    mic_class,
    "microphone detector class",
)

s = replace_once(
    s,
    "  window.NovaPianoInputs={PianoInputHub,MicrophonePianoInput,OnScreenPianoInput,MidiPianoInput};",
    "  window.NovaPianoInputs={PianoInputHub,MicrophonePianoInput,OnScreenPianoInput,MidiPianoInput,MIC_RULES:PIANO_MIC_RULES};",
    "input exports",
)

mic_toggle = r'''  function syncMicTestUi(){const toggle=$('pianoMicToggle'),status=$('pianoMicStatus');if(!toggle||!status)return;if(microphoneInput.active){toggle.textContent='Stop Microphone';status.textContent='Microphone Ready — play one key at a time.';}else{toggle.textContent='Enable Microphone';status.textContent=getPianoInputIntent()==='microphone'?'Microphone selected for Piano practice. Enable it here to test again.':'Microphone is off. You can still tap the keyboard.';}}
  $('pianoMicToggle').addEventListener('click',async()=>{
    if(microphoneInput.active){microphoneInput.stop();setPianoInputIntent('screen');syncMicTestUi();return;}
    try{await microphoneInput.start(micReading);syncMicTestUi();}catch(err){setPianoInputIntent('screen');$('pianoMicStatus').textContent=`Microphone unavailable: ${err.message} Tap the keyboard below instead.`;$('pianoMicToggle').textContent='Enable Microphone';}
  });
  function highlightKey'''
s = regex_once(
    s,
    r"  \$\('pianoMicToggle'\)\.addEventListener\('click',async\(\)=>\{.*?\n  \}\);\n  function highlightKey",
    mic_toggle,
    "mic test toggle",
)

s = replace_once(s, "    mount(){", "    async mount(){", "async Piano mount")
s = replace_once(
    s,
    "this.loop={start:this.section.start,end:this.section.end,enabled:false};this.displayRange={...BEGINNER_RANGE};}",
    "this.loop={start:this.section.start,end:this.section.end,enabled:false};this.displayRange={...BEGINNER_RANGE};this.microphoneCompatible=options.microphoneCompatible!==false;this.restartBusy=false;this.inputNotice='';}",
    "PianoGame constructor state",
)
s = replace_once(
    s,
    "$('pianoGameMic').onclick=()=>this.toggleMic();",
    "$('pianoGameMic').onclick=()=>this.toggleMic();$('pianoGameMic').disabled=this.mode==='listen'||!this.microphoneCompatible;$('pianoGameMic').title=this.mode==='listen'?'Listen First does not need input':this.microphoneCompatible?'Use the Chromebook microphone':'Microphone mode is for single-note practice';",
    "mic button capability",
)
s = replace_once(
    s,
    "this.unsubscribe=inputHub.subscribe(event=>this.onInput(event));this.restart();",
    "this.unsubscribe=inputHub.subscribe(event=>this.onInput(event));await this.restart();",
    "mount restart await",
)

input_methods = r'''    inputStateLabel(){
      if(this.mode==='listen')return 'no input needed';
      if(this.midiInput.unsubscribe)return 'USB MIDI';
      if(getPianoInputIntent()==='microphone'&&microphoneInput.active)return 'microphone';
      return 'screen keys';
    }
    renderInputState(override=null){const pill=$('pianoInputPill');if(!pill)return;const range=this.displayRange.label||BEGINNER_RANGE.label;if(override){pill.textContent=override;return;}pill.textContent=`${range} · Input: ${this.inputStateLabel()}${this.inputNotice?` · ${this.inputNotice}`:''}`;}
    async ensurePreferredInput(){
      this.inputNotice='';
      if(this.mode==='listen'){if(microphoneInput.active)microphoneInput.stop();this.renderInputState();return;}
      if(getPianoInputIntent()!=='microphone'){this.renderInputState();return;}
      if(!this.microphoneCompatible){if(microphoneInput.active)microphoneInput.stop();this.inputNotice='Mic is for single-note practice';this.renderInputState();return;}
      if(microphoneInput.active){if($('pianoGameMic'))$('pianoGameMic').textContent='🎙 On';this.renderInputState();return;}
      this.renderInputState('Input: microphone · connecting…');
      try{await microphoneInput.start(r=>{if(r.name&&$('pianoInputPill'))$('pianoInputPill').textContent=`Heard: ${r.name}${r.stable?' ✓':''}`;});if(this.destroyed){microphoneInput.stop();return;}if($('pianoGameMic'))$('pianoGameMic').textContent='🎙 On';this.renderInputState();}
      catch(err){setPianoInputIntent('screen');if($('pianoGameMic'))$('pianoGameMic').textContent='🎙 Mic';this.inputNotice='microphone unavailable';this.renderInputState();this.feedback('Microphone unavailable — using screen keys');}
    }
    sectionNotes(){'''
s = replace_once(s, "    sectionNotes(){", input_methods, "input lifecycle methods")

s = replace_once(
    s,
    "    restart(){this.loop.start=this.section.start;this.loop.end=this.section.end;this.loop.enabled=false;this.updateLoopUi();this.startRun(this.section.start,false);}",
    "    async restart(){if(this.restartBusy||this.destroyed)return;this.restartBusy=true;try{if($('pianoPause'))$('pianoPause').disabled=true;await this.ensurePreferredInput();if(this.destroyed)return;this.loop.start=this.section.start;this.loop.end=this.section.end;this.loop.enabled=false;this.updateLoopUi();this.startRun(this.section.start,false);}finally{this.restartBusy=false;}}",
    "async restart",
)
s = replace_once(
    s,
    "$('pianoInputPill').textContent=`${this.displayRange.label||BEGINNER_RANGE.label} · screen keys`;",
    "this.renderInputState();",
    "run input label",
)

s = replace_once(
    s,
    "    async toggleMic(){if(microphoneInput.active){microphoneInput.stop();$('pianoGameMic').textContent='🎙 Mic';$('pianoInputPill').textContent='Input: screen keys';return;}try{await microphoneInput.start(r=>{if(r.name)$('pianoInputPill').textContent=`Heard: ${r.name}${r.stable?' ✓':''}`;});$('pianoGameMic').textContent='🎙 On';$('pianoInputPill').textContent='Microphone Ready';}catch(err){$('pianoInputPill').textContent='Mic unavailable — tap the keys';this.feedback('Use the on-screen keys');}}",
    "    async toggleMic(){if(this.mode==='listen'||!this.microphoneCompatible){this.inputNotice='Mic is for single-note practice';this.renderInputState();this.feedback('Use screen keys or USB MIDI for this part');return;}if(microphoneInput.active){microphoneInput.stop();setPianoInputIntent('screen');$('pianoGameMic').textContent='🎙 Mic';this.inputNotice='';this.renderInputState();return;}this.renderInputState('Input: microphone · connecting…');try{await microphoneInput.start(r=>{if(r.name&&$('pianoInputPill'))$('pianoInputPill').textContent=`Heard: ${r.name}${r.stable?' ✓':''}`;});$('pianoGameMic').textContent='🎙 On';this.inputNotice='';this.renderInputState();}catch(err){setPianoInputIntent('screen');$('pianoGameMic').textContent='🎙 Mic';this.inputNotice='microphone unavailable';this.renderInputState();this.feedback('Microphone unavailable — using screen keys');}}",
    "game mic toggle",
)

s = replace_once(
    s,
    "  window.addEventListener('family-music:profile-changing',()=>{if(currentGame)currentGame.destroy();microphoneInput.stop();});",
    "  window.addEventListener('family-music:profile-changing',()=>{if(currentGame)currentGame.destroy();microphoneInput.stop();setPianoInputIntent('screen');});",
    "profile change input cleanup",
)
s = replace_once(
    s,
    "    if(name!=='mic')microphoneInput.stop();if(name==='progress')renderProgress();if(name==='songs')renderSongs();",
    "    if(name!=='mic'&&microphoneInput.active)microphoneInput.stop();if(name==='mic')syncMicTestUi();if(name==='progress')renderProgress();if(name==='songs')renderSongs();",
    "Piano view mic lifecycle",
)

s = replace_once(
    s,
    "const rangePreference=lessonId?'beginner':song.imported?'song':(progress.settings?.rangeMode||'beginner');currentGame=new PianoGame(clone,mode,lessonId,{rangePreference});",
    "const rangePreference=lessonId?'beginner':song.imported?'song':(progress.settings?.rangeMode||'beginner'),microphoneCompatible=mode!=='listen'&&isMonophonicMaterial(clone.notes);currentGame=new PianoGame(clone,mode,lessonId,{rangePreference,microphoneCompatible});",
    "mic-compatible game option",
)
s = replace_once(s, "      currentGame.mount();", "      await currentGame.mount();", "await game mount")

s = replace_once(
    s,
    "window.NovaPianoTest={calculateDisplayRange,noteRange,melodyPracticeNotes,MidiFileParser,PianoGame,getCurrentGame:()=>currentGame,getActiveVoiceCount:()=>[...pianoSynth.voices.values()].reduce((total,voices)=>total+voices.size,0),lessons};",
    "window.NovaPianoTest={calculateDisplayRange,noteRange,melodyPracticeNotes,isMonophonicMaterial,MidiFileParser,PianoGame,getCurrentGame:()=>currentGame,getActiveVoiceCount:()=>[...pianoSynth.voices.values()].reduce((total,voices)=>total+voices.size,0),getMicrophoneState:()=>({active:microphoneInput.active,intent:getPianoInputIntent(),stableMidi:microphoneInput.stableMidi,stableFrames:microphoneInput.stableFrames}),setMicrophoneIntentForTest:value=>setPianoInputIntent(value),emitInputForTest:event=>inputHub.emit(event),lessons};",
    "Piano test hooks",
)

path.write_text(s)

# Release/PWA version alignment: only the normal release-version files.
version_files = [
    "package.json",
    "package-lock.json",
    "index.html",
    "sw.js",
    "app.js",
    "guided-hardware-acceptance.js",
    "pwa-assets.test.js",
    "guided-hardware-acceptance.test.js",
    "browser-tests/app-smoke.spec.js",
]
for name in version_files:
    p = Path(name)
    text = p.read_text()
    if "2.6.10" not in text:
        raise SystemExit(f"{name}: expected v2.6.10 reference before bump")
    p.write_text(text.replace("2.6.10", "2.6.11"))

# Architecture documentation for the actual focused lifecycle/detector change.
p = Path("ARCHITECTURE.md")
text = p.read_text()
old = "### Microphone\n\nPiano microphone detection uses a larger 4,096-sample analyser buffer and main-thread autocorrelation with confidence/stability/debounce logic. It is intentionally treated as monophonic.\n"
new = "### Microphone\n\nPiano microphone detection uses a larger 4,096-sample analyser buffer and main-thread autocorrelation with confidence/stability/debounce logic. It is intentionally treated as monophonic. The production thresholds remain conservative; candidate-pitch history is reset when a clean rounded pitch changes or the signal becomes invalid so stale readings from the previous note do not unnecessarily delay the next stable note.\n\nA successful Piano microphone test/selection establishes a session-scoped microphone intent. Actual capture is still released on Mic Test/game/navigation cleanup boundaries; compatible scored single-note practice reacquires the microphone before count-in/restart and shows the active input explicitly. This intent is not a profile/save-schema field, is cleared on profile change, and Listen First/polyphonic material does not auto-start microphone capture.\n"
if old not in text:
    raise SystemExit("ARCHITECTURE microphone paragraph not found")
p.write_text(text.replace(old, new, 1))

# Testing expectations/debt for the regression that physical testing exposed.
p = Path("TESTING.md")
text = p.read_text()
old = "- microphone-safe monophonic arrangement extraction;\n- Wait for Me target behavior;"
new = "- microphone-safe monophonic arrangement extraction;\n- Piano microphone input intent/reacquisition across Mic Test, scored-run start, Restart/Play Again and lifecycle cleanup;\n- detector transition gating so stale pitch history does not delay a clean new note while quiet/unstable/low-confidence candidates remain non-scoreable;\n- Wait for Me target behavior;"
if old not in text:
    raise SystemExit("TESTING Piano matrix insertion point not found")
text = text.replace(old, new, 1)
old2 = "- acoustic-piano microphone detection."
new2 = "- acoustic/electronic-keyboard speaker-to-microphone detection and perceived note-to-note response timing on the target Chromebook."
if old2 not in text:
    raise SystemExit("TESTING Piano hardware debt line not found")
p.write_text(text.replace(old2, new2, 1))

# Roadmap: record the current focused blocker/release sequence without weakening #22.
p = Path("ROADMAP.md")
text = p.read_text()
old = "Issue #22 remains the broader acceptance gate. Physical testing should use the latest deployed maintenance baseline rather than an older historical release number. At this documentation pass the deployed baseline is v2.6.10.\n\nIssue #24 remains a separate, non-blocking Backlog reporting issue about distinguishing an enumerated virtual/system MIDI endpoint from a verified playable keyboard. It does not by itself invalidate microphone-based Piano testing or the broader #22 gate."
new = "Issue #22 remains the broader acceptance gate. Physical testing should use the latest deployed maintenance baseline rather than an older historical release number. v2.6.11 addresses the newly observed Piano microphone input-state/response blocker in Issue #29, but remains subject to real Dell Chromebook microphone acceptance before that blocker is considered cleared.\n\nIssue #30 tracks the separate confirmed active-practice screen wake-lock blocker and remains Backlog until v2.6.11 reaches its acceptance boundary. Issue #24 remains a separate, non-blocking Backlog reporting issue about distinguishing an enumerated virtual/system MIDI endpoint from a verified playable keyboard. Issue #31 tracks later child-friendly report transfer/evidence-fidelity work. None of #24/#30/#31 is implemented as part of v2.6.11."
if old not in text:
    raise SystemExit("ROADMAP current baseline paragraph not found")
p.write_text(text.replace(old, new, 1))

# Changelog entry.
p = Path("CHANGELOG.md")
text = p.read_text()
entry = """## v2.6.11 — Piano Microphone Practice Reliability

- Preserved a deliberate/validated Piano microphone choice as a session-scoped input intent and reacquired microphone capture before compatible scored single-note runs, Restart and Play Again instead of silently reverting to screen-key-only input.
- Kept capture lifecycle-safe: leaving Mic Test/gameplay stops the actual microphone stream, profile change clears the intent, and Listen First/polyphonic material does not auto-start microphone capture.
- Made the active/fallback input explicit before count-in and on microphone acquisition failure while retaining screen-key and Web MIDI paths.
- Corrected detector transition smoothing by resetting candidate history when a clean rounded pitch changes or the signal becomes invalid, while retaining the existing 85 ms analysis cadence, RMS/confidence/cents gates, three-frame stability requirement and duplicate debounce.
- Added browser regressions for microphone intent/reacquisition/cleanup/fallback, detector transition gating, quiet/low-confidence non-emission, wrong-note rejection, screen input and MIDI provider behavior.
- Advanced package/app/PWA asset and service-worker versioning to v2.6.11. Real Dell Chromebook microphone responsiveness and child usability remain physical acceptance requirements for Issue #29.

"""
header = "# Changelog\n\n"
if not text.startswith(header):
    raise SystemExit("CHANGELOG header not found")
p.write_text(header + entry + text[len(header):])
