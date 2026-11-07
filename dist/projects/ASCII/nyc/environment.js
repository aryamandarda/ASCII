(function(root){
  const W=1280,H=854,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function mix(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t)}
  const palettes={
    gold:{name:'Gold',dawn:[[106,130,202],[255,190,133],[255,225,137]],dusk:[[94,103,180],[250,153,79],[255,203,86]]},
    coral:{name:'Coral',dawn:[[121,135,215],[255,162,176],[255,217,143]],dusk:[[100,88,181],[255,100,121],[255,177,68]]},
    rose:{name:'Rose',dawn:[[141,147,225],[255,166,207],[255,215,169]],dusk:[[113,80,175],[245,112,177],[255,165,114]]},
    violet:{name:'Violet',dawn:[[133,142,224],[214,156,230],[255,205,164]],dusk:[[86,64,159],[181,103,205],[253,151,132]]}
  };
  let paletteId='coral';
  function setPalette(id){if(palettes[id])paletteId=id;return paletteId}
  function skyColor(light,height,id=paletteId){
    const l=light,v=clamp(height,0,1),top=mix([6,11,25],[55,151,232],l.day),bottom=mix([23,29,51],[156,209,246],l.day),blue=mix(top,bottom,v**1.15);
    const colors=palettes[id][l.morning?'dawn':'dusk'],warm=v<.55?mix(colors[0],colors[1],v/.55):mix(colors[1],colors[2],(v-.55)/.45);
    // Broad atmospheric color, with a luminous horizon and a distinct afterglow above it.
    return mix(blue,warm,l.warm*(.40+.58*v**.75)).map(Math.round);
  }
  function sunColor(light){const w=light.warm;return[255,Math.round(215-w*48),28]}
  function srgbToLinear(v){v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}
  function linearToSrgb(v){return Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055))}
  function surfaceColor(rgb,light){const l=light,exposure=.32+.68*l.day,tint=[.88+.12*l.day,.94+.06*l.day,1];return rgb.map((v,i)=>linearToSrgb(srgbToLinear(v)*exposure*tint[i]))}
  const billboardExposure=light=>.85*light.night;
  function billboardLight(points,rgb){
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);
    const peak=Math.max(...rgb,1),luminance=(rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)/255;
    return{x:xs.reduce((a,b)=>a+b)/4,y:ys.reduce((a,b)=>a+b)/4,w,h,
      color:rgb.map(v=>Math.round(v/peak*255)),power:Math.min(1,Math.sqrt(w*h)/150)*Math.sqrt(luminance)};
  }
  // Dry paving receives diffuse color, not readable, striped copies of ads.
  // Normalize overlapping sources and cap opacity so white campaigns cannot
  // bleach the ground. Fade in over the pavement rather than clipping a polygon.
  function groundLightAt(x,y,night,lamps){
    const edge=648+Math.abs(x-640)*.065,t=clamp((y-edge)/90,0,1),fade=t*t*(3-2*t);
    if(!night||!fade)return[0,0,0,0];
    let weight=0,r=0,g=0,b=0;
    for(const lamp of lamps){
      const dx=(x-lamp.x)/(110+lamp.w*.7),dy=(y-(715+Math.abs(lamp.x-640)*.10))/(140+lamp.h*.2);
      const w=lamp.power*.8*Math.exp(-2*(dx*dx+dy*dy));
      weight+=w;r+=lamp.color[0]*w;g+=lamp.color[1]*w;b+=lamp.color[2]*w;
    }
    return weight?[r/weight,g/weight,b/weight,.26*night*fade*(1-Math.exp(-weight))]:[0,0,0,0];
  }
  let groundCanvas,groundContext,groundPixels;
  function paintBillboardGlow(g,l,screens,ground=false){
    if(l.night<=0)return;
    const lamps=screens.map(s=>s.light).filter(lamp=>lamp&&lamp.power>.01);
    g.save();g.globalCompositeOperation='screen';
    if(ground){
      if(!groundCanvas){groundCanvas=document.createElement('canvas');groundCanvas.width=128;groundCanvas.height=86;groundContext=groundCanvas.getContext('2d');groundPixels=groundContext.createImageData(128,86)}
      const data=groundPixels.data;
      for(let y=0;y<86;y++)for(let x=0;x<128;x++){
        const c=groundLightAt((x+.5)*W/128,(y+.5)*H/86,l.night,lamps),i=(y*128+x)*4;
        data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];data[i+3]=Math.round(c[3]*255);
      }
      groundContext.putImageData(groundPixels,0,0);g.imageSmoothingEnabled=true;g.drawImage(groundCanvas,0,0,W,H);
    }else for(const lamp of lamps){
      const x=lamp.x,y=lamp.y,rx=40+lamp.w*.75,ry=35+lamp.h*.75,strength=l.night*lamp.power*.32,c=lamp.color.join(',');
      g.save();g.translate(x,y);g.scale(rx,ry);const halo=g.createRadialGradient(0,0,0,0,0,1);
      halo.addColorStop(0,`rgba(${c},${strength})`);halo.addColorStop(.35,`rgba(${c},${strength*.65})`);halo.addColorStop(1,`rgba(${c},0)`);
      g.fillStyle=halo;g.fillRect(-1,-1,2,2);g.restore();
    }g.restore();
  }
  const rand=n=>{const k=Math.sin(n*32.17)*43758.5;return k-Math.floor(k)};
  function windowState(id,epoch,l){
    const date=l.hour<12?CityCalendar.shiftDate(l.date,-1):l.date,e=CityCalendar.events(date),next=CityCalendar.events(CityCalendar.shiftDate(date,1)),night=Math.floor(+e.sunset/86400000),seed=id*31+night*7;
    const on=+e.sunset+(-65+rand(seed+1)*115)*60000,off=+next.sunrise+(-65+rand(seed+2)*80)*60000;
    if(rand(id+5)<.07)return 0;
    let end=off;if(rand(id+14)<.24)end=Math.min(end,CityCalendar.localEpoch(CityCalendar.shiftDate(date,1),rand(seed+4)*130));
    return clamp((epoch-on)/90000,0,1)*clamp((end-epoch)/120000,0,1);
  }
  function windowColor(id){
    const tones=[[232,240,246],[220,234,248],[244,245,239],[211,230,242],[250,239,219]];
    return tones[Math.floor(rand(id+77)*tones.length)];
  }
  function extractWindows(source){
    const areas=[
      [[320,107],[394,97],[349,321],[263,325]],
      [[1004,0],[1279,0],[1279,151],[1111,218]],
      [[510,380],[560,374],[563,520],[503,522]],
      [[756,363],[814,360],[817,432],[755,445]],
      [[145,0],[360,0],[253,217],[146,135]],
      [[419,109],[470,156],[424,420],[359,441]],
      [[499,311],[526,348],[510,525],[485,532]],
      [[873,0],[972,0],[1054,144],[993,220]],
      [[856,448],[911,446],[949,581],[847,594]],
      [[809,401],[845,388],[874,570],[823,580]],
      [[413,481],[440,490],[467,603],[421,604]]
    ];
    const data=source.data,allowed=new Uint8Array(W*H),seen=new Uint8Array(W*H),windows=[];
    for(let y=0;y<604;y++)for(let x=100;x<W;x++){const i=y*W+x,k=i*4;if(data[k]+data[k+1]+data[k+2]>450||data[k+2]<data[k]-12)continue;if(areas.some(p=>BillboardModel.inside(p,x,y))&&!BillboardModel.boards.some(b=>BillboardModel.inside(b[1],x,y)))allowed[i]=1}
    for(let i=0;i<allowed.length;i++){if(!allowed[i]||seen[i])continue;const q=[i];seen[i]=1;let minX=W,maxX=0,minY=H,maxY=0;for(let n=0;n<q.length;n++){const j=q[n],x=j%W,y=Math.floor(j/W);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const k of [j-1,j+1,j-W,j+W])if(k>=0&&k<allowed.length&&allowed[k]&&!seen[k]){seen[k]=1;q.push(k)}}
      const w=maxX-minX+1,h=maxY-minY+1;if(q.length<8||q.length>2400||w<2||w>60||h<3||h>75)continue;
      const tile=document.createElement('canvas');tile.width=w;tile.height=h;const c=tile.getContext('2d'),img=c.createImageData(w,h),color=windowColor(i);for(const k of q){const x=k%W-minX,y=Math.floor(k/W)-minY,j=(y*w+x)*4;img.data[j]=color[0];img.data[j+1]=color[1];img.data[j+2]=color[2];img.data[j+3]=235}c.putImageData(img,0,0);windows.push({id:i,x:minX,y:minY,tile,color});
    }return windows;
  }
  function nightLights(g,l,epoch,windows){
    for(const w of windows){const on=windowState(w.id,epoch,l)*l.night;if(on<.01)continue;g.globalAlpha=on*.87;g.shadowColor=`rgb(${w.color.join(',')})`;g.shadowBlur=4;g.drawImage(w.tile,w.x,w.y)}g.shadowBlur=0;g.globalAlpha=1;
  }
  function makeCanvas(){const c=document.createElement('canvas');c.width=W;c.height=H;return c}
  function create(day,roadPlate){
    const canvas=makeCanvas(),g=canvas.getContext('2d'),sky=makeCanvas(),s=sky.getContext('2d'),mask=makeCanvas(),m=mask.getContext('2d',{willReadFrequently:true});
    // One immutable geometric plate. Lighting changes pixels, never object positions.
    m.drawImage(day,0,0,W,H);if(roadPlate){m.save();m.beginPath();[[746,619],[1110,620],[1280,650],[1280,763],[745,652]].forEach((p,i)=>i?m.lineTo(...p):m.moveTo(...p));m.closePath();m.clip();m.drawImage(roadPlate,0,0,W,H);m.restore()}const source=m.getImageData(0,0,W,H),a=source.data,seen=new Uint8Array(W*H),queue=new Int32Array(W*H);let head=0,tail=1;queue[0]=640;seen[640]=1;
    const blue=k=>{let i=k*4;return k<W*620&&a[i]>80&&a[i]<215&&a[i+1]>135&&a[i+2]>220&&a[i+1]>a[i]+18&&a[i+2]>a[i+1]+12};
    while(head<tail){const k=queue[head++],x=k%W;for(const n of [x>0?k-1:-1,x<W-1?k+1:-1,k>=W?k-W:-1,k+W<W*H?k+W:-1])if(n>=0&&!seen[n]&&blue(n)){seen[n]=1;queue[tail++]=n}}
    const maskPixels=m.createImageData(W,H);for(let i=0;i<seen.length;i++){maskPixels.data[i*4]=maskPixels.data[i*4+1]=maskPixels.data[i*4+2]=255;maskPixels.data[i*4+3]=seen[i]?255:0}m.putImageData(maskPixels,0,0);
    const lit=g.createImageData(W,H),windows=extractWindows(source);let cached=-1;
    function render(epoch){const key=Math.floor(epoch/60000)+paletteId;if(key===cached)return canvas;cached=key;const l=CityCalendar.lightAt(epoch),lut=[[],[],[]];
      for(let v=0;v<256;v++){const rgb=surfaceColor([v,v,v],l);for(let c=0;c<3;c++)lut[c][v]=rgb[c]}
      for(let i=0;i<a.length;i+=4){lit.data[i]=lut[0][a[i]];lit.data[i+1]=lut[1][a[i+1]];lit.data[i+2]=lut[2][a[i+2]];lit.data[i+3]=255}g.putImageData(lit,0,0);
      s.clearRect(0,0,W,H);
      // Many closely spaced stops avoid arbitrary gray/pink bands and threshold jumps.
      const gradient=s.createLinearGradient(0,0,0,620);for(let i=0;i<=20;i++)gradient.addColorStop(i/20,`rgb(${skyColor(l,i/20).join(',')})`);s.fillStyle=gradient;s.fillRect(0,0,W,H);
      if(l.sun){s.fillStyle=`rgb(${sunColor(l).join(',')})`;s.beginPath();s.arc(l.x,l.y,18,0,Math.PI*2);s.fill()}
      if(l.moon){s.fillStyle='#f4edc8';s.beginPath();s.arc(l.moonX,l.moonY,15,0,Math.PI*2);s.fill();s.fillStyle=`rgb(${skyColor(l,l.moonY/620).join(',')})`;s.beginPath();s.arc(l.moonX+7,l.moonY-4,13,0,Math.PI*2);s.fill()}
      s.globalCompositeOperation='destination-in';s.drawImage(mask,0,0);s.globalCompositeOperation='source-over';g.drawImage(sky,0,0);nightLights(g,l,epoch,windows);return canvas;
    }
    return{canvas,render,skyPixels:tail,windowCount:windows.length};
  }
  root.CityEnvironment={create,skyColor,sunColor,surfaceColor,billboardExposure,billboardLight,paintBillboardGlow,windowState,windowColor,groundLightAt,palettes,setPalette};if(typeof module!=='undefined')module.exports=root.CityEnvironment;
})(typeof window==='undefined'?globalThis:window);
