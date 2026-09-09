// Original generated FMQ test signals: no recordings or third-party samples.
const fs=require('node:fs');
const vm=require('node:vm');
function loadPianoInputs(path='piano.js'){
  const source=fs.readFileSync(path,'utf8');
  const boundary=source.indexOf("  const pianoApp=$('pianoApp');");
  if(boundary<0)throw new Error('Piano input export boundary missing');
  // Execute the unchanged production input classes, stopping before DOM mounting.
  const clock={now:1000};
  const context={window:{},performance:{now:()=>clock.now},requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
  vm.runInNewContext(source.slice(0,boundary)+'})();',context,{filename:path});
  return {...context.window.NovaPianoInputs,clock};
}
const frequency=midi=>440*2**((midi-69)/12);
function signal(midi,{sampleRate=48000,amplitude=.1,harmonics=[1],phase=0,start=0,decay=0,cents=0}={}){
  const hz=frequency(midi)*2**(cents/1200),norm=harmonics.reduce((a,b)=>a+Math.abs(b),0);
  return Float32Array.from({length:4096},(_,i)=>{
    const t=(start+i)/sampleRate;
    return amplitude*Math.exp(-decay*t)*harmonics.reduce((sum,gain,h)=>sum+gain*Math.sin(2*Math.PI*hz*(h+1)*t+phase*(h+1)),0)/norm;
  });
}
const rms=data=>Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length);
module.exports={loadPianoInputs,frequency,signal,rms};
