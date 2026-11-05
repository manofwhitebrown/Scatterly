import Phaser from 'phaser';
import { GAME_H, GAME_W, ITEM_LABEL, LEGACY_ROOMS, SCENE, tex } from '../shared/types';
import type { DecorView, ItemId, PlayerProfile, RoomId, Spot } from '../shared/types';
import { DECOR, allSpots, buyDecor, homeSpotCandidates, listDecor, setHomeSpot } from '../logic';
import { commitProfile, defaultProfile } from '../core/save';
import { isLowFx } from '../core/perf';
import { sfx } from '../audio/sfx';
import { ensureAllRoomTextures } from '../art';
import { PAL, makeButton, makeText, panelBox, shade, vgrad } from '../art/palette';
import type { G } from '../art/palette';

const S = 0.6;
const PRE_X = 24;
const PRE_Y = 100;
const LIST = { x: 832, y: 140, w: 424, h: 500 };
const ROW_H = 104;
const CARD_W = 412;
const POOL_IMAGES = 36;
const ESSENTIALS: ItemId[] = ['keys', 'wallet', 'phone', 'officeId', 'bag'];
const ROOM_NAME: Record<RoomId, string> = {
  entrance: 'Entrance', living: 'Living room', kitchen: 'Kitchen', bedroom: 'Bedroom', bathroom: 'Bathroom',
  laundry: 'Laundry', study: 'Study', balcony: 'Balcony', garden: 'Garden',
};

type Tab = 'shop' | 'home';
type Txt = Phaser.GameObjects.Text;
type Img = Phaser.GameObjects.Image;
interface ShopRow { icon: Img; name: Txt; benefit: Txt; price: Txt; buy: Txt }
interface HomeRow { icon: Img; name: Txt; spot: Txt; left: Phaser.GameObjects.Zone; right: Phaser.GameObjects.Zone }

function setHit(o: Phaser.GameObjects.GameObject, on: boolean): void {
  if (o.input) o.input.enabled = on;
}

export class OrganiseScene extends Phaser.Scene {
  private profile: PlayerProfile = defaultProfile();
  private room: RoomId = 'entrance';
  private tab: Tab = 'shop';
  private ui!: Phaser.GameObjects.Layer;
  private list!: Phaser.GameObjects.Layer;
  private listCam!: Phaser.Cameras.Scene2D.Camera;
  private scroll = 0;
  private maxScroll = 0;
  private dragY = 0;
  private dragScroll = 0;
  private dragging = false;
  private moved = false;
  private roomImg!: Img;
  private pool: Img[] = [];
  private tabG!: G;
  private roomTabs: Txt[] = [];
  private shopTab!: Txt;
  private homeTab!: Txt;
  private coins!: Txt;
  private blurb!: Txt;
  private rowG!: G;
  private homeG!: G;
  private shopRows: ShopRow[] = [];
  private homeRows: HomeRow[] = [];
  private shopViews: DecorView[] = [];
  private homeOpts: (Spot | null)[][] = [];
  private lowFx = false;

  constructor() {
    super(SCENE.Organise);
  }

  private readProfile(): PlayerProfile {
    const p = this.registry.get('profile') as PlayerProfile | undefined;
    this.profile = p ?? defaultProfile();
    return this.profile;
  }

  private u<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.ui.add(o);
    return o;
  }
  private l<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.list.add(o);
    return o;
  }

  create(): void {
    this.lowFx = isLowFx(this.game);
    this.readProfile();
    this.room = this.profile.unlockedRooms[0] ?? 'entrance';
    this.tab = 'shop';
    this.scroll = 0;
    this.dragging = false; this.moved = false; this.pool = [];
    this.roomTabs = [];
    this.shopRows = [];
    this.homeRows = [];
    this.ui = this.add.layer();
    this.list = this.add.layer();
    this.buildFrame();
    this.buildTabs();
    this.buildShopRows();
    this.buildHomeRows();
    this.listCam = this.cameras.add(LIST.x, LIST.y, LIST.w, LIST.h);
    this.cameras.main.ignore(this.list);
    this.cameras.main.ignore(this.list.getAll());
    this.listCam.ignore(this.ui);
    this.listCam.ignore(this.ui.getAll());
    this.wireScroll();
    this.input.once('pointerdown', () => sfx.unlock());
    this.refreshAll();
  }

  private buildFrame(): void {
    const bg = this.add.graphics();
    vgrad(bg, 0, 0, GAME_W, GAME_H, 0xf7e6c8, 0xeed7b0, 8);
    this.u(bg);
    const fr = this.add.graphics();
    panelBox(fr, PRE_X - 8, PRE_Y - 8, 768 * 1 + 16, 432 + 16, 18, PAL.woodDark, shade(PAL.woodDark, -0.4), 3);
    panelBox(fr, LIST.x - 8, LIST.y - 8, LIST.w + 16, LIST.h + 16, 18, PAL.panel, PAL.panelEdge, 3);
    fr.fillStyle(PAL.gold, 1);
    fr.fillCircle(PRE_X + 20, PRE_Y + 432 + 44, 14);
    fr.fillStyle(shade(PAL.gold, -0.25), 1);
    fr.fillCircle(PRE_X + 20, PRE_Y + 432 + 44, 8);
    this.u(fr);
    ensureAllRoomTextures(this);
    this.roomImg = this.u(this.add.image(PRE_X, PRE_Y, tex.room('entrance')).setOrigin(0, 0).setScale(S));
    for (let i = 0; i < POOL_IMAGES; i++) {
      this.pool.push(this.u(this.add.image(0, 0, tex.room('entrance')).setOrigin(0, 0).setScale(S).setVisible(false)));
    }
    this.coins = this.u(makeText(this, PRE_X + 44, PRE_Y + 432 + 44, '', 30, PAL.ink, { bold: true, oy: 0.5 }));
    this.blurb = this.u(makeText(this, LIST.x, 96, '', 17, PAL.inkSoft, { wrap: LIST.w, oy: 0.5 }));
    const back = makeButton(this, 24 + 100, GAME_H - 46, 200, 56, 'Back', () => { sfx.play('tap'); this.scene.start(SCENE.Menu); }, { fill: PAL.sageDark });
    this.u(back.g);
    this.u(back.label);
  }

  private buildTabs(): void {
    this.tabG = this.u(this.add.graphics());
    for (const id of LEGACY_ROOMS) {
      const t = this.u(makeText(this, 0, 24, ROOM_NAME[id], 20, PAL.ink, { bold: true, padX: 14, padY: 16 }));
      t.setInteractive();
      t.on('pointerup', () => this.pickRoom(id));
      this.roomTabs.push(t);
    }
    this.shopTab = this.u(makeText(this, LIST.x, 24, 'Shop', 22, PAL.ink, { bold: true, padX: 28, padY: 16 }));
    this.homeTab = this.u(makeText(this, LIST.x + 140, 24, 'Home spots', 22, PAL.ink, { bold: true, padX: 28, padY: 16 }));
    this.shopTab.setInteractive();
    this.homeTab.setInteractive();
    this.shopTab.on('pointerup', () => this.pickTab('shop'));
    this.homeTab.on('pointerup', () => this.pickTab('home'));
    this.homeTab.setX(LIST.x + this.shopTab.width + 12);
  }

  private buildShopRows(): void {
    const per = new Map<RoomId, number>();
    for (const d of DECOR) per.set(d.room, (per.get(d.room) ?? 0) + 1);
    let n = 1;
    per.forEach((v) => { n = Math.max(n, v); });
    n = Math.min(n, 12);
    this.rowG = this.l(this.add.graphics());
    for (let i = 0; i < n; i++) {
      const y = i * ROW_H + 4;
      const icon = this.l(this.add.image(46, y + 48, tex.icon('note')));
      const name = this.l(makeText(this, 92, y + 8, '', 22, PAL.ink, { bold: true }));
      const benefit = this.l(makeText(this, 92, y + 36, '', 15, PAL.inkSoft, { wrap: 188 }));
      const price = this.l(makeText(this, 92, y + 74, '', 16, PAL.ink, { bold: true }));
      const buy = this.l(makeText(this, 346, y + 48, 'Buy', 22, PAL.white, { bold: true, ox: 0.5, oy: 0.5, padX: 18, padY: 16 }));
      buy.setInteractive();
      buy.on('pointerup', () => this.onBuy(i));
      this.shopRows.push({ icon, name, benefit, price, buy });
    }
  }

  private buildHomeRows(): void {
    this.homeG = this.l(this.add.graphics());
    ESSENTIALS.forEach((item, i) => {
      const y = i * ROW_H + 4;
      const icon = this.l(this.add.image(46, y + 48, tex.item(item)));
      icon.setScale(0.58);
      const name = this.l(makeText(this, 84, y + 10, ITEM_LABEL[item], 21, PAL.ink, { bold: true }));
      const spot = this.l(makeText(this, 84, y + 40, '', 16, PAL.inkSoft, { wrap: 190 }));
      const left = this.l(this.add.zone(306, y + 48, 64, 64).setInteractive());
      const right = this.l(this.add.zone(372, y + 48, 64, 64).setInteractive());
      left.on('pointerup', () => this.onCycle(i, -1));
      right.on('pointerup', () => this.onCycle(i, 1));
      this.homeRows.push({ icon, name, spot, left, right });
    });
  }

  private wireScroll(): void {
    const inside = (x: number, y: number): boolean => x >= LIST.x && x <= LIST.x + LIST.w && y >= LIST.y && y <= LIST.y + LIST.h;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.moved = false;
      this.dragging = inside(p.x, p.y);
      this.dragY = p.y;
      this.dragScroll = this.scroll;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragging || !p.isDown) return;
      const dy = p.y - this.dragY;
      if (Math.abs(dy) > 8) this.moved = true;
      if (this.moved) this.setScroll(this.dragScroll - dy);
    });
    this.input.on('pointerup', () => { this.dragging = false; });
    this.input.on('wheel', (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      if (inside(p.x, p.y)) this.setScroll(this.scroll + dy);
    });
  }

  private setScroll(v: number): void {
    this.scroll = Phaser.Math.Clamp(v, 0, this.maxScroll);
    this.listCam.setScroll(0, this.scroll);
  }

  private pickRoom(id: RoomId): void {
    if (id === this.room) return;
    this.room = id;
    sfx.play('tap');
    this.scroll = 0;
    this.refreshAll();
  }

  private pickTab(t: Tab): void {
    if (t === this.tab) return;
    this.tab = t;
    sfx.play('tap');
    this.scroll = 0;
    this.refreshAll();
  }

  private refreshAll(): void {
    const p = this.readProfile();
    if (!p.unlockedRooms.includes(this.room)) this.room = p.unlockedRooms[0] ?? 'entrance';
    this.layoutTabs();
    this.refreshPreview();
    this.bindShop();
    this.bindHome();
    const rows = this.tab === 'shop' ? this.shopViews.length : ESSENTIALS.length;
    this.maxScroll = Math.max(0, rows * ROW_H + 8 - LIST.h);
    this.setScroll(this.scroll);
    const c = `Coins: ${p.coins}`;
    if (this.coins.text !== c) this.coins.setText(c);
    const b = this.tab === 'shop' ? 'Spend coins on storage that makes your mornings easier.' : 'Keep things in one place and your mornings get easier.';
    if (this.blurb.text !== b) this.blurb.setText(b);
  }

  private layoutTabs(): void {
    const g = this.tabG;
    g.clear();
    let x = PRE_X;
    LEGACY_ROOMS.forEach((id, i) => {
      const t = this.roomTabs[i];
      const open = this.profile.unlockedRooms.includes(id);
      t.setVisible(open);
      setHit(t, open);
      if (!open) return;
      t.setPosition(x, 22);
      const sel = id === this.room;
      panelBox(g, x, 22, t.width, t.height, 14, sel ? PAL.terracotta : PAL.panelEdge);
      t.setColor(sel ? '#ffffff' : '#3b2f2a');
      x += t.width + 8;
    });
    for (const [t, key] of [[this.shopTab, 'shop'], [this.homeTab, 'home']] as [Txt, Tab][]) {
      const sel = this.tab === key;
      panelBox(g, t.x, 22, t.width, t.height, 14, sel ? PAL.terracotta : PAL.panelEdge);
      t.setColor(sel ? '#ffffff' : '#3b2f2a');
      t.setPosition(t.x, 22);
    }
  }

  private place(img: Img, key: string, x: number, y: number): boolean {
    if (!this.textures.exists(key)) {
      img.setVisible(false);
      return false;
    }
    img.setTexture(key).setPosition(PRE_X + x * S, PRE_Y + y * S).setVisible(true);
    return true;
  }

  private refreshPreview(): void {
    this.roomImg.setTexture(this.textures.exists(tex.room(this.room)) ? tex.room(this.room) : tex.room('entrance'));
    const owned = new Set(this.profile.owned);
    let k = 0;
    for (const d of DECOR) {
      if (d.room !== this.room || d.kind !== 'cosmetic' || !owned.has(d.id) || k >= POOL_IMAGES) continue;
      if (this.place(this.pool[k], tex.decor(d.id), d.x, d.y)) k++;
    }
    const spots = allSpots(this.profile).filter((s) => s.room === this.room).sort((a, b) => a.y + a.h - (b.y + b.h));
    for (const s of spots) {
      if (k >= POOL_IMAGES) break;
      if (this.place(this.pool[k], tex.spot(s.kind), s.x, s.y)) k++;
    }
    for (; k < POOL_IMAGES; k++) this.pool[k].setVisible(false);
  }

  private bindShop(): void {
    const show = this.tab === 'shop';
    this.shopViews = listDecor(this.profile)
      .filter((v) => v.def.room === this.room)
      .sort((a, b) => a.def.unlockDay - b.def.unlockDay || a.def.price - b.def.price)
      .slice(0, this.shopRows.length);
    const g = this.rowG;
    g.clear();
    this.shopRows.forEach((r, i) => {
      const v = this.shopViews[i];
      const vis = show && !!v;
      for (const o of [r.icon, r.name, r.benefit, r.price, r.buy]) o.setVisible(vis);
      setHit(r.buy, vis);
      if (!vis) return;
      const d = v.def;
      const y = i * ROW_H + 4;
      panelBox(g, 0, y, CARD_W, 96, 14, v.owned ? shade(PAL.sage, 0.6) : PAL.cream, PAL.panelEdge, 2);
      const key = tex.decor(d.id);
      if (this.textures.exists(key)) {
        r.icon.setTexture(key).setScale(Math.min(64 / r.icon.width, 64 / r.icon.height));
        r.icon.setVisible(true);
      } else {
        r.icon.setVisible(false);
      }
      r.name.setText(d.name);
      r.benefit.setText(d.kind === 'storage' && d.benefit ? d.benefit : 'A cosy touch for the room.');
      let label = 'Buy';
      let fill: number = PAL.terracotta;
      let price = `${d.price} coins`;
      if (v.owned) { label = 'Owned'; fill = PAL.sageDark; price = 'In your home'; }
      else if (v.locked) { label = `Day ${d.unlockDay}`; fill = PAL.disabled; price = `Unlocks on day ${d.unlockDay}`; }
      else if (!v.canBuy) { fill = PAL.disabled; price = `Need ${Math.max(1, d.price - this.profile.coins)} more coins`; }
      r.price.setText(price);
      r.buy.setText(label);
      r.buy.setColor(v.locked || (!v.canBuy && !v.owned) ? '#6b5a50' : '#ffffff');
      setHit(r.buy, !v.owned);
      panelBox(g, 286, y + 18, 120, 60, 14, fill);
    });
  }

  private bindHome(): void {
    const show = this.tab === 'home';
    const g = this.homeG;
    g.clear();
    this.homeOpts = [];
    this.homeRows.forEach((r, i) => {
      const item = ESSENTIALS[i];
      for (const o of [r.icon, r.name, r.spot]) o.setVisible(show);
      r.left.setVisible(show);
      r.right.setVisible(show);
      const opts: (Spot | null)[] = [null, ...homeSpotCandidates(this.profile, item)];
      this.homeOpts.push(opts);
      const can = opts.length > 1;
      setHit(r.left, show && can);
      setHit(r.right, show && can);
      if (!show) return;
      const y = i * ROW_H + 4;
      panelBox(g, 0, y, CARD_W, 96, 14, PAL.cream, PAL.panelEdge, 2);
      const cur = this.profile.homeSpots[item];
      const spot = cur ? opts.find((o) => o !== null && o.id === cur) ?? null : null;
      const text = spot ? `${spot.label} (${ROOM_NAME[spot.room]})` : can ? 'None chosen' : 'No spot yet - buy storage';
      r.spot.setText(text);
      const fill: number = can ? PAL.terracotta : PAL.disabled;
      panelBox(g, 274, y + 20, 64, 56, 12, fill);
      panelBox(g, 342, y + 20, 64, 56, 12, fill);
      g.fillStyle(PAL.white, 1);
      g.fillTriangle(314, y + 34, 314, y + 62, 296, y + 48);
      g.fillTriangle(364, y + 34, 364, y + 62, 382, y + 48);
    });
  }

  private onBuy(i: number): void {
    if (this.moved || this.tab !== 'shop') return;
    const v = this.shopViews[i];
    if (!v || v.owned) return;
    if (!v.canBuy) {
      sfx.play('error');
      return;
    }
    const next = buyDecor(this.profile, v.def.id);
    if (!next) {
      sfx.play('error');
      return;
    }
    commitProfile(this.game, next);
    sfx.play('coin');
    this.refreshAll();
    if (!this.lowFx) {
      const icon = this.shopRows[i].icon;
      const base = icon.scale;
      this.tweens.add({ targets: icon, scale: base * 1.25, duration: 120, yoyo: true });
    }
  }

  private onCycle(i: number, dir: number): void {
    if (this.moved || this.tab !== 'home') return;
    const opts = this.homeOpts[i];
    if (!opts || opts.length < 2) return;
    const item = ESSENTIALS[i];
    const cur = this.profile.homeSpots[item];
    let idx = Math.max(0, opts.findIndex((o) => o !== null && o.id === cur));
    idx = (idx + dir + opts.length) % opts.length;
    const pick = opts[idx];
    commitProfile(this.game, setHomeSpot(this.profile, item, pick ? pick.id : null));
    sfx.play('tap');
    this.refreshAll();
  }
}

