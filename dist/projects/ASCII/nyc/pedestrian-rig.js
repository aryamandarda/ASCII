(function(root){
  'use strict';
  const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
  const mod=(x,n)=>((x%n)+n)%n,smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
  // Height-normalized adult landmarks, not a set of independently moving sprites.
  // Joint centres: thigh 24.5%, shank 24.6%, upper arm 18.6%, forearm 14.6%.
  // See docs/movement-weather.md for measured reference ranges and approximations.
  const body={headTop:-1,headCenter:-.934,headRadius:.064,neckTop:-.883,neckBottom:-.850,
    shoulder:-.826,waist:-.565,hip:-.510,knee:-.270,ankle:-.039,hipWidth:.052,
    thigh:.245,shank:.246,upperArm:.186,forearm:.146,foot:.145,shoulderWidth:.226};
  const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  function turnTowards(a,b,dt){return a+clamp(angleDelta(a,b),-1.6*dt,1.6*dt)}
  // A foot stays in stance for 60% of a complete stride. During stance its
  // displacement is -distance travelled, cancelling the root's forward motion.
  // Swing is a C1 Hermite return with matching velocities at heel strike/toe-off.
  function footCycle(phase,stride=1.35,height=1.75){
    const u=mod(phase/TAU,1),length=stride/height,span=length*.60;
    let forward,lift,roll;
    if(u<.60){forward=span/2-length*u;lift=.012*(1-smooth(u/.12))+.055*smooth((u-.43)/.17);roll=-.30*(1-smooth(u/.12))+.56*smooth((u-.43)/.17)}
    else{const t=(u-.6)/.4,t2=t*t,t3=t2*t;
      forward=(2*t3-3*t2+1)*(-span/2)+(t3-2*t2+t)*(-length*.4)+(-2*t3+3*t2)*(span/2)+(t3-t2)*(-length*.4);
      lift=.055*(1-smooth(t))+.012*smooth((t-.75)/.25)+.80*t*Math.exp(-t/.12)*(1-t)**2;roll=mix(.56,-.30,smooth(t));
    }
    forward-=length*.05;
    return{u,forward,lift,roll,stance:u<.60};
  }
  function solveKnee(hip,ankle){
    const df=ankle[2]-hip[2],dy=ankle[1]-hip[1],d=Math.hypot(df,dy),a=body.thigh,b=body.shank;
    const along=(a*a-b*b+d*d)/(2*d),bend=Math.sqrt(Math.max(0,a*a-along*along));
    return[hip[0],hip[1]+dy*along/d-df*bend/d,hip[2]+df*along/d+dy*bend/d];
  }
  function pose(p){
    const phase=p.step||0,sit=clamp(p.seated||0,0,1),height=1.75*(p.height||1),stride=p.stride||1.35;
    const walking=clamp(p.locomotion===undefined?1:p.locomotion,0,1)*(1-sit);
    const feet=[-1,1].map((side,i)=>({side,...footCycle(phase+i*Math.PI,stride,height)}));
    // Solve pelvis height from the weight-bearing limb, keeping both leg lengths
    // fixed. Double support limits extension instead of stretching the shins.
    // Keep the pelvis close to a level trajectory rather than raising it to
    // the maximum extension of whichever leg happens to bear weight.
    const pelvisYaw=.065*Math.cos(phase)*walking;
    const shoulderYaw=-.055*Math.cos(phase)*walking;
    const shoulderRoll=.025*Math.sin(phase)*walking;
    const lean=(.018+.006*Math.sin(phase*2))*walking;
    const hipForwardShift=-.028*Math.sin(phase*2)*walking;
    const forwardReach=.25*stride/height+.004;
    let hipHeight=Math.min(.510,.051+Math.sqrt(Math.max(.01,.487**2-forwardReach**2))+.012);
    hipHeight=Math.min(hipHeight,...feet.map(f=>{
      const hipForward=hipForwardShift+f.side*body.hipWidth*(p.build||1)*Math.sin(pelvisYaw);
      const swingAllowance=f.stance?0:.12*smooth((f.u-.6)/.08)*smooth((1-f.u)/.08);
      return .039+f.lift+swingAllowance+Math.sqrt(Math.max(.01,(body.thigh+body.shank-.004)**2-(f.forward-hipForward)**2));
    }));
    hipHeight=mix(.505,hipHeight,walking);
    const drop=(.510-hipHeight)*(1-sit)+.205*sit,sway=Math.sin(phase)*.009*walking;
    // Small spinal compensation attenuates head bounce while keeping the skull
    // attached to shoulders. Torso vertices interpolate between both frames.
    const upperDrop=mix(drop,.018+.05*(drop-.018),walking);
    const yaw=p.heading===undefined?Math.atan2(p.dx||1,-(p.vz||-.2)):p.heading;
    const build=p.build||1;
    const hip=[sway,body.hip+drop,hipForwardShift],shoulder=[sway*.45,body.shoulder+upperDrop, lean];
    const legs=feet.map(f=>{
      const joint=[hip[0]+f.side*body.hipWidth*build,hip[1],hipForwardShift+f.side*body.hipWidth*build*Math.sin(pelvisYaw)];
      // A trailing swing leg must not pull the supporting hip down into a
      // crouch. Lift its ankle only enough to stay within fixed-leg reach.
      const reachLift=hipHeight-.039-Math.sqrt(Math.max(.01,(body.thigh+body.shank-.004)**2-(f.forward-joint[2])**2));
      const maxBendDistance=Math.sqrt(body.thigh**2+body.shank**2+2*body.thigh*body.shank*Math.cos(50*Math.PI/180));
      const maxLift=hipHeight-.039-Math.sqrt(Math.max(.001,maxBendDistance**2-(f.forward-joint[2])**2));
      const lift=f.stance?f.lift:Math.max(reachLift,Math.min(f.lift,maxLift));
      const ankle=[joint[0],mix(body.ankle-lift*walking,-.039,sit),mix(f.forward*walking,.22,sit)];
      // Seated ankles stay under bent knees; the same IK keeps segment lengths.
      const knee=solveKnee(joint,ankle);
      return{side:f.side,hip:joint,knee,ankle,stance:f.stance,roll:f.roll*walking};
    });
    const arms=[-1,1].map((side,i)=>{
      // Opposite feet share one stride phase. Their relative advance makes
      // arms alternate exactly, without both drifting behind bent thighs.
      const opposite=legs[1-i],own=legs[i];
      const angle=Math.atan2(opposite.ankle[2]-own.ankle[2],1.0)*.80*(p.armSwing||1),elbowFlex=.16+.12*Math.max(0,-Math.sin(angle));
      const shoulderJoint=[shoulder[0]+side*.112*build,shoulder[1]+.015+side*.112*build*shoulderRoll,shoulder[2]+side*.112*build*Math.sin(shoulderYaw)];
      const upper=mix(angle,-.53,sit),lower=mix(angle+elbowFlex,-1.35,sit);
      const elbow=[shoulderJoint[0]+side*.012,shoulderJoint[1]+Math.sqrt(body.upperArm**2-.012**2)*Math.cos(upper),shoulderJoint[2]+Math.sqrt(body.upperArm**2-.012**2)*Math.sin(upper)];
      const wrist=[elbow[0],elbow[1]+body.forearm*Math.cos(lower),elbow[2]+body.forearm*Math.sin(lower)];
      return{side,shoulder:shoulderJoint,elbow,wrist};
    });
    // Head and hair share one frame. No direction threshold, independent hair
    // offsets or per-frame randomness. Very small, continuous gaze anticipation.
    const head=[shoulder[0],body.headCenter+upperDrop,shoulder[2]+.009*walking],headYaw=yaw+shoulderYaw*.4;
    return{hip,shoulder,head,yaw,headYaw,drop,upperDrop,pelvisYaw,shoulderYaw,shoulderRoll,lean,legs,arms,walking};
  }
  const project=(point,yaw)=>[point[0]*Math.cos(yaw)+point[2]*Math.sin(yaw),point[1]+.16*(point[2]*Math.cos(yaw)-point[0]*Math.sin(yaw))];
  function shell(rings){
    const ring=([y,rx,rz,z=0])=>Array.from({length:8},(_,i)=>[Math.cos(i*TAU/8)*rx,y,z+Math.sin(i*TAU/8)*rz]);
    const points=rings.map(ring),faces=[];
    for(let row=0;row<points.length-1;row++)for(let i=0;i<8;i++)faces.push({row,side:i,points:[points[row][i],points[row][(i+1)%8],points[row+1][(i+1)%8],points[row+1][i]]});
    return faces;
  }
  const torsoMesh=cold=>shell([[-.846,.050,.038],[-.817,cold?.113:.103,.050],[-.779,.111,.068],[-.711,.099,.066],[-.646,.081,.052],[-.552,.088,.061]]);
  const neckMesh=()=>shell([[body.neckTop,.022,.025,.012],[body.neckBottom+.01,.026,.028,.012]]);
  function paint(g,p,light,weather){
    const h=p.h*p.height,x=p.x,y=p.y,r=pose(p),back=(1-Math.cos(r.yaw))/2;
    const shade=.78+.22*light.day,cold=weather&&weather.temperature<8;
    const color=(hex,gain=1)=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));return `rgb(${(root.CityEnvironment?root.CityEnvironment.materialColor(rgb,light,gain):rgb.map(v=>Math.round(clamp(v*shade*gain,0,255)))).join(',')})`};
    const P=point=>{const q=project(point,r.yaw);return[x+q[0]*h,y+q[1]*h]};
    function line(hex,width,points,gain=1){g.strokeStyle=color(hex,gain);g.lineWidth=h*width;g.lineCap='round';g.lineJoin='round';g.beginPath();points.forEach((v,i)=>i?g.lineTo(...P(v)):g.moveTo(...P(v)));g.stroke()}
    function poly(hex,points,gain=1){g.fillStyle=color(hex,gain);g.beginPath();points.forEach((v,i)=>i?g.lineTo(...P(v)):g.moveTo(...P(v)));g.closePath();g.fill()}
    const torso=(lateral,vertical,forward=0)=>{
      const t=clamp((-.510-vertical)/.316,0,1),twist=mix(r.pelvisYaw,r.shoulderYaw,t),lx=lateral*(p.build||1);
      return[lx*Math.cos(twist)-forward*Math.sin(twist)+mix(r.hip[0],r.shoulder[0],t),vertical+mix(r.drop,r.upperDrop,t)+lx*r.shoulderRoll*t,forward*Math.cos(twist)+lx*Math.sin(twist)+r.lean*t+r.hip[2]*(1-t)];
    };
    const pants=['#354054','#536178','#383b42','#56514b'][mod(p.id,4)];
    g.save();g.globalAlpha=.19;g.fillStyle='#101321';g.beginPath();g.ellipse(x,y+1,h*.15,h*.021,0,0,TAU);g.fill();g.globalAlpha=1;
    function limb(hex,points,widths,gain=1){
      // A single tapered contour joins the limb; no visible rod ends at knees.
      const q=points.map(P),left=[],right=[];
      for(let i=0;i<q.length;i++){
        const a=q[Math.max(0,i-1)],b=q[Math.min(q.length-1,i+1)],d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
        const nx=-(b[1]-a[1])/d*h*widths[i],ny=(b[0]-a[0])/d*h*widths[i];
        left.push([q[i][0]+nx,q[i][1]+ny]);right.push([q[i][0]-nx,q[i][1]-ny]);
      }
      g.fillStyle=color(hex,gain);g.beginPath();[...left,...right.reverse()].forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();
    }
    const leg=l=>{
      const calf=l.knee.map((v,i)=>mix(v,l.ankle[i],.40));
      limb(pants,[l.hip,l.knee,calf,l.ankle],[.049,.030,.034,.022],l.side<0?.87:1);
      const a=l.ankle,toe=[a[0],a[1]+.022+Math.sin(l.roll)*.10,a[2]+.10],heel=[a[0],a[1]+.020-Math.sin(l.roll)*.04,a[2]-.04];
      line('#343c46',.034,[heel,toe]);line('#343c46',.032,[a,[a[0],a[1]+.018,a[2]+.022]]);
      line('#777d83',.005,[[heel[0],heel[1]+.012,heel[2]],[toe[0],toe[1]+.012,toe[2]]]);
    };
    r.legs.slice().sort((a,b)=>project(a.hip,r.yaw)[1]-project(b.hip,r.yaw)[1]).forEach(leg);
    const arm=a=>{line(p.coat,cold?.068:.056,[a.shoulder,a.shoulder.map((v,i)=>mix(v,a.elbow[i],.15))],a.side<0?.87:1);limb(p.coat,[a.shoulder,a.elbow,a.wrist],[cold?.038:.030,.025,.017],a.side<0?.87:1);
      line(p.skin,.029,[a.wrist,[a.wrist[0],a.wrist[1]+.037,a.wrist[2]+.005]])};
    const sortedArms=r.arms.slice().sort((a,b)=>project(a.shoulder,r.yaw)[1]-project(b.shoulder,r.yaw)[1]);arm(sortedArms[0]);
    poly(pants,[torso(-.087,-.573),torso(.087,-.573),torso(.089,-.482),torso(0,-.474),torso(-.089,-.482)]);
    // A closed, faceted ribcage has real side walls, not two zero-width planes.
    // Stable cloth panels/folds provide tonal variation before the ASCII pass.
    const depth=face=>face.points.reduce((v,p)=>v+p[2]*Math.cos(r.yaw)-p[0]*Math.sin(r.yaw),0)/4;
    const paintShell=(faces,hex)=>faces.sort((a,b)=>depth(a)-depth(b)).forEach(f=>{
      const angle=(f.side+.5)*TAU/8,grain=.025*Math.sin(p.id*3+f.row*1.7+f.side*2.1);
      poly(hex,f.points.map(v=>torso(...v)),.94+.04*Math.sin(angle)+grain*.3);
    });
    paintShell(shell([[-.573,.087,.057],[-.483,.089,.060]]),pants);
    paintShell(torsoMesh(cold),p.coat);
    g.globalAlpha=Math.max(0,Math.cos(r.yaw));poly('#d1c9b5',[torso(-.031,-.835,.043),torso(.031,-.835,.043),torso(.017,-.785,.070),torso(-.017,-.785,.070)]);
    line(p.coat,.010,[torso(0,-.811,.071),torso(0,-.716,.078),torso(0,-.56,.065)],.66);
    for(const side of [-1,1]){line(p.coat,.007,[torso(side*.055,-.69,.068),torso(side*.064,-.655,.066),torso(side*.054,-.612,.065)],1.13);line(p.coat,.006,[torso(side*.055,-.651,.066),torso(side*.080,-.644,.06)],.69)}g.globalAlpha=1;
    arm(sortedArms[1]);
    paintShell(neckMesh(),p.skin);
    if(cold)line(p.coat,.028,[torso(-.045,-.844,.02),torso(.045,-.844,.02)],.73);
    const head=P(r.head),hx=head[0],hy=head[1],rx=h*.052,ry=h*body.headRadius,face=Math.cos(r.headYaw),profile=Math.sin(r.headYaw);
    g.save();g.beginPath();
    // A stable forehead, nose bridge, jaw and chin replace the oval mask in
    // profile; front/back smoothly retain the rounded skull silhouette.
    const profileShape=[[-.82,-.7],[-.35,-1],[.45,-.92],[.75,-.55],[.78,-.12],[1.12,.14],[.78,.23],[.77,.62],[.44,.91],[-.18,.87],[-.72,.43],[-.95,-.15]];
    const strength=Math.abs(profile),sign=profile<0?-1:1;
    profileShape.forEach(([xx,yy],i)=>{const roundX=xx/Math.max(1,Math.abs(xx))*.96,px=hx+sign*rx*mix(roundX,xx,strength),py=hy+ry*yy;i?g.lineTo(px,py):g.moveTo(px,py)});g.closePath();g.clip();g.fillStyle=color(p.hair);g.fillRect(hx-rx,hy-ry,rx*2,ry*2);
    // Skin visibility varies continuously; hair remains attached to the skull.
    g.globalAlpha=smooth((face+.35)/.5);g.fillStyle=color(p.skin);g.beginPath();g.ellipse(hx+profile*rx*.60,hy+ry*.19,rx*(.70+.18*Math.max(0,face)),ry*.83,0,0,TAU);g.fill();
    g.globalAlpha=1;g.fillStyle=color(p.hair);g.beginPath();g.ellipse(hx-profile*rx*.1,hy-ry*.65,rx*1.02,ry*(p.id%3===0?.47:.36),0,0,TAU);g.fill();g.restore();
    // Ear and nose are subpixel cues in the distance, visible only nearby.
    if(h>38){g.globalAlpha=smooth((face+.2)/.65);g.fillStyle=color(p.skin,.90);g.beginPath();g.ellipse(hx-profile*rx*.42,hy+ry*.10,h*.010,h*.016,0,0,TAU);g.fill();
      g.fillStyle=color(p.skin,1.06);g.beginPath();g.ellipse(hx+profile*rx*.86,hy+ry*.15,h*.009,h*.014,0,0,TAU);g.fill();
      g.globalAlpha=smooth((face+.15)/.7);g.fillStyle=color('#40352e');
      for(const side of [-1,1]){g.beginPath();g.ellipse(hx+profile*rx*.44+side*rx*.34*Math.max(0,face),hy-ry*.06,h*.0038,h*.0048,0,0,TAU);g.fill()}
      g.strokeStyle=color(p.skin,.72);g.lineWidth=h*.003;g.beginPath();g.moveTo(hx+profile*rx*.6-rx*.16,hy+ry*.52);g.lineTo(hx+profile*rx*.6+rx*.16,hy+ry*.52);g.stroke();g.globalAlpha=1;}
    if(p.id%4===0){g.globalAlpha=smooth((back-.25)/.5);poly('#484a52',[torso(-.065,-.77,-.05),torso(.065,-.77,-.05),torso(.068,-.60,-.05),torso(-.068,-.60,-.05)]);g.globalAlpha=1;}
    g.restore();
  }
  root.PedestrianRig={body,pose,paint,footCycle,solveKnee,project,angleDelta,turnTowards,torsoMesh,neckMesh};
  if(typeof module!=='undefined')module.exports=root.PedestrianRig;
})(typeof window==='undefined'?globalThis:window);
