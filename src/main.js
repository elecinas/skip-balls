import "./style.css";
import "./sketch.js"; 

const gameView = document.getElementById("gameView");
const settingsView = document.getElementById("settingsView");
const btnSettings = document.getElementById("btnSettings");
const btnCloseSettings = document.getElementById("btnCloseSettings");

function showGame() {
  settingsView.classList.add("hidden");
  gameView.classList.remove("hidden");
}

function showSettings() {
  gameView.classList.add("hidden");
  settingsView.classList.remove("hidden");
}

btnSettings.addEventListener("click", showSettings);
btnCloseSettings.addEventListener("click", showGame);

// Por defecto: juego
showGame();
