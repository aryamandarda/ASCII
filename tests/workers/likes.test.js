import { env, exports } from 'cloudflare:workers';
import { expect, test } from 'vitest';
const url='https://example.com/api/likes/nyc';
const get=(cookie)=>exports.default.fetch(url,{headers:cookie?{Cookie:cookie}:{}});
const vote=(cookie,liked,origin='https://example.com')=>exports.default.fetch(url,{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({liked})});
test('shared count, idempotent retries, independent visitors, unlike and cookie persistence',async()=>{
 const a=await get(),cookie=a.headers.get('set-cookie').split(';')[0],initial=(await a.json()).count;
 expect(a.headers.get('set-cookie')).toContain('HttpOnly');expect(a.headers.get('cache-control')).toBe('no-store');
 const results=await Promise.all(Array.from({length:12},()=>vote(cookie,true)));
 for(const r of results)expect(await r.json()).toEqual({count:initial+1,liked:true});
 expect(await (await get(cookie)).json()).toEqual({count:initial+1,liked:true});
 const b=await get(),cookieB=b.headers.get('set-cookie').split(';')[0];expect(await b.json()).toEqual({count:initial+1,liked:false});
 expect(await (await vote(cookieB,true)).json()).toEqual({count:initial+2,liked:true});
 expect(await (await vote(cookie,false)).json()).toEqual({count:initial+1,liked:false});
 expect(await (await vote(cookie,false)).json()).toEqual({count:initial+1,liked:false});
 await vote(cookieB,false);
 expect((await (await get(cookie)).json()).count).toBe(initial);
});
test('rejects cross-origin, missing cookies, invalid input and methods',async()=>{
 const r=await get(),cookie=r.headers.get('set-cookie').split(';')[0];
 expect((await vote(cookie,true,'https://elsewhere.com')).status).toBe(403);
 expect((await vote('',true)).status).toBe(409);
 expect((await vote(cookie,'yes')).status).toBe(400);
 expect((await exports.default.fetch(url,{method:'DELETE'})).status).toBe(405);
 expect((await exports.default.fetch(url,{method:'POST',headers:{Cookie:cookie,Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify({liked:true,junk:'x'.repeat(200)})})).status).toBe(400);
});
test('artworks have independent state and concurrent distinct likes are not lost',async()=>{
 const name=crypto.randomUUID(),object=env.ARTWORK_LIKES.getByName(name),ids=Array.from({length:20},()=>crypto.randomUUID());
 await Promise.all(ids.map(id=>object.setLike(id,true)));
 expect(await env.ARTWORK_LIKES.getByName(name).snapshot(ids[0])).toEqual({count:20,liked:true});
 expect(await env.ARTWORK_LIKES.getByName(name+'-other').snapshot(ids[0])).toEqual({count:0,liked:false});
 await Promise.all(ids.map(id=>object.setLike(id,false)));
 expect((await object.snapshot(ids[0])).count).toBe(0);
});
test('both entrypoints and artwork assets remain available',async()=>{
 for(const path of ['/','/artworks/nyc/']){const r=await exports.default.fetch('https://example.com'+path);expect(r.status).toBe(200);expect(await r.text()).toContain('id="likeCount"')}
 const js=await exports.default.fetch('https://example.com/artworks/nyc/likes.js');expect(js.status).toBe(200);expect(js.headers.get('content-type')).toContain('javascript');
});

 test('personal-site subpath preserves artwork URLs and keeps likes inside the route',async()=>{
 const base='https://example.com/ascii-art/nyc';
 const legacy=await exports.default.fetch('https://example.com/projects/ASCII/nyc/',{redirect:'manual'});
 expect(legacy.status).toBe(308);expect(legacy.headers.get('location')).toBe(base+'/');
 const redirect=await exports.default.fetch(base,{redirect:'manual'});
 expect(redirect.status).toBe(308);expect(redirect.headers.get('location')).toBe(base+'/');
 const page=await exports.default.fetch(base+'/');expect(page.status).toBe(200);
 expect(page.headers.get('X-Artwork-Version')).toBe(env.CF_VERSION_METADATA.id);
 expect(await page.text()).toContain('<base href="/ascii-art/nyc/">');
 const script=await exports.default.fetch(base+'/renderer.js');expect(script.status).toBe(200);
 expect(script.headers.get('content-type')).toContain('javascript');
 const gpu=await exports.default.fetch(base+'/character-gpu.js');expect(gpu.status).toBe(200);
 expect(await gpu.text()).toContain('root.CharacterGPU={create}');
 const state=await exports.default.fetch(base+'/api/likes');expect(state.status).toBe(200);
 expect((await state.json()).count).toBeGreaterThanOrEqual(0);
 });
