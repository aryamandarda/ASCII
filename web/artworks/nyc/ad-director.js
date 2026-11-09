(function(root){
const names=['Coca-Cola / Enjoy','Spotify Now / Tuned In','Coca-Cola / Liquid Pour','Spotify Now / SZA','Spotify Now / Reneé Rapp','Motown','Chrysler / Motown Edition','Wicked','The Phantom of the Opera','Annie'];
const groups=[{name:'Left wall',ids:[0,2,3,4,5,6,7,8,9]},{name:'Center tower',ids:[13,14,15,16,17,18,19]},{name:'Right wall',ids:[22,23,24,25,26,27,28,29,30,31]}];
const mainScreens=[0,3,4,17,16,23,24,25,28,26],initialAds=[1,5,6,0,2,9,8,7,3,4];
// Exchange two prominent screens at a time. All ten stay distinct between takeovers.
function individualAd(index,t){const rank=mainScreens.indexOf(index);if(rank<0)return(index*7+Math.floor((t+index*1.3)/13)+Math.floor(index/10)*3)%10;const step=Math.floor(t/6),rotation=Math.floor(step/9)%10,order=initialAds.map((_,i)=>initialAds[(i+rotation)%10]);for(let i=0;i<step%9;i++)[order[i],order[i+1]]=[order[i+1],order[i]];return order[rank]}
function sceneAt(t){const round=Math.floor(t/64),phase=t%64;let group=-1;if(phase>=12&&phase<20)group=0;else if(phase>=32&&phase<40)group=1;else if(phase>=52&&phase<60)group=2;const ad=(round*3+Math.max(0,group)*4+2)%10;return {group,ad,name:group<0?'Individual ads':groups[group].name+' takeover',phase}}
function adAt(index,t){const s=sceneAt(t);if(s.group>=0&&groups[s.group].ids.includes(index))return {ad:s.ad,group:s.group};return {ad:individualAd(index,t),group:-1}}
root.AdDirector={names,groups,mainScreens,sceneAt,adAt};if(typeof module!=='undefined')module.exports=root.AdDirector;
})(typeof window==='undefined'?globalThis:window);
