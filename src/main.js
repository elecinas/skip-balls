import './style.css'
import './sketch.js'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

console.log('App iniciada')

const appDiv = document.querySelector('#app');
const contentDiv = document.createElement('div');
contentDiv.id = 'content';
contentDiv.innerHTML = `
  <a href="https://vite.dev" target="_blank">
    <img src="${viteLogo}" class="logo" alt="Vite logo" />
  </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
    <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
  </a>
  <h1>Hello Vite!</h1>
  <div class="card">
    <button id="counter" type="button"></button>
  </div>
  <p class="read-the-docs">
    Click on the Vite logo to learn more
  </p>
`;
appDiv.appendChild(contentDiv);

setupCounter(document.querySelector('#counter'))
