// src/storage.js

const defaultData = {
  username: "Jugador",
  lingotes: 0,
  highScores: [],
  characters: [
    { id: 0, name: "Philip", cost: 0, img: "/robots/philip.png" },
    { id: 1, name: "Anthony", cost: 10, img: "/robots/anthony.png" },
    { id: 2, name: "Roy", cost: 20, img: "/robots/roy.png" }
  ],
  unlockedCharacters: [0], 
  selectedCharacter: 0
};

const KEY = 'skip_balls'; // Clave en localStorage

export const GameStorage = {
  // Obtener datos del jugador
  getData() {
    const str = localStorage.getItem(KEY);
    if (!str) return { ...defaultData };
    return JSON.parse(str);
  },

  // Guardar datos del jugador
  saveData(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },

  // Actualizar nombre de usuario
  updateName(newName) {
    const data = this.getData();
    data.username = newName;
    this.saveData(data);
  },

  // Añadir lingotes
  addLingotes(amount) {
    const data = this.getData();
    data.lingotes += amount;
    this.saveData(data);
    return data.lingotes;
  },

  //Ranking
  saveRankingEntry(name, lingotesEarned) {
    // Si no ganó lingotes, no guardamos nada
    if (lingotesEarned <= 0) return;
    const data = this.getData();
    // Guardamos: Nombre, lingotes ganados, y Fecha
    data.highScores.push({ 
      name: name, 
      lingotes: lingotesEarned, 
      date: new Date().toLocaleDateString() 
    });
    // Ordenar por LINGOTES (de mayor a menor)
    data.highScores.sort((a, b) => b.lingotes - a.lingotes);
    // 10 mejores
    if(data.highScores.length > 10) {
      data.highScores = data.highScores.slice(0, 10);
    }
    
    this.saveData(data);
  }
};