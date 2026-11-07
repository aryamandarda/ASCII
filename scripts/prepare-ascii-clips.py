import subprocess,numpy as np
from PIL import Image,ImageDraw,ImageFont
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'dist'/'media'
ramp=' .,:;irsXA253hMHGS#9B&@';font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',10)
a=[]
for ch in ramp:
 im=Image.new('L',(6,10));ImageDraw.Draw(im).text((0,-2),ch,font=font,fill=255);a.append(np.array(im)/255)
atlas=np.array(a,dtype=np.float32)
def convert(name):
 src=root/(name+'.mp4');p=subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=width,height','-of','csv=p=0',str(src)]).decode().splitlines()[0].split(',');w,h=map(int,p);cols=56;rows=round(cols*h/w*.6);ow,oh=cols*6,rows*10
 dec=subprocess.Popen(['ffmpeg','-v','error','-i',str(src),'-an','-vf',f'scale={cols}:{rows},fps=24','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
 enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{ow}x{oh}','-r','24','-i','-','-an','-c:v','libx264','-crf','20','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(root/(name+'-ascii.mp4'))],stdin=subprocess.PIPE)
 n=0
 while True:
  raw=dec.stdout.read(cols*rows*3)
  if not raw:break
  rgb=np.frombuffer(raw,dtype=np.uint8).reshape(rows,cols,3).astype(np.float32)/255
  lum=rgb@np.array([.2126,.7152,.0722]);idx=np.minimum(len(ramp)-1,(lum**.72*(len(ramp)-1)).astype(int));ink=atlas[idx][:,:,:,:,None]
  lit=np.clip(rgb**.82*1.3,0,1)[:,:,None,None,:];back=lit*.72;front=np.minimum(1,lit*1.18+.04)
  out=((back*(1-ink)+front*ink)*255).astype(np.uint8).transpose(0,2,1,3,4).reshape(oh,ow,3)
  enc.stdin.write(out.tobytes());n+=1
 enc.stdin.close();assert dec.wait()==0;assert enc.wait()==0;print(name,n,'frames',ow,oh,flush=True)
with ThreadPoolExecutor(max_workers=3) as ex:list(ex.map(convert,['coke-enjoy','coke-pour','spotify-now','spotify-sza','spotify-renee']))
