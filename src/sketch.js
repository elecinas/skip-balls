import { GameStorage, CHARACTERS_DATA } from "./storage";
import { motionRequestPermission, motionStartOrientation } from "./motion";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { Particle } from "./particle";
import { fetchNewJoke } from "./jokes";

//-- VARIABLE GLOBAL DE ESTADO DEL JUEGO --
//Fuera de p5 para exportar una función para cambiarlas desde main.js
let gameState = "START"; // START, PLAYING, GAMEOVER

// Función para cambiar estado del juego desde main.js
export function setGameState(newState) {
  gameState = newState;
}

export const sketch = new p5((p) => {
  let sessionCoins = 0; // Monedas ganadas en la sesión actual
  let currentUsername = "Jugador";

  //Variable para la frase del robot
  let robotPrase = "Recoge monedas y te cuento un chiste.";

  // Variables para orientación
  // alpha: rotación alrededor del eje Z (0..360)
  // beta: inclinación adelante/atrás (-180..180)
  // gamma: inclinación izquierda/derecha (-90..90)
  let degrees = { alpha: 0, beta: 0, gamma: 0 };
  let player = { x: 0, y: 0, size: 70 };
  let vx = 0;
  let floorHeight = 150;

  // Partículas del cielo
  let particles = [];

  //Configuración de la dificultad
  let maxParticles = 40;
  let spawnEvery = 50; // Una bomba cada 50 frames

  // --- IMÁGENES ---
  let charImages = {}; // Objeto para imágenes cargadas: { 0: img1, 1: img2 }
  let currentSkin = null; // La imagen actual

  // --- COLORES DE DISEÑO (Cyberpunk CMY Palette) ---
  const COLORS = {
    bg: "#0b0c10", // Fondo oscuro (Black)
    floor: "#1f2833", // Suelo metálico (Deep Blue)
    neon: "#66fcf1", // Cian brillante (Cyan)
    text: "#c5c6c7", // Gris claro
    danger: "#ff2a6d", // ROJO
    gold: "#f5d300", // AMARILLO
  };

  // PRECARGA DE IMÁGENES
  p.preload = () => {
    // Recorrer datos de personajes y cargar imágenes
    CHARACTERS_DATA.forEach((char) => {
      charImages[char.id] = p.loadImage(char.img);
      console.log("Pre-cargando imagen:", char.id, char.img);
    });
  };

  p.setup = async () => {
    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent("p5-container");

    // Dibujar imágenes desde el CENTRO
    p.imageMode(p.CENTER);

    //Fuente palo seco
    p.textFont("sans-serif");

    // Permiso
    let permission = await motionRequestPermission();
    console.log("Motion permission:", permission);

    // Obtener nombre de usuario actual
    const data = await GameStorage.getData();
    currentUsername = data.username || "Jugador";

    // Si los chistes están deshabilitados
    if (!data.jokesEnabled) {
      robotPrase = "disabled";
    }

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
    // --- DIBUJAR FONDO ---
    p.background(COLORS.bg);

    // ========================================
    // --- LÓGICA DE ESTADO DEL JUEGO ---
    // ========================================

    // --- ESTADO 1: INICIO ---
    if (gameState === "START") {
      player.x = p.width / 2;
      drawPlayer();
    }

    // --- ESTADO 2: GAME OVER ---
    if (gameState === "GAMEOVER") {
      for (let particle of particles) particle.draw();
      drawPlayer();
      drawGameOverScreen();
      return;
    }

    // --- ESTADO 3: JUGANDO ---

    // Capa de partículas
    spawnParticles();
    updateAndDrawParticles();
    
    // Suelo
    drawFloor();

    // Revisamos cada 30 frames (aprox 0.5 seg)
    // skin y chistes
    if (p.frameCount % 30 === 0) {
      // Actualizar skin actual
      GameStorage.getData().then((data) => {
        if (charImages[data.selectedCharacter])
          currentSkin = data.selectedCharacter;
        if (!data.jokesEnabled) robotPrase = "disabled";
      });
    }

    // Jugador
    drawPlayer();

    // --- HUD (PUNTUACIÓN) ---
    p.fill(COLORS.neon);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(24);
    p.textStyle(p.BOLD);
    // Sombra cian
    p.drawingContext.shadowBlur = 10;
    p.drawingContext.shadowColor = COLORS.neon;
    p.text(`${currentUsername}: ${sessionCoins} $`, 20, 50);
    p.drawingContext.shadowBlur = 0; // Reset sombra
  };

  p.mousePressed = async () => {
    if(gameState === "GAMEOVER") {
      resetGame();
    }
  };

  async function resetGame() {
    particles = [];
      player.x = p.width / 2;
      vx = 0;
      spawnEvery = 50;
      sessionCoins = 0; //resetear monedas de la sesión

      //volver a jugar
      gameState = "PLAYING";

      // Actualizar nombre de usuario actual
      const data = await GameStorage.getData();
      if (data.jokesEnabled) {
        robotPrase = "Collect coins to read a joke";
      } else {
        robotPrase = "disabled";
      }
      currentUsername = data.username;

      // ACTUALIZAR PERSONAJE
      currentSkin = charImages[data.selectedCharacter];
  }

  function spawnParticles() {
    //si no es el frame adecuado, salir
    if (p.frameCount % spawnEvery !== 0) return;

    // si ya hay muchas partículas, salir
    if (particles.length >= maxParticles) return;

    // Posición aleatoria en x, arriba de la pantalla
    const x = p.random(20, p.width - 20);
    const y = -30;

    //Variación de tamaño y velocidad
    const radius = p.random(15, 25);
    const vel = p.random(0.07, 0.2);

    // Por probabilidad, decidir si es partícula dañina o moneda
    const type = p.random() < 0.2 ? "coin" : "damage"; // 20% monedas, 80% daño

    particles.push(new Particle(p, x, y, radius, vel, type));

    // Hacer el juego más difícil con el tiempo.
    // Cada 500 frames (aprox 8 segundos), reducimos el tiempo de aparición
    if (p.frameCount % 500 === 0 && spawnEvery > 15) {
      spawnEvery -= 2; // Hace que salgan más rápido poco a poco
    }
  }

  function updateAndDrawParticles() {
    // Recorrer partículas al revés para poder eliminar
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.update();
      particle.draw();

      //Distancia entre jugador y partícula
      const d = p.dist(player.x, player.y, particle.pos.x, particle.pos.y);

      //Suma de radios (mitad player.size + particle.radius)
      let minDist = player.size / 2 + particle.radius;

      // Si hay colisión
      if (d < minDist) {
        //CASO 1: moneda
        if (particle.type === "coin") {
          // Es una moneda: sumar monedas
          sessionCoins++;
          particles.splice(i, 1); // eliminar partícula
          updateRobotWithJoke(); // Pedir nuevo chiste
          //TODO: sonido moneda
          continue;
        }
        //CASO 2: partícula dañina
        if (particle.type === "damage") {
          handleGameOver();
        }
      }

      // Si la partícula está fuera de la pantalla, eliminarla
      if (particle.isOffScreen(p.height - floorHeight)) {
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
    if (player.x < playerRadius) {
      player.x = playerRadius;
      vx = 0;
    }
    if (player.x > p.width - playerRadius) {
      player.x = p.width - playerRadius;
      vx = 0;
    }

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
  }

  function drawFloor() {
    // Rectángulo del suelo
    p.noStroke();
    p.fill(COLORS.floor);
    p.rect(0, p.height - floorHeight, p.width, floorHeight);

    // Línea de neón superior
    p.stroke(COLORS.neon);
    p.strokeWeight(4);
    p.drawingContext.shadowBlur = 15;
    p.drawingContext.shadowColor = COLORS.neon;
    p.line(0, p.height - floorHeight, p.width, p.height - floorHeight);

    // Resetear efectos
    p.drawingContext.shadowBlur = 0;
    p.noStroke();
  }

  // Función para obtener un nuevo chiste de la API
  async function updateRobotWithJoke() {
    const data = await GameStorage.getData();
    // Si los chistes están deshabilitados, salir
    if (!data.jokesEnabled) {
      robotPrase = "disabled";
      return;
    }
    // obtener chiste de la api
    const jokeText = await fetchNewJoke(data.jokeCategory);
    // Actualizar frase del robot
    robotPrase = jokeText;
  }

  function handleGameOver() {
    gameState = "GAMEOVER";

    //calcular y guardar lingotes
    const lingotesEarned = Math.floor(sessionCoins / 30);
    if (lingotesEarned > 0) {
      GameStorage.addLingotes(lingotesEarned);
      // Ranking
      GameStorage.saveRankingEntry(currentUsername, lingotesEarned);
    }
    //Pedir chiste
    updateRobotWithJoke();
  }

  function drawGameOverScreen() {
    //fondo semitransparente
    p.fill(20, 0, 0, 150);
    p.rectMode(p.CORNER);
    p.rect(0, 0, p.width, p.height);

    // -- TEXTO GAME OVER --
    p.fill(COLORS.danger);
    p.textSize(40);
    p.textStyle(p.BOLD);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("SYSTEM FAILURE", p.width / 2, p.height / 2 - 140);

    // Quitamos brillo para el resto
    p.drawingContext.shadowBlur = 0;

    // Resumen de la partida
    p.fill(COLORS.text);
    p.textSize(24);
    p.textStyle(p.NORMAL);
    p.text(`Monedas: ${sessionCoins}`, p.width / 2, p.height / 2 - 80);

    // Cálculo visual de lingotes
    const lingotesEarned = Math.floor(sessionCoins / 30);
    p.fill(COLORS.gold); // Dorado
    p.text(
      `Lingotes ganados: +${lingotesEarned}`,
      p.width / 2,
      p.height / 2 - 40,
    );

    p.fill(100);
    p.textSize(16);
    p.text("(30 monedas = 1 lingote)", p.width / 2, p.height / 2 - 10);

    // Texto parpadeante
    if (p.frameCount % 60 < 30) {
      p.fill(COLORS.neon);
      p.textSize(20);
      p.text("> TOCA PARA REINICIAR <", p.width / 2, p.height / 2 + 50);
    }

    //-- PINTA EL CHISTE AL FINAL --
    if (robotPrase !== "disabled") {
      //coordenadas para todo
      let boxX = p.width / 2;
      let boxY = p.height / 2 + 170;
      let boxW = p.width - 60;
      let boxH = 110;

      // Fondo del recuadro
      p.rectMode(p.CENTER);
      p.noStroke();
      p.fill(30, 35, 40, 200); // Fondo semitransparente
      p.rect(boxX, boxY, boxW, boxH, 15);

      // Texto del chiste
      p.fill(COLORS.text);
      p.textSize(16);
      p.textStyle(p.ITALIC);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(robotPrase, boxX, boxY, boxW - 20, boxH - 10);

      p.rectMode(p.CORNER);
    }
  }
});
