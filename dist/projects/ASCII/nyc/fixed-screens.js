const el=id=>document.getElementById(id),canvas=el('art'),output=canvas.getContext('2d',{alpha:false});
const {boards,homography,map}=BillboardModel,{adAt,sceneAt,names}=AdDirector;
const world=document.createElement('canvas');world.width=1280;world.height=854;const ctx=world.getContext('2d',{alpha:false});
const sample=document.createElement('canvas'),sc=sample.getContext('2d',{willReadFrequently:true});
const lightSample=document.createElement('canvas');lightSample.width=lightSample.height=8;const lightContext=lightSample.getContext('2d',{willReadFrequently:true});
const {palette,ramp,code:cellCode,size,columnsForView}=CharacterGrid;
const atlas=document.createElement('canvas');atlas.width=palette.length*6;atlas.height=8*10;
const ag=atlas.getContext('2d');ag.font='bold 10px monospace';ag.textAlign='center';ag.textBaseline='middle';
palette.forEach(([r,g,b],ci)=>{const gain=Math.min(1.16,255/Math.max(1,r,g,b));for(let j=0;j<8;j++){ag.fillStyle=`rgb(${r*.82},${g*.82},${b*.82})`;ag.fillRect(ci*6,j*10,6,10);ag.fillStyle=`rgb(${r*gain},${g*gain},${b*gain})`;ag.fillText(ramp[j],ci*6+3,j*10+5)}});

const atlasPixels=new Uint32Array(ag.getImageData(0,0,atlas.width,atlas.height).data.buffer);
// People use character ink with dark negative space instead of solid cell fills.
const humanAtlas=document.createElement('canvas');humanAtlas.width=atlas.width;humanAtlas.height=atlas.height;
const hg=humanAtlas.getContext('2d');hg.font='bold 10px monospace';hg.textAlign='center';hg.textBaseline='middle';
palette.forEach(([r,g,b],ci)=>{for(let j=0;j<8;j++){hg.fillStyle=`rgb(${r*.18},${g*.18},${b*.18})`;hg.fillRect(ci*6,j*10,6,10);hg.fillStyle=`rgb(${Math.min(255,r*1.45+20)},${Math.min(255,g*1.45+20)},${Math.min(255,b*1.45+20)})`;hg.fillText(' .:+x%#@'[Math.max(2,j)],ci*6+3,j*10+5)}});
const humanPixels=new Uint32Array(hg.getImageData(0,0,humanAtlas.width,humanAtlas.height).data.buffer);
const humanMask=document.createElement('canvas');humanMask.width=1280;humanMask.height=854;const hm=humanMask.getContext('2d');
const maskSample=document.createElement('canvas'),ms=maskSample.getContext('2d',{willReadFrequently:true});
let outputPixels,outputWords;

let environment,ready=false,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,epoch=Date.now(),speed=1,direction=1,time=epoch/60000,last=0,lastPaint=0,cols=390,rows=156,previousCells,frameNumber=0,immersed=false;
const ambient=el('ambient').getContext('2d',{alpha:false});
const colors=['#d80a25','#66aee9','#ed1017','#9e9edb','#5cbec9','#b83c30','#405064','#183329','#239ab9','#bf754b'];
const definitions=[...MotionManifest,...['motown','chrysler','wicked','phantom','annie'].map(n=>({file:'poster-'+n+'.png'}))];
const ads=definitions.map((definition,i)=>{const media=new Image(),ad={...definition,media,color:colors[i],name:names[i],ready:false,w:0,h:0};media.onload=()=>{ad.ready=true;ad.w=ad.width||media.naturalWidth;ad.h=ad.height||media.naturalHeight;if(ready)draw()};media.onerror=()=>{ad.failed=true};media.src='media/'+definition.file;return ad});
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src})}
const screens=boards.map(([name,p],index)=>{const h=homography(p),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),aspect=Math.max(.2,Math.min(7,(dist(p[0],p[1])+dist(p[2],p[3]))/(dist(p[0],p[3])+dist(p[1],p[2]))));const stage=document.createElement('canvas');stage.width=240;stage.height=Math.round(240/aspect);const triangles=[],nx=1,ny=2;for(let j=0;j<ny;j++){const a=[0,j/ny],b=[1,j/ny],c=[0,(j+1)/ny],d=[1,(j+1)/ny];triangles.push([a,b,c],[b,d,c])}return {name,p,h,index,aspect,stage,g:stage.getContext('2d'),lastAd:-1,changed:-10,triangles:triangles.map(t=>({uv:t,dst:t.map(uv=>map(h,...uv))}))}});
function path(points,g=ctx){g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath()}
function project(screen,g=ctx){const img=screen.stage;for(const {uv,dst}of screen.triangles){const s=uv.map(p=>[p[0]*img.width,p[1]*img.height]);const [[x0,y0],[x1,y1],[x2,y2]]=s,[[a0,b0],[a1,b1],[a2,b2]]=dst,den=x0*(y1-y2)+x1*(y2-y0)+x2*(y0-y1);const a=(a0*(y1-y2)+a1*(y2-y0)+a2*(y0-y1))/den,b=(b0*(y1-y2)+b1*(y2-y0)+b2*(y0-y1))/den,c=(a0*(x2-x1)+a1*(x0-x2)+a2*(x1-x0))/den,d=(b0*(x2-x1)+b1*(x0-x2)+b2*(x1-x0))/den,e=(a0*(x1*y2-x2*y1)+a1*(x2*y0-x0*y2)+a2*(x0*y1-x1*y0))/den,f=(b0*(x1*y2-x2*y1)+b1*(x2*y0-x0*y2)+b2*(x0*y1-x1*y0))/den;
g.save();const center=[(a0+a1+a2)/3,(b0+b1+b2)/3];path(dst.map(p=>[p[0]+(p[0]-center[0])*.006,p[1]+(p[1]-center[1])*.006]),g);g.clip();g.transform(a,b,c,d,e,f);g.drawImage(img,0,0);g.restore()}}
function noise(n){const k=Math.sin(n*127.1+31.7)*43758.5453;return k-Math.floor(k)}
function screenAd(screen,ad,state,light){const {g,stage,index}=screen;if(screen.lastAd!==state.ad){screen.lastAd=state.ad;screen.changed=time}const cacheKey=state.ad+':'+Math.floor(time*6)+':'+Math.round(light.night*255);if(screen.cacheKey===cacheKey)return;screen.cacheKey=cacheKey;g.fillStyle=ad.color;g.fillRect(0,0,stage.width,stage.height);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';const fit=Math.max(stage.width/ad.w,stage.height/ad.h),w=ad.w*fit,h=ad.h*fit;const frame=ad.frames?((Math.floor(time*ad.fps)%ad.frames)+ad.frames)%ad.frames:0;
if(ad.frames){g.drawImage(ad.media,(frame%ad.columns)*ad.w,Math.floor(frame/ad.columns)*ad.h,ad.w,ad.h,Math.round((stage.width-w)/2),Math.round((stage.height-h)/2),Math.round(w),Math.round(h))}else g.drawImage(ad.media,Math.round((stage.width-w)/2),Math.round((stage.height-h)/2),Math.round(w),Math.round(h));

// Ribbon displays use a legible wordmark instead of shrinking a full poster
// into a band only one or two character rows tall.
if(screen.aspect>3){
  const label=['COCA-COLA','SPOTIFY','COCA-COLA','SPOTIFY','SPOTIFY','MOTOWN','CHRYSLER','WICKED','PHANTOM','ANNIE'][state.ad];
  g.fillStyle=ad.color;g.fillRect(0,0,stage.width,stage.height);g.fillStyle='#f3f7f5';
  g.font=`bold ${Math.round(stage.height*.65)}px monospace`;g.textAlign='center';g.textBaseline='middle';g.fillText(label,stage.width/2,stage.height*.52,stage.width*.94);
}
// A couple of coarse static ticks on ad changes, never a dissolve or a smooth wipe.
const change=adAt(index,time-1/6).ad!==state.ad||adAt(index,time+1/6).ad!==state.ad,tick=Math.floor(time*6);if(change||((tick+index*11)%97===0)){g.globalAlpha=change?.18:.075;g.fillStyle='#dce5d0';for(let n=0;n<(change?12:4);n++){const x=Math.floor(noise(n+tick*7+index)*stage.width/6)*6,y=Math.floor(noise(n+index*13+tick*3)*stage.height/8)*8;g.fillRect(x,y,6+Math.floor(noise(n+index)*3)*6,3)}g.globalAlpha=1}
// Brighten emitted light without changing screen geometry or washing out blacks.
g.globalCompositeOperation='screen';g.globalAlpha=CityEnvironment.billboardExposure(light);g.drawImage(stage,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
lightContext.drawImage(stage,0,0,8,8);const pixels=lightContext.getImageData(0,0,8,8).data,rgb=[0,0,0];
for(let i=0;i<pixels.length;i+=4)for(let c=0;c<3;c++)rgb[c]+=pixels[i+c]/64;
screen.light=CityEnvironment.billboardLight(screen.p,rgb);
}
function asciiPass(){
  sc.imageSmoothingEnabled=true;sc.imageSmoothingQuality='high';sc.drawImage(world,0,0,cols,rows);
  ms.clearRect(0,0,cols,rows);ms.drawImage(humanMask,0,0,cols,rows);const coverage=ms.getImageData(0,0,cols,rows).data;
  const d=sc.getImageData(0,0,cols,rows).data;let minRow=rows,maxRow=-1;
  // Copy glyph pixels into one reusable image instead of issuing up to 180,000
  // canvas draw calls per frame. Palette, glyphs and character sizes are identical.
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const index=y*cols+x,k=index*4,human=coverage[k+3]>180,n=cellCode(d[k],d[k+1],d[k+2],x,y)+(human?4096:0);if(previousCells[index]===n)continue;
    previousCells[index]=n;minRow=Math.min(minRow,y);maxRow=Math.max(maxRow,y);
    const ci=(n&4095)>>3,j=n&7,pixels=human?humanPixels:atlasPixels;
    for(let row=0;row<10;row++){
      const source=(j*10+row)*atlas.width+ci*6,target=(y*10+row)*canvas.width+x*6;
      outputWords[target]=pixels[source];outputWords[target+1]=pixels[source+1];outputWords[target+2]=pixels[source+2];
      outputWords[target+3]=pixels[source+3];outputWords[target+4]=pixels[source+4];outputWords[target+5]=pixels[source+5];
    }
  }
  if(maxRow>=minRow)output.putImageData(outputPixels,0,0,0,minRow*10,canvas.width,(maxRow-minRow+1)*10);
}

const dateFormat=new Intl.DateTimeFormat('en-US',{timeZone:CityCalendar.zone,month:'short',day:'numeric',year:'numeric'}),timeFormat=new Intl.DateTimeFormat('en-US',{timeZone:CityCalendar.zone,hour:'numeric',minute:'2-digit'});
function updateTime(){const p=CityCalendar.parts(epoch);el('dateValue').textContent=dateFormat.format(new Date(epoch));el('date').value=p.date;el('timeValue').textContent=timeFormat.format(new Date(epoch));el('time').value=p.hour*60;el('time').style.setProperty('--progress',`${p.hour/24*100}%`)}
let weatherMode='natural';
function draw(){if(!ready)return;const start=performance.now();time=epoch/60000;ctx.setTransform(1,0,0,1,0,0);const weather=CityWeather.simulate(epoch,weatherMode);ctx.drawImage(environment.render(epoch,weather),0,0);const tEnvironment=performance.now();
  const light=CityCalendar.lightAt(epoch),people=CityLife.peopleAt(time),cars=CityTraffic.carsAt(time);const tCrowd=performance.now();
  for(const screen of screens){const state=adAt(screen.index,time),ad=ads[state.ad];if(ad.ready)screenAd(screen,ad,state,light)}
  CityEnvironment.paintBillboardGlow(ctx,light,screens,false,environment.skyMask);
  for(const screen of screens){if(!screen.light)continue;ctx.save();path(screen.p);ctx.clip();project(screen);ctx.restore()}
  const tAds=performance.now();CityWeather.paintSurfaces(ctx,weather,light);CityEnvironment.paintBillboardGlow(ctx,light,screens,true,undefined,weather.wetness);CityEnvironment.paintWetScreens(ctx,light,screens,weather.wetness,project);for(const car of cars)CityTraffic.groundLights(ctx,car,light);
  const lamps=screens.map(s=>s.light).filter(Boolean),receiver=(p,h)=>CityEnvironment.receiverLight(light,p.x,p.y,h,lamps);
  const layers=[...cars.map(c=>({y:c.y,paint:(g=ctx)=>CityTraffic.paintCar(g,c,receiver(c,.8))})),...people.map(p=>({y:p.y,human:true,paint:(g=ctx)=>CityLife.paintWalker(g,p,receiver(p,1),weather)})),...CityLife.furnitureLayers(weather,light).map(layer=>({y:layer.y,paint:(g=ctx)=>layer.paint(g)}))].sort((a,b)=>a.y-b.y);
  hm.clearRect(0,0,1280,854);
  for(const layer of layers){layer.paint();hm.globalCompositeOperation=layer.human?'source-over':'destination-out';layer.paint(hm)}
  CityWeather.paintPrecipitation(ctx,weather,light,epoch);
  const tScene=performance.now();asciiPass();const tAscii=performance.now();canvas.dataset.renderStages=JSON.stringify({environment:tEnvironment-start,crowd:tCrowd-tEnvironment,ads:tAds-tCrowd,scene:tScene-tAds,ascii:tAscii-tScene});ambient.drawImage(canvas,0,0,120,80);updateTime();canvas.dataset.weatherMode=weatherMode;canvas.dataset.weather=weather.kind;canvas.dataset.snow=weather.groundSnow.toFixed(2);canvas.dataset.cloud=weather.cloud.toFixed(2);canvas.dataset.temperature=weather.temperature.toFixed(1);canvas.dataset.moonPhase=light.moonPhase.toFixed(3);canvas.dataset.renderMs=(performance.now()-start).toFixed(1);canvas.dataset.columns=cols;canvas.dataset.adAssignments=screens.map(s=>s.lastAd).join(',');canvas.dataset.frame=++frameNumber;canvas.dataset.simulationTime=time.toFixed(4);canvas.dataset.epoch=epoch.toFixed(0);canvas.dataset.date=light.date;canvas.dataset.people=people.length;canvas.dataset.vehicles=cars.length;canvas.dataset.vehicleDirections=cars.map(c=>c.lane).join(',');canvas.dataset.windows=environment.windowCount;canvas.dataset.distantWindows=environment.distantWindowCount;canvas.dataset.cloudMode=weather.cloud>.78?'overcast':weather.cloud>.37?'passing':'clear';canvas.dataset.hour=light.hour.toFixed(3);canvas.dataset.speed=speed;canvas.dataset.direction=direction;canvas.dataset.sunrise=new Date(light.sunrise).toISOString();canvas.dataset.sunset=new Date(light.sunset).toISOString();canvas.dataset.motionFrames=ads.slice(0,5).map(a=>Math.floor(time*a.fps)%a.frames).join(',');canvas.dataset.skyPixels=environment.skyPixels;
}
function resizeGrid(){
  const view=el('surface'),next=columnsForView(view.clientWidth,view.clientHeight,typeof SceneView!=='undefined'?SceneView.mode():'contain');
  if(previousCells&&next===cols)return;
  cols=next;rows=size(cols).rows;canvas.width=cols*6;canvas.height=rows*10;sample.width=cols;sample.height=rows;maskSample.width=cols;maskSample.height=rows;previousCells=new Uint16Array(cols*rows);previousCells.fill(65535);outputPixels=output.createImageData(canvas.width,canvas.height);outputWords=new Uint32Array(outputPixels.data.buffer);draw()}

let resizeTimer;
const gridObserver=new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(ready)resizeGrid()},100)});
gridObserver.observe(el('surface'));
let controlsHidden=false;
function showControls(show){
  controlsHidden=!show;el('likeWidget').hidden=!show;el('controls').hidden=!show;el('leave').hidden=!show;
  el('controlsToggle').setAttribute('aria-expanded',String(show));
  el('controlsToggle').setAttribute('aria-label',show?'Hide controls':'Show controls');
  el('controlsToggle').title=show?'Hide controls (H)':'Show controls (H)';
  el('controlsToggle').textContent=show?'Hide controls':'Show controls';
  if(!show){closeWeather();el('skyOptions').hidden=true;el('sky').setAttribute('aria-expanded','false');el('controlsToggle').focus({preventScroll:true})}
}
el('controlsToggle').onclick=()=>showControls(controlsHidden);

function controls(){el('play').setAttribute('aria-label',playing?'Pause animation':'Play animation');el('play').title=playing?'Pause animation':'Play animation';el('pauseIcon').hidden=!playing;el('playIcon').hidden=playing;el('reverse').setAttribute('aria-pressed',direction<0);document.querySelectorAll('[data-speed]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.speed===speed))}
el('play').onclick=()=>{playing=!playing;last=0;controls();draw()};
el('reverse').onclick=()=>{direction*=-1;controls();draw()};
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=+b.dataset.speed;controls();draw()});
el('time').oninput=()=>{epoch=CityCalendar.localEpoch(CityCalendar.parts(epoch).date,+el('time').value);draw()};
function closeWeather(){el('weatherOptions').hidden=true;el('weather').setAttribute('aria-expanded','false')}
el('weather').onclick=()=>{const open=el('weatherOptions').hidden;el('skyOptions').hidden=true;el('sky').setAttribute('aria-expanded','false');el('weatherOptions').hidden=!open;el('weather').setAttribute('aria-expanded',String(open))};
document.querySelectorAll('[data-weather]').forEach(b=>b.onclick=()=>{weatherMode=b.dataset.weather;document.querySelectorAll('[data-weather]').forEach(option=>option.setAttribute('aria-pressed',String(option.dataset.weather===weatherMode)));el('weather').title='Weather: '+b.textContent;closeWeather();el('weather').focus({preventScroll:true});draw()});
el('date').onchange=()=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(el('date').value))return;epoch=CityCalendar.localEpoch(el('date').value,Math.floor(CityCalendar.parts(epoch).hour*60));draw()};
function enter(){immersed=true;el('controlsToggle').hidden=false;showControls(true);el('immerse').setAttribute('tabindex','-1');el('immerse').setAttribute('aria-hidden','true');requestAnimationFrame(()=>{document.body.classList.add('immersed');if(typeof SceneView!=='undefined')resizeGrid()});el('leave').focus({preventScroll:true});if(typeof SceneView!=='undefined'){SceneView.enter(resizeGrid,showControls);return}const request=document.documentElement.requestFullscreen;if(request&&!document.fullscreenElement){const p=request.call(document.documentElement);if(p&&p.catch)p.catch(()=>{})}}
function leave(){immersed=false;if(typeof SceneView!=='undefined')SceneView.leave();el('likeWidget').hidden=false;el('controlsToggle').hidden=true;document.body.classList.remove('immersed');el('controls').hidden=true;el('leave').hidden=true;el('immerse').removeAttribute('tabindex');el('immerse').removeAttribute('aria-hidden');el('immerse').focus({preventScroll:true});if(document.fullscreenElement||document.webkitFullscreenElement){const exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit)try{Promise.resolve(exit.call(document)).catch(()=>{})}catch{}} }
el('immerse').onclick=enter;el('leave').onclick=leave;
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&immersed)leave();if(event.key.toLowerCase()==='h'&&immersed&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.activeElement.isContentEditable){event.preventDefault();showControls(controlsHidden)}if(event.code==='Space'&&immersed&&!['INPUT','BUTTON','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();el('play').click()}});
document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden)draw()});
function loop(now){if(!last)last=now;const dt=Math.min(1,(now-last)/1000);last=now;if(playing&&!document.hidden){epoch=CityCalendar.advance(epoch,dt,speed,direction);if(now-lastPaint>=1000/24){draw();lastPaint=now}}requestAnimationFrame(loop)}
Promise.all([loadImage('times-square-empty-day.jpg'),loadImage('times-square-road-clean.png')]).then(([day,road])=>{environment=CityEnvironment.create(day,road);ready=true;resizeGrid();el('loading').hidden=true;el('immerse').disabled=false;requestAnimationFrame(loop)}).catch(()=>{el('loading').textContent='Please refresh';el('loading').style.width='auto'});
function chooseSky(id){CityEnvironment.setPalette(id);document.querySelectorAll('[data-sky]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sky===id));canvas.dataset.skyPalette=id;try{localStorage.setItem('times-square-sky',id)}catch{}draw()}
el('sky').onclick=()=>{closeWeather();const open=el('skyOptions').hidden;el('skyOptions').hidden=!open;el('sky').setAttribute('aria-expanded',open)};
document.querySelectorAll('[data-sky]').forEach(b=>b.onclick=()=>{chooseSky(b.dataset.sky);el('skyOptions').hidden=true;el('sky').setAttribute('aria-expanded',false)});
try{const saved=localStorage.getItem('times-square-sky');if(CityEnvironment.palettes[saved])chooseSky(saved)}catch{}
controls();updateTime();
