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
  function surfaceColor(rgb,light){const l=light,exposure=(.32+.68*l.day)*(1-(l.cloud||0)*.23*l.day),tint=[.88+.12*l.day,.94+.06*l.day,1];return rgb.map((v,i)=>linearToSrgb(srgbToLinear(v)*exposure*tint[i]))}
  const billboardExposure=light=>.85*light.night;
  function billboardLight(points,rgb){
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);
    const peak=Math.max(...rgb,1),luminance=(rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)/255;
    const lamp={x:xs.reduce((a,b)=>a+b)/4,y:ys.reduce((a,b)=>a+b)/4,w,h,
      color:rgb.map(v=>Math.round(v/peak*255)),power:Math.min(1,Math.sqrt(w*h)/150)*Math.sqrt(luminance)};
    return {...lamp,...emitterGeometry(lamp),radiance:rgb.map(srgbToLinear)};
  }
  // Approximate facade depth in the same metre space as pedestrian projection.
  // This is a 2.5D reconstruction, not calibrated photometry or a ray tracer.
  function emitterGeometry(lamp){
    const offset=lamp.x-640,central=Math.abs(offset)<92,z=central?36:1440/(65+Math.abs(offset)*.09);
    return{position:[offset*z/800,Math.max(2.5,1.8+(600-lamp.y)*z/800),z],
      normal:central?[0,0,-1]:[-Math.sign(offset)*.90,0,-.44],area:clamp(lamp.w*lamp.h*(z/800)**2,1,180)};
  }
  function irradianceAt(point,lamps,normal=[0,1,0]){
    const rgb=[0,0,0];
    for(const lamp of lamps){if(lamp.power<=0)continue;const source=lamp.position?lamp:{...lamp,...emitterGeometry(lamp)},delta=source.position.map((v,i)=>v-point[i]),d2=delta.reduce((s,v)=>s+v*v,0),d=Math.sqrt(d2)||1;
      const emission=Math.max(0,-delta.reduce((s,v,i)=>s+v*source.normal[i],0)/d),incidence=Math.max(0,delta.reduce((s,v,i)=>s+v*normal[i],0)/d);
      // Finite area softens the near field; far field falls as inverse distance
      // squared. A small diffuse bounce term lights away-facing surfaces too.
      const energy=5.2*source.area/(d2+source.area*.5)*(.12+.88*emission)*(.22+.78*incidence),radiance=lamp.radiance||lamp.color.map(v=>srgbToLinear(v)*lamp.power);
      for(let c=0;c<3;c++)rgb[c]+=radiance[c]*energy;
    }
    return rgb;
  }
  function materialColor(rgb,light,gain=1){const ambient=.34+.66*light.day,energy=light.irradiance||[0,0,0];
    return rgb.map((v,c)=>linearToSrgb(clamp(srgbToLinear(v)*gain*(ambient+light.night*energy[c]),0,1)));
  }
  function receiverLight(light,x,y,height,lamps){const z=1440/Math.max(12,y-600),point=[(x-640)*z/800,height,z];
    return {...light,irradiance:irradianceAt(point,lamps,[0,.55,-.45])};
  }
  // Broad diffuse illumination over the whole plaza. The same emitters also
  // shade people/cars; no reflected ad image or illuminated sky is introduced.
  function groundLightAt(x,y,night,lamps){
    const edge=x<550?704-x*.10:x<745?649:620+Math.max(0,x-1110)*.18,t=clamp((y-edge)/50,0,1),fade=t*t*(3-2*t);
    if(!night||!fade)return[0,0,0,0];
    const z=1440/Math.max(12,y-600),energy=irradianceAt([(x-640)*z/800,0,z],lamps),peak=Math.max(...energy),luminance=energy[0]*.2126+energy[1]*.7152+energy[2]*.0722;
    return peak>0?[...energy.map(v=>linearToSrgb(v/peak)),.52*night*fade*(1-Math.exp(-luminance*1.4))]:[0,0,0,0];
  }
  // Rough wet stone reflects a broad lobe around the light/view half-vector.
  // Surface variation is fixed in world space, so it never flickers with time.
  function wetReflectionAt(x,y,wetness,lamps){
    const edge=x<550?704-x*.10:x<745?649:649+(x-745)*.21;
    if(wetness<=0||y<=edge)return [0,0,0,0];
    const z=1440/Math.max(12,y-600),px=(x-640)*z/800;
    const vl=Math.hypot(px,1.8,z),view=[-px/vl,1.8/vl,-z/vl],rgb=[0,0,0];
    const texture=.56+.24*Math.sin(px*3.1+Math.sin(z*2.7))+.20*Math.sin(z*18+px*.8);
    for(const lamp of lamps){const source=lamp.position?lamp:{...lamp,...emitterGeometry(lamp)},d=[source.position[0]-px,source.position[1],source.position[2]-z],len=Math.hypot(...d);
      if(len<.001)continue;
      const h=d.map((v,i)=>v/len+view[i]),hl=Math.hypot(...h),nh=hl>0?Math.max(0,h[1]/hl):0;
      const emission=Math.max(0,-d.reduce((sum,v,i)=>sum+v*source.normal[i],0)/len);
      const roughness=16+20/(1+source.area/20),spec=Math.pow(nh,roughness)*emission*source.area/(len*len+source.area)*3.5;
      const radiance=lamp.radiance||lamp.color.map(v=>srgbToLinear(v)*lamp.power);
      for(let i=0;i<3;i++)rgb[i]+=radiance[i]*spec;
    }
    const peak=Math.max(...rgb),fade=clamp((y-edge)/14,0,1);
    return peak>0?[...rgb.map(v=>linearToSrgb(v/peak)),Math.min(.42,(1-Math.exp(-peak))*wetness*texture*fade)]:[0,0,0,0];
  }
  // Billboard positions and pavement geometry are fixed. Precompute their
  // transfer weights once; only emitted RGB and weather change each frame.
  function groundTransfer(lamps,width=128,height=86){
    const cells=width*height,diffuse=new Float32Array(cells*lamps.length),specular=new Float32Array(cells*lamps.length),fade=new Float32Array(cells),wetFade=new Float32Array(cells);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=y*width+x,X=(x+.5)*W/width,Y=(y+.5)*H/height,z=1440/Math.max(12,Y-600),px=(X-640)*z/800;
      const edge=X<550?704-X*.10:X<745?649:620+Math.max(0,X-1110)*.18,t=clamp((Y-edge)/50,0,1);fade[i]=t*t*(3-2*t);
      const wetEdge=X<550?704-X*.10:X<745?649:649+(X-745)*.21;
      wetFade[i]=clamp((Y-wetEdge)/14,0,1)*(.56+.24*Math.sin(px*3.1+Math.sin(z*2.7))+.20*Math.sin(z*18+px*.8));
      if(!fade[i]&&!wetFade[i])continue;
      const vl=Math.hypot(px,1.8,z),view=[-px/vl,1.8/vl,-z/vl];
      lamps.forEach((lamp,j)=>{
        const source=lamp.position?lamp:{...lamp,...emitterGeometry(lamp)},d=[source.position[0]-px,source.position[1],source.position[2]-z],d2=d[0]*d[0]+d[1]*d[1]+d[2]*d[2],len=Math.sqrt(d2)||1;
        const emission=Math.max(0,-(d[0]*source.normal[0]+d[1]*source.normal[1]+d[2]*source.normal[2])/len),incidence=Math.max(0,d[1]/len),k=i*lamps.length+j;
        diffuse[k]=5.2*source.area/(d2+source.area*.5)*(.12+.88*emission)*(.22+.78*incidence);
        const hx=d[0]/len+view[0],hy=d[1]/len+view[1],hz=d[2]/len+view[2],hl=Math.hypot(hx,hy,hz),nh=hl>0?Math.max(0,hy/hl):0;
        specular[k]=Math.pow(nh,16+20/(1+source.area/20))*emission*source.area/(d2+source.area)*3.5;
      });
    }
    return {diffuse,specular,fade,wetFade};
  }
  function transferPixel(transfer,index,lamps,night,wetness){
    const energy=[0,0,0],reflection=[0,0,0];
    for(let j=0;j<lamps.length;j++){const lamp=lamps[j],radiance=lamp.radiance||lamp.color.map(v=>srgbToLinear(v)*lamp.power),k=index*lamps.length+j;
      for(let c=0;c<3;c++){energy[c]+=radiance[c]*transfer.diffuse[k];reflection[c]+=radiance[c]*transfer.specular[k]}
    }
    const peak=Math.max(...energy),wetPeak=Math.max(...reflection),luminance=energy[0]*.2126+energy[1]*.7152+energy[2]*.0722;
    return {ground:peak>0?[...energy.map(v=>linearToSrgb(v/peak)),.52*night*transfer.fade[index]*(1-Math.exp(-luminance*1.4))]:[0,0,0,0],wet:wetPeak>0?[...reflection.map(v=>linearToSrgb(v/wetPeak)),Math.min(.42,(1-Math.exp(-wetPeak))*wetness*transfer.wetFade[index])]:[0,0,0,0]};
  }
  let groundCanvas,groundContext,groundPixels,wetCanvas,wetContext,wetPixels,groundKey,transfer,transferKey;
  let haloCanvas,haloContext;
  function paintBillboardGlow(g,l,screens,ground=false,skyMask,wetness=0){
    if(l.night<=0&&(!ground||wetness<=.01))return;
    const lamps=screens.map(s=>s.light).filter(lamp=>lamp&&lamp.power>.01);
    if(!ground&&skyMask){if(!haloCanvas){haloCanvas=document.createElement('canvas');haloCanvas.width=W;haloCanvas.height=H;haloContext=haloCanvas.getContext('2d')}haloContext.clearRect(0,0,W,H);paintBillboardGlow(haloContext,l,screens);haloContext.globalCompositeOperation='destination-out';haloContext.drawImage(skyMask,0,0);haloContext.globalCompositeOperation='source-over';g.save();g.globalCompositeOperation='screen';g.drawImage(haloCanvas,0,0);g.restore();return}
    g.save();g.globalCompositeOperation='screen';
    if(ground){
      if(!groundCanvas){groundCanvas=document.createElement('canvas');groundCanvas.width=128;groundCanvas.height=86;groundContext=groundCanvas.getContext('2d');groundPixels=groundContext.createImageData(128,86);wetCanvas=document.createElement('canvas');wetCanvas.width=128;wetCanvas.height=86;wetContext=wetCanvas.getContext('2d');wetPixels=wetContext.createImageData(128,86)}
      const geometry=lamps.map(lamp=>[lamp.x,lamp.y,lamp.w,lamp.h].join(',')).join('|');if(geometry!==transferKey){transferKey=geometry;transfer=groundTransfer(lamps)}
      const key=l.night.toFixed(3)+':'+wetness.toFixed(3)+':'+screens.map(s=>s.cacheKey||JSON.stringify(s.light)).join('|');
      if(key!==groundKey){groundKey=key;const data=groundPixels.data;
        for(let index=0;index<128*86;index++){
          if(!transfer.fade[index]&&!transfer.wetFade[index])continue;
          const {ground:c,wet:w}=transferPixel(transfer,index,lamps,l.night,wetness),i=index*4;
          data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];data[i+3]=Math.round(c[3]*255);
          wetPixels.data[i]=w[0];wetPixels.data[i+1]=w[1];wetPixels.data[i+2]=w[2];wetPixels.data[i+3]=Math.round(w[3]*(.25+.35*l.night)*255);
        }
        groundContext.putImageData(groundPixels,0,0);
        if(wetness>.01){
          wetContext.putImageData(wetPixels,0,0);
        }
      }
      g.imageSmoothingEnabled=true;g.drawImage(groundCanvas,0,0,W,H);if(wetness>.01)g.drawImage(wetCanvas,0,0,W,H);
    }else for(const lamp of lamps){
      const x=lamp.x,y=lamp.y,rx=40+lamp.w*.75,ry=35+lamp.h*.75,strength=l.night*lamp.power*.32,c=lamp.color.join(',');
      g.save();g.translate(x,y);g.scale(rx,ry);const halo=g.createRadialGradient(0,0,0,0,0,1);
      halo.addColorStop(0,`rgba(${c},${strength})`);halo.addColorStop(.35,`rgba(${c},${strength*.65})`);halo.addColorStop(1,`rgba(${c},0)`);
      g.fillStyle=halo;g.fillRect(-1,-1,2,2);g.restore();
    }g.restore();
  }
  let reflectionCanvas,reflectionContext,reflectionKey;
  function reflectionAxis(lamp){const source=lamp.position?lamp:{...lamp,...emitterGeometry(lamp)};return 600+1440/source.position[2]}
  function paintWetScreens(g,l,screens,wetness,drawScreen){
    if(wetness<=.01)return;
    if(!reflectionCanvas){reflectionCanvas=document.createElement('canvas');reflectionCanvas.width=W/2;reflectionCanvas.height=H/2;reflectionContext=reflectionCanvas.getContext('2d')}
    const key=screens.map(s=>s.light?s.cacheKey:'').join('|');
    if(key!==reflectionKey){reflectionKey=key;const r=reflectionContext;r.clearRect(0,0,W/2,H/2);r.save();r.scale(.5,.5);r.globalCompositeOperation='screen';
      for(const screen of screens){if(!screen.light)continue;r.save();r.globalAlpha=.55+.25*screen.light.power;r.translate(0,2*reflectionAxis(screen.light));r.scale(1,-1);drawScreen(screen,r);r.restore()}
      r.restore();
    }
    g.save();g.beginPath();g.moveTo(0,704);g.lineTo(550,649);g.lineTo(745,649);g.lineTo(1280,762);g.lineTo(1280,H);g.lineTo(0,H);g.closePath();g.clip();
    g.globalCompositeOperation='screen';g.imageSmoothingEnabled=true;
    // Thin horizontal bands soften and break reflected imagery along the paving.
    // The pattern is stable; the reflected screen footage remains animated.
    for(let y=650;y<H;y+=3){const texture=.72+.18*Math.sin(y*.61)+.10*Math.sin(y*1.73),offset=1.2*Math.sin(y*.87)+.7*Math.sin(y*.31);
      g.globalAlpha=wetness*(.16+.16*l.night)*texture*clamp((y-650)/25,0,1);
      g.drawImage(reflectionCanvas,0,y/2,W/2,1.5,offset,y,W,3);
    }
    g.restore();
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
  // Receding facades are too small/connected for component extraction. Map their
  // window bays explicitly and attenuate them relative to the nearby buildings.
  const distantFacades=[
    {name:'Allianz front',quad:[[523,385],[559,381],[557,512],[511,525]],cols:6,rows:18,strength:.40},
    {name:'Allianz side',quad:[[561,383],[574,393],[569,511],[559,516]],cols:3,rows:16,strength:.26},
    {name:'Left narrow tower',quad:[[469,311],[478,307],[465,513],[458,505]],cols:2,rows:25,strength:.30},
    {name:'Left deep street',quad:[[576,484],[590,479],[588,551],[572,564]],cols:3,rows:10,strength:.24},
    {name:'Right deep street',quad:[[735,495],[749,485],[752,605],[731,614]],cols:3,rows:15,strength:.25},
    {name:'Barclays offices',quad:[[762,365],[817,356],[822,398],[757,406]],cols:7,rows:6,strength:.38},
    {name:'Left street offices',quad:[[529,554],[558,546],[560,593],[525,605]],cols:5,rows:7,strength:.36}
  ];
  function distantWindows(source){const windows=[];
    distantFacades.forEach((facade,index)=>{const transform=BillboardModel.homography(facade.quad);
      for(let row=0;row<facade.rows;row++)for(let col=0;col<facade.cols;col++){
        const id=2000000+index*1000+row*facade.cols+col;
        const points=[[.18,.18],[.80,.18],[.80,.72],[.18,.72]].map(([u,v])=>BillboardModel.map(transform,(col+u)/facade.cols,(row+v)/facade.rows));
        const x=Math.floor(Math.min(...points.map(p=>p[0]))),y=Math.floor(Math.min(...points.map(p=>p[1]))),w=Math.ceil(Math.max(...points.map(p=>p[0])))-x,h=Math.ceil(Math.max(...points.map(p=>p[1])))-y;
        const tile=document.createElement('canvas');tile.width=w;tile.height=h;const c=tile.getContext('2d'),img=c.createImageData(w,h),color=windowColor(id);let pixels=0;
        for(let py=0;py<h;py++)for(let px=0;px<w;px++){const X=x+px+.5,Y=y+py+.5;if(!BillboardModel.inside(points,X,Y)||BillboardModel.boards.some(b=>BillboardModel.inside(b[1],X,Y)))continue;
          const k=(Math.floor(Y)*W+Math.floor(X))*4,j=(py*w+px)*4,texture=(source.data[k]+source.data[k+1]+source.data[k+2])/765;
          if(texture>.86)continue;for(let n=0;n<3;n++)img.data[j+n]=color[n]*(.76+.24*texture);img.data[j+3]=230;pixels++;
        }
        if(!pixels)continue;c.putImageData(img,0,0);windows.push({id,x,y,tile,color,strength:facade.strength});
      }
    });return windows;
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
    }return windows.concat(distantWindows(source));
  }
  function nightLights(g,l,epoch,windows){
    for(const w of windows){const on=windowState(w.id,epoch,l)*l.night*(w.strength||1);if(on<.01)continue;g.globalAlpha=on*.87;g.shadowColor=`rgb(${w.color.join(',')})`;g.shadowBlur=w.strength?1:4;g.drawImage(w.tile,w.x,w.y)}g.shadowBlur=0;g.globalAlpha=1;
  }
  function moonSpan(y,phase,fraction){const edge=Math.sqrt(Math.max(0,1-y*y)),terminator=(1-2*fraction)*edge;return phase<.5?[terminator,edge]:[-edge,-terminator]}
  function paintMoon(g,l,visibility=1){
    if(!l.moon)return;const angle=l.moonAngle-Math.PI/2+(l.moonPhase<.5?0:Math.PI),c=Math.cos(angle),s=Math.sin(angle),r=15;
    const point=(x,y)=>[l.moonX+r*(x*c-y*s),l.moonY+r*(x*s+y*c)];
    const outline=[];for(let i=0;i<=48;i++){const y=-1+i/24;outline.push(point(moonSpan(y,l.moonPhase,l.moonFraction)[1],y))}
    for(let i=48;i>=0;i--){const y=-1+i/24;outline.push(point(moonSpan(y,l.moonPhase,l.moonFraction)[0],y))}
    g.save();g.globalAlpha=(.23+.77*l.night)*visibility;g.fillStyle='#e9e9d6';g.beginPath();outline.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();g.restore();
  }
  function makeCanvas(){const c=document.createElement('canvas');c.width=W;c.height=H;return c}
  function neutralizePavement(image){
    const a=image.data,stride=W+1,sum=new Float64Array((W+1)*(H+1));
    for(let y=0;y<H;y++){let row=0;for(let x=0;x<W;x++){const i=(y*W+x)*4;row+=a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722;sum[(y+1)*stride+x+1]=sum[y*stride+x+1]+row}}
    const meanAt=(x,y,r)=>{const x0=Math.max(0,x-r),x1=Math.min(W,x+r+1),y0=Math.max(0,y-r),y1=Math.min(H,y+r+1);return (sum[y1*stride+x1]-sum[y0*stride+x1]-sum[y1*stride+x0]+sum[y0*stride+x0])/((x1-x0)*(y1-y0))};
    for(let y=649;y<H;y++)for(let x=0;x<W;x++){
      const edge=x<550?704-x*.10:x<745?649:649+(x-745)*.21,blend=clamp((y-edge-2)/10,0,1);if(!blend)continue;
      const i=(y*W+x)*4,v=a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722;
      // Rebuild neutral stone from fine grain and dark slab joints only.
      // Positive broad contrast was photographed sunlight, not surface material.
      const grain=clamp(v-meanAt(x,y,2),-8,6),joint=clamp(v-meanAt(x,y,9),-22,0);
      const neutral=158+(y-649)*.025+grain*.55+joint*.55;
      for(let c=0;c<3;c++){const material=neutral+clamp((a[i+c]-v)*.14,-3,3);a[i+c]=Math.round(a[i+c]*(1-blend)+material*blend)}
    }
    return image;
  }
  function create(day,roadPlate){
    const canvas=makeCanvas(),g=canvas.getContext('2d'),sky=makeCanvas(),s=sky.getContext('2d'),mask=makeCanvas(),m=mask.getContext('2d',{willReadFrequently:true});
    // One immutable geometric plate. Lighting changes pixels, never object positions.
    m.drawImage(day,0,0,W,H);if(roadPlate){m.save();m.beginPath();[[746,619],[1110,620],[1280,650],[1280,763],[745,652]].forEach((p,i)=>i?m.lineTo(...p):m.moveTo(...p));m.closePath();m.clip();m.drawImage(roadPlate,0,0,W,H);m.restore()}const source=neutralizePavement(m.getImageData(0,0,W,H)),a=source.data,seen=new Uint8Array(W*H),queue=new Int32Array(W*H);let head=0,tail=1;queue[0]=640;seen[640]=1;
    const blue=k=>{let i=k*4;return k<W*620&&a[i]>80&&a[i]<215&&a[i+1]>135&&a[i+2]>220&&a[i+1]>a[i]+18&&a[i+2]>a[i+1]+12};
    while(head<tail){const k=queue[head++],x=k%W;for(const n of [x>0?k-1:-1,x<W-1?k+1:-1,k>=W?k-W:-1,k+W<W*H?k+W:-1])if(n>=0&&!seen[n]&&blue(n)){seen[n]=1;queue[tail++]=n}}
    const maskPixels=m.createImageData(W,H);for(let i=0;i<seen.length;i++){maskPixels.data[i*4]=maskPixels.data[i*4+1]=maskPixels.data[i*4+2]=255;maskPixels.data[i*4+3]=seen[i]?255:0}m.putImageData(maskPixels,0,0);
    const lit=g.createImageData(W,H),windows=extractWindows(source),base=makeCanvas(),baseContext=base.getContext('2d');let cached=-1,frameKey=null;
    function render(epoch,weather){const frame=Math.floor(epoch/15000)+paletteId+(weather?weather.cloud.toFixed(2)+':'+weather.precipitation.toFixed(2):'');if(frameKey===frame)return canvas;frameKey=frame;const key=Math.floor(epoch/60000)+paletteId+(weather?weather.cloud.toFixed(2):0),l={...CityCalendar.lightAt(epoch),cloud:weather?weather.cloud:0},lut=[[],[],[]];
      if(key!==cached){cached=key;
      for(let v=0;v<256;v++){const rgb=surfaceColor([v,v,v],l);for(let c=0;c<3;c++)lut[c][v]=rgb[c]}
      for(let i=0;i<a.length;i+=4){lit.data[i]=lut[0][a[i]];lit.data[i+1]=lut[1][a[i+1]];lit.data[i+2]=lut[2][a[i+2]];lit.data[i+3]=255}baseContext.putImageData(lit,0,0);}
      g.drawImage(base,0,0);
      s.clearRect(0,0,W,H);
      // Many closely spaced stops avoid arbitrary gray/pink bands and threshold jumps.
      const gradient=s.createLinearGradient(0,0,0,620);for(let i=0;i<=20;i++)gradient.addColorStop(i/20,`rgb(${mix(skyColor(l,i/20),mix([25,31,44],[151,166,182],l.day),(weather?weather.cloud:0)*.52).map(Math.round).join(',')})`);s.fillStyle=gradient;s.fillRect(0,0,W,H);
      const visibility=(x,y)=>weather?CityWeather.celestialVisibility(x,y,epoch,weather):1;
      if(l.sun){s.save();s.globalAlpha=visibility(l.x,l.y);s.fillStyle=`rgb(${sunColor(l).join(',')})`;s.beginPath();s.arc(l.x,l.y,18,0,Math.PI*2);s.fill();s.restore()}
      paintMoon(s,l,visibility(l.moonX,l.moonY));if(weather)CityWeather.paintClouds(s,weather,l,epoch);
      s.globalCompositeOperation='destination-in';s.drawImage(mask,0,0);s.globalCompositeOperation='source-over';g.drawImage(sky,0,0);nightLights(g,l,epoch,windows);return canvas;
    }
    return{canvas,render,skyMask:mask,skyPixels:tail,windowCount:windows.length,distantWindowCount:windows.filter(w=>w.strength).length};
  }
  root.CityEnvironment={groundTransfer,transferPixel,paintWetScreens,reflectionAxis,neutralizePavement,wetReflectionAt,create,skyColor,sunColor,surfaceColor,billboardExposure,billboardLight,paintBillboardGlow,windowState,windowColor,groundLightAt,irradianceAt,receiverLight,materialColor,emitterGeometry,distantFacades,moonSpan,paintMoon,palettes,setPalette};if(typeof module!=='undefined')module.exports=root.CityEnvironment;
})(typeof window==='undefined'?globalThis:window);
