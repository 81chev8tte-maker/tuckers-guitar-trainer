const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const tick=()=>new Promise(resolve=>setImmediate(resolve));

function makeDocument(){
  const listeners=new Map();
  return{
    readyState:'loading',visibilityState:'visible',documentElement:{},
    addEventListener(type,fn){listeners.set(type,fn);},
    removeEventListener(type,fn){if(listeners.get(type)===fn)listeners.delete(type);},
    querySelector(){return null;},
    fire(type){listeners.get(type)?.();}
  };
}

function makeSentinel(){
  let releaseHandler=null;
  return{
    released:false,
    addEventListener(type,fn){if(type==='release')releaseHandler=fn;},
    async release(){if(this.released)return;this.released=true;releaseHandler?.();},
    systemRelease(){if(this.released)return;this.released=true;releaseHandler?.();}
  };
}

(async()=>{
  const doc=makeDocument();
  const sentinels=[];
  const nav={wakeLock:{request:async type=>{assert.equal(type,'screen');const sentinel=makeSentinel();sentinels.push(sentinel);return sentinel;}}};
  const window={dispatchEvent(){}};
  const context={window,document:doc,navigator:nav,performance:{now:()=>0},CustomEvent:function(){},MutationObserver:undefined,console,Promise,Set,Boolean,String,Number,Math};
  vm.runInNewContext(fs.readFileSync('hardware-services.js','utf8'),context,{filename:'hardware-services.js'});
  const wake=window.FMQHardware.wakeLock;

  assert.equal(wake.available(),true);
  assert.equal(wake.snapshot().wanted,false);
  wake.setActive('piano-gameplay',true);
  await tick();
  assert.equal(sentinels.length,1,'active practice should request one screen wake lock');
  assert.equal(wake.snapshot().held,true);

  wake.setActive('piano-gameplay',false);
  await tick();
  assert.equal(sentinels[0].released,true,'inactive practice should release the wake lock');
  assert.equal(wake.snapshot().held,false);

  wake.setActive('guided-hardware-test',true);
  await tick();
  assert.equal(sentinels.length,2);
  doc.visibilityState='hidden';
  doc.fire('visibilitychange');
  await tick();
  assert.equal(sentinels[1].released,true,'backgrounding should release the wake lock');
  assert.equal(wake.snapshot().held,false);

  doc.visibilityState='visible';
  doc.fire('visibilitychange');
  await tick();
  assert.equal(sentinels.length,3,'visible active practice should reacquire the wake lock');
  sentinels[2].systemRelease();
  await tick();await tick();
  assert.equal(sentinels.length,4,'system release during the same active session should reacquire safely');

  wake.setActive('guided-hardware-test',false);
  await tick();
  assert.equal(wake.snapshot().wanted,false);

  const Service=window.FMQHardware.ScreenWakeLockService;
  const unsupported=new Service({},makeDocument());
  unsupported.setActive('guitar-gameplay',true);
  await unsupported.sync();
  assert.equal(unsupported.snapshot().available,false);
  assert.equal(unsupported.snapshot().held,false);

  const denied=new Service({wakeLock:{request:async()=>{throw new Error('Denied');}}},makeDocument());
  denied.setActive('guitar-gameplay',true);
  await tick();
  assert.equal(denied.snapshot().held,false);
  assert.equal(denied.snapshot().lastError,'Denied');

  console.log('Hardware service wake lock tests passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
