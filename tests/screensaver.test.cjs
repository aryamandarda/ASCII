const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('offline screensaver shares the renderer at natural 1x without network clients or controls',()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'times-square-saver-'));
 try{
  execFileSync('python3',['macos/prepare.py',out]);
  const html=fs.readFileSync(path.join(out,'index.html'),'utf8'),renderer=fs.readFileSync(path.join(out,'fixed-screens.js'),'utf8');
  assert(html.includes('<base href="./">'));assert(html.includes('class="screensaver immersed"'));
  assert(!html.includes('src="likes.js"'));assert(!html.includes('src="scene-view.js"'));assert(!html.includes('/projects/ASCII/nyc/'));
  for(const [,asset] of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(asset!== './')assert(fs.existsSync(path.join(out,asset)),asset);
  assert(renderer.includes('playing=true'));assert(renderer.includes('speed=1,direction=1'));assert(renderer.includes("weatherMode='natural'"));assert(renderer.includes('CityCalendar.advance(epoch,dt,speed,direction)'));
  const worker=fs.readFileSync(path.join(out,'offline-worker.js'),'utf8');assert(!worker.includes('importScripts('));assert(worker.includes('CityLife.peopleAt'));
  assert(fs.existsSync(path.join(out,'vendor/SUNCALC-LICENSE')));
 }finally{fs.rmSync(out,{recursive:true,force:true})}
});
