const assert=require('node:assert/strict');
const {columnsForView,size}=require('../dist/projects/ASCII/nyc/character-grid.js');
const E=require('../dist/projects/ASCII/nyc/environment.js');
for(const width of [320,390,430])assert.equal(columnsForView(width,844),390,'Preserve phone detail');
assert(columnsForView(1440,900)>columnsForView(390,844)*1.6,'Laptop gains meaningful detail');
assert(columnsForView(2048,1110)>=800);
assert(columnsForView(3000,400)<columnsForView(1440,900),'Use contained artwork dimensions, not window width alone');
assert(columnsForView(8000,5000)<=960,'Bound large-display cost');
for(let width=320; width<3000;width+=13){const n=columnsForView(width,1200);assert(n>=390&&n<=960);assert(Math.abs(size(n).rows*10/(n*6)-854/1280)<.003)}
const red={x:200,y:400,w:250,h:220,color:[255,15,30],power:1};
const blue={...red,color:[10,30,255]};
assert.deepEqual(E.groundLightAt(200,760,0,[red]),[0,0,0,0]);
assert.deepEqual(E.groundLightAt(200,500,1,[red]),[0,0,0,0]);
assert.deepEqual(E.groundLightAt(200,760,1,[]),[0,0,0,0]);
const r=E.groundLightAt(200,760,1,[red]),b=E.groundLightAt(200,760,1,[blue]);assert(r[0]>r[2]*5&&b[2]>b[0]*5);
const allWhite=Array.from({length:36},()=>({...red,color:[255,255,255]}));
let previous=0;
for(let y=600;y<=854;y++){
 const c=E.groundLightAt(200,y,1,allWhite);assert(c[3]<=.52,'Overlapping white screens cannot bleach the pavement');
 assert(Math.abs(c[3]-previous)<.016,'No hard polygon seams or reflection stripes');previous=c[3];
}
const B=require('../dist/projects/ASCII/nyc/billboard-model.js'),lamps=B.boards.map(b=>E.billboardLight(b[1],[170,130,150]));
for(const x of [100,400,640,900,1180])assert(E.groundLightAt(x,810,1,lamps)[3]>.20,'LED illumination must reach the full foreground plaza');
const emitter={power:1,position:[0,10,0],normal:[0,-1,0],area:16,radiance:[1,1,1]};
const near=E.irradianceAt([0,0,0],[emitter])[0],far=E.irradianceAt([0,-10,0],[emitter])[0];assert(far/near>.24&&far/near<.28,'Finite area approaches inverse-square falloff');
const skin=[190,140,100],unlit=E.materialColor(skin,{day:0,night:1}),lit=E.materialColor(skin,E.receiverLight({day:0,night:1},640,810,1,lamps));assert(lit.every((v,i)=>v>unlit[i]+15),'People receive the same billboard irradiance as the plaza');
assert(E.distantFacades.length>=6&&E.distantFacades.every(f=>f.strength>0&&f.strength<.5),'Background windows remain fainter than nearby ones');
const fs=require('node:fs'),source=fs.readFileSync('dist/projects/ASCII/nyc/environment.js','utf8');
assert(!source.includes('g.drawImage(stage'),'Do not stamp billboard image strips on dry paving');
console.log('PASS: adaptive display detail, preserved phone rendering, soft continuous pavement light and bounded overlapping illumination.');
