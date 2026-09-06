const assert = require('assert');
const rules = require('./guided-hardware-acceptance.js');

assert.equal(rules.APP_VERSION, '2.6.7');
assert.equal(rules.GUITAR_STRINGS.length, 6);
assert.deepEqual(rules.GUITAR_STRINGS.map(s=>s.midi), [40,45,50,55,59,64]);

const lowE = rules.GUITAR_STRINGS[0];
let result = rules.createNoteResult(lowE);
let applied = rules.applyNoteReading(result, lowE, {freq:110,rms:.03,note:'A2',midi:45,onset:true}, .018);
assert.equal(applied.passed, false, 'wrong note must not pass');
assert.equal(applied.result.retries, 1, 'wrong onset should count as a retry');
assert.equal(applied.result.attempts, 1);

applied = rules.applyNoteReading(applied.result, lowE, {freq:82.41,rms:.03,note:'E2',midi:40,onset:true}, .018);
assert.equal(applied.passed, false, 'one matching reading is not yet stable');
applied = rules.applyNoteReading(applied.result, lowE, {freq:82.41,rms:.028,note:'E2',midi:40,onset:false}, .018);
assert.equal(applied.passed, true, 'expected onset plus stable matching reading should pass');
assert.equal(applied.result.stable, true);
assert.equal(applied.result.onsetSeen, true);
assert(Math.abs(applied.result.cents) < 1);

const quiet = rules.summarizeQuiet([.001,.002,.003,.004,.005]);
assert.equal(quiet.sampleCount, 5);
assert.equal(quiet.peak, .005);
assert(quiet.noiseFloor >= .004);

const silence = rules.summarizeSilence([
  {rms:.002,freq:null,onset:false},
  {rms:.03,freq:82.41,onset:true}
], .018);
assert.equal(silence.onsetCount, 1);
assert.equal(silence.scoreableReadings, 1);
assert.equal(silence.stablePitchReadings, 1);

const session = rules.createSession({player:{id:'p1',name:'Tester'},platform:{platform:'Chrome OS'}});
assert.equal(session.status, 'in-progress');
let missing = rules.computeNotPerformed(session);
assert(missing.some(x=>x.includes('Guided Guitar')));
assert(missing.some(x=>x.includes('Guided Piano MIDI')));
assert(missing.some(x=>x.includes('disconnect/reconnect')));

session.guitar.status = 'complete';
session.midi.status = 'complete';
session.midi.sustain = {observed:true};
missing = rules.computeNotPerformed(session);
assert(!missing.some(x=>x.includes('Guided Guitar')));
assert(!missing.some(x=>x.includes('Guided Piano MIDI')));
assert(!missing.some(x=>x.includes('MIDI sustain capability')));
assert(missing.some(x=>x.includes('Physical end-to-end latency')));

console.log('Guided hardware acceptance rule tests passed');
