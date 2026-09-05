const assert=require('assert');
const {PianoTargetTracker,createPianoTargetGroups,pianoArrangementForInput,guitarRunSummary}=require('./gameplay-rules.js');
const chord=[60,64,67].map(midi=>({midi,start:1,duration:1}));
for(const order of [[60,64,67],[67,64,60],[64,60,67]]){const tracker=new PianoTargetTracker(chord);order.forEach((midi,index)=>{const result=tracker.accept(midi);assert.equal(result.accepted,true);assert.equal(result.complete,index===2);});assert.equal(tracker.current(),null);}
const duplicate=new PianoTargetTracker(chord);assert.equal(duplicate.accept(60).accepted,true);assert.equal(duplicate.accept(60).duplicate,true);assert.equal(duplicate.current().matched.size,1);assert.equal(duplicate.accept(64).complete,false);assert.equal(duplicate.accept(67).complete,true);
const interval=new PianoTargetTracker([{midi:48,start:0},{midi:60,start:0}]);assert.equal(interval.accept(60).complete,false);assert.equal(interval.accept(48).complete,true);
const repeated=new PianoTargetTracker([{midi:60,start:0},{midi:60,start:1}]);assert.equal(repeated.accept(60).complete,true);assert.equal(repeated.current().start,1);assert.equal(repeated.accept(60).complete,true);
const rapid=createPianoTargetGroups([{midi:60,start:0},{midi:64,start:.02},{midi:67,start:.3}]);assert.equal(rapid.length,2);assert.deepEqual([...rapid[0].required],[60,64]);
const poly=[{midi:60,start:0},{midi:64,start:0},{midi:67,start:0},{midi:62,start:1}];assert.equal(pianoArrangementForInput(poly,'midi').length,4);assert.equal(pianoArrangementForInput(poly,'screen').length,4);assert.equal(pianoArrangementForInput(poly,'microphone').length,2);assert.equal(pianoArrangementForInput(poly,'microphone')[0].midi,67);
const summary=guitarRunSummary([{status:'hit'},{status:'miss'},{status:'skipped'},{status:'skipped'}]);assert.equal(summary.total,2);assert.equal(summary.hits,1);assert.equal(summary.misses,1);assert.equal(summary.accuracy,50);assert.equal(summary.active.some(event=>event.status==='skipped'),false);
console.log('Gameplay correctness tests passed');
