//-- CHISTES OFFLINE -- (privado a este archivo) ---
  const BACKUP_JOKES = [
    "Why do programmers prefer dark mode?\nBecause light attracts bugs.",
    "I'm not lazy, I'm just in energy saving mode.",
    "There are 10 types of people: those who understand binary, and those who don't.",
    "My code doesn't work, I have no idea why.\nMy code works, I have no idea why.",
    "Simulation status: 99% complete.",
    "Searching for intelligence... 404 Not Found.",
  ];

  // Función para obtener un chiste aleatorio de respaldo
  function getRandomBackup() {
    const index = Math.floor(Math.random() * BACKUP_JOKES.length);
    return BACKUP_JOKES[index];
  }

  export async function fetchNewJoke(category = "Any") {
    //url de la API
    const url = `https://v2.jokeapi.dev/joke/${category}?blacklistFlags=nsfw,religious,political,racist,sexist`;
    
    try {
        const response = await fetch(url);
        const apiData = await response.json();

        //Si la API devuelve error interno
        if(apiData.error) {
            return getRandomBackup();
        }

        //Procesar chiste
        if(apiData.type === "single") {
            return apiData.joke;
        } else if (apiData.type == "twopart") {
            return `${apiData.setup}\n\n${apiData.delivery}`;
        } else {
            return getRandomBackup();
        }
    } catch (error) {
        //En caso de error (red, etc), devolver chiste de respaldo
        return getRandomBackup();
    }
}
