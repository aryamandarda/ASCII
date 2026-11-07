#!/usr/bin/env python3
"""Build an offline, single-file visual review without a PR or deployment."""
import base64,json,mimetypes,re,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
scene=root/'dist/projects/ASCII/nyc'
output=Path(sys.argv[1]) if len(sys.argv)>1 else root/'.openai/Times-Square-Local-Test.html'
html=(scene/'index.html').read_text()
html=re.sub(r'<base[^>]*>','',html)
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(scene/'style.css').read_text()+'</style>')
assets={}
for p in [scene/'times-square-empty-day.jpg',scene/'times-square-road-clean.png',*sorted((scene/'media').glob('*-frames.jpg')),*sorted((scene/'media').glob('poster-*.png'))]:
 assets[str(p.relative_to(scene))]='data:'+mimetypes.guess_type(p.name)[0]+';base64,'+base64.b64encode(p.read_bytes()).decode()
html=html.replace('<script src="vendor/suncalc.js">','<script>const REVIEW_ASSETS='+json.dumps(assets)+';</script><script src="vendor/suncalc.js">')
def inline(m):
 code=(scene/m[1]).read_text()
 if m[1]=='fixed-screens.js':
  code=code.replace("media.src='media/'+definition.file", "media.src=REVIEW_ASSETS['media/'+definition.file]").replace('image.src=src','image.src=REVIEW_ASSETS[src]')
 return '<script>'+code.replace('</script','<\\/script')+'</script>'
html=re.sub(r'<script src="([^"]+)"></script>',inline,html)
html=html.replace('</body>', '''<script>
// Present only in this offline review build; production has no test toolbar.
window.reviewSetTime=function(minutes){playing=false;epoch=CityCalendar.localEpoch('2026-11-07',minutes);controls();draw()};
function beginReview(){if(!ready){requestAnimationFrame(beginReview);return}immersed=true;el('immerse').setAttribute('tabindex','-1');el('immerse').setAttribute('aria-hidden','true');document.body.classList.add('immersed');el('controlsToggle').hidden=false;showControls(true);window.reviewSetTime(107)}
requestAnimationFrame(beginReview);
</script></body>''')
# srcdoc gives the phone preset a true narrow viewport, including media queries.
encoded=json.dumps(html).replace('<','\\u003c')
wrapper='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Times Square · Local Test</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#070b12;color:#edf1f6;font:13px system-ui;display:grid;place-items:center;height:100vh;height:100dvh;overflow:hidden}iframe{border:0;display:block;width:100vw;height:100vh;height:100dvh}body.phone iframe{width:min(390px,100vw);height:min(844px,100dvh);border-radius:20px;box-shadow:0 0 0 1px #ffffff30}#review{position:fixed;right:14px;bottom:14px;max-width:calc(100vw - 28px);z-index:10}summary{cursor:pointer;padding:9px 14px;border:1px solid #ffffff35;border-radius:20px;background:#17202bd9;list-style:none;width:max-content;margin-left:auto}#panel{width:290px;max-width:calc(100vw - 28px);margin-top:8px;padding:16px;background:#111923f5;border:1px solid #ffffff35;border-radius:16px;box-shadow:0 8px 30px #0008}h1{font-size:14px;margin:0 0 5px}p{color:#a9b6c7;font-size:12px;line-height:1.5;margin:6px 0 12px}.choices{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}button{font:inherit;background:#ffffff10;border:1px solid #ffffff20;border-radius:8px;color:inherit;padding:8px;cursor:pointer}button:hover,button[aria-pressed=true]{background:#ffffff28}button:focus-visible,summary:focus-visible{outline:2px solid #a4c9ff;outline-offset:3px}small{color:#a9b6c7}
</style><iframe id="scene" title="Times Square local review" allowfullscreen></iframe>
<details id="review"><summary>Test scenes</summary><div id="panel"><h1>Local test · not published</h1><p>Check the pavement, billboard glow and detail at different sizes. Click Hide controls inside the artwork for a clean view.</p>
<div class="choices" aria-label="Lighting presets"><button data-time="720">Midday</button><button data-time="1005">Sunset</button><button data-time="107">1:47 AM</button><button data-time="240">4 AM</button><button data-time="0">Midnight</button></div>
<div class="choices" aria-label="Viewing size"><button data-view="desktop" aria-pressed="true">Fit window</button><button data-view="phone" aria-pressed="false">Phone</button></div><small>Resize your browser to test laptop detail. All artwork and media are included; no server is needed.</small></div></details>
<script>
const frame=document.getElementById('scene');
frame.srcdoc=APP_SOURCE;
document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>{if(frame.contentWindow.reviewSetTime){frame.contentWindow.reviewSetTime(+b.dataset.time);document.querySelectorAll('[data-time]').forEach(v=>v.setAttribute('aria-pressed',String(v===b)))}});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{document.body.classList.toggle('phone',b.dataset.view==='phone');document.querySelectorAll('[data-view]').forEach(v=>v.setAttribute('aria-pressed',String(v===b)))});
</script></html>'''.replace('APP_SOURCE',encoded)
output.parent.mkdir(parents=True,exist_ok=True);output.write_text(wrapper)
print(f'Created {output} ({output.stat().st_size:,} bytes)')
