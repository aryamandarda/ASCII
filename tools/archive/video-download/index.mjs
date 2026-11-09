export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path!=='/Times-Square-Showcase.mp4'||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});
 const body=request.method==='HEAD'?null:await env.VIDEO.get('showcase',{type:'stream'});
 if(request.method==='GET'&&!body)return new Response('Not ready',{status:503,headers:{'cache-control':'no-store'}});
 return new Response(body,{headers:{'Content-Type':'video/mp4','Content-Disposition':'attachment; filename="Times-Square-Showcase.mp4"','Content-Length':'24477758','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff','Accept-Ranges':'none'}});
}};