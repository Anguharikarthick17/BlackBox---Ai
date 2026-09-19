/**
 * BLACKBOX X — Phase 3.8
 * Deterministic Seeded Pseudo-Random Number Generator (PRNG)
 *
 * Implements a high-quality 32-bit Mulberry32 generator with Box-Muller Gaussian transform.
 * Guarantees bit-identical output across identical seeds and execution environments.
 * Math.random() is strictly forbidden.
 */

export class DeterministicPRNG {
  private state: number;

  constructor(seed: number) {
    // Coerce to 32-bit unsigned integer
    this.state = Math.abs(Math.floor(seed)) >>> 0;
    if (this.state === 0) {
      this.state = 0x6d2b79f5;
    }
  }

  /**
   * Generates a deterministic pseudo-random float in the half-open interval [0, 1).
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates a deterministic standard normal random variable Z ~ N(0, 1)
   * using the Box-Muller transform.
   */
  public nextGaussian(): number {
    let u = 0;
    let v = 0;
    // Discard zero to avoid log(0) = -Infinity
    while (u === 0) {
      u = this.next();
    }
    while (v === 0) {
      v = this.next();
    }
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Generates a random integer in the closed interval [min, max].
   */
  public nextInt(min: number, max: number): number {
    const u = this.next();
    return Math.floor(u * (max - min + 1)) + min;
  }
}
