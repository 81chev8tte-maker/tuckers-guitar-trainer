const assert=require('assert');
global.window={};require('./piano-songbook.js');
const curriculum=require('./piano-lessons.js');
const lessonIds=curriculum.lessons.map(x=>x.id),songIds=curriculum.songs.map(x=>x.id);
assert.equal(new Set(lessonIds).size,lessonIds.length,'lesson IDs must be unique');
assert.equal(new Set(songIds).size,songIds.length,'song IDs must be unique');
const oldIds=['middle-c','find-d','find-e','white-keys','moving-up','moving-down','c-to-g','thumb-on-c','one-finger-each','feel-the-steps','five-note-climb','five-finger-tune','rhythm','quarter-notes','half-notes','repeated-notes','rests','lower-c','left-position','left-up','left-down','left-pattern','hands','hand-trade','bass-then-melody','two-hand-walk','c-scale-up','c-scale-down','c-scale-roundtrip','morning-bells','stepping-stones','little-lantern','nova-celebration'];
oldIds.forEach(id=>assert(lessonIds.includes(id),`legacy lesson missing: ${id}`));
curriculum.lessons.forEach(lesson=>assert(songIds.includes(lesson.song),`unresolved song: ${lesson.song}`));
curriculum.songs.forEach(song=>{
  assert(['exercise','miniSong','fullSong','checkpoint'].includes(song.contentType));assert(song.notes.length>0);assert(song.skills.length>0);assert(['learn','practice','perform','master'].includes(song.assistance));
  let previous=-1;song.notes.forEach(note=>{assert(Number.isFinite(note.midi)&&note.midi>=21&&note.midi<=108);assert(Number.isFinite(note.start)&&note.start>=0&&note.start>=previous);assert(Number.isFinite(note.duration)&&note.duration>0);assert(['left','right'].includes(note.hand));assert(note.finger===null||(note.finger>=1&&note.finger<=5));previous=note.start;});
  const duration=curriculum.durationOf(song);if(song.contentType==='miniSong')assert(duration>=18,`${song.id} is too short for a mini-song`);if(song.contentType==='fullSong')assert(duration>=40,`${song.id} is too short for a full song`);if(song.contentType==='checkpoint')assert(duration>=55,`${song.id} is too short for a final checkpoint`);
  if(song.contentType!=='exercise'){assert(song.measureCount>=4);assert(song.phraseBoundaries.length>=3);song.phraseBoundaries.forEach((phrase,index)=>{assert(phrase.start>=0&&phrase.end>phrase.start);if(index)assert(phrase.start>=song.phraseBoundaries[index-1].end-.001);});}
});
const final=curriculum.songs.find(song=>song.id==='lesson-nova-celebration');assert(final.checkpoint&&final.skills.includes('hand-coordination'));
assert(curriculum.songs.some(song=>song.notes.some(note=>note.durationBeats===.5)),'eighth notes must be represented');
console.log('Piano curriculum v2 tests passed');
