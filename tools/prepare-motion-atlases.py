"""Convert campaign motion into deterministic 6 fps image sheets; no autoplay dependency."""
from pathlib import Path
import json, subprocess, tempfile, math
root=Path(__file__).resolve().parents[1]
names=['coke-enjoy','spotify-now','coke-pour','spotify-sza','spotify-renee']
manifest=[]
with tempfile.TemporaryDirectory() as tmp:
    for name in names:
        raw=root/'web/artworks/nyc/media'/f'{name}.mp4'; intermediate=Path(tmp)/f'{name}.mkv'
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-an','-vf','fps=6,scale=128:-2','-c:v','ffv1',str(intermediate)],check=True)
        info=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_entries','stream=width,height,nb_read_frames','-of','json',str(intermediate)]))['streams'][0]
        count=int(info['nb_read_frames']); rows=math.ceil(count/12)
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(intermediate),'-vf',f'tile=12x{rows}:padding=0:margin=0','-frames:v','1','-q:v','2',str(root/'web/artworks/nyc/media'/f'{name}-frames.jpg')],check=True)
        manifest.append(dict(file=f'{name}-frames.jpg',width=info['width'],height=info['height'],frames=count,columns=12,fps=6))
(root/'web/artworks/nyc/motion-manifest.js').write_text('window.MotionManifest = '+json.dumps(manifest)+';\n')
print(json.dumps(manifest,indent=2))
