#!/usr/bin/env python3
"""Package the current renderer offline. Fail loudly if bootstrap hooks drift."""
from pathlib import Path
import base64, json, mimetypes, re, shutil, sys
ROOT = Path(__file__).resolve().parents[1]

def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError('Renderer bootstrap changed: ' + old)
    return text.replace(old, new, 1)

def prepare(destination):
    source = ROOT / 'dist/projects/ASCII/nyc'
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    # Only runtime assets; no review harness, API client or unrelated documents.
    for path in source.rglob('*'):
        if path.is_file() and path.suffix in {'.js', '.css', '.json'} and path.name != 'likes.js':
            target = destination / path.relative_to(source)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target)
    html = (source / 'index.html').read_text()
    html = replace_once(html, '<base href="/projects/ASCII/nyc/">', '<base href="./">')
    html = html.replace('<link rel="manifest" href="manifest.webmanifest">', '')
    html = html.replace('<script src="likes.js"></script>', '').replace('<script src="scene-view.js"></script>', '')
    images = {str(p.relative_to(source)): 'data:' + mimetypes.guess_type(p.name)[0] + ';base64,' + base64.b64encode(p.read_bytes()).decode() for p in source.rglob('*') if p.suffix in {'.png', '.jpg', '.webp'}}
    (destination / 'offline-images.js').write_text('window.ASCII_IMAGES=' + json.dumps(images) + ';\n')
    html = replace_once(html, '<script src="fixed-screens.js">', '<script src="offline-images.js"></script>\n<script src="fixed-screens.js">')
    html = replace_once(html, '<body>', '<body class="screensaver immersed">')
    html = replace_once(html, '<script src="crowd-client.js">', '<script src="offline-worker.js"></script>\n<script src="crowd-client.js">')
    html = replace_once(html, '</head>', '<style>#experience> :not(#ambient):not(#surface){display:none!important}#surface{inset:0;filter:none;transition:none}#art{object-fit:contain}body{cursor:none}</style>\n</head>')
    (destination / 'index.html').write_text(html)
    renderer = (source / 'fixed-screens.js').read_text()
    renderer = replace_once(renderer, "playing=!matchMedia('(prefers-reduced-motion: reduce)').matches", 'playing=true')
    renderer = replace_once(renderer, "media.src='media/'+definition.file", "media.src=window.ASCII_IMAGES['media/'+definition.file]")
    renderer = replace_once(renderer, 'image.src=src', 'image.src=window.ASCII_IMAGES[src]')
    renderer = replace_once(renderer, 'if(playing&&!document.hidden)', 'if(playing&&!document.hidden&&window.ASCII_SAVER_RUNNING!==false)')
    renderer = replace_once(renderer, ".catch(()=>{el('loading').textContent='Please refresh'", ".catch(error=>{canvas.dataset.error=String(error);el('loading').textContent='Please refresh'")
    (destination / 'fixed-screens.js').write_text(renderer)
    # A blob worker avoids file:// cross-origin imports without WebKit private
    # preferences or a local HTTP server. Existing worker-failure fallback remains.
    sources = ['vendor/suncalc.js', 'calendar.js', 'pedestrian-rig.js', 'city-life.js']
    worker = (source / 'crowd-worker.js').read_text()
    worker = re.sub(r'importScripts\([^;]+;\s*', '', worker, count=1)
    worker = '\n;\n'.join((source / p).read_text() for p in sources) + '\n;\n' + worker
    (destination / 'offline-worker.js').write_text('window.ASCII_WORKER_URL=URL.createObjectURL(new Blob([' + json.dumps(worker) + '],{type:"text/javascript"}));\n')
    client = (source / 'crowd-client.js').read_text()
    client = replace_once(client, "new URL('crowd-worker.js',document.baseURI)", 'window.ASCII_WORKER_URL')
    (destination / 'crowd-client.js').write_text(client)
    shutil.copy2(ROOT / 'THIRD_PARTY_NOTICES.md', destination / 'THIRD_PARTY_NOTICES.md')
    shutil.copy2(source / 'vendor/SUNCALC-LICENSE', destination / 'vendor/SUNCALC-LICENSE')

if __name__ == '__main__':
    prepare(sys.argv[1])
