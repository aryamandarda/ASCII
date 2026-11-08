const assert=require('node:assert/strict');
const R=require('../dist/projects/ASCII/nyc/pedestrian-rig.js');
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const kneeAngle=l=>180-Math.acos(Math.max(-1,Math.min(1,l.hip.map((v,i)=>v-l.knee[i]).reduce((s,v,i)=>s+v*(l.ankle[i]-l.knee[i]),0)/(R.body.thigh*R.body.shank))))*180/Math.PI;
let peak=0;
for(const height of [.93,1,1.07])for(const stride of [.98,1.18,1.25,1.35,1.41])for(const seated of [0,.25,.5,1])for(let phase=0;phase<Math.PI*2;phase+=.04){
 const r=R.pose({step:phase,height,stride,seated,heading:.8});
 for(const leg of r.legs){assert(Math.abs(distance(leg.hip,leg.knee)-R.body.thigh)<1e-8,'Thigh cannot stretch');assert(Math.abs(distance(leg.knee,leg.ankle)-R.body.shank)<1e-8,'Shin cannot stretch');assert(leg.knee[2]>=Math.min(leg.hip[2],leg.ankle[2]),'Knees bend forward');if(!seated&&height===1&&stride===1.35)peak=Math.max(peak,kneeAngle(leg))}
 for(const arm of r.arms){assert(Math.abs(distance(arm.shoulder,arm.elbow)-R.body.upperArm)<.001);assert(Math.abs(distance(arm.elbow,arm.wrist)-R.body.forearm)<1e-8)}
 assert.equal(r.head[0],r.shoulder[0]);assert(Math.abs((r.head[1]-r.shoulder[1])-(R.body.headCenter-R.body.shoulder))<1e-8,'Skull is attached to shoulders');
}
assert(peak>55&&peak<68,`Peak swing knee flexion: ${peak}`);
const visibleNeck=R.body.neckBottom-(R.body.headCenter+R.body.headRadius);assert(visibleNeck>0&&visibleNeck<.025,'Visible neck should be under 4.4 cm for a 1.75 m adult');
// Physical foot locking: adding root travel cancels relative stance displacement.
const stride=1.35,height=1.75;
for(let u=.13;u<.43;u+=.01){const a=R.footCycle(u*Math.PI*2,stride,height),b=R.footCycle((u+.005)*Math.PI*2,stride,height);assert(a.stance&&b.stance);assert(Math.abs((b.forward-a.forward)*height+.005*stride)<1e-10)}
for(const boundary of [0,.6,1]){const a=R.footCycle((boundary-1e-6)*Math.PI*2),b=R.footCycle((boundary+1e-6)*Math.PI*2);assert(Math.abs(a.forward-b.forward)<1e-5);assert(Math.abs(a.lift-b.lift)<1e-5,'No ankle pop at contact')}
for(let u=0;u<.6;u+=.005){const f=R.footCycle(u*Math.PI*2),ankle=R.body.ankle-f.lift,toe=ankle+.022+Math.sin(f.roll)*.10+.019,heel=ankle+.020-Math.sin(f.roll)*.04+.019;assert(Math.abs(Math.max(toe,heel))<.004,'Heel/sole/toe support must remain at ground level through stance')}
let stance=0;for(let i=0;i<1000;i++)stance+=R.footCycle((i+.5)/1000*Math.PI*2).stance;assert.equal(stance,600);
assert(Math.abs(R.turnTowards(Math.PI-.01,-Math.PI+.01,.1)-(Math.PI+.01))<1e-10,'Turn through angle wrap without a flip');
assert(Math.abs(R.turnTowards(0,Math.PI,.1))<=.160001,'Heading has a bounded angular speed');
const cadence=120*1.20/1.35;assert(cadence>100&&cadence<115);
console.log('PASS: fixed limb lengths, 60/40 gait timing, planted stance feet, continuous contact, realistic knee flexion, attached skull and bounded turning.');

// Closed shells must retain projected area at every bearing, especially profile.
const polygonArea=p=>Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1]},0))/2;
for(let yaw=0;yaw<Math.PI*2;yaw+=.025){
 assert(R.torsoMesh(false).reduce((sum,f)=>sum+polygonArea(f.points.map(p=>R.project(p,yaw))),0)>.035,'Torso must not disappear sideways');
 assert(R.neckMesh().reduce((sum,f)=>sum+polygonArea(f.points.map(p=>R.project(p,yaw))),0)>.0015,'Neck must have solid sides');
}

// Regression: the upper body must not ride the old ~6 cm pelvis excursion.
for(const stride of [.98,1.18,1.25]){
 const poses=Array.from({length:240},(_,i)=>R.pose({step:i/240*Math.PI*2,stride,height:1}));
 const range=key=>Math.max(...poses.map(p=>p[key][1]))-Math.min(...poses.map(p=>p[key][1]));
 assert(range('hip')*175<3.0,'Pelvis rise stays modest at supported strolling strides');
 assert(range('head')*175<.85,'Head stabilization keeps bounce below 8.5 mm');
 assert(poses.some(p=>Math.abs(p.shoulderYaw)>.04),'Shoulders rotate during stride');
 assert(poses.every(p=>p.shoulderYaw*p.pelvisYaw<=0),'Shoulders counterrotate against pelvis');
}
