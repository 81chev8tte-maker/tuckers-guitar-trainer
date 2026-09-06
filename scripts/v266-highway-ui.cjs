const fs = require('fs');

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, text) { fs.writeFileSync(file, text); }
function mustReplace(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`Missing expected ${label}`);
  return text.replace(from, to);
}
function bump(file) {
  const before = read(file);
  const after = before.replaceAll('2.6.5', '2.6.6');
  if (after === before) throw new Error(`No v2.6.5 reference found in ${file}`);
  write(file, after);
}

// Release/version plumbing.
for (const file of ['app.js','index.html','sw.js','package.json','package-lock.json','pwa-assets.test.js']) bump(file);

// Remove ordinal numbers from the permanent string labels while retaining thin/thick edge cues.
let app = read('app.js');
const oldLabels = `      const number = info.length - i;\n      const edge = i === 0 ? ' thick' : i === info.length - 1 ? ' thin' : '';\n      return \`<span class=\"string-label-\${i}\" data-string=\"\${i}\" style=\"--string-color:\${s.color || STRING_INFO[i]?.color}\">\${escapeHtml(s.label)}<small>\${number}\${edge}</small></span>\`;`;
const newLabels = `      const edge = i === 0 ? 'thick' : i === info.length - 1 ? 'thin' : '';\n      const edgeMarkup = edge ? \`<small>\${edge}</small>\` : '';\n      return \`<span class=\"string-label-\${i}\" data-string=\"\${i}\" style=\"--string-color:\${s.color || STRING_INFO[i]?.color}\">\${escapeHtml(s.label)}\${edgeMarkup}</span>\`;`;
app = mustReplace(app, oldLabels, newLabels, 'string-label renderer');
write('app.js', app);

let html = read('index.html');
html = mustReplace(
  html,
  '<div id="stringLabels" class="string-labels"><span>E<small>6 thick</small></span><span>A<small>5</small></span><span>D<small>4</small></span><span>G<small>3</small></span><span>B<small>2</small></span><span>e<small>1 thin</small></span></div>',
  '<div id="stringLabels" class="string-labels"><span>E<small>thick</small></span><span>A</span><span>D</span><span>G</span><span>B</span><span>e<small>thin</small></span></div>',
  'initial string labels'
);
write('index.html', html);

// Center the fret as the dominant content of every moving Highway block.
let css = read('styles.css');
if (css.includes('/* v2.6.6 — Guitar Highway UI cleanup. */')) throw new Error('v2.6.6 CSS already present');
css += `\n\n/* v2.6.6 — Guitar Highway UI cleanup. */\n#noteLayer .falling-note .fret-value{\n  display:grid!important;\n  place-items:center!important;\n  width:100%!important;\n  height:100%!important;\n  padding:0!important;\n  margin:0!important;\n  font-size:clamp(1.6rem,3.1vw,1.95rem)!important;\n  line-height:1!important;\n  text-align:center!important;\n}\n#noteLayer .falling-note.open-note .fret-value{font-size:1.2rem!important;letter-spacing:.035em}\n#noteLayer .falling-note.has-technique .fret-value{transform:none!important}\n.game-screen:not(.tab-mode) .hit-line span{top:8px!important;left:-62px!important;transform:none!important}\n`;
write('styles.css', css);

// Extend the existing real-browser stress regression with rendered alignment and label checks.
let browser = read('browser-tests/app-smoke.spec.js');
const oldTest = `  await expect(page.locator('#noteLayer .falling-note').first().locator('.fret-value')).toBeVisible();\n  await expect(page.locator('#handPositionText')).toHaveText('D 5  ·  A 3  ·  E OPEN');`;
const newTest = `  const firstNote=page.locator('#noteLayer .falling-note').first();\n  await expect(firstNote.locator('.fret-value')).toBeVisible();\n  const numericNote=page.locator('#noteLayer .falling-note:not(.open-note)').first();\n  await expect(numericNote.locator('.fret-value')).toBeVisible();\n  const fretPresentation=await numericNote.evaluate(el=>{\n    const fret=el.querySelector('.fret-value');\n    const noteRect=el.getBoundingClientRect();\n    const fretRect=fret.getBoundingClientRect();\n    return {\n      dx:Math.abs((noteRect.left+noteRect.width/2)-(fretRect.left+fretRect.width/2)),\n      dy:Math.abs((noteRect.top+noteRect.height/2)-(fretRect.top+fretRect.height/2)),\n      fontSize:Number.parseFloat(getComputedStyle(fret).fontSize)\n    };\n  });\n  expect(fretPresentation.dx).toBeLessThan(2.5);\n  expect(fretPresentation.dy).toBeLessThan(2.5);\n  expect(fretPresentation.fontSize).toBeGreaterThanOrEqual(24);\n  const openFontSize=await page.locator('#noteLayer .falling-note.open-note .fret-value').first().evaluate(el=>Number.parseFloat(getComputedStyle(el).fontSize));\n  expect(openFontSize).toBeGreaterThanOrEqual(18);\n  await expect(page.locator('#stringLabels small')).toHaveCount(2);\n  await expect(page.locator('#stringLabels')).not.toContainText('6 thick');\n  await expect(page.locator('#stringLabels')).not.toContainText('1 thin');\n  await expect(page.locator('#handPositionText')).toHaveText('D 5  ·  A 3  ·  E OPEN');`;
browser = mustReplace(browser, oldTest, newTest, 'Highway browser regression insertion');
write('browser-tests/app-smoke.spec.js', browser);

// Release notes.
let changelog = read('CHANGELOG.md');
const releaseNotes = `## v2.6.6 — Guitar Highway UI Cleanup\n\n- Centered the fret/OPEN value both horizontally and vertically inside moving Highway blocks.\n- Increased fret-number size while keeping two-digit frets and OPEN readable inside the existing note block.\n- Prevented technique labels from shifting the primary fret value off-center.\n- Removed 1–6 ordinals from permanent string labels; the edge strings retain simple thin/thick cues.\n- Moved the PLAY NOW badge toward the top of the strike line so it no longer competes with notes at the hit point.\n- Preserved the v2.6.4 bounded rendering/performance work and all v2.6.5 note/chord simplification.\n- Added browser assertions for actual rendered fret centering/size and simplified string labels.\n- Advanced package/app/PWA asset and service-worker versioning to v2.6.6.\n\n`;
changelog = mustReplace(changelog, '# Changelog\n\n', '# Changelog\n\n' + releaseNotes, 'changelog header');
write('CHANGELOG.md', changelog);

let roadmap = read('ROADMAP.md');
roadmap = mustReplace(roadmap, '### Validate v2.6.5 Guitar Highway Readability on real hardware', '### Validate v2.6.6 Guitar Highway UI cleanup on real hardware', 'roadmap NOW heading');
roadmap = mustReplace(
  roadmap,
  'v2.6.4 removed the severe imported Full Song stutter on the known Chromebook stress song, but immediate visual review found the new moving-note presentation harder to decode. v2.6.5 keeps the v2.6.4 performance architecture intact and applies a focused Highway readability correction.',
  'v2.6.4 removed the severe imported Full Song stutter on the known Chromebook stress song. v2.6.5 simplified the moving-note presentation, and immediate Chromebook review confirmed the fret-dominant direction was substantially clearer. v2.6.6 keeps that performance/readability architecture intact while centering and enlarging fret values and removing the remaining string-label/strike-line clutter.',
  'roadmap NOW description'
);
roadmap = roadmap.replaceAll('If v2.6.5 still has a blocker', 'If v2.6.6 still has a blocker');
roadmap = roadmap.replaceAll('If v2.6.5 clears hardware acceptance', 'If v2.6.6 clears hardware acceptance');
write('ROADMAP.md', roadmap);

console.log('Applied v2.6.6 Highway UI cleanup');
