// src/storage.js

const defaultData = {
  username: "Jugador 1",
  totalCoins: 0, // CAMBIO: Antes era points
  unlockedCharacters: [0], 
  selectedCharacter: 0
};

const KEY = 'skip_balls_data_v2'; // Cambiamos la key para resetear datos antiguos

export const GameStorage = {
  getData() {
    const str = localStorage.getItem(KEY);
    if (!str) return { ...defaultData };
    return JSON.parse(str);
  },

  saveData(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },

  // Función para sumar monedas
  addCoins(amount) {
    const data = this.getData();
    data.totalCoins += amount;
    this.saveData(data);
    return data.totalCoins;
  },

  updateName(newName) {
    const data = this.getData();
    data.username = newName;
    this.saveData(data);
  }
};