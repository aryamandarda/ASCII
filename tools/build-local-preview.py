#!/usr/bin/env python3
"""Build the visual review as an offline file or a page using hosted assets."""
import argparse,base64,json,mimetypes,re,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
scene=root/'web/artworks/nyc'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('output',nargs='?',type=Path)
parser.add_argument('--hosted',action='store_true',help='Load scene assets by URL instead of embedding them')
args=parser.parse_args()
# Never publish a candidate with discontinuous or broken body mechanics.
subprocess.run(['node',str(root/'tools/gait/judge.cjs'),str(scene/'pedestrian-rig.js'),str(root/'web/gait-study/current-report.json')],check=True,stdout=subprocess.DEVNULL)
output=args.output or (root/'web/review/index.html' if args.hosted else root/'.openai/Times-Square-Local-Test.html')
html=(scene/'index.html').read_text()
html=re.sub(r'<base[^>]*>','',html)
if args.hosted:
 html=html.replace('<head>','<head><base href="/artworks/nyc/">',1)
else:
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
// Present only in review builds; production has no test toolbar.
window.reviewSetTime=function(minutes,date='2026-11-07'){playing=false;epoch=CityCalendar.localEpoch(date,minutes);controls();draw()};
function beginReview(){if(!ready){requestAnimationFrame(beginReview);return}immersed=true;el('immerse').setAttribute('tabindex','-1');el('immerse').setAttribute('aria-hidden','true');document.body.classList.add('immersed');el('controlsToggle').hidden=false;showControls(true);window.reviewSetTime(107)}
requestAnimationFrame(beginReview);
</script></body>''')
# srcdoc gives the phone preset a true narrow viewport, including media queries.
encoded=json.dumps(html).replace('<','\\u003c')
wrapper=(root/'tools/local-review.html').read_text().replace('APP_SOURCE',encoded)
if args.hosted:
 wrapper=wrapper.replace('local review','review').replace('No server is needed. ','')
 wrapper=wrapper.replace('<meta charset="utf-8">','<meta charset="utf-8"><meta name="robots" content="noindex, nofollow">',1)
output.parent.mkdir(parents=True,exist_ok=True);output.write_text(wrapper)
print(f'Created {output} ({output.stat().st_size:,} bytes)')
