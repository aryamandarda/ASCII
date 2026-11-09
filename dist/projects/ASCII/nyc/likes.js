(() => {
  const button=document.getElementById('like'),count=document.getElementById('likeCount');
  let liked=false,busy=false,loaded=false,lastRead=0;
  const endpoint='/api/likes/nyc';
  const compact=new Intl.NumberFormat(undefined,{notation:'compact',maximumFractionDigits:1});
  function render(data){
    if(!Number.isSafeInteger(data.count)||data.count<0||typeof data.liked!=='boolean')throw new Error('Invalid likes response');
    liked=data.liked;loaded=true;count.textContent=compact.format(data.count);count.title=data.count.toLocaleString()+' likes';
    button.setAttribute('aria-pressed',String(liked));button.setAttribute('aria-label',(liked?'Unlike':'Like')+' Times Square, '+data.count.toLocaleString()+' likes');
    button.title=liked?'Unlike':'Like';
  }
  async function request(options){
    const response=await fetch(endpoint,{credentials:'same-origin',signal:AbortSignal.timeout(8000),...options});
    if(!response.ok)throw new Error('Likes unavailable');return response.json();
  }
  async function refresh(){if(busy)return;busy=true;button.disabled=true;
    try{render(await request());lastRead=Date.now()}
    catch{if(!loaded)count.textContent=''}
    finally{busy=false;button.disabled=false}
  }
  button.onclick=async()=>{
    if(busy)return;if(!loaded){await refresh();if(!loaded)return}
    busy=true;
    try{render(await request({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({liked:!liked})}))}
    catch{/* Preserve the confirmed heart and count; the next tap retries. */}
    finally{busy=false;button.disabled=false}
  };
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastRead>30000)refresh()});
  refresh();
})();
