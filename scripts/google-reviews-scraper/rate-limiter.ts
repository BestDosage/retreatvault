export async function humanDelay(baseMs: number): Promise<void> {
  const jitter = baseMs * (0.3 + Math.random() * 0.7);
  const total = Math.floor(baseMs + jitter);
  return new Promise(resolve => setTimeout(resolve, total));
}

export class RateLimiter {
  private lastAction = 0;

  constructor(private minGapMs: number) {}

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastAction;
    if (elapsed < this.minGapMs) {
      await humanDelay(this.minGapMs - elapsed);
    }
    this.lastAction = Date.now();
  }
}
