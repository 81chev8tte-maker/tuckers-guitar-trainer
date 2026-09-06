'use strict';
const fs=require('fs');

const VERSION='2.6.5';
function read(path){return fs.readFileSync(path,'utf8');}
function write(path,content){fs.writeFileSync(path,content);}
function replaceOnce(source,from,to,label=from){
  const first=source.indexOf(from);
  if(first<0)throw new Error(`Missing replacement anchor: ${label}`);
  if(source.indexOf(from,first+from.length)>=0)throw new Error(`Replacement anchor is not unique: ${label}`);
  return source.slice(0,first)+to+source.slice(first+from.length);
}
function replaceFunction(source,name,nextName,replacement){
  const marker=`  function ${name}(`;
  const next=`  function ${nextName}(`;
  const start=source.indexOf(marker);
  if(start<0)throw new Error(`Missing function ${name}`);
  const end=source.indexOf(next,start+marker.length);
  if(end<0)throw new Error(`Missing function ${nextName} after ${name}`);
  return source.slice(0,start)+replacement.trimEnd()+'\n\n'+source.slice(end);
}

let app=read('app.js');
app=replaceOnce(app,"  const APP_VERSION = '2.6.4';","  const APP_VERSION = '2.6.5';",'APP_VERSION');
app=replaceOnce(app,
`      const stringNumber=Number(string.number)||count-stringIndex;
      const stringName=\`${'${string.label||\'?\'}${stringNumber}'}\`;
      el.className=\`falling-note string-${'${stringIndex}'} ${'${game.listenOnly?\'listen-note\':\'\'}'} ${'${fret===0?\'open-note\':\'\'}'} ${'${technique?\'has-technique\':\'\'}'} ${'${shape.length>1?\'chord-note\':\'\'}'}\`;
      el.style.setProperty('--string-color',string.color||STRING_INFO[stringIndex%STRING_INFO.length]?.color||'#a8f23d');
      el.innerHTML=\`<span class="note-string">${'${escapeHtml(stringName)}'}<\/span><b>${'${fret===0?\'OPEN\':fret}'}</b>${'${technique?`<small>${escapeHtml(technique)}</small>`:\'\'}'}\`;`,
`      const stringNumber=Number(string.number)||count-stringIndex;
      const fretLabel=fret===0?'OPEN':String(fret);
      el.className=\`falling-note string-${'${stringIndex}'} ${'${game.listenOnly?\'listen-note\':\'\'}'} ${'${fret===0?\'open-note\':\'\'}'} ${'${technique?\'has-technique\':\'\'}'} ${'${shape.length>1?\'chord-note\':\'\'}'}\`;
      el.style.setProperty('--string-color',string.color||STRING_INFO[stringIndex%STRING_INFO.length]?.color||'#a8f23d');
      el.innerHTML=\`<b class="fret-value">${'${fretLabel}'}</b>${'${technique?`<small>${escapeHtml(technique)}</small>`:\'\'}'}\`;
      el.setAttribute('aria-label',\`${'${string.name||`${string.label||\'?\'} string ${stringNumber}`}'} · ${'${fret===0?\'open\':`fret ${fret}`}'}\`);`,
'moving note content');

app=replaceFunction(app,'updateHighwayFocus','eventFrets',`  function updateHighwayFocus(next){
    if(!next)return;
    const shape=Array.isArray(next.chordNotes)&&next.chordNotes.length?next.chordNotes:[next];
    const activeStrings=new Set(shape.map(note=>Number(note.string)));
    $$('.string-labels span').forEach(label=>label.classList.toggle('active',activeStrings.has(Number(label.dataset.string))));
    const frets=eventFrets(next);
    $$('.fret-lane').forEach(lane=>lane.classList.toggle('active',frets.includes(Number(lane.dataset.fret))||(!frets.length&&Number(lane.dataset.fret)===0)));
    const info=game.stringInfo||STRING_INFO;
    const ordered=[...shape].sort((a,b)=>Number(b.string)-Number(a.string));
    const readable=ordered.map(note=>{
      const string=info[note.string]||STRING_INFO[note.string]||{};
      const label=string.label||'?';
      const fret=Number(note.fret)||0;
      return `${'${label}'} ${'${fret===0?\'OPEN\':fret}'}`;
    });
    $('#handPosition').classList.toggle('open-focus',!frets.length);
    $('#handPosition').classList.toggle('chord-focus',shape.length>1);
    $('#handPositionText').textContent=shape.length===1
      ? `${'${readable[0].split(\' \')[0]}'} STRING · ${'${Number(shape[0].fret)===0?\'OPEN\':`FRET ${Number(shape[0].fret)}`}'} ` .trim()
      : readable.join('  ·  ');
  }`);

app=replaceFunction(app,'formatExpected','bindInput',`  function formatExpected(ev) {
    if (!ev) return '—';
    const info = game?.stringInfo || STRING_INFO;
    const shape = Array.isArray(ev.chordNotes) && ev.chordNotes.length ? ev.chordNotes : [ev];
    if (shape.length > 1) {
      return [...shape]
        .sort((a,b) => Number(b.string) - Number(a.string))
        .map(note => {
          const string = info[note.string] || STRING_INFO[note.string] || {};
          const fret = Number(note.fret) || 0;
          return `${'${string.label || \"?\"}'} ${'${fret === 0 ? \"OPEN\" : fret}'}`;
        })
        .join(' · ');
    }
    const note = shape[0];
    const string = info[note.string] || STRING_INFO[note.string] || {};
    const fret = Number(note.fret) || 0;
    return `${'${string.label || \"?\"}'} string · ${'${fret === 0 ? \"OPEN\" : `fret ${fret}`}'} ` .trim();
  }`);
write('app.js',app);

let styles=read('styles.css');
styles+=`\n\n/* v2.6.5 — Guitar Highway readability correction.\n   String color identifies the lane; the moving block exists primarily to show the fret. */\n#noteLayer .falling-note:not(.hit):not(.miss):not(.demo){\n  background:var(--string-color)!important;\n  border:2px solid rgba(255,255,255,.55)!important;\n  box-shadow:0 3px 12px rgba(0,0,0,.38)!important;\n  display:grid!important;\n  place-items:center!important;\n  min-width:58px;\n}\n#noteLayer .falling-note .note-string{display:none!important}\n#noteLayer .falling-note .fret-value{\n  display:block;\n  padding:0!important;\n  margin:0!important;\n  border:0!important;\n  background:transparent!important;\n  box-shadow:none!important;\n  color:#071018!important;\n  font-size:1.55rem!important;\n  font-weight:950!important;\n  line-height:1!important;\n  letter-spacing:-.04em;\n  text-shadow:0 1px 0 rgba(255,255,255,.28);\n}\n#noteLayer .falling-note.open-note .fret-value{font-size:.88rem!important;letter-spacing:.04em}\n#noteLayer .falling-note.has-technique .fret-value{transform:translateY(-3px)}\n#noteLayer .falling-note>small{font-size:.56rem;line-height:1;margin-top:2px}\n#handPosition.chord-focus #handPositionText{letter-spacing:.035em;word-spacing:.12em}\n`;
write('styles.css',styles);

let browser=read('browser-tests/app-smoke.spec.js');
browser=replaceOnce(browser,
`  expect(await page.locator('#noteLayer .falling-note').count()).toBeLessThan(120);\n  const middle=await page.evaluate(()=>window.FMQGuitarTest.jumpRenderForTest(60));`,
`  expect(await page.locator('#noteLayer .falling-note').count()).toBeLessThan(120);\n  await expect(page.locator('#noteLayer .note-string')).toHaveCount(0);\n  await expect(page.locator('#noteLayer .falling-note').first().locator('.fret-value')).toBeVisible();\n  await expect(page.locator('#handPositionText')).toHaveText('E STRING · OPEN');\n  await expect(page.locator('#nextNoteText')).toHaveText('E string · OPEN');\n  const middle=await page.evaluate(()=>window.FMQGuitarTest.jumpRenderForTest(60));`,
'bounded-render readability assertions');
write('browser-tests/app-smoke.spec.js',browser);

for(const path of ['index.html','sw.js','pwa-assets.test.js']){
  let text=read(path);
  if(!text.includes('2.6.4'))throw new Error(`${path} did not contain v2.6.4`);
  text=text.replaceAll('2.6.4',VERSION);
  write(path,text);
}
for(const path of ['package.json','package-lock.json']){
  let text=read(path);
  if(!text.includes('"version": "2.6.4"'))throw new Error(`${path} package version anchor missing`);
  text=text.replaceAll('"version": "2.6.4"',`"version": "${VERSION}"`);
  write(path,text);
}

let changelog=read('CHANGELOG.md');
const changelogAnchor='# Changelog\n\n';
const entry=`## v2.6.5 — Guitar Highway Readability Correction\n\n- Simplified moving Highway notes so string color identifies the string and the fret/OPEN value is the dominant visible information.\n- Removed redundant E6/A5/D4-style string-number labels from moving note blocks.\n- Simplified NEXT/NEXT NOTE cues to use plain string labels and frets without MIDI pitch-name clutter.\n- Made multi-string shapes read like a compact tab cue (for example D 11 · A 11 · E 9).\n- Reduced pending-note border/glow clutter while preserving hit/miss/demo feedback states.\n- Preserved all v2.6.4 bounded rendering/indexing/performance work; the known imported Full Song stutter was reported gone on the original Chromebook stress song before this visual-only correction.\n- Advanced package/app/PWA asset and service-worker versioning to v2.6.5.\n\n`;
changelog=replaceOnce(changelog,changelogAnchor,changelogAnchor+entry,'changelog heading');
write('CHANGELOG.md',changelog);

let roadmap=read('ROADMAP.md');
roadmap=roadmap.replace('### Validate v2.6.4 Guitar Player & String Engine Polish on real hardware','### Validate v2.6.5 Guitar Highway Readability on real hardware');
roadmap=roadmap.replace('v2.6.4 is merged to `main` as the technically validated candidate. Automated Node, syntax, Playwright and PWA/offline-shell checks are green, including a synthetic 2,000-event regression that verifies bounded Guitar Highway/Tab rendering.','v2.6.4 removed the severe imported Full Song stutter on the known Chromebook stress song, but immediate visual review found the new moving-note presentation harder to decode. v2.6.5 keeps the v2.6.4 performance architecture intact and applies a focused Highway readability correction.');
roadmap=roadmap.replace('### If v2.6.4 has a blocker: focused v2.6.5','### If v2.6.5 still has a blocker: focused follow-up');
roadmap=roadmap.replace('If Monday testing finds a reproducible blocker such as severe Full Song stutter, scoring/input regression, unusable Tab/Highway readability, save/profile failure or serious Piano regression, do a focused v2.6.5 before expansion.','If hardware testing still finds a reproducible blocker such as scoring/input regression, unusable Tab/Highway readability, save/profile failure, renewed Full Song stutter or serious Piano regression, do another focused maintenance release before expansion.');
roadmap=roadmap.replace('### If v2.6.4 clears hardware acceptance: Bass Quest foundation','### If v2.6.5 clears hardware acceptance: Bass Quest foundation');
write('ROADMAP.md',roadmap);

console.log('Applied v2.6.5 readability patch');