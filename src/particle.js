export class Particle {
  constructor(p, x, y, radius = 10, vel = 1, type = "damage") {
    this.p = p;
    this.pos = p.createVector(x, y);
    this.vel = p.createVector(0, vel);
    this.radius = radius;
    this.type = type; // 'damage' | 'coin'
  }

  update() {
    this.vel.y += 0.02; // gravedad
    this.pos.add(this.vel);
  }

  draw() {
    const p = this.p;
    p.noStroke();
    if (this.type === "damage") {
      p.fill(255, 0, 0); // rojo para partículas dañinas
    } else {
      p.fill(255, 215, 0); // dorado para monedas
    }
    p.circle(this.pos.x, this.pos.y, this.radius * 2);
    // Si es moneda, dibujamos un símbolo dentro
    if (this.type === "coin") {
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(this.radius);
      p.text("$", this.pos.x, this.pos.y);
    }
  }

  isOffScreen() {
    return this.pos.y - this.radius > this.p.height;
  }
}
