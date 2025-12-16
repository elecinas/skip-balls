import { motionRequestPermission, motionStartOrientation } from "./motion";

export const sketch = new p5((p) => {
  let degrees = { alpha: 0, beta: 0, gamma: 0 };

  p.setup = async () => {
    const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent("p5-container");

    // Permiso (sobre todo iOS)
    const perm = await motionRequestPermission();
    console.log("Motion permission:", perm);

    // Iniciar suscripción a orientación
   await motionStartOrientation((o) => {
      degrees = o;
      // console.log("Orientation:", degrees);
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
    p.fill(255);
    p.textSize(24);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Juego (pantalla completa)", p.width / 2, p.height / 2);
    p.text(`alpha: ${degrees.alpha.toFixed(1)}`, p.width / 2, p.height / 2 + 40);
    p.text(`beta:  ${degrees.beta.toFixed(1)}`,  p.width / 2, p.height / 2 + 70);
    p.text(`gamma: ${degrees.gamma.toFixed(1)}`, p.width / 2, p.height / 2 + 100);

  };
});
