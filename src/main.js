import "./style.css";
import "./sketch.js"; 
import { GameStorage } from "./storage.js";

const gameView = document.getElementById("gameView");
const settingsView = document.getElementById("settingsView");
const btnSettings = document.getElementById("btnSettings");
const btnCloseX = document.getElementById("btnCloseX");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const usernameInput = document.getElementById("usernameInput");
const lingotesDisplay = document.getElementById("lingotesDisplay");
const characterList = document.getElementById("characterList");
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

  
  // Personajes
  characterList.innerHTML = ""; // Limpiar lista
  
  data.characters.forEach((char) => {
    const isUnlocked = data.unlockedCharacters.includes(char.id);
    const isSelected = data.selectedCharacter === char.id;

    // Crear el contenedor de la tarjeta
    const charDiv = document.createElement("div");
    charDiv.classList.add("character-item");
    
    // Aplicar clases de estado
    if (isSelected) charDiv.classList.add("selected");
    if (!isUnlocked) charDiv.classList.add("locked");

    // HTML interno: Imagen, Nombre
    let htmlContent = `
      <img src="${char.img}" alt="${char.name}">
      <span>${char.name}</span>
    `;

    // Si está bloqueado, mostrar precio.
    if (!isUnlocked) {
      htmlContent += `<div class="price-tag">${char.cost} 🧱</div>`;
    }

    charDiv.innerHTML = htmlContent;

    // EVENTO DE CLICK (Seleccionar o Comprar)
    charDiv.addEventListener("click", () => {
      if (isUnlocked) {
        // --- SELECCIONAR ---
        data.selectedCharacter = char.id;
        GameStorage.saveData(data);
        showSettings(); // Refrescar border
      } else {
        // --- COMPRAR ---
        // Confirmación simple
        if (confirm(`¿Desbloquear a ${char.name} por ${char.cost} lingotes?`)) {
          if (data.lingotes >= char.cost) {
            data.lingotes -= char.cost;
            data.unlockedCharacters.push(char.id);
            data.selectedCharacter = char.id; // Lo seleccionamos automáticamente al comprar
            GameStorage.saveData(data);
            alert(`¡${char.name} desbloqueado!`);
            showSettings();
          } else {
            alert("No tienes suficientes lingotes 🧱");
          }
        }
      }
    });

    characterList.appendChild(charDiv);
  });

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
btnCloseX.addEventListener("click", showGame);

// Iniciamos por defecto: juego
showGame();
