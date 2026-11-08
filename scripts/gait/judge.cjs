const path=require('node:path'),fs=require('node:fs');
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const range=a=>Math.max(...a)-Math.min(...a);
const angle=l=>{const a=l.hip.map((v,i)=>v-l.knee[i]),b=l.ankle.map((v,i)=>v-l.knee[i]);return 180-Math.acos(Math.max(-1,Math.min(1,a.reduce((s,v,i)=>s+v*b[i],0)/Math.hypot(...a)/Math.hypot(...b))))*180/Math.PI};
function judge(R){const cases=[];for(const height of [.93,1,1.07])for(const stride of [1.13,1.36,1.52]){
 const poses=Array.from({length:720},(_,i)=>R.pose({step:i/720*Math.PI*2,height,stride,heading:Math.PI/2}));
 let boundaryJump=0,boneError=0,stanceAngles=[],swingAngles=[],armsError=0,stanceGroundError=0;
 for(const u of [0,.1,.5,.6,1]){const a=R.pose({step:(u-1e-7)*Math.PI*2,height,stride}),b=R.pose({step:(u+1e-7)*Math.PI*2,height,stride});for(const key of ['hip','shoulder','head'])boundaryJump=Math.max(boundaryJump,distance(a[key],b[key])*175*height);for(let i=0;i<2;i++)for(const key of ['hip','knee','ankle'])boundaryJump=Math.max(boundaryJump,distance(a.legs[i][key],b.legs[i][key])*175*height)}
 for(const r of poses){for(const l of r.legs){boneError=Math.max(boneError,Math.abs(distance(l.hip,l.knee)-R.body.thigh),Math.abs(distance(l.knee,l.ankle)-R.body.shank));(l.stance?stanceAngles:swingAngles).push(angle(l));if(l.stance){const toe=l.ankle[1]+.022+Math.sin(l.roll)*.10+.017,heel=l.ankle[1]+.020-Math.sin(l.roll)*.04+.017;stanceGroundError=Math.max(stanceGroundError,Math.abs(Math.max(toe,heel))*175*height)}}const arms=r.arms.map(a=>a.elbow[2]-a.shoulder[2]);armsError=Math.max(armsError,arms[0]*arms[1])}
 cases.push({height,stride,boundaryJumpCm:boundaryJump,boneErrorCm:boneError*175*height,headTravelCm:range(poses.map(p=>p.head[1]))*175*height,pelvisTravelCm:range(poses.map(p=>p.hip[1]))*175*height,torsoLengthChangeCm:range(poses.map(p=>distance(p.hip,p.shoulder)))*175*height,stanceKneeRmsDeg:Math.sqrt(stanceAngles.reduce((s,v)=>s+v*v,0)/stanceAngles.length),peakKneeDeg:Math.max(...stanceAngles,...swingAngles),armsError,stanceGroundErrorCm:stanceGroundError});
 }
 const limits={boundaryJumpCm:.01,boneErrorCm:.01,headTravelCm:1.2,torsoLengthChangeCm:3.0,peakKneeDeg:55,stanceGroundErrorCm:1.2,armsError:1e-8};
 const failures=cases.flatMap(c=>Object.entries(limits).filter(([k,max])=>c[k]>max).map(([k,max])=>`${c.height}/${c.stride}: ${k} ${c[k].toFixed(3)} > ${max}`));
 return{description:'Mechanical gate only. Visual judgement is required separately; these bounds are project quality constraints, not clinical gait norms.',passed:!failures.length,limits,failures,cases};
}
if(require.main===module){const file=path.resolve(process.argv[2]||'dist/projects/ASCII/nyc/pedestrian-rig.js');const report=judge(require(file));report.sourceSha256=require("node:crypto").createHash("sha256").update(fs.readFileSync(file)).digest("hex");if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1}
module.exports={judge};
