import { motionRequestPermission, motionStartOrientation } from "./motion";

export const sketch = new p5((p) => {
  // Variables para orientación
  // alpha: rotación alrededor del eje Z (0..360)
  // beta: inclinación adelante/atrás (-180..180)
  // gamma: inclinación izquierda/derecha (-90..90)
  let degrees = { alpha: 0, beta: 0, gamma: 0 };
  let player = { x: 0, y: 0, size: 50 };
  const floorHeight = 100;

  p.setup = async () => {
    const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent("p5-container");

    // Permiso (sobre todo iOS)
    const perm = await motionRequestPermission();
    console.log("Motion permission:", perm);

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
    // Suelo
    p.fill(250);
    p.rect(0, p.height - floorHeight, p.width, floorHeight);
    drawPlayer();

    // p.fill(255);
    // p.textSize(24);
    // p.textAlign(p.CENTER, p.CENTER);
    // p.text("Juego (pantalla completa)", p.width / 2, p.height / 2);
    // p.text(`gamma: ${degrees.gamma.toFixed(1)}`, p.width / 2, p.height / 2 + 100);

  };

  function drawPlayer() {
    const playerRadius = player.size / 2;
    // Limitar posición dentro de la pantalla
    player.x = p.constrain(player.x, playerRadius, p.width - playerRadius);
    p.fill(100);
    player.x += p.map(degrees.gamma, -90, 90, -5, 5);
    player.y = p.height - playerRadius - floorHeight;
    p.circle(player.x, player.y, player.size);
  }
});
