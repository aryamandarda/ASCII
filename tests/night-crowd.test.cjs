const assert=require('node:assert/strict');
global.SunCalc=require('../web/artworks/nyc/vendor/suncalc.js');
global.CityCalendar=require('../web/artworks/nyc/calendar.js');
const L=require('../web/artworks/nyc/city-life.js'),E=require('../web/artworks/nyc/environment.js');
// Reproduce the left-table trap, then cover randomized waypoints near both tables.
for(let slot=33223000;slot<33225000;slot++){
 const trip=L.trip(slot);if(!trip)continue;
 assert(trip.route.p.length>1);
 for(const p of trip.route.p)for(const o of L.obstacles)
  assert(Math.hypot(p[0]-o.p[0],p[1]-o.p[1])>=o.radius+trip.radius,'Walking targets must clear every table, including adjacent ones');
}
const start=CityCalendar.localEpoch('2026-11-07',1080)/60000;
let evening=0,dawn=0,rearEvening=0,rearDawn=0;const initialIds=new Set(L.peopleAt(start).map(p=>p.id));
for(let dt=0;dt<=720;dt+=30){
 const people=L.peopleAt(start+dt);
 for(const p of people)assert(start+dt-p.birth<430,`Pedestrian ${p.id} persists for hours`);
 if(dt<=120){evening+=people.length;rearEvening+=people.filter(p=>p.y<685&&p.x>250&&p.x<850).length;}
 if(dt>=540&&dt<=660){dawn+=people.length;rearDawn+=people.filter(p=>p.y<685&&p.x>250&&p.x<850).length;}
 if(dt===720)assert(people.every(p=>!initialIds.has(p.id)),'The evening crowd must leave, including the left cluster');
}
assert(rearEvening>=70,'Busy crowd continues into the rear plaza rather than stopping at the foreground');
assert(rearEvening>rearDawn*4,'Distant pedestrians follow time-of-day density too');
assert(evening>dawn*4,'Actual visible crowd must thin out overnight');
const quad=[[0,0],[200,0],[200,150],[0,150]],red=E.billboardLight(quad,[180,10,20]),blue=E.billboardLight(quad,[10,30,180]);
assert(red.color[0]>red.color[2]*5&&blue.color[2]>blue.color[0]*5,'Spill color must follow the active creative');
assert.equal(E.billboardLight(quad,[0,0,0]).power,0,'Black screens emit no glow');
const stages=[];const g={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},translate(){},scale(){},fillRect(){},createRadialGradient(){return{addColorStop:(p,c)=>stages.push(c)}}};
E.paintBillboardGlow(g,{night:0},[{light:red}]);assert.equal(stages.length,0,'No neon spill in daytime');
E.paintBillboardGlow(g,{night:1},[{light:red}]);assert(stages.some(c=>c.startsWith('rgba(255,')),'Night glow uses the screen emission');
assert(E.billboardExposure({night:1})>.75);assert.equal(E.billboardExposure({night:0}),0);
console.log('PASS: reachable waypoints, overnight crowd turnover and density, ad-colored nighttime emission and spill.');
