import { motionRequestPermission, motionStartOrientation } from "./motion";
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Particle } from "./particle";
import { GameStorage } from "./storage";

export const sketch = new p5((p) => {
  let isGameOver = false; // Estado del juego
  let sessionCoins = 0; // Monedas ganadas en la sesión actual
  let currentUsername = "Jugador";

  // Variables para orientación
  // alpha: rotación alrededor del eje Z (0..360)
  // beta: inclinación adelante/atrás (-180..180)
  // gamma: inclinación izquierda/derecha (-90..90)
  let degrees = { alpha: 0, beta: 0, gamma: 0 };
  let player = { x: 0, y: 0, size: 70 };
  let vx = 0;
  let floorHeight = 100;

  // Partículas del cielo
  let particles = [];

  //Configuración de la dificultad
  let maxParticles = 40;
  let spawnEvery = 50; // Una bomba cada 50 frames

  // --- IMÁGENES ---
  let charImages = {}; // Objeto para imágenes cargadas: { 0: img1, 1: img2 }
  let currentSkin = null; // La imagen actual

  // PRECARGA DE IMÁGENES
  p.preload = () => {
    const data = GameStorage.getData();
    // Recorremos array personajes y cargamos imágenes
    data.characters.forEach(char => {
      charImages[char.id] = p.loadImage(char.img); // cargar imagen en memoria
      console.log("Cargando imagen personaje:", char.id, char.img);
    });

  };

  p.setup = async () => {
    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent("p5-container");

    // Dibujar imágenes desde el CENTRO
    p.imageMode(p.CENTER);

    // Permiso
    let permission = await motionRequestPermission();
    console.log("Motion permission:", permission);

    // Obtener nombre de usuario actual
    const data = GameStorage.getData();
    currentUsername = data.username || "Jugador";

    // Seleccionar qué personaje
    currentSkin = data.selectedCharacter;

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
    // Revisamos cada 30 frames (aprox 0.5 seg) si ha cambiado el personaje
    if (p.frameCount % 30 === 0) {
        const data = GameStorage.getData();
        // actualizamos currentSkin
        if (charImages[data.selectedCharacter]) {
            currentSkin = data.selectedCharacter;
        }
    }

    p.background(0);

    // Lógica de juego
    if (isGameOver) {
      // PANTALLA DE GAME OVER
      p.fill(255, 0, 0);
      p.textSize(40);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("GAME OVER", p.width / 2, p.height / 2 - 60);
      
      // Resumen de la partida
      p.fill(255);
      p.textSize(24);
      p.text(`Monedas: ${sessionCoins}`, p.width / 2, p.height / 2);
      
      // Cálculo visual de lingotes
      const lingotesEarned = Math.floor(sessionCoins / 30);
      p.fill(255, 215, 0); // Dorado
      p.text(`Lingotes ganados: +${lingotesEarned}`, p.width / 2, p.height / 2 + 40);
      
      p.fill(200);
      p.textSize(16);
      p.text("(30 monedas = 1 lingote)", p.width / 2, p.height / 2 + 70);

      p.fill(255);
      p.textSize(20);
      p.text("Toca para reiniciar", p.width / 2, p.height / 2 + 120);
      
      // Detenemos la creación y movimiento de partículas
      // dibujamos las partículas estáticas
      for (let particle of particles) {
        particle.draw(); 
      }

    } else {
      // Sigue el juego
      spawnParticles();
      updateAndDrawParticles();

      //Sistema de puntuación:
      p.fill(255);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(24);
      p.text(`${currentUsername}: 💰 ${sessionCoins}`, 20, 50);
    }

    // Dibuja suelo y jugador
    p.fill(250);
    p.rect(0, p.height - floorHeight, p.width, floorHeight);
    drawPlayer(); 
  };

  p.mousePressed = () => {
    if (isGameOver) {
      // Resetear el juego
      particles = [];
      player.x = p.width / 2;
      vx = 0;
      spawnEvery = 50;
      sessionCoins = 0; //resetear monedas de la sesión

      // Actualizar nombre de usuario actual
      const data = GameStorage.getData();
      currentUsername = data.username;

      // ACTUALIZAR PERSONAJE
      currentSkin = charImages[data.selectedCharacter];

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
    const radius = p.random(15, 25);
    const vel = p.random(0.07, 0.2);

    // Por probabilidad, decidir si es partícula dañina o moneda
    const type = (p.random() < 0.2) ? 'coin' : 'damage'; // 20% monedas, 80% daño

    particles.push( new Particle(p, x, y, radius, vel, type) );

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
        //CASO 1: moneda
        if(particle.type === 'coin') {
          // Es una moneda: sumar monedas
          sessionCoins++;
          particles.splice(i, 1); // eliminar partícula
          //TODO: sonido moneda
          continue;
        }
        //CASO 2: partícula dañina
        if (particle.type === 'damage') {
            isGameOver = true;
            // (División entera: 29 monedas = 0 lingotes)
            // const lingotesEarned = Math.floor(sessionCoins / 30);
            const lingotesEarned = sessionCoins; // Cambiado para testeo;
            
            if (lingotesEarned > 0) {
                // Guardar total de lingotes
                GameStorage.addLingotes(lingotesEarned);
                // Ranking 
                GameStorage.saveRankingEntry(currentUsername, lingotesEarned);
            }
        }
      }

      // Si la partícula está fuera de la pantalla, eliminarla
      if(particle.isOffScreen(p.height - floorHeight)) {
        particles.splice(i, 1);
      }
    }
  }

  function drawPlayer() {
    const playerRadius = player.size / 2;

    // Calcular aceleración según inclinación
    const gravity = p.constrain(degrees.gamma, -45, 45); //limitar valores extremos
    const acceleration = p.map(gravity, -45, 45, -0.4, 0.4); //aceleración según inclinación

    // Actualizar velocidad y posición
    vx += acceleration; // actualizar velocidad
    vx *= 0.95; // fricción
    player.x += vx; // actualizar posición

    // Limitar posición dentro de la pantalla
    if (player.x < playerRadius) {player.x = playerRadius; vx = 0;}
    if (player.x > p.width - playerRadius) {player.x = p.width - playerRadius; vx = 0;}

    // Posición vertical fija
    player.y = p.height - playerRadius - floorHeight;
    
    let testSkin = charImages[currentSkin];
    // Dibujar jugador
    if (testSkin && testSkin.width > 0) {
        p.image(testSkin, player.x, player.y, player.size, player.size);
    } else {
        // por si falla la imagen (círculo gris)
        p.fill(100);
        p.circle(player.x, player.y, player.size);
    }
    // p.fill(100);
    // p.circle(player.x, player.y, player.size);
  }
});
