const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('offline screensaver shares the renderer at natural 1x without network clients or controls',()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'times-square-saver-'));
 try{
  execFileSync('python3',['macos/prepare.py',out]);
  const html=fs.readFileSync(path.join(out,'index.html'),'utf8'),renderer=fs.readFileSync(path.join(out,'fixed-screens.js'),'utf8');
  assert(html.includes('<base href="./">'));assert(html.includes('class="screensaver immersed"'));
  assert(!html.includes('src="likes.js"'));assert(!html.includes('src="scene-view.js"'));assert(!html.includes('/projects/ASCII/nyc/'));
  for(const [,asset] of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(asset!== './')assert(fs.existsSync(path.join(out,asset)),asset);
  assert(renderer.includes('window.ASCII_IMAGES[src]'));assert(fs.readFileSync(path.join(out,'offline-images.js'),'utf8').includes('data:image/jpeg;base64,'));
  assert(renderer.includes('playing=true'));assert(renderer.includes('speed=1,direction=1'));assert(renderer.includes("weatherMode='natural'"));assert(renderer.includes('CityCalendar.advance(epoch,dt,speed,direction)'));
  assert(!renderer.includes('requestAnimationFrame(loop)'), 'Native host must own the animation clock');
  const context={window:{},document:{hidden:true,createElement:()=>({getContext:()=>({drawImage(){}}),toDataURL:()=> 'data:image/jpeg;base64,test'})},ready:true,canvas:{dataset:{}},epoch:100000,last:0,frameNumber:0,draw(){context.frameNumber++},CityCalendar:{advance:(epoch,seconds,speed,direction)=>epoch+seconds*60000*speed*direction}};
  require('node:vm').runInNewContext(renderer.slice(renderer.indexOf('const nativeCapture=')),context);
  const first=context.window.ASCII_NATIVE_FRAME(1000,960,640),next=context.window.ASCII_NATIVE_FRAME(1500,960,640);
  assert.equal(next.epoch-first.epoch,30000,'Hidden WebKit pages still advance at 1x');assert(next.frame>first.frame);assert(next.image.startsWith('data:image/jpeg'));
  const worker=fs.readFileSync(path.join(out,'offline-worker.js'),'utf8');assert(!worker.includes('importScripts('));assert(worker.includes('CityLife.peopleAt'));
  assert(fs.existsSync(path.join(out,'vendor/SUNCALC-LICENSE')));
 }finally{fs.rmSync(out,{recursive:true,force:true})}
});
