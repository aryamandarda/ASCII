(function(root){
  const lat=40.758,lon=-73.9855,zone='America/New_York',MINUTE=60000,DAY=86400000;
  const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,v)=>a+(b-a)*v;
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
  function parts(ms){const p=Object.fromEntries(fmt.formatToParts(new Date(ms)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return{date:`${p.year}-${p.month}-${p.day}`,hour:+p.hour+(+p.minute)/60+(+p.second)/3600,year:+p.year,month:+p.month,day:+p.day}}
  function localEpoch(date,minutes=720){const [y,m,d]=date.split('-').map(Number),target=Date.UTC(y,m-1,d)+minutes*MINUTE;let guess=target+5*3600000;for(let i=0;i<4;i++){const p=parts(guess),local=Date.UTC(p.year,p.month-1,p.day)+Math.round(p.hour*3600)*1000;const delta=target-local;if(Math.abs(delta)<1000)break;guess+=delta}return guess}
  function shiftDate(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
  // Meeus solar coordinates / NOAA solar calculator equations. Sunrise uses -0.833 degrees
  // for the solar radius and standard atmospheric refraction. UTC avoids fixed DST offsets.
  const rad=Math.PI/180,sin=v=>Math.sin(v*rad),cos=v=>Math.cos(v*rad);
  function solar(ms){
    const t=(ms/DAY+2440587.5-2451545)/36525,L=(280.46646+t*(36000.76983+t*.0003032))%360,M=357.52911+t*(35999.05029-.0001537*t),e=.016708634-t*(.000042037+.0000001267*t);
    const C=sin(M)*(1.914602-t*(.004817+.000014*t))+sin(2*M)*(.019993-.000101*t)+sin(3*M)*.000289;
    const omega=125.04-1934.136*t,lambda=L+C-.00569-.00478*sin(omega),obliquity=23+(26+(21.448-t*(46.815+t*(.00059-t*.001813)))/60)/60+.00256*cos(omega);
    const decl=Math.asin(sin(obliquity)*sin(lambda)),y=Math.tan(obliquity*rad/2)**2,eq=4/rad*(y*sin(2*L)-2*e*sin(M)+4*e*y*sin(M)*cos(2*L)-.5*y*y*sin(4*L)-1.25*e*e*sin(2*M));
    const utcMinutes=((ms%DAY)+DAY)%DAY/MINUTE,angle=(((utcMinutes+eq+4*lon)%1440+1440)%1440)/4-180;
    return{eq,altitude:Math.asin(sin(lat)*Math.sin(decl)+cos(lat)*Math.cos(decl)*cos(angle))/rad};
  }
  const cache=new Map();
  function events(date){
    if(cache.has(date))return cache.get(date);const noon=localEpoch(date),midnight=Date.parse(date+'T00:00:00Z');
    function crossing(a,b,target,rising){for(let i=0;i<34;i++){const m=(a+b)/2;if((solar(m).altitude<target)===rising)a=m;else b=m}return new Date((a+b)/2)}
    let transit=midnight+(720-4*lon-solar(noon).eq)*MINUTE;transit=midnight+(720-4*lon-solar(transit).eq)*MINUTE;
    const e={sunrise:crossing(transit-12*3600000,transit,-.833,true),sunset:crossing(transit,transit+12*3600000,-.833,false),dawn:crossing(transit-12*3600000,transit,-6,true),dusk:crossing(transit,transit+12*3600000,-6,false),solarNoon:new Date(transit)};
    cache.set(date,e);if(cache.size>400)cache.delete(cache.keys().next().value);return e;
  }
  function lightAt(ms){const p=parts(ms),e=events(p.date),rise=+e.sunrise,set=+e.sunset,noon=+e.solarNoon,alt=solar(ms).altitude;
    const day=smooth(-6,12,alt),warm=smooth(-7,-1,alt)*(1-smooth(3,13,alt)),sun=ms>=rise&&ms<=set,progress=clamp((ms-rise)/(set-rise),0,1);
    const lunar=SunCalc.getMoonIllumination(new Date(ms)),position=SunCalc.getMoonPosition(new Date(ms),lat,lon);
    // The disc exists above the real lunar horizon, including daytime moons.
    // Fit the above-horizon path into the open sky above the central tower.
    // The old y=590 path put most lunar positions inside the building mask.
    const moon=position.altitude>0&&lunar.fraction>.004;
    return{...p,day,night:1-day,warm,elevation:alt,sun,morning:ms<noon,x:365+progress*575,y:590-Math.sin(progress*Math.PI)*495,
      moon,moonX:650+Math.sin(position.azimuth)*150,moonY:200-clamp(position.altitude/(Math.PI/2),0,1)*145,
      moonPhase:lunar.phase,moonFraction:lunar.fraction,moonAngle:lunar.angle-position.parallacticAngle,moonAltitude:position.altitude,sunrise:rise,sunset:set};
  }
  function advance(epoch,seconds,speed=1,direction=1){return epoch+seconds*MINUTE*speed*direction}
  root.CityCalendar={lat,lon,zone,MINUTE,DAY,parts,localEpoch,shiftDate,events,solar,lightAt,advance};if(typeof module!=='undefined')module.exports=root.CityCalendar;
})(typeof window==='undefined'?globalThis:window);
