const {test,expect}=require('@playwright/test');

async function installWakeLockMock(page){
  await page.addInitScript(()=>{
    window.__fmqWakeRequests=[];
    window.__fmqWakeReleases=0;
    window.__fmqWakeSentinels=[];
    const api={request:async type=>{
      window.__fmqWakeRequests.push(type);
      const listeners=[];
      const sentinel={released:false,addEventListener(event,fn){if(event==='release')listeners.push(fn);},async release(){if(this.released)return;this.released=true;window.__fmqWakeReleases++;listeners.forEach(fn=>fn());}};
      window.__fmqWakeSentinels.push(sentinel);
      return sentinel;
    }};
    Object.defineProperty(navigator,'wakeLock',{configurable:true,value:api});
  });
}

async function createProfile(page,name='Wake Lock Tester'){
  await page.goto('/');
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
  await expect(page.getByRole('heading',{name:'What are we playing today?'})).toBeVisible();
}

async function wakeRequests(page){return page.evaluate(()=>window.__fmqWakeRequests.length);}
async function wakeReleases(page){return page.evaluate(()=>window.__fmqWakeReleases);}

test('active Guitar and Piano practice request and release the screen wake lock',async({page})=>{
  await installWakeLockMock(page);
  await createProfile(page);

  await page.getByRole('button',{name:/Guitar Quest Learn guitar/}).click();
  await page.evaluate(()=>{window.FMQGuitarTest.setPerformanceInputAnalysis(false);window.FMQGuitarTest.launchSyntheticStressLevel(48);});
  await page.locator('#gameStart').click();
  await expect.poll(()=>wakeRequests(page)).toBeGreaterThan(0);
  await expect(page.locator('#gameScreen')).toHaveClass(/playing/);
  await page.locator('#exitGame').click();
  await expect.poll(()=>wakeReleases(page)).toBeGreaterThan(0);
  await expect(page.locator('#gameScreen')).toBeHidden();

  const beforePiano=await wakeRequests(page);
  await page.getByRole('button',{name:'🎵 Instruments'}).first().click();
  await page.getByRole('button',{name:/Piano Quest Learn piano/}).click();
  await page.locator('[data-song="nova-first-tune"][data-mode="wait"]').first().click();
  await expect(page.locator('#pianoGame')).toBeVisible();
  await expect.poll(()=>wakeRequests(page)).toBeGreaterThan(beforePiano);
  const releasesBeforePianoExit=await wakeReleases(page);
  await page.locator('#pianoExitGame').click();
  await expect(page.locator('#pianoGame')).toBeHidden();
  await expect.poll(()=>wakeReleases(page)).toBeGreaterThan(releasesBeforePianoExit);
});

test('active Guided Hardware Test holds wake lock but idle Hardware & Backup does not',async({page})=>{
  await installWakeLockMock(page);
  await createProfile(page,'Guided Wake Tester');
  await page.locator('#openDiagnostics').click();
  await expect(page.getByRole('heading',{name:'Hardware & Backup'})).toBeVisible();
  expect(await wakeRequests(page)).toBe(0);

  await page.locator('[data-diag-tab="guided"]').click();
  await page.evaluate(()=>window.FMQGuidedHardwareTest.beginGuitarSynthetic());
  await expect(page.locator('#guidedTask')).toBeVisible();
  await expect.poll(()=>wakeRequests(page)).toBe(1);

  await page.evaluate(()=>window.FMQGuidedHardwareTest.cancel('Automated lifecycle test'));
  await expect(page.locator('#guidedTask')).toBeHidden();
  await expect.poll(()=>wakeReleases(page)).toBeGreaterThan(0);
  await page.locator('#closeDiagnostics').click();
  expect(await page.evaluate(()=>window.FMQHardware.wakeLock.snapshot().wanted)).toBe(false);
});
