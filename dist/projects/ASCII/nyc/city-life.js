(function(root){
  const weights=[.32,.15,.09,.055,.04,.06,.18,.43,.65,.44,.25,.47,.94,1,.71,.76,.99,1.08,1.03,.83,.73,.64,.51,.39];
  const daily=220000,total=weights.reduce((a,b)=>a+b,0),peak=Math.max(...weights);
  const coats=['#28adb9','#bd4a74','#ce8c4d','#5d81a8','#748360','#ad6060','#d1bb86','#495368','#8c79a4','#afb9b1'],skins=['#e8ba93','#a46d4b','#70452f','#d4976d','#c88457'];
  const random=n=>{const v=Math.sin(n*127.1+19.7)*43758.5453;return v-Math.floor(v)},mod=(n,m)=>((n%m)+m)%m,smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const routes=[
    [[-240,735],[420,690],[680,690],[950,752],[1520,870]],
    [[-240,782],[230,733],[515,726],[850,742],[1060,760],[1520,845]],
    [[-240,1000],[380,920],[730,880],[1520,1000]],
    [[-240,712],[420,675],[680,680],[950,745],[1520,850]],
    [[-240,842],[350,804],[650,784],[950,788],[1520,910]],
    [[-240,920],[250,870],[620,776],[900,755],[1520,880]]
  ];
  // District flow remains calibrated. Only the visual arrival rate is nonlinear.
  const densityMultiplier=ratio=>.38+1.65*Math.pow(clamp(ratio,0,1),1.55);
  const renderDensity=ratio=>clamp(ratio*densityMultiplier(ratio),.04,1);
  function trafficAt(hour){const h=mod(hour,24),i=Math.floor(h),f=h-i,w=weights[i]*(1-f)+weights[(i+1)%24]*f,ratio=w/peak;return{hour:h,flow:Math.round(w/total*daily),count:Math.max(4,Math.round(renderDensity(ratio)*125)),ratio,multiplier:densityMultiplier(ratio)}}
  function unproject(p){const z=1440/(p[1]-600);return[(p[0]-640)*z/800,z]}
  function project(p){return{x:640+800*p[0]/p[1],y:600+1440/p[1],h:1400/p[1]}}
  function groundPath(p){const lengths=p.slice(1).map((v,i)=>distance(v,p[i]));return{p,lengths,length:lengths.reduce((a,b)=>a+b,0)}}
  function path(points){return groundPath(points.map(unproject))}
  function appearance(id){return{id,coat:coats[mod(id,coats.length)],skin:skins[mod(id,skins.length)],hair:['#29252b','#49352d','#ab946d','#8b8d94'][mod(id,4)],height:.93+random(id+11)*.14,stride:.78+random(id+26)*.29,gait:.75+random(id+31)*.40,armSwing:.7+random(id+32)*.55,bob:.0015+random(id+36)*.002,paceInterval:7+random(id+38)*12,phase:random(id+39)*Math.PI*2,radius:.225+random(id+41)*.035}};
  // A few occupied pockets of furniture, with clear walking space between them.
  // Chair angles are ground-plane bearings, so opposite chairs really face inward.
  const tables=[
    {id:0,x:136,y:814,size:.96,chairs:[{angle:12,radius:.72},{angle:193,radius:.76}]},
    {id:1,x:414,y:778,size:.91,chairs:[{angle:28,radius:.74},{angle:151,radius:.73},{angle:270,radius:.81}]},
    {id:2,x:739,y:832,size:1.02,chairs:[{angle:215,radius:.83}]},
    {id:3,x:1077,y:795,size:.98,chairs:[{angle:4,radius:.78},{angle:96,radius:.73},{angle:188,radius:.79},{angle:280,radius:.76}]}
  ];
  const tableScale=t=>project(unproject([t.x,t.y])).h;
  const seats=tables.flatMap(table=>table.chairs.map((chair,index)=>{
    const center=unproject([table.x,table.y]),angle=chair.angle*Math.PI/180;
    const ground=[center[0]+Math.cos(angle)*chair.radius,center[1]+Math.sin(angle)*chair.radius];
    const facing=[-Math.cos(angle),-Math.sin(angle)];
    return{tableId:table.id,index,ground,facing,...project(ground)};
  }));
  const obstacles=tables.map(t=>({id:t.id,p:unproject([t.x,t.y]),radius:Math.max(...t.chairs.map(c=>c.radius))+.23}));
  const trips=new Map(),SLOT=.9,MAX_TRIP=600;
  function trip(slot){
    if(trips.has(slot))return trips.get(slot);
    const birth=slot*SLOT,ratio=trafficAt(CityCalendar.parts(birth*60000).hour).ratio;let result=null;
    if(random(slot+5)<renderDensity(ratio)){
      const template=routes[Math.floor(random(slot+9)*routes.length)];
      let points=template.map((p,i)=>[p[0]+(i===0||i===template.length-1?0:(random(slot+i*17)-.5)*100),p[1]+(random(slot+i*23+17)-.5)*28]);
      // Each journey gets different destinations and bends, not just a lateral offset.
      if(random(slot+3)>.5)points.reverse();
      const route=navigate(path(points)),speed=.43+random(slot+6)*.17;
      result={...appearance(slot),birth,route,speed,duration:route.length/(speed*.8),kind:'walk'};
    }
    trips.set(slot,result);if(trips.size>8000)trips.delete(trips.keys().next().value);return result;
  }
  function visit(cycle,seat){
    const chair=seats[seat],table=tables[chair.tableId],id=1000000000+cycle*32+seat,birth=cycle*430-seat*41;
    if(random(id+33)>.10+.84*trafficAt(CityCalendar.parts(birth*60000).hour).ratio)return null;
    const edge=table.x<640?-240:1520,approach=project(chair.ground.map((v,i)=>v-chair.facing[i]*.65));
    const route=navigate(path([[edge,table.y+120],[approach.x,table.y+105],[approach.x,approach.y],[chair.x,chair.y]]),table.id);
    return{...appearance(id),birth,route,speed:.43+random(id+12)*.10,duration:route.length/.34,kind:'visit',seat,tableId:table.id,sitFacing:chair.facing,dwell:120+random(id+20)*65};
  }
  function inPlaza(p){const q=project(p);if(q.x<735||q.x>1500)return true;return q.y-q.h*.06>642+(q.x-735)*148/765+2}
  function segmentDistance(a,b,p){const dx=b[0]-a[0],dz=b[1]-a[1],d=dx*dx+dz*dz,t=d?clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dz)/d,0,1):0;return Math.hypot(a[0]+dx*t-p[0],a[1]+dz*t-p[1])}
  // Static visibility graph routes around furniture before local crowd avoidance.
  const navigation=new Map();
  function navigate(route,ownTable){
    const key=ownTable===undefined?-1:ownTable,obs=obstacles.filter(o=>o.id!==ownTable),margin=o=>o.radius+.31,orbit=o=>(margin(o)+.05)/Math.cos(Math.PI/12);
    // A walker may be inside the planning cushion after yielding to someone.
    // Let it move outward, while never cutting closer to the physical obstacle.
    const visible=(a,b)=>obs.every(o=>segmentDistance(a,b,o.p)>Math.min(margin(o),distance(a,o.p),distance(b,o.p))-.001)&&inPlaza([(a[0]+b[0])/2,(a[1]+b[1])/2]);
    if(!navigation.has(key)){
      const nodes=obs.flatMap(o=>Array.from({length:12},(_,i)=>[o.p[0]+Math.cos(i*Math.PI/6)*orbit(o),o.p[1]+Math.sin(i*Math.PI/6)*orbit(o)])).filter(p=>inPlaza(p)&&obs.every(o=>distance(p,o.p)>margin(o)));
      const edges=nodes.map((a,i)=>nodes.flatMap((b,j)=>i!==j&&visible(a,b)?[[j,distance(a,b)]]:[]));navigation.set(key,{nodes,edges});
    }
    const {nodes,edges}=navigation.get(key),planned=[route.p[0]];
    for(let i=1;i<route.p.length;i++){
      let end=[...route.p[i]];
      // Moving a waypoint out of one table's clearance can put it inside its
      // neighbor. Choose from nodes already checked against EVERY obstacle.
      if(!inPlaza(end)||obs.some(o=>distance(end,o.p)<margin(o))){
        const nearest=nodes.reduce((best,p)=>!best||distance(p,end)<distance(best,end)?p:best,null);
        if(!nearest)continue;end=[...nearest];
      }
      const start=planned[planned.length-1];
      if(visible(start,end)){planned.push(end);continue}
      const all=[...nodes,start,end],n=all.length,cost=Array(n).fill(Infinity),prev=Array(n).fill(-1),seen=new Set();cost[n-2]=0;
      for(let step=0;step<n;step++){
        let u=-1;for(let j=0;j<n;j++)if(!seen.has(j)&&(u<0||cost[j]<cost[u]))u=j;
        if(u<0||cost[u]===Infinity||u===n-1)break;seen.add(u);
        const links=u<nodes.length?[...edges[u],...(visible(all[u],end)?[[n-1,distance(all[u],end)]]:[])]:all.flatMap((b,j)=>u!==j&&visible(all[u],b)?[[j,distance(all[u],b)]]:[]);
        for(const [v,d]of links)if(cost[u]+d<cost[v]){cost[v]=cost[u]+d;prev[v]=u}
      }
      const detour=[];let u=n-1;while(prev[u]>=0){detour.unshift(all[u]);u=prev[u]}
      // An unreachable intermediate point must never become a walking target.
      if(u===n-2)planned.push(...detour);
    }
    return groundPath(planned);
  }
  const STEP=.125,BLOCK=120,WARMUP=360,blocks=new Map(),checkpoints=new Map();
  const copyAgent=a=>({...a,pos:[...a.pos]});
  const snapshot=a=>({definition:a.definition,pos:[...a.pos],vx:a.vx,vz:a.vz,travelled:a.travelled,sitting:a.sitting,waypoint:a.waypoint,route:a.route});
  function buildBlock(key){
    const start=key*BLOCK,seed=checkpoints.get(key),begin=seed?start:start-WARMUP;
    const agents=seed?seed.agents.map(copyAgent):[],pending=seed?[...seed.pending]:[],frames=[];
    let slot=seed?seed.slot:Math.floor(begin/SLOT)-1;
    const visits=seed?[...seed.visits]:Array.from({length:seats.length},(_,seat)=>Math.floor((begin+seat*41)/430)-1);
    if(seed)frames.push(agents.map(snapshot));
    const save=()=>({agents:agents.map(copyAgent),pending:[...pending],slot,visits:[...visits]});
    function queue(spec){if(spec&&spec.route.p.length>1)pending.push(spec)}
    for(let tick=seed?1:0;tick<=(BLOCK+start-begin)/STEP;tick++){
      const t=begin+tick*STEP;
      const comfort=1.08;
      while((slot+1)*SLOT<=t){slot++;queue(trip(slot))}
      visits.forEach((cycle,seat)=>{while((visits[seat]+1)*430-seat*41<=t){visits[seat]++;queue(visit(visits[seat],seat))}});
      for(let i=pending.length-1;i>=0;i--){const spec=pending[i],p=spec.route.p[0];if(agents.some(a=>distance(a.pos,p)<a.radius+spec.radius+.08))continue;agents.push({...spec,definition:spec,pos:[...p],vx:0,vz:0,waypoint:1,travelled:0,sitting:0,departing:false,entered:false});pending.splice(i,1)}
      // Rotate priority so one walker does not always win a crossing.
      agents.sort((a,b)=>a.id-b.id);
      const offset=agents.length?Math.floor(t/STEP)%agents.length:0;
      for(let turn=0;turn<agents.length;turn++){
        const a=agents[(turn+offset)%agents.length];
        if(a.done)continue;const screen=project(a.pos);if(screen.x>-140&&screen.x<1420)a.entered=true;if(a.entered&&(screen.x< -160||screen.x>1440)){a.done=true;continue}
        if(a.sitStart!==undefined&&!a.departing){
          a.sitting=smooth((t-a.sitStart)/2);a.vx=a.vz=0;
          if(t<a.sitStart+a.dwell)continue;
          a.departing=true;a.route=groundPath(a.route.p.slice().reverse());a.waypoint=1;a.leaveStart=t;
        }
        a.sitting=a.departing?1-smooth((t-a.leaveStart)/2):0;
        let target=a.route.p[a.waypoint],gap=distance(a.pos,target);
        while(a.waypoint<a.route.p.length-1){
          const next=a.route.p[a.waypoint+1],shortcut=gap<1.15&&obstacles.every(o=>o.id===a.tableId||segmentDistance(a.pos,next,o.p)>o.radius+a.radius+.06)&&inPlaza([(a.pos[0]+next[0])/2,(a.pos[1]+next[1])/2]);
          if(gap>=.25&&!shortcut)break;
          target=a.route.p[++a.waypoint];gap=distance(a.pos,target);
        }
        if(gap<.085&&a.waypoint===a.route.p.length-1){
          if(a.kind==='visit'&&!a.departing){a.sitStart=t;a.vx=a.vz=0;continue}
          a.done=true;continue;
        }
        // Detect lack of progress, including pacing in place, rather than only
        // zero velocity. Replan a clear route without teleporting the walker.
        if(a.progressAt===undefined||a.progressWaypoint!==a.waypoint||gap<a.progressGap-.25){
          a.progressAt=t;a.progressWaypoint=a.waypoint;a.progressGap=gap;
        }else if(t-a.progressAt>18+random(a.id)*8){
          const replanned=navigate(groundPath([[...a.pos],a.route.p[a.route.p.length-1]]),a.tableId);
          if(replanned.p.length>1){a.route=replanned;a.waypoint=1;a.progressAt=undefined}else a.progressAt=t;
          continue;
        }
        const fx=(target[0]-a.pos[0])/gap,fz=(target[1]-a.pos[1])/gap;
        const pace=.80+.12*Math.sin(t/a.paceInterval*Math.PI*2+a.phase),weave=Math.sin(t/(a.paceInterval*.73)+a.phase)*.065;
        let vx=(fx-fz*weave)*a.speed*pace,vz=(fz+fx*weave)*a.speed*pace;
        const neighbors=agents.filter(b=>b!==a&&!b.done&&distance(a.pos,b.pos)<2.2);
        for(const b of neighbors){
          const nx=a.pos[0]+a.vx*.85-b.pos[0]-b.vx*.85,nz=a.pos[1]+a.vz*.85-b.pos[1]-b.vz*.85,d=Math.hypot(nx,nz),push=Math.max(0,comfort-d)*.65;
          if(d>.001){vx+=nx/d*push;vz+=nz/d*push}
          if(push>.12){vx-=fz*.15;vz+=fx*.15}
        }
        for(const o of obstacles){if(o.id===a.tableId)continue;const nx=a.pos[0]-o.p[0],nz=a.pos[1]-o.p[1],d=Math.hypot(nx,nz),push=Math.max(0,o.radius+a.radius+.5-d)*.85;if(d>0){vx+=nx/d*push;vz+=nz/d*push}}
        const magnitude=Math.hypot(vx,vz),limit=a.speed*(1-.45*a.sitting);if(magnitude>limit){vx*=limit/magnitude;vz*=limit/magnitude}
        const clear=p=>inPlaza(p)&&neighbors.every(b=>segmentDistance(a.pos,p,b.pos)>=a.radius+b.radius+.025)&&obstacles.every(o=>o.id===a.tableId||segmentDistance(a.pos,p,o.p)>=o.radius+a.radius);
        let chosen=null,best=-Infinity;
        const preferred=[vx,vz],walking=a.speed*pace*(1-.45*a.sitting);
        const candidates=[preferred,...[0,.35,-.35,.7,-.7,1.05,-1.05,1.4,-1.4,1.8,-1.8,2.3,-2.3,Math.PI].map(angle=>{
          const c=Math.cos(angle),s=Math.sin(angle);return[(fx*c-fz*s)*walking,(fz*c+fx*s)*walking];
        })];
        for(const [cx,cz] of candidates){
          const dx=cx*STEP,dz=cz*STEP,p=[a.pos[0]+dx,a.pos[1]+dz];
          if(!clear(p))continue;
          let score=(cx*fx+cz*fz)*.7-(Math.hypot(cx-vx,cz-vz))*.18;
          for(const b of neighbors){
            const d=Math.hypot(p[0]+cx*.7-b.pos[0]-b.vx*.7,p[1]+cz*.7-b.pos[1]-b.vz*.7);
            score-=Math.max(0,a.radius+b.radius+.25-d)*.9;
          }
          // Keep a slight, consistent side preference when two walkers meet.
          score+=(cz*fx-cx*fz)*.028;
          if(score>best){best=score;chosen=p}
        }
        if(chosen){const dx=chosen[0]-a.pos[0],dz=chosen[1]-a.pos[1];a.travelled+=Math.hypot(dx,dz);a.pos=chosen;a.vx=dx/STEP;a.vz=dz/STEP}else{a.vx=a.vz=0}
      }
      for(let i=agents.length-1;i>=0;i--)if(agents[i].done)agents.splice(i,1);
      if(t===start&&!seed)checkpoints.set(key,save());
      if(t>=start)frames.push(agents.map(snapshot));
    }
    checkpoints.set(key+1,save());
    const block={start,frames};blocks.set(key,block);if(blocks.size>16)blocks.delete(blocks.keys().next().value);return block;
  }
  function peopleAt(time){
    const key=Math.floor(time/BLOCK);
    if(!blocks.has(key)&&!checkpoints.has(key)){
      const previous=[...checkpoints.keys()].filter(k=>k<key&&key-k<=12).sort((a,b)=>b-a)[0];
      if(previous!==undefined)for(let k=previous;k<key;k++)if(!checkpoints.has(k+1))buildBlock(k);
    }
    const b=blocks.get(key)||buildBlock(key),position=(time-b.start)/STEP,i=Math.floor(position),f=position-i;
    const frame=b.frames[i],next=new Map((b.frames[i+1]||frame).map(a=>[a.definition.id,a]));
    return frame.map(a=>{const n=next.get(a.definition.id)||a,p=a.pos.map((v,i)=>v+(n.pos[i]-v)*f),q=project(p),travelled=a.travelled+(n.travelled-a.travelled)*f;
      return{...a.definition,...a,...q,ground:p,dx:Math.abs(a.vx)>.01?a.vx:(a.route.p[a.waypoint][0]-a.pos[0]),back:a.sitting>.5?a.definition.sitFacing[1]>.15:a.vz>.04,seated:a.sitting+(n.sitting-a.sitting)*f,step:a.definition.phase+travelled/a.definition.stride*Math.PI*2};
    }).filter(p=>p.x>-210&&p.x<1490);
  }
  // Adult proportions in units of standing height. The pelvis joins the torso
  // to two separate thighs; leg swing pivots below the waist, never in the chest.
  const body={headTop:-1,headCenter:-.923,headRadius:.069,shoulder:-.795,waist:-.505,hip:-.435,knee:-.235,ankle:-.035,hipWidth:.071};
  function legPose(phase,side,dir,gait=1){
    const a=phase+(side<0?Math.PI:0),swing=Math.sin(a),lift=Math.max(0,Math.cos(a));
    const hip=[side*body.hipWidth,body.hip];
    const ankle=[hip[0]+dir*swing*.032*gait,body.ankle-lift*.023*gait];
    const knee=[hip[0]+(ankle[0]-hip[0])*.48+dir*lift*.009,body.knee+lift*.012];
    return{hip,knee,ankle};
  }
  function paintWalker(g,p,light){
    const h=p.h*p.height,x=p.x,y=p.y,dir=p.dx>0?1:-1,sit=p.seated||0,phase=p.step,seatDirection=p.sitFacing?p.sitFacing[0]:dir;
    const swing=Math.sin(phase)*(1-sit)*(p.armSwing||1),drop=.185*sit,bob=(1-sit)*Math.abs(Math.cos(phase))*(p.bob||.0025)*h;
    const shade=.82+.18*light.day,color=c=>`rgb(${[1,3,5].map(i=>Math.round(parseInt(c.slice(i,i+2),16)*shade)).join(',')})`;
    function line(c,width,points){g.strokeStyle=color(c);g.lineWidth=h*width;g.lineCap='round';g.lineJoin='round';g.beginPath();points.forEach(([a,b],i)=>i?g.lineTo(x+a*h,y+b*h-bob):g.moveTo(x+a*h,y+b*h-bob));g.stroke()}
    function poly(c,points){g.fillStyle=color(c);g.beginPath();points.forEach(([a,b],i)=>i?g.lineTo(x+a*h,y+b*h-bob):g.moveTo(x+a*h,y+b*h-bob));g.closePath();g.fill()}
    g.globalAlpha=.17;g.fillStyle='#111426';g.beginPath();g.ellipse(x,y+2,h*.14,h*.022,0,0,Math.PI*2);g.fill();g.globalAlpha=1;
    const waist=body.waist+drop,hip=body.hip+drop,shoulder=body.shoulder+drop;
    const pants=p.id%3===0?'#68768b':'#384457';
    for(const side of [-1,1]){
      const leg=legPose(phase,side,dir,p.gait||1),seatedKnee=[seatDirection*.19+side*.055,-.23],seatedAnkle=[seatDirection*.21+side*.057,-.035];
      const blend=(a,b)=>a.map((v,i)=>v+(b[i]-v)*sit),knee=blend(leg.knee,seatedKnee),ankle=blend(leg.ankle,seatedAnkle);
      line(pants,.081,[[leg.hip[0],hip],knee]);line(pants,.067,[knee,ankle]);
      line('#283243',.047,[[ankle[0]-.015*dir,ankle[1]],[ankle[0]+.052*dir,ankle[1]]]);
    }
    // A full-width waistband and tapered pelvis close the gap above the thighs.
    poly(pants,[[-.098,waist-.012],[.098,waist-.012],[.106,hip+.018],[.044,hip+.025],[0,hip+.009],[-.044,hip+.025],[-.106,hip+.018]]);
    poly(p.coat,[[-.06,shoulder-.02],[.06,shoulder-.02],[.118,shoulder+.028],[.108,waist-.016],[.088,waist+.012],[-.088,waist+.012],[-.108,waist-.016],[-.118,shoulder+.028]]);
    for(const side of [-1,1]){
      const hand=[(side*.143-swing*side*.032)*(1-sit)+seatDirection*.22*sit,(-.455)*(1-sit)+(-.415)*sit];
      line(p.coat,.052,[[side*.112,shoulder+.04],[side*.145*(1-sit)+seatDirection*.10*sit,shoulder+.18],hand]);
      line(p.skin,.037,[hand,[hand[0],hand[1]+.034]]);
    }
    line(p.skin,.05,[[0,-.858+drop],[0,shoulder+.025]]);
    g.fillStyle=color(p.back?p.hair:p.skin);g.beginPath();g.ellipse(x+dir*h*.008,y+(body.headCenter+drop)*h-bob,h*.057,h*body.headRadius,0,0,Math.PI*2);g.fill();
    poly(p.hair,[[-.054,-.933+drop],[-.047,-.983+drop],[.033,-.99+drop],[.058,-.949+drop],[.014,-.957+drop],[-.004,-.928+drop]]);
    if(p.back&&p.id%3===0)poly('#625c68',[[-.067,shoulder+.08],[.067,shoulder+.08],[.071,waist-.045],[-.067,waist-.045]]);
    g.globalAlpha=.12+.18*light.night;line('#bfe7ec',.008,[[-.103,shoulder+.05],[-.094,waist-.04]]);g.globalAlpha=1;
  }
  // Furniture is projected in 3D rather than mirrored copies of a side view.
  function raised(p,height){const q=project(p);return[q.x,q.y-height*800/p[1]]}
  function paintChair(g,c){
    const f=c.facing,r=[f[1],-f[0]],P=(x,z,h)=>raised([c.ground[0]+r[0]*x+f[0]*z,c.ground[1]+r[1]*x+f[1]*z],h);
    const line=points=>{g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.stroke()};
    g.save();g.lineWidth=Math.max(1,800/c.ground[1]*.022);g.strokeStyle='#c54559';g.lineCap='round';
    for(const x of [-.20,.20]){
      line([P(x,-.23,0),P(x,.18,.45)]);line([P(x,.23,0),P(x,-.19,.45),P(x,-.23,.84)]);
    }
    g.fillStyle='#c93c50';g.beginPath();[P(-.21,-.2,.45),P(.21,-.2,.45),P(.21,.2,.45),P(-.21,.2,.45)].forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();
    g.strokeStyle='#e16a78';line([P(-.21,-.2,.46),P(.21,-.2,.46)]);
    g.lineWidth=Math.max(1.2,800/c.ground[1]*.043);g.strokeStyle='#ce465b';
    for(const h of [.66,.76,.83])line([P(-.20,-.23,h),P(.20,-.23,h)]);
    g.restore();
  }
  function paintChairs(g,t){for(const c of seats.filter(c=>c.tableId===t.id))paintChair(g,c)}
  function paintTable(g,t){
    const center=unproject([t.x,t.y]),radius=.50*t.size,height=.75;
    const P=(x,z,h)=>raised([center[0]+x,center[1]+z],h),line=points=>{g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.stroke()};
    g.save();g.lineWidth=Math.max(1,800/center[1]*.025);g.strokeStyle='#b7384e';
    for(const side of [-1,1])line([P(side*.29,-.16,0),P(-side*.18,-.10,height)]);
    for(const side of [-1,1])line([P(side*.27,.16,0),P(-side*.18,.10,height)]);
    g.fillStyle=['#d94b5b','#cf4455','#df5364','#cb4155'][t.id];g.beginPath();
    for(let i=0;i<32;i++){const a=i*Math.PI/16,p=P(Math.cos(a)*radius,Math.sin(a)*radius,height);i?g.lineTo(...p):g.moveTo(...p)}g.closePath();g.fill();g.strokeStyle='#ee7b89';g.stroke();
    if(t.id!==2){const cup=P(t.id%2?.16:-.13,.08,height);g.fillStyle='#e8dfd0';g.fillRect(cup[0],cup[1]-800/center[1]*.10,800/center[1]*.055,800/center[1]*.10)}
    g.restore();
  }
  function furnitureLayers(){return[
    ...tables.map(t=>({y:t.y,paint:g=>paintTable(g,t)})),
    ...seats.map(c=>({y:c.y+(c.facing[1]>.1?1:-1),paint:g=>paintChair(g,c)}))
  ]}
  root.CityLife={weights,daily,trafficAt,peopleAt,paintWalker,paintTable,paintChairs,paintChair,furnitureLayers,tables,seats,tableScale,project,unproject,trip,SLOT,MAX_TRIP,legPose,body,densityMultiplier,renderDensity,obstacles,STEP,BLOCK};if(typeof module!=='undefined')module.exports=root.CityLife;
})(typeof window==='undefined'?globalThis:window);
