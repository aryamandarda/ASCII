const assert=require('node:assert/strict');
global.SunCalc=require('../dist/projects/ASCII/nyc/vendor/suncalc.js');global.CityCalendar=require('../dist/projects/ASCII/nyc/calendar.js');
const W=require('../dist/projects/ASCII/nyc/weather.js'),E=require('../dist/projects/ASCII/nyc/environment.js'),C=CityCalendar,H=3600000;
const at=(date,hour=12)=>W.weatherAt(C.localEpoch(date,hour*60));
assert(at('2026-01-02').snow>.1);assert(at('2026-01-02').groundSnow>3);
assert.equal(at('2026-01-03').snow,0);assert(at('2026-01-03').groundSnow>5,'Snow persists after the storm');
assert(at('2026-01-06').groundSnow<at('2026-01-03').groundSnow);assert.equal(at('2026-01-07').groundSnow,0);assert(at('2026-01-07').roofSnow>2,'Sheltered ledges thaw later');
const rain=at('2026-04-05');assert(rain.rain>.1&&rain.cloud>.85&&rain.wetness>0);assert.equal(rain.snow,0);
let winter=0,summer=0;for(let day=1;day<=28;day++){winter+=at(`2026-01-${String(day).padStart(2,'0')}`).temperature;const w=at(`2026-07-${String(day).padStart(2,'0')}`);summer+=w.temperature;assert.equal(w.snow,0);assert.equal(w.groundSnow,0)}assert(summer-winter>28*18);
const epoch=C.localEpoch('2026-01-02',720),before=W.weatherAt(epoch);W.weatherAt(C.localEpoch('2029-06-21'));W.weatherAt(C.localEpoch('2023-01-01'));W.weatherAt(C.localEpoch('2022-01-01'));assert.deepEqual(W.weatherAt(epoch),before,'History survives cache eviction, time jumps and reversal');
for(const time of [epoch,C.localEpoch('2026-12-31',1439),Date.parse('2027-03-14T07:00Z'),Date.parse('2028-02-29T00:00Z')]){const a=W.weatherAt(time-.01),b=W.weatherAt(time+.01);for(const key of ['groundSnow','roofSnow','cloud','rain','snow','temperature'])assert(Math.abs(a[key]-b[key])<1e-5,`${key} jumps at a boundary`)}
const cold={temperature:-5,sun:0,cloud:1,rain:0,snow:0};assert(W.integrate({ground:10,roof:10,wet:0},cold,24).ground>9,'Cold dry weather does not erase snow');
const warm={...cold,temperature:10,sun:1,cloud:0};assert(W.integrate({ground:10,roof:10,wet:0},warm,24).ground===0);
assert.equal(W.snowCoverage(640,300,10),0,'Never paint snow in the sky');assert(W.snowCoverage(30,820,10)>W.snowCoverage(640,820,1),'Drifts and worn paths differ');
assert(W.cloudDensity(640,200,epoch,.95)>W.cloudDensity(640,200,epoch,.05));assert(Math.abs(W.cloudDensity(640,200,epoch,.8)-W.cloudDensity(640,200,epoch+1000,.8))<.01,'Cloud drift is continuous');
// Independently published lunar dates, around the 2024-04-08 eclipse and Apr 23 full moon.
const fresh=C.lightAt(Date.parse('2024-04-08T18:21Z')),full=C.lightAt(Date.parse('2024-04-23T23:49Z'));assert(fresh.moonFraction<.002);assert(full.moonFraction>.99);
assert.deepEqual(E.moonSpan(0,.25,.5),[0,1]);assert.deepEqual(E.moonSpan(0,.75,.5),[-1,-0]);assert.deepEqual(E.moonSpan(0,.5,1),[-1,1]);
for(let h=0;h<24;h++){const l=C.lightAt(epoch+h*H);assert.equal(l.moon,l.moonAltitude>0&&l.moonFraction>.004)}
console.log('PASS: seasonal storms, persistent snow, multi-day thaw, sheltered accumulation, wet paving, continuous cloud cover, deterministic date travel and lunar phase geometry.');
