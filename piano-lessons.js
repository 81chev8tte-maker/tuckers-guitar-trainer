(() => {
  const exercise=(id,title,pattern,{step=.72,duration=.5,tempo=76,description='A short original piano exercise.',hands=null}={})=>({id:`lesson-${id}`,title,description,tempo,lessonExercise:true,notes:pattern.map((m,i)=>({midi:m,start:i*step,duration:Array.isArray(duration)?duration[i%duration.length]:duration,hand:hands?.[i]||(m<60?'left':'right')}))});
  const groups=[
    {id:'meet',title:'Level 1 — Meet the Piano',description:'Find the first notes and move one key at a time.',lessons:[
      {id:'middle-c',title:'Find Middle C',instruction:'Find the group of two black keys near the middle. C is the white key just to their left.',hintMidi:60,pattern:[60,60,60,60]},
      {id:'find-d',title:'Find D',instruction:'D is the white key between the two black keys.',hintMidi:62,pattern:[62,62,62,62]},
      {id:'find-e',title:'Find E',instruction:'E is the white key just to the right of the group of two black keys.',hintMidi:64,pattern:[64,64,64,64]},
      {id:'white-keys',title:'C, D and E',instruction:'Start on Middle C, then step right to D and E.',hintMidi:60,pattern:[60,62,64,62,60]},
      {id:'moving-up',title:'Moving Up',instruction:'Moving right makes the notes sound higher. Play C, D, then E.',hintMidi:60,pattern:[60,62,64,60,62,64]},
      {id:'moving-down',title:'Moving Down',instruction:'Moving left makes the notes sound lower. Play E, D, then C.',hintMidi:64,pattern:[64,62,60,64,62,60]},
      {id:'c-to-g',title:'C–D–E–F–G',instruction:'Walk across five neighboring white keys, one step at a time.',hintMidi:60,pattern:[60,62,64,65,67,65,64,62,60]}
    ]},
    {id:'five-fingers',title:'Level 2 — Five Fingers',description:'Keep one right-hand finger ready for each key.',lessons:[
      {id:'thumb-on-c',title:'Thumb on C',instruction:'Put your right thumb on Middle C. Let each finger rest on the next white key.',hintMidi:60,pattern:[60,62,64,65,67]},
      {id:'one-finger-each',title:'One Finger per Key',instruction:'Keep your hand relaxed and use the finger already resting above each key.',hintMidi:60,pattern:[60,64,62,65,64,67]},
      {id:'feel-the-steps',title:'Feel the Steps',instruction:'Look at the screen, then try to feel the neighboring keys without staring at your hand.',hintMidi:60,pattern:[60,62,64,62,60,62,64]},
      {id:'five-note-climb',title:'Five-Note Climb',instruction:'Climb from C to G, then walk back down.',hintMidi:60,pattern:[60,62,64,65,67,65,64,62,60]},
      {id:'five-finger-tune',title:'Five-Finger Tune',instruction:'Keep your hand in one place and let each finger play its own note.',hintMidi:60,pattern:[60,62,64,60,65,64,62,67,65,64,62,60],options:{step:.66}}
    ]},
    {id:'rhythm',title:'Level 3 — Rhythm',description:'Make the notes land on a steady beat.',lessons:[
      {id:'rhythm',title:'Steady Beat',instruction:'Count 1, 2, 3, 4. Play one C on every count.',hintMidi:60,pattern:[60,60,60,60,60,60,60,60],mode:'normal',options:{step:.82,tempo:72}},
      {id:'quarter-notes',title:'Quarter Notes',instruction:'Each falling note gets one steady beat.',hintMidi:60,pattern:[60,62,64,65,67,65,64,62],mode:'normal',options:{step:.75}},
      {id:'half-notes',title:'Hold for Two',instruction:'Hold each key while you count two slow beats.',hintMidi:60,pattern:[60,62,64,62],mode:'normal',options:{step:1.35,duration:1.05,tempo:68}},
      {id:'repeated-notes',title:'Repeated Notes',instruction:'Lift and press the same key again for each new block.',hintMidi:64,pattern:[64,64,64,62,62,60,60,60],mode:'normal',options:{step:.62}},
      {id:'rests',title:'Notes and Spaces',instruction:'A bigger space means wait. Do not play until the next block reaches the line.',hintMidi:60,pattern:[60,62,64,65,67],mode:'normal',options:{step:1.1,tempo:65}}
    ]},
    {id:'left-hand',title:'Level 4 — Left Hand',description:'Find lower C and build a comfortable left-hand position.',lessons:[
      {id:'lower-c',title:'Find Lower C',instruction:'Find the C one octave below Middle C. Use your left pinky.',hintMidi:48,pattern:[48,48,48,48]},
      {id:'left-position',title:'Left-Hand Five Fingers',instruction:'Place your left pinky on C3 and one finger on each white key through G3.',hintMidi:48,pattern:[48,50,52,53,55]},
      {id:'left-up',title:'Left Hand Moving Up',instruction:'Walk your left hand from C up to G.',hintMidi:48,pattern:[48,50,52,53,55,53,52,50,48]},
      {id:'left-down',title:'Left Hand Moving Down',instruction:'Start on G and walk back toward lower C.',hintMidi:55,pattern:[55,53,52,50,48,50,52,53,55]},
      {id:'left-pattern',title:'Left-Hand Pattern',instruction:'Keep the left hand relaxed while the notes change direction.',hintMidi:48,pattern:[48,52,50,53,52,55,53,50,48]}
    ]},
    {id:'two-hands',title:'Level 5 — Two Hands',description:'Take turns between hands—no simultaneous notes yet.',lessons:[
      {id:'hands',title:'Left Hand, Right Hand',instruction:'Blue L notes use the left hand. Purple R notes use the right hand.',hintMidi:48,pattern:[48,60,50,62,52,64,53,65]},
      {id:'hand-trade',title:'Take Turns',instruction:'Play one lower note with the left hand, then answer with the right.',hintMidi:48,pattern:[48,60,48,62,50,64,50,62]},
      {id:'bass-then-melody',title:'Bass then Melody',instruction:'The left hand starts each little phrase. The right hand finishes it.',hintMidi:48,pattern:[48,60,62,64,50,62,64,65]},
      {id:'two-hand-walk',title:'Two-Hand Walk',instruction:'Follow the L and R markers. The hands always alternate.',hintMidi:48,pattern:[48,60,50,62,52,64,53,65,55,67]}
    ]},
    {id:'c-major',title:'Level 6 — C Major',description:'Play all the white-key names from C to the next C.',lessons:[
      {id:'c-scale-up',title:'C Major Going Up',instruction:'Say the letters as you climb: C D E F G A B C.',hintMidi:60,pattern:[60,62,64,65,67,69,71,72],options:{step:.68}},
      {id:'c-scale-down',title:'C Major Going Down',instruction:'Start on high C and walk down the white keys to Middle C.',hintMidi:72,pattern:[72,71,69,67,65,64,62,60],options:{step:.68}},
      {id:'c-scale-roundtrip',title:'Scale Round Trip',instruction:'Climb to the next C, turn around, and come home.',hintMidi:60,pattern:[60,62,64,65,67,69,71,72,71,69,67,65,64,62,60],options:{step:.58}}
    ]},
    {id:'first-songs',title:'Level 7 — First Songs',description:'Finish short original melodies using everything you learned.',lessons:[
      {id:'morning-bells',title:'Morning Bells',instruction:'Use a steady right hand and listen for the repeated notes.',hintMidi:60,pattern:[60,64,64,62,64,65,67,67,65,64,62,60],mode:'normal',options:{step:.7}},
      {id:'stepping-stones',title:'Stepping Stones',instruction:'Follow each neighboring step up and down.',hintMidi:60,pattern:[60,62,64,65,64,62,60,62,64,65,67,65,64,62,60],mode:'normal',options:{step:.62}},
      {id:'little-lantern',title:'Little Lantern',instruction:'Play gently and keep the melody moving at the same speed.',hintMidi:64,pattern:[64,65,67,64,62,60,62,64,67,65,64,62,60],mode:'normal',options:{step:.72}},
      {id:'nova-celebration',title:"Nova's Celebration",instruction:'A final two-hand song. Follow the L and R markers one note at a time.',hintMidi:48,pattern:[48,60,50,62,52,64,53,65,55,67,53,65,52,64,50,62,48,60],mode:'normal',options:{step:.62,tempo:82}}
    ]}
  ];
  const songs=[];
  groups.forEach(group=>group.lessons.forEach(lesson=>{const song=exercise(lesson.id,lesson.title,lesson.pattern,{...(lesson.options||{}),description:lesson.instruction});lesson.song=song.id;songs.push(song);}));
  window.NovaPianoCurriculum={groups,lessons:groups.flatMap(group=>group.lessons.map(lesson=>({...lesson,groupId:group.id,groupTitle:group.title}))),songs};
})();
