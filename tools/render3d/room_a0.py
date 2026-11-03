#!/usr/bin/env python3
"""Gate A0: dense living room. Usage: python3 room_a0.py "<OBJ dir>" out.png"""
import sys, math
import numpy as np
from PIL import Image, ImageDraw
import kenney_room_proof as K
from kenney_room_proof import hx, pf, pw, wall_quad, poly, CW, CH, W, D, WH

R = K.RAMPS
K.PROPS = [
 ("bookcaseOpen",0.95,0,0,0,{},"R"),
 ("bookcaseOpenLow",2.9,0,0,0,{},"R"),
 ("plantSmall1",2.9,0.3,0,"TOP:bookcaseOpenLow",{},None),
 ("cabinetTelevision",5.5,0,0,0,{},"R"),
 ("televisionModern",5.5,0.4,0,"TOP:cabinetTelevision",{},"R"),
 ("speakerSmall",4.3,0.3,0,0,{},"R"),("speakerSmall",6.7,0.3,0,0,{},"R"),
 ("rugRectangle",3.8,3.9,0,0,{"carpet":"TERRA","carpetDarker":"TEAL","carpetWhite":"CREAM","carpetBlue":"MUSTARD"},None),
 ("loungeSofa",0,2.6,1,0,{"carpet":"TEAL","carpetDarker":"TEAL","carpetBlue":"TEAL"},"L"),
 ("pillowBlue",0.75,2.0,1,0.2,{},None),
 ("pillow",0.75,3.15,1,0.2,{"carpet":"MUSTARD"},None),
 ("bear",0.78,2.55,1,0.2,{},None),
 ("tableCoffee",3.6,3.5,0,0,{},None),
 ("books",3.4,3.3,0,"TOP:tableCoffee",{},None),
 ("laptop",3.9,3.6,0,"TOP:tableCoffee",{},None),
 ("sideTable",0,4.7,1,0,{},"L"),
 ("lampRoundTable",0.4,4.7,0,"TOP:sideTable",{},None),
 ("radio",0.5,4.95,1,"TOP:sideTable",{},None),
 ("loungeSofaOttoman",5.3,4.9,3,0,{"carpet":"TERRA","carpetDarker":"TERRA"},None),
 ("loungeChair",5.9,3.0,3,0,{"carpet":"MUSTARD","carpetDarker":"MUSTARD","carpetBlue":"MUSTARD"},None),
 ("lampRoundFloor",6.5,1.9,0,0,{},None),
 ("bookcaseClosedWide",0,0.9,1,0,{},"L"),
 ("plantSmall2",0.3,5.5,0,0,{},None),
 ("pottedPlant",6.5,5.5,0,0,{},None),
 ("coatRackStanding",0.3,5.9,0,0,{},None),
 ("plantSmall3",0.25,0.5,0,"TOP:bookcaseClosedWide",{},None),
 ("lampWall",0,1.9,1,0.55,{},"L"),
 ("pillowLong",5.95,3.0,3,0.28,{"carpet":"TERRA"},None),
 ("plantSmall1",5.3,4.9,0,"TOP:loungeSofaOttoman",{},None),
 ("benchCushionLow",1.9,5.5,0,0,{"carpet":"TERRA","carpetDarker":"TERRA"},None),
 ("speaker",0.3,3.9,1,0,{},"L"),
 ("rugDoormat",2.0,5.6,0,0,{"carpet":"TEAL","carpetDarker":"TEAL"},None),
]

# ---- pixel sprite DSL ----
PAL = {'.':None,'k':'#3a2530','w':'#fff6e2','c':'#f1dcb8','o':'#f2a07f','O':'#d97a5c','r':'#b05646','y':'#eab75f','Y':'#f8dc8c',
 't':'#6fb0aa','T':'#4d8c90','g':'#8fb868','G':'#689350','b':'#b0703f','B':'#82492f','n':'#d79b5e','f':'#b98458','F':'#8f6140','s':'#8bbdc2','p':'#c9889a'}
def spr(rows):
    h,w=len(rows),max(map(len,rows)); im=Image.new('RGBA',(w,h),(0,0,0,0))
    for y,r in enumerate(rows):
        for x,ch in enumerate(r):
            c=PAL.get(ch)
            if c: im.putpixel((x,y),hx(c)+(255,))
    return im
def make_cat():
    w,h=22,12; im=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(im)
    o,w_,s_=hx('#f2a07f'),hx('#fff6e2'),hx('#d97a5c')
    d.ellipse([2,4,16,11],fill=w_); d.ellipse([13,3,20,10],fill=w_)
    d.polygon([(13,4),(14,0),(16,3)],fill=w_); d.polygon([(17,3),(19,0),(20,4)],fill=w_)
    for x in (5,8,11): d.line([x,5,x+1,7],fill=o)
    d.arc([0,5,8,11],150,330,fill=s_); d.ellipse([14,5,16,6],fill=hx('#3a2530'));d.ellipse([18,5,19,6],fill=hx('#3a2530'))
    # outline
    a=np.array(im); al=a[...,3]>0; out=Image.new('RGBA',(w+2,h+2),(0,0,0,0)); out.alpha_composite(im,(1,1))
    A=np.array(out); m=A[...,3]>0; edge=np.zeros_like(m)
    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)): edge|=np.roll(m,(dy,dx),(0,1))
    A[edge&~m]=list(hx('#3a2530'))+[255]; return Image.fromarray(A,'RGBA')
CAT=make_cat()
MUG=spr([".kkk.","kwwkk","kwwwk","kwwk.",".kk.."]).copy()
def book_row(img,x,y,cols,h=5):
    x,y=int(round(x)),int(round(y))
    for i,c in enumerate(cols):
        for j in range(h-(i%2)): img.putpixel((x+i*2,y-j),hx(c)+(255,)); img.putpixel((x+i*2+1,y-j),hx(c)+(255,))

def put(img,s,pos,anchor='bottom'):
    x,y=pos; img.alpha_composite(s,(int(x-s.width//2),int(y-(s.height if anchor=='bottom' else 0))))

def frame_on_wall(img,wall,t0,t1,h0,h1,cols):
    poly(ImageDraw.Draw(img),wall_quad(wall,t0-.05,t1+.05,h0-2,h1+2),hx('#82492f'))
    d=ImageDraw.Draw(img)
    poly(d,wall_quad(wall,t0,t1,h0,h1),hx(cols[0])); poly(d,wall_quad(wall,t0,t1,h0,(h0+h1)/2),hx(cols[1]))
    poly(d,wall_quad(wall,t0+(t1-t0)*.3,t1-(t1-t0)*.3,h0+2,h0+6),hx(cols[2]))

def main():
    P,Dp,tone,ramp,obj,istop,feet=K.build_tris(); zb,tb=K.rasterise(P,Dp)
    img=Image.new('RGBA',(CW,CH),(0,0,0,255))
    K.draw_shell(img)
    # extra wall decor
    for a in [(2.3,3.0,30,44,["#8fc3d6","#6aa05c","#f7e7c6"]),(3.2,3.7,34,44,["#f2a07f","#d97a5c","#fff6e2"]),(4.2,4.8,28,42,["#eab75f","#c58f45","#82492f"]),(5.1,5.5,36,46,["#9ccfc4","#6fb0aa","#fff6e2"])]:
        frame_on_wall(img,'L',*a)
    frame_on_wall(img,'R',6.15,6.75,30,44,["#c9889a","#b05646","#fff6e2"])
    d=ImageDraw.Draw(img)
    # wall shelf with jars (left wall, high)
    poly(d,wall_quad('L',4.9,6.0,46,48),hx('#82492f'))
    for i,c in enumerate(['#6fb0aa','#eab75f','#d97a5c','#8fb868']):
        t=5.05+i*.25; poly(d,wall_quad('L',t,t+.15,48,54),hx(c))
    # wall clock right wall
    cx,cy=pw('R',5.1,50); d.ellipse([cx-5,cy-5,cx+5,cy+5],fill=hx('#82492f')); d.ellipse([cx-4,cy-4,cx+4,cy+4],fill=hx('#fff6e2'))
    d.line([cx,cy,cx,cy-3],fill=hx('#3a2530')); d.line([cx,cy,cx+2,cy],fill=hx('#3a2530'))
    K.window_light(img); K.shadows(img,feet)
    # rug contrast ring handled by Kenney rug; warm darker floor under rug
    K.glow(img,[(*pf(6.5,1.9,42),30),(*pf(0.4,4.7,28),22),(*pf(5.5,0.5,48),16)])
    img.alpha_composite(K.shade_props(tone,ramp,obj,istop,zb,tb))
    # hand-built small props
    put(img,CAT,pf(4.0,4.7,0)); put(img,MUG,pf(3.75,3.2,12))
    # books on open bookcase shelves (right wall bookcase) and closed wide top
    bx,by=pf(0.95,0.5,0)
    for h,cols in ((10,['#d97a5c','#eab75f','#4d8c90','#f2a07f']),(22,['#6fb0aa','#b05646','#f8dc8c']),(34,['#eab75f','#8fb868','#d97a5c','#9ccfc4'])):
        book_row(img,bx-5,by-h,cols)
    # lamp pool of light on rug
    lay=Image.new('RGBA',img.size,(0,0,0,0)); ImageDraw.Draw(lay).ellipse([*(np.array(pf(6.0,1.5))-[34,12]),*(np.array(pf(6.0,1.5))+[34,12])],fill=(255,226,140,38))
    img.alpha_composite(lay)
    # dusk-warm multiply tint, subtle
    tint=Image.new('RGBA',img.size,(255,200,150,14)); img.alpha_composite(tint)
    img=img.convert('RGB')
    q=img.quantize(colors=64,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGB')
    q.save(sys.argv[2].replace('.png','_native.png'))
    q.resize((CW*3,CH*3),Image.NEAREST).save(sys.argv[2])
    print('colors',len(set(q.getdata())),'props',len(K.PROPS))
main()
