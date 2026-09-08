import fs from 'node:fs';
const path='browser-tests/app-smoke.spec.js';
let text=fs.readFileSync(path,'utf8');
const from=`  await page.getByRole('button',{name:/Run Hardware Test/}).click();\n  await expect(page.getByRole('heading',{name:'Guided Hardware Test'})).toBeVisible();\n  await page.getByRole('button',{name:'🎸 Microphone'}).click();\n  await expect(page.getByRole('heading',{name:'Production Guitar Input'})).toBeVisible();\n  await page.getByRole('button',{name:'🧪 Guided Test'}).click();`;
const to=`  await page.getByRole('button',{name:/Quick Hardware Tests/}).click();\n  await expect(page.getByRole('heading',{name:'Quick Hardware Tests'})).toBeVisible();`;
if(!text.includes(from)) throw new Error('stale guided smoke-test launch sequence not found');
text=text.replace(from,to);
fs.writeFileSync(path,text);
for(const p of ['tools/tmp-v2614-smoke-fix.mjs','.github/workflows/tmp-v2614-smoke-fix.yml']){try{fs.rmSync(p);}catch{}}
console.log('Updated legacy smoke test for Quick Hardware Tests entry.');