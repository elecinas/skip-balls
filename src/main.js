import "./style.css";
import "./sketch.js"; 
import { GameStorage } from "./storage.js";

const gameView = document.getElementById("gameView");
const settingsView = document.getElementById("settingsView");
const btnSettings = document.getElementById("btnSettings");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const usernameInput = document.getElementById("usernameInput");
const totalPointsDisplay = document.getElementById("totalPointsDisplay");


function showGame() {
  settingsView.classList.add("hidden");
  gameView.classList.remove("hidden");
}

function showSettings() {
  //Al abrir los ajustes, cargar datos del jugador
  const data = GameStorage.getData();
  usernameInput.value = data.username;
  totalPointsDisplay.textContent = data.totalCoins;;

  gameView.classList.add("hidden");
  settingsView.classList.remove("hidden");
}

//Guardar nombre al cambiarlo el usuario
usernameInput.addEventListener("input", (e) => {
  GameStorage.updateName(e.target.value);
});

btnSettings.addEventListener("click", showSettings);
btnCloseSettings.addEventListener("click", showGame);

// Iniciamos por defecto: juego
showGame();
