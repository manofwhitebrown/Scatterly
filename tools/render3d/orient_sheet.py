import sys; sys.argv=['x','/tmp/k/Models/OBJ format','/tmp/o.png']
import numpy as np
import kenney_room_proof as K
from PIL import Image, ImageDraw
def sprite(n, rot):
    K.PROPS=[(n,3.5,3.0,rot,0,{},None)]
    P,Dp,tone,ramp,obj,istop,feet=K.build_tris(); zb,tb=K.rasterise(P,Dp)
    im=K.shade_props(tone,ramp,obj,istop,zb,tb); bb=im.getbbox(); return im.crop(bb) if bb else im
groups=[['loungeSofa','loungeChair','bookcaseOpen','cabinetTelevision','televisionModern','speakerSmall','sideTable','tableCoffee','bookcaseClosedWide','radio','pillowBlue','bear','lampRoundTable','pottedPlant','books'],
        ['kitchenStove','kitchenFridge','kitchenSink','kitchenCabinet','kitchenCabinetUpper','bedDouble','cabinetBed','toilet','bathtub','desk','chair','computerScreen','washer','bathroomSink','cabinetTelevisionDoors']]
for gi,g in enumerate(groups):
    CELL=(86,72); sc=2
    sheet=Image.new('RGB',(CELL[0]*6*sc,CELL[1]*5*sc),(58,48,60)); d=ImageDraw.Draw(sheet)
    for i,n in enumerate(g):
        for j,rot in enumerate((0,2)):
            s=sprite(n,rot); c=(i%3)*2+j; r=i//3
            x0,y0=c*CELL[0]*sc,r*CELL[1]*sc
            big=s.resize((s.width*sc,s.height*sc),Image.NEAREST)
            sheet.paste(big,(x0+(CELL[0]*sc-big.width)//2,y0+CELL[1]*sc-big.height-6),big)
            d.text((x0+4,y0+2),f"{n} r{rot}",fill=(255,255,255))
    sheet.save(f'/tmp/sheet{gi}.png')
