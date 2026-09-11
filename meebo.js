// meebo.js - Browser Learning Chatbot
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let brain = {};

// Load existing memory from the repository file
async function loadBrain() {
try {
const response = await fetch('brain.json');
if (response.ok) {
brain = await response.json();
appendMessage("System", `Meebo loaded ${Object.keys(brain).length} word connections from permanent repo memory.`, "system-msg");
}
} catch (e) {
appendMessage("System", "Starting with a fresh blank brain template.", "system-msg");
}
}

function appendMessage(sender, text, className) {
const msgDiv = document.createElement('div');
msgDiv.className = `msg ${className}`;
msgDiv.innerText = text;
chatBox.appendChild(msgDiv);
chatBox.scrollTop = chatBox.scrollHeight;
}

function learnFromSentence(text) {
if (text.toLowerCase().trim() === "meebo wipe memory") return;

const words = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim().split(/\s+/);
if (words.length < 2) return;

for (let i = 0; i < words.length - 1; i++) {
const currentWord = words[i];
const nextWord = words[i + 1];
if (!brain[currentWord]) brain[currentWord] = [];
if (!brain[currentWord].includes(nextWord)) {
brain[currentWord].push(nextWord);
}
}
// Temp save to browser session while tab is open
localStorage.setItem('meebo_web_brain', JSON.stringify(brain));
}

function generateReply(starterText) {
const words = starterText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim().split(/\s+/);
let currentWord = words[Math.floor(Math.random() * words.length)];

if (!brain[currentWord]) {
const keys = Object.keys(brain);
if (keys.length === 0) return "I am still learning...";
currentWord = keys[Math.floor(Math.random() * keys.length)];
}

let sentence = [currentWord];
for (let i = 0; i < 10; i++) {
const possibilities = brain[currentWord];
if (!possibilities || possibilities.length === 0) break;
const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)];
sentence.push(nextWord);
currentWord = nextWord;
}
return sentence.join(" ");
}

async function handleWipe() {
brain = {};
localStorage.removeItem('meebo_web_brain');
appendMessage("System", "🚨 EMERGENCY WIPE: Memory reset locally. Commit files to sync to repo.", "system-msg");
}

function handleSend() {
const text = userInput.value.trim();
if (!text) return;

appendMessage("You", text, "user-msg");
userInput.value = "";

if (text.toLowerCase() === "meebo wipe memory") {
handleWipe();
return;
}

learnFromSentence(text);

setTimeout(() => {
const reply = generateReply(text);
appendMessage("Meebo", reply, "meebo-msg");
}, 500);
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

loadBrain();

