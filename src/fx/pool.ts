/** Fixed-capacity pool. When full, `acquire` recycles the oldest live entry so effects never allocate or throw. */
export class Pool<T> {
  private readonly items: T[] = [];
  private readonly live: boolean[] = [];
  private readonly order: number[] = [];

  constructor(private readonly cap: number, private readonly make: () => T) {}

  get size(): number {
    return this.items.length;
  }

  get liveCount(): number {
    let n = 0;
    for (let i = 0; i < this.live.length; i++) if (this.live[i]) n++;
    return n;
  }

  /** Returns [item, index, recycled]. `recycled` is true when the oldest live entry was stolen. */
  acquire(): { item: T; index: number; recycled: boolean } {
    for (let i = 0; i < this.items.length; i++) {
      if (!this.live[i]) return this.take(i, false);
    }
    if (this.items.length < this.cap) {
      this.items.push(this.make());
      this.live.push(false);
      return this.take(this.items.length - 1, false);
    }
    const oldest = this.order.shift() ?? 0;
    return this.take(oldest, true);
  }

  release(index: number): void {
    if (index < 0 || index >= this.live.length || !this.live[index]) return;
    this.live[index] = false;
    const at = this.order.indexOf(index);
    if (at >= 0) this.order.splice(at, 1);
  }

  at(index: number): T {
    return this.items[index];
  }

  forEachLive(fn: (item: T, index: number) => void): void {
    for (let i = 0; i < this.items.length; i++) if (this.live[i]) fn(this.items[i], i);
  }

  private take(index: number, recycled: boolean): { item: T; index: number; recycled: boolean } {
    this.live[index] = true;
    this.order.push(index);
    return { item: this.items[index], index, recycled };
  }
}
