'use strict';

const assert = require('node:assert/strict');
const {analyzeMidiTrack, analyzeMidiTracks} = require('./midi-analysis.js');

const notes = (midis, step = 0.6, channel = 0) => midis.map((midi, index) => ({midi, channel, start:index * step, duration:0.4}));

const melody = {name:'Lead Melody', instrument:'Piano', channels:[0], notes:notes([60,62,64,65,67,65,64,62,60])};
const melodyResult = analyzeMidiTrack(melody, 84);
assert.equal(melodyResult.playable, true);
assert.equal(melodyResult.difficulty, 'Beginner');
assert.match(melodyResult.role, /Melody/);
assert.match(melodyResult.reason, /microphone practice/);

const denseChords = {name:'Piano Accompaniment', channels:[0], notes:[]};
for (let beat = 0; beat < 24; beat++) {
  [48,52,55,60,64].forEach(midi => denseChords.notes.push({midi:midi+(beat%4)*5,channel:0,start:beat*.16,duration:.14}));
}
const chordResult = analyzeMidiTrack(denseChords, 168);
assert.equal(chordResult.difficulty, 'Advanced');
assert.ok(chordResult.maxPolyphony >= 5);
assert.ok(chordResult.chordRatio > .9);

const drums = {name:'Drums', channels:[9], notes:notes([36,38,42], .4, 9)};
assert.equal(analyzeMidiTrack(drums, 120).playable, false);

const bass = {name:'Bass', channels:[1], notes:notes([36,40,43,38,41,45], .45, 1)};
const comparison = analyzeMidiTracks([denseChords,bass,melody,drums], 100);
assert.equal(comparison.recommendedIndex, 2);

console.log('MIDI analysis tests passed');
