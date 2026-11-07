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
const canvases=[],images=[];let nextFrame;
class Context {constructor(){this.draws=[]}drawImage(...a){this.draws.push(a)}getImageData(x,y,w,h){return{data:new Uint8ClampedArray(w*h*4).fill(160)}}fillRect(){}fillText(){}beginPath(){}lineTo(){}moveTo(){}closePath(){}save(){}restore(){}clip(){}transform(){}setTransform(){}fill(){}stroke(){}ellipse(){}translate(){}scale(){}createLinearGradient(){return{addColorStop(){}}}createRadialGradient(){return{addColorStop(){}}}}
function canvas(){const c={dataset:{},style:{setProperty(){}},width:0,height:0,context:new Context(),getContext(){return this.context}};canvases.push(c);return c}
class ImageMock {constructor(){this.naturalWidth=240;this.naturalHeight=360;images.push(this)}}
const elements={art:canvas(),ambient:canvas()};function element(id){return elements[id]||(elements[id]={style:{setProperty(){}},setAttribute(){},removeAttribute(){},focus(){}})}
const win={};vm.runInNewContext(fs.readFileSync('dist/projects/ASCII/nyc/motion-manifest.js','utf8'),{window:win});
const sandbox={BillboardModel:model,AdDirector:director,CharacterGrid:grid,CityLife:life,CityTraffic:traffic,CityCalendar,Intl,Date,MotionManifest:win.MotionManifest,CityEnvironment:{setPalette(){},palettes:{},paintReflections(){},create(){return{render:hour=>({hour}),skyPixels:170000}}},Image:ImageMock,
 document:{hidden:false,querySelectorAll(){return[]},getElementById:element,addEventListener(){},createElement(tag){assert.equal(tag,'canvas','No hidden autoplay video dependency');return canvas()}},
 matchMedia:()=>({matches:false}),performance:{now:()=>0},requestAnimationFrame(fn){nextFrame=fn},setTimeout(fn){fn()},clearTimeout(){}};
(async()=>{
 vm.runInNewContext(fs.readFileSync('dist/projects/ASCII/nyc/fixed-screens.js','utf8'),sandbox);
 images.forEach(i=>i.onload());await new Promise(resolve=>setImmediate(resolve));
 assert(nextFrame,'Fresh load must start the animation loop');
 nextFrame(1000);nextFrame(1180);const first=elements.art.dataset.motionFrames;nextFrame(1360);
 assert.notEqual(elements.art.dataset.motionFrames,first,'Campaign frames advance without a pause/play click');
 assert(+elements.art.dataset.simulationTime>0,'Walkers and ads share an advancing clock');
 const [out,ambient,world,sample,atlas]=canvases;
 const columns=390,rows=grid.size(columns).rows;
 assert.equal(out.width,columns*6);assert.equal(out.height,rows*10);assert.equal(out.dataset.columns,390);
 assert(out.context.draws.every(a=>a[0]===atlas),'All visible content must pass through the character atlas');
 assert.equal(sample.context.draws[0][0],world);assert.deepEqual(sample.context.draws[0].slice(1),[0,0,columns,rows]);assert(world.context.draws.length>model.boards.length);
 const html=fs.readFileSync('dist/projects/ASCII/nyc/index.html','utf8');assert(!html.includes('id="density"'),'The density slider is removed');
 elements.time.value='240';elements.time.oninput();const quiet=+out.dataset.people;elements.time.value='1020';elements.time.oninput();assert(+out.dataset.people>quiet*3);
 elements.play.onclick();const paused=out.dataset.simulationTime;nextFrame(1540);nextFrame(1720);assert.equal(out.dataset.simulationTime,paused);
 elements.play.onclick();nextFrame(1900);nextFrame(2080);assert(+out.dataset.simulationTime>+paused);
 elements.reverse.onclick();const epoch=+out.dataset.epoch;nextFrame(2260);assert(+out.dataset.epoch<epoch);
 assert.equal(out.dataset.direction,-1);
 elements.reverse.onclick();elements.time.value='1439';elements.time.oninput();elements.date.value='2026-12-31';elements.date.onchange();
 nextFrame(3260);nextFrame(4260);assert.equal(out.dataset.date,'2027-01-01');

 console.log('PASS: startup without user gesture; frame sequences; pause/resume; fixed 390-column rendering; hourly crowd, exact clock, reverse and calendar rollover; ten creatives and grouped takeovers.');
})().catch(e=>{console.error(e);process.exitCode=1});
