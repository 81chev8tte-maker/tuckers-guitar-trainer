(() => {
  'use strict';
  const tuning=[40,45,50,55,59,64];
  const rights=(basis,source)=>({status:'Public Domain',basis,source,arrangement:'Original Family Music Quest guitar arrangement; no downloaded tab, MIDI, recording, or modern arrangement used',lyrics:false});
  const positions={55:[3,0],60:[4,1],61:[4,2],62:[4,3],63:[4,4],64:[5,0],65:[5,1],66:[5,2],67:[5,3],68:[5,4],69:[5,5],70:[5,6],71:[5,7],72:[5,8],73:[5,9],74:[5,10],76:[5,12]};
  const event=(midi,beat,duration=1)=>{const position=positions[midi];if(!position)throw new Error(`No beginner guitar position for MIDI ${midi}`);return{midi,string:position[0],fret:position[1],beat,duration};};
  const phrase=(label,items)=>({label,items});
  function makeArrangement(def){
    let beat=0;const notes=[],sections=[];
    for(const part of def.phrases){const startBeat=beat;for(const item of part.items){if(item===null){beat+=1;continue;}const [midi,duration=1,advance=duration]=Array.isArray(item)?item:[item,1,1];notes.push(event(midi,beat,duration));beat+=advance;}sections.push({label:part.label,startBeat,endBeat:beat,startMeasure:Math.floor(startBeat/4)+1,endMeasure:Math.ceil(beat/4)});}
    return{...def,mode:'song',tag:'BUILT-IN GUITAR SONG',headline:'Play a real melody',lesson:def.coaching,hint:'Use the string colour and fret number. Switch to Tab View any time.',trackName:def.arrangementType,worldNumber:0,worldTitle:'Guitar Songbook',notes,sections,durationBeats:beat,measureCount:Math.ceil(beat/4),approximateDuration:Math.round(beat*60/def.bpm),songId:def.id,songKey:`built-in:${def.id}`,songSpec:{fullSong:true,speed:1,builtIn:true,backingEnabled:false,startBar:0,endBar:Math.ceil(beat/4),totalBars:Math.ceil(beat/4)}};
  }
  const songs=[
    makeArrangement({id:'guitar-ode-to-joy',title:'Ode to Joy — Complete Theme',composer:'Ludwig van Beethoven',arrangementType:'Easy Tab · Lead Melody',difficulty:'Beginner',bpm:104,recommendedAfter:'Reading fret numbers',coaching:'A complete, stepwise melody across the B and high E strings.',rights:rights('Symphony No. 9, Op. 125 (1824); underlying composition is public domain','https://www.beethoven.de/en/work/view/5024208720412672/Symphony+No.+9+in+D+minor%2C+Op.+125'),phrases:[
      phrase('A · Joy Theme',[[64,1],[64,1],[65,1],[67,1],[67,1],[65,1],[64,1],[62,1],[60,1],[60,1],[62,1],[64,1],[64,1.5],[62,.5],[62,2]]),
      phrase('A2 · Answer',[[64,1],[64,1],[65,1],[67,1],[67,1],[65,1],[64,1],[62,1],[60,1],[60,1],[62,1],[64,1],[62,1.5],[60,.5],[60,2]]),
      phrase('B · Together',[[62,1],[62,1],[64,1],[60,1],[62,1],[64,.5],[65,.5],[64,1],[60,1],[62,1],[64,.5],[65,.5],[64,1],[62,1],[60,1],[62,1],[55,2]]),
      phrase('A · Return',[[64,1],[64,1],[65,1],[67,1],[67,1],[65,1],[64,1],[62,1],[60,1],[60,1],[62,1],[64,1],[62,1.5],[60,.5],[60,2]])]}),
    makeArrangement({id:'guitar-jingle-bells',title:'Jingle Bells — Complete Refrain',composer:'James Lord Pierpont',arrangementType:'Easy Tab · Lead Melody',difficulty:'Beginner',bpm:116,recommendedAfter:'String changes and timing',coaching:'Repeated notes and a familiar rhythm across two nearby strings.',rights:rights('Published in 1857 as “The One Horse Open Sleigh”','https://www.loc.gov/collections/american-sheet-music-1820-to-1860/articles-and-essays/greatest-hits-1820-60-variety-music-cavalcade/1850-to-1860/'),phrases:[
      phrase('A · Bells',[[64,1],[64,1],[64,2],[64,1],[64,1],[64,2],[64,1],[67,1],[60,1.5],[62,.5],[64,4]]),
      phrase('B · Sleigh Ride',[[65,1],[65,1],[65,1.5],[65,.5],[65,1],[64,1],[64,1],[64,.5],[64,.5],[64,1],[62,1],[62,1],[64,1],[62,2],[67,2]]),
      phrase('A2 · Bells Return',[[64,1],[64,1],[64,2],[64,1],[64,1],[64,2],[64,1],[67,1],[60,1.5],[62,.5],[64,4]]),
      phrase('Ending',[[65,1],[65,1],[65,1],[65,1],[65,1],[64,1],[64,1],[64,1],[67,1],[67,1],[65,1],[62,1],[60,4]])]}),
    makeArrangement({id:'guitar-amazing-grace',title:'Amazing Grace — First Verse Melody',composer:'Traditional tune / words by John Newton',arrangementType:'Lead Guitar · Sustained Melody',difficulty:'Easy',bpm:84,recommendedAfter:'Clean fretting and sustains',coaching:'Let the long notes ring while moving through a complete first-verse melody.',rights:rights('New Britain tune and Newton text are public domain; this release includes melody only','https://www.loc.gov/item/ihas.200149085/'),phrases:[
      phrase('Pickup and A',[[60,1],[65,2],[69,1],[65,1],[69,2],[67,1],[65,2],[62,1],[60,2]]),
      phrase('A2',[[60,1],[65,2],[69,1],[65,1],[69,2],[67,1],[72,3]]),
      phrase('B · Was Blind',[[69,1],[72,2],[69,1],[65,1],[69,2],[65,1],[62,2],[60,1],[65,2]]),
      phrase('Ending · Now I See',[[60,1],[65,2],[69,1],[65,1],[69,2],[67,1],[65,3]])]}),
    makeArrangement({id:'guitar-auld-lang-syne',title:'Auld Lang Syne — First Verse Melody',composer:'Traditional Scottish melody',arrangementType:'Easy Tab · Melody',difficulty:'Easy',bpm:96,recommendedAfter:'Moving between frets',coaching:'A complete verse melody with repeated phrases and a clear homecoming ending.',rights:rights('Traditional Scottish melody; documented public-domain nineteenth-century editions','https://www.loc.gov/item/2023841187/'),phrases:[
      phrase('Pickup and A',[[60,1],[65,1.5],[65,.5],[65,1],[69,1],[67,1.5],[65,.5],[67,1],[69,1],[65,1],[65,1],[69,1],[72,2]]),
      phrase('B',[[72,1],[69,1.5],[69,.5],[65,1],[67,1],[65,1.5],[62,.5],[62,1],[60,1],[62,1],[65,1],[62,2]]),
      phrase('A2 · Old Friends',[[60,1],[65,1.5],[65,.5],[65,1],[69,1],[67,1.5],[65,.5],[67,1],[69,1],[65,1],[65,1],[69,1],[72,2]]),
      phrase('Ending',[[72,1],[69,1.5],[69,.5],[65,1],[67,1],[65,1.5],[62,.5],[62,1],[60,1],[62,1],[65,1],[60,3]])]}),
    makeArrangement({id:'guitar-mountain-king',title:'In the Hall of the Mountain King — Beginner Theme',composer:'Edvard Grieg',arrangementType:'Speed Practice · Theme',difficulty:'Easy',bpm:120,recommendedAfter:'Speed and alternate-picking practice',coaching:'The complete beginner theme statement; begin slowly and raise the practice speed.',rights:rights('Peer Gynt incidental music, Op. 23 (1875–76); underlying composition is public domain','https://imslp.org/wiki/Peer_Gynt_Suite_No.1%2C_Op.46_(Grieg%2C_Edvard)'),phrases:[
      phrase('A · Sneaking',[[60,.5],[62,.5],[63,.5],[65,.5],[67,.5],[63,.5],[67,1],[66,.5],[62,.5],[66,1],[65,.5],[61,.5],[65,1]]),
      phrase('A2 · Closer',[[60,.5],[62,.5],[63,.5],[65,.5],[67,.5],[63,.5],[67,1],[68,.5],[64,.5],[68,1],[67,.5],[63,.5],[67,1]]),
      phrase('B · Gathering',[[67,.5],[69,.5],[70,.5],[72,.5],[74,.5],[70,.5],[74,1],[73,.5],[69,.5],[73,1],[72,.5],[68,.5],[72,1]]),
      phrase('Ending · Escape',[[67,.5],[69,.5],[70,.5],[72,.5],[74,.5],[70,.5],[74,1],[76,.5],[74,.5],[72,.5],[70,.5],[67,2]])]})
  ];
  const manifest=songs.map(song=>({id:song.id,title:song.title,composer:song.composer,origin:'public-domain',arrangementType:song.arrangementType,difficulty:song.difficulty,bpm:song.bpm,measureCount:song.measureCount,approximateDuration:song.approximateDuration,source:song.rights.source,views:['highway','tab']}));
  window.FMQGuitarSongbook={version:1,songs,manifest,makeArrangement,event,tuning};
  if(typeof module!=='undefined')module.exports=window.FMQGuitarSongbook;
})();
