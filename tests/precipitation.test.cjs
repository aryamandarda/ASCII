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
