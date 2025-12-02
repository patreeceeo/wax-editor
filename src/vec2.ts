export class Vec2 {
  x: number;
  y: number;

  static from({ x, y }: { x: number; y: number }): Vec2 {
    return new Vec2(x, y);
  }

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  divide(scalar: number) {
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  translate(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
    return this;
  }

  add(other: Vec2) {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  subtract(other: Vec2) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  isZero(): boolean {
    return this.x === 0 && this.y === 0;
  }

  zero() {
    this.x = 0;
    this.y = 0;
    return this;
  }
}
