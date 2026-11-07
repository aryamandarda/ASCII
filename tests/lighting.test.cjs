const assert=require('node:assert/strict'),fs=require('node:fs');
global.SunCalc=require('../dist/projects/ASCII/nyc/vendor/suncalc.js');const C=global.CityCalendar=require('../dist/projects/ASCII/nyc/calendar.js');
const {skyColor,sunColor,surfaceColor}=require('../dist/projects/ASCII/nyc/environment.js'),{palette,cell}=require('../dist/projects/ASCII/nyc/character-grid.js');
const light=h=>C.lightAt(C.localEpoch('2026-11-07',h*60));
for(const hour of [10,12,14])for(let row=0;row<=20;row++){
 const input=skyColor(light(hour),row/20),sum=[0,0,0];for(let y=0;y<4;y++)for(let x=0;x<4;x++)palette[cell(...input,x,y).color].forEach((v,i)=>sum[i]+=v/16);
 assert(sum[2]>sum[1]+15&&sum[1]>sum[0]+15,`Sky remains blue after quantization: ${sum}`);
}
for(const hour of [6.6,8,12,16.7]){const rgb=sunColor(light(hour)),average=[0,0,0];for(let y=0;y<4;y++)for(let x=0;x<4;x++)palette[cell(...rgb,x,y).color].forEach((v,i)=>average[i]+=v/16);assert(average[0]>240&&average[1]>145&&average[2]<45)}
for(let c=0;c<256;c+=17)for(let y=0;y<4;y++)for(let x=0;x<4;x++){const rgb=palette[cell(c,c,c,x,y).color];assert.equal(rgb[0],rgb[1]);assert.equal(rgb[1],rgb[2])}
assert.deepEqual(surfaceColor([43,127,211],light(12)),[43,127,211]);assert.notDeepEqual(skyColor(light(6.5),1),skyColor(light(16.8),1));
for(let h=0;h<24;h+=1/360){const a=skyColor(light(h),.7),b=skyColor(light(h+1/360),.7);assert(Math.max(...a.map((v,i)=>Math.abs(v-b[i])))<3,'No lighting threshold jumps')}
assert(!fs.readFileSync('dist/projects/ASCII/nyc/fixed-screens.js','utf8').includes('times-square-empty-night.jpg'));
console.log('PASS: blue daytime sky, yellow sun, distinct dawn/dusk, continuous light, neutral grays and fixed geometric plate.');
