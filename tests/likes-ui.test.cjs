const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(fetch){
 const els=Object.fromEntries(['like','likeCount'].map(k=>[k,{textContent:'',attributes:{},setAttribute(k,v){this.attributes[k]=v},removeAttribute(k){delete this.attributes[k]}}]));
 vm.runInNewContext(fs.readFileSync('dist/projects/ASCII/nyc/likes.js','utf8'),{document:{getElementById:k=>els[k],addEventListener(){}},fetch,AbortSignal,Intl,Date});return els;
}
const tick=()=>new Promise(r=>setImmediate(r));
test('network failure never invents a count; retry recovers',async()=>{let failed=true;const els=setup(async()=>{if(failed)throw Error();return {ok:true,json:async()=>({count:7,liked:false})}});await tick();assert.equal(els.likeCount.textContent,'');assert.equal(els.like.disabled,false);failed=false;await els.like.onclick();assert.equal(els.likeCount.textContent,'7')});
test('rapid repeated taps send one vote and failed writes retain confirmed state',async()=>{
 let resolve,posts=0;const els=setup(async(url,options)=>{if(options.method==='POST'){posts++;return new Promise(r=>resolve=r)}return{ok:true,json:async()=>({count:3,liked:false})}});await tick();
 const first=els.like.onclick();await els.like.onclick();assert.equal(posts,1);assert.equal(els.like.disabled,false);assert.equal(els.like.attributes['aria-busy'],undefined);resolve({ok:true,json:async()=>({count:4,liked:true})});await first;assert.equal(els.likeCount.textContent,'4');assert.equal(els.like.attributes['aria-pressed'],'true');
 const second=els.like.onclick();resolve({ok:false});await second;assert.equal(els.likeCount.textContent,'4');assert.equal(els.like.attributes['aria-pressed'],'true');assert.equal(els.like.disabled,false);
});
