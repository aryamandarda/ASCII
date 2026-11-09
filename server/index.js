import { DurableObject } from 'cloudflare:workers';

// One coordination object per artwork. Only anonymous browser IDs are stored.
export class ArtworkLikes extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS likes (visitor TEXT PRIMARY KEY)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS totals (id INTEGER PRIMARY KEY CHECK(id=1), count INTEGER NOT NULL CHECK(count>=0))');
    ctx.storage.sql.exec('INSERT OR IGNORE INTO totals VALUES (1,0)');
  }
  snapshot(visitor) {
    return {
      count: this.ctx.storage.sql.exec('SELECT count FROM totals WHERE id=1').one().count,
      liked: visitor ? this.ctx.storage.sql.exec('SELECT 1 FROM likes WHERE visitor=?', visitor).toArray().length > 0 : false
    };
  }
  setLike(visitor, liked) {
    return this.ctx.storage.transactionSync(() => {
      const before = this.snapshot(visitor);
      if (before.liked !== liked) {
        if (liked) this.ctx.storage.sql.exec('INSERT INTO likes (visitor) VALUES (?)', visitor);
        else this.ctx.storage.sql.exec('DELETE FROM likes WHERE visitor=?', visitor);
        this.ctx.storage.sql.exec('UPDATE totals SET count=count+? WHERE id=1', liked ? 1 : -1);
      }
      return this.snapshot(visitor);
    });
  }
}
const cookieName = 'ascii_visitor';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (data, status=200, extra={}) => Response.json(data, {status, headers:{'Cache-Control':'no-store', ...extra}});
async function readVote(request) {
  const reader=request.body?.getReader();
  if(!reader)throw new Error('Missing body');
  const chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>128){await reader.cancel();throw new Error('Body too large')}chunks.push(value)}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
  const body=JSON.parse(new TextDecoder().decode(bytes));
  if(typeof body?.liked!=='boolean')throw new Error('Invalid vote');
  return body.liked;
}
export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    const artworkPrefix = '/ascii-art/nyc';
    const artworkAPI = artworkPrefix + '/api/likes';
    const legacyPrefix = '/projects/ASCII/nyc/';
    if(url.pathname.startsWith(legacyPrefix)){
      url.pathname=artworkPrefix+'/'+url.pathname.slice(legacyPrefix.length);
      return Response.redirect(url.toString(),308);
    }
    if (url.pathname === artworkPrefix) {
      url.pathname += '/';
      return Response.redirect(url.toString(), 308);
    }
    if (url.pathname.startsWith(artworkPrefix + '/') && url.pathname !== artworkAPI) {
      const assetURL = new URL(url);
      assetURL.pathname = '/artworks/nyc/' + url.pathname.slice(artworkPrefix.length + 1);
      const response = await env.ASSETS.fetch(new Request(assetURL, request));
      if (response.headers.get('Content-Type')?.includes('text/html')) {
        return new HTMLRewriter().on('base', {
          element(element) { element.setAttribute('href', artworkPrefix + '/'); }
        }).transform(response);
      }
      return response;
    }
    if(url.pathname!=='/api/likes/nyc' && url.pathname!==artworkAPI) {
      if(url.pathname.startsWith('/api/'))return json({error:'Not found'},404);
      return env.ASSETS.fetch(request);
    }
    if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405,{'Allow':'GET, POST'});
    const raw=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
    const visitor=raw&&uuid.test(raw)?raw:null;
    if(request.method==='POST') {
      if(request.headers.get('Origin')!==url.origin)return json({error:'Same-origin request required'},403);
      if(!visitor)return json({error:'Enable cookies to like this artwork'},409);
      if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'JSON required'},415);
      let liked;try{liked=await readVote(request)}catch{return json({error:'Invalid vote'},400)}
      try{return json(await env.ARTWORK_LIKES.getByName('nyc').setLike(visitor,liked))}
      catch{console.error(JSON.stringify({event:'likes_write_failed'}));return json({error:'Likes temporarily unavailable'},503)}
    }
    const id=visitor||crypto.randomUUID();
    try {
      const state=await env.ARTWORK_LIKES.getByName('nyc').snapshot(id);
      return json(state,200,visitor?{}:{'Set-Cookie':`${cookieName}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${url.protocol==='https:'?'; Secure':''}`});
    } catch {console.error(JSON.stringify({event:'likes_read_failed'}));return json({error:'Likes temporarily unavailable'},503)}
  }
};
