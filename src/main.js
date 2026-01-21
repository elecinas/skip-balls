import "./style.css";
import { sketch, setGameState, setMusicEnabled, setSfxEnabled, setSettingsOpen } from "./sketch.js";
import { GameStorage } from "./storage.js";
import { motionRequestPermission } from "./motion.js";

const gameView = document.getElementById("gameView");
const settingsView = document.getElementById("settingsView");
const btnSettings = document.getElementById("btnSettings");
const btnCloseX = document.getElementById("btnCloseX");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const usernameInput = document.getElementById("usernameInput");
const lingotesDisplay = document.getElementById("lingotesDisplay");
const characterList = document.getElementById("characterList");
const rankingList = document.getElementById("rankingList");

//Configuración de chistes
const checkJokes = document.getElementById("checkJokes");
const selectJokeType = document.getElementById("selectJokeType");

//Configuración de audio
const checkMusic = document.getElementById("checkMusic");
const checkSfx = document.getElementById("checkSfx");

// Pantalla de inicio
const startView = document.getElementById("startView");
const btnStartGame = document.getElementById("btnStartGame");

// --- INICIO DEL JUEGO ---
if(btnStartGame) {
  btnStartGame.addEventListener("click", async () => {
    //Permisos de movimiento
    await motionRequestPermission();
    startView.classList.add("hidden");
    setGameState("PLAYING");
  });
}

function showGame() {
  // Avisar al juego que volvemos al juego
  setSettingsOpen(false);
  settingsView.classList.add("hidden");
  gameView.classList.remove("hidden");
}

async function showSettings() {
  // Avisar al juego que estamos en Settings
  setSettingsOpen(true);

  //Al abrir los ajustes, cargar datos del jugador
  const data = await GameStorage.getData();

  // Datos del jugador
  usernameInput.value = data.username;
  lingotesDisplay.innerText = data.lingotes;

  // Carga estado de chistes
  checkJokes.checked = data.jokesEnabled;
  selectJokeType.value = data.jokeCategory;
  selectJokeType.disabled = !data.jokesEnabled; // Habilitar/Deshabilitar selector según checkbox

  // Carga estado de audio
  checkMusic.checked = data.musicEnabled;
  checkSfx.checked = data.sfxEnabled;

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
    charDiv.addEventListener("click", async () => {
      // <--- async en el callback
      if (isUnlocked) {
        // -- SELECCIONAR --
        data.selectedCharacter = char.id;
        await GameStorage.saveData(data); // <--- await
        showSettings();
      } else {
        if (confirm(`¿Desbloquear a ${char.name} por ${char.cost} lingotes?`)) {
          // -- COMPRAR --
          const freshData = await GameStorage.getData();

          if (freshData.lingotes >= char.cost) {
            freshData.lingotes -= char.cost;
            freshData.unlockedCharacters.push(char.id);
            freshData.selectedCharacter = char.id;

            await GameStorage.saveData(freshData); // <--- await
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

// Activar/desactivar chistes
checkJokes.addEventListener("change", (e) => {
  const isEnabled = e.target.checked;
  selectJokeType.disabled = !isEnabled; // Habilitar/Deshabilitar selector
  GameStorage.updateJokeSettings(isEnabled, selectJokeType.value);
});

// Cambiar tipo de chiste
selectJokeType.addEventListener("change", (e) => {
  GameStorage.updateJokeSettings(checkJokes.checked, e.target.value);
})

// Cambiar configuración de música
checkMusic.addEventListener("change", (e) => {
  const isEnabled = e.target.checked;
  setMusicEnabled(isEnabled); // Actualizar en el juego
  GameStorage.updateMusicSettings(isEnabled); // Guardar
});

// Cambiar configuración de efectos de sonido
checkSfx.addEventListener("change", (e) => {
  const isEnabled = e.target.checked;
  setSfxEnabled(isEnabled); // Actualizar en el juego
  GameStorage.updateSfxSettings(isEnabled); // Guardar
});

// Iniciamos por defecto: juego
showGame();
