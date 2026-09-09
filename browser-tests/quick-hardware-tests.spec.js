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

test('Quick Piano microphone guide rejects quiet, unstable and wrong notes and records truthful evidence',async({page})=>{
  await openQuickTests(page);
  await expect(page.getByRole('button',{name:/Test Guitar Microphone/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Test Piano Microphone/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Test MIDI Keyboard/})).toBeVisible();

  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginPianoMicSynthetic());
  await page.evaluate(()=>{for(let i=0;i<12;i++)window.FMQGuidedHardwareTest.feedPianoMic({active:true,level:.001,quiet:true,stable:false});});
  await expect(page.locator('#guidedPrompt')).toHaveText('Play C');
  expect((await page.evaluate(()=>window.FMQGuidedHardwareTest.getState())).pianoMicNoteIndex).toBe(0);

  await page.evaluate(()=>window.FMQGuidedHardwareTest.feedPianoMic({active:true,level:.03,midi:60,name:'C4',stable:false,confidence:.9}));
  expect((await page.evaluate(()=>window.FMQGuidedHardwareTest.getState())).pianoMicNoteIndex).toBe(0);
  await expect(page.locator('#guidedMessage')).toContainText('not steady');

  await page.evaluate(()=>window.FMQGuidedHardwareTest.feedPianoMic({active:true,level:.03,midi:62,name:'D4',stable:true,confidence:.9}));
  expect((await page.evaluate(()=>window.FMQGuidedHardwareTest.getState())).pianoMicNoteIndex).toBe(0);
  await expect(page.locator('#guidedMessage')).toContainText('We heard D4');

  for(const [midi,name] of [[60,'C4'],[62,'D4'],[64,'E4'],[65,'F4'],[67,'G4'],[60,'C4']]){
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
  expect(report.appVersion).toBe('2.6.15');
  expect(report.guidedAcceptance.version).toBe(3);
  expect(report.guidedAcceptance.humanEvidence.adultResult).toBe('not-decided');
  expect(report.guidedAcceptance.testsNotPerformed.some(item=>item.includes('Guided Piano microphone'))).toBe(false);
  expect(report.guidedAcceptance.testsNotPerformed.some(item=>item.includes('Piano microphone gameplay / perceived response'))).toBe(true);
  expect(await page.evaluate(()=>window.FMQGuidedHardwareTest.reportText())).toContain('Piano microphone: COMPLETE · monophonic');
});

test('unperformed Quick Piano microphone remains explicit while Guitar and MIDI synthetic paths remain callable',async({page})=>{
  await openQuickTests(page);
  const initial=await page.evaluate(()=>{
    window.FMQGuidedHardwareTest.beginNew();
    return window.FMQGuidedHardwareTest.getSession();
  });
  expect(initial.pianoMicrophone.status).toBe('not-run');
  expect((await page.evaluate(()=>window.FMQGuidedHardwareTest.rules.computeNotPerformed(window.FMQGuidedHardwareTest.getSession()))).some(item=>item.includes('Guided Piano microphone'))).toBe(true);
  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginGuitarSynthetic());
  expect((await page.evaluate(()=>window.FMQGuidedHardwareTest.getState())).path).toBe('guitar');
  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginMidiSynthetic());
  expect((await page.evaluate(()=>window.FMQGuidedHardwareTest.getState())).path).toBe('midi');
});
