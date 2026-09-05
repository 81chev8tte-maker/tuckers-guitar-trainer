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
