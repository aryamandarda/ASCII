(function(root){
  'use strict';
  const HOUR=3600000,DAY=24*HOUR,W=1280,H=854,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)},mod=(x,m)=>((x%m)+m)%m;
  // Central Park 1991–2020 monthly normals, NWS nycnormals.pdf. Event timing,
  // cloud cover and cold-front probabilities are artistic estimates, not forecasts.
  const normals={temperatureF:[33.7,35.9,42.8,53.7,63.2,72,77.5,76.1,69.2,57.9,48,39.1],
    precipitationIn:[3.64,3.19,4.29,4.09,3.96,4.54,4.60,4.56,4.31,4.38,3.58,4.38],
    snowfallIn:[8.8,10.1,5,.4,0,0,0,0,0,.1,.5,4.9]};
  function hash(n){let x=Math.imul(n^0x68bc21eb,0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return((x^(x>>>16))>>>0)/4294967296}
  function noise(x,y=0){const a=Math.floor(x),b=Math.floor(y),u=smooth(0,1,x-a),v=smooth(0,1,y-b),h=(i,j)=>hash(Math.imul(i,374761393)^Math.imul(j,668265263));return mix(mix(h(a,b),h(a+1,b),u),mix(h(a,b+1),h(a+1,b+1),u),v)}
  function climate(epoch){const d=new Date(epoch),y=d.getUTCFullYear(),m=d.getUTCMonth(),mid=Date.UTC(y,m,15),left=epoch<mid?Date.UTC(y,m-1,15):mid,right=epoch<mid?mid:Date.UTC(y,m+1,15),i=mod(epoch<mid?m-1:m,12),t=(epoch-left)/(right-left);
    return{temperature:(mix(normals.temperatureF[i],normals.temperatureF[(i+1)%12],t)-32)*5/9,precipitation:mix(normals.precipitationIn[i],normals.precipitationIn[(i+1)%12],t),snowfall:mix(normals.snowfallIn[i],normals.snowfallIn[(i+1)%12],t)};
  }
  const fronts=new Map();
  function front(slot){if(fronts.has(slot))return fronts.get(slot);const base=slot*3*DAY,c=climate(base),seed=slot*17;
    const wet=hash(seed+1)<.84,wintry=hash(seed+2)<clamp(c.snowfall*.048,0,.49),summer=c.temperature>19;
    const start=base+(8+hash(seed+3)*30)*HOUR,duration=(summer?5+hash(seed+4)*14:12+hash(seed+4)*24)*HOUR;
    const f={start,end:start+duration,wet,rate:(.15+hash(seed+5)*.50)*c.precipitation/4.1,
      anomaly:wintry?-c.temperature-2.3-hash(seed+6)*3:(hash(seed+6)-.5)*10,wind:(hash(seed+7)-.5)*2,cloud:wet?.95:.48+hash(seed+8)*.4};
    fronts.set(slot,f);if(fronts.size>600)fronts.delete(fronts.keys().next().value);return f;
  }
  function conditionsAt(epoch){
    const c=climate(epoch),slot=Math.floor(epoch/(3*DAY));let cloud=.10+.35*noise(epoch/(42*HOUR),71),rate=0,anomaly=0,wind=(noise(epoch/(16*HOUR),38)-.5)*.7;
    for(let i=slot-1;i<=slot;i++){const f=front(i),cover=smooth(f.start-10*HOUR,f.start-1*HOUR,epoch)*(1-smooth(f.end,f.end+12*HOUR,epoch));
      const wet=smooth(f.start,f.start+2*HOUR,epoch)*(1-smooth(f.end-2*HOUR,f.end,epoch));
      cloud=mix(cloud,Math.max(cloud,f.cloud),cover);anomaly+=f.anomaly*cover;wind+=f.wind*cover;
      if(f.wet)rate+=f.rate*wet*(.60+.40*noise(epoch/(2*HOUR),i));
    }
    const hour=mod(epoch/HOUR-5,24),sun=Math.max(0,Math.sin((hour-6)*Math.PI/12)),temperature=c.temperature+anomaly+3.4*(1-cloud*.72)*Math.cos((hour-15)*Math.PI/12);
    const frozen=1-smooth(-.8,1.8,temperature),snow=rate*frozen,rain=rate*(1-frozen);
    return{temperature,cloud:clamp(cloud,0,1),rain,snow,wind,sun,precipitation:rate,kind:snow>.08?'snow':rain>.08?'rain':cloud>.72?'overcast':cloud>.37?'cloudy':'clear'};
  }
  // Snow is a mass balance, in cm, advanced at canonical UTC hourly boundaries.
  // Warm rain, above-freezing air and solar exposure melt it; a cold dry day does
  // not erase it. Sheltered ledges melt more slowly than traffic-worn pavement.
  function integrate(state,w,hours){
    const thaw=Math.max(0,w.temperature),solar=w.sun*(1-w.cloud),fresh=w.snow*hours;
    const roofMelt=(thaw*.065+solar*.030+w.rain*.028+.0015)*hours;
    const groundMelt=(thaw*.10+solar*.055+w.rain*.055+.004)*hours;
    const roof=Math.max(0,state.roof+fresh-roofMelt),ground=Math.max(0,state.ground+fresh-groundMelt);
    const melt=Math.max(0,state.ground+fresh-ground),wet=clamp(state.wet*Math.exp(-hours*(.14+thaw*.018+solar*.35))+w.rain*.22*hours+melt*.09,0,1);
    return{roof,ground,wet};
  }
  const histories=new Map();
  function weatherAt(epoch){
    const d=new Date(epoch),year=d.getUTCFullYear()-(d.getUTCMonth()<7?1:0),start=Date.UTC(year,6,1),position=(epoch-start)/HOUR,index=Math.floor(position),fraction=position-index;
    if(!histories.has(year)){histories.set(year,[{roof:0,ground:0,wet:0}]);if(histories.size>3)histories.delete(histories.keys().next().value)}
    const states=histories.get(year);
    while(states.length<=index+1){const i=states.length-1;states.push(integrate(states[i],conditionsAt(start+(i+.5)*HOUR),1))}
    const a=states[index],b=states[index+1];return{...conditionsAt(epoch),roofSnow:mix(a.roof,b.roof,fraction),groundSnow:mix(a.ground,b.ground,fraction),wetness:mix(a.wet,b.wet,fraction)};
  }
  function cloudDensity(x,y,epoch,cover){const t=epoch/HOUR,drift=t*.20;
    const n=.56*noise(x/280+drift,y/130+7)+.28*noise(x/130+drift*1.7,y/62+39)+.12*noise(x/53+drift*2.2,y/31+19)+.04*noise(x/22+drift*2.5,y/15+11);
    return smooth(.76-cover*.48,.96-cover*.60,n)*(.25+.73*cover);
  }
  let cloudCanvas,cloudCtx,cloudPixels;
  function paintClouds(g,w,l,epoch){
    if(!cloudCanvas){cloudCanvas=document.createElement('canvas');cloudCanvas.width=192;cloudCanvas.height=94;cloudCtx=cloudCanvas.getContext('2d');cloudPixels=cloudCtx.createImageData(192,94)}
    const data=cloudPixels.data;
    for(let y=0;y<94;y++)for(let x=0;x<192;x++){const X=(x+.5)*W/192,Y=(y+.5)*620/94,d=cloudDensity(X,Y,epoch,w.cloud),i=(y*192+x)*4;
      const edge=cloudDensity(X-14,Y-10,epoch,w.cloud),silver=clamp((d-edge)*3,-.25,.25),brightness=(.70+silver-d*.12);
      const day=[198,208,219],night=[61,67,84];
      for(let c=0;c<3;c++)data[i+c]=mix(night[c],day[c],l.day)*brightness+(l.warm*(1-w.cloud)*[28,13,7][c]);
      data[i+3]=Math.round(d*255);
    }
    cloudCtx.putImageData(cloudPixels,0,0);g.save();g.imageSmoothingEnabled=true;g.drawImage(cloudCanvas,0,0,W,620);g.restore();
  }
  // Only upward-facing, measured architectural ledges, never whole facades/ads.
  const ledges=[[[326,97],[400,88]],[[322,111],[394,102]],[[309,148],[384,137]],[[296,190],[374,178]],
    [[283,229],[359,218]],[[271,269],[347,257]],[[257,308],[333,297]],[[337,327],[365,350]],
    [[478,288],[497,287]],[[522,373],[559,372]],[[758,405],[814,398]],[[815,399],[843,388]],
    [[806,466],[858,441]],[[820,527],[870,506]],[[849,593],[934,585]],[[356,604],[476,630]],
    [[15,613],[224,628]],[[918,609],[1011,596]],[[1070,611],[1194,597]]];
  function pavementTop(x){return x<550?704-x*.10:x<745?649:649+(x-745)*.21}
  function snowCoverage(x,y,depth){
    if(depth<=0)return 0;
    if(y<pavementTop(x)){
      // Traffic clears the travel lanes; low ridges remain at the curb.
      const top=620+Math.max(0,x-1110)*.18,bottom=650+Math.max(0,x-745)*.21;
      if(x<745||y<top||y>bottom)return 0;
      const curb=1-smooth(0,13,Math.min(y-top,bottom-y));
      return clamp(depth/12,0,.65)*curb*(.45+.55*noise(x/35,y/12));
    }
    const corridor=Math.exp(-(((x-(620+(y-650)*.05))/115)**2)),edge=Math.exp(-(((y-pavementTop(x))/20)**2));
    const worn=clamp(1-corridor*.70+edge*.4,.15,1.4),patch=.60*noise(x/83,y/36)+.40*noise(x/21,y/12);
    return smooth(patch*.85,patch*.85+.24,depth*.16*worn)*smooth(0,5,y-pavementTop(x));
  }
  let groundCanvas,groundCtx,groundPixels;
  function paintSurfaces(g,w,l){
    if(w.wetness>.01){g.save();g.beginPath();g.moveTo(0,704);g.lineTo(550,649);g.lineTo(745,649);g.lineTo(1280,762);g.lineTo(1280,H);g.lineTo(0,H);g.closePath();g.clip();g.globalAlpha=w.wetness*.17;g.fillStyle='#172331';g.fillRect(0,640,W,H-640);g.restore()}
    if(w.groundSnow>.01){
      if(!groundCanvas){groundCanvas=document.createElement('canvas');groundCanvas.width=320;groundCanvas.height=54;groundCtx=groundCanvas.getContext('2d');groundPixels=groundCtx.createImageData(320,54)}
      const data=groundPixels.data;for(let y=0;y<54;y++)for(let x=0;x<320;x++){const X=(x+.5)*4,Y=638+(y+.5)*4,i=(y*320+x)*4,a=snowCoverage(X,Y,w.groundSnow),grain=.93+.07*noise(X/7,Y/5);
        data[i]=mix(133,229,l.day)*grain;data[i+1]=mix(148,235,l.day)*grain;data[i+2]=mix(166,240,l.day)*grain;data[i+3]=a*230;
      }groundCtx.putImageData(groundPixels,0,0);g.save();g.imageSmoothingEnabled=true;g.drawImage(groundCanvas,0,638,1280,216);g.restore();
    }
    if(w.roofSnow>.02){g.save();g.strokeStyle=l.day>.5?'#e4e9ec':'#a5b6ca';g.lineCap='round';
      for(const [index,[a,b]] of ledges.entries()){const amount=clamp(w.roofSnow/3,0,1),segments=24;g.lineWidth=Math.min(4.2,.4+w.roofSnow*.35)*(a[1]/650*.5+.5);
        for(let j=0;j<segments;j++){g.globalAlpha=amount*(.62+.3*noise(j*.7,index*3));g.beginPath();g.moveTo(mix(a[0],b[0],j/segments),mix(a[1],b[1],j/segments)-g.lineWidth*.4);g.lineTo(mix(a[0],b[0],(j+1)/segments),mix(a[1],b[1],(j+1)/segments)-g.lineWidth*.4);g.stroke()}
      }g.restore();
    }
  }
  function paintFurnitureSnow(g,table,w,l){if(w.roofSnow<.05)return;const h=root.CityLife.tableScale(table),depth=clamp(w.roofSnow*.25,0,2.6);g.save();g.fillStyle=l.day>.5?'#e1e7e9':'#a5b5c5';g.globalAlpha=clamp(w.roofSnow/3,0,.92);g.beginPath();g.ellipse(table.x,table.y-h*.43-depth,h*.285*table.size,h*.055,0,0,Math.PI*2);g.fill();g.restore()}
  function paintPrecipitation(g,w,l,epoch){
    const rain=Math.sqrt(clamp(w.rain/1.2,0,1)),snow=Math.sqrt(clamp(w.snow/.8,0,1));if(rain+snow<.002)return;
    // Follow the same simulation clock as the people. Layered speeds and sizes
    // create depth; fixed particle identities prevent frame-to-frame flicker.
    const t=epoch/60000,windOffset=35*Math.sin(epoch/(4*HOUR))+65*Math.sin(epoch/(11*HOUR)+1.3);
    g.save();g.lineCap='round';
    for(let i=0;i<180;i++){const depth=.3+hash(i+817)*.7,baseX=hash(i+123)*1600,baseY=hash(i+456)*1100;
      if(snow>.002){const y=mod(baseY+t*(18+depth*36),1000)-70,x=mod(baseX+t*2+windOffset+Math.sin(t*.48+i)*12,1500)-100;
        g.globalAlpha=snow*(.35+.5*depth);g.fillStyle=l.day>.5?'#f5f7f8':'#d8dfeb';g.beginPath();g.ellipse(x,y,.7+depth*1.5,.7+depth*1.5,0,0,Math.PI*2);g.fill()}
      if(rain>.002){const y=mod(baseY+t*(330+depth*240),1000)-60,x=mod(baseX+t*8+windOffset*2,1500)-100;
        g.globalAlpha=rain*(.15+.21*depth);g.strokeStyle=l.day>.5?'#b9c9d5':'#94aaba';g.lineWidth=.6+depth*.65;g.beginPath();g.moveTo(x,y);g.lineTo(x+w.wind*3,y+7+depth*12);g.stroke();
        if(i<45){const X=hash(i+711)*W,Y=696+hash(i+661)*155,age=mod(t*2+hash(i+712),1);if(Y>pavementTop(X)){g.globalAlpha=rain*(1-age)*.22;g.beginPath();g.ellipse(X,Y,.8+age*3,.3+age,0,0,Math.PI*2);g.stroke()}}
      }
    }g.restore();
  }
  root.CityWeather={normals,climate,front,conditionsAt,weatherAt,integrate,cloudDensity,paintClouds,paintSurfaces,paintPrecipitation,paintFurnitureSnow,snowCoverage,ledges,noise};
  if(typeof module!=='undefined')module.exports=root.CityWeather;
})(typeof window==='undefined'?globalThis:window);
