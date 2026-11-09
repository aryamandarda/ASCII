// Crowd checkpoints are computed off the UI thread so tapping, rotating and
// scrubbing never wait for hundreds of collision-simulation steps.
importScripts('vendor/suncalc.js','calendar.js','pedestrian-rig.js','city-life.js');
const keys=['id','x','y','h','height','build','stride','armSwing','coat','skin','hair','step','heading','locomotion','seated','dx','vx','vz','ground','speed','area'];
onmessage=({data:{time}})=>{
  const people=CityLife.peopleAt(time).map(p=>Object.fromEntries(keys.map(k=>[k,p[k]])));
  postMessage({time,people});
};
