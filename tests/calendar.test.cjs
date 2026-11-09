const assert=require('node:assert/strict');
global.SunCalc=require('../web/artworks/nyc/vendor/suncalc.js');global.CityCalendar=require('../web/artworks/nyc/calendar.js');
const C=CityCalendar,L=require('../web/artworks/nyc/city-life.js');
// Independent published New York fixtures: timeanddate.com, Nov 7 2026.
const today=C.events('2026-11-07');assert(Math.abs(+today.sunrise-Date.parse('2026-11-07T11:33:00Z'))<60000);assert(Math.abs(+today.sunset-Date.parse('2026-11-07T21:45:00Z'))<60000);
assert(+C.events('2027-06-21').sunset-+C.events('2027-06-21').sunrise>15*3600000);
assert(+C.events('2026-12-21').sunset-+C.events('2026-12-21').sunrise<10*3600000);
for(const date of ['2026-11-07','2027-01-01','2027-06-21','2028-02-29'])for(const minute of [0,360,720,1439]){const p=C.parts(C.localEpoch(date,minute));assert.equal(p.date,date);assert(Math.abs(p.hour*60-minute)<.01)}
const end=C.localEpoch('2026-12-31',1438);assert.equal(C.parts(C.advance(end,5)).date,'2027-01-01');assert.equal(C.advance(C.advance(end,5,2),5,2,-1),end);
for(const speed of [.5,1,2,3,5])assert.equal(C.advance(end,5,speed)-end,5*60000*speed);
// DST is an actual New York calendar, not a fixed UTC offset.
assert.equal(C.parts(Date.parse('2027-03-14T06:59:00Z')).hour,1+59/60);assert.equal(C.parts(Date.parse('2027-03-14T07:00:00Z')).hour,3);
assert.equal(C.parts(Date.parse('2026-11-01T05:59:00Z')).hour,1+59/60);assert.equal(C.parts(Date.parse('2026-11-01T06:00:00Z')).hour,1);
assert.equal(C.lightAt(C.localEpoch('2026-11-07',720)).sun,true);const lunar=C.lightAt(C.localEpoch('2026-11-07',1380));assert.equal(lunar.moon,lunar.moonAltitude>0&&lunar.moonFraction>.004,'Do not force a moon into every night');
const t=C.localEpoch('2026-11-07',1080)/60000,before=L.peopleAt(t),again=L.peopleAt(t+.1);const index=new Map(again.map(p=>[p.id,p]));
for(const p of before.filter(p=>p.seat===undefined&&p.x>0&&p.x<1280)){assert(index.has(p.id),'Visible walkers cannot be removed by a lower arrival target');const q=index.get(p.id);const a=L.unproject([p.x,p.y]),b=L.unproject([q.x,q.y]);assert(Math.hypot(b[0]-a[0],b[1]-a[1])<=p.speed*.101,'Speed stays continuous in ground-plane meters')}
const fingerprint=people=>people.map(p=>[p.id,p.x,p.y,p.step]);L.peopleAt(t+400);assert.deepEqual(fingerprint(L.peopleAt(t)),fingerprint(before),'Rewinding reproduces the same people and cadence');
for(const p of before.filter(p=>p.route)){assert(p.duration<L.MAX_TRIP);assert(p.route.p.length>1)}
let busy=0,quiet=0;for(let i=0;i<60;i+=3){busy+=L.peopleAt(C.localEpoch('2026-11-07',1020+i)/60000).length;quiet+=L.peopleAt(C.localEpoch('2026-11-07',240+i)/60000).length}assert(busy>quiet*4,'Arrivals should follow the calibrated daily curve');
console.log('PASS: published sunrise/sunset, seasons, future dates, leap day, midnight, DST, exact clock speeds, reversal, continuous crowd journeys and variable arrivals.');
