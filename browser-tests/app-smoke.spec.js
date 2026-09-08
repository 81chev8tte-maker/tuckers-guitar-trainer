const {test,expect}=require('@playwright/test');

test('profile, diagnostics, instrument switching, and Piano cleanup work',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Your name').fill('Browser Test');
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
  await expect(page.getByRole('heading',{name:'What are we playing today?'})).toBeVisible();
  await page.getByRole('button',{name:/Hardware & Backup/}).click();
  await expect(page.getByRole('heading',{name:'Hardware & Backup'})).toBeVisible();
  await page.getByRole('button',{name:'Close'}).click();
  await page.getByRole('button',{name:/Guitar Quest Learn guitar/}).click();
  await expect(page.getByRole('heading',{name:'Learn guitar by actually playing guitar.'})).toBeVisible();
  await page.evaluate(()=>{window.FMQGuitarTest.startTestCountdown(60,1);return true;});
  await expect.poll(()=>page.evaluate(()=>window.FMQGuitarTest.isCountdownActive()&&!document.querySelector('#countdown').hidden)).toBe(true);
  await page.evaluate(()=>window.FMQGuitarTest.cancelCountdown());
  await expect.poll(()=>page.evaluate(()=>!window.FMQGuitarTest.isCountdownActive()&&document.querySelector('#countdown').hidden)).toBe(true);
  await page.getByRole('button',{name:'🎵 Instruments'}).first().click();
  await page.getByRole('button',{name:/Piano Quest Learn piano/}).click();
  await expect(page.getByRole('heading',{name:'Learn piano one note at a time.'})).toBeVisible();
  await page.locator('[data-song="nova-first-tune"][data-mode="wait"]').first().click();
  await expect(page.locator('#pianoGame')).toBeVisible();
  await expect(page.locator('#pianoPause')).toBeEnabled({timeout:8000});
  await page.locator('#pianoGame .piano-key[data-midi="60"]').click();
  await expect(page.locator('#pgScore')).toHaveText('50');
  await page.locator('#pianoPause').click();
  await expect(page.locator('#pianoPause')).toHaveText('Resume');
  await expect.poll(()=>page.evaluate(()=>window.NovaPianoTest.getActiveVoiceCount())).toBe(0);
  await page.locator('#pianoExitGame').click();
  await expect(page.locator('#pianoGame')).toBeHidden();
  await page.reload();
  await expect(page.getByRole('heading',{name:'What are we playing today?'})).toBeVisible();
  await expect(page.locator('#instrumentChooser [data-player-name]').first()).toHaveText('Browser Test');
  await expect(page.locator('#pianoApp')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/piano-active/);
});

test('browser target groups accept chord notes in any order',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(()=>{const notes=[60,64,67].map(midi=>({midi,start:1})),orders=[[60,64,67],[67,60,64],[64,67,60]];return orders.map(order=>{const tracker=new window.FMQGameplayRules.PianoTargetTracker(notes);return order.map(midi=>tracker.accept(midi)).map(hit=>({accepted:hit.accepted,complete:hit.complete}));});});
  for(const order of result){expect(order.map(hit=>hit.accepted)).toEqual([true,true,true]);expect(order.map(hit=>hit.complete)).toEqual([false,false,true]);}
});

test('complete Songbook arrangements open in every supported practice path',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Your name').fill('Songbook Test');
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
  await page.getByRole('button',{name:/Piano Quest Learn piano/}).click();
  await page.getByRole('button',{name:'♫ Songs'}).click();
  const card=page.locator('.piano-list-card').filter({hasText:'Twinkle, Twinkle, Little Star'});
  await expect(card.getByText('14 measures')).toBeVisible();
  await expect(card.locator('.piano-section-select option')).toHaveCount(5);
  await card.getByRole('button',{name:'Listen First'}).click();
  await expect(page.locator('#pianoGame')).toBeVisible();
  await expect(page.locator('.piano-game-title')).toContainText('Twinkle');
  await page.locator('#pianoExitGame').click();
  await card.locator('.piano-section-select').selectOption('phrase:1');
  await card.getByRole('button',{name:'Learn Melody'}).click();
  await expect(page.locator('#pianoGame')).toBeVisible();
  await page.locator('#pianoExitGame').click();
  await card.getByRole('button',{name:'Hands Together'}).click();
  await expect(page.locator('#pianoGame')).toBeVisible();
  await page.locator('#pianoExitGame').click();
});

test('built-in Guitar Songbook launches both learning views and phrase practice',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Your name').fill('Guitar Book Test');
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
  await page.getByRole('button',{name:/Guitar Quest Learn guitar/}).click();
  await page.locator('.nav-button[data-view-target="songs"]').click();
  const card=page.locator('.guitar-book-card').filter({hasText:'Ode to Joy'});
  await expect(card.getByText('104 BPM',{exact:true})).toBeVisible();
  await card.getByRole('button',{name:'Note Highway'}).click();
  await expect(page.locator('#gameScreen')).toBeVisible();
  await expect(page.locator('#gameScreen')).not.toHaveClass(/tab-mode/);
  await page.locator('#exitGame').click();
  await card.locator('[data-guitar-book-section]').selectOption('1');
  await card.getByRole('button',{name:'Tab View'}).click();
  await expect(page.locator('#gameScreen')).toBeVisible();
  await expect(page.locator('#gameScreen')).toHaveClass(/tab-mode/);
  await expect(page.locator('#gameLevelTitle')).toContainText('Answer');
  await page.locator('#exitGame').click();
});


test('Guitar rendering stays bounded with a 2,000-event synthetic run',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Your name').fill('Guitar Stress Test');
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
  await page.getByRole('button',{name:/Guitar Quest Learn guitar/}).click();
  const first=await page.evaluate(()=>window.FMQGuitarTest.launchSyntheticStressLevel(2000));
  expect(first.totalEvents).toBe(2000);
  expect(first.renderedEvents).toBeLessThan(120);
  expect(await page.locator('#noteLayer .falling-note').count()).toBeLessThan(120);
  await expect(page.locator('#noteLayer .note-string')).toHaveCount(0);
  const firstNote=page.locator('#noteLayer .falling-note').first();
  await expect(firstNote.locator('.fret-value')).toBeVisible();
  const numericNote=page.locator('#noteLayer .falling-note:not(.open-note)').first();
  await expect(numericNote.locator('.fret-value')).toBeVisible();
  const fretPresentation=await numericNote.evaluate(el=>{
    const fret=el.querySelector('.fret-value');
    const noteRect=el.getBoundingClientRect();
    const fretRect=fret.getBoundingClientRect();
    return {
      dx:Math.abs((noteRect.left+noteRect.width/2)-(fretRect.left+fretRect.width/2)),
      dy:Math.abs((noteRect.top+noteRect.height/2)-(fretRect.top+fretRect.height/2)),
      fontSize:Number.parseFloat(getComputedStyle(fret).fontSize)
    };
  });
  expect(fretPresentation.dx).toBeLessThan(2.5);
  expect(fretPresentation.dy).toBeLessThan(2.5);
  expect(fretPresentation.fontSize).toBeGreaterThanOrEqual(24);
  const openFontSize=await page.locator('#noteLayer .falling-note.open-note .fret-value').first().evaluate(el=>Number.parseFloat(getComputedStyle(el).fontSize));
  expect(openFontSize).toBeGreaterThanOrEqual(18);
  await expect(page.locator('#stringLabels small')).toHaveCount(2);
  await expect(page.locator('#stringLabels')).not.toContainText('6 thick');
  await expect(page.locator('#stringLabels')).not.toContainText('1 thin');
  await expect(page.locator('#handPositionText')).toHaveText('D 5  ·  A 3  ·  E OPEN');
  await expect(page.locator('#nextNoteText')).toHaveText('D 5 · A 3 · E OPEN');
  const middle=await page.evaluate(()=>window.FMQGuitarTest.jumpRenderForTest(60));
  expect(middle.totalEvents).toBe(2000);
  expect(middle.renderedEvents).toBeLessThan(120);
  expect(await page.locator('#noteLayer .falling-note').count()).toBeLessThan(120);
  await page.evaluate(()=>window.FMQGuitarTest.setGameViewForTest('tab'));
  const tab=await page.evaluate(()=>window.FMQGuitarTest.jumpRenderForTest(60));
  expect(tab.tabEvents).toBeLessThanOrEqual(48);
  expect(await page.locator('#liveTab .tab-note').count()).toBeLessThanOrEqual(288);
  await expect(page.locator('#liveTab .tab-playhead')).toBeVisible();
});


test('guided Hardware Acceptance Test records evidence and supports project copy/share/download paths',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Your name').fill('Hardware Guide Test');
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
  await page.getByRole('button',{name:/Hardware & Backup/}).click();
  await page.getByRole('button',{name:/Run Hardware Test/}).click();
  await expect(page.getByRole('heading',{name:'Guided Hardware Test'})).toBeVisible();
  await page.getByRole('button',{name:'🎸 Microphone'}).click();
  await expect(page.getByRole('heading',{name:'Production Guitar Input'})).toBeVisible();
  await page.getByRole('button',{name:'🧪 Guided Test'}).click();

  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginGuitarSynthetic());
  await page.evaluate(()=>{for(let i=0;i<36;i++)window.FMQGuidedHardwareTest.feedAudio({rms:.002,freq:null,midi:null,note:'—',onset:false});});
  await expect(page.locator('#guidedPrompt')).toContainText('thick E string');
  await page.evaluate(()=>window.FMQGuidedHardwareTest.feedAudio({rms:.03,freq:110,midi:45,note:'A2',onset:true}));
  expect(await page.evaluate(()=>window.FMQGuidedHardwareTest.getState().stringIndex)).toBe(0);
  await page.evaluate(()=>{
    const api=window.FMQGuidedHardwareTest;
    for(const step of api.rules.GUITAR_STRINGS){
      const freq=440*Math.pow(2,(step.midi-69)/12);
      api.feedAudio({rms:.03,freq,midi:step.midi,note:step.note,onset:true});
      api.feedAudio({rms:.028,freq,midi:step.midi,note:step.note,onset:false});
    }
  });
  const firstString=await page.evaluate(()=>window.FMQGuidedHardwareTest.getSession().guitar.strings[0]);
  expect(firstString.retries).toBe(1);
  expect(firstString.stable).toBe(true);
  await expect(page.locator('#guidedPrompt')).toContainText('A string three times');
  await page.evaluate(()=>{for(let i=0;i<3;i++)window.FMQGuidedHardwareTest.feedAudio({rms:.03,freq:110,midi:45,note:'A2',onset:true});});
  await expect(page.locator('#guidedAction')).toHaveText('Start Silence Check');
  await page.evaluate(()=>window.FMQGuidedHardwareTest.startSilenceSynthetic());
  await page.evaluate(()=>{for(let i=0;i<36;i++)window.FMQGuidedHardwareTest.feedAudio({rms:.002,freq:null,midi:null,note:'—',onset:false});});
  expect(await page.evaluate(()=>window.FMQGuidedHardwareTest.getSession().guitar.status)).toBe('complete');

  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginMidiSynthetic());
  await page.evaluate(()=>{
    const api=window.FMQGuidedHardwareTest;
    api.feedMidi({type:'noteon',note:'C4',midi:60,velocity:55,channel:1,polyphony:1});
    api.feedMidi({type:'noteoff',note:'C4',midi:60,velocity:0,channel:1,polyphony:0});
    api.feedMidi({type:'noteon',note:'D4',midi:62,velocity:35,channel:1,polyphony:1});
    api.feedMidi({type:'noteon',note:'E4',midi:64,velocity:105,channel:1,polyphony:1});
    api.feedMidi({type:'noteon',note:'G4',midi:67,velocity:90,channel:1,polyphony:2});
    api.feedMidi({type:'controlchange',controller:64,value:127,sustain:true,polyphony:0});
  });
  const midi=await page.evaluate(()=>window.FMQGuidedHardwareTest.getSession().midi);
  expect(midi.status).toBe('complete');
  expect(midi.noteOn.note).toBe('C4');
  expect(midi.noteOff.note).toBe('C4');
  expect(midi.velocitySamples).toEqual([35,105]);
  expect(midi.polyphonyMax).toBe(2);
  expect(midi.sustain.observed).toBe(true);

  await page.locator('#guidedFinish').click();
  for(const id of ['reaction','delay','smooth','readability','keepPlaying']) await page.locator(`input[name="guided-${id}"][value="good"]`).check();
  await page.locator('#guidedAdultResult').selectOption('not-decided');
  await page.locator('#guidedAdultHelp').selectOption('1');
  await page.locator('#guidedAdultHelpNote').fill('Needed help choosing the test input.');
  await page.locator('input[name="guided-scoring-trust"][value="mostly"]').check();
  await page.locator('#guidedChildComment').fill('The open notes are easier now.');
  await page.locator('#guidedTesterNote').fill('USB guitar cable, Chromebook on charger, moderate room noise.');
  await page.locator('#guidedEvidenceRefs').fill('highway-open-note.jpg\nfull-song-stutter.mp4');
  await page.getByRole('button',{name:'Save Answers & Finish'}).click();
  await expect(page.locator('#guidedSummary')).toContainText('Hardware test report saved');

  const report=await page.evaluate(()=>window.FMQGuidedHardwareTest.reportObject());
  expect(report.appVersion).toBe('2.6.14');
  expect(report.guidedAcceptance.version).toBe(3);
  expect(report.guidedAcceptance.sessionId).toMatch(/^FMQ-HW-\d{4}-\d{2}-\d{2}-\d{2,}$/);
  expect(report.guidedAcceptance.humanObservations.source).toBe('human');
  expect(report.guidedAcceptance.humanEvidence.adultResult).toBe('not-decided');
  expect(report.guidedAcceptance.humanEvidence.adultHelpRequired).toBe('1');
  expect(report.guidedAcceptance.humanEvidence.childScoringTrust).toBe('mostly');
  expect(report.guidedAcceptance.humanEvidence.childComment).toBe('The open notes are easier now.');
  expect(report.guidedAcceptance.humanEvidence.evidenceReferences).toEqual(['highway-open-note.jpg','full-song-stutter.mp4']);
  expect(report.guidedAcceptance.testsNotPerformed.some(item=>item.includes('USB audio disconnect/reconnect'))).toBe(true);
  const sessionId=report.guidedAcceptance.sessionId;

  const projectText=await page.evaluate(()=>window.FMQGuidedHardwareTest.reportText());
  expect(projectText).toContain('Family Music Quest — Project Hardware Report');
  expect(projectText).toContain('Commit/build: Not available');
  expect(projectText).toContain('Browser tab');
  expect(projectText).toContain(`Session: ${sessionId}`);
  expect(projectText).toContain('Adult result: NOT DECIDED');
  expect(projectText).toContain('Adult help required: 1');
  expect(projectText).toContain('Child trusted scoring: Mostly');
  expect(projectText).toContain('Guitar: COMPLETE · 6/6 open strings passed · retries 1');
  expect(projectText).toContain('Piano/MIDI: COMPLETE');
  expect(projectText).toContain('highway-open-note.jpg');
  expect(projectText).not.toContain('recentEvents');

  const standaloneProjectText=await page.evaluate(()=>{
    const originalMatchMedia=window.matchMedia;
    window.matchMedia=query=>({matches:query==='(display-mode: standalone)'});
    const text=window.FMQGuidedHardwareTest.reportText();
    window.matchMedia=originalMatchMedia;
    return text;
  });
  expect(standaloneProjectText).toContain('Installed PWA');

  await page.getByRole('button',{name:'View Report'}).click();
  await expect(page.getByRole('button',{name:'Copy Project Report'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Send Report to Parent'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Download JSON'})).toBeVisible();
  await expect(page.getByRole('button',{name:'🎸 Microphone'})).toBeVisible();

  await page.evaluate(()=>{
    window.__copiedProject='';
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedProject=text;}}});
  });
  await page.getByRole('button',{name:'Copy Project Report'}).click();
  await expect.poll(()=>page.evaluate(()=>window.__copiedProject)).toContain('Adult result: NOT DECIDED');

  await page.evaluate(()=>{
    window.__downloadClicks=0;
    window.__downloadJson='';
    window.__canShareCalls=[];
    window.__sharedData=null;
    const originalCreate=URL.createObjectURL.bind(URL);
    URL.createObjectURL=blob=>{blob.text().then(text=>{window.__downloadJson=text;});return originalCreate(blob);};
    HTMLAnchorElement.prototype.click=function(){window.__downloadClicks++;};
    Object.defineProperty(navigator,'canShare',{configurable:true,value:data=>{window.__canShareCalls.push((data.files||[]).map(file=>file.name));return Boolean(data.files?.length===2);}});
    Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__sharedData={title:data.title,text:data.text,files:await Promise.all((data.files||[]).map(async file=>({name:file.name,type:file.type,text:await file.text()})))};}});
  });
  await page.getByRole('button',{name:'Send Report to Parent'}).click();
  await expect.poll(()=>page.evaluate(()=>Boolean(window.__sharedData))).toBe(true);
  const sharedData=await page.evaluate(()=>window.__sharedData);
  expect(sharedData.files).toHaveLength(2);
  expect(sharedData.files[0].name).toMatch(/\.json$/);
  expect(sharedData.files[1].name).toMatch(/-parent-report\.txt$/);
  expect(sharedData.text).toContain('Family Music Quest — Project Hardware Report');
  expect(sharedData.text).toContain(sessionId);
  expect(sharedData.files[1].text).toContain('STRUCTURED HARDWARE VALIDATION JSON');
  expect(sharedData.files[1].text).toContain(sessionId);
  const shared=JSON.parse(sharedData.files[0].text);
  expect(shared.guidedAcceptance.sessionId).toBe(sessionId);
  expect(shared.guidedAcceptance.humanEvidence.childScoringTrust).toBe('mostly');
  expect(await page.evaluate(()=>window.__downloadClicks)).toBe(0);
  expect((await page.evaluate(()=>window.__canShareCalls))[0]).toHaveLength(2);

  await page.evaluate(()=>{
    window.__sharedData=null;window.__canShareCalls=[];
    Object.defineProperty(navigator,'canShare',{configurable:true,value:data=>{const names=(data.files||[]).map(file=>file.name);window.__canShareCalls.push(names);return names.length===1&&names[0].endsWith('-parent-report.txt');}});
    Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__sharedData={text:data.text,files:await Promise.all((data.files||[]).map(async file=>({name:file.name,text:await file.text()})))};}});
  });
  await page.getByRole('button',{name:'Send Report to Parent'}).click();
  await expect.poll(()=>page.evaluate(()=>Boolean(window.__sharedData))).toBe(true);
  const textFallback=await page.evaluate(()=>window.__sharedData);
  expect(textFallback.files).toHaveLength(1);
  expect(textFallback.files[0].name).toMatch(/-parent-report\.txt$/);
  expect(textFallback.files[0].text).toContain('STRUCTURED HARDWARE VALIDATION JSON');
  expect(textFallback.files[0].text).toContain(sessionId);

  await page.evaluate(()=>{
    window.__downloadClicks=0;window.__downloadJson='';
    Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});
    Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
  });
  await page.getByRole('button',{name:'Send Report to Parent'}).click();
  await expect(page.locator('#diagReportActionStatus')).toContainText('JSON report was downloaded');
  await expect.poll(()=>page.evaluate(()=>window.__downloadClicks)).toBe(1);
  await expect.poll(()=>page.evaluate(()=>window.__downloadJson||'')).toContain(sessionId);
  const fallback=await page.evaluate(()=>JSON.parse(window.__downloadJson));
  expect(fallback.guidedAcceptance).toEqual(shared.guidedAcceptance);

  await page.evaluate(()=>{
    window.__downloadClicks=0;
    Object.defineProperty(navigator,'canShare',{configurable:true,value:data=>Boolean(data.files?.length===2)});
    Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('cancelled','AbortError');}});
  });
  await page.getByRole('button',{name:'Send Report to Parent'}).click();
  await expect(page.locator('#diagReportActionStatus')).toContainText('Nothing was sent');
  expect(await page.evaluate(()=>window.__downloadClicks)).toBe(0);
  expect((await page.evaluate(()=>window.FMQGuidedHardwareTest.getSession())).sessionId).toBe(sessionId);

  await page.evaluate(()=>{
    window.__downloadClicks=0;
    Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new Error('share failed');}});
  });
  await page.getByRole('button',{name:'Send Report to Parent'}).click();
  await expect(page.locator('#diagReportActionStatus')).toContainText('Nothing was removed');
  expect(await page.evaluate(()=>window.__downloadClicks)).toBe(0);

  await page.evaluate(()=>{window.__downloadClicks=0;window.__downloadJson='';});
  await page.getByRole('button',{name:'Download JSON'}).click();
  await expect.poll(()=>page.evaluate(()=>window.__downloadClicks)).toBe(1);
  await expect.poll(()=>page.evaluate(()=>window.__downloadJson||'')).toContain(sessionId);
  const downloaded=await page.evaluate(()=>JSON.parse(window.__downloadJson));
  expect(downloaded.guidedAcceptance).toEqual(shared.guidedAcceptance);

  await page.reload();
  await expect.poll(()=>page.evaluate(()=>window.FMQGuidedHardwareTest?.getSession()?.sessionId || null)).toBe(sessionId);

  await page.evaluate(()=>{window.FMQGuidedHardwareTest.beginNew();return window.FMQGuidedHardwareTest.beginGuitarSynthetic();});
  await page.evaluate(()=>window.FMQGuidedHardwareTest.cancel('Browser cancellation test'));
  const cleanup=await page.evaluate(()=>window.FMQGuidedHardwareTest.getState());
  expect(cleanup.path).toBe(null);
  expect(cleanup.resources.audioSubscribed).toBe(false);
  expect(cleanup.resources.midiSubscribed).toBe(false);
});
