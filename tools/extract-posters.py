import json,numpy as np
from PIL import Image
from pathlib import Path
root=Path(__file__).resolve().parents[1]
quads=json.loads((root/'tools/poster-quads.json').read_text())
source=np.asarray(Image.open(root/'web/artworks/nyc/times-square-fixed.jpg').convert('RGB'))
for (name,p,_),slug in zip(quads,['motown','chrysler','wicked','phantom','annie']):
 p=np.array(p,float);aspect=(np.linalg.norm(p[1]-p[0])+np.linalg.norm(p[2]-p[3]))/(np.linalg.norm(p[3]-p[0])+np.linalg.norm(p[2]-p[1]));w=240;h=round(w/aspect)
 a=[];b=[]
 for (u,v),(x,y) in zip([[0,0],[1,0],[1,1],[0,1]],p):a.extend([[u,v,1,0,0,0,-x*u,-x*v],[0,0,0,u,v,1,-y*u,-y*v]]);b.extend([x,y])
 m=np.r_[np.linalg.solve(a,b),1].reshape(3,3);v,u=np.mgrid[0:h,0:w];uv=np.stack([(u+.5)/w,(v+.5)/h,np.ones_like(u)],axis=-1)@m.T;xy=uv[:,:,:2]/uv[:,:,2:];x=np.clip(np.rint(xy[:,:,0]).astype(int),0,1279);y=np.clip(np.rint(xy[:,:,1]).astype(int),0,853)
 Image.fromarray(source[y,x]).save(root/('web/artworks/nyc/media/poster-'+slug+'.png'));print(name,w,h)
