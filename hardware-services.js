(() => {
  'use strict';
  const NOTE_NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const noteName=midi=>`${NOTE_NAMES[(midi%12+12)%12]}${Math.floor(midi/12)-1}`;
  class MidiService {
    constructor(){this.access=null;this.input=null;this.listeners=new Set();this.held=new Set();this.sustain=false;this.status='idle';this.boundMessage=e=>this.handleMessage(e);this.boundState=e=>this.handleState(e);}
    available(){return Boolean(navigator.requestMIDIAccess);}
    async connect(inputId=''){if(!this.available())throw new Error('Web MIDI is not available in this browser.');this.access=await navigator.requestMIDIAccess();this.access.onstatechange=this.boundState;const inputs=[...this.access.inputs.values()];this.select(inputId||inputs[0]?.id||'');this.status=this.input?'connected':'waiting';this.emit({type:'status'});return this.snapshot();}
    select(id){if(this.input)this.input.onmidimessage=null;this.input=[...(this.access?.inputs.values()||[])].find(i=>i.id===id)||null;if(this.input)this.input.onmidimessage=this.boundMessage;this.held.clear();}
    handleState(){const id=this.input?.id;const inputs=[...this.access.inputs.values()];if(!this.input||this.input.state==='disconnected')this.select(inputs.find(i=>i.id===id)?.id||inputs[0]?.id||'');this.status=this.input?'connected':'waiting';this.emit({type:'statechange'});}
    handleMessage(event){const [status,data1=0,data2=0]=event.data,command=status&0xf0,channel=(status&15)+1;let type='other';if(command===0x90&&data2>0){type='noteon';this.held.add(data1);}else if(command===0x80||(command===0x90&&data2===0)){type='noteoff';this.held.delete(data1);}else if(command===0xb0){type='controlchange';if(data1===64)this.sustain=data2>=64;}this.emit({type,midi:data1,note:type.startsWith('note')?noteName(data1):'',velocity:data2,channel,controller:command===0xb0?data1:null,value:command===0xb0?data2:null,receivedAt:performance.now(),sourceTimestamp:event.timeStamp});}
    subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
    emit(event){const full={...event,held:[...this.held],polyphony:this.held.size,sustain:this.sustain,snapshot:this.snapshot()};this.listeners.forEach(fn=>fn(full));window.dispatchEvent(new CustomEvent('fmq:midi',{detail:full}));}
    snapshot(){return{available:this.available(),status:this.status,input:this.input?{id:this.input.id,name:this.input.name||'MIDI keyboard',manufacturer:this.input.manufacturer||'',state:this.input.state}:null,inputs:[...(this.access?.inputs.values()||[])].map(i=>({id:i.id,name:i.name,manufacturer:i.manufacturer,state:i.state})),held:[...this.held],sustain:this.sustain};}
    destroy(){if(this.input)this.input.onmidimessage=null;if(this.access)this.access.onstatechange=null;this.input=null;this.access=null;this.held.clear();this.status='idle';}
  }

  class ScreenWakeLockService {
    constructor(nav=navigator,doc=document){
      this.nav=nav;this.doc=doc;this.reasons=new Set();this.sentinel=null;this.requestPromise=null;this.lastError=null;this.observer=null;
      this.boundVisibility=()=>this.sync();
      this.doc?.addEventListener?.('visibilitychange',this.boundVisibility);
    }
    available(){return Boolean(this.nav?.wakeLock?.request);}
    wanted(){return this.reasons.size>0;}
    shouldHold(){return this.wanted()&&this.doc?.visibilityState!=='hidden';}
    setActive(reason,active){
      if(!reason)return this.snapshot();
      if(active)this.reasons.add(reason);else this.reasons.delete(reason);
      this.sync();
      return this.snapshot();
    }
    snapshot(){return{available:this.available(),activeReasons:[...this.reasons],wanted:this.wanted(),held:Boolean(this.sentinel&&!this.sentinel.released),lastError:this.lastError};}
    async sync(){
      if(!this.shouldHold()){
        const current=this.sentinel;this.sentinel=null;
        if(current&&!current.released){try{await current.release();}catch{}}
        return this.snapshot();
      }
      if(!this.available()||this.sentinel||this.requestPromise)return this.snapshot();
      this.requestPromise=Promise.resolve().then(()=>this.nav.wakeLock.request('screen')).then(async sentinel=>{
        if(!sentinel)return null;
        if(!this.shouldHold()){
          try{await sentinel.release();}catch{}
          return null;
        }
        this.lastError=null;
        this.sentinel=sentinel;
        const released=()=>{
          if(this.sentinel===sentinel)this.sentinel=null;
          if(this.shouldHold())Promise.resolve().then(()=>this.sync());
        };
        sentinel.addEventListener?.('release',released,{once:true});
        return sentinel;
      }).catch(error=>{
        this.lastError=String(error?.message||error||'Wake Lock request failed');
        this.sentinel=null;
        return null;
      }).finally(()=>{this.requestPromise=null;});
      await this.requestPromise;
      return this.snapshot();
    }
    trackActiveUi(){
      if(!this.doc?.querySelector||typeof MutationObserver==='undefined'||this.observer)return;
      const visible=element=>Boolean(element&&!element.hidden&&element.getAttribute?.('aria-hidden')!=='true');
      const refresh=()=>{
        const guitar=this.doc.querySelector('#gameScreen');
        const piano=this.doc.querySelector('#pianoGame');
        const pianoResult=this.doc.querySelector('.piano-result-panel');
        const guided=this.doc.querySelector('#guidedTask');
        this.setActive('guitar-gameplay',visible(guitar)&&guitar.classList?.contains('playing'));
        this.setActive('piano-gameplay',visible(piano)&&!visible(pianoResult));
        this.setActive('guided-hardware-test',visible(guided));
      };
      this.observer=new MutationObserver(refresh);
      this.observer.observe(this.doc.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','aria-hidden']});
      refresh();
    }
    stopTracking(){this.observer?.disconnect?.();this.observer=null;this.reasons.clear();this.sync();}
    dispose(){this.stopTracking();this.doc?.removeEventListener?.('visibilitychange',this.boundVisibility);}
  }

  const midi=new MidiService();
  const wakeLock=new ScreenWakeLockService();
  window.FMQHardware={midi,noteName,wakeLock,ScreenWakeLockService};
  const startWakeTracking=()=>wakeLock.trackActiveUi();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startWakeTracking,{once:true});else startWakeTracking();
})();
