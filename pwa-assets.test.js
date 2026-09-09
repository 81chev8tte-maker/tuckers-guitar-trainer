const assert=require('assert');
const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const version='2.6.15';
assert(sw.includes(`family-music-quest-v${version}`));
for(const asset of ['styles.css','piano.css','profiles.css','diagnostics.css','diagnostics-layer.css','piano-songbook.css','profiles.js','practice-tools.js','practice-intelligence.js','hardware-services.js','gameplay-rules.js','app.js','guitar-songbook.js','piano-songbook.js','piano-lessons.js','midi-analysis.js','piano.js','diagnostics.js','guided-hardware-acceptance.js','manifest.webmanifest']){const ref=`./${asset}?v=${version}`;assert(html.includes(ref),`index missing ${ref}`);assert(sw.includes(ref),`service worker missing ${ref}`);}
assert(!html.includes('app.js?v=2.4.0'));assert(!sw.includes('app.js?v=2.4.0'));
assert(fs.readFileSync('app.js','utf8').includes(`./sw.js?v=${version}`),'service-worker registration must use the release version');
console.log('PWA asset version tests passed');
