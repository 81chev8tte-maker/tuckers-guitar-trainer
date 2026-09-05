(() => {
  'use strict';

  const GROUP_TOLERANCE = .025;
  const isActiveScoringEvent = event => Boolean(event) && event.status !== 'skipped';
  const activeScoringEvents = events => (events || []).filter(isActiveScoringEvent);
  const guitarRunSummary = events => {
    const active = activeScoringEvents(events);
    const hits = active.filter(event => event.status === 'hit').length;
    const misses = active.filter(event => event.status === 'miss').length;
    return {active,hits,misses,total:active.length,accuracy:active.length?Math.round(hits/active.length*100):0};
  };

  function createPianoTargetGroups(notes,start=-Infinity,end=Infinity,tolerance=GROUP_TOLERANCE){
    const sorted=(notes||[]).map((note,index)=>({note,index})).filter(item=>item.note.start>=start&&item.note.start<=end).sort((a,b)=>a.note.start-b.note.start||a.note.midi-b.note.midi||a.index-b.index);
    const groups=[];
    for(const item of sorted){
      let group=groups.at(-1);
      if(!group||Math.abs(group.start-item.note.start)>tolerance){group={start:item.note.start,items:[],required:new Set(),matched:new Set(),done:false};groups.push(group);}
      group.items.push(item);group.required.add(item.note.midi);
    }
    return groups;
  }

  class PianoTargetTracker {
    constructor(notes,start=-Infinity,end=Infinity,tolerance=GROUP_TOLERANCE){this.reset(notes,start,end,tolerance);}
    reset(notes,start=-Infinity,end=Infinity,tolerance=GROUP_TOLERANCE){this.groups=createPianoTargetGroups(notes,start,end,tolerance);this.groupIndex=0;return this;}
    current(){while(this.groups[this.groupIndex]?.done)this.groupIndex++;return this.groups[this.groupIndex]||null;}
    accept(midi){const group=this.current();if(!group||!group.required.has(midi))return{accepted:false,complete:false,duplicate:false,group};if(group.matched.has(midi))return{accepted:false,complete:false,duplicate:true,group};group.matched.add(midi);const items=group.items.filter(item=>item.note.midi===midi);const complete=[...group.required].every(note=>group.matched.has(note));if(complete){group.done=true;this.groupIndex++;}return{accepted:true,complete,duplicate:false,group,items};}
    missCurrent(){const group=this.current();if(!group)return null;group.done=true;this.groupIndex++;return group;}
  }

  function pianoArrangementForInput(notes,input='screen'){
    const full=(notes||[]).map(note=>({...note})).sort((a,b)=>a.start-b.start||a.midi-b.midi);
    if(input!=='microphone')return full;
    return createPianoTargetGroups(full).map(group=>({...group.items.at(-1).note,chordSize:group.required.size}));
  }

  const api={GROUP_TOLERANCE,isActiveScoringEvent,activeScoringEvents,guitarRunSummary,createPianoTargetGroups,PianoTargetTracker,pianoArrangementForInput};
  if(typeof window!=='undefined')window.FMQGameplayRules=api;
  if(typeof module!=='undefined')module.exports=api;
})();
