import { motionRequestPermission, motionStartOrientation } from "./motion";
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Particle } from "./particle";

export const sketch = new p5((p) => {
  let isGameOver = false; // Estado del juego

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

    // Esto mantiene la pantalla encendida
    await KeepAwake.keepAwake();

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

    // Lógica de juego
    if (isGameOver) {
      // PANTALLA DE GAME OVER
      p.fill(255, 0, 0);
      p.textSize(40);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("GAME OVER", p.width / 2, p.height / 2 - 20);
      
      p.fill(255);
      p.textSize(20);
      p.text("Toca para reiniciar", p.width / 2, p.height / 2 + 30);
      
      // Detenemos la creación y movimiento de partículas
      // (simplemente no llamamos a spawnParticles ni update...)
      
      // Pero dibujamos las partículas estáticas para que se vea qué te mató
      for (let particle of particles) {
        particle.draw(); 
      }

    } else {
      // Sigue el juego
      spawnParticles();
      updateAndDrawParticles();
    }

    // Dibuja suelo y jugador
    p.fill(250);
    p.rect(0, p.height - floorHeight, p.width, floorHeight);
    drawPlayer(70); 
  };

  p.mousePressed = () => {
    if (isGameOver) {
      // Resetear el juego
      particles = [];
      player.x = p.width / 2;
      vx = 0;
      spawnEvery = 50;
      isGameOver = false;
    }
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

      //Distancia entre jugador y partícula
      const d = p.dist(player.x, player.y, particle.pos.x, particle.pos.y);

      //Suma de radios (mitad player.size + particle.radius)
      let minDist = (player.size / 2) + particle.radius;

      // Si hay colisión
      if(d < minDist) {
        isGameOver = true;
        // p.noLoop(); // Detener el juego
        // console.log("¡Juego terminado!");
        //TODO: manejar fin de juego
        //TODO: efectos sonido / visuales
        //TODO: botón reiniciar
      }

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
