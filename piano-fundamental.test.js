const assert=require('node:assert/strict');
const {loadPianoInputs,frequency,signal,rms}=require('./test-support/piano-signals');
const {MicrophonePianoInput,MIC_RULES,clock}=loadPianoInputs(process.env.FMQ_PIANO_SOURCE||'piano.js');
const notes=[48,50,52,53,55,60,62,64,65,67];
let cases=0;
function detect(midi,options={}){
  const data=signal(midi,options),events=[];
  const mic=new MicrophonePianoInput({emit:e=>events.push(e)});
  const result=mic.detectPitch(data,options.sampleRate||48000);
  assert(result,`missing pitch ${midi}`);
  const cents=1200*Math.log2(result.frequency/frequency(midi));
  assert(Math.abs(cents-(options.cents||0))<5,`MIDI ${midi}: ${result.frequency} Hz, ${cents} cents; ${JSON.stringify(options)}`);
  for(let frame=0;frame<3;frame++)mic.processCandidate(result,rms(data),1000+85*frame);
  assert.deepEqual(events.map(e=>e.midi),[midi],`stable fundamental ${midi}`);
  cases++;
  return result;
}
// Original pre-fix matrix: 56/80 failures, including stable low aliases.
for(const sampleRate of [44100,48000])for(const harmonics of [[1],[1,.7,.4,.2]])for(const amplitude of [.04,.2])for(const midi of notes)
  detect(midi,{sampleRate,harmonics,amplitude});
// Guard the rest of the supported beginner range, including a dominant second
// harmonic and seven-partial timbre. These are synthetic controls, not recordings.
for(const sampleRate of [44100,48000])for(const harmonics of [[1],[1,.7,.4,.2],[.25,1,.4,.2],[1,.8,.65,.5,.35,.2,.1]])for(let midi=48;midi<=83;midi++)
  detect(midi,{sampleRate,harmonics,phase:.7});
// Direct deterministic equivalents of the physical F1 reports. Before the fix,
// C3 +3 cents selected lag 1099 (3 periods); C4 +6 selected 1097 (6 periods).
for(const [midi,cents] of [[48,3],[60,6]])for(const harmonics of [[1],[1,.7,.4,.2]])detect(midi,{cents,harmonics});
// Preserve actual tuning, including signed cents, rather than snapping to a key.
for(const cents of [-35,35])for(const midi of [48,60,67])detect(midi,{cents});
// A genuine F1 stays F1: no note blacklist or target-dependent correction.
detect(29);

function capture(sampleRate=48000){
  const events=[],readings=[],mic=new MicrophonePianoInput({emit:e=>events.push(e)});
  mic.onReading=r=>readings.push(r);mic.active=true;mic.context={sampleRate};
  let data=new Float32Array(4096);
  mic.analyser={fftSize:4096,getFloatTimeDomainData:target=>target.set(data)};
  clock.now=1000;
  return {mic,events,readings,frame(next){data=next;clock.now+=85;mic.tick();return readings.at(-1);}};
}
// Exercise production tick -> RMS -> detector -> stability -> Note On, with
// independently phased frames and modest decay at the unchanged 85 ms cadence.
for(const sampleRate of [44100,48000])for(const midi of notes){
  const run=capture(sampleRate);
  for(let frame=0;frame<3;frame++){
    const reading=run.frame(signal(midi,{sampleRate,harmonics:[1,.7,.4,.2],amplitude:.12,decay:1,start:Math.round(frame*.085*sampleRate)}));
    assert.equal(reading.stable,frame===2);
    assert.equal(run.events.length,frame===2?1:0);
  }
  assert.deepEqual(run.events.map(e=>e.midi),[midi]);
}
const run=capture();
const c=signal(48,{cents:3});
run.frame(c);run.frame(c);run.frame(c);
assert.deepEqual(run.events.map(e=>e.midi),[48]);
run.frame(c);run.frame(c);run.frame(c); // only 255 ms since emission
assert.equal(run.events.length,1,'debounce unchanged');
run.frame(c); // 340 ms since emission
assert.equal(run.events.length,2);
run.frame(new Float32Array(4096));
for(const midi of [48,50,48,50,48,50])assert.equal(run.frame(signal(midi)).stable,false);
assert.equal(run.events.length,2,'alternating/unstable notes never emit');
run.frame(signal(60));run.frame(signal(60));run.frame(signal(60));
assert.deepEqual(run.events.map(e=>e.midi),[48,48,60],'clean transition gets its own three frames');
// Silence/quiet signals, deterministic broadband noise and off-centre candidates
// cannot emit. All are exercised through production tick, not a fake detector.
let seed=12345;
const noise=Float32Array.from({length:4096},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed/2**32-.5)*.2;});
for(const data of [new Float32Array(4096),signal(48,{amplitude:.005}),noise,signal(60,{cents:49})]){
  const rejected=capture();
  for(let frame=0;frame<6;frame++)assert.equal(rejected.frame(data).stable,false);
  assert.equal(rejected.events.length,0);
}
// Explicit strict gate boundaries remain unchanged, even if a plausible pitch is supplied.
for(const [confidence,level] of [[.68,.03],[.5,.03],[.99,.012]]){
  const rejected=capture();
  for(let frame=0;frame<5;frame++)rejected.mic.processCandidate({frequency:frequency(60),confidence},level,1000+85*frame);
  assert.equal(rejected.events.length,0);
}
assert.equal(MIC_RULES.stableFrames,3);
assert.equal(MIC_RULES.emitDebounceMs,330);
assert.equal(MIC_RULES.analysisIntervalMs,85);
console.log(`Piano fundamental tests passed: ${cases} pitch/gate cases, 20 evolving-signal streams, noise/stability/debounce controls`);
