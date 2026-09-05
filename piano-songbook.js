(() => {
  'use strict';
  const N=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const name=m=>`${N[m%12]}${Math.floor(m/12)-1}`;
  const finger=(m,h)=>h==='left'?({48:5,50:4,52:3,53:2,55:1}[m]||null):({60:1,62:2,64:3,65:4,67:5,69:4,71:5,72:5}[m]||null);
  const event=(midi,beat,durationBeats=1,hand='right',role='melody')=>({midi,beat,durationBeats,hand,role,finger:finger(midi,hand)});
  function melody(start,values,hand='right'){let beat=start;return values.flatMap(item=>{if(item===null){beat+=1;return [];}const [midi,duration=1,rest=0]=Array.isArray(item)?item:[item,1,0],out=event(midi,beat,duration,hand,'melody');beat+=duration+rest;return[out];});}
  function harmony(measures,roots){const out=[];for(let m=0;m<measures;m++){const root=roots[m%roots.length],beat=m*4;out.push(event(root,beat,3.6,'left','bass'));if(m%2===0)out.push(event(root+7,beat,3.6,'left','harmony'));}return out;}
  function makeSong(def){
    const secondsPerBeat=60/def.tempo,measureCount=Math.max(def.measures,Math.ceil(Math.max(...def.events.map(n=>n.beat+n.durationBeats))/4)),phrases=def.phrases.map(p=>({...p}));phrases[phrases.length-1].endBeat=measureCount*4;
    const events=[...def.events].sort((a,b)=>a.beat-b.beat||a.midi-b.midi).map((note,index)=>({...note,index,start:note.beat*secondsPerBeat,duration:Math.max(.1,note.durationBeats*secondsPerBeat*.9),measure:Math.floor(note.beat/4)+1,phrase:phrases.find(p=>note.beat>=p.startBeat&&note.beat<p.endBeat)?.label||'Ending'}));
    return{...def,notes:events,measureCount,beatsPerMeasure:4,targetDuration:measureCount*4*secondsPerBeat,contentType:def.checkpoint?'checkpoint':'fullSong',skills:def.skills||['melody','rhythm'],assistance:def.assistance||'practice',lessonExercise:Boolean(def.lessonExercise),phraseBoundaries:phrases.map((p,index)=>({...p,index,start:p.startBeat*secondsPerBeat,end:p.endBeat*secondsPerBeat,startMeasure:Math.floor(p.startBeat/4)+1,endMeasure:Math.ceil(p.endBeat/4)}))};
  }
  function arrangement(song,mode='melody',input='microphone'){
    const all=song.notes.map(n=>({...n})),melodyNotes=all.filter(n=>n.role==='melody'),left=all.filter(n=>n.hand==='left'),right=all.filter(n=>n.hand==='right');
    if(mode==='listen')return{player:all,accompaniment:[],demo:true};
    if(input==='microphone'||mode==='melody'){const mono=[];for(const n of melodyNotes){const same=mono.find(x=>Math.abs(x.start-n.start)<.02);if(!same)mono.push(n);else if(n.midi>same.midi)Object.assign(same,n);}return{player:mono,accompaniment:all.filter(n=>!mono.some(m=>m.index===n.index)),demo:false};}
    if(mode==='left')return{player:left,accompaniment:right,demo:false};
    if(mode==='right')return{player:right,accompaniment:left,demo:false};
    return{player:all,accompaniment:[],demo:false};
  }
  const forms={
    morning:[[60,1],[64,1],[67,2],[64,1],[65,1],[67,2],[69,1],[67,1],[65,1],[64,1],[62,2],[60,2]],
    stones:[[60,1],[62,1],[64,1],[65,1],[67,2],[65,1],[64,1],[62,1],[64,1],[65,1],[67,1],[69,2],[67,2]],
    lantern:[[64,2],[67,1],[65,1],[64,2],[62,1],[60,1],[62,2],[64,1],[65,1],[67,3],null],
    river:[[60,.5],[64,.5],[62,1],[65,1],[64,1],[67,2],[64,1],[62,1],[60,1],[64,1],[67,1],[69,1],[67,2],[64,2]],
    march:[[60,1],[64,1],[67,2],[65,1],[64,1],[62,2],[60,1],[62,1],[64,1],[65,1],[67,2],[60,2]],
    celebration:[[60,1],[62,1],[64,1],[67,1],[65,2],[64,1],[62,1],[60,1],[64,1],[67,1],[72,1],[71,2],[67,2]]
  };
  function original(id,title,mel,tempo=76,measures=20,checkpoint=false){const phrases=[{label:'Intro',startBeat:0,endBeat:8},{label:'A',startBeat:8,endBeat:28},{label:'B',startBeat:28,endBeat:48},{label:'A2',startBeat:48,endBeat:68},{label:'Ending',startBeat:68,endBeat:measures*4}],roots=[48,53,48,55,48];return makeSong({id:`lesson-${id}`,title,description:'An original Family Music Quest beginner piece with melody, bass and a clear ending.',tempo,measures,phrases,checkpoint,lessonExercise:true,skills:['melody','rhythm','hand-coordination'],events:[...melody(0,[[60,2],[64,2],[67,4]]),...melody(8,[...mel,...mel.map((x,i)=>i===mel.length-1?[60,4]:x),...mel,...mel.slice(0,8),[67,2],[64,2],[60,4]]),...harmony(measures,roots)]});}
  function publicSong(id,title,{tempo,measures,melodyNotes,rights,category='Traditional',description}){const phrases=[{label:'Intro',startBeat:0,endBeat:8},{label:'A',startBeat:8,endBeat:24},{label:'A2',startBeat:24,endBeat:40},{label:'B',startBeat:40,endBeat:56},{label:'Ending',startBeat:56,endBeat:measures*4}],body=[...melodyNotes,...melodyNotes,...melodyNotes.slice(0,Math.max(8,melodyNotes.length/2)),[60,4]];return makeSong({id, title,description,tempo,measures,phrases,category,difficulty:'Beginner',difficultyStars:1,rights,skills:['note-recognition','melody','rhythm','hand-coordination'],events:[...melody(0,[[60,2],[64,2],[67,4]]),...melody(8,body),...harmony(measures,[48,53,48,55])]});}
  const originals=[
    original('morning-bells','Morning Bells',forms.morning,76,20),original('stepping-stones','Stepping Stones',forms.stones,80,20),original('little-lantern','Little Lantern',forms.lantern,70,20),original('river-skips','River Skips',forms.river,82,20),original('homeward-march','Homeward March',forms.march,76,20),original('nova-celebration','Final Celebration Concert',forms.celebration,80,24,true)
  ];
  const publicDomain=[
    publicSong('songbook-twinkle','Twinkle, Twinkle, Little Star — Beginner Arrangement',{tempo:72,measures:18,melodyNotes:[[60,1],[60,1],[67,1],[67,1],[69,1],[69,1],[67,2],[65,1],[65,1],[64,1],[64,1],[62,1],[62,1],[60,2]],description:'A new FMQ beginner arrangement of the traditional melody.',rights:{status:'Public Domain',basis:'Traditional melody; Library of Congress 1879 public-domain score',source:'https://www.loc.gov/item/2023832590/',arrangement:'Original Family Music Quest arrangement',lyrics:false}}),
    publicSong('songbook-frere-jacques','Frère Jacques — Beginner Arrangement',{tempo:80,measures:16,melodyNotes:[[60,1],[62,1],[64,1],[60,1],[60,1],[62,1],[64,1],[60,1],[64,1],[65,1],[67,2],[64,1],[65,1],[67,2]],description:'A new FMQ arrangement of the traditional French round.',rights:{status:'Public Domain',basis:'Traditional French melody documented before 1900',source:'https://catalog.loc.gov/vwebv/search?searchArg=Frere+Jacques&searchCode=GKEY%5E*&searchType=0',arrangement:'Original Family Music Quest arrangement',lyrics:false}}),
    publicSong('songbook-row-row','Row, Row, Row Your Boat — Beginner Arrangement',{tempo:76,measures:16,melodyNotes:[[60,1.5],[60,.5],[60,1],[62,.5],[64,1.5],[64,1],[62,1],[64,1],[65,.5],[67,.5],[72,2]],description:'A new FMQ beginner arrangement of the traditional round.',rights:{status:'Public Domain',basis:'Traditional song published in the nineteenth century',source:'https://www.loc.gov/',arrangement:'Original Family Music Quest arrangement',lyrics:false}}),
    publicSong('songbook-jingle-bells','Jingle Bells — Beginner Arrangement',{tempo:88,measures:20,category:'Seasonal',melodyNotes:[[64,1],[64,1],[64,2],[64,1],[64,1],[64,2],[64,1],[67,1],[60,1.5],[62,.5],[64,4],[65,1],[65,1],[65,1.5],[65,.5],[65,1],[64,1],[64,1],[64,.5],[64,.5],[64,1],[62,1],[62,1],[64,1],[62,2],[67,2]],description:'The familiar 1857 melody in a new FMQ beginner arrangement.',rights:{status:'Public Domain',basis:'J. S. Pierpont, published 1857',source:'https://www.loc.gov/collections/american-sheet-music-1820-to-1860/articles-and-essays/greatest-hits-1820-60-variety-music-cavalcade/1850-to-1860/',arrangement:'Original Family Music Quest arrangement',lyrics:false}}),
    publicSong('songbook-ode-to-joy','Ode to Joy — Beginner Arrangement',{tempo:76,measures:18,category:'Classical',melodyNotes:[[64,1],[64,1],[65,1],[67,1],[67,1],[65,1],[64,1],[62,1],[60,1],[60,1],[62,1],[64,1],[64,1.5],[62,.5],[62,2],[64,1],[64,1],[65,1],[67,1],[67,1],[65,1],[64,1],[62,1],[60,1],[60,1],[62,1],[64,1],[62,1.5],[60,.5],[60,2]],description:'Beethoven’s famous theme in a new FMQ beginner arrangement.',rights:{status:'Public Domain',basis:'Ludwig van Beethoven, Symphony No. 9, Op. 125 (1824)',source:'https://www.beethoven.de/en/work/view/5024208720412672/Symphony+No.+9+in+D+minor%2C+Op.+125',arrangement:'Original Family Music Quest arrangement',lyrics:false}})
  ];
  const songs=[...originals,...publicDomain];
  window.FMQPianoSongbook={version:1,songs,originals,publicDomain,makeSong,arrangement,event,name};
  if(typeof module!=='undefined')module.exports=window.FMQPianoSongbook;
})();
