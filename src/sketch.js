export const sketch = new p5((p) => {
  p.setup = () => {
    const cnv = p.createCanvas(360, 640);
    cnv.parent("p5-container");
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
  };

  p.draw = () => {
    p.background(20);
    p.fill(255);
    p.text("Hola p5 + Vite", p.width / 2, p.height / 2);
  };
});
