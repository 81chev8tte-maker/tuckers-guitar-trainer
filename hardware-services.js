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
  window.FMQHardware={midi:new MidiService(),noteName};
})();
