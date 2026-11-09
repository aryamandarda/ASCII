const assert=require('node:assert/strict'),{layout,pan}=require('../dist/projects/ASCII/nyc/scene-view.js'),grid=require('../dist/projects/ASCII/nyc/character-grid.js');
for(const [w,h] of [[390,844],[844,390],[375,667],[667,375]]){const cover=layout(w,h,true),fit=layout(w,h,false);assert(cover.width>=w-1e-8&&cover.height>=h-1e-8);assert(fit.width<=w+1e-8&&fit.height<=h+1e-8);assert(Math.abs(cover.width/cover.height-1280/854)<1e-8);assert(grid.columnsForView(w,h,'cover')>=grid.columnsForView(w,h));assert.equal(pan(.5,1e6,cover.overflowX),cover.overflowX>1?0:.5);assert.equal(pan(.5,-1e6,cover.overflowY),cover.overflowY>1?1:.5)}
assert.equal(pan(.5,100,0),.5);assert.equal(pan(.5,100,400),.25);
console.log('PASS: portrait/landscape fit and cover, bounded panning, aspect ratio and character density');

// Exercise the browser state machine across rotation, zoom and exit, rather
// than checking only the aspect-ratio arithmetic.
{
 const vm=require('node:vm'),fs=require('node:fs'),listeners={},elements={};
 for(const id of ['surface','art','viewFit','viewFullscreen','viewHint'])elements[id]={hidden:false,dataset:{},style:{},setAttribute(k,v){this[k]=v},addEventListener(){}};
 const context={innerWidth:390,innerHeight:700,navigator:{},URL,clearTimeout(){},setTimeout(){return 1},document:{body:{classList:{toggle(){}}},getElementById:id=>elements[id],addEventListener(){}}};
 context.window=context;context.addEventListener=(type,fn)=>listeners[type]=fn;context.matchMedia=query=>({get matches(){return query.includes('max-width')&&(context.innerWidth<=600||context.innerWidth<=1000&&context.innerHeight<=600)}});
 vm.runInNewContext(fs.readFileSync('dist/projects/ASCII/nyc/scene-view.js','utf8'),context);
 let shown;context.SceneView.enter(()=>{},show=>shown=show);assert.equal(shown,false);assert.equal(elements.viewFullscreen.hidden,true);assert.equal(context.SceneView.mode(),'contain');
 elements.viewFit.onclick();assert.equal(context.SceneView.mode(),'cover');
 context.innerWidth=844;context.innerHeight=330;listeners.resize();assert.equal(context.SceneView.mode(),'contain','Rotation restores the complete scene');assert.equal(elements.viewFit.textContent,'Zoom in');assert.equal(elements.viewFullscreen.hidden,true);
 elements.viewFit.onclick();assert.equal(context.SceneView.mode(),'cover');context.SceneView.leave();assert.equal(context.SceneView.mode(),'contain');assert.equal(elements.viewHint.hidden,true);
 context.innerWidth=1440;context.innerHeight=900;listeners.resize();context.SceneView.enter(()=>{},show=>shown=show);assert.equal(shown,true);assert.equal(elements.viewFit.hidden,true);assert.equal(context.SceneView.compact(),false);assert.equal(elements.viewFullscreen.hidden,false);
}
