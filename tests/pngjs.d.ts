declare module 'pngjs' {
  export const PNG: { sync: { read(buf: Buffer): { width: number; height: number; data: Uint8Array }; write(png: unknown): Buffer }; new (o: { width: number; height: number }): unknown; bitblt(...a: unknown[]): void };
}
