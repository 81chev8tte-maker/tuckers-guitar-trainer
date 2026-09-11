const {test,expect}=require('@playwright/test');

async function openQuickTests(page){
  await page.goto('/');
  await page.getByLabel('Your name').fill('Quick Hardware Child');
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
  await page.getByRole('button',{name:/Hardware & Backup/}).click();
  await page.getByRole('button',{name:/Quick Hardware Tests/}).click();
  await expect(page.getByRole('heading',{name:'Quick Hardware Tests'})).toBeVisible();
}

async function completePianoSynthetic(page){
  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginPianoMicSynthetic());
  await page.evaluate(()=>{for(let i=0;i<12;i++)window.FMQGuidedHardwareTest.feedPianoMic({active:true,level:.001,quiet:true,stable:false});});
  for(const [midi,name] of [[60,'C4'],[62,'D4'],[64,'E4'],[65,'F4'],[67,'G4'],[60,'C4']]){
    await page.evaluate(({midi,name})=>window.FMQGuidedHardwareTest.feedPianoMic({active:true,level:.03,midi,name,stable:true,confidence:.9,frequency:440*Math.pow(2,(midi-69)/12),cents:0}),{midi,name});
  }
}

async function completeGuitarSynthetic(page){
  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginGuitarSynthetic());
  await page.evaluate(()=>{for(let i=0;i<36;i++)window.FMQGuidedHardwareTest.feedAudio({rms:.002,freq:null,midi:null,note:'—',onset:false});});
  await page.evaluate(()=>{
    const api=window.FMQGuidedHardwareTest;
    for(const step of api.rules.GUITAR_STRINGS){
      const freq=440*Math.pow(2,(step.midi-69)/12);
      api.feedAudio({rms:.03,freq,midi:step.midi,note:step.note,onset:true});
      api.feedAudio({rms:.028,freq,midi:step.midi,note:step.note,onset:false});
    }
    for(let i=0;i<3;i++)api.feedAudio({rms:.03,freq:110,midi:45,note:'A2',onset:true});
    api.startSilenceSynthetic();
    for(let i=0;i<36;i++)api.feedAudio({rms:.002,freq:null,midi:null,note:'—',onset:false});
  });
}

async function completeMidiSynthetic(page){
  await page.evaluate(()=>{
    const api=window.FMQGuidedHardwareTest;
    api.beginMidiSynthetic();
    api.feedMidi({type:'noteon',note:'C4',midi:60,velocity:55,channel:1,polyphony:1});
    api.feedMidi({type:'noteoff',note:'C4',midi:60,velocity:0,channel:1,polyphony:0});
    api.feedMidi({type:'noteon',note:'D4',midi:62,velocity:35,channel:1,polyphony:1});
    api.feedMidi({type:'noteon',note:'E4',midi:64,velocity:105,channel:1,polyphony:1});
    api.feedMidi({type:'noteon',note:'G4',midi:67,velocity:90,channel:1,polyphony:2});
    api.feedMidi({type:'controlchange',controller:64,value:127,sustain:true,polyphony:0});
  });
}

async function finishWithHumanEvidence(page,{comment='Combined session evidence'}={}){
  await page.locator('#guidedFinish').click();
  for(const id of ['reaction','delay','smooth','readability','keepPlaying']) await page.locator(`input[name="guided-${id}"][value="good"]`).check();
  await page.locator('input[name="guided-scoring-trust"][value="mostly"]').check();
  await page.locator('#guidedTesterNote').fill(comment);
  await page.getByRole('button',{name:'Save Answers & Finish'}).click();
  await expect(page.locator('#guidedSummary')).toContainText('Hardware test report saved');
}

test('Quick Piano microphone guide rejects quiet, unstable and wrong notes and records truthful evidence',async({page})=>{
  await openQuickTests(page);
  await expect(page.getByRole('button',{name:/Test Guitar Microphone/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Test Piano Microphone/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Test MIDI Keyboard/})).toBeVisible();

  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginPianoMicSynthetic());
  await page.evaluate(()=>{for(let i=0;i<12;i++)window.FMQGuidedHardwareTest.feedPianoMic({active:true,level:.001,quiet:true,stable:false});});
  await expect(page.locator('#guidedPrompt')).toHaveText('Play Middle C');
  await expect(page.locator('#guidedMessage')).toContainText('white key immediately to their left');
  expect((await page.evaluate(()=>window.FMQGuidedHardwareTest.getState())).pianoMicNoteIndex).toBe(0);

  await page.evaluate(()=>window.FMQGuidedHardwareTest.feedPianoMic({active:true,level:.03,midi:60,name:'C4',stable:false,confidence:.9}));
  expect((await page.evaluate(()=>window.FMQGuidedHardwareTest.getState())).pianoMicNoteIndex).toBe(0);
  await expect(page.locator('#guidedMessage')).toContainText('not steady');

  await page.evaluate(()=>window.FMQGuidedHardwareTest.feedPianoMic({active:true,level:.03,midi:62,name:'D4',stable:true,confidence:.9}));
  expect((await page.evaluate(()=>window.FMQGuidedHardwareTest.getState())).pianoMicNoteIndex).toBe(0);
  await expect(page.locator('#guidedMessage')).toContainText('We heard D4');

  const prompts=['Play Middle C','Play D next to Middle C','Play E near Middle C','Play F near Middle C','Play G near Middle C','Play the same Middle C again'];
  for(const [index,[midi,name]] of [[60,'C4'],[62,'D4'],[64,'E4'],[65,'F4'],[67,'G4'],[60,'C4']].entries()){
    await expect(page.locator('#guidedPrompt')).toHaveText(prompts[index]);
    await page.evaluate(({midi,name})=>window.FMQGuidedHardwareTest.feedPianoMic({active:true,level:.03,midi,name,stable:true,confidence:.9,frequency:440*Math.pow(2,(midi-69)/12),cents:0}),{midi,name});
  }
  const session=await page.evaluate(()=>window.FMQGuidedHardwareTest.getSession());
  expect(session.pianoMicrophone.status).toBe('complete');
  expect(session.pianoMicrophone.mode).toBe('monophonic');
  expect(session.pianoMicrophone.notes.map(item=>item.expected.midi)).toEqual([60,62,64,65,67]);
  expect(session.pianoMicrophone.repeated.expected.midi).toBe(60);
  expect(session.pianoMicrophone.repeated.stable).toBe(true);

  await page.locator('#guidedFinish').click();
  await expect(page.locator('#guidedQuestions')).toBeVisible();
  await expect(page.locator('#guidedQuestions')).toContainText('Done! Five quick questions');
  for(const id of ['reaction','delay','smooth','readability','keepPlaying']) await page.locator('input[name="guided-'+id+'"][value="good"]').check();
  await page.locator('input[name="guided-scoring-trust"][value="mostly"]').check();
  await expect(page.locator('#guidedAdultResult')).toHaveValue('not-decided');
  await page.getByRole('button',{name:'Save Answers & Finish'}).click();
  await expect(page.locator('#guidedSummary')).toContainText('Done! Hardware test report saved');
  await expect(page.getByRole('button',{name:'Send Report to Parent'})).toBeVisible();

  const report=await page.evaluate(()=>window.FMQGuidedHardwareTest.reportObject());
  expect(report.appVersion).toBe('2.6.17');
  expect(report.guidedAcceptance.version).toBe(3);
  expect(report.guidedAcceptance.humanEvidence.adultResult).toBe('not-decided');
  expect(report.guidedAcceptance.testsNotPerformed.some(item=>item.includes('Guided Piano microphone'))).toBe(false);
  expect(report.guidedAcceptance.testsNotPerformed.some(item=>item.includes('Piano microphone gameplay / perceived response'))).toBe(true);
  expect(await page.evaluate(()=>window.FMQGuidedHardwareTest.reportText())).toContain('Piano microphone: COMPLETE · monophonic');
});

test('Guitar then Piano accumulate under one session and retain reviewed human provenance',async({page})=>{
  await openQuickTests(page);
  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginNew());
  await completeGuitarSynthetic(page);
  await finishWithHumanEvidence(page,{comment:'Adult observed the Guitar path.'});
  const first=await page.evaluate(()=>window.FMQGuidedHardwareTest.getSession());

  await page.getByRole('button',{name:'Test Another Input'}).click();
  await expect(page.locator('#guidedSessionLabel')).toContainText(first.sessionId);
  await expect(page.getByRole('button',{name:/Test Guitar Microphone/}).locator('small')).toContainText('Complete');
  await completePianoSynthetic(page);
  const accumulated=await page.evaluate(()=>window.FMQGuidedHardwareTest.getSession());
  expect(accumulated.sessionId).toBe(first.sessionId);
  expect(accumulated.guitar.status).toBe('complete');
  expect(accumulated.pianoMicrophone.status).toBe('complete');

  await page.locator('#guidedFinish').click();
  await expect(page.locator('#guidedQuestions')).toContainText('earlier session answers are loaded');
  await expect(page.locator('input[name="guided-reaction"][value="good"]')).toBeChecked();
  await expect(page.locator('#guidedTesterNote')).toHaveValue('Adult observed the Guitar path.');
  await page.locator('#guidedTesterNote').fill('Adult reviewed Guitar and Piano together.');
  await page.getByRole('button',{name:'Save Answers & Finish'}).click();

  const report=await page.evaluate(()=>window.FMQGuidedHardwareTest.reportObject());
  expect(report.guidedAcceptance.sessionId).toBe(first.sessionId);
  expect(report.guidedAcceptance.guitar.status).toBe('complete');
  expect(report.guidedAcceptance.pianoMicrophone.status).toBe('complete');
  expect(report.guidedAcceptance.testsNotPerformed.some(item=>item.includes('Guided Guitar'))).toBe(false);
  expect(report.guidedAcceptance.testsNotPerformed.some(item=>item.includes('Guided Piano microphone'))).toBe(false);
  expect(report.guidedAcceptance.testsNotPerformed.some(item=>item.includes('Guided Piano MIDI'))).toBe(true);
  expect(report.guidedAcceptance.humanEvidence.recordedAt).toBe(first.humanEvidence.recordedAt);
  expect(report.guidedAcceptance.humanEvidence.coversGuidedPaths).toEqual(['guitar','pianoMicrophone']);
  expect(report.guidedAcceptance.humanEvidence.testerNote).toBe('Adult reviewed Guitar and Piano together.');
  const text=await page.evaluate(()=>window.FMQGuidedHardwareTest.reportText());
  expect(text).toContain('Human evidence scope: Guitar microphone, Piano microphone');
  expect(text).toContain('Guitar microphone: COMPLETE');
  expect(text).toContain('Piano microphone: COMPLETE');
});

test('Piano then Guitar and MIDI accumulate until explicit new-session reset',async({page})=>{
  await openQuickTests(page);
  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginNew());
  await completePianoSynthetic(page);
  await finishWithHumanEvidence(page,{comment:'Adult observed the Piano path.'});
  const firstSessionId=await page.evaluate(()=>window.FMQGuidedHardwareTest.getSession().sessionId);

  await page.getByRole('button',{name:'Test Another Input'}).click();
  await completeGuitarSynthetic(page);
  await completeMidiSynthetic(page);
  await page.locator('#guidedFinish').click();
  await page.getByRole('button',{name:'Save Answers & Finish'}).click();

  const combined=await page.evaluate(()=>window.FMQGuidedHardwareTest.reportObject().guidedAcceptance);
  expect(combined.sessionId).toBe(firstSessionId);
  expect([combined.guitar.status,combined.pianoMicrophone.status,combined.midi.status]).toEqual(['complete','complete','complete']);
  expect(combined.testsNotPerformed.some(item=>item.startsWith('Guided '))).toBe(false);
  expect(combined.humanEvidence.coversGuidedPaths).toEqual(['guitar','pianoMicrophone','midi']);

  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Start New Test Session'}).click();
  const reset=await page.evaluate(()=>window.FMQGuidedHardwareTest.reportObject().guidedAcceptance);
  expect(reset.sessionId).not.toBe(firstSessionId);
  expect([reset.guitar.status,reset.pianoMicrophone.status,reset.midi.status]).toEqual(['not-run','not-run','not-run']);
  expect(reset.humanObservations).toEqual({});
  await expect(page.getByRole('button',{name:/Test Piano Microphone/}).locator('small')).toContainText('Not run');
});
