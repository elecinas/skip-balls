export class Projectile {
    constructor(p, x, y) {
        this.p = p;
        this.x = x;
        this.y = y;
        this.size = 10;
        this.speed = 15;
        this.toDelete = false; 
    }

    update() {
        this.y -= this.speed; //para arriba
        //si sale de la pantalla se marca para borrar
        if(this.y < -50) {
            this.toDelete = true;
        }
    }

    draw() {
        this.p.push();
        this.p.fill('#ff00ff');
        this.p.noStroke();
        //Efecto de brillo
        this.p.drawingContext.shadowBlur = 10;
        this.p.drawingContext.shadowColor = '#ff00ff';
        this.p.rectMode(this.p.CENTER);
        this.p.rect(this.x, this.y, 6, 20); //rayo laser
        this.p.drawingContext.shadowBlur = 0;
        this.p.pop();
    }
}