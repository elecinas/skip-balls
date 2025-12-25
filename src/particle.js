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
      // --- PARTÍCULA DE DAÑO (ROJO) ---
      p.drawingContext.shadowBlur = 20;
      p.drawingContext.shadowColor = '#ff2a6d'; 
      p.fill('#ff2a6d');
    } else {
      // --- MONEDA (AMARILLO ELÉCTRICO) ---
      p.drawingContext.shadowBlur = 15;
      p.drawingContext.shadowColor = '#f5d300';
      p.fill('#f5d300'); 
    }
    p.circle(this.pos.x, this.pos.y, this.radius * 2);
    // Si es moneda, dibujamos un símbolo dentro
    // Quitamos el efecto de brillo (shadow) para el texto de dentro
    p.drawingContext.shadowBlur = 0;

    if (this.type === "coin") {
      p.fill(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(this.radius * 1.2); // Un poco más grande
      p.textStyle(p.BOLD);
      p.text("$", this.pos.x, this.pos.y + 1); // +1 para centrar
    }
  }

  isOffScreen() {
    return this.pos.y - this.radius > this.p.height;
  }
}
