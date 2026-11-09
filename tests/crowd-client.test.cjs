const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
let instance,painted=0,mainCalls=0;
class Worker {constructor(url){assert.equal(url.pathname,'/artworks/nyc/crowd-worker.js');instance=this;this.sent=[]}postMessage(data){this.sent.push(data)}terminate(){this.terminated=true}}
const root={Worker,CityLife:{project:([x,z])=>({x:640+800*x/z,y:600+1440/z,h:1400/z}),peopleAt(){mainCalls++;return[]}}};
vm.runInNewContext(fs.readFileSync('web/artworks/nyc/crowd-client.js','utf8'),{window:root,document:{baseURI:'https://example.test/artworks/nyc/'},URL});
const c=root.CityCrowd.create(()=>painted++),person={id:1,ground:[0,20],vx:1,vz:0,step:0,stride:1.2};
assert.equal(c.isReady(10),false);assert.equal(c.mode(),'worker');assert.equal(c.peopleAt(10).length,0);c.peopleAt(10.2);assert.equal(instance.sent.length,1,'Only one expensive simulation request is in flight');assert.equal(mainCalls,0);
instance.onmessage({data:{time:10,people:[person]}});assert.equal(instance.sent.length,2);assert.equal(c.isReady(10.3),true);const p=c.peopleAt(10.3)[0];assert(Math.abs(p.x-652)<1e-6);assert(p.step>0);
assert.equal(c.peopleAt(1000).length,0,'Date jumps never display the crowd from the previous time');
instance.onmessage({data:{time:10.2,people:[person]}});assert.equal(instance.sent.at(-1).time,1000,'Skip intermediate scrubs and compute the latest requested time');
instance.onmessage({data:{time:1000,people:[person]}});assert.equal(c.peopleAt(1000).length,1);assert.equal(mainCalls,0);assert(painted>=2);
assert.equal(c.isReady(2000),false,'A pending date jump cannot reveal an incomplete scene');c.peopleAt(2000);instance.onmessage({data:{time:2000,people:[]}});assert.equal(c.isReady(2000),true,'A completed empty crowd is valid, not a loading signal');
instance.onerror();assert.equal(c.isReady(2001),true);assert.equal(c.mode(),'fallback');c.peopleAt(1001);assert.equal(mainCalls,1,'Unsupported workers retain a functional fallback');
console.log('PASS: off-thread crowd, bounded requests, stable interpolation, time seeking and fallback');
