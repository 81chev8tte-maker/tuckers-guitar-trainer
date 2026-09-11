// Original generated FMQ evidence for #40; no instrument recordings.
const assert=require('node:assert/strict');
const {loadPianoInputs,signal,frequency,rms}=require('./test-support/piano-signals');
const {MicrophonePianoInput,clock}=loadPianoInputs(process.env.FMQ_PIANO_SOURCE||'piano.js');
const investigate=process.env.FMQ_INVESTIGATE==='1';
let checks=0,failures=0,trials=0;
const examples=[];
function check(ok,detail){checks++;if(!ok){failures++;if(examples.length<12)examples.push(detail);if(!investigate)assert.fail(JSON.stringify(detail));}}
const controls=[48,50,52,53,55,60,62,64,65,67];
function capture(sampleRate){
  const events=[],mic=new MicrophonePianoInput({emit:e=>events.push(e.midi)});
  let data,reading;
  mic.active=true;mic.context={sampleRate};mic.onReading=r=>{reading=r;};
  mic.analyser={fftSize:4096,getFloatTimeDomainData:target=>target.set(data)};
  return {events,frame(next){data=next;clock.now+=85;mic.tick();return reading;}};
}
function trial(midi,options){
  trials++;
  const events=[],mic=new MicrophonePianoInput({emit:e=>events.push(e.midi)}),data=signal(midi,options);
  const result=mic.detectPitch(data,options.sampleRate||48000);
  const cents=result?1200*Math.log2(result.frequency/frequency(midi)):Infinity;
  // Clean tuning stays within five cents. Noisy buffers must retain the
  // correct note within the existing 45-cent scoreability gate (no snapping).
  check(Math.abs(cents-(options.cents||0))<(options.noise?45:5),{midi,options,detected:result,cents});
  for(let frame=0;frame<3;frame++)mic.processCandidate(result,rms(data),1000+85*frame);
  check(events.length===1&&events[0]===midi,{midi,options,events});
}
// Weak but present odd/fundamental energy must distinguish C3 from C4.
// Noise controls independently protect against choosing a longer period solely
// because the shorter overlapping buffer has a slightly better noise match.
for(const sampleRate of [44100,48000])for(const amplitude of [.04,.12])for(const midi of controls){
  for(const harmonics of [[1],[1,.7,.4,.2],[.01,1,0,.3],[.03,1,0,.3],[0,1,.03,.3]])trial(midi,{sampleRate,amplitude,harmonics});
  for(const noise of [.005,.01,.03])trial(midi,{sampleRate,amplitude,harmonics:[.03,1,0,.3],noise,seed:53,phase:2});
  for(const seed of [1,2,3,7])for(const noise of [.03,.3,.5])trial(midi,{sampleRate,amplitude,harmonics:[1,.7,.4,.2],noise,seed,phase:seed});
}
// Genuine low notes and an absent fundamental: never manufacture a lower
// octave when the waveform is actually the upper tone.
for(const midi of [29,36,38,40,41,43])for(const harmonics of [[1],[.03,1,0,.3]])trial(midi,{harmonics});
const absent=new MicrophonePianoInput({emit(){}}).detectPitch(signal(48,{harmonics:[0,1,0,.3]}),48000);
check(Math.abs(1200*Math.log2(absent.frequency/frequency(60)))<5,{absent});
for(const midi of [48,60])for(const cents of [-35,35])trial(midi,{harmonics:[.03,1,0,.3],cents});
// Actual tick -> RMS -> detector -> stability -> input events, with independent
// frames, attack/decay and a decaying first partial crossing the old .002 boundary.
for(const sampleRate of [44100,48000])for(const midi of controls)for(const kind of ['weak-decay','noise']){
  const run=capture(sampleRate);
  for(let frame=0;frame<6;frame++){
    const options=kind==='weak-decay'?{harmonics:[.05,1,0,.3],partialDecay:[3],attack:35,decay:.4}:{harmonics:[1,.7,.4,.2],noise:.5,seed:frame+1};
    const data=signal(midi,{...options,sampleRate,amplitude:.12,start:Math.round(frame*.085*sampleRate)});
    const reading=run.frame(data);
    check(rms(data)>.012,{kind,midi,frame,level:rms(data)});
    // The first attack buffer can be ambiguous. It must not emit; once the
    // attack has passed, three agreeing frames must recover the actual octave.
    if(kind!=='weak-decay'||frame>0)check(reading.midi===midi,{kind,midi,frame,reading});
    if(frame<2||frame>=3)check(reading.stable===(frame>=3),{kind,midi,frame,stable:reading.stable});
    check(!reading.stable||reading.midi===midi,{kind,midi,frame,reading});
  }
  check(run.events.length===1&&run.events[0]===midi,{kind,midi,events:run.events});
}
// Vary the odd partial around the old fixed tolerance: the old selector
// alternates octaves and cannot collect three agreeing frames.
{
  const run=capture(48000);
  for(let frame=0;frame<6;frame++){
    const reading=run.frame(signal(48,{harmonics:[frame%2?.036:.028,1,0,.3],start:frame*4080}));
    check(reading.midi===48&&reading.stable===(frame>=2),{kind:'evolving-odd-partial',frame,reading});
  }
  check(JSON.stringify(run.events)==='[48]',{kind:'evolving-odd-partial',events:run.events});
}
// No target/history-dependent octave forcing across C3/D3 and C3/C4 transitions.
for(const sampleRate of [44100,48000]){
  const run=capture(sampleRate),sequence=[48,50,48,60,48];
  for(const midi of sequence){
    run.frame(new Float32Array(4096));
    for(let frame=0;frame<3;frame++){
      const reading=run.frame(signal(midi,{sampleRate,harmonics:[.03,1,0,.3],start:Math.round(frame*.085*sampleRate)}));
      check(reading.stable===(frame===2),{midi,frame,reading});
    }
  }
  check(JSON.stringify(run.events)===JSON.stringify(sequence),{sequence,events:run.events});
}
// Added noise cannot bypass the unchanged confidence floor; quiet and untuned
// weak-fundamental signals cannot bypass RMS/cents gates either.
for(const options of [{amplitude:.005,harmonics:[.03,1,0,.3]},{noise:8},{cents:49,harmonics:[.03,1,0,.3]}]){
  const run=capture(48000);
  for(let frame=0;frame<5;frame++)check(run.frame(signal(48,{...options,seed:frame+1})).stable===false,{options,frame});
  check(run.events.length===0,{options,events:run.events});
}
console.log(JSON.stringify({suite:'Piano octave reliability',trials,checks,failures,examples},null,2));
if(!investigate)assert.equal(failures,0);
