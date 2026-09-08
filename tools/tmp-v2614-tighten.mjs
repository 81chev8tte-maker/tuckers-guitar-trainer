import fs from 'node:fs';
const path='guided-hardware-acceptance.js';
let text=fs.readFileSync(path,'utf8');
function replace(from,to,label){if(!text.includes(from))throw new Error(`missing ${label}`);text=text.replace(from,to);}
replace(
`    renderGuided();\n  }\n  function statusText(status) {`,
`    renderGuided();\n    if ($('guidedLead') && message) $('guidedLead').textContent = message;\n  }\n  function statusText(status) {`,
'guided error message visibility');
replace(
`    guidedPianoMic = new PianoMic({ emit:()=>{} });\n    await guidedPianoMic.start(processPianoMicReading);\n    const track = guidedPianoMic.stream?.getAudioTracks?.()[0] || guidedPianoMic.stream?.getTracks?.()[0];`,
`    guidedPianoMic = new PianoMic({ emit:()=>{} });\n    try {\n      await guidedPianoMic.start(processPianoMicReading);\n    } catch (error) {\n      session.pianoMicrophone.status = 'not-available';\n      session.pianoMicrophone.completedAt = new Date().toISOString();\n      cleanupPianoMic(); path = null; phase = null;\n      persistSession(); renderGuided();\n      throw error;\n    }\n    const track = guidedPianoMic.stream?.getAudioTracks?.()[0] || guidedPianoMic.stream?.getTracks?.()[0];`,
'Piano microphone permission/start failure');
replace(
`      \`Guitar/audio input: \${s?.audioDevice?.label || 'Not recorded'}\`,\n      \`Piano/MIDI input: \${s?.midi?.device?.name || 'Not recorded'}\`,`,
`      \`Guitar/audio input: \${s?.audioDevice?.label || 'Not recorded'}\`,\n      \`Piano microphone input: \${s?.pianoMicrophone?.device?.label || 'Not recorded'}\`,\n      \`Piano/MIDI input: \${s?.midi?.device?.name || 'Not recorded'}\`,`,
'Piano microphone report device label');
fs.writeFileSync(path,text);
for(const p of ['tools/tmp-v2614-tighten.mjs','.github/workflows/tmp-v2614-tighten.yml']){try{fs.rmSync(p);}catch{}}
console.log('Tightened v2.6.14 Piano microphone error/report behavior.');
