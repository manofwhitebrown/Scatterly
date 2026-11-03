"""Render both sides (r0, r2) of the models listed after argv[1]. Usage: orient_pending.py <out.png> name..."""
import sys
out=sys.argv[1]; names=sys.argv[2:]; sys.argv=['x','/tmp/k/Models/OBJ format','/tmp/o.png']
import kenney_room_proof as K
from PIL import Image, ImageDraw
def sprite(n, rot):
    K.PROPS=[(n,3.5,3.0,rot,0,{},None)]
    P,Dp,tone,ramp,obj,istop,feet=K.build_tris(); zb,tb=K.rasterise(P,Dp)
    im=K.shade_props(tone,ramp,obj,istop,zb,tb); bb=im.getbbox(); return im.crop(bb) if bb else im
CELL=(86,72); sc=2; cols=3
rows=(len(names)+cols-1)//cols
sheet=Image.new('RGB',(CELL[0]*cols*2*sc,CELL[1]*rows*sc),(58,48,60)); d=ImageDraw.Draw(sheet)
for i,n in enumerate(names):
    for j,rot in enumerate((0,2)):
        s=sprite(n,rot); c=(i%cols)*2+j; r=i//cols; x0,y0=c*CELL[0]*sc,r*CELL[1]*sc
        big=s.resize((s.width*sc,s.height*sc),Image.NEAREST)
        sheet.paste(big,(x0+(CELL[0]*sc-big.width)//2,y0+CELL[1]*sc-big.height-6),big); d.text((x0+4,y0+2),f"{n} r{rot}",fill=(255,255,255))
sheet.save(out)
