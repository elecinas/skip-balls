import { GameStorage, CHARACTERS_DATA } from "./storage";
import { motionRequestPermission, motionStartOrientation } from "./motion";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { Particle } from "./particle";
import { Projectile } from "./projectile";
import { fetchNewJoke } from "./jokes";
import { hapticsImpactLight, hapticsImpactHeavy } from "./haptics";
import { App } from "@capacitor/app";

//-- VARIABLE GLOBAL DE ESTADO DEL JUEGO --
//Fuera de p5 para exportar una función para cambiarlas desde fuera
let gameState = "START"; // START, PLAYING, GAMEOVER
let isMusicOn = true;
let isSfxOn = true;
let isSettingOpen = false;

// Funciones para controlar el juego desde fuera
export function setGameState(newState) {
  gameState = newState;
}
export function setMusicEnabled(enabled) {
  isMusicOn = enabled;
}
export function setSfxEnabled(enabled) {
  isSfxOn = enabled;
}
export function setSettingsOpen(isOpen) {
  isSettingOpen = isOpen;
  if(isOpen) {
    // Pausar juego si se abren ajustes
    sketch.noLoop(); // Detener draw loop
    if(sketch.sndMusic && sketch.sndMusic.isPlaying()) sketch.sndMusic.pause();
  } else {
    //Reaudar juego al cerrar ajustes
    sketch.loop(); // Reanuda el draw loop
    // Solo reanudar música si está activada
    if(isMusicOn && gameState === "PLAYING" && sketch.sndMusic) sketch.sndMusic.loop();
  }
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
  let bullets = [];// array de proyectiles
  let ammo = 10; // munición inicial
  let fireBtn = { x: 0, y: 0, r: 35 }; // botón de disparo

  // Partículas del cielo
  let particles = [];

  //Configuración de la dificultad
  let maxParticles = 40;
  let spawnEvery = 50; // Una bomba cada 50 frames

  // --- IMÁGENES ---
  let charImages = {}; // Objeto para imágenes cargadas: { 0: img1, 1: img2 }

  // --- CONFIGURACIÓN DE ROBOTS NPCs ---
  let npcImages = {}; // Imágenes de NPCs
  let currentNpcSkin = null; // NPC actual

  //Diccionario: Nombre de categoria -> nombre de archivo
  const NPC_CONFIG = {
    Programming: "programming.png",
    Spooky: "spooky.png",
    Christmas: "christmas.png",
    Pun: "pun.png",
    Dark: "dark.png",
    Misc: "misc.png",
    Any: "any.png",
  };

  // --- SONIDOS ---
  let sndCoin, sndBoom, sndMusic, sndLaser, sndReload;

  // Skin actual
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

    // -- CARGAR IMÁGENES NPCs --
    for (const [category, fileName] of Object.entries(NPC_CONFIG)) {
      npcImages[category] = p.loadImage(`/robots/npcs/${fileName}`);
    }

    // -- CARGAR SONIDOS --
    p.soundFormats("mp3", "wav");
    sndCoin = p.loadSound("/sounds/coin.mp3");
    sndBoom = p.loadSound("/sounds/boom.mp3");
    sndMusic = p.loadSound("/sounds/music.mp3");
    sndLaser = p.loadSound("/sounds/laser.mp3");
    sndReload = p.loadSound("/sounds/reload.mp3");
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

    // Cargar preferencias de audio
    isMusicOn = data.musicEnabled;
    isSfxOn = data.sfxEnabled;

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

    // DETECTOR DE SALIDA DE LA APP
    App.addListener("appStateChange", async ({ isActive }) => {
      if (!isActive) {
        // La app está en segundo plano
        p.noLoop(); // Detener draw loop
        //Suspender el contexto del audio
        if (p.getAudioContext().state === "running") {
          p.getAudioContext().suspend();
        }
        // Pausar música si corresponde
        if (sndMusic && sndMusic.isPlaying()) sndMusic.pause();
      } else {
        // Volver a encender el motor de audio
        if (p.getAudioContext().state !== "running") {
          await p.getAudioContext().resume();
        }
        // Solo reanudamos si NO estamos en la pantalla de Settings
        if (!isSettingOpen) {
           p.loop(); // VUELVE A ARRANCAR EL DRAW

           // Reanudar música si corresponde
           if (isMusicOn && sndMusic && gameState === "PLAYING") {
             sndMusic.loop();
           }
        } else {
           // Si estamos en Settings, mantenemos pausado
           p.noLoop();
           //Reactivamos la música también en ajustes
           if(isMusicOn && sndMusic && !sndMusic.isPlaying()) {
             sndMusic.loop();
           }
        }
      }
    });
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    // --- CONTROL DE AUDIO ---
    // Si la música suena pero el interruptor está en OFF, pararla
    if (sndMusic && sndMusic.isPlaying() && !isMusicOn) {
      sndMusic.stop();
    }
    // Si la música no suena y el interruptor está en ON, reproducirla
    if (
      sndMusic &&
      !sndMusic.isPlaying() &&
      isMusicOn &&
      gameState === "PLAYING"
    ) {
      sndMusic.setVolume(0.5);
      sndMusic.loop();
    }

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

    // Botón de disparo
    drawFireButton();

    // Revisamos cada 30 frames (aprox 0.5 seg)
    // skin y chistes
    if (p.frameCount % 30 === 0) {
      if (sndMusic) {
        if (!isMusicOn && sndMusic.isPlaying()) {
          sndMusic.pause();
        }
        if (isMusicOn && !sndMusic.isPlaying() && gameState === "PLAYING") {
          sndMusic.setVolume(0.5);
          sndMusic.loop();
        }
      }
      // Actualizar skin actual
      GameStorage.getData().then((data) => {
        //Skin
        if (charImages[data.selectedCharacter])
          currentSkin = data.selectedCharacter;
        //Chistes
        if (!data.jokesEnabled) robotPrase = "disabled";
        // Preferencias audio
        isMusicOn = data.musicEnabled;
        isSfxOn = data.sfxEnabled;
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
    // Desbloquear audio en móviles
    p.userStartAudio();
    
    if (gameState === "PLAYING") {
      //Calculardistancia del toque al botón
      let d = p.dist(p.mouseX, p.mouseY, fireBtn.x, fireBtn.y);
      
      //Si tocamos DENTRO del botón Y tenemos balas
      if (d < fireBtn.r && ammo > 0) {
          bullets.push(new Projectile(p, player.x, player.y - 40));
          ammo--; 
          
          // Vibración
          hapticsImpactLight();
          
          // Sonido
          if(isSfxOn && sndLaser) {
            sndLaser.setVolume(0.7);// volumen un poco más bajo
            sndLaser.play();
          }
      }
      
    } else if (gameState === "GAMEOVER") {
      resetGame();
    }
  };

  async function resetGame() {
    particles = [];
    bullets = [];
    ammo = 10;
    player.x = p.width / 2;
    vx = 0;
    spawnEvery = 50;
    sessionCoins = 0; //resetear monedas de la sesión

    // Si la música no está sonando, reproducirla
    if (isMusicOn && sndMusic && !sndMusic.isPlaying()) {
      sndMusic.setVolume(0.5);
      sndMusic.loop();
    }

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
    let type = "damage"; // por defecto
    const r = p.random();

    //75% de damage, 25% moneda, 5% arma especial
    if(r < 0.05) {
      type = "weapon";// arma especial (rara)
    } else if (r < 0.25) {
      type = "coin";  // 25% de probabilidad de ser moneda
    }


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
          hapticsImpactLight(); // Vibración ligera

          // Sonido de moneda
          if (isSfxOn && sndCoin) sndCoin.play();

          continue;
        } 
        //CASO 2: arma especial
        else if (particle.type === "weapon") {
          ammo += 5; // sumar 5 balas
          particles.splice(i, 1); // eliminar partícula
          hapticsImpactLight(); // Vibración ligera

          //TODO: sonido de recarga
          if (isSfxOn && sndReload) sndReload .play();
          continue;
        }
        //CASO 3: partícula dañina
        else if (particle.type === "damage") {
          updateRobotWithJoke(); // Pedir nuevo chiste
          handleGameOver();
        }
      }

      // Si la partícula está fuera de la pantalla, eliminarla
      if (particle.isOffScreen(p.height - floorHeight)) {
        particles.splice(i, 1);
      }
    }

    // --- GESTIÓN DE BALAS ---
    for (let i = bullets.length -1; i >=0; i--) {
        const bullet = bullets[i];
        bullet.update();
        bullet.draw();

        // Comprobar colisión con partículas
        for (let j = particles.length -1; j >=0; j--) {
            const particle = particles[j];
            if (particle.type === "damage") {
              let d = p.dist(bullet.x, bullet.y, particle.pos.x, particle.pos.y);
              if (d < particle.radius + 5) { // 5 es la mitad del ancho del láser
                  // Colisión: eliminar ambos
                  particles.splice(j, 1);
                  bullets.toDelete = true;
                  //Efecto visual
                  p.fill(255);
                  p.noStroke();
                  p.circle(particle.pos.x, particle.pos.y, 30);
                  break;
              }
            }
        }

        // Eliminar balas marcadas para borrar
        if (bullet.toDelete) {
            bullets.splice(i, 1);
        }
    }
  }

  function drawFireButton() {
    //Calcular posición (dentro del suelo)
    fireBtn.x = p.width / 2;
    fireBtn.y = p.height - floorHeight / 2;

    p.noStroke();

    //Color según munición
    if (ammo > 0) {
      //Botón activo (rojo neón)
      p.drawingContext.shadowBlur = 15;
      p.drawingContext.shadowColor = COLORS.danger;
      p.fill(COLORS.danger);
    } else {
      //Botón inactivo (gris oscuro)
      p.drawingContext.shadowBlur = 0;
      p.fill(50);
    }

    // Dibujar círculo
    p.circle(fireBtn.x, fireBtn.y, fireBtn.r * 2);

    //Icono o Texto dentro
    p.drawingContext.shadowBlur = 0;
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);

    if (ammo > 0) {
      p.text("🔫", fireBtn.x, fireBtn.y + 2);
      //Pequeño número de balas
      p.textSize(9);
      p.fill(255);
      p.text(ammo, fireBtn.x + 20, fireBtn.y -20);
    } else {
      p.text("Vacío", fireBtn.x, fireBtn.y);
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
    hapticsImpactHeavy(); // Vibración fuerte

    // Sonido de explosión
    if (isSfxOn && sndBoom) sndBoom.play();

    // Parar música
    if (sndMusic && sndMusic.isPlaying()) {
      sndMusic.stop();
    }

    // Cambiar estado a GAME OVER
    gameState = "GAMEOVER";

    //calcular y guardar lingotes
    const lingotesEarned = Math.floor(sessionCoins / 30);
    if (lingotesEarned > 0) {
      GameStorage.addLingotes(lingotesEarned);
      // Ranking
      GameStorage.saveRankingEntry(currentUsername, lingotesEarned);
    }

    // Elegir robot NPC según categoría de chiste
    GameStorage.getData().then((data) => {
      const cat = data.jokeCategory || "Any";
      if (npcImages[cat]) {
        currentNpcSkin = npcImages[cat];
      } else {
        currentNpcSkin = npcImages["Any"];
      }
    });

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

    //-- PINTA EL CHISTE Y EL NPC --
    if (robotPrase !== "disabled") {
      //coordenadas para todo
      let boxX = p.width / 2;
      let boxY = p.height / 2 + 160;
      let boxW = p.width - 60;
      let boxH = 180;

      // Fondo del recuadro
      p.rectMode(p.CENTER);
      p.noStroke();
      p.fill(100, 105, 110, 230); // Fondo semitransparente
      p.rect(boxX, boxY, boxW, boxH, 15);

      // Dibuja el NPC
      if (currentNpcSkin) {
        let npcSize = 100;

        //Linea inferior izquierda del cudro
        let boxLeft = boxX - boxW / 2;
        let boxBottom = boxY + boxH / 2;

        //Posición del NPC
        let npcX = p.width - 100;
        let npcY = boxBottom + 20;

        //dibujar imagen
        p.tint(230, 255); // ligero tintado para integrarlo
        p.image(currentNpcSkin, npcX, npcY, npcSize, npcSize);
        p.noTint();
      }

      // Texto del chiste
      p.rectMode(p.CENTER);
      p.fill(COLORS.text);
      p.textSize(16);
      p.textStyle(p.ITALIC);
      p.textAlign(p.CENTER, p.CENTER);

      //Calcula la esquina superior izquierda del texto
      // Que és la mitad del recuadro
      // menos la mitad del ancho/alto del recuadro
      let textX = boxX;
      let textY = boxY;

      //margen interno de 20px
      p.text(robotPrase, textX, textY, boxW - 40, boxH - 40);

      p.rectMode(p.CORNER);
    }
  }
});
