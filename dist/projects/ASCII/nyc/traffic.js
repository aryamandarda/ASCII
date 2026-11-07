(function(root){
  const LENGTH=70,STEP=.25,BLOCK=240,WARMUP=180,PERIOD=84,ARRIVAL=6;
  const quad=[[735,642],[762,630],[1500,704],[1500,790]],transform=BillboardModel.homography(quad),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=n=>{const v=Math.sin(n*84.731+12.31)*43758.5453;return v-Math.floor(v)},mod=(n,m)=>((n%m)+m)%m;
  function road(u,v,z=0){const p=BillboardModel.map(transform,u,v),scale=6+Math.max(0,p[0]-735)*.060;return[p[0],p[1]-z*scale]}
  function demand(hour){const h=mod(hour,24),anchors=[.3,.23,.17,.12,.13,.18,.35,.65,.9,.78,.6,.6,.67,.68,.7,.79,.97,1,.91,.82,.72,.65,.56,.43],i=Math.floor(h);return anchors[i]+(anchors[(i+1)%24]-anchors[i])*(h-i)}
  function green(time,lane){return mod(time+lane*14,PERIOD)<53}
  const blocks=new Map();
  function buildBlock(key){const start=key*BLOCK,begin=start-WARMUP,vehicles=[],frames=[];let slot=Math.floor(begin/ARRIVAL)-1;
    for(let tick=0;tick<=(BLOCK+WARMUP)/STEP;tick++){
      const t=begin+tick*STEP;
      while((slot+1)*ARRIVAL<=t){slot++;for(let lane=0;lane<2;lane++){
        const id=slot*2+lane,ratio=demand(CityCalendar.parts(slot*ARRIVAL*60000).hour);
        if(rand(id+7)>ratio)continue;
        // Admit cars only when the entrance has room, even during a red-light queue.
        if(vehicles.some(c=>c.lane===lane&&c.s<-1))continue;
        vehicles.push({id,lane,s:-8,speed:0,maxSpeed:1.75+rand(id+21)*.55,length:4.35+rand(id+12)*.45,taxi:rand(id+9)<.48,color:['#5e7588','#c9d2ce','#354450','#a15247'][mod(id,4)]});
      }}
      for(let lane=0;lane<2;lane++){
        const line=vehicles.filter(c=>c.lane===lane).sort((a,b)=>b.s-a.s);let leader=null;
        for(const car of line){let available=Infinity;
          if(leader)available=leader.s-car.s-(leader.length+car.length)/2-2.1;
          const stop=lane===0?44:26;
          if(!green(t,lane)&&car.s+car.length/2<stop+.1)available=Math.min(available,stop-car.s-car.length/2);
          const target=Math.min(car.maxSpeed,Math.sqrt(2*1.2*Math.max(0,available))),oldSpeed=car.speed;
          car.speed=clamp(target,Math.max(0,car.speed-1.35*STEP),car.speed+.55*STEP);
          const advance=Math.min(car.speed*STEP,Math.max(0,available));car.s+=advance;if(advance<car.speed*STEP)car.speed=advance/STEP;
          car.braking=car.speed<oldSpeed-.03||car.speed<.16;leader=car;
        }
      }
      for(let i=vehicles.length-1;i>=0;i--)if(vehicles[i].s>LENGTH+10)vehicles.splice(i,1);
      if(t>=start)frames.push(vehicles.map(c=>({...c})));
    }
    const block={start,frames};blocks.set(key,block);if(blocks.size>4)blocks.delete(blocks.keys().next().value);return block;
  }
  function carsAt(time){const key=Math.floor(time/BLOCK),b=blocks.get(key)||buildBlock(key),frame=(time-b.start)/STEP,i=Math.floor(frame),f=frame-i,a=b.frames[i],next=new Map((b.frames[i+1]||a).map(c=>[c.id,c]));return a.map(c=>{const n=next.get(c.id)||c,s=c.s+(n.s-c.s)*f,v=c.lane===0?s/LENGTH:1-s/LENGTH,u=c.lane===0?.27:.75,p=road(u,v);return{...c,s,v,u,x:p[0],y:p[1],alpha:clamp((v+.02)/.06,0,1)}}).filter(c=>c.v>-.03&&c.x<1500&&c.x>710)}
  function roadClip(g){g.beginPath();quad.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.clip()}
  function groundLights(g,c,l){if(l.night<.05)return;const sign=c.lane===0?1:-1,point=(x,f)=>road(c.u+x/7,c.v+sign*f/LENGTH);g.save();roadClip(g);
    const front=point(0,2.3),end=point(0,12),beam=g.createLinearGradient(...front,...end);beam.addColorStop(0,`rgba(255,244,202,${l.night*.37*c.alpha})`);beam.addColorStop(1,'rgba(255,244,202,0)');g.fillStyle=beam;g.beginPath();[point(-.75,2.3),point(.75,2.3),point(1.8,12),point(-1.8,12)].forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();
    const rear=point(0,-2.1),tail=g.createRadialGradient(...rear,0,...rear,42);tail.addColorStop(0,`rgba(255,35,43,${l.night*(c.braking?.30:.13)*c.alpha})`);tail.addColorStop(1,'rgba(255,35,43,0)');g.fillStyle=tail;g.fillRect(rear[0]-42,rear[1]-18,84,36);g.restore();
  }
  function paintCar(g,c,l){const sign=c.lane===0?1:-1,P=(x,f,h)=>road(c.u+x/7,c.v+sign*f/LENGTH,h),body=c.taxi?'#edb534':c.color,top=c.taxi?'#ffd35b':'#9aabb5';
    function poly(color,points){g.fillStyle=color;g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill()}
    g.save();g.globalAlpha=c.alpha;const shade=.76+.24*l.day;
    const h=(6+Math.max(0,c.x-735)*.06);poly('#202938',[P(-.95,-2.3,.05),P(.95,-2.3,.05),P(.95,2.3,.05),P(-.95,2.3,.05)]);
    // Tires sit on the road plane; roof and cabin share the same projective body.
    for(const x of [-.79,.79])for(const f of [-1.4,1.4]){const p=P(x,f,.25);g.fillStyle='#171e2a';g.beginPath();g.ellipse(...p,h*.23,h*.28,0,0,Math.PI*2);g.fill();g.fillStyle='#7b8995';g.beginPath();g.ellipse(...p,h*.10,h*.12,0,0,Math.PI*2);g.fill()}
    poly(body,[P(-.85,-2.25,.3),P(.85,-2.25,.3),P(.85,-2.25,.75),P(-.85,-2.25,.75)]);
    poly(body,[P(-.85,-2.25,.3),P(-.85,2.25,.3),P(-.85,2.25,.77),P(-.85,-2.25,.77)]);
    poly(body,[P(.85,-2.25,.3),P(.85,2.25,.3),P(.85,2.25,.77),P(.85,-2.25,.77)]);
    poly(top,[P(-.85,-2.25,.77),P(.85,-2.25,.77),P(.85,2.25,.77),P(-.85,2.25,.77)]);
    poly('#294454',[P(-.72,-1.18,.8),P(-.60,-.73,1.35),P(-.60,.6,1.35),P(-.72,1.25,.8)]);
    poly('#355566',[P(.72,-1.18,.8),P(.60,-.73,1.35),P(.60,.6,1.35),P(.72,1.25,.8)]);
    poly('#426c7c',[P(-.60,.6,1.35),P(.60,.6,1.35),P(.72,1.25,.8),P(-.72,1.25,.8)]);
    poly('#2b4859',[P(-.60,-.73,1.35),P(.60,-.73,1.35),P(.72,-1.18,.8),P(-.72,-1.18,.8)]);
    poly(top,[P(-.60,-.73,1.35),P(.60,-.73,1.35),P(.60,.6,1.35),P(-.60,.6,1.35)]);
    if(c.taxi){poly('#fff0b7',[P(-.25,-.15,1.36),P(.25,-.15,1.36),P(.25,-.15,1.55),P(-.25,-.15,1.55)]);const badge=P(-.87,0,.63);g.fillStyle='#332c24';g.fillRect(badge[0]-h*.09,badge[1]-h*.05,h*.18,h*.10)}
    // Visible faces obey direction: approaching white headlights; receding red tail/brake lamps.
    const lamps=c.lane===0?2.27:-2.27,color=c.lane===0?'#fff4cd':c.braking?'#ff3945':'#ed3040';
    for(const x of [-.60,.60]){const p=P(x,lamps,.63);g.fillStyle=color;g.shadowColor=color;g.shadowBlur=l.night*h*.23;g.fillRect(p[0]-h*.17,p[1]-h*.08,h*.34,h*.16);g.shadowBlur=0}
    g.restore();
  }
  root.CityTraffic={carsAt,paintCar,groundLights,demand,green,road,quad,LENGTH};if(typeof module!=='undefined')module.exports=root.CityTraffic;
})(typeof window==='undefined'?globalThis:window);
