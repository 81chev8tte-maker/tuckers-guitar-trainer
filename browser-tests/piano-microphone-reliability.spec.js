const {test,expect}=require('@playwright/test');

async function installFakeMicrophone(page){
  await page.addInitScript(()=>{
    window.__fmqMicFail=false;
    window.__fmqMicStarts=0;
    window.__fmqMicStops=0;
    const makeTrack=()=>({stop(){window.__fmqMicStops++;}});
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{window.__fmqMicStarts++;if(window.__fmqMicFail)throw new Error('Synthetic microphone failure');return{getTracks:()=>[makeTrack()]};}}});
    class FakeAudioContext{
      constructor(){this.currentTime=0;this.destination={};}
      async resume(){}
      async close(){}
      createMediaStreamSource(){return{connect(target){return target;}};}
      createAnalyser(){return{fftSize:4096,smoothingTimeConstant:0,getFloatTimeDomainData(data){data.fill(0);}};}
      createOscillator(){return{frequency:{value:0},onended:null,connect(target){return target;},start(){},stop(){const fn=this.onended;if(fn)setTimeout(()=>fn(),0);}};}
      createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(target){return target;}};}
    }
    Object.defineProperty(window,'AudioContext',{configurable:true,value:FakeAudioContext});
    Object.defineProperty(window,'webkitAudioContext',{configurable:true,value:FakeAudioContext});
  });
}

async function createProfileAndOpenPiano(page,name='Piano Mic Test'){
  await page.goto('/');
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
  await page.getByRole('button',{name:/Piano Quest Learn piano/}).click();
  await expect(page.getByRole('heading',{name:'Learn piano one note at a time.'})).toBeVisible();
}

test('Piano microphone intent survives safe cleanup and reactivates for compatible scored practice',async({page})=>{
  await installFakeMicrophone(page);
  await createProfileAndOpenPiano(page);

  await page.locator('.piano-nav-button[data-piano-view="mic"]').click();
  await page.locator('#pianoMicToggle').click();
  await expect(page.locator('#pianoMicStatus')).toContainText('Microphone Ready');
  expect(await page.evaluate(()=>window.NovaPianoTest.getMicrophoneState())).toMatchObject({active:true,intent:'microphone'});

  await page.locator('.piano-nav-button[data-piano-view="home"]').click();
  expect(await page.evaluate(()=>window.NovaPianoTest.getMicrophoneState())).toMatchObject({active:false,intent:'microphone'});

  await page.locator('[data-song="nova-first-tune"][data-mode="wait"]').first().click();
  await expect(page.locator('#pianoGame')).toBeVisible();
  await expect(page.locator('#pianoInputPill')).toContainText('Input: microphone');
  expect(await page.evaluate(()=>window.NovaPianoTest.getMicrophoneState())).toMatchObject({active:true,intent:'microphone'});

  await page.locator('#pianoRestart').click();
  await expect(page.locator('#pianoInputPill')).toContainText('Input: microphone');
  expect(await page.evaluate(()=>window.NovaPianoTest.getMicrophoneState())).toMatchObject({active:true,intent:'microphone'});

  await page.evaluate(()=>window.NovaPianoTest.getCurrentGame().finish());
  await expect(page.locator('.piano-result-panel')).toBeVisible();
  await page.locator('#pianoPlayAgain').click();
  await expect(page.locator('#pianoInputPill')).toContainText('Input: microphone');
  expect(await page.evaluate(()=>window.NovaPianoTest.getMicrophoneState())).toMatchObject({active:true,intent:'microphone'});

  await page.locator('#pianoExitGame').click();
  expect(await page.evaluate(()=>window.NovaPianoTest.getMicrophoneState())).toMatchObject({active:false,intent:'microphone'});

  await page.locator('.piano-nav-button[data-piano-view="songs"]').click();
  const card=page.locator('.piano-list-card').filter({hasText:'Twinkle, Twinkle, Little Star'});
  await card.getByRole('button',{name:'Listen First'}).click();
  await expect(page.locator('#pianoGame')).toBeVisible();
  await expect(page.locator('#pianoInputPill')).toContainText('no input needed');
  expect(await page.evaluate(()=>window.NovaPianoTest.getMicrophoneState())).toMatchObject({active:false,intent:'microphone'});
  await page.locator('#pianoExitGame').click();

  await page.locator('#pianoSwitchInstrument').click();
  expect(await page.evaluate(()=>window.NovaPianoTest.getMicrophoneState().active)).toBe(false);
  await page.getByRole('button',{name:/Piano Quest Learn piano/}).click();
  await page.locator('.piano-nav-button[data-piano-view="home"]').click();
  await page.locator('[data-song="nova-first-tune"][data-mode="wait"]').first().click();
  await expect(page.locator('#pianoInputPill')).toContainText('Input: microphone');
  expect(await page.evaluate(()=>window.NovaPianoTest.getMicrophoneState().active)).toBe(true);

  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('family-music:profile-changing')));
  await expect(page.locator('#pianoGame')).toBeHidden();
  expect(await page.evaluate(()=>window.NovaPianoTest.getMicrophoneState().active)).toBe(false);
});

test('Piano microphone reacquisition failure is explicit and screen-key fallback stays honest',async({page})=>{
  await installFakeMicrophone(page);
  await createProfileAndOpenPiano(page,'Mic Fallback Test');
  await page.locator('.piano-nav-button[data-piano-view="mic"]').click();
  await page.locator('#pianoMicToggle').click();
  await expect(page.locator('#pianoMicStatus')).toContainText('Microphone Ready');
  await page.locator('.piano-nav-button[data-piano-view="home"]').click();
  await page.evaluate(()=>{window.__fmqMicFail=true;});

  await page.locator('[data-song="nova-first-tune"][data-mode="wait"]').first().click();
  await expect(page.locator('#pianoGame')).toBeVisible();
  await expect(page.locator('#pianoInputPill')).toContainText('Input: screen keys');
  await expect(page.locator('#pianoInputPill')).toContainText('microphone unavailable');
  expect(await page.evaluate(()=>window.NovaPianoTest.getMicrophoneState())).toMatchObject({active:false,intent:'screen'});

  await expect(page.locator('#pianoPause')).toBeEnabled({timeout:8000});
  await page.locator('#pianoGame .piano-key[data-midi="62"]').click();
  await expect(page.locator('#pgScore')).toHaveText('0');
  await page.locator('#pianoGame .piano-key[data-midi="60"]').click();
  await expect(page.locator('#pgScore')).toHaveText('50');
});

test('Piano detector resets stale pitch history without weakening stability/noise gates',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(()=>{
    const events=[];
    const hub={emit:event=>events.push(event)};
    const mic=new window.NovaPianoInputs.MicrophonePianoInput(hub);
    mic.onReading=()=>{};
    const freq=midi=>440*2**((midi-69)/12);
    [1000,1085,1170].forEach(t=>mic.processCandidate({frequency:freq(60),confidence:.9},.03,t));
    const afterC={events:events.map(e=>e.midi),history:mic.history.length,stableFrames:mic.stableFrames};
    mic.processCandidate({frequency:freq(62),confidence:.9},.03,1255);
    const firstD={history:mic.history.length,historyMidi:mic.historyMidi,stableFrames:mic.stableFrames,events:events.map(e=>e.midi)};
    [1340,1425].forEach(t=>mic.processCandidate({frequency:freq(62),confidence:.9},.03,t));
    const afterD=events.map(e=>e.midi);
    const beforeNoise=events.length;
    mic.processCandidate(null,.001,1510);
    [1595,1680,1765].forEach(t=>mic.processCandidate({frequency:freq(64),confidence:.5},.03,t));
    [1850,1935,2020].forEach(t=>mic.processCandidate({frequency:440*2**(((64+.49)-69)/12),confidence:.9},.03,t));

    const providerEvents=[];
    const providerHub=new window.NovaPianoInputs.PianoInputHub();
    providerHub.subscribe(event=>providerEvents.push({type:event.type,midi:event.midi,source:event.source,velocity:event.velocity}));
    const screen=new window.NovaPianoInputs.OnScreenPianoInput(providerHub);
    const midi=new window.NovaPianoInputs.MidiPianoInput(providerHub);
    screen.noteOn(60);screen.noteOff(60);midi.receive([0x90,64,90]);midi.receive([0x80,64,0]);
    return{rules:window.NovaPianoInputs.MIC_RULES,afterC,firstD,afterD,beforeNoise,afterNoise:events.length,providerEvents};
  });

  expect(result.rules).toMatchObject({analysisIntervalMs:85,minRms:.012,minConfidence:.68,maxCents:45,stableFrames:3,emitDebounceMs:330,historySize:5});
  expect(result.afterC.events).toEqual([60]);
  expect(result.firstD).toMatchObject({history:1,historyMidi:62,stableFrames:1,events:[60]});
  expect(result.afterD).toEqual([60,62]);
  expect(result.afterNoise).toBe(result.beforeNoise);
  expect(result.providerEvents).toEqual([
    {type:'noteon',midi:60,source:'screen',velocity:100},
    {type:'noteoff',midi:60,source:'screen',velocity:0},
    {type:'noteon',midi:64,source:'midi',velocity:90},
    {type:'noteoff',midi:64,source:'midi',velocity:0}
  ]);
});

test('generated microphone fundamentals score C3/C4 while wrong notes stay wrong',async({page})=>{
  await installFakeMicrophone(page);
  await createProfileAndOpenPiano(page,'Fundamental Test');
  await page.locator('.piano-nav-button[data-piano-view="mic"]').click();
  await page.locator('#pianoMicToggle').click();
  for(const [lesson,midi,cents] of [['lower-c',48,3],['middle-c',60,6]]){
    await page.locator('.piano-nav-button[data-piano-view="lessons"]').click();
    await page.locator(`[data-lesson="${lesson}"][data-song]`).click();
    await page.locator('#startLessonPractice').click();
    await expect(page.locator('#pianoInputPill')).toContainText('Input: microphone');
    await expect(page.locator('#pianoPause')).toBeEnabled({timeout:8000});
    await expect.poll(()=>page.evaluate(()=>window.NovaPianoTest.getCurrentGame().waiting)).toBe(true);
    const feed=async(note,tuning)=>page.evaluate(({note,tuning})=>{
      const events=[],mic=new window.NovaPianoInputs.MicrophonePianoInput({emit:event=>{events.push(event.midi);window.NovaPianoTest.emitInputForTest(event);}});
      const hz=440*2**((note-69)/12)*2**(tuning/1200),sampleRate=48000;
      for(let frame=0;frame<3;frame++){
        const data=Float32Array.from({length:4096},(_,i)=>{
          const t=(i+frame*4080)/sampleRate,phase=2*Math.PI*hz*t;
          return .1*(Math.sin(phase)+.7*Math.sin(2*phase)+.4*Math.sin(3*phase)+.2*Math.sin(4*phase))/2.3;
        });
        const rms=Math.sqrt(data.reduce((s,v)=>s+v*v,0)/data.length);
        mic.processCandidate(mic.detectPitch(data,sampleRate),rms,1000+frame*85);
      }
      return events;
    },{note,tuning});
    expect(await feed(midi+2,0)).toEqual([midi+2]);
    await expect(page.locator('#pgScore')).toHaveText('0');
    await expect(page.locator('#pianoGame')).toContainText(`Almost! Heard D${midi===48?3:4} · Find C${midi===48?3:4}`);
    expect(await feed(midi,cents)).toEqual([midi]);
    await expect(page.locator('#pgScore')).toHaveText('50');
    await page.locator('#pianoExitGame').click();
  }
});

test('weak-fundamental and noisy C3 score honestly in Wait for Me and Rhythm',async({page})=>{
  const {signal}=require('../test-support/piano-signals');
  await installFakeMicrophone(page);
  await createProfileAndOpenPiano(page,'C3 Octave Test');
  await page.locator('.piano-nav-button[data-piano-view="mic"]').click();
  await page.locator('#pianoMicToggle').click();
  for(const mode of ['wait','normal']){
    if(mode==='wait'){
      await page.locator('.piano-nav-button[data-piano-view="lessons"]').click();
      await page.locator('[data-lesson="lower-c"][data-song]').click();
      await page.locator('#startLessonPractice').click();
    }else{
      await page.locator('.piano-nav-button[data-piano-view="songs"]').click();
      await page.locator('[data-song="two-hand-steps"][data-mode="normal"]').click();
    }
    await expect(page.locator('#pianoInputPill')).toContainText('Input: microphone');
    await expect(page.locator('#pianoPause')).toBeEnabled({timeout:8000});
    // Freeze the gameplay clock at the target, not the scoring window. This is
    // deterministic pitch/scoring coverage, not a physical latency assertion.
    await page.evaluate(()=>{const game=window.NovaPianoTest.getCurrentGame();cancelAnimationFrame(game.raf);game.time=game.targetTracker.current().start;});
    const feed=async(midi,options={})=>{
      const frames=Array.from({length:3},(_,frame)=>Array.from(signal(midi,{...options,sampleRate:44100,start:Math.round(frame*.085*44100)})));
      return page.evaluate(frames=>{
        const events=[],mic=new window.NovaPianoInputs.MicrophonePianoInput({emit:event=>{events.push(event.midi);window.NovaPianoTest.emitInputForTest(event);}});
        frames.forEach((samples,frame)=>{const data=Float32Array.from(samples),level=Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length);mic.processCandidate(mic.detectPitch(data,44100),level,1000+85*frame);});
        return events;
      },frames);
    };
    for(const wrong of [36,60]){
      expect(await feed(wrong)).toEqual([wrong]);
      await expect(page.locator('#pgScore')).toHaveText('0');
      await expect(page.locator('#pianoGameFeedback')).toContainText(`Almost! Heard C${wrong===36?2:4} · Find C3`);
    }
    const timbre=mode==='wait'?{harmonics:[.03,1,0,.3]}:{harmonics:[1,.7,.4,.2],noise:.5,seed:1,phase:1};
    expect(await feed(48,timbre)).toEqual([48]);
    await expect(page.locator('#pgScore')).toHaveText(mode==='wait'?'50':'100');
    await page.locator('#pianoExitGame').click();
    expect(await page.evaluate(()=>window.NovaPianoTest.getMicrophoneState())).toMatchObject({active:false,intent:'microphone'});
  }
});
