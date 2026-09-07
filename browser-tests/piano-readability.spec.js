const {test,expect}=require('@playwright/test');

test('Piano falling-note computed styles expose readable pitch labels',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Your name').fill('Piano Readability Test');
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Start Playing'}).click();
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

  // This intentionally captures the v2.6.8 regression before the implementation pass.
  // The expected readable state will make this first diagnostic CI run fail if the live
  // cascade still supplies a dark foreground.
  expect(presentation.color).toBe('rgb(255, 255, 255)');
});
