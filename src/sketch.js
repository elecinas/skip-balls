import { motionRequestPermission, motionStartOrientation } from "./motion";
import { Particle } from "./particle";

export const sketch = new p5((p) => {
  // Variables para orientación
  // alpha: rotación alrededor del eje Z (0..360)
  // beta: inclinación adelante/atrás (-180..180)
  // gamma: inclinación izquierda/derecha (-90..90)
  let degrees = { alpha: 0, beta: 0, gamma: 0 };
  let player = { x: 0, y: 0, size: 50 };
  let vx = 0;
  let floorHeight = 100;

  // Partículas del cielo
  let particles = [];

  //Configuración de la dificultad
  let maxParticles = 40;
  let spawnEvery = 50; // Una bomba cada 50 frames

  p.setup = async () => {
    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent("p5-container");

    // Permiso (sobre todo iOS)
    let permission = await motionRequestPermission();
    console.log("Motion permission:", permission);

    // Listener de orientación
   await motionStartOrientation((o) => {
      degrees = o;
    });

    // Para limpiar listeners al salir (si es necesario)
    // window.onbeforeunload = async () => {
    //   await unsubscribe();
    // };
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    p.background(0);

    // Partículas
    spawnParticles();
    updateAndDrawParticles();

    // Suelo
    p.fill(250);
    p.rect(0, p.height - floorHeight, p.width, floorHeight);

    drawPlayer(70);

    // p.fill(255);
    // p.textSize(24);
    // p.textAlign(p.CENTER, p.CENTER);
    // p.text("Juego (pantalla completa)", p.width / 2, p.height / 2);
    // p.text(`gamma: ${degrees.gamma.toFixed(1)}`, p.width / 2, p.height / 2 + 100);

  };

  function spawnParticles() {
    //si no es el frame adecuado, salir
    if(p.frameCount % spawnEvery !== 0) return;

    // si ya hay muchas partículas, salir
    if(particles.length >= maxParticles) return;

    // Posición aleatoria en x, arriba de la pantalla
    const x = p.random(20, p.width - 20);
    const y = -30;

    //Variación de tamaño y velocidad
    const radius = p.random(10, 20);
    const vel = p.random(0.07, 0.2);

    particles.push( new Particle(p, x, y, radius, vel) );

    // Hacer el juego más difícil con el tiempo.
    // Cada 500 frames (aprox 8 segundos), reducimos el tiempo de aparición
    if (p.frameCount % 500 === 0 && spawnEvery > 15) {
      spawnEvery -= 2; // Hace que salgan más rápido poco a poco
    }
  }

  function updateAndDrawParticles() {
    // Recorrer partículas al revés para poder eliminar
    for(let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.update();
      particle.draw();

      // Si la partícula está fuera de la pantalla, eliminarla
      if(particle.isOffScreen(p.height - floorHeight)) {
        particles.splice(i, 1);
      }
    }
  }

  function drawPlayer(size = 50) {
    const playerRadius = player.size / 2;

    // Calcular aceleración según inclinación
    const gravity = p.constrain(degrees.gamma, -45, 45); //limitar valores extremos
    const acceleration = p.map(gravity, -45, 45, -0.4, 0.4); //aceleración según inclinación

    // Actualizar velocidad y posición
    vx += acceleration; // actualizar velocidad
    vx *= 0.95; // fricción
    player.x += vx; // actualizar posición
    player.size = size; // definir tamaño

    // Limitar posición dentro de la pantalla
    if (player.x < playerRadius) {player.x = playerRadius; vx = 0;}
    if (player.x > p.width - playerRadius) {player.x = p.width - playerRadius; vx = 0;}

    // Posición vertical fija
    player.y = p.height - playerRadius - floorHeight;

    // Dibujar jugador
    p.fill(100);
    p.circle(player.x, player.y, player.size);
  }
});
