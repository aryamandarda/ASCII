(function(root){
  function projectFrame(frame,time){
    const dt=Math.max(-.35,Math.min(.35,time-frame.time));
    return frame.people.map(p=>{const ground=[p.ground[0]+p.vx*dt,p.ground[1]+p.vz*dt],q=root.CityLife.project(ground),step=p.step+Math.hypot(p.vx,p.vz)*dt/p.stride*Math.PI*2;return{...p,...q,ground,step}});
  }
  function create(onFrame=()=>{},WorkerClass=root.Worker){
    if(!WorkerClass)return{mode:()=>"main",peopleAt:t=>root.CityLife.peopleAt(t)};
    let worker,busy=false,wanted=0,frame=null,failed=false;
    const request=()=>{if(busy||failed||frame?.time===wanted)return;busy=true;worker.postMessage({time:wanted})};
    try{worker=new WorkerClass(new URL('crowd-worker.js',document.baseURI));worker.onmessage=({data})=>{busy=false;if(Math.abs(data.time-wanted)<3){frame=data;onFrame()}request()};worker.onerror=()=>{failed=true;busy=false;worker.terminate();onFrame()}}catch{failed=true}
    return{mode:()=>failed?"fallback":"worker",peopleAt(time){if(failed)return root.CityLife.peopleAt(time);wanted=time;request();return frame&&Math.abs(time-frame.time)<3?projectFrame(frame,time):[]}};
  }
  root.CityCrowd={create,projectFrame};if(typeof module!=='undefined')module.exports=root.CityCrowd;
})(typeof window==='undefined'?globalThis:window);
