import Phaser from 'phaser';
import { isLowFx } from '../core/perf';
import { tex } from '../shared/types';
import type { ItemId } from '../shared/types';
import { CSS, DEPTH, makeText } from '../ui/theme';

/** Short star burst for the win moment. Skipped entirely in low-effects mode. */
export function burst(scene: Phaser.Scene): void {
  if (isLowFx(scene.game)) return;
  for (let i = 0; i < 10; i++) {
    const star = makeText(scene, 640, 360, '★', { fontSize: '44px', color: i % 2 === 0 ? CSS.amber : CSS.cream })
      .setOrigin(0.5)
      .setDepth(DEPTH.fly);
    const a = (i / 10) * Math.PI * 2;
    scene.tweens.add({
      targets: star,
      x: 640 + Math.cos(a) * 280,
      y: 360 + Math.sin(a) * 190,
      alpha: 0,
      duration: 560,
      ease: 'Cubic.easeOut',
      onComplete: () => star.destroy(),
    });
  }
}

/** Flies a pooled image from one point to another (<= 300 ms), then calls done. */
export function flyItem(
  scene: Phaser.Scene,
  img: Phaser.GameObjects.Image,
  item: ItemId,
  from: { x: number; y: number },
  to: { x: number; y: number },
  done: () => void,
): void {
  img.setTexture(tex.item(item)).setPosition(from.x, from.y).setDisplaySize(84, 84).setAlpha(1).setVisible(true);
  scene.tweens.killTweensOf(img);
  scene.tweens.add({
    targets: img,
    x: to.x,
    y: to.y,
    scaleX: 56 / 96,
    scaleY: 56 / 96,
    duration: 280,
    ease: 'Cubic.easeIn',
    onComplete: () => {
      img.setVisible(false);
      done();
    },
  });
}
