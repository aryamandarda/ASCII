const assert=require('node:assert/strict');
const W=require('../dist/projects/ASCII/nyc/weather.js');
for(const x of [-8,0,8]){
 const a=W.projectWeatherPoint(x,6,20),b=W.projectWeatherPoint(x,5,20);
 assert(b.y>a.y,'World gravity travels down the image');
 assert(Math.sign(b.x-a.x)===Math.sign(x),'Gravity fans outward with camera pitch');
}
assert(W.projectWeatherPoint(1,4,8).scale>W.projectWeatherPoint(1,4,60).scale);
for(const kind of ['rain','snow'])for(let i=0;i<360;i++){
 const p=W.precipitationParticle(i,123456.7,kind,3);
 assert.deepEqual(p,W.precipitationParticle(i,123456.7,kind,3),'Time seeking reproduces particles');
 for(const q of [p.point,p.tail])assert(Object.values(q).every(Number.isFinite));
 assert(p.alpha>=0&&p.alpha<=1);assert(p.age>=0&&p.age<p.life);
 assert(p.point.y>=p.tail.y,'Streak follows projected falling trajectory');
}
const wet=W.integrate({ground:0,roof:0,wet:.8},{temperature:15,sun:1,cloud:0,rain:0,snow:0},6);
assert(wet.wet<.8&&wet.wet>0,'Pavement dries progressively');
const E=require('../dist/projects/ASCII/nyc/environment.js');
const lamps=[{position:[0,8,24],normal:[0,0,-1],area:60,color:[255,80,40],power:1,radiance:[1,.2,.05]}];
assert.deepEqual(E.wetReflectionAt(640,750,0,lamps),[0,0,0,0]);
assert.deepEqual(E.wetReflectionAt(640,300,1,lamps),[0,0,0,0]);
let reflection=0;
for(let y=650;y<854;y+=4)for(let x=0;x<1280;x+=16){const c=E.wetReflectionAt(x,y,.85,lamps);assert(c.every(Number.isFinite));assert(c[3]>=0&&c[3]<=.42);reflection+=c[3];}
assert(reflection>1,'Wet stone visibly reflects billboard illumination');
assert(E.wetReflectionAt(640,800,.8,lamps)[3]>E.wetReflectionAt(640,800,.2,lamps)[3]);
const plate={data:new Uint8ClampedArray(1280*854*4)};
for(let y=0;y<854;y++)for(let x=0;x<1280;x++){const i=(y*1280+x)*4,v=150+60*Math.exp(-((x-400)**2+(y-780)**2)/500);plate.data[i]=plate.data[i+1]=plate.data[i+2]=v;plate.data[i+3]=255;}
const center=(780*1280+400)*4,sky=plate.data[0];E.neutralizePavement(plate);
assert(plate.data[center]<175,'Baked photographic bright patch is suppressed');
assert.equal(plate.data[0],sky,'Facade and sky are untouched');
