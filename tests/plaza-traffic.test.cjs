const assert=require('node:assert/strict');
global.SunCalc=require('../dist/projects/ASCII/nyc/vendor/suncalc.js');global.CityCalendar=require('../dist/projects/ASCII/nyc/calendar.js');global.BillboardModel=require('../dist/projects/ASCII/nyc/billboard-model.js');
const C=CityCalendar,B=BillboardModel,T=require('../dist/projects/ASCII/nyc/traffic.js'),L=require('../dist/projects/ASCII/nyc/city-life.js'),E=require('../dist/projects/ASCII/nyc/environment.js');
// The knee should stay between hip and ankle vertically; left/right legs never invert.
for(let phase=0;phase<Math.PI*2;phase+=.03)for(const dir of [-1,1]){const a=L.legPose(phase,-1,dir),b=L.legPose(phase,1,dir);assert(a.ankle[0]<b.ankle[0]);assert(a.knee[0]<b.knee[0]);for(const leg of [a,b])assert(leg.hip[1]<leg.knee[1]&&leg.knee[1]<leg.ankle[1])}
let stopped=false,moving=false,lanes=new Set(),lamps=new Set();const base=C.localEpoch('2026-11-07',1020)/60000;
for(let dt=0;dt<170;dt+=.5){const cars=T.carsAt(base+dt);for(const lane of [0,1]){const q=cars.filter(c=>c.lane===lane).sort((a,b)=>b.s-a.s);for(let i=1;i<q.length;i++){const gap=q[i-1].s-q[i].s-(q[i-1].length+q[i].length)/2;assert(gap>1.8,`Vehicle gap ${gap}`)}}
 for(const car of cars){lanes.add(car.lane);stopped ||=car.speed<.05;moving ||=car.speed>1.4;assert(car.speed>=0&&car.speed<2.31);if(car.v>.08&&car.v<.95)assert(B.inside(T.quad,car.x,car.y))}
 if(dt%10===0)for(const p of L.peopleAt(base+dt)){if(p.x<735||p.x>1280)continue;const curb=642+(p.x-735)*148/765;assert(p.y-p.h*.06>curb,'Pedestrian footfall must clear the traffic curb')}
}
assert(stopped&&moving);assert.equal(lanes.size,2);
const capture=t=>T.carsAt(t).map(c=>[c.id,c.x,c.y,c.speed,c.braking]);const snapshot=capture(base+50);T.carsAt(base+500);assert.deepEqual(capture(base+50),snapshot,'Traffic must reverse deterministically');
// Cached simulation block boundaries must not teleport a vehicle.
const boundary=Math.ceil(base/240)*240,a=new Map(T.carsAt(boundary-.01).map(c=>[c.id,c])),b=T.carsAt(boundary+.01);for(const car of b){if(a.has(car.id))assert(Math.abs(car.s-a.get(car.id).s)<.08,'Traffic continuity across cache blocks')}
const ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},ellipse(){},fillRect(){lamps.add(this.fillStyle)}};
for(const lane of [0,1]){T.paintCar(ctx,{lane,u:lane===0?.27:.75,v:.7,x:970,alpha:1,taxi:true,color:'#777777',braking:true},{night:1,day:0})}assert(lamps.has('#fff4cd'));assert(lamps.has('#ff3945'));
const twilight=C.events('2026-11-07'),ids=Array.from({length:80},(_,i)=>i*101+1),count=epoch=>ids.reduce((n,id)=>n+(E.windowState(id,epoch,C.lightAt(epoch))>.5),0);const before=count(+twilight.sunset-70*60000),dusk=count(+twilight.sunset),after=count(+twilight.sunset+60*60000);assert(before<dusk&&dusk<after,'Windows turn on independently through dusk');
for(const id of Object.keys(E.palettes)){const dawn=E.skyColor(C.lightAt(+twilight.sunrise),.7,id),dusk=E.skyColor(C.lightAt(+twilight.sunset),.7,id);assert.notDeepEqual(dawn,dusk);assert(Math.max(...dusk)-Math.min(...dusk)>50)}
console.log('PASS: aligned legs, two-way traffic, vehicle spacing, stopping/starting, road separation, reverse/cache continuity, white headlights, red brake lights, staggered windows and distinct sky palettes.');
