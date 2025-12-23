import "./style.css";
import "./sketch.js"; 
import { GameStorage } from "./storage.js";

const gameView = document.getElementById("gameView");
const settingsView = document.getElementById("settingsView");
const btnSettings = document.getElementById("btnSettings");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const usernameInput = document.getElementById("usernameInput");
const lingotesDisplay = document.getElementById("lingotesDisplay");
const rankingList = document.getElementById("rankingList");


function showGame() {
  settingsView.classList.add("hidden");
  gameView.classList.remove("hidden");
}

function showSettings() {
  //Al abrir los ajustes, cargar datos del jugador
  const data = GameStorage.getData();

  // Datos del jugador
  usernameInput.value = data.username;
  lingotesDisplay.innerText = data.lingotes;

  // Ranking
  rankingList.innerHTML = ""; // Limpiar lista anterior

  if (data.highScores.length === 0) {
    rankingList.innerHTML = "<li>Aún no hay partidas</li>";
  } else {
    data.highScores.forEach((entry, index) => {
      const li = document.createElement("li");
      // Formato: "1. Pepe - 45 lingotes"
      li.innerHTML = `
        <span><b>#${index + 1}</b> ${entry.name}</span>
        <span>${entry.lingotes} lingotes</span>
      `;
      rankingList.appendChild(li);
    });
  }

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
