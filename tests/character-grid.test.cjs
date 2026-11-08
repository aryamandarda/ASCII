const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const model=require('../dist/projects/ASCII/nyc/billboard-model.js'),director=require('../dist/projects/ASCII/nyc/ad-director.js'),grid=require('../dist/projects/ASCII/nyc/character-grid.js'),life=require('../dist/projects/ASCII/nyc/city-life.js');
assert.equal(director.names.length,10);
for(const t of [0,10,21,31,41,61,65,128])assert.equal(new Set(director.mainScreens.map(i=>director.adAt(i,t).ad)).size,10);
for(const [g,start]of [[0,12],[1,32],[2,52]]) {
  for(const t of [start,start+4,start+7.9]) {const states=director.groups[g].ids.map(i=>director.adAt(i,t));assert.equal(new Set(states.map(s=>s.ad)).size,1);assert(states.every(s=>s.group===g));assert(model.boards.some((_,i)=>director.adAt(i,t).group===-1))}
  assert.equal(director.sceneAt(start+8).group,-1);assert(new Set(director.groups[g].ids.map(i=>director.adAt(i,start+8).ad)).size>1);
}
const flowSum=Array.from({length:24},(_,h)=>life.trafficAt(h).flow).reduce((a,b)=>a+b,0);
assert(Math.abs(flowSum-220000)<24,'Estimated hourly flow must sum to the published daily anchor');
assert(life.trafficAt(17).count>life.trafficAt(4).count*10);assert(life.trafficAt(12).count>life.trafficAt(10).count);
global.SunCalc=require('../dist/projects/ASCII/nyc/vendor/suncalc.js');global.CityCalendar=require('../dist/projects/ASCII/nyc/calendar.js');global.BillboardModel=model;const traffic=require('../dist/projects/ASCII/nyc/traffic.js');
// Integration: fresh page advances on its own, no video autoplay or user gesture.
const canvases=[],images=[],listeners={};let nextFrame,resizeCallback;
class Context {constructor(){this.draws=[];this.uploads=[]}createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)}}putImageData(...args){this.uploads.push(args)}drawImage(...a){this.draws.push(a)}getImageData(x,y,w,h){return{data:new Uint8ClampedArray(w*h*4).fill(160)}}fillRect(){}fillText(){}beginPath(){}lineTo(){}moveTo(){}closePath(){}save(){}restore(){}clip(){}transform(){}setTransform(){}fill(){}stroke(){}ellipse(){}translate(){}scale(){}createLinearGradient(){return{addColorStop(){}}}createRadialGradient(){return{addColorStop(){}}}}
function canvas(){const c={dataset:{},style:{setProperty(){}},width:0,height:0,context:new Context(),getContext(){return this.context}};canvases.push(c);return c}
class ImageMock {constructor(){this.naturalWidth=240;this.naturalHeight=360;images.push(this)}}
const elements={art:canvas(),ambient:canvas()};function element(id){return elements[id]||(elements[id]={style:{setProperty(){}},attributes:{},clientWidth:390,clientHeight:844,setAttribute(k,v){this.attributes[k]=v},removeAttribute(){},focus(){}})}
const win={};vm.runInNewContext(fs.readFileSync('dist/projects/ASCII/nyc/motion-manifest.js','utf8'),{window:win});
const weather=require('../dist/projects/ASCII/nyc/weather.js'),environment=require('../dist/projects/ASCII/nyc/environment.js');
const sandbox={CityWeather:{...weather,paintSurfaces(){},paintPrecipitation(){},paintFurnitureSnow(){}},BillboardModel:model,AdDirector:director,CharacterGrid:grid,CityLife:life,CityTraffic:traffic,CityCalendar,Intl,Date,MotionManifest:win.MotionManifest,CityEnvironment:{...environment,setPalette(){},palettes:{},paintBillboardGlow(){},billboardExposure:()=>.85,create(){return{render:hour=>({hour}),skyPixels:170000}}},Image:ImageMock,
 document:{hidden:false,querySelectorAll(){return[]},getElementById:element,addEventListener(name,fn){listeners[name]=fn},createElement(tag){assert.equal(tag,'canvas','No hidden autoplay video dependency');return canvas()}},
 ResizeObserver:class{constructor(fn){resizeCallback=fn}observe(){}},
 matchMedia:()=>({matches:false}),performance:{now:()=>0},requestAnimationFrame(fn){nextFrame=fn},setTimeout(fn){fn()},clearTimeout(){}};
(async()=>{
 vm.runInNewContext(fs.readFileSync('dist/projects/ASCII/nyc/fixed-screens.js','utf8'),sandbox);
 images.forEach(i=>i.onload());await new Promise(resolve=>setImmediate(resolve));
 assert(nextFrame,'Fresh load must start the animation loop');
 nextFrame(1000);nextFrame(1180);const first=elements.art.dataset.motionFrames;nextFrame(1360);
 assert.notEqual(elements.art.dataset.motionFrames,first,'Campaign frames advance without a pause/play click');
 assert(+elements.art.dataset.simulationTime>0,'Walkers and ads share an advancing clock');
 const [out,ambient,world,sample,lightSample,atlas]=canvases;
 const columns=390,rows=grid.size(columns).rows;
 assert.equal(out.width,columns*6);assert.equal(out.height,rows*10);assert.equal(out.dataset.columns,390);
 assert(out.context.uploads.length>0,'Character pixels must reach the visible canvas');assert.equal(out.context.uploads[0][0].data.length,out.width*out.height*4);assert(out.context.uploads[0][0].data.every(v=>v===160),'Every visible cell is copied from the glyph atlas');
 assert.equal(sample.context.draws[0][0],world);assert.deepEqual(sample.context.draws[0].slice(1),[0,0,columns,rows]);assert(world.context.draws.length>model.boards.length);
 const html=fs.readFileSync('dist/projects/ASCII/nyc/index.html','utf8');assert(!html.includes('id="density"'),'The density slider is removed');
 elements.time.value='240';elements.time.oninput();const quiet=+out.dataset.people;elements.time.value='1020';elements.time.oninput();assert(+out.dataset.people>quiet*3);
 elements.play.onclick();const paused=out.dataset.simulationTime;nextFrame(1540);nextFrame(1720);assert.equal(out.dataset.simulationTime,paused);
 elements.play.onclick();nextFrame(1900);nextFrame(2080);assert(+out.dataset.simulationTime>+paused);
 elements.reverse.onclick();const epoch=+out.dataset.epoch;nextFrame(2260);assert(+out.dataset.epoch<epoch);
 assert.equal(out.dataset.direction,-1);
 elements.reverse.onclick();elements.time.value='1439';elements.time.oninput();elements.date.value='2026-12-31';elements.date.onchange();
 nextFrame(3260);nextFrame(4260);assert.equal(out.dataset.date,'2027-01-01');

 const savedEpoch=out.dataset.epoch;
 elements.surface.clientWidth=1440;elements.surface.clientHeight=900;resizeCallback();
 assert(+out.dataset.columns>=670,'Desktop must render finer characters');assert.equal(out.dataset.epoch,savedEpoch,'Resize must not reset time');
 elements.surface.clientWidth=390;elements.surface.clientHeight=844;resizeCallback();assert.equal(+out.dataset.columns,390);
 vm.runInNewContext('showControls(false)',sandbox);assert(elements.controls.hidden&&elements.leave.hidden);assert.equal(elements.controlsToggle.attributes['aria-label'],'Show controls');
 elements.controlsToggle.onclick();assert.equal(elements.controls.hidden,false);assert.equal(elements.controlsToggle.attributes['aria-label'],'Hide controls');
 vm.runInNewContext('immersed=true',sandbox);sandbox.document.activeElement={tagName:'BUTTON'};
 listeners.keydown({key:'h',code:'KeyH',preventDefault(){}});assert(elements.controls.hidden,'H works after clicking a button');
 listeners.keydown({key:'H',code:'KeyH',preventDefault(){}});assert(!elements.controls.hidden,'H restores controls');
 sandbox.document.activeElement={tagName:'INPUT'};listeners.keydown({key:'h',code:'KeyH',preventDefault(){}});assert(!elements.controls.hidden,'Do not toggle while editing');
 console.log('PASS: startup without user gesture; frame sequences; pause/resume; responsive rendering and hide/show controls; hourly crowd, exact clock, reverse and calendar rollover; ten creatives and grouped takeovers.');
})().catch(e=>{console.error(e);process.exitCode=1});
