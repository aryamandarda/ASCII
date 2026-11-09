const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
global.SunCalc=require('../web/artworks/nyc/vendor/suncalc.js');
const C=require('../web/artworks/nyc/calendar.js'),E=require('../web/artworks/nyc/environment.js');
const pixels=execFileSync('ffmpeg',['-v','error','-i','web/artworks/nyc/times-square-empty-day.jpg','-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:8e6});
let visible=0;const phases=new Set();
for(let day=1;day<=30;day++)for(let h=0;h<24;h++){
 const l=C.lightAt(C.localEpoch(`2026-11-${String(day).padStart(2,'0')}`,h*60));
 if(!l.moon)continue;visible++;phases.add(Math.floor(l.moonPhase*8));
 // Test the whole lunar disc against the actual photograph, not just the
 // numerical position. Its path must stay clear of the skyline/building mask.
 for(let angle=0;angle<Math.PI*2;angle+=Math.PI/12){
  const x=Math.round(l.moonX+16*Math.cos(angle)),y=Math.round(l.moonY+16*Math.sin(angle)),k=(y*1280+x)*3,[r,g,b]=pixels.subarray(k,k+3);
  assert(r>80&&r<215&&g>135&&b>220&&g>r+18&&b>g+12,`Moon clipped by the building plate: day ${day}, hour ${h}, ${x},${y}`);
 }
}
assert(visible>200);assert.equal(phases.size,8);
function painted(l,visibility=1){let alpha,points=[];const g={save(){},restore(){},beginPath(){},closePath(){},fill(){},moveTo(x,y){points.push([x,y])},lineTo(x,y){points.push([x,y])},set globalAlpha(v){alpha=v}};E.paintMoon(g,l,visibility);return{alpha,points}}
const quarter=C.lightAt(C.localEpoch('2026-11-16',18*60)),full=C.lightAt(C.localEpoch('2026-11-24',0));
assert(quarter.moon&&full.moon);assert(quarter.moonFraction>.4&&quarter.moonFraction<.5);assert(full.moonFraction>.99);
assert(painted(quarter).points.length>50);assert(painted(full).alpha>.9);assert.equal(painted(full,0).alpha,0,'Overcast still hides the moon');
assert.equal(painted(C.lightAt(C.localEpoch('2026-11-08',22*60))).points.length,0,'Do not invent a visible moon near new moon and below the horizon');
console.log('PASS: eight lunar phases, visible path clear of actual buildings, moonset and opaque clouds');
