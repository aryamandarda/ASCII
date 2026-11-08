const assert=require('node:assert/strict');
global.SunCalc=require('../dist/projects/ASCII/nyc/vendor/suncalc.js');
global.CityCalendar=require('../dist/projects/ASCII/nyc/calendar.js');
const L=require('../dist/projects/ASCII/nyc/city-life.js'),C=CityCalendar;
const start=C.localEpoch('2026-11-07',1080)/60000;
let moving=0,near=0;const styles=new Set(),intervals=new Set(),speeds=new Set();
for(let dt=0;dt<=180;dt+=.125){
 const people=L.peopleAt(start+dt);
 for(let i=0;i<people.length;i++){
  const p=people[i];speeds.add(p.speed.toFixed(2));assert(p.speed<=1);assert(Math.hypot(p.vx,p.vz)<=1.001);styles.add(p.stride.toFixed(2));intervals.add(p.paceInterval.toFixed(1));
  if(Math.hypot(p.vx,p.vz)>.1)moving++;
  for(let j=i+1;j<people.length;j++){
   const q=people[j],d=Math.hypot(p.ground[0]-q.ground[0],p.ground[1]-q.ground[1]);
   if(d<1.2)near++;
   assert(d>=p.radius+q.radius-.015,`People overlap: ${p.id}, ${q.id}, ${d}`);
  }
  for(const o of L.obstacles)if(o.id!==p.tableId)assert(Math.hypot(p.ground[0]-o.p[0],p.ground[1]-o.p[1])>=o.radius+p.radius-.015,'People must route around seating');
 }
}
assert(moving>1000&&near>100);assert(speeds.size>25,'Personal speeds must vary substantially');assert(styles.size>12&&intervals.size>12);
assert(L.densityMultiplier(.9)>L.densityMultiplier(.25)*1.8);
assert(L.body.hip>L.body.waist&&L.body.waist>L.body.shoulder);
const gaps=L.tables.slice(1).map((t,i)=>t.x-L.tables[i].x);assert(Math.max(...gaps)-Math.min(...gaps)>30,'Table spacing should vary');
assert(new Set(L.tables.map(t=>t.chairs.length)).size===4,'Seating groups should span one to four chairs');
for(const chair of L.seats){const table=L.tables[chair.tableId],center=L.unproject([table.x,table.y]),toward=center.map((v,i)=>v-chair.ground[i]);assert(toward[0]*chair.facing[0]+toward[1]*chair.facing[1]>0,'Chairs face their table')}
const boundary=Math.ceil((start+1)/L.BLOCK)*L.BLOCK,before=new Map(L.peopleAt(boundary-.001).map(p=>[p.id,p]));
for(const p of L.peopleAt(boundary+.001)){const q=before.get(p.id);if(q)assert(Math.hypot(p.ground[0]-q.ground[0],p.ground[1]-q.ground[1])<=p.speed*.0021+1e-5,'Crowd must not jump at a simulation checkpoint')}
const fingerprint=t=>L.peopleAt(t).map(p=>[p.id,p.x,p.y,p.step]);const original=fingerprint(start+11);fingerprint(start+220);assert.deepEqual(fingerprint(start+11),original);
console.log('PASS: continuous personal-space avoidance, seating clearance, varied gait and pace, nonlinear density, body proportions, irregular inward-facing seating, and reversible crowd checkpoints.');
