(() => {
  'use strict';
  const SPEEDS = [.5,.6,.7,.8,.9,1];
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));

  function emptySkillModel(){return{version:1,updatedAt:0,totalAttempts:0,skills:{},sections:{}};}
  function normalize(model){return model&&model.version===1?{...emptySkillModel(),...model,skills:{...(model.skills||{})},sections:{...(model.sections||{})}}:emptySkillModel();}
  function updateSkill(model,key,success,timingMs=0,weight=1){
    const next=normalize(model),old=next.skills[key]||{attempts:0,successRate:.75,timingMs:0};
    const alpha=clamp(.12*weight,.05,.35),attempts=old.attempts+1;
    next.skills[key]={attempts,successRate:old.successRate*(1-alpha)+(success?1:0)*alpha,timingMs:old.timingMs*(1-alpha)+Number(timingMs||0)*alpha,lastSeen:Date.now()};
    next.totalAttempts++;next.updatedAt=Date.now();return next;
  }
  function weakestSkill(model,minAttempts=3){return Object.entries(normalize(model).skills).filter(([,v])=>v.attempts>=minAttempts).sort((a,b)=>a[1].successRate-b[1].successRate)[0]||null;}
  function analyzeRun(events,kind='piano'){
    const misses=events.filter(e=>e.status==='miss'||e.done&&e.hit===false),hits=events.length-misses.length;
    const groups=new Map();
    misses.forEach(e=>{const key=kind==='guitar'?`string:${e.string}:fret:${e.fret}`:`note:${e.midi}`;groups.set(key,(groups.get(key)||0)+1);});
    const weak=[...groups.entries()].sort((a,b)=>b[1]-a[1])[0];
    const times=misses.map(e=>Number(e.clock??e.start)).filter(Number.isFinite).sort((a,b)=>a-b);
    const center=times.length?times[Math.floor(times.length/2)]:0;
    return{accuracy:events.length?Math.round(hits/events.length*100):0,weakKey:weak?.[0]||null,weakCount:weak?.[1]||0,range:{start:Math.max(0,center-4),end:center+4}};
  }
  function smartPracticeStep(state,accuracy){
    const current={active:true,speed:.6,successes:0,mastery:85,...state};
    if(accuracy>=current.mastery){current.successes++;if(current.successes>=3){const i=SPEEDS.indexOf(current.speed);if(i<SPEEDS.length-1){current.speed=SPEEDS[i+1];current.successes=0;current.message=`Nice! Let's try ${Math.round(current.speed*100)}%.`;}else{current.active=false;current.mastered=true;current.message='Mastered! You played it at full speed.';}}else current.message=`Great! ${current.successes} of 3 strong tries.`;}
    else if(accuracy<current.mastery-20){const i=SPEEDS.indexOf(current.speed);current.speed=SPEEDS[Math.max(0,i-1)];current.successes=0;current.message=`Almost there — let's try ${Math.round(current.speed*100)}%.`;}
    else current.message='Close! Try the same speed once more.';
    return current;
  }
  window.FMQPracticeIntelligence={emptySkillModel,normalize,updateSkill,weakestSkill,analyzeRun,smartPracticeStep,SPEEDS};
  if(typeof module!=='undefined')module.exports={emptySkillModel,normalize,updateSkill,weakestSkill,analyzeRun,smartPracticeStep,SPEEDS};
})();
