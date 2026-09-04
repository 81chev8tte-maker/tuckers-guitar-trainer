'use strict';
const assert = require('node:assert/strict');
const {analyzeMidiTrack, analyzeMidiTracks} = require('./midi-analysis.js');

const line = (name, pitches, step=.55, channel=0, instrument='Piano') => ({name,instrument,channels:[channel],notes:pitches.map((midi,i)=>({midi,start:i*step,duration:Math.min(.4,step*.8),channel}))});
const chordTrack = (name, roots, size=3, step=.5) => ({name,instrument:'Piano',channels:[0],notes:roots.flatMap((root,i)=>Array.from({length:size},(_,j)=>({midi:root+j*4,start:i*step,duration:.4,channel:0})))});

const cases = [
  ['beginner',line('First Piano', [60,62,64,65,67,65,64,62],.8),'Beginner'],
  ['right hand',line('Piano RH', [60,64,67,69,67,64,62,60],.5),'Beginner'],
  ['sparse melody',line('', [72,74,76,79,76,74],1.2),'Beginner'],
  ['video game lead',line('Lead Synth', [72,76,79,83,71,78,84,73,80,86],.24,0,'Synth Lead'),'Intermediate'],
  ['two hand chords',chordTrack('Grand Piano', [48,50,52,53,55,57,59,60],4,.42),'Advanced'],
  ['dense accompaniment',chordTrack('Accompaniment', Array.from({length:22},(_,i)=>45+i%8),5,.17),'Advanced']
];
for (const [label,track,expected] of cases) assert.equal(analyzeMidiTrack(track, label.includes('video')?145:100).difficulty,expected,label);

const drums=line('Drums',[36,38,42,46],.2,9,'Percussion');
const empty={name:'Track 9',channels:[4],notes:[]};
const bass=line('Bass',[36,38,40,41,43,45],.5,1,'Bass');
const melody=line('',[60,62,64,65,67,69,67,65],.55,0,'');
const fullBand=analyzeMidiTracks([drums,empty,bass,chordTrack('Strings',[48,50,52,53],4,.4),melody],112);
assert.equal(fullBand.analyses[0].playable,false,'drums excluded');
assert.equal(fullBand.analyses[1].playable,false,'empty excluded');
assert.equal(fullBand.recommendedIndex,4,'unnamed melody recommended over bass and accompaniment');
assert.match(fullBand.analyses[2].role,/Bass/);
assert.match(fullBand.analyses[4].role,/melody/i);
console.log('Real-world MIDI structure validation passed');
