const assert = require('assert');
const rules = require('./guided-hardware-acceptance.js');

assert.equal(rules.APP_VERSION, '2.6.14');
assert.equal(rules.GUITAR_STRINGS.length, 6);
assert.deepEqual(rules.GUITAR_STRINGS.map(s=>s.midi), [40,45,50,55,59,64]);

assert.equal(rules.makeSessionId('2026-09-07T12:00:00Z', 1), 'FMQ-HW-2026-09-07-01');
assert.equal(rules.makeSessionId('2026-09-07T12:00:00Z', 12), 'FMQ-HW-2026-09-07-12');
assert.deepEqual(rules.normalizeEvidenceReferences('highway-open-note.jpg\nfull-song-stutter.mp4, highway-open-note.jpg'), ['highway-open-note.jpg','full-song-stutter.mp4']);
const humanEvidence = rules.createHumanEvidence({
  adultResult:'blocker',
  adultHelpRequired:'2+',
  adultHelpNote:'Needed input help.',
  childScoringTrust:'mostly',
  childComment:'The open notes are easier now.',
  testerNote:'USB cable, on charger.',
  evidenceReferences:['highway-open-note.jpg','full-song-stutter.mp4']
});
assert.equal(humanEvidence.adultResult, 'blocker');
assert.equal(humanEvidence.adultHelpRequired, '2+');
assert.equal(humanEvidence.childScoringTrust, 'mostly');
assert.equal(humanEvidence.childComment, 'The open notes are easier now.');
assert.deepEqual(humanEvidence.evidenceReferences, ['highway-open-note.jpg','full-song-stutter.mp4']);

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

const session = rules.createSession({startedAt:'2026-09-07T12:00:00Z',sequence:3,player:{id:'p1',name:'Tester'},platform:{platform:'Chrome OS'}});
assert.equal(session.status, 'in-progress');
assert.equal(session.version, 3);
assert.equal(session.sessionId, 'FMQ-HW-2026-09-07-03');
assert.equal(session.humanEvidence.adultResult, 'not-decided');
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


assert.equal(rules.PIANO_MIC_NOTES.length, 6);
assert.deepEqual(rules.PIANO_MIC_NOTES.map(step=>step.midi), [60,62,64,65,67,60]);
const c4 = rules.PIANO_MIC_NOTES[0];
let pianoResult = rules.createPianoMicNoteResult(c4);
let pianoApplied = rules.applyPianoMicReading(pianoResult, c4, {active:true,level:.001,quiet:true,stable:false});
assert.equal(pianoApplied.passed, false, 'quiet Piano candidate cannot pass');
pianoApplied = rules.applyPianoMicReading(pianoApplied.result, c4, {active:true,level:.03,midi:60,name:'C4',stable:false,confidence:.9});
assert.equal(pianoApplied.passed, false, 'unstable Piano candidate cannot pass');
pianoApplied = rules.applyPianoMicReading(pianoApplied.result, c4, {active:true,level:.03,midi:62,name:'D4',stable:true,confidence:.9});
assert.equal(pianoApplied.passed, false, 'wrong stable Piano note cannot pass');
assert.equal(pianoApplied.result.retries, 1);
pianoApplied = rules.applyPianoMicReading(pianoApplied.result, c4, {active:true,level:.03,midi:60,name:'C4',stable:true,confidence:.9,frequency:261.63,cents:0});
assert.equal(pianoApplied.passed, true, 'correct production-gated stable Piano reading passes');
assert.equal(pianoApplied.result.stable, true);

const pianoMissingSession = rules.createSession();
assert(rules.computeNotPerformed(pianoMissingSession).some(x=>x.includes('Guided Piano microphone')));
pianoMissingSession.pianoMicrophone.status = 'complete';
const afterPianoGuide = rules.computeNotPerformed(pianoMissingSession);
assert(!afterPianoGuide.some(x=>x.includes('Guided Piano microphone')), 'completed guided Piano microphone must not be reported unperformed');
assert(afterPianoGuide.some(x=>x.includes('Piano microphone gameplay / perceived response')), 'guided Piano microphone must not claim gameplay/latency acceptance');

const payloadReport = {
  format:'family-music-quest-hardware-report',
  version:1,
  generatedAt:'2026-09-07T12:00:00Z',
  guidedAcceptance:{sessionId:'FMQ-HW-2026-09-07-03',humanEvidence}
};
const payload = rules.createReportPayload(payloadReport);
assert.equal(payload.filename, 'family-music-quest-hardware-FMQ-HW-2026-09-07-03.json');
assert.deepEqual(JSON.parse(payload.json), payloadReport, 'shared/download JSON payload must serialize the supplied report object without a second format');

console.log('Guided hardware acceptance rule tests passed');
