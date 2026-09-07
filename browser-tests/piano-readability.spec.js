const {test,expect}=require('@playwright/test');

async function createProfile(page,name){
  await page.goto('/');
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
}

test('Piano falling-note computed styles expose readable pitch labels',async({page})=>{
  await createProfile(page,'Piano Readability Test');
  await page.getByRole('button',{name:/Piano Quest Learn piano/}).click();
  await page.locator('[data-song="nova-first-tune"][data-mode="wait"]').first().click();
  await expect(page.locator('#pianoGame')).toBeVisible();
  await expect(page.locator('#pianoPause')).toBeEnabled({timeout:8000});

  const note=page.locator('#pianoStage .falling-note').first();
  await expect(note).toBeVisible();
  const presentation=await note.evaluate(el=>{
    const style=getComputedStyle(el);
    return {
      color:style.color,
      backgroundColor:style.backgroundColor,
      borderTopColor:style.borderTopColor,
      borderTopWidth:style.borderTopWidth,
      fontSize:style.fontSize,
      fontWeight:style.fontWeight,
      textShadow:style.textShadow
    };
  });
  console.log('PIANO_FALLING_NOTE_COMPUTED',JSON.stringify(presentation));

  expect(presentation.color).toBe('rgb(255, 255, 255)');
  expect(presentation.backgroundColor).toBe('rgb(153, 93, 232)');
  expect(Number.parseFloat(presentation.fontSize)).toBeGreaterThanOrEqual(19);
  expect(Number.parseFloat(presentation.borderTopWidth)).toBeGreaterThanOrEqual(2);
  expect(presentation.textShadow).not.toBe('none');
  await expect(note).toContainText(/[CDEFGAB]/);
});

test('Piano readability isolation preserves Guitar Highway fret presentation',async({page})=>{
  await createProfile(page,'Guitar Readability Guard');
  await page.getByRole('button',{name:/Guitar Quest Learn guitar/}).click();
  const result=await page.evaluate(()=>window.FMQGuitarTest.launchSyntheticStressLevel(48));
  expect(result.totalEvents).toBe(48);

  const note=page.locator('#noteLayer .falling-note').first();
  const fret=note.locator('.fret-value');
  await expect(note).toBeVisible();
  await expect(fret).toBeVisible();
  await expect(note.locator('.note-string')).toHaveCount(0);

  const presentation=await note.evaluate(el=>{
    const style=getComputedStyle(el);
    const fretStyle=getComputedStyle(el.querySelector('.fret-value'));
    return {
      backgroundColor:style.backgroundColor,
      borderTopWidth:style.borderTopWidth,
      fretColor:fretStyle.color,
      fretFontSize:fretStyle.fontSize
    };
  });
  console.log('GUITAR_FALLING_NOTE_COMPUTED',JSON.stringify(presentation));

  expect(presentation.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(Number.parseFloat(presentation.borderTopWidth)).toBeGreaterThanOrEqual(2);
  expect(Number.parseFloat(presentation.fretFontSize)).toBeGreaterThanOrEqual(24);
});
