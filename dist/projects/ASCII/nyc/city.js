const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const W=300,H=174;let grid,colors,t=0,last=0,paused=true,season='summer',eventMode='everyday',hour=20;
const presets={spring:{crowd:70,traffic:65,weather:30,wind:25,story:'Spring'},summer:{crowd:85,traffic:75,weather:0,wind:15,story:'Summer'},autumn:{crowd:70,traffic:65,weather:10,wind:35,story:'Autumn'},winter:{crowd:55,traffic:55,weather:45,wind:25,story:'Winter'}};
const ids=['crowd','traffic','weather','wind'],settings={};const rand=n=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v)};
const mix=(a,b,v)=>{a=a.match(/\w\w/g).map(x=>parseInt(x,16));b=b.match(/\w\w/g).map(x=>parseInt(x,16));return '#'+a.map((x,i)=>Math.round(x+(b[i]-x)*v).toString(16).padStart(2,'0')).join('')};
function put(x,y,c,col){x=Math.round(x);y=Math.round(y);if(x>=0&&x<W&&y>=0&&y<H){grid[y*W+x]=c;colors[y*W+x]=col}}
function text(x,y,s,col){[...s].forEach((c,i)=>put(x+i,y,c,col))}
function line(x,y,x2,y2,c,col){let n=Math.ceil(Math.max(Math.abs(x2-x),Math.abs(y2-y)));for(let i=0;i<=n;i++)put(x+(x2-x)*i/(n||1),y+(y2-y)*i/(n||1),c,col)}
function box(x,y,w,h,ch,col){for(let j=0;j<h;j++)for(let i=0;i<w;i++)put(x+i,y+j,ch,col)}
function border(x,y,w,h,col){line(x,y,x+w,y,'=',col);line(x,y+h,x+w,y+h,'=',col);line(x,y,x,y+h,'|',col);line(x+w,y,x+w,y+h,'|',col)}
function poly(points,fn){let ys=points.map(p=>p[1]);for(let y=Math.max(0,Math.floor(Math.min(...ys)));y<=Math.min(H-1,Math.max(...ys));y++){let ints=[];points.forEach((p,i)=>{let q=points[(i+1)%points.length];if((p[1]<=y&&q[1]>y)||(q[1]<=y&&p[1]>y))ints.push(p[0]+(y-p[1])*(q[0]-p[0])/(q[1]-p[1]))});ints.sort((a,b)=>a-b);for(let k=0;k<ints.length;k+=2)for(let x=Math.ceil(ints[k]);x<ints[k+1];x++)if(x>=0&&x<W)fn(x,y)}}
const stamp=document.createElement('canvas');stamp.width=600;stamp.height=120;const sc=stamp.getContext('2d'),cache={};
function big(x,y,s,size,col){const key=s+size;if(!cache[key]){sc.clearRect(0,0,600,120);sc.font='900 '+size+'px Arial';sc.textBaseline='top';sc.fillStyle='#fff';sc.fillText(s,0,0);const d=sc.getImageData(0,0,600,120).data;let pts=[];for(let j=0;j<size*1.3;j++)for(let i=0;i<Math.min(600,sc.measureText(s).width+1);i++)if(d[(j*600+i)*4+3]>100)pts.push([i,j]);cache[key]=pts}for(const [i,j]of cache[key])put(x+i,y+j,'#',col)}
function billboard(x,y,w,h,c1,c2,words,sz=9){border(x-1,y-1,w+1,h+1,'#b5bec9');for(let j=0;j<h;j++)for(let i=0;i<w;i++){const light=(Math.sin(i*.12+j*.19+t*.15)+1)/2;put(x+i,y+j,[':', '+', '#', '@'][Math.floor(light*3.99)],mix(c1,c2,light*.8))}if(words)big(x+3,y+(h-sz)/2-1,words,sz,'#fff5da')}
function facade(x,y,w,h,type,id){for(let j=0;j<h;j++)for(let i=0;i<w;i++){let c=':',col='#3b465a';if(type===0){c=i%5===0?'|':j%4===0?'=':' ';col='#718093';if(i%5>0&&i%5<4&&j%4>0){c=rand(Math.floor(i/5)+Math.floor(j/4)*19+id)>.7?'#':':';col=c==='#'?'#c5b48b':'#334e63'}}else if(type===1){c=j%6===0?'=':i%7===0?'|':j%6>1&&j%6<5&&i%7>1&&i%7<5?'H':'.';col=c==='H'?'#9b896c':'#6d6266'}else{c=i%3===0?'|':j%3===0?'-':'.';col='#596374'}put(x+i,y+j,c,col)}border(x,y,w,h,'#838b98');for(let i=2;i<w;i+=7)put(x+i,y-1,'_', '#b5b3b4')}
function sprite(x,y,rows,col){rows.forEach((r,j)=>[...r].forEach((c,i)=>{if(c!==' ')put(x+i,y+j,c,typeof col==='function'?col(c,j):col)}))}
function pedestrian(x,y,size,id){const coat=['#6ec4cf','#da777f','#e6bc89','#8e9fd0','#dcd7bf','#b77eaf','#73ab98'][id%7];const skin=['#e6b68c','#bc8a65','#956747'][id%3];if(size===0){sprite(x,y,['o','M','/\\'],coat);return}if(size===1){sprite(x,y,['oo','##','||','/\\'],(c,j)=>j===0?skin:coat);return}sprite(x,y,[' .--. ',' (oo) ',' /##\\ ','|####|',' /||\\ ','  ||  ',' _/\\_'],(c,j)=>j<2?skin:j>4?'#b6b3b9':coat);if(id%8===0)sprite(x-3,y+2,['[]','[]'], '#d8a56c')}
function cab(x,y,scale,id){const rows=scale===2?['           .--------.              ','           |  TAXI  |              ','      _____|________|______        ','    /|  .------------.    |\\      ','  _/ | /  |      |    \\   | \\_   ',' /===|/___|______|_____\\__|====\\  ','| O  |___________________|  O |  ','|____|___ NYC TAXI _______|____|  ','  (###)                 (###)    ','   ###                   ###     ']:['      __TAXI__      ','   __/|______|\\__   ','  /__|________|__\\  ',' |o__  NYC  __o|   ','   ##        ##    '];sprite(x,y,rows,(c,j)=>c==='#'?'#8395a4':j<5&&['|','_'].includes(c)?'#f6d579':'#efb440');if(scale===2){text(x+10,y+4,'::    ::','#8bccdb');text(x+3,y+6,'@','#fff8d8');text(x+28,y+6,'@','#fff8d8')}}
function draw(){grid=Array(W*H).fill(' ');colors=Array(W*H).fill('#99a4b5');const daylight=Math.max(0,Math.sin((hour-6)/12*Math.PI)),sky=mix('#101426','#88abbf',daylight);ctx.fillStyle=sky;ctx.fillRect(0,0,canvas.width,canvas.height);
// Dense, asymmetric canyon. The narrow central sign tower divides Broadway and Seventh.
facade(0,-8,48,126,1,1);facade(43,-4,38,123,0,3);facade(77,16,34,105,2,5);facade(104,34,19,88,1,9);
facade(267,-12,37,141,1,13);facade(220,-5,48,131,0,16);facade(193,19,29,104,2,20);facade(179,44,16,78,0,21);
facade(122,60,18,66,0,40);facade(167,64,13,62,1,44);
// Rooftops, water tanks, fire escapes and cooling machinery.
sprite(83,9,['  /====\\  ','  |####|  ','  |####|  ','  /|  |\\  '],'#a5a0a2');for(let y=8;y<65;y+=9){text(34,y,'|____|','#ad9b8e');line(34,y,39,y+7,'/', '#9e8c80')}for(let x=225;x<262;x+=7)sprite(x,0,['[===]','|:::|'],'#c3c4bc');
// One Times Square: stacked screens, narrow shoulders, mast and ball.
facade(140,37,27,90,2,29);line(153,23,153,37,'|','#bac9df');sprite(150,21,[' .*. ','*###*',' *#* '],'#f1e7bc');text(146,31,'NEW YORK','#f2dbac');
billboard(141,38,25,14,'#292f94','#696be0','NYC',8);billboard(141,54,25,23,'#c62d62','#ef6a80','LOVE',7);big(146,66,'NY',7,'#ffddbe');billboard(141,79,25,19,'#15598e','#3ab5cf','ONE',8);text(143,94,'TIMES SQUARE','#c2f5ec');billboard(141,100,25,17,'#c45826','#efb14e','LIVE',7);
// Left-hand spectaculars. Distinct proportions and artwork, not repeated panels.
billboard(3,17,37,22,'#591d8e','#bf48bd','BROADWAY',6);big(9,31,'TONIGHT',6,'#ffca70');
billboard(2,44,39,27,'#c72d37','#e76b4e','NEW',11);big(5,57,'YORK',11,'#fff3e4');
billboard(46,20,30,35,'#154d9c','#64cce5',null);for(let j=0;j<23;j++)for(let i=0;i<20;i++){let a=((i-10)/8)**2+((j-11)/10)**2;if(a<1)put(51+i,24+j,a>.8?'#':i>11?':':'*',a>.8?'#99f0ee':'#e09d95')}text(49,49,'A WORLD OF POSSIBILITY','#e3fbeb');
billboard(44,59,34,22,'#f8af36','#c96c22','THE',9);big(47,70,'LION KING',6,'#242c46');
billboard(2,76,37,17,'#165546','#199e8b','CITY',10);text(5,89,'NEVER STANDS STILL','#b9f6c9');
billboard(80,44,25,33,'#9c236e','#ec43aa','ON',10);big(83,60,'AIR',10,'#ffe6f3');
billboard(80,80,27,18,'#224671','#47799b','NYC',9);text(82,94,'GOOD MORNING','#c3f3ef');
billboard(110,69,24,19,'#a23638','#df7053','42',12);billboard(109,91,27,16,'#354c8c','#7767b2','MUSIC',7);
// Right-hand signs: a vertical theater blade, broad luminous screen, ribbons.
billboard(224,15,43,31,'#11729a','#34c7d1','HELLO',12);big(231,32,'WORLD',10,'#dcffee');
billboard(225,50,43,24,'#a51c6d','#e6479b','TIMES',12);big(229,62,'SQUARE',10,'#ffdfdc');
billboard(271,27,25,52,'#bc3f23','#f3a04e',null);['P','A','L','A','C','E'].forEach((c,i)=>big(279,29+i*8,c,8,'#ffebbe'));
billboard(193,48,27,23,'#434695','#8b75c7','DREAM',7);big(196,60,'BIG',9,'#eddbff');
billboard(195,76,27,22,'#256842','#74ac57','PARK',8);text(197,93,'MEET YOU OUTSIDE','#d2eec1');
billboard(226,79,42,20,'#a53139','#df6874','NEW YORK',8);text(230,95,'ALL STORIES START HERE','#f6d0bf');
// Ticker strips, canopies, shop fronts and scaffold walkways.
for(const [x,y,w]of [[0,99,79],[193,103,108],[78,109,60]]){box(x,y,w,3,'=', '#6da6b1');const message='  NYC  •  BROADWAY  •  THE CITY NEVER SLEEPS  •  ';text(x,y+1,message.repeat(3).slice(Math.floor(t)%message.length,Math.floor(t)%message.length+w),'#f5cb7f')}
for(const [x,y,w,name]of [[2,110,30,'DELI & COFFEE'],[35,107,39,'BROADWAY THEATRE'],[80,116,29,'SUBWAY'],[195,112,25,'PIZZA'],[226,109,39,'SOUVENIRS'],[269,113,30,'NEW YORK GIFTS']]){box(x,y,w,13,':','#3e444e');border(x,y,w,13,'#b4a28d');text(x+2,y+1,name,'#ffe0a0');for(let a=2;a<w-2;a+=7){box(x+a,y+4,5,7,'#','#a8865f');box(x+a+1,y+5,3,5,':','#456776')}line(x,y+3,x+w,y+3,'=', '#edb06b')}
for(let x=0;x<77;x+=8){line(x,107,x,128,'|','#a4b9b7');line(x,114,x+8,124,'/', '#789093')}for(let x=223;x<300;x+=8){line(x,106,x,130,'|','#a4b9b7');line(x,114,x+8,124,'/', '#789093')}
// Pavement: narrower roads, irregular plaza, dense texture and reflected signage.
poly([[0,128],[136,120],[179,120],[300,131],[300,174],[0,174]],(x,y)=>{const v=rand(x+y*W);put(x,y,v>.93?':':v>.77?'.':' ',mix('#293346','#77828a',daylight*.4));if(y>131&&v>.65){let c=x<100?'#78516b':x>205?'#3b7181':'#64565e';put(x,y,y%3===0?'_':'.',c)}});
poly([[122,123],[143,123],[103,174],[34,174]],(x,y)=>put(x,y,rand(x+y*W)>.88?'.':' ','#65727d'));
poly([[168,123],[181,123],[268,174],[203,174]],(x,y)=>put(x,y,rand(x+y*W)>.9?':':' ','#65727d'));
line(121,124,31,174,'/', '#c4c0ac');line(143,124,104,174,'/', '#bdbaa9');line(180,124,269,174,'\\','#c4c0ac');line(168,124,203,174,'\\','#bdbaa9');
for(let i=0;i<9;i++){const x=36+i*9;poly([[x,158],[x+5,158],[x-7,164],[x-14,164]],(a,b)=>put(a,b,'=', '#b5bdbe'))}
for(let i=0;i<7;i++){let x=201+i*9;poly([[x,151],[x+5,151],[x+14,157],[x+8,157]],(a,b)=>put(a,b,'=', '#bfc4c1'))}
// Red stepped seating and plaza furniture.
for(let j=0;j<7;j++){box(133-j*2,136+j,32+j*4,1,'=',mix('#cf3358','#ff8b7c',j/9));line(132-j*2,136+j,132-j*2,138+j,'|','#e7c5bd');}text(143,139,'T K T S','#ffe7d9');
for(let i=0;i<15;i++){let x=112+i*4;line(x,148,x,150,'|','#acb8bd');put(x,148,'o','#dee3d1')}
// Traffic lights, mast arms, street blades, pedestrian signals.
for(const [x,y,dir]of [[27,118,1],[278,120,-1],[112,120,1]]){line(x,y-23,x,y+8,'|','#c6c4ac');line(x,y-23,x+dir*20,y-23,'_', '#c6c4ac');sprite(x+dir*19,y-22,['[O]','[o]','[o]'],(c,j)=>j===0?'#eb775c':'#9b925c');text(x-6,y-17,'W 45 ST','#c1dfca');text(x-6,y-15,'ONE WAY >','#e0e6d7');sprite(x-1,y-8,['[+]','[|]'],'#f0b285')}
// Tourists populate plaza and sidewalks, with fixed-size readable silhouettes.
const people=[];for(let i=0;i<Math.round(settings.crowd*1.15);i++){let y=124+rand(i+444)*47;let zone=i%3,x;if(zone===0)x=4+rand(i+55)*Math.max(12,105-(y-124)*1.3);else if(zone===1)x=221+(y-124)*.65+rand(i+33)*Math.max(8,73-(y-124)*.65);else x=125+rand(i+25)*65;people.push({x:x+Math.sin(t*.6+i)*.4,y,id:i})}people.sort((a,b)=>a.y-b.y);for(const p of people)pedestrian(p.x,p.y,p.y>151?2:p.y>136?1:0,p.id);
// Readable vehicles: consistent sprites, no single-character cars.
if(eventMode!=='parade'){const count=Math.round(settings.traffic/13);for(let i=0;i<count;i++){let z=(rand(i+888)+t*.009)%1,y=128+z*40,x=i%2?184+z*55:117-z*64;cab(x-10,y,z>.5?2:1,i)}}
// Foreground objects give scale and avoid a vacant lower edge.
sprite(13,158,['  ______ ',' /______\\',' | NYC  |',' |______|',' |______|','  |    | '],'#84a8a9');sprite(281,157,[' .----. ',' |####| ',' |####| ',' |____| ',' /____\\ '],'#a8aaa1');
if(eventMode==='parade'){big(120,153,'NYC',12,'#f8bc82');for(let i=0;i<20;i++)put(109+i*4,151+Math.sin(i+t), '*',['#eb7b9c','#a2d3c3','#edc773'][i%3])}
if(eventMode==='holiday'||eventMode==='newyear')for(let i=0;i<90;i++){let x=60+i*2;put(x,107+Math.sin(i/90*Math.PI)*7,i%3===0?'*':'-',i%3===0?'#ffc98b':'#748c8c')}
if(eventMode==='newyear')for(let n=0;n<3;n++)for(let i=0;i<30;i++){let a=i/30*Math.PI*2,r=5+(t+n*2)%7;put(121+n*27+Math.cos(a)*r,12+n%2*7+Math.sin(a)*r*.5,'*',['#f8b49b','#abdbef','#e0b7ec'][n])}
if(settings.weather>0)for(let i=0;i<settings.weather*2;i++){let x=(rand(i+800)*W+t*settings.wind*.04)%W,y=(rand(i+700)*H+t*(season==='winter'?2:12))%H;put(x,y,season==='winter'?'*':'/',season==='winter'?'#d6e4ed':'#647c9c')}
if(season==='autumn')for(let i=0;i<settings.wind;i++)put((rand(i+1500)*W+t)%W,145+rand(i+1600)*29,'~','#dc9f63');
// Every visible mark is a glyph; palette and sky follow the time control.
const cw=canvas.width/W,ch=canvas.height/H;ctx.font=`600 ${ch*1.42}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=y*W+x;if(grid[k]!==' '){ctx.fillStyle=daylight>.05?mix(colors[k],'#172438',daylight*.26):colors[k];ctx.fillText(grid[k],(x+.5)*cw,(y+.5)*ch)}}}
function updateStory(){document.getElementById('story').textContent=`${presets[season].story} · ${String(Math.floor(hour)).padStart(2,'0')}:${hour%1?'30':'00'} · Looking toward One Times Square. A hand-composed ASCII interpretation.`}
function setSeason(s){season=s;for(const id of ids){settings[id]=presets[s][id];document.getElementById(id).value=settings[id];document.getElementById(id+'Val').textContent=settings[id]+'%'}document.querySelectorAll('[data-season]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.season===s));updateStory();draw()}
for(const id of ids)document.getElementById(id).oninput=e=>{settings[id]=+e.target.value;document.getElementById(id+'Val').textContent=settings[id]+'%';draw()};document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>setSeason(b.dataset.season));document.getElementById('event').onchange=e=>{eventMode=e.target.value;draw()};document.getElementById('time').oninput=e=>{hour=+e.target.value;document.getElementById('timeVal').textContent=String(Math.floor(hour)).padStart(2,'0')+':'+(hour%1?'30':'00');updateStory();draw()};
function pauseUI(){document.getElementById('pause').textContent=paused?'▶ Animate scene':'Ⅱ Still frame';document.getElementById('pause').setAttribute('aria-pressed',paused)}document.getElementById('pause').onclick=()=>{paused=!paused;pauseUI()};pauseUI();
function resize(){let d=Math.min(devicePixelRatio||1,2);canvas.width=canvas.clientWidth*d;canvas.height=canvas.clientHeight*d;draw()}new ResizeObserver(resize).observe(canvas);setSeason('summer');function loop(now){if(!last)last=now;const dt=Math.min((now-last)/1000,.1);last=now;if(!paused&&!document.hidden){t+=dt;if(!loop.frame||now-loop.frame>100){draw();loop.frame=now}}requestAnimationFrame(loop)}requestAnimationFrame(loop);
