const {test,expect}=require('@playwright/test');

async function expectChooser(page,name){
  await expect(page.getByRole('heading',{name:'What are we playing today?'})).toBeVisible();
  await expect(page.locator('#instrumentChooser [data-player-name]').first()).toHaveText(name);
  await expect(page.locator('#pianoApp')).toBeHidden();
  await expect(page.locator('#gameScreen')).toBeHidden();
  await expect(page.locator('#resultScreen')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/piano-active/);
  const box=await page.locator('#instrumentChooser').boundingBox();
  const viewport=page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.width).toBeGreaterThan(viewport.width*.9);
  expect(box.height).toBeGreaterThan(viewport.height*.9);
}

test('fresh setup and persisted startups stay profile-safe at the instrument chooser',async({page,context})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:"Who's playing?"})).toBeVisible();
  await expect(page.locator('#instrumentChooser')).toBeHidden();
  await expect(page.locator('#pianoApp')).toBeHidden();

  await page.getByLabel('Your name').fill('Startup One');
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
  await expectChooser(page,'Startup One');
  await expect(page.locator('#instrumentChooser [data-player-avatar]').first()).not.toHaveText('');

  await page.evaluate(()=>window.FMQProfiles.saveInstrumentProgress('guitar',{startupMarker:'profile-one'}));

  await page.locator('#profileMenuButton').click();
  await page.getByRole('button',{name:/Add Player/}).click();
  await page.getByLabel('Your name').fill('Startup Two');
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
  await expectChooser(page,'Startup Two');
  expect(await page.evaluate(()=>window.FMQProfiles.getInstrumentProgress('guitar'))).toBe(null);

  await page.locator('#profileMenuButton').click();
  await page.getByRole('button',{name:/Startup One/}).click();
  await expectChooser(page,'Startup One');
  expect(await page.evaluate(()=>window.FMQProfiles.getInstrumentProgress('guitar')?.startupMarker)).toBe('profile-one');

  await page.getByRole('button',{name:/Guitar Quest Learn guitar/}).click();
  await expect(page.getByRole('heading',{name:'Learn guitar by actually playing guitar.'})).toBeVisible();
  await page.evaluate(()=>{window.FMQGuitarTest.startTestCountdown(60,1);return true;});
  await expect.poll(()=>page.evaluate(()=>window.FMQGuitarTest.isCountdownActive())).toBe(true);
  await page.getByRole('button',{name:'🎵 Instruments'}).first().click();
  await expectChooser(page,'Startup One');
  await expect.poll(()=>page.evaluate(()=>window.FMQGuitarTest.isCountdownActive())).toBe(false);
  expect(await page.evaluate(()=>localStorage.getItem('family-music-instrument-v1'))).toBe('guitar');

  await page.reload();
  await expectChooser(page,'Startup One');

  await page.getByRole('button',{name:/Piano Quest Learn piano/}).click();
  await expect(page.getByRole('heading',{name:'Learn piano one note at a time.'})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('family-music-instrument-v1'))).toBe('piano');
  await page.locator('#pianoSwitchInstrument').click();
  await expectChooser(page,'Startup One');

  await page.getByRole('button',{name:/Piano Quest Learn piano/}).click();
  await expect(page.getByRole('heading',{name:'Learn piano one note at a time.'})).toBeVisible();
  await page.reload();
  await expectChooser(page,'Startup One');

  const reopened=await context.newPage();
  await reopened.goto('/');
  await expectChooser(reopened,'Startup One');
  await reopened.close();
});
