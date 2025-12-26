import { Preferences } from '@capacitor/preferences';

// datos de personajes
export const CHARACTERS_DATA = [
  { id: 0, name: "Philip", cost: 0, img: "/robots/philip.png" },
  { id: 1, name: "Anthony", cost: 10, img: "/robots/anthony.png" },
  { id: 2, name: "Roy", cost: 20, img: "/robots/roy.png" }
];

const defaultData = {
  username: "Jugador",
  lingotes: 0,
  highScores: [],
  characters: CHARACTERS_DATA,
  unlockedCharacters: [0], 
  selectedCharacter: 0
};

const KEY = 'skip_balls_v2'; // Clave en localStorage

// Devuelve una Promesa
export const GameStorage = {
  // Obtener datos del jugador
  async getData() {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return { ...defaultData };
    return JSON.parse(value);
  },

  // Guardar datos del jugador
  async saveData(data) {
    await Preferences.set({
      key: KEY,
      value: JSON.stringify(data),
    });
  },

  // Actualizar nombre de usuario
  async updateName(newName) {
    const data = await this.getData();
    data.username = newName;
    await this.saveData(data);
  },

  // Añadir lingotes
  async addLingotes(amount) {
    const data = await this.getData();
    data.lingotes += amount;
    await this.saveData(data);
    return data.lingotes;
  },

  //Ranking
  async saveRankingEntry(name, lingotesEarned) {
    // Si no ganó lingotes, no guardamos nada
    if (lingotesEarned <= 0) return;
    const data = await this.getData();
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
    
    await this.saveData(data);
  }
};