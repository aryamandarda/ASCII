(function(root){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function layout(width,height,fill){const scale=(fill?Math.max:Math.min)(width/1280,height/854);return{width:1280*scale,height:854*scale,overflowX:Math.max(0,1280*scale-width),overflowY:Math.max(0,854*scale-height)}}
  function pan(position,delta,overflow){return overflow>1?clamp(position-delta/overflow,0,1):position}
  const api={layout,pan};root.SceneView=api;if(typeof module!=='undefined')module.exports=api;
  if(typeof document==='undefined')return;
  const surface=document.getElementById('surface'),art=document.getElementById('art'),fit=document.getElementById('viewFit'),full=document.getElementById('viewFullscreen'),hint=document.getElementById('viewHint');
  const mobile=matchMedia('(max-width: 600px), (max-width: 1000px) and (max-height: 600px)');
  let active=false,fill=false,x=.5,y=.5,drag=null,hintTimer,onResize=()=>{},landscape=innerWidth>innerHeight;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
  const fullscreen=()=>document.fullscreenElement||document.webkitFullscreenElement;
  function update(){
    const nextLandscape=innerWidth>innerHeight;if(nextLandscape!==landscape){fill=false;x=y=.5;landscape=nextLandscape}
    const expanded=active&&mobile.matches&&fill;
    document.body.classList.toggle('mobile-view',mobile.matches);
    document.body.classList.toggle('scene-fill',expanded);
    surface.dataset.viewMode=expanded?'cover':'contain';art.style.objectPosition=`${x*100}% ${y*100}%`;
    fit.hidden=!mobile.matches;fit.textContent=expanded?'Full scene':'Zoom in';fit.setAttribute('aria-pressed',String(expanded));
    full.textContent=fullscreen()?'Exit fullscreen':'Fullscreen';full.hidden=standalone();
    if(!expanded)hint.hidden=true;
    onResize();
  }
  api.requestFullscreen=()=>{
    if(standalone())return;
    const element=document.documentElement,request=element.requestFullscreen||element.webkitRequestFullscreen;
    const fallback=()=>{if(!mobile.matches)return;hint.hidden=false;hint.textContent='On iPhone, use Share → Add to Home Screen for a view without browser bars.';clearTimeout(hintTimer);hintTimer=setTimeout(()=>{hint.hidden=true},9000)};
    if(!request){fallback();return}
    try{Promise.resolve(request.call(element,{navigationUI:'hide'})).then(update).catch(fallback)}catch{fallback()}
  };
  api.enter=(resize,show)=>{active=true;fill=false;onResize=resize;update();show(!mobile.matches)};
  api.leave=()=>{active=false;fill=false;drag=null;clearTimeout(hintTimer);hint.hidden=true;update()};
  api.mode=()=>active&&mobile.matches&&fill?'cover':'contain';
  api.compact=()=>mobile.matches;
  fit.onclick=()=>{fill=!fill;update();if(fill){hint.hidden=false;hint.textContent='Drag to explore';clearTimeout(hintTimer);hintTimer=setTimeout(()=>{hint.hidden=true},5000)}};
  full.onclick=()=>{if(fullscreen()){const exit=document.exitFullscreen||document.webkitExitFullscreen;try{Promise.resolve(exit.call(document)).catch(()=>{})}catch{}}else api.requestFullscreen()};
  surface.addEventListener('pointerdown',e=>{if(api.mode()!=='cover'||!e.isPrimary||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};surface.setPointerCapture(e.pointerId)});
  surface.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const box=layout(surface.clientWidth,surface.clientHeight,true);x=pan(x,e.clientX-drag.x,box.overflowX);y=pan(y,e.clientY-drag.y,box.overflowY);drag.x=e.clientX;drag.y=e.clientY;art.style.objectPosition=`${x*100}% ${y*100}%`});
  const end=e=>{if(drag?.id===e.pointerId)drag=null};
  surface.addEventListener('pointerup',end);surface.addEventListener('pointercancel',end);surface.addEventListener('lostpointercapture',end);
  window.addEventListener('resize',()=>{drag=null;update()});
  document.addEventListener('fullscreenchange',update);document.addEventListener('webkitfullscreenchange',update);
  update();
})(typeof window==='undefined'?globalThis:window);
