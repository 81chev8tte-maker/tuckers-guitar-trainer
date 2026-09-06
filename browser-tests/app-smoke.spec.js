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
  await expect(page.getByText('Ready, Browser Test?')).toBeVisible();
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
