#!/usr/bin/env python3
"""Builds docs/art/ASSET-LIST.md and docs/art/asset-list.json from the data below.
Source: K = rendered from Kenney 3D (CC0), B = built by us (pixel DSL / voxel), A = algorithmic generator.
Priority: S = vertical slice (Gate A), A = production, B = polish/stretch."""
import json, os
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SPOTS = {  # kind: (w,h art px, src)
 'drawer':(32,34,'K'),'cabinet':(34,52,'K'),'fridge':(34,68,'K'),'sofa':(96,50,'K'),'table':(70,44,'K'),'shelf':(54,64,'K'),
 'bed':(92,56,'K'),'wardrobe':(60,76,'K'),'jacket':(30,56,'B'),'bagSpot':(32,40,'B'),'basket':(34,40,'B'),'keyHook':(32,28,'B'),
 'shoeRack':(66,30,'B'),'sink':(58,40,'K'),'tv':(60,50,'K'),'charger':(28,24,'B'),'rug':(92,52,'A'),'plant':(30,60,'K'),
 'papers':(34,26,'B'),'bin':(26,32,'K')}
SPOT_PRIO = {'drawer':'S','cabinet':'S','fridge':'S','sofa':'S','table':'S','shelf':'S','bed':'S','wardrobe':'S','jacket':'S','bagSpot':'S',
 'basket':'S','keyHook':'S','shoeRack':'S','sink':'S','tv':'S','charger':'S','rug':'S','plant':'S','papers':'S','bin':'S'}
NEW_SPOTS = {  # 12 kinds for the new rooms (study, laundry, balcony, garden)
 'deskDrawer':(60,50,'K'),'bookcase':(60,72,'K'),'washer':(36,52,'K'),'dryer':(36,52,'K'),'laundryBasket':(34,38,'B'),
 'toolbox':(32,26,'B'),'planter':(40,40,'B'),'mailbox':(26,46,'B'),'wateringCan':(30,30,'B'),'bench':(64,40,'K'),
 'medCabinet':(34,44,'K'),'hamper':(34,40,'B')}
E_ = []
def add(group, key, size, frames, anchor, states, prio, src, note='', ids=None):
    E_.append(dict(group=group, key=key, size=size, frames=frames, anchor=anchor, states=states, prio=prio, src=src, note=note, ids=ids or []))
for k,(w,h,s) in SPOTS.items(): add('spot', f'spot/{k}/<closed|open>', f'{w}x{h}', 2, 'footprint top vertex', 'closed,open', SPOT_PRIO[k], s, 'existing kind')
for k,(w,h,s) in NEW_SPOTS.items(): add('spot', f'spot/{k}/<closed|open>', f'{w}x{h}', 2, 'footprint top vertex', 'closed,open', 'A', s, 'new-room kind')
PROPS = {
 'K':{ 'furniture':'loungeSofa loungeChair loungeDesignSofa chairDesk chair bench tableCoffee tableCoffeeGlass sideTable sideTableDrawers tableRound desk bookcaseOpen bookcaseClosed cabinetTelevision kitchenCabinet kitchenCabinetUpper kitchenStove kitchenSink kitchenFridgeSmall kitchenBar stoolBar bedSingle bedDouble cabinetBed bathtub toilet bathroomSink shower washer dryer coatRack coatRackStanding stairs stairsOpen doorway lampSquareFloor lampRoundFloor lampRoundTable lampWall ceilingFan computerScreen laptop radio speaker televisionVintage televisionModern pottedPlant plantSmall1 plantSmall2 plantSmall3 trashcan bear pillow pillowBlue rugDoormat'.split()},
 'B':{ 'food':'bread apple banana teapot teacup mug plate bowl pan cuttingBoard jam cookies cake lemon bottle glassWater kettle toaster'.split(),
       'books-paper':'bookStack bookOpen bookTilted notepad newspaper postcard poster1 poster2 poster3 calendar sticky envelope magazine photoFrame1 photoFrame2'.split(),
       'plants':'cactus fern herbPot hangingPlant tulips sunflower succulent vase monstera bonsai windowBox gardenBed tomatoes'.split(),
       'tech-music':'speakerSmall record guitar headphones robotVacuum alarmClock lamp desk_lamp phone_old controller camera'.split(),
       'home-misc':'umbrella shoesPair slippers scarf hat towel towelStack soap toothbrush bathMat laundryPile sock iron ironingBoard broom bucket toolHammer toolWrench keyring catBowl catBed catToy dogBed dogBowl ball clockWall mirrorWall curtainL curtainR bunting fairyLights candle fireplace rugRound rugRect'.split()},
}
for src,groups in PROPS.items():
    for g,ids in groups.items():
        add('prop', 'prop/<id>', '16x16..48x48', len(ids), 'footprint top vertex (wall mounts: base line)', 'static', 'S' if src=='K' else 'A', src, g, ids)
ROOMS='entrance living kitchen laundry bedroom bathroom study balcony garden'.split()
add('shell','shell/<room>/floor','one per room, native footprint',len(ROOMS),'floor top vertex','static','S','A','plank/checker/stone floors',ROOMS)
add('shell','shell/<room>/wallL + wallR + trimL + trimR','per room',len(ROOMS)*4,'floor top vertex','static','S','A','wallpaper + wainscot + trim',ROOMS)
add('shell','shell/<room>/window<n>/<day|dusk|night>','24x32',len(ROOMS)*3,'wall base','3 times of day','S','A','window with light glow',ROOMS)
add('shell','shell/<room>/door<n>','24x40',len(ROOMS)*2,'wall base','closed,open','S','K','doorway/doorwayOpen derived',ROOMS)
add('shell','shell/house/stairs + landing + railing','48x56',3,'step 0 top vertex','static','S','K','stairs/stairsOpen derived')
add('material','mat/<name>','tileable 16x8 or 8x8',14,'n/a','static','S','A','plankWarm plankDark checker stoneTile grass woodPanel stripeCream stripeSky stripeSage dotsRose rugDiamond rugStripe bricks carpet')
add('house','house/frame + roof + garden + sky + backdrop','dollhouse pieces',10,'n/a','lit,dark,locked','S','B','dollhouse frame, two floors, garden plot, dark patterned backdrop')
add('house','house/mini/<room>','mini shells 1/3 scale',len(ROOMS)*2,'n/a','lit,dark','S','A','dollhouse miniatures, lit/dark',ROOMS)
add('avatar','avatar/<se|sw>/<idle|walk|reach>/<n>','16x28',2*(2+6+3),'feet centre','tags idle(2) walk(6) reach(3)','S','B','player avatar, two iso directions')
add('pet','pet/cat/<sleep|idle|walk|react|eat>/<n>','20x16',4+4+6+4+4,'feet centre','sleep(4) idle(4) walk(6) react(4) eat(4)','S','B','house cat')
add('pet','pet/cat/outfit/<hat|scarf|bow|glasses>','20x16',4,'feet centre','static','B','B','outfits, B')
add('ui','ui/<name> (nine-slices, buttons x3 states, tray, notebook, toggles, sliders, tabs, badges, cursor x3, progress bar)','24x24..96x48',60,'top-left','up,hover,pressed','S','B','UI kit about 60 pieces')
add('icon','icon/<item> (8 items + 8 clue types + 10 actions + 20 decor + 14 misc)','16x16 and 32x32',60,'centre','static','S','B','item and clue icons')
add('fx','fx/<name>/<n> (16 FxNames x about 4 frames + rain streak + dust mote + steam + sparkle)','4x4..16x16',20+16*4,'centre','once','S','B','pixel particle frames')
add('ambient','ambient/<name>/<n> (steam, curtain sway, plant sway, clock, fire, tv flicker, lamp pulse, window light, dust, rain)','varies',10*4,'object anchor','loop','A','B','focused room only')
add('puzzle','puzzle/<kind>/<name>','close-up skins, about 6 pieces per kind',23*6,'top-left','state frames','S for code/lights/memory, else A','B','themed mechanisms: lock dials, light switches, memory cards, etc. (23 kinds)')
def count(e): return e['frames']
total = sum(count(e) for e in E_)
by = {}
for e in E_: by[e['group']] = by.get(e['group'],0)+count(e)
os.makedirs(os.path.join(ROOT,'docs','art'), exist_ok=True)
json.dump({'version':1,'total_frames':total,'entries':E_}, open(os.path.join(ROOT,'docs','art','asset-list.json'),'w'), indent=1)
L = ['# Scatterly Asset List v1 (AI-4)','','Generated by `python3 tools/assetlist/build.py`; edit the data there, not this file. Source: **K** = rendered from the Kenney Furniture Kit (CC0), **B** = built by us (pixel DSL/voxel), **A** = algorithmic generator. Priority: **S** vertical slice, **A** production, **B** polish. Sizes are native art px (1 art px = 3 game px). Machine-readable copy: `asset-list.json`.','',
 f'**Total planned frames: {total}** ('+', '.join(f'{g} {n}' for g,n in by.items())+')','','| Group | Key | Size | Frames | Anchor | States / tags | Prio | Src | Note |','|---|---|---|---|---|---|---|---|---|']
for e in E_:
    note = e['note'] + ((': ' + ' '.join(e['ids'])) if e['ids'] and e['group']=='prop' else '')
    L.append(f"| {e['group']} | `{e['key']}` | {e['size']} | {e['frames']} | {e['anchor']} | {e['states']} | {e['prio']} | {e['src']} | {note} |")
props = sum(len(e['ids']) for e in E_ if e['group']=='prop')
L += ['',f'Unique props: {props} (requirement: 120+). Spot kinds: {len(SPOTS)} existing + {len(NEW_SPOTS)} new-room kinds, each closed/open.','',
 'Slice (Gate A) subset: living + kitchen + bedroom + stairs shells, 25+ props each from the prop list, the 20 existing spot kinds, avatar, cat, UI kit, 8 item icons, puzzle skins code/lights/memory, dollhouse frame + 3 mini shells.']
open(os.path.join(ROOT,'docs','art','ASSET-LIST.md'),'w').write('\n'.join(L)+'\n')
print(total, by, 'props', props)
