export class Particle {
  constructor(p, x, y, radius = 10, vel = 1) {
    this.p = p;
    this.pos = p.createVector(x, y);
    this.vel = p.createVector(0, vel)
    this.radius = radius;

    //TODO: tipo (daño / bonus)
    this.type = 'damage';
  }

    update() {
        this.vel.y += 0.02; // gravedad
        this.pos.add(this.vel);
    }

    draw() {
        const p = this.p;
        p.noStroke();
        if (this.type === 'damage') {
            p.fill(255, 0, 0);
        } else {
            p.fill(0, 255, 0);
        }
        p.circle(this.pos.x, this.pos.y, this.radius * 2);
    }

    isOffScreen() {
        return this.pos.y - this.radius > this.p.height;
    }
}
 