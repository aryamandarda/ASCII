const canvas=document.getElementById('art'),ctx=canvas.getContext('2d',{alpha:false});
const source=new Image(),sample=document.createElement('canvas'),sctx=sample.getContext('2d',{willReadFrequently:true});
let ready=false,renderTimer,photoMode=false;
const el=id=>document.getElementById(id);
function setView(original){photoMode=original;el('original').style.display=original?'block':'none';canvas.style.visibility=original?'hidden':'visible';el('ascii').setAttribute('aria-pressed',!original);el('photo').setAttribute('aria-pressed',original);el('download').disabled=original;el('status').textContent=original?'Original photograph. Switch back to ASCII to download the rendering.':''}
el('ascii').onclick=()=>setView(false);el('photo').onclick=()=>setView(true);
function render(){if(!ready)return;const cols=+el('detail').value,rows=Math.round(cols*.75*.6),cw=6,ch=10;sample.width=cols;sample.height=rows;sctx.drawImage(source,0,0,cols,rows);const data=sctx.getImageData(0,0,cols,rows).data;
canvas.width=cols*cw;canvas.height=rows*ch;ctx.fillStyle='#070b11';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.textBaseline='middle';const ramp=' .,:;irsXA253hMHGS#9B&@',saturation=+el('color').value/100;
for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=(y*cols+x)*4,r=data[i],g=data[i+1],b=data[i+2],lum=.2126*r+.7152*g+.0722*b;
// A dense luminance ramp preserves ad lettering, car contours and faces.
const brightness=Math.pow(lum/255,.62),char=ramp[Math.min(ramp.length-1,Math.floor(brightness*(ramp.length-1)))];if(char===' ')continue;
const gain=1.2+(.4*(1-brightness));const channel=v=>Math.min(255,Math.max(0,Math.round((lum+(v-lum)*saturation)*gain)));ctx.fillStyle=`rgb(${channel(r)},${channel(g)},${channel(b)})`;ctx.fillText(char,(x+.5)*cw,(y+.5)*ch);
}
el('gridinfo').textContent=cols+' × '+rows+' / '+(cols*rows).toLocaleString()+' CHARACTERS';el('detailValue').textContent=cols+' columns';el('colorValue').textContent=el('color').value+'%';el('loading').style.display='none';}
function requestRender(){clearTimeout(renderTimer);renderTimer=setTimeout(render,90)}el('detail').oninput=()=>{el('detailValue').textContent=el('detail').value+' columns';requestRender()};el('color').oninput=()=>{el('colorValue').textContent=el('color').value+'%';requestRender()};el('zoom').oninput=()=>{el('zoomValue').textContent=el('zoom').value+'%';el('surface').style.width=el('zoom').value+'%';el('viewport').style.maxHeight=+el('zoom').value>100?'83vh':'none'};
el('download').onclick=()=>{el('status').textContent='Preparing full-resolution PNG…';canvas.toBlob(blob=>{if(!blob){el('status').textContent='Export failed. Please try again.';return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Times-Square-ASCII-Pablo-Costa-Tirado-CC-BY-SA-3.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);el('status').textContent='PNG prepared. Artwork: Pablo Costa Tirado / ASCII adaptation, CC BY-SA 3.0.'},'image/png')};
source.onload=()=>{ready=true;render()};source.onerror=()=>{el('loading').textContent='The reference could not load. Please refresh to retry.'};source.src='times-square-reference.jpg';
